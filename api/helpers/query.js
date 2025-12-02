/*
 * for supporting Logiks Query Style Json to SQL Query conversion
 * 
 * */

module.exports = function(server) {

    initialize = function() {
        
    }

    parseQuery = function(sqlObj, filter = {}) {
        if(sqlObj==null) {
            console.error("No JSON Query Found");
            return false;
        }

        if(typeof sqlObj == "string") {
            try {
                sqlObj = JSON.parse(sqlObj);
            } catch(e) {
                console.error("Invalid JSON Query String", e);
                return false;
            }
        }

        var columnsStr = "*";
        var limit = 1000;
        var offset = 0;
        var groupby = false;
        var orderby = false;
        var having = false;

        if(!sqlObj.column && sqlObj.cols) sqlObj.column = sqlObj.cols;

        if (Array.isArray(sqlObj.column)) {
            columnsStr = sqlObj.column
                .map((a) => {
                    return processTilde(a);
                })
                .join(", ");
        }
        else {
            columnsStr = processTilde(sqlObj.column);
        }

        if (sqlObj.limit) {
            limit = sqlObj.limit;
        }
        if (sqlObj.offset) {
            offset = sqlObj.offset;
        }

        if (sqlObj.orderby) {
            orderby = sqlObj.orderby;
        }

        if (sqlObj.groupby) {
            groupby = sqlObj.groupby;
        }

        if (sqlObj.having) {
            having = sqlObj.having;
        }

        if (!limit || limit == null || limit.length <= 0) {
            limit = process.env.MAX_RECORDS;
        }

        var sql = `SELECT ${columnsStr} FROM ${sqlObj.table} `;

        //Handle sqlObj.join
        //Handle sqlObj.table_connection

        var WHERE_ADDED = false;

        if(typeof sqlObj.where == "string") {
            sqlObj.where = processTilde(sqlObj.where);
        } else {
            var temp = {};
            _.each(sqlObj.where, function(k,v) {
                temp[processTilde(v)] = processTilde(k);
            });
            sqlObj.where = temp;
        }

        if(!filter) filter = {};
        sqlObj.where = _.extend(sqlObj.where, filter);

        var sqlWhere = processSQLWhere(sqlObj.where, " ");
        // console.log("sqlWhere", sqlWhere);
        if (sqlWhere.length > 0) {
            sqlWhere = sqlWhere.replace(/``/g, "`");
            sql += " WHERE " + sqlWhere;
            WHERE_ADDED = true;
        }

        if(typeof sqlObj.filter == "string") {
            sqlObj.filter = processTilde(sqlObj.filter);
        } else {
            var temp = {};
            _.each(sqlObj.filter, function(k,v) {
                temp[processTilde(v)] = processTilde(k);
            });
            sqlObj.filter = temp;
        }

        var sqlWhere = processSQLWhere(sqlObj.filter, " ");
        if (sqlWhere.length > 0) {
            sqlWhere = sqlWhere.replace(/``/g, "`");
            if (WHERE_ADDED) sql += " AND " + sqlWhere;
            else sql += " WHERE " + sqlWhere;

            WHERE_ADDED = true;
        }

        // if(is_array(sqlObj.obj['groupby'])) {
        //     if(isset(sqlObj.obj['groupby']['group'])) {
        //         group=sqlObj.obj['groupby']['group'];
        //     }
        //     if(isset(sqlObj.obj['groupby']['having'])) {
        //         having=sqlObj.obj['groupby']['having'];
        //     }
        // }

        if (groupby && groupby.length > 0) {
            groupby = processTilde(groupby);
            sql += ` GROUP BY ${groupby}`;
        }
        if (having && having.length > 0) {
            having = processTilde(having);
            sql += ` HAVING ${having}`;
        }

        if (orderby && orderby.length > 0) {
            var direction = "DESC";
            if (orderby.indexOf(" DESC") > 0) {
                orderby = orderby.replace(" DESC", "");
            } else if (orderby.indexOf(" ASC") > 0) {
                direction = "ASC";
                orderby = orderby.replace(" ASC", "");
            } else if (orderby.indexOf(" desc") > 0) {
                orderby = orderby.replace(" desc", "");
            } else if (orderby.indexOf(" asc") > 0) {
                direction = "ASC";
                orderby = orderby.replace(" asc", "");
            }

            orderby = processTilde(orderby);
            sql += ` ORDER BY ${orderby} ${direction}`;
        }

        if (limit != null && limit > 0) {
            if (offset == null) {
                offset = 0;
            }
            sql += ` LIMIT ${offset}, ${limit}`;
        }

        sql = sql.replaceAll(/('')+/g,"'");
        sql = sql.replaceAll(/('')+/g,"'");

        return sql;
    }

    return this;
}


function processTilde(str) {
    if(str==null || typeof str != "string") return str;
    var a1 = str;
    var k1 = 0;
    // while(a1.indexOf("`")>=0) {
    //     // console.log(k1, a1);
    //     if(k1%2==0)
    //         a1 = a1.replace("`", "[");
    //     else
    //         a1 = a1.replace("`", "]");
    //     k1++;
    // }
    const regex = /( as )[a-zA-Z0-9_-]+/gm;
    a1 = a1.replace(regex, function(k,v) {
        var t = k.replace(" as ", "").trim();
        return ` as '${t}'`;
    })
    // console.log(">", a1);
    return a1;
};


function processSQLWhere (sqlWhereObj, colDelimiter = "`", whereJoiner = "AND") {
    if (sqlWhereObj == null || colDelimiter.length <= 0) {
        return "";
    }

    if (colDelimiter.length == 1)
        colDelimiter = [colDelimiter, colDelimiter];
    else if (typeof colDelimiter == "string")
        colDelimiter = colDelimiter.split("");

    var sqlWhere = [];
    if (typeof sqlWhereObj == "object" && !Array.isArray(sqlWhereObj)) {
        _.each(sqlWhereObj, function (a, b) {
            if (a == "RAW") {
                sqlWhere.push(b);
            } else if (Array.isArray(a) && a.length == 2) {
                // sqlWhere.push(b + a[1] + "'" + a[0] + "'");
                sqlWhere.push(parseRelation(b, a, colDelimiter));
            } else if (["~", "!", "@", "#"].indexOf(a[0]) >= 0) {
                sqlWhere.push(parseRelation(b, a, colDelimiter));
            } else {
                b = b.replace(/`/g, "");
                sqlWhere.push(
                    `${colDelimiter[0]}${b}${colDelimiter[1]}` +
                        "='" +
                        a +
                        "'"
                );
            }
        });
    } else {
        sqlWhere.push(sqlWhereObj);
    }

    return sqlWhere.join(` ${whereJoiner} `);
};

function parseRelation (col, arr, colDelimiter = ["`", "`"]) {
    col = col.replace(/`/g, "");
    // console.log("SQLWHERE_PARSER", col, arr);
    if (typeof arr == "string") {
        if (["~", "^", "!", "@", "#"].indexOf(arr[0]) >= 0) {
            switch (arr[0]) {
                case "^":
                    arr = {
                        OP: "SW",
                        VALUE: arr.substr(1),
                    };
                    break;
                case "!":
                case "~":
                    arr = {
                        OP: "NE",
                        VALUE: arr.substr(1),
                    };
                    break;
                case "@":
                    arr = {
                        OP: "FIND",
                        VALUE: arr.substr(1),
                    };
                    break;
                case "#":
                    arr = {
                        OP: "LIKE",
                        VALUE: arr.substr(1),
                    };
                    break;

                default:
                    arr = arr.substr(1);
                    return `\`${col}\`='${arr}'`;
                    break;
            }
        } else {
            return "`${col}`=" + sqlData(arr);
        }
    }

    if (arr.VALUE != null) arr[0] = arr.VALUE;
    if (arr.OP != null) arr[1] = arr.OP;

    if (arr[1] == null) arr[1] = "=";

    // console.log("SQLWHERE_PARSER_2", col, arr);
    //col = `\`${col}\``;
    col = `${colDelimiter[0]}${col}${colDelimiter[1]}`;
    var s = "";
    switch (arr[1].toLowerCase()) {
        case "eq":
        case ":eq:":
        case "=":
            arr[0] = sqlData(arr[0]);
            s = `${col}=${arr[0]}`;
            break;

        case "ne":
        case ":ne:":
        case "neq":
        case ":neq:":
        case "<>":
            arr[0] = sqlData(arr[0]);
            s = `${col}<>${arr[0]}`;
            break;

        case "lt":
        case ":lt:":
        case "<":
            arr[0] = sqlData(arr[0]);
            s = `${col}<${arr[0]}`;
            break;

        case "le":
        case ":le:":
        case "lte":
        case ":lte:":
        case "<=":
            arr[0] = sqlData(arr[0]);
            s = `${col}<=${arr[0]}`;
            break;

        case "gt":
        case ":gt:":
        case ">":
            arr[0] = sqlData(arr[0]);
            s = `${col}>${arr[0]}`;
            break;

        case "ge":
        case ":ge:":
        case "gte":
        case ":gte:":
        case ">=":
            arr[0] = sqlData(arr[0]);
            s = `${col}>=${arr[0]}`;
            break;

        case "nn":
        case ":nn:":
            s = `${col} IS NOT NULL`;
            break;

        case "nu":
        case ":nu:":
            s = `${col} IS NULL`;
            break;

        case "bw":
        case ":bw:":
        case "sw":
        case ":sw:":
        case "starts":
            s = `${col} LIKE '${arr[0]}%'`;
            break;

        case "bn":
        case ":bn:":
        case "sn":
        case ":sn:":
            s = `${col} NOT LIKE '${arr[0]}%'`;
            break;

        case "lw":
        case ":lw:":
        case "ew":
        case ":ew:":
        case "ends":
            s = `${col} LIKE '%${arr[0]}'`;
            break;

        case "ln":
        case ":ln:":
        case "en":
        case ":en:":
            s = `${col} NOT LIKE '%${arr[0]}'`;
            break;

        case "cw":
        case ":cw:":
        case "between":
        case "like":
            s = `${col} LIKE '%${arr[0]}%'`;
            break;

        case "cn":
        case ":cn:":
        case "notbetween":
        case "notlike":
            s = `${col} NOT LIKE '%${arr[0]}%'`;
            break;

        case "s":
        case ":s:":
        case "find":
        case ":find:":
            s = `FIND_IN_SET('${arr[0]}',${col})`;
            break;

        case "in":
        case ":in:":
            if (typeof arr[0] == "object") {
                _.each(arr[0], function (b, a) {
                    arr[0][a] = `'${b}'`;
                });
                s = `${col} IN (` + arr[0].join(",") + `)`;
            } else if (isNaN(arr[0])) {
                if (
                    arr[0].substr(0, 1) == "'" ||
                    arr[0].substr(0, 1) == '"'
                ) {
                    s = `${col} IN (${arr[0]})`;
                } else if (onlyNumbers(arr[0].split(","))) {
                    s = `${col} IN (${arr[0]})`;
                } else {
                    s = `${col} IN ('${arr[0]}')`;
                }
            } else {
                s = `${col} IN (${arr[0]})`;
            }
            break;

        case "ni":
        case ":ni:":
            if (typeof arr[0] == "object") {
                _.each(arr[0], function (b, a) {
                    arr[0][a] = `'${b}'`;
                });
                s = `${col} NOT IN (` + arr[0].join(",") + `)`;
            } else if (isNaN(arr[0])) {
                if (
                    arr[0].substr(0, 1) == "'" ||
                    arr[0].substr(0, 1) == '"'
                ) {
                    s = `${col} NOT IN (${arr[0]})`;
                } else if (onlyNumbers(arr[0].split(","))) {
                    s = `${col} NOT IN (${arr[0]})`;
                } else {
                    s = `${col} NOT IN ('${arr[0]}')`;
                }
            } else {
                s = `${col} NOT IN (${arr[0]})`;
            }
            break;

        case "range":
            if (typeof arr[0] == "object") {
                if (is_numeric(arr[0][0]) || is_float(arr[0][0])) {
                    s = `${col} BETWEEN ${arr[0][0]} AND ${arr[0][1]}`;
                } else {
                    s = `${col} BETWEEN '${arr[0][0]}' AND '${arr[0][1]}'`;
                }
            } else {
                if (arr[0].indexOf(",") > 0) {
                    var x1 = arr[0].split(",");
                    s = `${col} BETWEEN ${x1[0]} AND ${x1[1]}`;
                } else s = `${col} BETWEEN ${arr[0]}`;
            }
            break;
        case "rangestr":
            if (typeof arr[0] == "object") {
                s = `${col} BETWEEN '${arr[0][0]}' AND '${arr[0][1]}'`;
            } else {
                if (arr[0].indexOf(",") > 0) {
                    var x1 = arr[0].split(",");
                    s = `${col} BETWEEN '${x1[0]}' AND '${x1[1]}'`;
                } else s = `${col} BETWEEN ${arr[0]}`;
            }
            break;

        default:
            arr[0] = sqlData(arr[0]);
            s = `${col} ${arr[0]}`;
    }
    return s;
};

function sqlDataArr (arr, sqlType = "*") {
    _.each(arr, function (b, a) {
        arr[a] = sqlData(b, sqlType);
    });
    return arr;
};

function sqlData (str, sqlType = "*") {
    if (Array.isArray(str)) {
        str = str.join(",");
    }

    str = cleanSQL(str);

    if (str.length <= 0) return "";

    if (sqlType == "*" || sqlType == "auto") {
        if (str == "TRUE" || str == "FALSE") return strtoupper(str);
        else if (str === true || str === false)
            return str === true ? "TRUE" : "FALSE";
        else if (typeof str == "number") return str;
        else if (typeof str == "boolean") return str;
        else if (str.substr(0, 1) == "0") return `'${str}'`;
        // elseif(strlen(str)==10 && preg_match("/\d{2}\-\d{2}-\d{4}/",str_replace("/","-",str)) && strlen(str)=="10") return "'"._date(str)."'";
        else if (str.indexOf("()") > 1) return str;
        else if (str == "..") return `''`;
        return `'${str}'`;
    } else if (
        sqlType == "int" ||
        sqlType == "float" ||
        sqlType == "bool"
    ) {
        if (strlen($s) <= 0) return "0";
        else return str;
    } else if (sqlType == "date") {
        str = _date(str);
        return `'${str}'`;
    } else if (sqlType == "func") {
        return str;
    } else {
        return `'${str}'`;
    }
};

function cleanSQL (str) {
    return str;
};
function _date (str) {
    return new moment(str).format("YYYY-MM-DD");
};

function _datetime (str) {
    return new moment(str).format("YYYY-MM-DD HH:mm:ss");
};

function onlyNumbers(array) {
    array = array.map((a) => (isNaN(parseFloat(a)) ? a : parseFloat(a)));
    return array.every((element) => {
        return typeof element === "number";
    });
};

function detectDataType(input, defaultValue) {
    if(defaultValue==null || defaultValue=="string") defaultValue = "varchar";

    // Check for Boolean
    if (input.toLowerCase() === "true" || input.toLowerCase() === "false") {
        return "bool";
    }

    // Check for Integer
    if (!isNaN(input) && parseInt(input) == input && input.indexOf('.') === -1) {
        return "int";
    }

    // Check for Float
    if (!isNaN(input) && parseFloat(input) == input) {
        return "float";
    }

    if(input.substr(0,1)=="{" && input.substr(input.length-1,1)=="}") {
        try {
            JSON.parse(input);
            return "json";
        } catch(e) {}
    }

    // Default to String
    return defaultValue;
}