var instance_skel = require('../../instance_skel');
var mamsc         = require('mamsc');

function instance(system, id, config) {
	var self = this;

	instance_skel.apply(this, arguments);
	
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
		self.in = mamsc.in(config.rxPort, config.rxAddress)
					   .on('error', self.onSocketError.bind(self))
					   .on('message', self.onMessage.bind(self));

		self.in.config.deviceId = Number(config.rxDeviceId);
		self.in.config.groupId  = Number(config.rxGroupId);
	}

	if (config.txPort) {
		self.out = mamsc.out(config.txPort, config.txAddress)
						.on('error', self.onSocketError.bind(self));

		self.out.config.deviceId = Number(config.txDeviceId);
		self.out.config.groupId  = Number(config.txGroupId);
		self.out.config.sendTo   = String(config.txSendTo);        
	}

	if ((config.rxPort && config.rxEnabled ? self.in : true) && (config.txPort ? self.out : true)) {
		self.status(self.STATUS_OK);
	}
};

instance.prototype.initVariables = function() {
	var self    = this;
	var varlist = [];

	if (self.config.rxExecList) {
		var execs = self.config.rxExecList.split(',');
	
		for (var index in execs) {
			var exec = self.getExec(execs[index].replace(/^([0-9]+)$/, '$1.1'));
			
			exec.vardef = true;
			varlist.push({
				name:  'exec:' + exec.id,
				label: 'Fader position of exec ' + exec.id
			});
		}            
	}

	self.setVariableDefinitions(varlist);
};

instance.prototype.closeSockets = function() {
	var self = this;

	if (self.in) {
		try {
			self.in.close();
		} catch (err) {   
			self.onSocketError(err);         
		} finally {
			self.in = null;
		}
	}

	if (self.out) {
		self.out = null;
	}
};

instance.prototype.onSocketError = function(err) {
	var self = this;

	self.log('error', err.message);

	if ('bind' === err.syscall) {
		self.in = null;
		self.status(self.STATUS_ERROR);
	}
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
			id:     exec,
			active: undefined,
			paused: undefined,
			fader:  undefined,
			cue:    undefined,
			vardef: false
		};
	}

	return self.execs[exec];
};

instance.prototype.compileExec = function(options) {
	return Number(parseInt(options.exec || 0) + '.' + parseInt(options.page || 1));
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
				self.setVariable('exec:' + exec.id, exec.fader);
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
	var exec    = self.getExec(self.compileExec(options));
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

instance.prototype.config_fields = function() {
	var self = this;

	return require('./config')(self);
};

instance.prototype.actions = function() {
	var self = this;

	self.system.emit('instance_actions', self.id, require('./action')(self));
};

instance.prototype.feedbacks = function() {
	var self = this;
	
	self.setFeedbackDefinitions(require('./feedback')(self));
};

instance_skel.extendedBy(instance);
exports = module.exports = instance;