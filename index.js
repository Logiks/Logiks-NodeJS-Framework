/*
 * Main Server, this is the starting point of full system
 * 
 * @author : Bismay <bismay@smartinfologiks.com>
 * */

require('dotenv').config();

const config = require('./app/config');

/**
 * Loading all plugin packages required
 */
const restify = require('restify');
const restifyPlugins = require('restify-plugins');
const errors = require('restify-errors');
const bunyan = require('bunyan');

const nanoID = require("nanoid").nanoid;

global.moment = require('moment');
global._ = require('lodash');
global.axios = require('axios');//.default;
global.glob = require('glob');
global.fs = require('fs');
global.path = require('path');
global.md5 = require('md5');


config.START_TIME = moment().format();
config.ROOT_PATH  = __dirname;

console.log("\x1b[34m%s\x1b[0m","\nAPI Engine Initialization Started\n");

global.CONFIG = config;
global._ENV = {};
global.errors = errors;

global._LOGGER = require('./api/logger');
_LOGGER.initLoggers();

/**
 * Initialize Server
 */
const server = restify.createServer({
    name: config.name,
    version: config.version,

    dtrace: false,
    log: logger,
    ignoreTrailingSlash: true
});
server.config = config;

require('./api/misc')(server, restify);
require('./api/plugins')(server, restify);
require('./api/middleware')(server, restify);

require('./api/security')(server, restify);
require('./api/routes')(server, restify); // Load Basic System Routes

fs.readdirSync('./api/helpers/').forEach(function(file) {
    if ((file.indexOf(".js") > 0 && (file.indexOf(".js") + 3 == file.length))) {
        var className = file.toLowerCase().replace(".js", "").toUpperCase();
        var filePath = path.resolve('./api/helpers/' + file);
        global[className] = require(filePath)(server, restify);

        console.log(">>>Loading", className, typeof global[className]);
        if(global[className].initialize!=null) {
            global[className].initialize();
        }
        
    }
    //   console.log("Loading helpers : " + filePath);
});

//Process Cleanup
function exitHandler(options, exitCode) {
    //console.log("SERVER EXIT", exitCode, '-',options);
    if(options=="exit") return;
    if(options=="uncaughtException") {
        console.warn(exitCode);
    }

    if(server.mysql!=null) server.mysql.end();
    //server.mongodb.

    console.warn("\n\nServer Shutting Down @ "+moment().format());

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

            new APILog({
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
            }).save();

            return response;
        }, error => {
            const REQ_HOST = error.response.request.host;

            console.debug("AXIOS-Intercept-Response-Error", REQ_HOST, error);

            new APILog({
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
            }).save();

            return Promise.reject(error);
        });
}

/**
 * Start Server, Checks for availale PORTs
 * Then Connect to Mongo, MySQL, Redis, RabbitMQ
 */
server.listen(config.port, () => {
    console.log("");
    APP.initializeApplication();

    console.log("\n\x1b[34m%s\x1b[0m","API Engine Initialization Completed");
    console.log(`Server Started @ `+moment().format()+` and can be accessed on ${config.host}:${config.port}/`);

    if(CONFIG.remoteDebug===true) {
        startRemoteDebugger();
    }
});