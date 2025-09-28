/*
 * All Additional Middlewares are defined here
 * They are loaded before routes are processed
 * 
 * */
module.exports = function(server, restify) {
     //CORS Handler
    server.use(function(req, res, next) {
        //CONFIG.cors.domains
        res.header('Access-Control-Allow-Origin', '*');//origin, req.headers.host

        if(req.method.toUpperCase()=="OPTIONS") {
            var allowHeaders = ['Accept', 'Accept-Version', 'Content-Type', 
                'Api-Version', 'Origin', 'X-Requested-With', 
                'x-data-hash', 'authorization', 'auth-token', 
                "appid", "appkey", "apikey", "sesskey"];

            res.header('Access-Control-Allow-Credentials', true);
            res.header('Access-Control-Allow-Headers', allowHeaders.join(', '));
            res.header('Access-Control-Allow-Methods', "GET, POST, OPTIONS, OPTION, PUT, DELETE, AUTHORIZATION");

            // res.header("Access-Control-Allow-Origin", "*");
            // res.header("Access-Control-Allow-Methods", req.header("Access-Control-Request-Method"));
            // res.header("Access-Control-Allow-Headers", req.header("Access-Control-Request-Headers"));
            
            return res.send(204);
        }
        return next();
    }); 

    // server.use(function slowHandler(req, res, next) {
    //         setTimeout(function() {
    //             return next();
    //         }, 500);
    //     });


    server.use(function(req, res, next) {
        if(req.userAgent()=="ELB-HealthChecker/2.0") {
            return next();
        }
        
        if(CONFIG.log_requests) {
            console.info({
                "PATH":req.path(),
                "METHOD": req.method, 
                "BODY": req.body, 
                "QUERY": req.query, 
                "PARAMS": req.params,
                "HEADERS": req.headers,
                "HOST": req.header("host"),
                "CLIENT_IP": MISC.getClientIP(req),//req.header("x-forwarded-for")
                "USER_AGENT": req.userAgent(),
            });
            
            _LOGGER.log({
                "PATH":req.path(),
                "METHOD": req.method, 
                "BODY": req.body, 
                "QUERY": req.query, 
                "PARAMS": req.params,
                "HEADERS": req.headers,
                "HOST": req.header("host"),
                "CLIENT_IP": MISC.getClientIP(req),//req.header("x-forwarded-for")
                "USER_AGENT": req.userAgent(),
            }, "requests");
        }
        
        return next();
    });

    /**
     * Post Request Configuration
     */
    // server.on('after',restify.plugins.auditLogger({
    //         event: 'after',
    //         body: true,
    //         log: server.log.child({
    //             streams : [
    //                 {
    //                     level: 'info',
    //                     path: './logs/audit.log'
    //                 }
    //             ]
    //         })
    //     })
    // );

    /**
     * Error Handlers
     */
    server.on('NotFound', function (req, res, err, cb) {
        return cb();
    });
}
