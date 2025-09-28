/*
 * MicroService Controller
 * 
 * */

const cron = require('node-cron');

const LOADED_PLUGINS = {};
const ACTIVE_JOBS = {};

module.exports = function(server, restify) {

    initialize = function() {
        if(CONFIG.AUTOMATOR_JOBS==null) CONFIG.AUTOMATOR_JOBS = {};

        if(fs.existsSync(CONFIG.ROOT_PATH+'/api/automators')) {
            fs.readdirSync(CONFIG.ROOT_PATH+'/api/automators/').forEach(function(file) {
                    if ((file.indexOf(".js") > 0 && (file.indexOf(".js") + 3 == file.length))) {
                        var className = file.toLowerCase().replace(".js", "").toUpperCase();
                        var filePath = path.resolve(CONFIG.ROOT_PATH+'/api/automators/' + file);

                        LOADED_PLUGINS[className] = require(filePath);
                        // console.log(">>>", className, filePath, LOADED_PLUGINS);

                        if(LOADED_PLUGINS[className].initialize!=null) {
                            LOADED_PLUGINS[className].initialize();
                        }
                    }
                });
        }
        if(fs.existsSync(CONFIG.ROOT_PATH+'/app/automators')) {
            fs.readdirSync(CONFIG.ROOT_PATH+'/app/automators/').forEach(function(file) {
                    if ((file.indexOf(".js") > 0 && (file.indexOf(".js") + 3 == file.length))) {
                        var className = file.toLowerCase().replace(".js", "").toUpperCase();
                        var filePath = path.resolve(CONFIG.ROOT_PATH+'/app/automators/' + file);

                        LOADED_PLUGINS[className] = require(filePath);
                        // console.log(">>>", className, filePath, LOADED_PLUGINS);

                        if(LOADED_PLUGINS[className].initialize!=null) {
                            LOADED_PLUGINS[className].initialize();
                        }
                    }
                });
        }

        // console.log("LOADED_AUTOMATORS", LOADED_PLUGINS);
        // console.log("AUTOMATOR JOBS", CONFIG.AUTOMATOR_JOBS)

        _.each(CONFIG.AUTOMATOR_JOBS, function(conf, k) {
            if(LOADED_PLUGINS[conf.plugin.toUpperCase()]==null) {
                console.log("\x1b[31m%s\x1b[0m","\nAutomator Not Supported for Plugin -",conf.plugin);
                return;
            }
            if(LOADED_PLUGINS[conf.plugin.toUpperCase()].runJob==null) return;//Not a job type of plugin
            if(conf.schedule==null) {
                console.log("\x1b[31m%s\x1b[0m","\nAutomator Schedule Not Found or Not Supported");
                return;
            }
            if(conf.params==null) conf.params = {};
            //console.log("AUTOMATOR_JOB", k, conf);

            const job = cron.schedule(conf.schedule, () => {
                  LOADED_PLUGINS[conf.plugin.toUpperCase()].runJob(conf.params);
                });
            ACTIVE_JOBS[k] = {
                "opts": conf,
                "job": job,
                "started": moment().format(),
                "status": "active",
            };
        })

        console.log("\x1b[36m%s\x1b[0m", "Automator Initialized With-"+Object.keys(ACTIVE_JOBS).length+" Active Jobs");
    }

    return this;
}