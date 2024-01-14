/*
 * All Plugins are loaded and configured here
 * 
 * */
module.exports = function(server, restify) {
    /**
     * Preeware
    */
    server.pre(restify.plugins.pre.context());
    server.pre(restify.plugins.pre.dedupeSlashes());
    server.pre(restify.plugins.pre.sanitizePath());

    /**
     * Middleware
    */
    server.use(restify.plugins.bodyParser({ 
            mapParams: false, 
            allowDots: true,
            maxBodySize: 0,
            overrideParams: false,
            maxFieldsSize: 2 * 1024 * 1024
        }));//req.body
    //server.use(restify.plugins.jsonBodyParser({ mapParams: true }));
    // server.use(restify.plugins.jsonp());
    server.use(restify.plugins.urlEncodedBodyParser());
    server.use(restify.plugins.queryParser({ mapParams: false }));//req.query
    server.use(restify.plugins.acceptParser(server.acceptable));
    
    server.use(restify.plugins.dateParser());
    server.use(restify.plugins.fullResponse());
    server.use(restify.plugins.gzipResponse());
    server.use(restify.plugins.throttle({
                burst: 10,  // Max 10 concurrent requests (if tokens)
                rate: 0.5,  // Steady state: 1 request / 2 seconds
                ip: true,   // throttle per IP
                overrides: {
                    'localhost': {
                        burst: 0,
                        rate: 0    // unlimited
                    }
                }
            }));

    // server.use(restify.plugins.authorizationParser({
    //             scheme: "Basic",
    //             //credentials: "",
    //             basic: {
    //                 username: "bkm",
    //                 password: "test123"
    //             }
    //         }));
}
