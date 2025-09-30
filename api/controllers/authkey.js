/*
 * AUTHKEY Controller
 * 
 * */

module.exports = function(server, restify) {

    initialize = function() {

    }

    fetchAuthInfo = function(authKey, callback) {
        if(CONFIG.AUTHKEY_DB) {
            db_selectQ("MYSQL0", "auth_apikeys", "*", {
                "auth_key": authKey,
                "blocked": "false"
            }, {}, function (authInfo) {
                if(authInfo) {
                    callback(authInfo[0]);
                } else {
                    callback(false);
                }
            });
        } else {
            if(CONFIG.APPKEYS!=null && CONFIG.APPKEYS[authKey]!=null) {
                callback(_.merge({
                    "guid": "global",
                    "title": "-",
                    "auth_key": authKey,
                    "auth_secret": sha1(authKey),
                    "environment": "dev",
                    "jwt_token_required": "false",
                    "checksum_check": "false",
                    "ipwhitelists": "",
                    "active_time_start": 0,
                    "active_time_end": 0,
                    "expiry": 3600,
                    "threshold": 0,
                    "policy": "{}",
                    "scope": "{}",
                    "remarks": "",
                    "blocked": "false"
                }, CONFIG.APPKEYS[authKey]));
            } else {
                callback(false);
            }
        }
    }

    return this;
}
