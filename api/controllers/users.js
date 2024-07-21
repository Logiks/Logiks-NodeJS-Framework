/*
 * Users Controller
 * 
 * */

global.sha1 = require('sha1');

module.exports = function(server, restify) {

    initialize = function() {
        if(CONFIG.cache.enable) {
            console.log("Users Initialized");
        } else {
            return false;
        }
    }

    listUsers = function(whereCond, callback) {
        if(whereCond==null) whereCond = {};
        db_selectQ("MYSQL1", "lgks_users", "*", whereCond, {}, function (userInfo) {
                if (userInfo) {
                    callback(userInfo)
                } else {
                    callback([])
                }
            });
    }

    getUserInfo = function(userid, callback) {
        db_selectQ("MYSQL1", "lgks_users", "*", {
                userid: userid,
            },{}, function (userInfo) {
                if (userInfo) {
                    callback(userInfo[0])
                } else {
                    callback(false)
                }
            });
    }

    verifyUser = function(userid, password, callback) {
        //var final_password = md5(CONFIG.ENC_SALT+""+password);
        // console.log("verifyUser", userid, password);

        db_selectQ("MYSQL1", "lgks_users,lgks_privileges,lgks_access,lgks_users_group", 
            "lgks_users.*,lgks_privileges.name as privilege_name, lgks_access.sites as scope_sites,lgks_users_group.bank,lgks_users_group.branch,lgks_users_group.state,lgks_users_group.zone,lgks_users_group.area", {
                "userid": userid,
                "lgks_users.blocked": 'false',
                "lgks_privileges.blocked": 'false',
                "lgks_users.privilegeid=lgks_privileges.id": "RAW",
                "lgks_users.accessid=lgks_access.id": "RAW",
                "lgks_users.groupid=lgks_users_group.id": "RAW",
            },{}, function (userInfo) {
                if(!userInfo) {
                    callback(false, "Userid or Password incorrect");
                    return;
                }
                userInfo = userInfo[0];
                var encrypted_password = sha1(md5(password));
                if(userInfo.pwd!=encrypted_password) {
                    callback(false, "Userid or Password incorrect");
                    return;
                }
                // console.log("userInfo-1", userInfo);
                var finalUserInfo = {
                    "guid": userInfo['guid'],
                    "userid": userInfo['userid'],
                    "privilege": userInfo['privilege_name'],
                    "priviledge": userInfo['privilege_name'],
                    "role": userInfo['privilege_name'],
                    "scope": userInfo['scope_sites'],
                    "full_name": userInfo['name'],
                    "designation": userInfo['organization_position'],
                    "bank": userInfo['bank'],
                    "branch": userInfo['branch'],
                    "state": userInfo['state'],
                    "zone": userInfo['zone'],
                    "area": userInfo['area']
                };
                callback(finalUserInfo)
            });
    }

    getUserInfoById = function(userid, callback) {
        db_selectQ("MYSQL1", "lgks_users,lgks_privileges,lgks_access,lgks_users_group", 
            "lgks_users.*,lgks_privileges.name as privilege_name, lgks_access.sites as scope_sites,lgks_users_group.bank,lgks_users_group.branch,lgks_users_group.state,lgks_users_group.zone,lgks_users_group.area", {
                "userid": userid,
                "lgks_users.blocked": 'false',
                "lgks_privileges.blocked": 'false',
                "lgks_users.privilegeid=lgks_privileges.id": "RAW",
                "lgks_users.accessid=lgks_access.id": "RAW",
                "lgks_users.groupid=lgks_users_group.id": "RAW",
            },{}, function (userInfo) {
                if(!userInfo) {
                    callback(false, "Userid incorrect");
                    return;
                }
                userInfo = userInfo[0];
                // console.log("userInfo-1", userInfo);
                var finalUserInfo = {
                    "guid": userInfo['guid'],
                    "userid": userInfo['userid'],
                    "privilege": userInfo['privilege_name'],
                    "priviledge": userInfo['privilege_name'],
                    "role": userInfo['privilege_name'],
                    "scope": userInfo['scope_sites'],
                    "full_name": userInfo['name'],
                    "designation": userInfo['organization_position'],
                    "bank": userInfo['bank'],
                    "branch": userInfo['branch'],
                    "state": userInfo['state'],
                    "zone": userInfo['zone'],
                    "area": userInfo['area']
                };
                callback(finalUserInfo)
            });
    }


    return this;
}