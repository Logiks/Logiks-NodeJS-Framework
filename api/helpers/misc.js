//Misc Helper Functions

const { customAlphabet } = require("nanoid");
const Validator = require('validatorjs');
const crypto = require('crypto');
// const sha1 = require('sha1');

module.exports = function(server, restify) {

  initialize = function() {
    server.slugify = function(text) {
      return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
    }
  
    server.toTitle = function(str) {
      return str.toLowerCase().replace(/\b[a-z]/g, function(letter) {
          return letter.toUpperCase();
        });
    }
  
    server.urlify = function(jsonObject) {
      let urlParameters = Object.entries(jsonObject).map(e => e.join('=')).join('&');
      return urlParameters;
    }
  
    server.startRequestLog = function() {
        server.use(function(req, res, next) {
            if(req.userAgent()=="ELB-HealthChecker/2.0") {
                return next();
            }
            console.log("REQUEST", {
                    "PATH":req.path(),
                    "QUERY": req.getQuery(),
                    "BODY": req.body,
                    "QUERY": req.query,
                    "PARAMS": req.params,
                    // "USER_AGENT": req.userAgent(),
                    // "HOST": req.header("host"),
                    // "CLIENT_IP": req.header("x-forwarded-for")
                });
            return next();
        });
    }
      
    server.processUpdateQueryFromBody = function(req, tableName, whereCond, extraFields = "edited_on=?") {
      var dated = moment().format("Y-M-D HH:mm:ss");
      
      var strUpdate = [];
      _.each(req.body, function(a,b) {
        strUpdate.push(b+'=?');
      });
      var strSQL = "UPDATE "+tableName+" SET "+strUpdate.join(", ")+","+extraFields+" WHERE "+whereCond;
      
      var dataValues = Object.values(req.body);
      
      if(extraFields == "edited_on=?") {
        dataValues.push(dated);
      }
      
      return {
        "sql" : strSQL,
        "data" : dataValues
      };
    }
  
    server.getDebugInfo = function(req, res) {
      return {
          "RUNNING_SINCE":moment(server.config.START_TIME).fromNow(),
          "DEBUG": CONFIG.debug,
          "AUDIT": CONFIG.audit,
          "PATH": req.path(),
          "URL": req.href(),
          "QUERY": req.getQuery(),
          "BODY": req.body,
          "QUERY": req.query,
          "PARAMS": req.params,
          "HEADERS": req.headers,
          "GUID":req.get("GUID"),
          // "DEVID":req.body.devid,
  
          // "CONNECT": CONNECTPARAMS
        };
    }
  }

  generateUUID = function(prefix,n) {
    //Math.ceil(Math.random()*10000000)+"-"+uuid();
    //return Math.random(1000000);
    if(n==null) n = 8;
    var add = 1, max = 12 - add;

    if (n > max) {
      return generate(max) + generate(n - max);
    }

    max = Math.pow(10, n + add);
    var min = max / 10; // Math.pow(10, n) basically 
    var number = Math.floor(Math.random() * (max - min + 1)) + min;

    return md5(prefix+("" + number).substring(add)+uuid()+moment().format("Y-M-DTHH:mm:ss"));
  }

  //nanoid
  generateID = function(length) {
    if(length==null) length = 12;
    //return nanoid.nanoid(length);
    return customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 12)();
  }

  timeStamp = function() {
    return moment().format("Y-M-D HH:mm:ss");
  }

  getClientIP = function(req) {
    if(req.headers['x-forwarded-for']) return req.headers['x-forwarded-for'];
    else if(req.socket.remoteAddress!=null) return req.socket.remoteAddress;
    else return "0.0.0.0";
  }


  getAdditionalParams = function(dataObj) {
      if(dataObj.userid!=null) {
        dataObj.created_by = dataObj.userid;
      }
      if(dataObj.geocordinates!=null) {
        dataObj.geolocation = dataObj.geocordinates;
      }
      return _.pickBy(dataObj, function(value, key) {
                      return (["geolocation","clientip","medium","site","host","created_by"].indexOf(key)>=0);
                    }, {});
  }

  generateDefaultDBRecord = function(req, forUpdate = false) {
    var dated = moment().format("Y-M-D HH:mm:ss");
    if(forUpdate) {
      return {
        "edited_on": dated,
        "edited_by": req?.get("USERID")?req?.get("USERID"):"admin",
      };
    } else {
      return {
        "guid": req.get("GUID"),
        "created_on": dated,
        "created_by": req?.get("USERID")?req?.get("USERID"):"admin",
        "edited_on": dated,
        "edited_by": req?.get("USERID")?req?.get("USERID"):"admin",
      };
    }
  }

  return this;
}

global.printObj = function(msg, clr, intent) {
  if(intent==null) intent = 2;
  if(clr==null) clr = "-";

  var newMsg = "";
  for (let k = 0; k < intent; k++) {
      newMsg = ">"+newMsg;
  }
  msg = newMsg+" "+msg;

  switch(clr.toLowerCase()) {
      case "grey":
          console.log("\x1b[30m%s\x1b[0m",`${msg}`);
          break;
      case "red":
          console.log("\x1b[31m%s\x1b[0m",`${msg}`);
          break;
      case "green":
          console.log("\x1b[32m%s\x1b[0m",`${msg}`);
          break;
      case "yellow":
          console.log("\x1b[33m%s\x1b[0m",`${msg}`);
          break;
      case "blue":
          console.log("\x1b[34m%s\x1b[0m",`${msg}`);
          break;
      case "pink":
          console.log("\x1b[35m%s\x1b[0m",`${msg}`);
          break;
      case "sky":
          console.log("\x1b[36m%s\x1b[0m",`${msg}`);
          break;
      default:
          console.log(msg);
  }
}

global.validateRule = function(formData, ruleObj) {
  let validation = new Validator(formData, ruleObj);

  return {
    "status": validation.passes(),
    "errors": validation.errors.all()
  };
}
