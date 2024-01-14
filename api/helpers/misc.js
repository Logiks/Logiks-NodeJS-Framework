//Misc Helper Functions

module.exports = function(server, restify) {

  initialize = function() {
    
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
    return nanoid.customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 12)();
  }

  timeStamp = function() {
    return moment().format("Y-M-D HH:mm:ss");
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
          next();
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

  return this;
}