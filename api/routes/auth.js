/*
 * auth api routes
 * 
 * */
const jwt = require("jsonwebtoken");
module.exports = function(server) {
    if(CONFIG.is_microservice) {
        
    } else {
        server.post('/auth', (req, res, next) => {
            var vStatus = validateRule(req.body, {
                userid: 'required',
                password: 'required',
            });
    
            if (!vStatus.status) {
                res.send({
                    "status": "error",
                    "msg": "Input Validation Failed",
                    "errors": vStatus.errors
                });
                return next();
            }
    
            var userid = req.body.userid;
            var password = (req.body.password); // password will get in md5 hash form.
    
            USERS.verifyUser(userid, password, function(userInfo) {
                if(!userInfo) {
                    db_insertQ1("MYSQL1", "log_logins", {
                        "guid": userInfo.guid,
                        "loginid": userInfo.userid,
                        "timestamp": moment().format("YYYY-MM-DD HH:mm:ss"),
                        "geolocation": (req.body.geolocation)?req.body.geolocation:"0,0",
                        "uri": req.path(),
                        // "host": (req.body.host)?req.body.host:"",
                        //"server_ip": 
                        "client_ip": (req.headers['x-forwarded-for'])?req.headers['x-forwarded-for']:"",
                        "medium": (req.body.medium)?req.body.medium:"mapp",
                        "status": "FAILED",
                        "msg": "Userid or Pwd Incorrect",
                        "action": "/auth",
                    }, a=>{});

                    res.send({
                        "status": "error",
                        "msg": "Username or password is mismatch or wrong",
                        "errors": "Userid or password invalid"
                    });
                    return next();
                } else {
                    console.log("Login For User", userInfo);
                    var token = jwt.sign({
                        iat: Math.floor(Date.now() / 1000),
                        exp: Math.floor(Date.now() / 1000) + parseInt(CONFIG.AUTHJWT.expires),
                        data: encryptData(JSON.stringify({
                            GUID: userInfo.guid,
                            USERID: userInfo.userid,
                            USER_NAME: userInfo.full_name,

                            DESIGNATION: userInfo.designation,
                            PRIVILEGE: userInfo.privilege,
                            ROLE: userInfo.role,
                            BANK: userInfo.bank,
                            BRANCH: userInfo.branch,
                            STATE: userInfo.state,
                            ZONE: userInfo.zone,
                            AREA: userInfo.area,
                            
                            REMOTE_IP: (req.headers['x-forwarded-for'])?req.headers['x-forwarded-for']:"1.1.1.1",
                        }), CONFIG.SALT_KEY)
                    }, CONFIG.AUTHJWT.secret);
            
                    var sessKey = md5(CONFIG.AUTHJWT.secret + token);
                    userInfo.SESSKEY = sessKey;
            
                    _CACHE.storeData("USERDATA." + sessKey, userInfo);

                    db_insertQ1("MYSQL1", "log_logins", {
                        "guid": userInfo.guid,
                        "loginid": userInfo.userid,
                        "timestamp": moment().format("YYYY-MM-DD HH:mm:ss"),
                        "geolocation": (req.body.geolocation)?req.body.geolocation:"0,0",
                        "uri": req.path(),
                        // "host": (req.body.host)?req.body.host:"",
                        //"server_ip": 
                        "client_ip": (req.headers['x-forwarded-for'])?req.headers['x-forwarded-for']:"",
                        "medium": (req.body.medium)?req.body.medium:"mapp",
                        "status": "SUCCESS",
                        "action": "/auth",
                    }, a=>{});

                    db_updateQ("MYSQL1", "lgks_users", {
                        "last_login": moment().format("YYYY-MM-DD HH:mm:ss"),
                    }, {
                        "userid": userInfo.userid,
                    }, a=>{});
            
                    res.send({
                        "status": "success",
                        "token": token,
                        "timestamp": moment().format("YYYY-MM-DD HH:mm:ss"),
                        "client_ip": req.headers['x-forwarded-for'],
                        "username": userInfo.userid,
                        "bank": userInfo.bank,
                        "branch_id": userInfo.branch,
                        "regenerate_url": false
                    });
                    return next();
                }
            });
        });

        server.get('/me', (req, res, next) => {
            db_selectQ("MYSQL0", "mapp_privileges", "privilege_key", {
                blocked: "false",
                role: req.get("PRIVILEGE")
            }, {}, function (permissions, error) {
                permissions = Array.isArray(permissions) ? permissions?.map(ele => ele.privilege_key) : []
                console.log('permissions - ', permissions)
                db_selectQ("MYSQL0", "mapp_menus", "menu_key, menu_title, menu_weight, menu_icon", {
                    blocked: "false",
                    role: req.get("PRIVILEGE")
                }, {}, function (menus, error) {
                    console.log('menus - ', menus)
                    res.send({
                        "GUID": req.get("GUID"),
                        "USERID": req.get("USERID"),
                        "USER_NAME": req.get("USER_NAME"),
                        "DESIGNATION": req.get("DESIGNATION"),
                        "PRIVILEGE": req.get("PRIVILEGE"),
                        "ROLE": req.get("ROLE"),
                        "BANK": req.get("BANK"),
                        "BRANCH": req.get("BRANCH"),
                        "STATE": req.get("STATE"),
                        "ZONE": req.get("ZONE"),
                        "AREA": req.get("AREA"),
                        "PERMISSIONS": permissions || [],
                        "MENUS": menus || [],
                    });
                    return next();
                }, " ORDER BY menu_weight ASC")
            });
        });

        server.get('/logout', (req, res, next) => {
            const jwtToken = req.header("auth-token");
            if(jwtToken==null || jwtToken.length==0) {
            } else {
                const sessKey = sha1(CONFIG.AUTHJWT.secret + jwtToken);
                _CACHE.deleteData("USERDATA." + sessKey);
            }

            res.send("OK");
            return next();
        });
    }
}