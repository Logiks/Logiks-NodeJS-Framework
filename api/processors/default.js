//Default Processor for Output

module.exports = {

    filterOutput: function(data, config, req, callback) {
        //console.log("PROCESSORS", data, config, req, req.method);

        switch(req.method) {
            case "POST":
                if(req.body && req.body.fields) {
                    if(typeof req.body.fields=="string") req.body.fields = req.body.fields.split(",");

                    if(Array.isArray(data)) {
                        _.each(data, function(row, k) {
                            _.each(row, function(val, field) {
                                if(req.body.fields.indexOf(field)<0) {
                                    delete data[k][field];
                                }
                            })
                        })
                    }
                }
                break;
            case "GET":
                if(req.query && req.query.fields) {
                    if(typeof req.query.fields=="string") req.query.fields = req.query.fields.split(",");

                    if(Array.isArray(data)) {
                        _.each(data, function(row, k) {
                            _.each(row, function(val, field) {
                                if(req.query.fields.indexOf(field)<0) {
                                    delete data[k][field];
                                }
                            })
                        })
                    }
                }
                break;
        }

        callback(data);
    }
}
