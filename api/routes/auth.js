/*
 * auth api routes
 * 
 * */

module.exports = function(server, restify) {
    if(CONFIG.is_microservice) {
        
    } else {
        server.post('/auth', (req, res, next) => {
            var vStatus = validateRule(req.body, {
                username: 'required',
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
    
            var username = req.body.username;
            var password = md5(req.body.password); // password will get in md5 hash form.
            var final_password = md5(CONFIG.ENC_SALT+""+password);
    
            //Select Query to identify the user
    
            var userInfo = {"guid": "", "username": "","userid": "","full_name":""};
            var token = jwt.sign({
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + parseInt(CONFIG.AUTHJWT.expires),
                data: {
                    GUID: userInfo.guid,
                    USERID: userInfo.userid,
                    USER_NAME: userInfo.full_name,
                    REMOTE_IP: req.headers['x-forwarded-for']
                }
            }, CONFIG.AUTHJWT.secret);
    
            var sessKey = md5(CONFIG.AUTHJWT.secret + token);
    
            _CACHE.storeData("USERDATA." + sessKey, userInfo);
    
            // dblog_insertQ1("log_logins_api", {
            //     "guid": userInfo.guid,
            //     "loginid": (req.body.username)?req.body.username:"",
            //     "timestamp": moment().format("YYYY-MM-DD HH:mm:ss"),
            //     "geolocation": (req.body.geolocation)?req.body.geolocation:"",
            //     "uri": req.path(),
            //     "host": (req.body.host)?req.body.host:"",
            //     "client_ip": (req.body.clientip)?req.body.clientip:"",
            //     "server_ip": (req.headers['x-forwarded-for'])?req.headers['x-forwarded-for']:"",
            //     "medium": (req.body.medium)?req.body.medium:"NA",
            //     "status": "SUCCESS",
            //     "action": "/auth",
            // }, a=>{});
    
            res.send({
                "status": "success",
                "token": token,
                "timestamp": moment().format("YYYY-MM-DD HH:mm:ss"),
                "client_ip": req.headers['x-forwarded-for'],
                "branch_id": userInfo.branch_id,
                "username": req.body.username,
                "officer_id": userInfo.employee_id,
                "bank_partner_id": userInfo.bank_partner_id,
                "regenerate_url": false
            });
            return next();
        });
    }
}