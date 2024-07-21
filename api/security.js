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

        //console.log("WWWW", req.params, req.query, req.body, req.headers);
        //req.headers.host
        const pathVar = req.path().split("/");

        // console.log("REQ_URL", pathVar, CONFIG.NOAUTH, CONFIG.NOAUTH.indexOf("/"+pathVar[1]));
        if (CONFIG.NOAUTH.indexOf(req.path()) >= 0 || CONFIG.NOAUTH.indexOf("/" + pathVar[1]) >= 0) {
            return next();
        }

        var remoteIP = req.headers['x-forwarded-for'];
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

        var apiKey = req.header("apikey");


        var authorization = req.header("authorization");
        const authKey = authorization = authorization?.split(" ")[1];
        const currentUserId = req.header("cur_user");
        // console.log('authKey, currentUserId - ', authKey, currentUserId)
        if (authKey == "GhdV87EyaBdQEssIdVKb" && currentUserId?.length) {
            // console.log('currentUserId - ', currentUserId)
            console.log('validating with auth header...')
            try {
                if (!currentUserId) {
                    return next(
                        new errors.UnauthorizedError("Current User Not Provided"),
                    );
                }

                _CACHE.fetchData("WEB_USERDATA." + currentUserId, function (userSessData) {
                    // console.log('userSessData - ', userSessData)
                    if (!userSessData?.length) {
                        USERS.getUserInfoById(currentUserId, function (userData) {
                            // console.log('userData - ', userData)
                            if (!userData) {
                                return next(
                                    new errors.UnauthorizedError("Invalid Current User."),
                                );
                            } else {
                                const cacheResult = _CACHE.storeData("WEB_USERDATA." + currentUserId, userData);
                                // console.log('cacheResult - ', cacheResult)
                                req.set("GUID", userData.guid);
                                req.set("USERID", userData.userid);
                                req.set("USER_NAME", userData.full_name);
                                req.set("DESIGNATION", userData.designation);
                                req.set("PRIVILEGE", userData.privilege);//bcm
                                req.set("ROLE", userData.role);//bcm
                                req.set("BANK", userData.bank);
                                req.set("BRANCH", userData.branch);
                                req.set("STATE", userData.state);
                                req.set("ZONE", userData.zone);
                                req.set("AREA", userData.area);
                                console.log('req.headers - ', req.get('USERID'), req.get('PRIVILEGE'))
                                return next();
                            }
                        })
                    } else {
                        req.set("GUID", userSessData.GUID);
                        req.set("USERID", userSessData.USERID);
                        req.set("USER_NAME", userSessData.USER_NAME);
                        req.set("DESIGNATION", userSessData.DESIGNATION);
                        req.set("PRIVILEGE", userSessData.PRIVILEGE);//bcm
                        req.set("ROLE", userSessData.ROLE);//bcm
                        req.set("BANK", userSessData.BANK);
                        req.set("BRANCH", userSessData.BRANCH);
                        req.set("STATE", userSessData.STATE);
                        req.set("ZONE", userSessData.ZONE);
                        req.set("AREA", userSessData.AREA);
                        return next();
                    }
                });
            } catch (err) {
                logger.error("AUTH HEADER ERROR", err);
                return next(
                    new errors.UnauthorizedError("Invalid Auth Header"),
                );
            }
        } else {
            //get APIKEY DATA FROM DB
            // console.log('req - ', req.url, req.headers)
            var jwtToken = req.header("token");
            // console.log('jwtToken - ', jwtToken)
            if (jwtToken == null) {
                return next(
                    new errors.UnauthorizedError("Auth Token Invalid"),
                );
            }

            try {
                console.log('validating with jwt token...')
                var decodedData = jwt.verify(jwtToken, CONFIG.AUTHJWT.secret);
                // console.log("JWT DECODED",decodedData, Math.floor(Date.now() / 1000));
                var sessKey = md5(CONFIG.AUTHJWT.secret + jwtToken);

                _CACHE.fetchData("USERDATA." + sessKey, function (userSessData) {
                    // console.log("usersess data", userSessData);
                    if (!userSessData) {
                        return next(
                            new errors.UnauthorizedError("Auth Token Invalid Data"),
                        );
                    }

                    sessKey = md5(CONFIG.AUTHJWT.secret + jwtToken);
                    console.log("ACCESSID", userSessData, sessKey, decodedData.data.USERID);
                    if (userSessData.SESSKEY != sessKey) {
                        console.log("SESSKEY MISMATCH - MULTILOGIN", sessKey, userSessData.SESSKEY);
                        // return next(
                        //     new errors.UnauthorizedError("Multilogin Error"),
                        // );
                    }
                    // console.log("decodedData", decodedData);

                    req.set("GUID", decodedData.data.GUID);
                    req.set("USERID", decodedData.data.USERID);
                    req.set("USER_NAME", decodedData.data.USER_NAME);
                    req.set("DESIGNATION", decodedData.data.DESIGNATION);
                    req.set("PRIVILEGE", decodedData.data.PRIVILEGE);//bcm
                    req.set("ROLE", decodedData.data.ROLE);//bcm
                    req.set("BANK", decodedData.data.BANK);
                    req.set("BRANCH", decodedData.data.BRANCH);
                    req.set("STATE", decodedData.data.STATE);
                    req.set("ZONE", decodedData.data.ZONE);
                    req.set("AREA", decodedData.data.AREA);


                    req.set("SESSKEY", sessKey);
                    req.set("APIUSER", false);

                    return next();
                });
            } catch (err) {
                logger.error("JWT ERROR", err);

                return next(
                    new errors.UnauthorizedError("Auth Token Invalid or Expired"),
                );
            }
        }


    });
}
