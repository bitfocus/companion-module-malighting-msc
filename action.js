import { InstanceStatus } from '@companion-module/base'

export function getActionDefinitions(self) {
	return {
		'goto': {
			name: 'Goto a specific cue',
			options: [
				{
					type: 'textinput',
					label: 'Cue',
					tooltip: 'Cue Number',
					id: 'cue',
					regex: self.REGEX_CUE_NUMBER,
					useVariables: true,
					required: true,
				},
				{
					type: 'textinput',
					label: 'Exec',
					tooltip: 'Executor Number',
					id: 'exec',
					required: false,
					useVariables: true,
					default: '0',
					min: 0,
					max: 127,
				},
				{
					type: 'textinput',
					label: 'Page',
					tooltip: 'Page Number',
					id: 'page',
					useVariables: true,
					required: false,
					min: 1,
					max: 127,
					default: '1',
				},
				{
					type: 'number',
					label: 'Fade',
					tooltip: 'Optional fade time in seconds',
					id: 'fade',
					useVariables: true,
					required: false,
					min: 0,
					max: 3600,
				},
			],
			callback: async (action) => {
				const opt = {
					exec: await self.parseVariablesInString(action.options.exec),
					page: await self.parseVariablesInString(action.options.page),
					cue: await self.parseVariablesInString(action.options.cue),
					fade: action.options.fade,
				}
				let err = ''

				if (opt.exec < 0 || opt.exec > 127) {
					err = 'Exec '
				} else if (opt.page < 1 || opt.page > 127) {
					err += 'Page '
				}
				if (err != '') {
					self.updateStatus(InstanceStatus.BadConfig, 'Action: Option ' + err)
					self.paramError = true
				} else {
					!!self.out && self.out.goto(opt.cue, self.compileExec(opt), Number(opt.fade))
					self.updateStatus(InstanceStatus.Ok)
					self.paramError = false
				}
			},
		},
		'pause': {
			name: 'Pause an executor',
			options: [
				{
					type: 'textinput',
					label: 'Exec',
					tooltip: 'Executor Number',
					id: 'exec',
					useVariables: true,
					required: false,
					default: '0',
					min: 0,
					max: 127,
				},
				{
					type: 'textinput',
					label: 'Page',
					tooltip: 'Page Number',
					id: 'page',
					useVariables: true,
					required: false,
					min: 1,
					max: 127,
					default: '1',
				},
			],
			callback: async (action) => {
				const opt = {
					exec: await self.parseVariablesInString(action.options.exec),
					page: await self.parseVariablesInString(action.options.page),
				}
				let err = ''

				if (opt.exec < 0 || opt.exec > 127) {
					err = 'Exec '
				} else if (opt.page < 1 || opt.page > 127) {
					err += 'Page '
				}
				if (err != '') {
					self.updateStatus(InstanceStatus.BadConfig, 'Pause: Option ' + err)
					self.paramError = true
				} else {
					!!self.out && self.out.pause(self.compileExec(opt))
					self.updateStatus(InstanceStatus.Ok)
					self.paramError = false
				}
			},
		},
		'resume': {
			name: 'Resume an executor',
			options: [
				{
					type: 'textinput',
					label: 'Exec',
					tooltip: 'Executor Number',
					id: 'exec',
					useVariables: true,
					required: false,
					default: '0',
					min: 0,
					max: 127,
				},
				{
					type: 'textinput',
					label: 'Page',
					tooltip: 'Page Number',
					id: 'page',
					useVariables: true,
					required: false,
					min: 1,
					max: 127,
					default: '1',
				},
			],
			callback: async (action) => {
				const opt = {
					exec: await self.parseVariablesInString(action.options.exec),
					page: await self.parseVariablesInString(action.options.page),
				}
				let err = ''
				if (opt.exec < 0 || opt.exec > 127) {
					err = 'Exec '
				} else if (opt.page < 1 || opt.page > 127) {
					err += 'Page '
				}
				if (err != '') {
					self.updateStatus(InstanceStatus.BadConfig, 'Resume: Option ' + err)
					self.paramError = true
				} else {
					!!self.out && self.out.resume(self.compileExec(opt))
					self.updateStatus(InstanceStatus.Ok)
					self.paramError = false
				}
			},
		},
		'fader': {
			name: 'Move a fader',
			options: [
				{
					type: 'textinput',
					label: 'Percent',
					tooltip: 'Percentage to set, increase or decrease',
					id: 'percent',
					useVariables: true,
					required: true,
					min: 0,
					max: 100,
				},
				{
					type: 'dropdown',
					label: 'Action',
					tooltip: 'Set, increase or decrease the fader position',
					id: 'action',
					required: true,
					choices: [
						{ id: 'set', label: 'Set' },
						{ id: 'inc', label: 'Increase' },
						{ id: 'dec', label: 'Decrease' },
					],
					default: 'set',
				},
				{
					type: 'textinput',
					label: 'Exec',
					tooltip: 'Executor Number',
					id: 'exec',
					useVariables: true,
					required: false,
					default: '0',
					min: 0,
					max: 127,
				},
				{
					type: 'textinput',
					label: 'Page',
					tooltip: 'Page Number',
					id: 'page',
					useVariables: true,
					required: false,
					min: 1,
					max: 127,
					default: '1',
				},
				{
					type: 'number',
					label: 'Fade',
					tooltip: 'Optional fade time in seconds',
					id: 'fade',
					required: false,
					default: 0,
					min: 0,
					max: 3600,
				},
			],
			callback: async (action) => {
				const opt = {
					exec: await self.parseVariablesInString(action.options.exec),
					page: await self.parseVariablesInString(action.options.page),
					percent: await self.parseVariablesInString(action.options.percent),
					fade: action.options.fade,
				}
				const name = self.compileExec(opt)
				const exec = self.getExec(name)

				let percent = Number(opt.percent)
				let err = ''
				if (opt.exec < 0 || opt.exec > 127) {
					err = 'Exec '
				} else if (opt.page < 1 || opt.page > 127) {
					err += 'Page '
				}
				if (err != '') {
					self.updateStatus(InstanceStatus.BadConfig, 'Fader: Option ' + err)
					self.paramError = true
				} else {
					switch (action.options.action) {
						case 'inc':
						case 'dec':
							if (typeof exec.fader === 'undefined') {
								return
							}

							percent = action.options.action === 'inc' ? exec.fader + percent : exec.fader - percent
							percent = percent < 0 ? 0 : percent > 100 ? 100 : percent

						default:
							!!self.out && self.out.fader(percent, name, Number(opt.fade))
							self.updateStatus(InstanceStatus.Ok)
							self.paramError = false
					}
				}
			},
		},
		'fire': {
			name: 'Fire a macro',
			options: [
				{
					type: 'textinput',
					label: 'Macro',
					tooltip: 'Macro number between 1 and 255',
					id: 'macro',
					useVariables: true,
					required: true,
					default: '1',
					min: 1,
					max: 255,
				},
			],
			callback: async (action) => {
				const macro = Number(await self.parseVariablesInString(action.options.macro))
				let err = ''
				if (macro < 1 || macro > 255) {
					err = 'Macro '
				}
				if (err != '') {
					self.updateStatus(InstanceStatus.BadConfig, 'Fire: Option ' + err)
					self.paramError = true
				} else {
					!!self.out && self.out.fire(macro)
					self.updateStatus(InstanceStatus.Ok)
					self.paramError = false
				}
			},
		},
		'off': {
			name: 'Switch an executor off',
			options: [
				{
					type: 'textinput',
					label: 'Exec',
					tooltip: 'Executor Number',
					id: 'exec',
					useVariables: true,
					required: false,
					default: '0',
					min: 0,
					max: 127,
				},
				{
					type: 'textinput',
					label: 'Page',
					tooltip: 'Page Number',
					id: 'page',
					useVariables: true,
					required: false,
					min: 1,
					max: 127,
					default: '1',
				},
			],
			callback: async (action) => {
				const opt = {
					exec: await self.parseVariablesInString(action.options.exec),
					page: await self.parseVariablesInString(action.options.page),
				}
				let err = ''
				if (opt.exec < 0 || opt.exec > 127) {
					err = 'Exec '
				} else if (opt.page < 1 || opt.page > 127) {
					err += 'Page '
				}
				if (err != '') {
					self.updateStatus(InstanceStatus.BadConfig, 'Off: Invalid ' + err)
					self.paramError = true
				} else {
					!!self.out && self.out.off(self.compileExec(opt))
					self.updateStatus(InstanceStatus.Ok)
					self.paramError = false
				}
			},
		},
	}
}
