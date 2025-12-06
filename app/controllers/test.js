module.exports = {
  get: function (params, callback) {
    console.log("Test GET Triggred --> ", params);
    callback([]);
  },

  create: function (params, callback) {
    console.log("Test POST Triggred --> ", params);
    callback([]);
  },

  edit: function (params, callback) {
    console.log("Test PUT Triggred --> ", params);
    callback([]);
  },

  delete: function (params, callback) {
    console.log("Test DELETE Triggred --> ", params);
    callback([]);
  },
};
