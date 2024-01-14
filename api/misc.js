/*
 * All Misc Functions for Server are handled here
 * 
 * Error Handler
 * Audit Functions
 * 
 * */
module.exports = function(server, restify) {
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