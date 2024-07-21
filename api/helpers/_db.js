//MySQL Database Helper Functions

const mysql = require('mysql2');

var _MYSQL = {};

module.exports = function(server, restify) {

	initialize = function(callback) {console.log("XXXX", CONFIG.dbmysql);
		if(CONFIG.dbmysql==null) return;
		
		if(Array.isArray(CONFIG.dbmysql)) {
			_.each(CONFIG.dbmysql, function(conf, k) {
				if(conf.enable) {
					if(conf.keyid==null) conf.keyid = "MYSQL"+k;
				
					// _MYSQL[conf.keyid] = mysql.createConnection(CONFIG.dbmysql);
		        	// _MYSQL[conf.keyid].connect();

					_MYSQL[conf.keyid] = mysql.createPool(conf);
					//.filter(a=>["host","port","user","password","database","insecureAuth","connectionLimit","debug"].indexOf(a)>=0)

		        	console.log("MYSQL Initialized - "+conf.keyid);
				}
			})
		} else {
			if(CONFIG.dbmysql.enable) {
				// _MYSQL["MYSQL0"] = mysql.createConnection(CONFIG.dbmysql);
		        // _MYSQL["MYSQL0"].connect();

				_MYSQL["MYSQL0"] = mysql.createPool(CONFIG.dbmysql);
				//.filter(a=>["host","port","user","password","database","insecureAuth","connectionLimit","debug"].indexOf(a)>=0)

				_MYSQL["MYSQL0"].getConnection(function(err,connection){
					if (err || connection==null) {
					  throw err;
					  return;
					}   
					
					console.log("MYSQL Initialized - MYSQL0");
				});
			}
		}
	}
	
	//Standard MySQL
	db_query = function(dbkey, sql, params, callback) {
		if(_MYSQL[dbkey]==null) {
			console.log("\x1b[31m%s\x1b[0m",`DATABASE Not Connected for ${dbkey}`);
			return callback(false);
		}
		if(CONFIG.log_sql) {
			console.log("SQL", sql, params);
		}
		//server.mysql.query(sql, params, function(err, results, fields) {
		_MYSQL[dbkey].query(sql, params, function(err, results, fields) {
					// console.log(err,results,fields);
			      	if(err) {
			      		callback(false);
			      		return;
			      	}
			      	if(results.length<=0) {
			      		return callback([]);
			      	}
			      	results = JSON.parse(JSON.stringify(results));
			      	callback(results);
			    });
	}

	db_selectQ = function(dbkey, table, columns, where, whereParams, callback, additionalQueryParams) {
		if(_MYSQL[dbkey]==null) {
			console.log("\x1b[31m%s\x1b[0m",`DATABASE Not Connected for ${dbkey}`);
			return callback(false);
		}

		if(Array.isArray(columns)) columnsStr = columns.join(",");
		else columnsStr = columns;

		var sql = "SELECT "+columnsStr+" FROM "+table+" ";

		if(where!=null) {
			var sqlWhere = [];
			if(typeof where == "object" && !Array.isArray(where)) {
				_.each(where, function(a, b) {
					if(a == "RAW") {
						sqlWhere.push(b);
					} else if(Array.isArray(a) && a.length==2) {
						sqlWhere.push(b+a[1]+"'"+a[0]+"'");
					} else {
						sqlWhere.push(b+"='"+a+"'");
					}
				});
			} else {
				sqlWhere.push(where);
			}

			if(sqlWhere.length>0) {
				sql += " WHERE "+sqlWhere.join(" AND ");
			}
		}

		if(additionalQueryParams!=null && additionalQueryParams.length>0) {
			sql += additionalQueryParams;
		}

		// console.log("_selectQ", sql);
		if(CONFIG.log_sql) {
			console.log("SQL", sql, whereParams);
		}
		//server.mysql.query(sql, whereParams, function(err, results, fields) {
		_MYSQL[dbkey].query(sql, whereParams, function(err, results, fields) {
			      	if(err || results.length<=0) {
			      		if(err) console.log(err);
			      		callback(false);
			      		return;
			      	}

			      	results = JSON.parse(JSON.stringify(results));
			      	callback(results);
			    });
	}

	db_insertQ1 = function(dbkey, table, data, callback) {
		if(_MYSQL[dbkey]==null) {
			console.log("\x1b[31m%s\x1b[0m",`DATABASE Not Connected for ${dbkey}`);
			return callback(false);
		}

		cols = [];quest = [];
		vals = [];
		_.each(data, function(a,b) {
			cols.push(b);
			vals.push(a);
			quest.push("?");
		});

		var sql = "INSERT INTO "+table+" ("+cols.join(",")+") VALUES ("+quest.join(",")+")";

		if(CONFIG.log_sql) {
			console.log("SQL", sql, vals);
		}

		//server.mysql.query(sql, vals, function(err, results, fields) {
		_MYSQL[dbkey].query(sql, vals, function(err, results, fields) {
	          if(err) {
	          	// console.log(err);
	            return callback(false, err.code, err.sqlMessage);
	          }

	          callback(results.insertId);
	        });
	}

	db_insert_batchQ = function(dbkey, table, data, callback) {
		if(_MYSQL[dbkey]==null) {
			console.log("\x1b[31m%s\x1b[0m",`DATABASE Not Connected for ${dbkey}`);
			return callback(false);
		}

		if(data[0]==null) {
			return callback(false, "Data Not Defined");
		}

		let cols = Object.keys(data[0]);
		let values = data.map( obj => cols.map( key => obj[key]));


		var sql = "INSERT INTO "+table+" ("+cols.join(",")+") VALUES ?";

		if(CONFIG.log_sql) {
			console.log("SQL", sql, data);
		}

		//server.mysql.query(sql, [values], function(err, results, fields) {
		_MYSQL[dbkey].query(sql, [values], function(err, results, fields) {
	          if(err) {
	          	if(err) console.log(err);
	            return callback(false);
	          }
	          callback(true);
	        });
	}

	db_deleteQ = function(dbkey, table, where, callback) {
		if(_MYSQL[dbkey]==null) {
			console.log("\x1b[31m%s\x1b[0m",`DATABASE Not Connected for ${dbkey}`);
			return callback(false);
		}

		sqlWhere = [];
		if(typeof where == "object" && !Array.isArray(where)) {
			_.each(where, function(a, b) {
				if(a == "RAW") {
					sqlWhere.push(b);
				} else if(Array.isArray(a) && a.length==2) {
					sqlWhere.push(b+a[1]+"'"+a[0]+"'");
				} else {
					sqlWhere.push(b+"='"+a+"'");
				}
			});
		} else {
			sqlWhere.push(where);
		}

		var sql = "DELETE FROM "+table+" WHERE "+sqlWhere.join(" AND ");

		if(CONFIG.log_sql) {
			console.log("SQL", sql, vals);
		}

		//server.mysql.query(sql, vals, function(err, results, fields) {
		_MYSQL[dbkey].query(sql, function(err, results, fields) {
	          if(err) {
	            return callback(false);
	          }
	          callback(true);
	        });
	}

	db_updateQ = function(dbkey, table, data, where, callback) {
		if(_MYSQL[dbkey]==null) {
			console.log("\x1b[31m%s\x1b[0m",`DATABASE Not Connected for ${dbkey}`);
			return callback(false);
		}
		var fData = [];
		var vals = [];
		_.each(data, function(a,b) {
			fData.push(b+"=?");
			vals.push(a);
		});

		var sqlWhere = [];
		if(typeof where == "object" && !Array.isArray(where)) {
			_.each(where, function(a, b) {
				if(a == "RAW") {
					sqlWhere.push(b);
				} else if(Array.isArray(a) && a.length==2) {
					sqlWhere.push(b+a[1]+"'"+a[0]+"'");
				} else {
					sqlWhere.push(b+"='"+a+"'");
				}
			});
		} else {
			sqlWhere.push(where);
		}

		var sql = "UPDATE "+table+" SET "+fData.join(",")+" WHERE "+sqlWhere.join(" AND ");

		//console.log(sql);
		if(CONFIG.log_sql) {
			console.log("SQL", sql, vals);
		}

		//server.mysql.query(sql, vals, function(err, results, fields) {
		_MYSQL[dbkey].query(sql, vals, function(err, results, fields) {
	          if(err) {
	          	if(err) console.log(err);
	            return callback(false,err.code,err.sqlMessage);
	          }
	          callback(true);
	        });
	}

	return this;
}