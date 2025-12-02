//For bootstraping the system up

module.exports = function(server) {

    fs.readdirSync('./api/helpers/').forEach(function(file) {
        if ((file.indexOf(".js") > 0 && (file.indexOf(".js") + 3 == file.length))) {
            var className = file.toLowerCase().replace(".js", "").toUpperCase();
            var filePath = path.resolve('./api/helpers/' + file);
            global[className] = require(filePath)(server);
    
            // console.log(">>>Loading:Helper", className, typeof global[className]);
            if(global[className].initialize!=null) {
                global[className].initialize();
            }
            
        }
        //   console.log("Loading helpers : " + filePath);
    });
    
    var CLASSLIST = [];
    fs.readdirSync('./api/controllers/').forEach(function(file) {
        if ((file.indexOf(".js") > 0 && (file.indexOf(".js") + 3 == file.length))) {
            var className = file.toLowerCase().replace(".js", "").toUpperCase();
            var filePath = path.resolve('./api/controllers/' + file);
            global[className] = require(filePath)(server);
            CLASSLIST.push(className);
            // console.log(">>>Loading:Controller", className, typeof global[className]);
        }
    });

    _.each(CLASSLIST, function(className, k) {
        if(global[className].initialize!=null) {
            global[className].initialize();
        }
    });
    
    //Process Cleanup
    function exitHandler(options, exitCode) {
        //console.log("SERVER EXIT", exitCode, '-',options);
        if(options=="exit") return;
        if(options=="uncaughtException") {
            console.warn(exitCode);
        }
    
        if(server.mysql!=null) server.mysql.end();
    
        printObj("\n\nServer Shutting Down @ "+moment().format(), "red", 0);
    
        // if (options.cleanup) console.log('clean');
        // if (exitCode || exitCode === 0) console.log(exitCode);
        // if (options.exit) process.exit();
    
        setTimeout(function() {
            process.exit();
        }, 1000);
    }
    
    
    [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach((eventType) => {
        process.on(eventType, exitHandler.bind(null, eventType));
    })
    
    process.on('uncaughtException', function(err) {
        console.error(err.name,err.message,err.stack);
    });
    
    //Configure AXIOS remote calls
    if(CONFIG.intercept_axios_request) {
        axios.interceptors.request.use(request => {
                console.debug("AXIOS-Intercept-Request",request);
                return request;
            }, error => {
                console.debug("AXIOS-Intercept-Request-Error",error);
                return Promise.reject(error);
            });
    }
    
    if(CONFIG.intercept_axios_response) {
        axios.interceptors.response.use(response => {
                const REQ_HOST = response.request.host;
    
                console.debug("AXIOS-Intercept-Response-Success", REQ_HOST, response.request);
    
                _LOGGER.log({
                    "status": error.response.status,
                    "statusText": error.response.statusText,
                    "data": JSON.stringify(error.response.data),
                    "headers": JSON.stringify(error.response.config.headers),
                    "payload": (typeof error.response.config.data == "object")?JSON.stringify(error.response.config.data):error.response.config.data,
                    "host": error.response.request.host,
                    "method": error.response.request.method,
                    "url": error.response.config.url,
                    "aborted": ""+error.response.request.aborted,
                    "timestamp": moment().format("Y-M-D HH:mm:ss")
                }, "requests");
    
                return response;
            }, error => {
                const REQ_HOST = error.response.request.host;
    
                console.debug("AXIOS-Intercept-Response-Error", REQ_HOST, error);
    
                _LOGGER.log({
                    "status": error.response.status,
                    "statusText": error.response.statusText,
                    "data": JSON.stringify(error.response.data),
                    "headers": JSON.stringify(error.response.config.headers),
                    "payload": (typeof error.response.config.data == "object")?JSON.stringify(error.response.config.data):error.response.config.data,
                    "host": error.response.request.host,
                    "method": error.response.request.method,
                    "url": error.response.config.url,
                    "aborted": ""+error.response.request.aborted,
                    "timestamp": moment().format("Y-M-D HH:mm:ss")
                }, "requests");
    
                return Promise.reject(error);
            });
    }
}

global.printObj = function(msg, clr, intent) {
  if(intent==null) intent = 2;
  if(clr==null) clr = "-";

  var newMsg = "";
  for (let k = 0; k < intent; k++) {
      newMsg = ">"+newMsg;
  }
  msg = newMsg+" "+msg;

  switch(clr.toLowerCase()) {
      case "grey":
          console.log("\x1b[30m%s\x1b[0m",`${msg}`);
          break;
      case "red":
          console.log("\x1b[31m%s\x1b[0m",`${msg}`);
          break;
      case "green":
          console.log("\x1b[32m%s\x1b[0m",`${msg}`);
          break;
      case "yellow":
          console.log("\x1b[33m%s\x1b[0m",`${msg}`);
          break;
      case "blue":
          console.log("\x1b[34m%s\x1b[0m",`${msg}`);
          break;
      case "pink":
          console.log("\x1b[35m%s\x1b[0m",`${msg}`);
          break;
      case "sky":
          console.log("\x1b[36m%s\x1b[0m",`${msg}`);
          break;
      default:
          console.log(msg);
  }
}