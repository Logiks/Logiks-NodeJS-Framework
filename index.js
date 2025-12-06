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
const express = require('express');

global.moment = require('moment');
global._ = require('lodash');
global.axios = require('axios');//.default;
global.glob = require('glob');
global.fs = require('fs');
global.path = require('path');
global.md5 = require('md5');


config.START_TIME = moment().format();
config.ROOT_PATH = __dirname;

console.log("\x1b[34m%s\x1b[0m", "\nAPI Engine Initialization Started\n");

global.CONFIG = config;
global._ENV = {};

global._LOGGER = require('./api/logger');
_LOGGER.initLoggers();

/**
 * Initialize Server
 */
const server = express();
server.config = CONFIG;

server.set('name', CONFIG.name);
server.set('version', CONFIG.version);

require('./api/plugins')(server);
require('./api/middleware')(server);


require('./api/security')(server);
require('./api/bootstrap')(server);//Initiating all basic functions

APP.initializeApplication();

require('./api/routes')(server);// Load Basic System Routes

/**
 * Start Server, Checks for availale PORTs
 * Then Connect to Mongo, MySQL, Redis, RabbitMQ
 */
server.listen(config.port, () => {
  console.log("\n\x1b[34m%s\x1b[0m", "API Engine Initialization Completed");
  console.log(`Server Started @ ` + moment().format() + ` and can be accessed on ${config.host}:${config.port}/`);

  if (CONFIG.remoteDebug === true) {
    startRemoteDebugger();
  }
});