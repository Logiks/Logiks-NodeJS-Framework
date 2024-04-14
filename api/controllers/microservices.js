/*
 * MicroService Controller
 * 
 * */

var MICSERVICE_CONFIG = {};

module.exports = function(server, restify) {

    initialize = function() {
        if(CONFIG.is_microservice) {
            
        } else {
            if(fs.existsSync(CONFIG.ROOT_PATH+'/app/microservices.js')) {
                try {
                    MICSERVICE_CONFIG = require(CONFIG.ROOT_PATH+'/app/microservices');
                } catch(e) {
                    console.log("\x1b[31m%s\x1b[0m", "Microservice Initialization Error", e);
                    MICSERVICE_CONFIG = {
                        "endpoints": {},
                        "router": false
                    };
                }
    
                MICSERVICE_CONFIG = _.extend({}, {
                    "router": function(req, res, next) {
                        console.log("MICROSERVICE ROUTER", req, res, next);
                
                        return next();
                    }
                }, MICSERVICE_CONFIG, (CONFIG.microservices==null?{}:CONFIG.microservices));
                // console.log(MICSERVICE_CONFIG);
                
                _.each(MICSERVICE_CONFIG.endpoints, function(conf, k) {
                    // console.log("MICROSERVICE_ENDPOINT", pathSlug, conf);
    
                    var pathSlug = conf.path;
                    
                    server.get(`/${pathSlug}/*`, (req, res, next) => {
                        // console.log("ROUTE_GET_CONFIG", req.params, req.query, req.body, req.headers);
    
                        var switch_value = false;
                        switch(conf.switch_type) {
                            case "header":
                                switch_value = req.headers[conf.switch_refid];
                            break;
                            case "param":
                                switch_value = req.params[conf.switch_refid];
                            break;
                            case "query":
                                switch_value = req.query[conf.switch_refid];
                            break;
                            case "body":
                                switch_value = req.body[conf.switch_refid];
                            break;
                        }
                        if(!switch_value) {
                            res.send({
                                "status": "error",
                                "msg": "Missing proxy switch value"
                            });
                            return next();
                        }
                        if(conf.strategy[switch_value]==null) {
                            res.send({
                                "status": "error",
                                "msg": "Missing proxy switch strategy"
                            });
                            return next();
                        }
    
                        if(conf.strategy[switch_value]['processor']!=null && typeof conf.strategy[switch_value]['processor']=="function") {
                            req = conf.strategy[switch_value]['processor'](req);
                        }
                        
                        var target_url = `${conf.strategy[switch_value]['proxy_url']}/${req.params["*"]}`;
                        // console.log("XXXXX", target_url, req.params, req.query, req.body, req.headers);
                        
                        delete req.params['*'];
    
                        var options = {
                            method: 'GET',
                            url: target_url,
                            params: _.extend({}, req.params, req.query),
                            headers: req.headers
                          };
                          
                        axios.request(options).then(function (response) {
                            //console.log("OOOO", response);
                            res.send({
                                "status": "success",
                                "data": response.data
                            });
                            return next();
                        }).catch(function (error) {
                            //console.log("OOOO", response);
                            if(error.response==null) {
                                res.send({
                                    "status": "error",
                                    "msg": "timeout"
                                });
                                return next();
                            }
                            res.send({
                                "status": "error",
                                "msg": "Microservice Error",
                                "data": error.response.data
                            });
                            return next();
                        });
                    });
        
                    server.post(`/${pathSlug}/*`, (req, res, next) => {
                        // console.log("ROUTE_POST_CONFIG", req.params, req.query, req.body, req.headers);
        
                        var switch_value = false;
                        switch(conf.switch_type) {
                            case "header":
                                switch_value = req.headers[conf.switch_refid];
                            break;
                            case "param":
                                switch_value = req.params[conf.switch_refid];
                            break;
                            case "query":
                                switch_value = req.query[conf.switch_refid];
                            break;
                            case "body":
                                switch_value = req.body[conf.switch_refid];
                            break;
                        }
                        if(!switch_value) {
                            res.send({
                                "status": "error",
                                "msg": "Missing proxy switch value"
                            });
                            return next();
                        }
                        if(conf.strategy[switch_value]==null) {
                            res.send({
                                "status": "error",
                                "msg": "Missing proxy switch strategy"
                            });
                            return next();
                        }
    
                        if(conf.strategy[switch_value]['processor']!=null && typeof conf.strategy[switch_value]['processor']=="function") {
                            req = conf.strategy[switch_value]['processor'](req);
                        }
                        
                        var target_url = `${conf.strategy[switch_value]['proxy_url']}/${req.params["*"]}`;
                        // console.log("XXXXX", target_url, req.params, req.query, req.body, req.headers);
                        
                        delete req.params['*'];
    
                        var options = {
                            method: 'POST',
                            url: target_url,
                            params: _.extend({}, req.params, req.query),
                            body: req.body,
                            headers: req.headers
                          };
                          
                        axios.request(options).then(function (response) {
                            //console.log("OOOO", response);
                            res.send({
                                "status": "success",
                                "data": response.data
                            });
                            return next();
                        }).catch(function (error) {
                            //console.log("OOOO", response);
                            if(error.response==null) {
                                res.send({
                                    "status": "error",
                                    "msg": "timeout"
                                });
                                return next();
                            }
                            res.send({
                                "status": "error",
                                "msg": "Microservice Error",
                                "data": error.response.data
                            });
                            return next();
                        });
                    });

                    server.put(`/${pathSlug}/*`, (req, res, next) => {
                        // console.log("ROUTE_POST_CONFIG", req.params, req.query, req.body, req.headers);
        
                        var switch_value = false;
                        switch(conf.switch_type) {
                            case "header":
                                switch_value = req.headers[conf.switch_refid];
                            break;
                            case "param":
                                switch_value = req.params[conf.switch_refid];
                            break;
                            case "query":
                                switch_value = req.query[conf.switch_refid];
                            break;
                            case "body":
                                switch_value = req.body[conf.switch_refid];
                            break;
                        }
                        if(!switch_value) {
                            res.send({
                                "status": "error",
                                "msg": "Missing proxy switch value"
                            });
                            return next();
                        }
                        if(conf.strategy[switch_value]==null) {
                            res.send({
                                "status": "error",
                                "msg": "Missing proxy switch strategy"
                            });
                            return next();
                        }
    
                        if(conf.strategy[switch_value]['processor']!=null && typeof conf.strategy[switch_value]['processor']=="function") {
                            req = conf.strategy[switch_value]['processor'](req);
                        }
                        
                        var target_url = `${conf.strategy[switch_value]['proxy_url']}/${req.params["*"]}`;
                        // console.log("XXXXX", target_url, req.params, req.query, req.body, req.headers);
                        
                        delete req.params['*'];
    
                        var options = {
                            method: 'PUT',
                            url: target_url,
                            params: _.extend({}, req.params, req.query),
                            body: req.body,
                            headers: req.headers
                          };
                          
                        axios.request(options).then(function (response) {
                            //console.log("OOOO", response);
                            res.send({
                                "status": "success",
                                "data": response.data
                            });
                            return next();
                        }).catch(function (error) {
                            //console.log("OOOO", response);
                            if(error.response==null) {
                                res.send({
                                    "status": "error",
                                    "msg": "timeout"
                                });
                                return next();
                            }
                            res.send({
                                "status": "error",
                                "msg": "Microservice Error",
                                "data": error.response.data
                            });
                            return next();
                        });
                    });

                    server.del(`/${pathSlug}/*`, (req, res, next) => {
                        // console.log("ROUTE_POST_CONFIG", req.params, req.query, req.body, req.headers);
        
                        var switch_value = false;
                        switch(conf.switch_type) {
                            case "header":
                                switch_value = req.headers[conf.switch_refid];
                            break;
                            case "param":
                                switch_value = req.params[conf.switch_refid];
                            break;
                            case "query":
                                switch_value = req.query[conf.switch_refid];
                            break;
                            case "body":
                                switch_value = req.body[conf.switch_refid];
                            break;
                        }
                        if(!switch_value) {
                            res.send({
                                "status": "error",
                                "msg": "Missing proxy switch value"
                            });
                            return next();
                        }
                        if(conf.strategy[switch_value]==null) {
                            res.send({
                                "status": "error",
                                "msg": "Missing proxy switch strategy"
                            });
                            return next();
                        }
    
                        if(conf.strategy[switch_value]['processor']!=null && typeof conf.strategy[switch_value]['processor']=="function") {
                            req = conf.strategy[switch_value]['processor'](req);
                        }
                        
                        var target_url = `${conf.strategy[switch_value]['proxy_url']}/${req.params["*"]}`;
                        // console.log("XXXXX", target_url, req.params, req.query, req.body, req.headers);
                        
                        delete req.params['*'];
    
                        var options = {
                            method: 'DEL',
                            url: target_url,
                            params: _.extend({}, req.params, req.query),
                            body: req.body,
                            headers: req.headers
                          };
                          
                        axios.request(options).then(function (response) {
                            //console.log("OOOO", response);
                            res.send({
                                "status": "success",
                                "data": response.data
                            });
                            return next();
                        }).catch(function (error) {
                            //console.log("OOOO", response);
                            if(error.response==null) {
                                res.send({
                                    "status": "error",
                                    "msg": "timeout"
                                });
                                return next();
                            }
                            res.send({
                                "status": "error",
                                "msg": "Microservice Error",
                                "data": error.response.data
                            });
                            return next();
                        });
                    });
                })
    
                console.log("MicroServices Initialized");
            }
        }
    }

    return this;
}