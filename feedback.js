import { combineRgb } from '@companion-module/base'

export function getFeedbackDefinitions(self) {
	return {
		'active': {
			type: 'boolean',
			name: 'Executor active state feedback',
			options: [
				{
					type: 'number',
					label: 'Exec',
					tooltip: 'Executor Number',
					id: 'exec',
					required: true,
					min: 0,
					max: 900,
					default: 0
				},
				{
					type: 'number',
					label: 'Page',
					tooltip: 'Page Number',
					id: 'page',
					required: false,
					min: 1,
					max: 999,
					default: 1
				},
				{
					type: 'checkbox',
					label: 'Active',
					id: 'active',
					default: true
				},
			],
			defaultStyle: {
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0)
			},
			callback: (feedback, context) => {
				const state = self.getExec(self.compileExec(feedback.options, true))

				return state.active === !!feedback.options.active
			},
		},
		'paused': {
			type: 'boolean',
			name: 'Executor paused state feedback',
			options: [
				{
					type: 'number',
					label: 'Exec',
					tooltip: 'Executor Number',
					id: 'exec',
					required: true,
					min: 0,
					max: 900,
					default: 0
				},
				{
					type: 'number',
					label: 'Page',
					tooltip: 'Page Number',
					id: 'page',
					required: false,
					min: 1,
					max: 999,
					default: 1
				},
				{
					type: 'checkbox',
					label: 'Paused',
					id: 'paused',
					default: true
				},
			],
			defaultStyle: {
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0)
			},
			callback: (feedback, context) => {
				const state = self.getExec(self.compileExec(feedback.options, true))

				return state.paused === !!feedback.options.paused
			},
		},
		'cue': {
			type: 'boolean',
			name: 'Cue list feedback',
			options: [
				{
					type: 'textinput',
					label: 'Cue',
					tooltip: 'Cue Number',
					id: 'cue',
					regex: String(self.REGEX_CUE),
					required: true
				},
				{
					type: 'number',
					label: 'Exec',
					tooltip: 'Executor Number',
					id: 'exec',
					required: true,
					min: 0,
					max: 900,
					default: 0
				},
				{
					type: 'number',
					label: 'Page',
					tooltip: 'Page Number',
					id: 'page',
					required: false,
					min: 1,
					max: 999,
					default: 1
				},
			],
			defaultStyle: {
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0)
			},
			callback: (feedback, context) => {
				const state = self.getExec(self.compileExec(feedback.options, true))

				return Number(state.cue) === Number(feedback.options.cue)
			},
		},
		'fader': {
			type: 'boolean',
			name: 'Fader position feedback',
			options: [
				{
					type: 'number',
					label: 'Percent',
					tooltip: 'Position of the fader as percentage',
					id: 'fader',
					required: true,
					min: 0,
					max: 100
				},
				{
					type: 'dropdown',
					label: 'Operator',
					tooltip: 'Operator used in relational expression',
					id: 'operator',
					required: true,
					choices: [
						{ id: '==', label: '=' },
						{ id: '!=', label: '≠' },
						{ id: '>=', label: '≥' },
						{ id: '<=', label: '≤' },
						{ id: '>', label: '>' },
						{ id: '<', label: '<' },
					],
					default: '=='
				},
				{
					type: 'number',
					label: 'Exec',
					tooltip: 'Executor Number',
					id: 'exec',
					required: true,
					min: 0,
					max: 900
				},
				{
					type: 'number',
					label: 'Page',
					tooltip: 'Page Number',
					id: 'page',
					required: false,
					min: 1,
					max: 999,
					default: 1
				},
			],
			defaultStyle: {
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0)
			},
			callback: (feedback, context) => {
				const state = self.getExec(self.compileExec(feedback.options, true))
				const fader = Number(feedback.options.fader)

				switch (feedback.options.operator) {
					case '!=':
						return state.fader != fader
					case '>=':
						return state.fader >= fader
					case '<=':
						return state.fader <= fader
					case '>':
						return state.fader > fader
					case '<':
						return state.fader < fader
					default:
						return state.fader == fader
				}
			}
		}
	}
}
