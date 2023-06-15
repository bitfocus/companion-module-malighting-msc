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
					useVariables: true,
					required: true
				},
				{
					type: 'textinput',
					label: 'Executor',
					tooltip: 'Executor Number',
					id: 'exec',
					required: false,
					useVariables: true,
					default: '0'
				},
				{
					type: 'textinput',
					label: 'Page',
					tooltip: 'Page Number (grandMA only)',
					id: 'page',
					useVariables: true,
					required: false,
					default: '1'
				},
				{
					type: 'number',
					label: 'Fade',
					tooltip: 'Optional fade time in seconds',
					id: 'fade',
					useVariables: true,
					required: false,
					default: '',
					min: 0,
					max: 3600
				}
			],
			callback: async (action) => {
				let cue, exec, page, fade

				try {
					cue = await self.parseActionOption(action, 'cue', self.REGEX_CUE)
					exec = await self.parseActionOption(action, 'exec', self.REGEX_EXEC)
					page = await self.parseActionOption(action, 'page', self.REGEX_PAGE)
					fade = Number(action.options.fade)

					self.updateStatus(InstanceStatus.Ok)
					self.paramError = false
				} catch (error) {
					self.updateStatus(InstanceStatus.BadConfig, error.message)
					self.paramError = true
				}

				!!self.out && self.out.goto(cue, self.compileExec({ exec, page }), fade)
			},
		},
		'pause': {
			name: 'Pause an executor',
			options: [
				{
					type: 'textinput',
					label: 'Executor',
					tooltip: 'Executor Number',
					id: 'exec',
					useVariables: true,
					required: false,
					default: '0'
				},
				{
					type: 'textinput',
					label: 'Page',
					tooltip: 'Page Number (grandMA only)',
					id: 'page',
					useVariables: true,
					required: false,
					default: '1'
				}
			],
			callback: async (action) => {
				let exec, page

				try {
					exec = await self.parseActionOption(action, 'exec', self.REGEX_EXEC)
					page = await self.parseActionOption(action, 'page', self.REGEX_PAGE)

					self.updateStatus(InstanceStatus.Ok)
					self.paramError = false
				} catch (error) {
					self.updateStatus(InstanceStatus.BadConfig, error.message)
					self.paramError = true
				}

				!!self.out && self.out.pause(self.compileExec({ exec, page }))
			},
		},
		'resume': {
			name: 'Resume an executor',
			options: [
				{
					type: 'textinput',
					label: 'Executor',
					tooltip: 'Executor Number',
					id: 'exec',
					useVariables: true,
					required: false,
					default: '0'
				},
				{
					type: 'textinput',
					label: 'Page',
					tooltip: 'Page Number (grandMA only)',
					id: 'page',
					useVariables: true,
					required: false,
					default: '1'
				}
			],
			callback: async (action) => {
				let exec, page

				try {
					exec = await self.parseActionOption(action, 'exec', self.REGEX_EXEC)
					page = await self.parseActionOption(action, 'page', self.REGEX_PAGE)

					self.updateStatus(InstanceStatus.Ok)
					self.paramError = false
				} catch (error) {
					self.updateStatus(InstanceStatus.BadConfig, error.message)
					self.paramError = true
				}

				!!self.out && self.out.resume(self.compileExec({ exec, page }))
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
					required: true
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
					default: 'set'
				},
				{
					type: 'textinput',
					label: 'Executor',
					tooltip: 'Executor Number',
					id: 'exec',
					useVariables: true,
					required: false,
					default: '0'
				},
				{
					type: 'textinput',
					label: 'Page',
					tooltip: 'Page Number (grandMA only)',
					id: 'page',
					useVariables: true,
					required: false,
					default: '1'
				},
				{
					type: 'number',
					label: 'Fade',
					tooltip: 'Optional fade time in seconds',
					id: 'fade',
					required: false,
					default: '',
					min: 0,
					max: 3600
				}
			],
			callback: async (action) => {
				let percent, exec, page, fade

				try {
					percent = Number(await self.parseActionOption(action, 'percent', self.REGEX_PERCENT))
					exec = await self.parseActionOption(action, 'exec', self.REGEX_EXEC)
					page = await self.parseActionOption(action, 'page', self.REGEX_PAGE)
					fade = Number(action.options.fade)

					self.updateStatus(InstanceStatus.Ok)
					self.paramError = false
				} catch (error) {
					self.updateStatus(InstanceStatus.BadConfig, error.message)
					self.paramError = true
				}

				const name = self.compileExec({ exec, page })
				const state = self.getExec(name)

				switch (action.options.action) {
					case 'inc':
					case 'dec':
						if (typeof state.fader === 'undefined') {
							return
						}

						percent = action.options.action === 'inc' ? state.fader + percent : state.fader - percent
						percent = percent < 0 ? 0 : percent > 100 ? 100 : percent

					default:
						!!self.out && self.out.fader(percent, name, fade)
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
					default: '1'
				},
			],
			callback: async (action) => {
				let macro

				try {
					macro = await self.parseActionOption(action, 'macro', self.REGEX_MACRO)

					self.updateStatus(InstanceStatus.Ok)
					self.paramError = false
				} catch (error) {
					self.updateStatus(InstanceStatus.BadConfig, error.message)
					self.paramError = true
				}

				!!self.out && self.out.fire(macro)
			},
		},
		'off': {
			name: 'Switch an executor off',
			options: [
				{
					type: 'textinput',
					label: 'Executor',
					tooltip: 'Executor Number',
					id: 'exec',
					useVariables: true,
					required: false,
					default: '0'
				},
				{
					type: 'textinput',
					label: 'Page',
					tooltip: 'Page Number (grandMA only)',
					id: 'page',
					useVariables: true,
					required: false,
					default: '1'
				},
			],
			callback: async (action) => {
				let exec, page

				try {
					exec = await self.parseActionOption(action, 'exec', self.REGEX_EXEC)
					page = await self.parseActionOption(action, 'page', self.REGEX_PAGE)

					self.updateStatus(InstanceStatus.Ok)
					self.paramError = false
				} catch (error) {
					self.updateStatus(InstanceStatus.BadConfig, error.message)
					self.paramError = true
				}

				!!self.out && self.out.off(self.compileExec({ exec, page }))
			},
		},
	}
}
