/*
 * All Security Logic is written here
 * 
 * */
module.exports = function(server) {

    server.use(function(req, res, next) {
        // return next(
        //     new errors.ForbiddenError("Public Key Invalid"),
        // );

        var authkey = req.header("authkey");

        req.set("GUID", "TEST");

        //API Validator : FIND API Authentication Protocol for the GUID
        //Could be Bearer, OAuth2, 2FA, etc.
        var authHeader = req.header("authorization");

        //console.log("Security Authorization");

        return next();
    });


    // const rjwt = require('restify-jwt-community');

    // // using restify-jwt to lock down everything except /auth
    // server.use(rjwt(server.config.jwt).unless({
    //       path: server.config.noauth,
    //       method: 'OPTIONS'
    //   }));

    // server.use((req, res, next) => {
    //     if(req.method=="OPTIONS") {
    //       return next();
    //     }
    //     if(req.user==null) {
    //       if(server.config.noauth.indexOf(req._url.path)>=0) {
    //         //console.log("NoAuth Request Allowed",req._url.path);
    //       } else {
    //         console.log("NoAuth Request Denied",req._url.path);
    //         return next(new errs.UnauthorizedError("No Authorization Available"));
    //       }
    //     } else {
    //       pathParent = req._url.path.split("/")[1] + "/";
    //       req.user.scope.push("/auth/info");
    //       //console.log(pathParent,req._url.path,req.user.scope);
    //       if(req.user.scope.indexOf("*")>=0 || req.user.scope.indexOf(req._url.path)>=0 || req.user.scope.indexOf(pathParent)>=0) {
    //         console.log("New Authorized Request Allowed");
    //       } else {
    //         console.log("Auth Request Denied Due to Scope");
    //         return next(new errs.UnauthorizedError("Out of Scope Error"));
    //       }
    //     }
    //     return next();
    // });
}
