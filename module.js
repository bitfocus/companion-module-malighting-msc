const InstanceSkel        = require('../../instance_skel')
const ConfigFields        = require('./config')
const InstanceActions     = require('./action')
const FeedbackDefinitions = require('./feedback')
const MidiShowControl     = require('mamsc')

exports = module.exports = class Instance
	extends ConfigFields(InstanceActions(FeedbackDefinitions(InstanceSkel))) {

	constructor (...args) {
		super(...args)

		this.execs = {}
		this.in    = null
		this.out   = null

		this.defineConst('REGEX_CUE_NUMBER', '/^[1-9]*[0-9](\.[0-9]{1,3})?$/')
		this.actions()
		this.feedbacks()
	}

	init () {
		this.initSockets()
		this.initVariables()
	}

	destroy () {
		this.closeSockets()
	}

	initSockets () {
		const config = this.config

		this.closeSockets()

		if (config.rxPort && config.rxEnabled) {
			this.initReceiver(config)
		}

		if (config.txPort) {
			this.initTransmitter(config)
		}
	}

	initReceiver (config) {
		this.status(this.STATUS_WARNING, 'Initializing')

		this.in = MidiShowControl.in(config.rxPort, config.rxAddress)
			.on('error', err => {
				if ('ProtocolError' !== err.name) {
					this.closeReceiver()
					this.status(this.STATUS_ERROR)
					this.log('error', err.message)
				} else {
					this.log('warn', err.message)
				}
			})
			.on('ready', () => {
				this.in.ready = true
				this.checkStatus()
			})
			.on('message', this.onMessage.bind(this))

		this.in.config.deviceId = Number(config.rxDeviceId)
		this.in.config.groupId  = Number(config.rxGroupId)
	}

	initTransmitter (config) {
		this.status(this.STATUS_WARNING, 'Initializing')

		this.out = MidiShowControl.out(config.txPort, config.txAddress)
			.on('error', err => {
				this.closeTransmitter()
				this.status(this.STATUS_ERROR)
				this.log('error', err.message)
			})
			.on('ready', () => {
				this.out.ready = true
				this.checkStatus()
			})

		this.out.config.deviceId = Number(config.txDeviceId)
		this.out.config.groupId  = Number(config.txGroupId)
		this.out.config.sendTo   = String(config.txSendTo)
	}

	checkStatus () {
		if ((this.in ? this.in.ready : true) && (this.out ? this.out.ready : true)) {
			this.status(this.STATUS_OK)
		}
	}

	closeSockets () {
		if (this.in) {
			this.closeReceiver()
		}

		if (this.out) {
			this.closeTransmitter()
		}

		this.status(this.STATUS_UNKNOWN)
	}

	closeReceiver () {
		this.in.removeAllListeners()
		this.in.close()
		this.in = null
	}

	closeTransmitter () {
		this.out.removeAllListeners()
		this.out.close()
		this.out = null
	}

	initVariables () {
		let varlist = []

		if (this.config.rxExecList) {
			this.config.rxExecList.split(',').forEach(name => {
				const exec = this.getExec(name.replace(/^([0-9]+)(\.([0-9]+))?$/,
					(s, p1, p2, p3) => (this.compileExec({
						exec: p3 || p1,
						page: p3 ? p1 : 1
					}))))

				exec.vardef = true

				// START: DEPRECATED
				varlist.push({
					name:  'exec:' + exec.label,
					label: 'Fader position of exec ' + exec.label + ' (deprecated)'
				})
				// END: DEPRECATED

				;[
					{ type: 'active', label: 'Active state of exec'   },
					{ type: 'paused', label: 'Paused state of exec'   },
					{ type: 'cue',    label: 'Active cue of exec'     },
					{ type: 'fader',  label: 'Fader position of exec' }
				].forEach(def => {
					varlist.push({
						name:  'exec:' + exec.label + ':' + def.type,
						label: def.label + ' ' + exec.label
					})
				})
			})
		}

		this.setVariableDefinitions(varlist)
	}

	updateConfig (config) {
		this.config = config
		this.init()
	}

	isGrandMA () {
		return this.config.consoleType === 'gma'
	}

	getExec (name) {
		const exec = parseInt(name) + this.isGrandMA()
		const page = String(name).split('.')[1] || 1

		if (!this.execs.hasOwnProperty(name)) {
			this.execs[name] = {
				label:  page + '.' + exec,
				active: undefined,
				paused: undefined,
				fader:  undefined,
				cue:    undefined,
				vardef: false
			}
		}

		return this.execs[name]
	}

	compileExec (options, feedback) {
		const exec = options.exec - this.isGrandMA()
		const page = !exec && !feedback && !this.isGrandMA() ? 0 : parseInt(options.page) || 1

		return (exec < 0 ? 0 : exec) + '.' + page
	}

	onMessage (command, data) {
		const exec = this.getExec(data.exec)

		switch (command) {
			case 'goto':
				exec.active = true
				exec.paused = false
				exec.cue    = data.cue

				this.checkFeedbacks('paused')
				this.checkFeedbacks('active')
				this.checkFeedbacks('cue')
				break

			case 'pause':
				exec.paused = true

				this.checkFeedbacks('paused')
				break

			case 'resume':
				exec.paused = false

				this.checkFeedbacks('paused')
				break

			case 'fader':
				exec.fader = Math.round(data.position.percent)

				// START: DEPRECATED
				if (exec.vardef) {
					this.setVariable('exec:' + exec.label, exec.fader)
				}
				// END: DEPRECATED

				this.checkFeedbacks('fader')
				break

			case 'off':
				exec.active = false

				this.checkFeedbacks('active')
				break
		}
	}

	action (action) {
		const options = action.options

		if (!this.out) {
			return
		}

		switch (action.action) {
			case 'goto':
				this.out.goto(options.cue, this.compileExec(options), Number(options.fade))
				break

			case 'pause':
				this.out.pause(this.compileExec(options))
				break

			case 'resume':
				this.out.resume(this.compileExec(options))
				break

			case 'fader':
				const name = this.compileExec(options)
				const exec = this.getExec(name)

				let percent = Number(options.percent)

				switch (options.action) {
					case 'inc':
					case 'dec':
						if (typeof exec.fader === 'undefined') {
							return
						}

						percent = options.action === 'inc' ? exec.fader + percent : exec.fader - percent
						percent = percent < 0 ? 0 : (percent > 100 ? 100 : percent)

					default:
						this.out.fader(percent, name, Number(options.fade))
				}
				break

			case 'fire':
				this.out.fire(Number(options.macro))
				break

			case 'off':
				this.out.off(this.compileExec(options))
				break
		}
	}

	feedback (feedback) {
		const options = feedback.options
		const exec    = this.getExec(this.compileExec(options, true))
		const style   = { color: options.foreground, bgcolor: options.background }

		if (options.buttontext) {
			style.text = options.buttontext
		}

		if (exec.vardef) {
			this.setVariable('exec:' + exec.label + ':' + feedback.type, exec[feedback.type])
		}

		switch (feedback.type) {
			case 'active':
				return exec.active === Boolean(options.active) ? style : {}

			case 'paused':
				return exec.paused === Boolean(options.paused) ? style : {}

			case 'cue':
				return Number(exec.cue) === Number(options.cue) ? style : {}

			case 'fader':
				return eval('exec.fader' + (options.operator || '==') + 'Number(options.fader)') ? style : {}

			default:
				return {}
		}
	}
}
