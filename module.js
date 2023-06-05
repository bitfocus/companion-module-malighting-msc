import { runEntrypoint, InstanceBase, InstanceStatus, Regex } from '@companion-module/base'
import { GetConfigFields } from './config.js'
import { getActionDefinitions } from './action.js'
import { getFeedbackDefinitions } from './feedback.js'
import MidiShowControl from 'mamsc'
import { UpgradeScripts } from './upgrades.js'

class MAMSCInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		this.REGEX_CUE_NUMBER = '/^[1-9]*[0-9](.[0-9]{1,3})?$/'
	}

	compileExec (options, feedback) {
		const exec = options.exec - this.isGrandMA()
		const page = !exec && !feedback && !this.isGrandMA() ? 0 : parseInt(options.page) || 1

		return (exec < 0 ? 0 : exec) + '.' + page
	}

	getExec (name) {
		const exec = parseInt(name) + this.isGrandMA()
		const page = String(name).split('.')[1] || 1

		if (!this.execs.hasOwnProperty(name)) {
			this.execs[name] = {
				label: page + '.' + exec,
				active: undefined,
				paused: undefined,
				fader: undefined,
				cue: undefined,
				vardef: false,
			}
		}

		return this.execs[name]
	}



	async init(config) {
		this.config = config

		this.execs = {}
		this.in = null
		this.out = null

		this.setActionDefinitions(getActionDefinitions(this))
		this.setFeedbackDefinitions(getFeedbackDefinitions(this))
		this.initSockets()
		this.initVariables()
	}

	async configUpdated(config) {
		this.closeSockets()
		this.init(config)
	}

	isGrandMA() {
		return this.config.consoleType === 'gma'
	}

	async destroy() {
		this.closeSockets()
	}

	// Return config fields for web config
	getConfigFields() {
		return GetConfigFields(this)
	}

	initSockets() {
		const config = this.config

		this.closeSockets()

		if (config.rxPort && config.rxEnabled) {
			this.initReceiver(config)
		}

		if (config.txPort) {
			this.initTransmitter(config)
		}
	}

	initReceiver(config) {
		this.updateStatus(InstanceStatus.Connecting, 'Initializing')

		this.in = MidiShowControl.in(config.rxPort, config.rxAddress)
			.on('error', (err) => {
				if ('ProtocolError' !== err.name) {
					this.closeReceiver()
					this.updateStatus(InstanceStatus.UnknownError, err.message)
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
		this.in.config.groupId = Number(config.rxGroupId)
	}

	initTransmitter(config) {
		this.updateStatus(InstanceStatus.Connecting, 'Initializing')

		this.out = MidiShowControl.out(config.txPort, config.txAddress)
			.on('error', (err) => {
				this.closeTransmitter()
				this.updateStatus(InstanceStatus.UnknownError, err.message)
				this.log('error', err.message)
			})
			.on('ready', () => {
				this.out.ready = true
				this.checkStatus()
			})

		this.out.config.deviceId = Number(config.txDeviceId)
		this.out.config.groupId = Number(config.txGroupId)
		this.out.config.sendTo = String(config.txSendTo)
	}

	checkStatus() {
		if ((this.in ? this.in.ready : true) && (this.out ? this.out.ready : true)) {
			this.updateStatus(InstanceStatus.Ok, 'Ready')
		}
	}

	closeSockets() {
		if (this.in) {
			this.closeReceiver()
		}

		if (this.out) {
			this.closeTransmitter()
		}

		this.updateStatus(InstanceStatus.UnknownError, 'No connection')
	}

	closeReceiver() {
		this.in.removeAllListeners()
		this.in.close()
		this.in = null
	}

	closeTransmitter() {
		this.out.removeAllListeners()
		this.out.close()
		this.out = null
	}

	initVariables() {
		let varlist = []

		if (this.config.rxExecList) {
			this.config.rxExecList.split(',').forEach((name) => {
				const exec = this.getExec(
					name.replace(/^([0-9]+)(\.([0-9]+))?$/, (s, p1, p2, p3) =>
						this.compileExec({
							exec: p3 || p1,
							page: p3 ? p1 : 1,
						})
					)
				)

				exec.vardef = true

				;[
					{ type: 'active', label: 'Active state of exec' },
					{ type: 'paused', label: 'Paused state of exec' },
					{ type: 'cue', label: 'Active cue of exec' },
					{ type: 'fader', label: 'Fader position of exec' },
				].forEach((def) => {
					varlist.push({
						variableId: 'exec_' + exec.label + '_' + def.type,
						name: def.label + ' ' + exec.label,
					})
				})
			})
		}

		this.setVariableDefinitions(varlist)
	}

	getExec(name) {
		const exec = parseInt(name) + this.isGrandMA()
		const page = String(name).split('.')[1] || 1

		if (!this.execs.hasOwnProperty(name)) {
			this.execs[name] = {
				label: page + '.' + exec,
				active: undefined,
				paused: undefined,
				fader: undefined,
				cue: undefined,
				vardef: false,
			}
		}

		return this.execs[name]
	}

	compileExec(options, feedback) {
		const g = this.isGrandMA()
		const exec = options.exec - g
		const page = !exec && !feedback && !g ? 0 : parseInt(options.page) || 1

		return (exec < 0 ? 0 : exec) + '.' + page
	}

	onMessage(command, data) {
		console.log(data)
		const exec = this.getExec(data.exec)

		switch (command) {
			case 'goto':
				exec.active = true
				exec.paused = false
				exec.cue = data.cue

				this.setVariableValues({
					['exec_' + exec.label + '_paused']: exec.paused,
					['exec_' + exec.label + '_active']: exec.active,
					['exec_' + exec.label + '_cue']: exec.cue,
				})
				this.checkFeedbacks('paused', 'active', 'cue')
				break

			case 'pause':
			case 'resume':
				exec.paused = !!(command == 'pause')

				this.setVariableValues({ ['exec_' + exec.label + '_paused']: exec.paused })
				this.checkFeedbacks('paused')
				break

			case 'fader':
				exec.fader = Math.round(data.position.percent)
				
				this.setVariableValues({ ['exec_' + exec.label + '_fader']: exec.fader })
				this.checkFeedbacks('fader')
				break

			case 'off':
				exec.active = false
				exec.paused = false
				exec.fader = 0
				this.setVariableValues({
					['exec_' + exec.label + '_paused']: exec.paused,
					['exec_' + exec.label + '_active']: exec.active,
				})
				this.checkFeedbacks('active', 'paused', 'fader')
				break
		}
	}

	// action(action) {
	// 	const options = action.options

	// 	if (!this.out) {
	// 		return
	// 	}

	// 	switch (action.action) {
	// 		case 'goto':
	// 			this.out.goto(options.cue, this.compileExec(options), Number(options.fade))
	// 			break

	// 		case 'pause':
	// 			this.out.pause(this.compileExec(options))
	// 			break

	// 		case 'resume':
	// 			this.out.resume(this.compileExec(options))
	// 			break

	// 		case 'fader':
	// 			const name = this.compileExec(options)
	// 			const exec = this.getExec(name)

	// 			let percent = Number(options.percent)

	// 			switch (options.action) {
	// 				case 'inc':
	// 				case 'dec':
	// 					if (typeof exec.fader === 'undefined') {
	// 						return
	// 					}

	// 					percent = options.action === 'inc' ? exec.fader + percent : exec.fader - percent
	// 					percent = percent < 0 ? 0 : percent > 100 ? 100 : percent

	// 				default:
	// 					this.out.fader(percent, name, Number(options.fade))
	// 			}
	// 			break

	// 		case 'fire':
	// 			this.out.fire(Number(options.macro))
	// 			break

	// 		case 'off':
	// 			this.out.off(this.compileExec(options))
	// 			break
	// 	}
	// }

	// feedback(feedback) {
	// 	const options = feedback.options
	// 	const exec = this.getExec(this.compileExec(options, true))
	// 	const style = { color: options.foreground, bgcolor: options.background }

	// 	if (options.buttontext) {
	// 		style.text = options.buttontext
	// 	}

	// 	if (exec.vardef) {
	// 		this.setVariable('exec:' + exec.label + ':' + feedback.type, exec[feedback.type])
	// 	}

	// 	switch (feedback.type) {
	// 		case 'active':
	// 			return exec.active === Boolean(options.active) ? style : {}

	// 		case 'paused':
	// 			return exec.paused === Boolean(options.paused) ? style : {}

	// 		case 'cue':
	// 			return Number(exec.cue) === Number(options.cue) ? style : {}

	// 		case 'fader':
	// 			return eval('exec.fader' + (options.operator || '==') + 'Number(options.fader)') ? style : {}

	// 		default:
	// 			return {}
	// 	}
	// }
}

runEntrypoint(MAMSCInstance, UpgradeScripts)
