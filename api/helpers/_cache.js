/*
 * caching functions
 * 
 * */

const ioredis = require("ioredis");
var redis = null;

if(CONFIG.cache.enable) {
    redis = new ioredis(CONFIG.cache);
}
/*
 * Cache Storage Controls all the Caching Functionality. It helps speed up fetching various cached data directly
 * using indexes. This is important as REDIS Cache forms the core to our speed
 * 
 * */
module.exports = function(server) {

    initialize = function() {
        if(CONFIG.cache.enable) {
            console.log("\x1b[36m%s\x1b[0m","CACHE Initialized");
        } else {
            return false;
        }
    }

    listCacheKeys = function(pattern, callback) {
        if(!CONFIG.cache.enable) return callback([]);

        if(pattern==null) pattern = "*";

        keysArr = [];
        redis.keys(pattern).then(function (keys) {
            keys.forEach(function (key) {
              keysArr.push(key);
            });

            callback(keysArr);
          });
    }

    cacheStatus = function() {
        if(!CONFIG.cache.enable) return false;

        return redis.status;
    }

    clearCache = function(pattern) {
        if(!CONFIG.cache.enable) return false;
        if(pattern==null) pattern = "*";
        //'sample_pattern:*'
        return redis.keys(pattern).then(function (keys) {
            // Use pipeline instead of sending one command each time to improve the performance.
            var pipeline = redis.pipeline();
            keys.forEach(function (key) {
              pipeline.del(key);
            });
            return pipeline.exec();
          });
    }

    deleteData = function(cacheKey) {
        if(!CONFIG.cache.enable) return false;
        clearCache(cacheKey);
    }

    storeData = function(cacheKey, data) {
        if(!CONFIG.cache.enable) return false;
        if (redis.status != "ready") return data;
        
        if (typeof data == "object") data = JSON.stringify(data);
        redis.set(cacheKey, data);
        return data;
    }

    storeDataEx = function(cacheKey, data, expires) {
        if(!CONFIG.cache.enable) return false;
        if (redis.status != "ready") return data;

        if (typeof data == "object") data = JSON.stringify(data);
        
        redis.set(cacheKey, data, "EX", expires);//In Seconds
        return data;
    }

    fetchData = function(cacheKey, callback, defaultData = false) {
        if(!CONFIG.cache.enable) return callback([], "error");

        if (redis.status != "ready") {
            callback(defaultData, "error");
            return;
        }
        cacheObj = this;
        result = false;

        redis.get(cacheKey).then(function (result) {
            if (result == null) {
                result = cacheObj.storeData(cacheKey, defaultData);
            }

            if (typeof result == "string") {
                try {
                    resultJSON = JSON.parse(result);
                    if (resultJSON != null) {
                        result = resultJSON;
                    }
                } catch (e) {

                }
            }

            callback(result);
        });
    }

    fetchDataSync = async function(cacheKey, defaultData = false) {
        if(!CONFIG.cache.enable) return defaultData;

        if (redis.status != "ready") {
            callback(defaultData, "error");
            return;
        }
        cacheObj = this;
        result = false;

        var result = await redis.get(cacheKey);

        if (result == null) {
            result = cacheObj.storeData(cacheKey, defaultData);
        }

        if (typeof result == "string") {
            try {
                resultJSON = JSON.parse(result);
                if (resultJSON != null) {
                    result = resultJSON;
                }
            } catch (e) {

            }
        }

        return result
    }

    return this;
}