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

require('./api/plugins')(server, restify);
require('./api/middleware')(server, restify);


require('./api/security')(server, restify);
require('./api/routes')(server, restify); // Load Basic System Routes

require('./api/bootstrap')(server, restify);//Initiating all basic functions

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