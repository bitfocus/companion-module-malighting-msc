exports = module.exports = function(instance) {
	return {
		'active': {
			label:   'Executor running state feedback',
			options: [
				{
					type:     'number',
					label:    'Exec',
					tooltip:  'Executor Number',
					id:       'exec',
					required: true,
					min:      0,
					max:      127,
					default:  0
				},
				{
					type:     'number',
					label:    'Page',
					tooltip:  'Page Number',
					id:       'page',
					required: false,
					min:      1,
					max:      127,
					default:  1
				},
				{
					type:    'checkbox',
					label:   'Active',
					id:      'active',
					default: true
				},
				{
					type:    'colorpicker',
					label:   'Foreground Color',
					id:      'foreground',
					default: instance.rgb(255, 255, 255)
				},
				{
					type:    'colorpicker',
					label:   'Background Color',
					id:      'background',
					default: instance.rgb(0, 0, 0)
				}
			]
		},
		'paused': {
			label:   'Executor paused state feedback',
			options: [
				{
					type:     'number',
					label:    'Exec',
					tooltip:  'Executor Number',
					id:       'exec',
					required: true,
					min:      0,
					max:      127,
					default:  0
				},
				{
					type:     'number',
					label:    'Page',
					tooltip:  'Page Number',
					id:       'page',
					required: false,
					min:      1,
					max:      127,
					default:  1
				},
				{
					type:    'checkbox',
					label:   'Paused',
					id:      'paused',
					default: true
				},
				{
					type:    'colorpicker',
					label:   'Foreground Color',
					id:      'foreground',
					default: instance.rgb(255, 255, 255)
				},
				{
					type:    'colorpicker',
					label:   'Background Color',
					id:      'background',
					default: instance.rgb(0, 0, 0)
				}
			]
		},
		'cue': {
			label:   'Cue list feedback',
			options: [
				{
					type:     'textinput',
					label:    'Cue',
					tooltip:  'Cue Number',
					id:       'cue',
					regex:    instance.REGEX_FLOAT_OR_INT,
					required: true
				},
				{
					type:     'number',
					label:    'Exec',
					tooltip:  'Executor Number',
					id:       'exec',
					required: true,
					min:      0,
					max:      127,
					default:  0
				},
				{
					type:     'number',
					label:    'Page',
					tooltip:  'Page Number',
					id:       'page',
					required: false,
					min:      1,
					max:      127,
					default:  1
				},
				{
					type:    'colorpicker',
					label:   'Foreground Color',
					id:      'foreground',
					default: instance.rgb(255, 255, 255)
				},
				{
					type:    'colorpicker',
					label:   'Background Color',
					id:      'background',
					default: instance.rgb(0, 0, 0)
				}
			]
		},
		'fader': {
			label:   'Fader position feedback',
			options: [
				{
					type:     'number',
					label:    'Percent',
					tooltip:  'Position of the fader as percentage',
					id:       'fader',
					required: true,
					min:      0,
					max:      100        
				},
				{
					type:    'dropdown',
					label:   'Operator',
					tooltip: 'Operator used in relational expression',
					id:      'operator',
					required: true,
					choices: [
						{ id: '==',  label: '=' },
						{ id: '!=',  label: '≠' },
						{ id: '>=',  label: '≥' },
						{ id: '<=',  label: '≤' },
						{ id: '>',   label: '>' },
						{ id: '<',   label: '<' }
					],
					default:  '=='
				},
				{
					type:     'number',
					label:    'Exec',
					tooltip:  'Executor Number',
					id:       'exec',
					required: true,
					min:      0,
					max:      127
				},
				{
					type:     'number',
					label:    'Page',
					tooltip:  'Page Number',
					id:       'page',
					required: false,
					min:      1,
					max:      127,
					default:  1
				},
				{
					type:    'colorpicker',
					label:   'Foreground Color',
					id:      'foreground',
					default: instance.rgb(255, 255, 255)
				},
				{
					type:    'colorpicker',
					label:   'Background Color',
					id:      'background',
					default: instance.rgb(0, 0, 0)
				}
			]
		}
	};
};