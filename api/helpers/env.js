//ENV Configuration

module.exports = function(server, restify) {

	initialize = function() {
		console.log("\x1b[36m%s\x1b[0m","Environment Initialized");
	}

	clearEnvConfig = function() {
		global._ENV = {};
	}

	getEnvConfig = function(configKey, defaultValue) {
		if(configKey==null) return null;
		configKey = configKey.toLowerCase();
		
		if(_ENV[configKey] != null) return _ENV[configKey];
		else return defaultValue;
	}

	setEnvConfig = function(configKey, value) {
		_ENV[configKey] = value;
		
		return value;
	}

	return this;
}