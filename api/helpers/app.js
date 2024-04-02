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
        //Initiate Mongoose

        //Load Controllers
        fs.readdirSync('./app/controllers/').forEach(function(file) {
            if ((file.indexOf(".js") > 0 && (file.indexOf(".js") + 3 == file.length))) {
                var clsName = file.replace('.js','').toUpperCase();
                var filePath = path.resolve('./app/controllers/' + file);

                global[clsName] = require(filePath);//(server, restify);
                APPINDEX.CONTROLLERS[clsName] = global[clsName];
                //console.log("> Loading Controller", clsName);
            }
        });

        //Create Data Model Indexes
        fs.readdirSync('./app/data/').forEach(function(file) {
            if ((file.indexOf(".json") > 0 && (file.indexOf(".json") + 5 == file.length))) {
                var clsName = file.replace('.json','').toUpperCase();
                var filePath = path.resolve('./app/data/' + file);

                APPINDEX.DATA[clsName] = require(filePath);
            }
        });

        //Initiate Processors
        fs.readdirSync('./app/processors/').forEach(function(file) {
            if ((file.indexOf(".js") > 0 && (file.indexOf(".js") + 3 == file.length))) {
                var clsName = file.replace('.js','').toUpperCase();
                var filePath = path.resolve('./app/processors/' + file);

                global[clsName] = require(filePath);
                APPINDEX.PROCESSORS[clsName] = global[clsName];
                //console.log("> Loading Controller", clsName);
            }
        });

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
        
        console.log("\x1b[35m%s\x1b[0m", "\nApplication Initiation Complete");
    }

    registerRoutePath = async function(rPath, method, config) {
        console.log('registerRoutePath', rPath, method, config);

        if(rPath.substr(rPath.length-1,1)=="/") rPath = rPath.substr(0, rPath.length-1);

        var METHOD_TYPE = "DATA";//DATA, ERROR, CONTROLLER
        var METHOD_PARAMS = {};

        //Process CONFIG Setup
        switch(typeof config.data) {
            case "string":
                var METHOD = config.data.split(".");
                METHOD[0] = METHOD[0].toUpperCase();
                
                if(APPINDEX.CONTROLLERS[METHOD[0]]!=null) {
                    if(APPINDEX.CONTROLLERS[METHOD[0]][METHOD[1]]!=null) {
                        console.log("METHOD FOUND", APPINDEX.CONTROLLERS[METHOD[0]][METHOD[1]]);

                        METHOD_TYPE = "CONTROLLER";
                        METHOD_PARAMS = APPINDEX.CONTROLLERS[METHOD[0]][METHOD[1]];

                    } else {
                        console.log("\x1b[31m%s\x1b[0m", `\nController Method ${METHOD[0]}.${METHOD[1]} not found for ROUTE-${rPath}`);
                        if(CONFIG.strict_routes) return;

                        METHOD_TYPE = "ERROR";
                        METHOD_PARAMS = "Controller Method ${METHOD[0]}.${METHOD[1]} not found";
                    }
                } else {
                    console.log("\x1b[31m%s\x1b[0m", `\nController ${METHOD[0]} not found for ROUTE-${rPath}`);
                    if(CONFIG.strict_routes) return;

                    METHOD_TYPE = "ERROR";
                    METHOD_PARAMS = "Controller Method ${METHOD[0]}.${METHOD[1]} not found";
                }
            break;
            default:
                METHOD_TYPE = "DATA";
                METHOD_PARAMS = config.data;
        }
        

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
                            //console.log("ROUTE_GET_CONFIG", config, METHOD_TYPE, METHOD_PARAMS);
        
                            METHOD_PARAMS(_.extend({}, req.params, req.query), function(data, msgObj, errObj) {
                                if(data) {
                                    res.send({
                                        "status": "success",
                                        "msg": msgObj,
                                        "data": data
                                    });
                                    return next();
                                } else {
                                    res.send({
                                        "status": "error",
                                        "msg": msgObj,
                                        "errors": errObj
                                    });
                                    return next();
                                }
                            }, req)
                        });
                        break;
                    case "POST":
                        server.post(rPath, (req, res, next) => {
                            //console.log("ROUTE_POST_CONFIG", config, METHOD_TYPE, METHOD_PARAMS);
        
                            METHOD_PARAMS({
                                "PARAMS": _.extend({}, req.params, req.query),
                                "BODY": req.body
                            }, function(data, msgObj, errObj) {
                                if(data) {
                                    res.send({
                                        "status": "success",
                                        "msg": msgObj,
                                        "data": data
                                    });
                                    return next();
                                } else {
                                    res.send({
                                        "status": "error",
                                        "msg": msgObj,
                                        "errors": errObj
                                    });
                                    return next();
                                }
                            }, req)
                        });
                        break;
                    case "PUT":
                        server.put(rPath, (req, res, next) => {
                            //console.log("ROUTE_PUT_CONFIG", config, METHOD_TYPE, METHOD_PARAMS);
        
                            METHOD_PARAMS({
                                "PARAMS": _.extend({}, req.params, req.query),
                                "BODY": req.body
                            }, function(data, msgObj, errObj) {
                                if(data) {
                                    res.send({
                                        "status": "success",
                                        "msg": msgObj,
                                        "data": data
                                    });
                                    return next();
                                } else {
                                    res.send({
                                        "status": "error",
                                        "msg": msgObj,
                                        "errors": errObj
                                    });
                                    return next();
                                }
                            }, req)
                        });
                        break;
                    case "DELETE":
                        server.del(rPath, (req, res, next) => {
                            //console.log("ROUTE_DELETE_CONFIG", config, METHOD_TYPE, METHOD_PARAMS);
        
                            METHOD_PARAMS({
                                "PARAMS": _.extend({}, req.params, req.query),
                                "BODY": req.body
                            }, function(data, msgObj, errObj) {
                                if(data) {
                                    res.send({
                                        "status": "success",
                                        "msg": msgObj,
                                        "data": data
                                    });
                                    return next();
                                } else {
                                    res.send({
                                        "status": "error",
                                        "msg": msgObj,
                                        "errors": errObj
                                    });
                                    return next();
                                }
                            }, req)
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