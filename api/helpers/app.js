/*
 * Application related functions
 * This file contains and controls aspects of app folder
 * 
 * */

const APPINDEX = {
    "CONTROLLERS":{},
    "PROCESSORS": {},
    "DATA": {},
    "ROUTES": {}
};

module.exports = function(server, restify) {

	initialize = function() {
        // CONFIG.strict_routes=true;
	}

    initializeApplication = function() {
        var that = this;

        //Initiate Sequelize

        //Load Helpers
        if(fs.existsSync('./app/helpers/')) {
            fs.readdirSync('./app/helpers/').forEach(function(file) {
                if ((file.indexOf(".js") > 0 && (file.indexOf(".js") + 3 == file.length))) {
                    var className = file.toLowerCase().replace(".js", "").toUpperCase();
                    var filePath = path.resolve('./app/helpers/' + file);
                    global[className] = require(filePath)(server, restify);
            
                    // console.log(">>>Loading:Helper", className, typeof global[className]);
                    if(global[className].initialize!=null) {
                        global[className].initialize();
                    }
                    
                }
                //   console.log("Loading helpers : " + filePath);
            });
        }

        //Load Controllers
        if(fs.existsSync('./app/controllers/')) {
            var CLASSLIST = [];
            
            fs.readdirSync('./app/controllers/').forEach(function(file) {
                if ((file.indexOf(".js") > 0 && (file.indexOf(".js") + 3 == file.length))) {
                    var clsName = file.replace('.js','').toUpperCase();
                    var filePath = path.resolve('./app/controllers/' + file);

                    global[clsName] = require(filePath);//(server, restify);
                    APPINDEX.CONTROLLERS[clsName] = global[clsName];
                    CLASSLIST.push(clsName);
                    // console.log("> Loading Controller", clsName);
                }
            });

            _.each(CLASSLIST, function(className, k) {
                if(global[className].initialize!=null) {
                    global[className].initialize(server, restify);
                }
            });
        }

        //Initiate Default Processors
        if(fs.existsSync('./api/processors/')) {
            fs.readdirSync('./api/processors/').forEach(function(file) {
                if ((file.indexOf(".js") > 0 && (file.indexOf(".js") + 3 == file.length))) {
                    var clsName = file.replace('.js','').toUpperCase();
                    var filePath = path.resolve('./api/processors/' + file);

                    global[clsName] = require(filePath);
                    APPINDEX.PROCESSORS[clsName] = global[clsName];
                    //console.log("> Loading Controller", clsName);
                }
            });
        }
       
        // Load vendors
        if(fs.existsSync('./app/controllers/vendors/')) {
            fs.readdirSync('./app/controllers/vendors/').forEach(function(file) {
                if ((file.indexOf(".js") > 0 && (file.indexOf(".js") + 3 == file.length))) {
                    var clsName = file.replace('.js','').toUpperCase();
                    var filePath = path.resolve('./app/controllers/vendors/' + file);
    
                    global[clsName] = require(filePath);//(server, restify);
                    APPINDEX.CONTROLLERS[clsName] = global[clsName];
                    //console.log(">Loading Controller", clsName);
                }
            });
        }
        
        //Create Data Model Indexes
        if(fs.existsSync('./app/data/')) {
            fs.readdirSync('./app/data/').forEach(function(file) {
                if ((file.indexOf(".json") > 0 && (file.indexOf(".json") + 5 == file.length))) {
                    var clsName = file.replace('.json','').toUpperCase();
                    var filePath = path.resolve('./app/data/' + file);
                    //console.log("filePath", filePath);

                    try {
                        var jsonData = JSON.parse(fs.readFileSync(filePath, "utf8"))
                        APPINDEX.CONTROLLERS[clsName] = generateController(clsName, jsonData);

                        //APPINDEX.DATA[clsName] = require(filePath);
                    } catch(e) {
                        console.log("Error loading Data Controller", clsName);
                    }
                }
            });
        }

        //Initiate Processors
        if(fs.existsSync('./app/processors/')) {
            fs.readdirSync('./app/processors/').forEach(function(file) {
                if ((file.indexOf(".js") > 0 && (file.indexOf(".js") + 3 == file.length))) {
                    var clsName = file.replace('.js','').toUpperCase();
                    var filePath = path.resolve('./app/processors/' + file);

                    global[clsName] = require(filePath);
                    APPINDEX.PROCESSORS[clsName] = global[clsName];
                    //console.log("> Loading Controller", clsName);
                }
            });
        }

        //Initiate Routes
        if(CONFIG.allow_core_routes) {
            fs.readdirSync('./api/routes/').forEach(function(file) {
                if ((file.indexOf(".json") > 0 && (file.indexOf(".json") + 5 == file.length))) {
                    var clsName = file.replace('.json','').toUpperCase();
                    var filePath = path.resolve('./api/routes/' + file);
                    var basePath = clsName.toLowerCase();
    
                    var tempObj = require(filePath);
                    if(tempObj.enabled) {
                        _.each(tempObj.routes, function(conf, path) {
                            var rPath = `/${basePath}${path}`;
                            if(conf.method==null) conf.method = "GET";
    
                            that.registerRoutePath(rPath, conf.method.toUpperCase(), conf);
                        })
                    }
                } else if ((file.indexOf(".js") > 0 && (file.indexOf(".js") + 3 == file.length))) {
                    var clsName = file.replace('.js','').toUpperCase();
                    var filePath = path.resolve('./api/routes/' + file);
                    var basePath = clsName.toLowerCase();
    
                    require(filePath)(server, restify);
                }
            });
        }

        if(fs.existsSync('./app/routes/')) {
            fs.readdirSync('./app/routes/').forEach(function(file) {
                if ((file.indexOf(".json") > 0 && (file.indexOf(".json") + 5 == file.length))) {
                    var clsName = file.replace('.json','').toUpperCase();
                    var filePath = path.resolve('./app/routes/' + file);
                    var basePath = clsName.toLowerCase();

                    var tempObj = require(filePath);
                    if(tempObj.enabled) {
                        _.each(tempObj.routes, function(conf, path) {
                            var rPath = `/${basePath}${path}`;
                            if(conf.method==null) conf.method = "GET";

                            that.registerRoutePath(rPath, conf.method.toUpperCase(), conf);
                        })
                    }
                } else if ((file.indexOf(".js") > 0 && (file.indexOf(".js") + 3 == file.length))) {
                    var clsName = file.replace('.js','').toUpperCase();
                    var filePath = path.resolve('./app/routes/' + file);
                    var basePath = clsName.toLowerCase();

                    require(filePath)(server, restify);
                }
            });
        }
        
        printObj("Application Initiation Complete", "sky");
    }

    registerRoutePath = async function(rPath, method, config) {
        // console.log('registerRoutePath', rPath, method, config);
        
        if(rPath[0]!="_") rPath = rPath.replaceAll(/_/g,"/");
        if(rPath.substr(rPath.length-1,1)=="/") rPath = rPath.substr(0, rPath.length-1);

        var METHOD_TYPE = "DATA";//DATA, ERROR, CONTROLLER
        var METHOD_PARAMS = {};
        //console.info("registerRoutePath>>", METHOD_TYPE, METHOD_PARAMS, rPath, method, config);

        //Process CONFIG Setup
        switch(typeof config.data) {
            case "string":
                var METHOD = config.data.split(".");
                METHOD[0] = METHOD[0].toUpperCase();

                if(APPINDEX.CONTROLLERS[METHOD[0]]!=null) {
                    if(APPINDEX.CONTROLLERS[METHOD[0]][METHOD[1]]!=null) {
                        // console.log("METHOD FOUND", APPINDEX.CONTROLLERS[METHOD[0]][METHOD[1]]);

                        METHOD_TYPE = "CONTROLLER";
                        METHOD_PARAMS = APPINDEX.CONTROLLERS[METHOD[0]][METHOD[1]];

                    } else {
                        console.log("\x1b[31m%s\x1b[0m", `\nController Method ${METHOD[0]}.${METHOD[1]} not found for ROUTE-${rPath}`);
                        if(CONFIG.strict_routes) return;

                        METHOD_TYPE = "ERROR";
                        METHOD_PARAMS = `Controller Method ${METHOD[0]}.${METHOD[1]} not found`;
                    }
                } else {
                    console.log("\x1b[31m%s\x1b[0m", `\nController ${METHOD[0]} not found for ROUTE-${rPath}`);
                    if(CONFIG.strict_routes) return;

                    METHOD_TYPE = "ERROR";
                    METHOD_PARAMS = `Controller Method ${METHOD[0]}.${METHOD[1]} not found`;
                }
            break;
            default:
                METHOD_TYPE = "DATA";
                METHOD_PARAMS = config.data;
        }
        // console.log("XXXXXXX", METHOD_TYPE, METHOD_PARAMS, rPath);

        APPINDEX.ROUTES[`${method}::${rPath}`] = config;

        switch(METHOD_TYPE) {
            case "DATA":
                switch(method) {
                    case "GET":
                        server.get(rPath, (req, res, next) => {
                            //console.log("ROUTE_GET_CONFIG", config, METHOD_TYPE, METHOD_PARAMS);
        
                            res.send({
                                "status": "success",
                                "data": METHOD_PARAMS
                            });
                            return next();
                        });
                        break;
                    case "POST":
                        server.post(rPath, (req, res, next) => {
                            //console.log("ROUTE_POST_CONFIG", config, METHOD_TYPE, METHOD_PARAMS);
        
                            res.send({
                                "status": "success",
                                "data": METHOD_PARAMS
                            });
                            return next();
                        });
                        break;
                    case "PUT":
                        server.put(rPath, (req, res, next) => {
                            //console.log("ROUTE_PUT_CONFIG", config, METHOD_TYPE, METHOD_PARAMS);
        
                            res.send({
                                "status": "success",
                                "data": METHOD_PARAMS
                            });
                            return next();
                        });
                        break;
                    case "DELETE":
                        server.del(rPath, (req, res, next) => {
                            //console.log("ROUTE_DELETE_CONFIG", config, METHOD_TYPE, METHOD_PARAMS);
        
                            res.send({
                                "status": "success",
                                "data": METHOD_PARAMS
                            });
                            return next();
                        });
                        break;
        
                    default:
                        console.log("\x1b[31m%s\x1b[0m",`Error registering Route Path - ${rPath}@${method}`);
                        res.send({
                            "status": "ERROR",
                            "msg": "Route Method Not Supported"
                        });
                        return next();
                }
                break;
            case "ERROR":
                switch(method) {
                    case "GET":
                        server.get(rPath, (req, res, next) => {
                            //console.log("ROUTE_GET_CONFIG", config, METHOD_TYPE, METHOD_PARAMS);
        
                            res.send({
                                "status": "error",
                                "data": METHOD_PARAMS
                            });
                            return next();
                        });
                        break;
                    case "POST":
                        server.post(rPath, (req, res, next) => {
                            //console.log("ROUTE_POST_CONFIG", config, METHOD_TYPE, METHOD_PARAMS);
        
                            res.send({
                                "status": "error",
                                "data": METHOD_PARAMS
                            });
                            return next();
                        });
                        break;
                    case "PUT":
                        server.put(rPath, (req, res, next) => {
                            //console.log("ROUTE_PUT_CONFIG", config, METHOD_TYPE, METHOD_PARAMS);
        
                            res.send({
                                "status": "error",
                                "data": METHOD_PARAMS
                            });
                            return next();
                        });
                        break;
                    case "DELETE":
                        server.del(rPath, (req, res, next) => {
                            //console.log("ROUTE_DELETE_CONFIG", config, METHOD_TYPE, METHOD_PARAMS);
        
                            res.send({
                                "status": "error",
                                "data": METHOD_PARAMS
                            });
                            return next();
                        });
                        break;
        
                    default:
                        console.log("\x1b[31m%s\x1b[0m",`Error registering Route Path - ${rPath}@${method}`);
                        res.send({
                            "status": "ERROR",
                            "msg": "Route Method Not Supported"
                        });
                        return next();
                }
                break;
            case "CONTROLLER":
                switch(method) {
                    case "GET":
                        server.get(rPath, (req, res, next) => {
                            // console.log("ROUTE_GET_CONFIG", config, METHOD_TYPE, METHOD_PARAMS);
        
                            METHOD_PARAMS(_.extend({}, req.params, req.query), function(data, msgObj, errObj) {
                                // console.log("XXXX", config.processor, data, APPINDEX.PROCESSORS);

                                if(errObj) {
                                    res.send({
                                        "status": "error",
                                        "msg": msgObj,
                                        "errors": errObj
                                    });
                                    return next();
                                } else {
                                    if(config.processor && config.processor.length>0 && config.processor.split(".").length>1) {
                                        const processorObj = config.processor.split(".");
                                        if(APPINDEX.PROCESSORS[processorObj[0].toUpperCase()] && typeof APPINDEX.PROCESSORS[processorObj[0].toUpperCase()][processorObj[1]]=="function") {
                                            APPINDEX.PROCESSORS[processorObj[0].toUpperCase()][processorObj[1]](data, config, req, function(resultData) {
                                                res.send({
                                                    "status": "success",
                                                    "msg": msgObj,
                                                    "data": resultData
                                                });
                                                return next();
                                            });
                                        } else if(CONFIG.strict_processors) {
                                            res.send({
                                                "status": "error",
                                                "msg": "Output Processor Error",
                                                "errors": processorObj
                                            });
                                            return next();
                                        } else {
                                            res.send({
                                                "status": "success",
                                                "msg": msgObj,
                                                "data": data
                                            });
                                            return next();
                                        }
                                    } else {
                                        res.send({
                                            "status": "success",
                                            "msg": msgObj,
                                            "data": data
                                        });
                                        return next();
                                    }
                                }
                            }, req, res);
                        });
                        break;
                    case "POST":
                        server.post(rPath, (req, res, next) => {
                            //console.log("ROUTE_POST_CONFIG", config, METHOD_TYPE, METHOD_PARAMS);
        
                            METHOD_PARAMS({
                                "PARAMS": _.extend({}, req.params, req.query),
                                "BODY": req.body
                            }, function(data, msgObj, errObj) {
                                if(errObj) {
                                    res.send({
                                        "status": "error",
                                        "msg": msgObj,
                                        "errors": errObj
                                    });
                                    return next();
                                } else {
                                    if(config.processor && config.processor.length>0 && config.processor.split(".").length>1) {
                                        const processorObj = config.processor.split(".");
                                        if(APPINDEX.PROCESSORS[processorObj[0].toUpperCase()] && typeof APPINDEX.PROCESSORS[processorObj[0].toUpperCase()][processorObj[1]]=="function") {
                                            APPINDEX.PROCESSORS[processorObj[0].toUpperCase()][processorObj[1]](data, config, req, function(resultData) {
                                                res.send({
                                                    "status": "success",
                                                    "msg": msgObj,
                                                    "data": resultData
                                                });
                                                return next();
                                            });
                                        } else if(CONFIG.strict_processors) {
                                            res.send({
                                                "status": "error",
                                                "msg": "Output Processor Error",
                                                "errors": processorObj
                                            });
                                            return next();
                                        } else {
                                            res.send({
                                                "status": "success",
                                                "msg": msgObj,
                                                "data": data
                                            });
                                            return next();
                                        }
                                    } else {
                                        res.send({
                                            "status": "success",
                                            "msg": msgObj,
                                            "data": data
                                        });
                                        return next();
                                    }
                                }
                            }, req, res);
                        });
                        break;
                    case "PUT":
                        server.put(rPath, (req, res, next) => {
                            //console.log("ROUTE_PUT_CONFIG", config, METHOD_TYPE, METHOD_PARAMS);
        
                            METHOD_PARAMS({
                                "PARAMS": _.extend({}, req.params, req.query),
                                "BODY": req.body
                            }, function(data, msgObj, errObj) {
                                if(errObj) {
                                    res.send({
                                        "status": "error",
                                        "msg": msgObj,
                                        "errors": errObj
                                    });
                                    return next();
                                } else {
                                    if(config.processor && config.processor.length>0 && config.processor.split(".").length>1) {
                                        const processorObj = config.processor.split(".");
                                        if(APPINDEX.PROCESSORS[processorObj[0].toUpperCase()] && typeof APPINDEX.PROCESSORS[processorObj[0].toUpperCase()][processorObj[1]]=="function") {
                                            APPINDEX.PROCESSORS[processorObj[0].toUpperCase()][processorObj[1]](data, config, req, function(resultData) {
                                                res.send({
                                                    "status": "success",
                                                    "msg": msgObj,
                                                    "data": resultData
                                                });
                                                return next();
                                            });
                                        } else if(CONFIG.strict_processors) {
                                            res.send({
                                                "status": "error",
                                                "msg": "Output Processor Error",
                                                "errors": processorObj
                                            });
                                            return next();
                                        } else {
                                            res.send({
                                                "status": "success",
                                                "msg": msgObj,
                                                "data": data
                                            });
                                            return next();
                                        }
                                    } else {
                                        res.send({
                                            "status": "success",
                                            "msg": msgObj,
                                            "data": data
                                        });
                                        return next();
                                    }
                                }
                            }, req, res);
                        });
                        break;
                    case "DELETE":
                        server.del(rPath, (req, res, next) => {
                            //console.log("ROUTE_DELETE_CONFIG", config, METHOD_TYPE, METHOD_PARAMS);
        
                            METHOD_PARAMS({
                                "PARAMS": _.extend({}, req.params, req.query),
                                "BODY": req.body
                            }, function(data, msgObj, errObj) {
                                if(errObj) {
                                    res.send({
                                        "status": "error",
                                        "msg": msgObj,
                                        "errors": errObj
                                    });
                                    return next();
                                } else {
                                    if(config.processor && config.processor.length>0 && config.processor.split(".").length>1) {
                                        const processorObj = config.processor.split(".");
                                        if(APPINDEX.PROCESSORS[processorObj[0].toUpperCase()] && typeof APPINDEX.PROCESSORS[processorObj[0].toUpperCase()][processorObj[1]]=="function") {
                                            APPINDEX.PROCESSORS[processorObj[0].toUpperCase()][processorObj[1]](data, config, req, function(resultData) {
                                                res.send({
                                                    "status": "success",
                                                    "msg": msgObj,
                                                    "data": resultData
                                                });
                                                return next();
                                            });
                                        } else if(CONFIG.strict_processors) {
                                            res.send({
                                                "status": "error",
                                                "msg": "Output Processor Error",
                                                "errors": processorObj
                                            });
                                            return next();
                                        } else {
                                            res.send({
                                                "status": "success",
                                                "msg": msgObj,
                                                "data": data
                                            });
                                            return next();
                                        }
                                    } else {
                                        res.send({
                                            "status": "success",
                                            "msg": msgObj,
                                            "data": data
                                        });
                                        return next();
                                    }
                                }
                            }, req, res);
                        });
                        break;
        
                    default:
                        console.log("\x1b[31m%s\x1b[0m",`Error registering Route Path - ${rPath}@${method}`);
                        res.send({
                            "status": "ERROR",
                            "msg": "Route Method Not Supported"
                        });
                        return next();
                }
                break;
            default:
                switch(method) {
                    case "GET":
                        server.get(rPath, (req, res, next) => {
                            console.log("ROUTE_GET_CONFIG", config, METHOD_TYPE, METHOD_PARAMS);
        
                            res.send({});
                            return next();
                        });
                        break;
                    case "POST":
                        server.post(rPath, (req, res, next) => {
                            console.log("ROUTE_POST_CONFIG", config, METHOD_TYPE, METHOD_PARAMS);
        
                            res.send({});
                            return next();
                        });
                        break;
                    case "PUT":
                        server.put(rPath, (req, res, next) => {
                            console.log("ROUTE_PUT_CONFIG", config, METHOD_TYPE, METHOD_PARAMS);
        
                            res.send({});
                            return next();
                        });
                        break;
                    case "DELETE":
                        server.del(rPath, (req, res, next) => {
                            console.log("ROUTE_DELETE_CONFIG", config, METHOD_TYPE, METHOD_PARAMS);
        
                            res.send({});
                            return next();
                        });
                        break;
        
                    default:
                        console.log("\x1b[31m%s\x1b[0m",`Error registering Route Path - ${rPath}@${method}`);
                        res.send({
                            "status": "ERROR",
                            "msg": "Route Method Not Supported"
                        });
                        return next();
                }
        }
    }

    return this;
}


function generateController(controllerID, controllerConfig) {
    var newController = {};

    _.each(controllerConfig, function(confOriginal, funcKey) {
        newController[funcKey] = function(params, callback) {
            var conf = _.cloneDeep(confOriginal);
            // console.log("GENERATED_CONTROLLER", funcKey, params, conf, confOriginal, controllerConfig[funcKey]);

            switch(conf.type) {
                case "sql":
                    //console.log("conf", conf.where);
                    var additionalQuery = "";
                    if(conf.group_by) additionalQuery += ` GROUP BY ${conf.group_by}`;
                    if(conf.order_by) additionalQuery += ` ORDER BY ${conf.order_by}`;

                    if(!conf.where) conf.where = {};
                    _.each(conf.where, function(v,k) {
                        conf.where[k] = _replace(v, params);
                    })

                    db_selectQ("MYSQL0", conf.table, conf.columns, conf.where, {}, function(data, errorMsg) {
                        //console.log("XXXXXXX", data, errorMsg);
                        if(errorMsg) callback([], "", errorMsg);
                        else callback(data, "");
                    }, additionalQuery);
                    break;
                default:
                    callback(false, "", "Controller Not Found");
            }
        }
    });

    return newController;
}
