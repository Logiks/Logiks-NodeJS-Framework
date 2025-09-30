/*
 * All Security Logic is written here
 * 
 * */

const jwt = require('jsonwebtoken');

if (CONFIG.IPWHITELISTING == null) CONFIG.IPWHITELISTING = {};

module.exports = function (server) {

    server.use(function (req, res, next) {
        if (req.method.toUpperCase() == "OPTIONS") {
            return next();
        }

        // console.log("REQUEST", req.path(), req.params, req.query, req.body, req.headers, req.headers.host, MISC.getClientIP(req));
        
        const pathVar = req.path().split("/");

        // console.log("REQ_URL", pathVar, CONFIG.NOAUTH, CONFIG.NOAUTH.indexOf("/"+pathVar[1]));
        if (CONFIG.NOAUTH.indexOf(req.path()) >= 0 || CONFIG.NOAUTH.indexOf("/" + pathVar[1]) >= 0) {
            return next();
        }

        var remoteIP = MISC.getClientIP(req);
        req.set("CLIENTIP", remoteIP);
        var pathGroup = req.path().split("/").splice(0, 3).join("/");

        //console.log("AUTHIP", remoteIP, req.path(), CONFIG.IPWHITELISTING[req.path()], (CONFIG.IPWHITELISTING[req.path()].indexOf("*")>=0 || CONFIG.IPWHITELISTING[req.path()].indexOf(remoteIP)>=0));

        if (CONFIG.IPWHITELISTING[req.path()] != null) {
            ipArr = CONFIG.IPWHITELISTING[req.path()];
            if (ipArr.indexOf("*") >= 0 || ipArr.indexOf(remoteIP) >= 0) {
                return next();
            }
        }

        if (CONFIG.IPWHITELISTING[pathGroup] != null) {
            ipArr = CONFIG.IPWHITELISTING[pathGroup];
            if (ipArr.indexOf("*") >= 0 || ipArr.indexOf(remoteIP) >= 0) {
                return next();
            }
        }

        if (CONFIG.IPWHITELISTING["/" + pathVar[1]] != null) {
            ipArr = CONFIG.IPWHITELISTING["/" + pathVar[1]];

            if (ipArr.indexOf("*") >= 0 || ipArr.indexOf(remoteIP) >= 0) {
                return next();
            }
        }
        const authorization = req.header("authorization");
        var appID = req.header("appid");
        var sessKey = req.header("sesskey");
        var currentUserId = "";
        
        if(sessKey==null) {
            sessKey = sha1(req.header("authorization")+req.header("appid")+new moment());
        }

        if(authorization==null) {
            return next(new errors.UnauthorizedError("Authorization Header Missing"));
        }

        const authKey = authorization.split(" ");
        if(authKey[1]==null || authKey[1].length==0) {
            return next(new errors.UnauthorizedError("Authorization Header Is Blank"));
        }

        // console.log("AUTH_XXXX", authorization, authKey, appID);

        AUTHKEY.fetchAuthInfo(authKey[1], async function (authInfo) {
                if(!authInfo) {
                    return next(new errors.UnauthorizedError("Authorization Key Invalid"));
                }
                if(authInfo.guid=="global") {
                    authInfo.jwt_token_required = "true";
                }

                //console.log(authInfo, remoteIP);
                //authInfo.auth_secret
                //authInfo.active_time_start
                //authInfo.active_time_end
                //authInfo.threshold

                if(authInfo.checksum_check==="true") {
                    const hashkey = req.header("hashkey");
                    if(authInfo.checksum_check!=sha1(authInfo.auth_secret+JSON.stringify(req.body))) {
                        return next(new errors.UnauthorizedError("Authorization Failed, Checksum Mismatch Error"));
                    }
                }

                if(authInfo.jwt_token_required=="true") {
                    const jwtToken = req.header("auth-token");

                    if(jwtToken==null || jwtToken.length==0) {
                        return next(new errors.UnauthorizedError("Authorization Failed, Invalid JWT Token Error"));
                    }

                    //return next(new errors.UnauthorizedError("Authorization Failed, JWT Token Not Supported"));

                    try {
                        sessKey = sha1(CONFIG.AUTHJWT.secret + jwtToken);

                        const userSessData = await _CACHE.fetchDataSync("USERDATA." + sessKey);
                        if(!userSessData) {
                            return next(new errors.UnauthorizedError("Authorization Failed, Session Expired or Invalid"));
                        }

                        authInfo.guid = userSessData.guid;
                        authInfo.userid = userSessData.uuid;
                        authInfo.privilege = userSessData.privilege?userSessData.privilege:"user";
                        authInfo.role = userSessData.role?userSessData.role:"user";

                        appID = userSessData.appid;

                        // var decodedData = jwt.verify(jwtToken, CONFIG.AUTHJWT.secret);
                        // decodedData.payload = JSON.parse(CRYPTO.decrypt(decodedData.payload, authInfo.auth_secret));
                        // // console.log("JWT DECODED", decodedData);

                        // authInfo.guid = decodedData.payload.guid;
                        // authInfo.userid = decodedData.payload.uuid;
                        // authInfo.privilege = decodedData.payload.privilege?decodedData.payload.privilege:"user";
                        // authInfo.role = decodedData.payload.role?decodedData.payload.role:"user";
                        // appID = decodedData.payload.appid;
                        
                    } catch (e) {
                        logger.error("JWT ERROR", e);
                        return next(new errors.UnauthorizedError("Authorization Failed, JWT Token Is Invalid"));
                    }
                }

                if(authInfo.ipwhitelists!=null && authInfo.ipwhitelists.length>1) {
                    authInfo.ipwhitelists = authInfo.ipwhitelists.split(",");

                    if(authInfo.ipwhitelists.indexOf(remoteIP)<0) {
                        return next(new errors.UnauthorizedError("Authorization Failed, IPWHITELISTING Required to access this service"));
                    }
                }

                if(authInfo.scope!=null || authInfo.scope.length>0) {
                    try {
                        authInfo.scope = JSON.parse(authInfo.scope);

                        if(authInfo.scope.APPS==null) authInfo.scope.APPS = [appID];
                    } catch(e) {
                        return next(new errors.UnauthorizedError("Authorization Failed, Invalid Scope Setup (1)"));
                    }
                } else {
                    return next(new errors.UnauthorizedError("Authorization Failed, Invalid Scope Setup (2)"));
                }

                if(authInfo.scope.APPS.indexOf(appID)<0) {
                    return next(new errors.UnauthorizedError("Authorization Failed, Scope Does Not Permit Access to Requested App"));
                }

                if(authInfo.scope.ROUTES && authInfo.scope.ROUTES.length>0) {
                    if (!(authInfo.scope.ROUTES.indexOf(req.path()) >= 0 || authInfo.scope.ROUTES.indexOf("/" + pathVar[1]) >= 0)) {
                        return next(new errors.UnauthorizedError("Authorization Failed, Scope Does Not Permit Access to Requested Path"));
                    }
                }

                req.set("GUID", authInfo.guid);
                req.set("APPID", appID);
                req.set("SESSKEY", sessKey);
                req.set("USERID", authInfo.userid);
                req.set("PRIVILEGE", (authInfo.privilege!=null?authInfo.privilege:"user").toLowerCase());
                req.set("ROLE", (authInfo.role!=null?authInfo.role:"user").toLowerCase());
                
                // req.set("USER_NAME", decodedData.data.USER_NAME);
                // req.set("ROLE", decodedData.data.ROLE);

                req.set("APIUSER", true);
                req.set("ENV", authInfo.environment.toUpperCase());
                req.set("REQ_POLICY", authInfo.policy);
                req.set("REQ_SCOPE", authInfo.scope);
                req.set("AUTH_EXPIRY", authInfo.expiry);
                req.set("AUTH_THRESHOLD", authInfo.threshold);

                HOOKS.runHook("security", {"req": req});

                return next();
            });
    });
}
