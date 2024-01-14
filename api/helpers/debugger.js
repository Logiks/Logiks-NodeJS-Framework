//Debugging Functions

var _log = null;
var _error = null;
var _warning = null;
var isRunning = false;

module.exports = function(server, restify) {

	initialize = function() {
		
	}

	isRemoteDebugger = function() {
		return isRunning;
	}

	startRemoteDebugger = function() {
		if(CONFIG.SILK_REMOTE_DEBUGGER==null) {
			return;
		}
		
		_log = console.log;
  		_error = console.error;
  		_warning = console.warning;
  		isRunning = true;

  		console.log = function(message) {
  			if(arguments!=null) message = JSON.stringify(arguments);

	        axios.get(CONFIG.SILK_REMOTE_DEBUGGER.URL+'?type=log&text='+message, {
		        	headers: {
		        		"Authorization": "Bearer "+CONFIG.SILK_REMOTE_DEBUGGER.TOKEN
		        	}
		        }).then(function (response) {
	                // handle success
	                //console.debug("DEBUGGER-LOG-THEN", response);
	              })
	              .catch(function (error) {
	                // handle error
	                console.debug("DEBUGGER-LOG-CATCH", error);
	              });

	        if(CONFIG.SILK_REMOTE_DEBUGGER.PASS_THRU) {
	        	console.debug("DEBUGGER-LOG", arguments);
	        }
	        //_log.apply(console, arguments);
	        //console.debug("DEBUGGER-DEBUG", arguments, "X", JSON.stringify(arguments), "X", typeof message, "X", message);
	    };

	    console.error = function(message) {
	    	if(arguments!=null) message = JSON.stringify(arguments);

	        axios.get(CONFIG.SILK_REMOTE_DEBUGGER.URL+'?type=error&text='+message, {
		        	headers: {
		        		"Authorization": "Bearer "+CONFIG.SILK_REMOTE_DEBUGGER.TOKEN
		        	}
	        	}).then(function (response) {
	                // handle success
	              })
	              .catch(function (error) {
	                // handle error
	              });

	        if(CONFIG.SILK_REMOTE_DEBUGGER.PASS_THRU) {
	        	console.debug("DEBUGGER-ERROR", arguments);
	        }
	        //_log.apply(console, arguments);
	        // console.debug("DEBUGGER-ERROR", arguments, message);
	    };

	    console.warning = function(message) {
	    	if(arguments!=null) message = JSON.stringify(arguments);

	        axios.get(CONFIG.SILK_REMOTE_DEBUGGER.URL+'?type=warning&text='+message, {
		        	headers: {
		        		"Authorization": "Bearer "+CONFIG.SILK_REMOTE_DEBUGGER.TOKEN
		        	}
		        }).then(function (response) {
	                // handle success
	              })
	              .catch(function (error) {
	                // handle error
	              });

	       if(CONFIG.SILK_REMOTE_DEBUGGER.PASS_THRU) {
	        	console.debug("DEBUGGER-WARNING", arguments);
	        }
	        //_log.apply(console, arguments);
	       // console.debug("DEBUGGER-WARNING", arguments);
	    };

	    console.log("Remote Debug Server Connected to : "+ CONFIG.name);
	}

	stopRemoteDebugger = function() {
		if(CONFIG.SILK_REMOTE_DEBUGGER==null) {
			return;
		}
		console.log = _log;
		console.error = _error;
		console.warning = _warning;
		isRunning = false;
	}

	return this;
}