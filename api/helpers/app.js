/*
 * Application related functions
 * This file contains and controls aspects of app folder
 * 
 * */

const APPINDEX = {
    "CONTROLLERS":{},
    "PROCESSORS": {},
    "DATA": {},
    "ROUTES": {}
};

module.exports = function(server, restify) {

	initialize = function() {
        
	}

    initializeApplication = function() {
        var that = this;

        //Initiate Sequelize
        //Initiate Mongoose

        //Load Controllers
        fs.readdirSync('./app/controllers/').forEach(function(file) {
            if ((file.indexOf(".js") > 0 && (file.indexOf(".js") + 3 == file.length))) {
                var clsName = file.replace('.js','').toUpperCase();
                var filePath = path.resolve('./app/controllers/' + file);

                global[clsName] = require(filePath);//(server, restify);
                APPINDEX.CONTROLLERS[clsName] = global[clsName];
                //console.log("> Loading Controller", clsName);
            }
        });

        //Create Data Model Indexes
        fs.readdirSync('./app/data/').forEach(function(file) {
            if ((file.indexOf(".json") > 0 && (file.indexOf(".json") + 5 == file.length))) {
                var clsName = file.replace('.json','').toUpperCase();
                var filePath = path.resolve('./app/data/' + file);

                APPINDEX.DATA[clsName] = require(filePath);
            }
        });

        //Initiate Processors
        fs.readdirSync('./app/processors/').forEach(function(file) {
            if ((file.indexOf(".js") > 0 && (file.indexOf(".js") + 3 == file.length))) {
                var clsName = file.replace('.js','').toUpperCase();
                var filePath = path.resolve('./app/processors/' + file);

                global[clsName] = require(filePath);
                APPINDEX.PROCESSORS[clsName] = global[clsName];
                //console.log("> Loading Controller", clsName);
            }
        });

        //Initiate Routes
        fs.readdirSync('./app/routes/').forEach(function(file) {
            if ((file.indexOf(".json") > 0 && (file.indexOf(".json") + 5 == file.length))) {
                var clsName = file.replace('.json','').toUpperCase();
                var filePath = path.resolve('./app/routes/' + file);
                var basePath = clsName.toLowerCase();

                var tempObj = require(filePath);
                if(tempObj.enabled) {
                    _.each(tempObj.routes, function(conf, path) {
                        var rPath = `/${basePath}${path}`;
                        if(conf.method==null) conf.method = "GET";

                        that.registerRoutePath(rPath, conf.method.toUpperCase(), conf);
                    })
                }
            }
        });
        
        console.log("\x1b[35m%s\x1b[0m", "\nApplication Initiation Complete");
    }

    registerRoutePath = async function(rPath, method, config) {
        console.log('registerRoutePath', rPath, method, config);

        APPINDEX.ROUTES[`${method}::${rPath}`] = config;
        switch(method) {
            case "GET":

                break;
            case "POST":

                break;
            case "PUT":

                break;
            case "DELETE":

                break;

            default:
                console.log("\x1b[31m%s\x1b[0m",`Error registering Route Path - ${rPath}@${method}`);
        }
    }

    return this;
}