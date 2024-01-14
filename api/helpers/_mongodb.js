//MongoDB Database Helper Functions

const mongoose = require('mongoose');
const mongooseStringQuery = require('mongoose-string-query');
const timestamps = require('mongoose-timestamp');
const autoIncrement = require('mongoose-plugin-autoinc');


var Schema = mongoose.Schema;

module.exports = function(server, restify) {

	initialize = function() {
		if(CONFIG.dbmongo.enable) {
	        mongoose.Promise = global.Promise;
	        mongoose.connect(CONFIG.dbmongo.uri, {
	            useNewUrlParser: true,
	            useUnifiedTopology: true,
	            useFindAndModify: false,
	            useCreateIndex: true,
	            autoIndex: false
	        });

	        server.mongodb = mongoose.connection;

	        server.mongodb.on('error', (err) => {
	        	console.log("MONGODB Initialization Failed", err);
	            process.exit(1);
	        });

	        server.mongodb.once('open', () => {

	            _MONGODB.loadMongoModels();
	            console.log("MONGODB Initialized");
	        });
	    }
	}

	loadMongoModels = function() {
		console.log("LOADING MONGODB MODELS");
		fs.readdirSync('./app/models/mongoose/').forEach(function(file) {
		    if ((file.indexOf(".js") > 0 && (file.indexOf(".js") + 3 == file.length))) {
		        var filePath = path.resolve('./app/models/mongoose/' + file);

		        var clsName = file.replace('.js','')
		        try {
		        	global[clsName] = require(filePath);//(server, restify);
		        } catch(e) {
		        	console.error(e);
					console.log("\x1b[35m%s\x1b[0m","Callback Route Error - "+ filePath);
		        }
		    }
		});
	}

	fetchMongoData = function(myModel, queryParams, callback) {
		var params = processQueryParams(queryParams);
		// console.log("FETCHMONGODATA", params);
		
		if(queryParams._id!=null && queryParams._id.length>0) {
      		myModel.findById(queryParams._id, params.cols)
	          .exec(function (err, data) {
	            if (err) {
	              console.log(err);
	              // res.send({"status":"error"});

	              // return next();
	              return callback(false);
	            }
	            
	            //console.log(data);

	            callback(data);
	        });
      	} else {
      		if(Object.keys(params.findQuery).length<=0) {
				return callback({});
			}
			
      		myModel.findOne(params.findQuery, params.cols)
	          .exec(function (err, data) {//error, pageCount, paginatedResults
	            if (err) {
	              console.log(err);
	              // res.send({"status":"error"});

	              // return next();
	              return callback(false);
	            }
	            
	            //console.log(data);

	            callback(data);
	        });
      	}
	}

	countdataMongoModel = function(myModel, queryParams, callback) {
		var params = processQueryParams(queryParams);
		// console.log("QUERYMONGOMODEL", params, params.findQuery);
      	//myModel = WalletLog;

    	myModel.count(params.findQuery, params.cols)
	          .sort(params.orderby)
	          .skip(params.page*params.limit)
	          .limit(parseInt(params.limit))
	          .exec(function (err, data) {//error, pageCount, paginatedResults
	            if (err) {
	              console.log(err);
	              // res.send({"status":"error"});

	              // return next();
	              return callback(false);
	            }
	            
	            //console.log(data);

	            myModel.find(params.findQuery).countDocuments(function(err, countData) {
	              if(err) countData = 0;

	              callback({
		                "max-records": countData,
		                "max-pages": Math.ceil(countData / params.limit),
		                "page": params.page,
		                "limit": params.limit,
		                "count": data.length,
		                "data": data
		              });
	            });
	        });
	}

	queryMongoModel = function(myModel, queryParams, callback) {
		var params = processQueryParams(queryParams);
		// console.log("QUERYMONGOMODEL", params, params.findQuery);
      	//myModel = WalletLog;

    	myModel.find(params.findQuery, params.cols)
	          .sort(params.orderby)
	          .skip(params.page*params.limit)
	          .limit(parseInt(params.limit))
	          .exec(function (err, data) {//error, pageCount, paginatedResults
	            if (err) {
	              console.log(err);
	              // res.send({"status":"error"});

	              // return next();
	              return callback(false);
	            }
	            
	            //console.log(data);

	            myModel.find(params.findQuery).countDocuments(function(err, countData) {
	              if(err) countData = 0;

	              callback({
		                "max-records": countData,
		                "max-pages": Math.ceil(countData / params.limit),
		                "page": params.page,
		                "limit": params.limit,
		                "count": data.length,
		                "data": data
		              });
	            });
	        });
	}

	processQueryParams = function(params) {
		if(params==null) params = {"page":0,"limit":20};

		//if(params.page==null || params.page<0) params.page=0;
		//if(params.limit==null) params.limit=20;

		params.page = parseInt(params.page, 10) || 0;
    	params.limit = parseInt(params.limit, 10) || 20;


		if(params.orderby==null) params.orderby = "-createdAt";
		else {
			orderby = params.orderby.split(" ");

			if(orderby[1]==null) orderby[1] = "desc";

			if(orderby[1]=="desc" || orderby[1]=="DESC") {
				params.orderby = "-"+orderby[0];
			} else {
				params.orderby = orderby[0];
			}
		}

		if(params.findQuery==null) params.findQuery = {};

		//_id
		if(params.cols!=null) params.cols = params.cols.split(",");

		//if(params.filter==null) params.filter = {};
		//params.findQuery = _.merge(params.findQuery, params.filter);

		if(params.date_filter!=null) {
			params.findQuery[params.date_filter.column] = {
        				$gte: params.date_filter.start_date, //new Date(new Date(startDate).setHours(00, 00, 00))
    					$lt: params.date_filter.end_date //new Date(new Date(endDate).setHours(23, 59, 59))
         		}
		}

		if(params.filter!=null) {
			_.each(params.filter, function(val,key) {
				//console.log(key,val);
				if(Array.isArray(val)) {
					params.findQuery[key] = {
						$in: val
					};
				} else if(typeof val == "object") {

				} else if(typeof val == "string") {
					params.findQuery[key] = new RegExp(val, 'ig');
				} else {
					params.findQuery[key] = val;
				}
			});
		}
		if(params.match!=null) {
			_.each(params.match, function(val,key) {
				//console.log(key,val);
				params.findQuery[key] = val;
			});
		}

		if(params.search!=null) {
			if(params.search.cols != null && params.search.query != null && params.search.query.length>0) {
				qText = params.search.query;
				qText = clearText(qText);
				
				sCols = params.search.cols.split(",");
				searchQuery = [];
				for(i=0;i<sCols.length;i++) {
					obj = {};
					obj[sCols[i]] = new RegExp(qText, 'ig');
					searchQuery.push(obj);
					//params.findQuery[sCols[i]] = new RegExp(qText, 'ig');
				}
				if(searchQuery.length>0) {
					params.findQuery["$or"] = searchQuery;
				}
			}
		}

		// console.log(params.findQuery);

		return params;
	}

	clearText = function(sText) {
		if(sText==null || sText.length<=0) return "";
		return sText.replace(/[^a-zA-Z0-9 -_]/g, '');
	}

	return this;
}