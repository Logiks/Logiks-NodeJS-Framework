/*
 * Demo Automator
 * 
 * */

module.exports = {

    initialize: function() {
        console.log("Demo Job Initialization");
    },

    runJob: function(params) {
        console.log("Running Demo Job", params);
    }
}