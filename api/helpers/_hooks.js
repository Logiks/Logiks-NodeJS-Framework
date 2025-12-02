/*
 * hooks management functions
 * 
 * */

const HOOKS_CATALOG = {};

module.exports = function(server) {

    initialize = function(callback) {
        console.log("\x1b[36m%s\x1b[0m","HOOKS Initialized");
    },

    hook_categories = function() {
        return Object.keys(HOOKS_CATALOG);
    },

    register = function(hook_key, callback) {
        if(!HOOKS_CATALOG[hook_key]) HOOKS_CATALOG[hook_key] = [];

        HOOKS_CATALOG[hook_key].push(callback);
    },

    invoke = function(hook_key, dataParams) {
        if(!HOOKS_CATALOG[hook_key]) HOOKS_CATALOG[hook_key] = [];

        _.each(HOOKS_CATALOG[hook_key], function(callback, k) {
            try {
                callback(dataParams);
            } catch(e) {
                console.log("ERROR_HOOK_CALLBACK", hook_key, callback, e);
            }
        });
    }

    return this;
}