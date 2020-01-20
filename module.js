var instance_skel = require('../../instance_skel');
var mamsc         = require('mamsc');

function instance(system, id, config) {
	var self = this;

	instance_skel.apply(this, arguments);

	self.defineConst('REGEX_CUE_NUMBER', '/^[1-9]*[0-9](\.[0-9]{1,3})?$/');

	self.actions();
	self.feedbacks();

	return self;
}

instance.prototype.init = function() {
	var self = this;

	self.execs = {};

	self.initSockets();
	self.initVariables();
};

instance.prototype.destroy = function() {
	var self = this;

	self.closeSockets();
};

instance.prototype.initSockets = function() {
	var self   = this;
	var config = self.config;

	self.closeSockets();

	if (config.rxPort && config.rxEnabled) {
		self.initReceiver(config);
	}

	if (config.txPort) {
		self.initTransmitter(config);
	}
};

instance.prototype.initReceiver = function(config) {
	var self = this;

	self.status(self.STATUS_WARNING, 'Initializing');

	self.in = mamsc.in(config.rxPort, config.rxAddress)
		.on('error', function (err) {
			if ('ProtocolError' !== err.name) {
				self.closeReceiver();
				self.status(self.STATUS_ERROR);
				self.log('error', err.message);
			} else {
				self.log('warn', err.message);
			}
		})
		.on('ready', function () {
			self.in.ready = true;
			self.checkStatus();
		})
		.on('message', self.onMessage.bind(self));

	self.in.config.deviceId = Number(config.rxDeviceId);
	self.in.config.groupId  = Number(config.rxGroupId);
};

instance.prototype.initTransmitter = function(config) {
	var self = this;

	self.status(self.STATUS_WARNING, 'Initializing');

	self.out = mamsc.out(config.txPort, config.txAddress)
		.on('error', function (err) {
			self.closeTransmitter();
			self.status(self.STATUS_ERROR);
			self.log('error', err.message);
		})
		.on('ready', function () {
			self.out.ready = true;
			self.checkStatus();
		});

	self.out.config.deviceId = Number(config.txDeviceId);
	self.out.config.groupId  = Number(config.txGroupId);
	self.out.config.sendTo   = String(config.txSendTo);
};

instance.prototype.checkStatus = function() {
	var self = this;

	if ((self.in ? self.in.ready : true) && (self.out ? self.out.ready : true)) {
		self.status(self.STATUS_OK);
	}
};

instance.prototype.closeSockets = function() {
	var self = this;

	if (self.in) {
		self.closeReceiver();
	}

	if (self.out) {
		self.closeTransmitter();
	}

	self.status(self.STATUS_UNKNOWN);
};

instance.prototype.closeReceiver = function() {
	var self = this;

	self.in.removeAllListeners();
	self.in.close();
	self.in = null;
};

instance.prototype.closeTransmitter = function() {
	var self = this;

	self.out.removeAllListeners();
	self.out.close();
	self.out = null;
};

instance.prototype.initVariables = function() {
	var self    = this;
	var varlist = [];

	if (self.config.rxExecList) {
		var execs = self.config.rxExecList.split(',');

		for (var index in execs) {
			var exec = self.getExec(execs[index].replace(/^([0-9]+)(\.([0-9]+))?$/,
				function(s, p1, p2, p3) {
					return (p3 || p1) + '.' + (p3 ? p1 : 1)
				}));

			exec.vardef = true;
			varlist.push({
				name:  'exec:' + exec.name,
				label: 'Fader position of exec ' + exec.name
			});
		}
	}

	self.setVariableDefinitions(varlist);
};

instance.prototype.updateConfig = function(config) {
	var self = this;

	self.config = config;
	self.init();
};

instance.prototype.getExec = function(exec) {
	var self = this;

	if (!self.execs.hasOwnProperty(exec)) {
		self.execs[exec] = {
			name:   (String(exec).split('.')[1] || 1) + '.' + parseInt(exec),
			active: undefined,
			paused: undefined,
			fader:  undefined,
			cue:    undefined,
			vardef: false
		};
	}

	return self.execs[exec];
};

instance.prototype.compileExec = function(options, feedback) {
	var self = this;
	var gma  = self.config.consoleType === 'gma';
	var exec = options.exec - gma;
	var page = !exec && !feedback && !gma ? 0 : parseInt(options.page) || 1;

	return Number((exec < 0 ? 0 : exec) + '.' + page);
};

instance.prototype.onMessage = function(command, data) {
	var self = this;
	var exec = self.getExec(data.exec);

	switch (command) {
		case 'goto':
			exec.active = true;
			exec.paused = false;
			exec.cue    = data.cue;

			self.checkFeedbacks('paused');
			self.checkFeedbacks('active');
			self.checkFeedbacks('cue');
			break;

		case 'pause':
			exec.paused = true;

			self.checkFeedbacks('paused');
			break;

		case 'resume':
			exec.paused = false;

			self.checkFeedbacks('paused');
			break;

		case 'fader':
			exec.fader = Math.round(data.position.percent);

			if (exec.vardef) {
				self.setVariable('exec:' + exec.name, exec.fader);
			}

			self.checkFeedbacks('fader');
			break;

		case 'off':
			exec.active = false;

			self.checkFeedbacks('active');
			break;
	}
};

instance.prototype.action = function(action) {
	var self    = this;
	var options = action.options;

	if (!self.out) {
		return;
	}

	switch (action.action) {
		case 'goto':
			self.out.goto(Number(options.cue), self.compileExec(options), Number(options.fade));
			break;

		case 'pause':
			self.out.pause(self.compileExec(options));
			break;

		case 'resume':
			self.out.resume(self.compileExec(options));
			break;

		case 'fader':
			self.out.fader(Number(options.percent), self.compileExec(options), Number(options.fade));
			break;

		case 'fire':
			self.out.fire(Number(options.macro));
			break;

		case 'off':
			self.out.off(self.compileExec(options));
			break;
	}
};

instance.prototype.feedback = function(feedback) {
	var self    = this;
	var options = feedback.options;
	var exec    = self.getExec(self.compileExec(options, true));
	var style   = {
		color:   options.foreground,
		bgcolor: options.background
	};

	switch (feedback.type) {
		case 'active':
			return exec.active === Boolean(options.active) ? style : {};

		case 'paused':
			return exec.paused === Boolean(options.paused) ? style : {};

		case 'cue':
			return exec.cue === Number(options.cue) ? style : {};

		case 'fader':
			return eval('exec.fader' + (options.operator || '==') + 'Number(options.fader)') ? style : {};

		default:
			return {};
	}
};

instance.prototype.config_fields = require('./config');
instance.prototype.actions       = require('./action');
instance.prototype.feedbacks     = require('./feedback');

instance_skel.extendedBy(instance);
exports = module.exports = instance;
