//Common Required Helper Functions for database

module.exports = function(server, restify) {

    initialize = function() {
        // Initialization code here
    }

    return this;
}

global.createDBInsertFromRequest = function(req, input_fields, db_table, msgTitle, callback) {
    var vStatus = validateRule(req.body, Object.fromEntries(Object.entries(input_fields).filter(([_, value]) => value !== '')));

    if (!vStatus.status) {
        callback(false, { error: "Input Validation Failed", details: vStatus.errors });
        return;
    }

    _.each(input_fields, function(v,k) {
        if(v.split("|").indexOf("json")>=0) {
            try {
                if(!req.body[k] || req.body[k].length<2) req.body[k] = "{}";
                
                req.body[k] = JSON.stringify(JSON.parse(req.body[k]));
            } catch(e) {
                req.body[k] = "{}";
            }
        }
    })

    try {
        //Filter only required fields from body and remove others
        var insertData = Object.fromEntries(Object.entries(req.body).filter((a,b)=>input_fields[a[0]]!=null));
        //Prepare default fields like GUID, created_at, updated_at etc
        insertData = _.extend(insertData, MISC.generateDefaultDBRecord(req, false));
        // console.log("Insert Data", msgTitle, insertData);
        db_insertQ1("MYSQL0", db_table, insertData, (insertId, errCode, errMessage)=>{
                if(insertId)
                    callback({ id: insertId, message: `${msgTitle} created` });
                else
                    callback(false, errMessage);
            });
    } catch (err) {
        console.error(err);
        callback(false, { error: `Failed to create ${msgTitle}` });
    }
}

global.createDBUpdateFromRequest = function(req, input_fields, db_table, whereLogic, msgTitle, callback) {
    var vStatus = validateRule(req.body, Object.fromEntries(Object.entries(input_fields).filter(([_, value]) => value !== '')));

    if (!vStatus.status) {
        callback(false, { error: "Input Validation Failed", details: vStatus.errors });
        return;
    }

    _.each(input_fields, function(v,k) {
        if(v.split("|").indexOf("json")>=0) {
            try {
                if(!req.body[k] || req.body[k].length<2) req.body[k] = "{}";

                req.body[k] = JSON.stringify(JSON.parse(req.body[k]));
            } catch(e) {
                req.body[k] = "{}";
            }
        }
    })

    try {
        //Filter only required fields from body and remove others
        var updateData = Object.fromEntries(Object.entries(req.body).filter((a,b)=>input_fields[a[0]]!=null));
        //Prepare default fields like updated_at etc
        updateData = _.extend(updateData, MISC.generateDefaultDBRecord(req, true));
        // console.log("Update Data", msgTitle, updateData);
        db_updateQ("MYSQL0", db_table, updateData, whereLogic, (ans, errCode, errMessage)=>{
                if(ans)
                    callback({ status: ans, message: `${msgTitle} updated`, id: whereLogic.id });
                else
                    callback(false, errMessage);
            });
    } catch (err) {
        console.error(err);
        callback(false, { error: `Failed to update ${msgTitle}` });
    }
}

global.createDBDeleteFromRequest = function(req, db_table, whereLogic, msgTitle, callback) {
    try {
        //Prepare default fields like updated_at etc
        var updateData = _.extend({blocked:'true'}, MISC.generateDefaultDBRecord(req, true));
        // console.log("Delete Data", msgTitle, updateData);
        db_updateQ("MYSQL0", db_table, updateData, whereLogic, (ans, response)=>{
                callback({ status: ans, message: `${msgTitle} deleted`, id: whereLogic.id });
            });
    } catch (err) {
        console.error(err);
        callback(false, { error: `Failed to delete ${msgTitle}` });
    }
}