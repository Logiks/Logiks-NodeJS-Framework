/*
 * HOOKS Controller
 * 
 * */

const HOOKS_REGISTER = {};

module.exports = function(server) {

    initialize = function() {
        if(fs.existsSync('./app/hooks.json')) {
            try {
                var hookContent = fs.readFileSync('./app/hooks.json');
                hookContent = JSON.parse(hookContent);
                if(hookContent.HOOKS) {
                    _.each(hookContent.HOOKS, function(hooksList, hookID) {
                        _.each(hooksList, function(hookConfig, k) {
                            HOOKS.registerHook(hookID, hookConfig.method, hookConfig.params);
                        });
                    });
                }
            } catch(e) {
                console.error(e);
            }
        }
        
        console.log("\x1b[36m%s\x1b[0m", "HOOKS Initialized With-"+Object.keys(HOOKS_REGISTER).length+" Active Hook");
    }

    registerHook = function(hookid, func, params) {
        hookid = hookid.toUpperCase();

        if(HOOKS_REGISTER[hookid]==null) HOOKS_REGISTER[hookid] = [];
        HOOKS_REGISTER[hookid].push({"method": func, "params": params});
    }
    
    runHook = function(hookid, paramsMore) {
        hookid = hookid.toUpperCase();
        if(HOOKS_REGISTER[hookid]!=null) {
            HOOKS_REGISTER[hookid].forEach(function(hookConfig) {
                try {
                    var func = hookConfig['method'];
                    func = func.split(".");
                    
                    global[func[0]][func[1]](hookConfig['params'], paramsMore);
                } catch(e) {
                    console.error(e);
                }
            });
        }
    }

    return this;
}
