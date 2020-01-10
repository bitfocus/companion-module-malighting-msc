exports = module.exports = function(instance) {
	return [
		{
			type:    'text',
			id:      'info',
			width:   12,
			label:   'Console/onPC configuration',
			value:   'Goto Setup ⇒ MIDI Show Control. Set mode to <code>Ethernet</code>, exec to <code>Exec.Page</code> and the command format to <code>All</code>. MSC In and MSC Out ports need to be between <code>6000</code> and <code>6100</code> and shouldn\'t be the same to prevent loops.'
		},
		{
			type:    'textinput',
			id:      'txAddress',
			label:   'Transmitter Address',
			width:   8,
			regex:   instance.REGEX_IP,
			default: '255.255.255.255',
			tooltip: 'Address to send outgoing messages to.'
		},
		{
			type:    'number',
			id:      'txPort',
			label:   'Transmitter Port',
			width:   4,
			min:     6000,
			max:     6100,
			tooltip: 'Destination port (Console ⇒ MSC In).'
		},
		{
			type:    'number',
			id:      'txDeviceId',
			label:   'Transmitter Device ID',
			width:   4,
			min:     0,
			max:     111,
			default: 1,
			tooltip: 'Set this to a value between 0 and 111 to restrict messages to a device and set Send to to \'Device\'.'
		},
		{
			type:    'number',
			id:      'txGroupId',
			label:   'Transmitter Group ID',
			width:   4,
			min:     1,
			max:     15,
			default: 1,
			tooltip: 'Set this to a value between 1 and 15 to restrict messages to a group and set Send to to \'Group\'.'
		},
		{
			type:    'dropdown',
			id:      'txSendTo',
			label:   'Transmitter Send To',
			width:   4,
			choices: [
				{ id: 'all',    label: 'All'    },
				{ id: 'device', label: 'Device' },
				{ id: 'group',  label: 'Group'  }
			],
			default: 'all',
			tooltip: 'If you want to restrict who should react on messages send you can set this to either \'Device\' and set the Device ID or \'Group\' and set the Group ID accordingly. By default it is set to \'All\' so everyone will react on messages.'
		},
		{
			type:    'textinput',
			id:      'rxAddress',
			label:   'Receiver Address',
			width:   8,
			regex:   instance.REGEX_IP,
			default: '0.0.0.0',
			tooltip: 'Address to listen for incoming messages on.'
		},
		{
			type:    'number',
			id:      'rxPort',
			label:   'Receiver Port',
			width:   4,
			min:     6000,
			max:     6100,
			tooltip: 'Port to listen for incoming messages on (Console ⇒ MSC Out).'
		},
		{
			type:    'number',
			id:      'rxDeviceId',
			label:   'Receiver Device ID',
			width:   4,
			min:     0,
			max:     111,
			default: 1,
			tooltip: 'Set this to a value between 0 and 111 to only listen for messages received for this device ID. We\'ll still react on messages send to everyone.'
		},
		{
			type:    'number',
			id:      'rxGroupId',
			label:   'Receiver Group ID',
			width:   4,
			min:     1,
			max:     15,
			default: 1,
			tooltip: 'Set this to a value between 1 and 15 to only listen for messages received for this group ID. We\'ll still react on messages send to everyone.'
		},
		{
			type:    'checkbox',
			id:      'rxEnabled',
			label:   'Receiver Enabled',
			width:   4,
			default: false,
			tooltip: 'Enable the Receiver.'
		},
		{
			type:    'textinput',
			id:      'rxExecList',
			label:   'Receiver Executor List (Format: exec[.page], Comma Separated)',
			width:   12,
			regex:   '/^([0-9]+(\.[0-9]+)?(,[0-9]+(\.[0-9]+)?)*)?$/',
			tooltip: 'Comma separated list of executors that will be created as variables and updated with their fader position.'
		}
	];
};