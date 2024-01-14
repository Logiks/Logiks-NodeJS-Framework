/*
 * Logging functions
 * Create A Logger, may be we will remove this in future
 * LEVELS : trace,debug,info,warn,error,fatal
 * 
 * // console.error("ERROR CONSOLE 1");
 * // logger.debug("DEBUG CONSOLE 3");
 * // logger.info("INFO CONSOLE 3");
 * // logger.warn("WARN CONSOLE 3");
 * // logger.error("ERROR CONSOLE 30");
 * 
 * 
 * */

const bunyan = require('bunyan');
// const RotatingFileStream = require('bunyan-rotating-file-stream');

module.exports = {

 	LOGGERS: {
	    // "default": false,
	    // "requests": false,
	    // "callback": false,
	    // "message_sms": false,
	    // "message_email": false,
	    // "message_api": false,
	},

	logKeys: function() {
		return Object.keys(this.LOGGERS);
	},

	initLoggers: function() {
		that = this;

		_.each(CONFIG.LOGGER, function(logParams, logKey) {
			// console.log(logKey, logParams);

			that.LOGGERS[logKey] = bunyan.createLogger({
				    name: logKey.toUpperCase(),
				    streams: logParams
				});
		});

		global.logger = this.LOGGERS['default'];

		//console.log(this.LOGGERS, logger);
		// process.exit(0);

		console.log("LOGGERS Initialized");
	},

	log: function(logObj, logKey, logLevel) {
		if(logKey==null) logKey = "default";
		if(logLevel==null) logLevel = "info";

		if(this.LOGGERS[logKey]==null) logControl = this.LOGGERS["default"];
		else logControl = this.LOGGERS[logKey];

		// console.info("LOGGER", logKey, logObj, logLevel, logControl);

		if(logControl) {
			switch(logLevel) {
				case "trace":
					logControl.trace(logObj);
				break;
				case "debug":
					logControl.debug(logObj);
				break;
				case "info":
					logControl.info(logObj);
				break;
				case "warn":
					logControl.warn(logObj);
				break;
				case "error":
					logControl.error(logObj);
				break;
				case "fatal":
					logControl.fatal(logObj);
				break;

			}
		} else {
			console.log("LOGGER KEY MISSING", logKey);
		}
	},
 }