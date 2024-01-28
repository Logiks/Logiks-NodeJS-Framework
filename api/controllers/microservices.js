/*
 * MicroService Controller
 * 
 * */

module.exports = function(server, restify) {

    initialize = function() {
        if(CONFIG.cache.enable) {
            console.log("MicroServices Initialized");
        } else {
            return false;
        }
    }






    return this;
}