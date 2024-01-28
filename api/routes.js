/*
 * All Routing Logic is written here
 * 
 * */
module.exports = function(server, restify) {

    server.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", req.header("Access-Control-Request-Method"));
        res.header("Access-Control-Allow-Headers", req.header("Access-Control-Request-Headers"));
        next();
    });


    server.opts("*", function(req, res, next) {
        res.send(200);
        return next();
    });

    if(CONFIG.enable_public_folder) {
        if(CONFIG.html_server_allow_root) {
            server.get('/', (req, res, next) => {
                fs.readFile(CONFIG.ROOT_PATH + '/public/index.html', function (err, data) {
                    if (err) {
                        next(err);
                        return;
                    }
                    res.setHeader('Content-Type', 'text/html');
                    res.writeHead(200);
                    res.end(data);
                    return next();
                });
            });
        } else {
            server.get('/', (req, res, next) => {
                res.sendRaw(server.config.welcome);
                return next();
            });
        }
        
        server.get(
            `/\/${CONFIG.html_server_path}\/(.*)?.*/`,
            restify.plugins.serveStatic({
                directory: CONFIG.ROOT_PATH+`/${CONFIG.html_public_folder}`,
                default: 'index.html',
                appendRequestPath: false,
            })
          );
    } else {
        server.get('/', (req, res, next) => {
            res.sendRaw(server.config.welcome);
            return next();
        });
    }
    
    server.post('/', (req, res, next) => {
        res.sendRaw(server.config.welcome);
        return next();
    });

    server.get('*', (req, res, next) => {
        return next(new errors.NotAcceptableError("Method or Path was not found or not acceptable by server"));
    });
    server.post('*', (req, res, next) => {
        return next(new errors.NotAcceptableError("Method or Path was not found or not acceptable by server"));
    });

    server.get('/ping', (req, res, next) => {
        if(CONFIG.debug) {
            res.header('content-type', 'json');
            //res.header('timestamp', );
            res.send({
                "SERVER": server.config.name,
                "VERSION": server.config.version,
                "TIMESTAMP": moment().format("Y-M-D HH:mm:ss")
            });
            return next();
        } else {
            res.send(404);
            return next();
        }
    });

    server.get('/timestamp', (req, res, next) => {
        res.send(moment().format("Y-MM-DD HH:mm:ss"));
        return next();
    });

    server.get('/_debug', (req, res, next) => {
        if (!CONFIG.debug) {
          res.send(404);
          return next();
        }
        res.header('content-type', 'json');
        res.send(server.getDebugInfo(req, res));
        return next();
      });

    server.post('/_debug', (req, res, next) => {
        if (!CONFIG.debug) {
          res.send(404);
          return next();
        }
        res.header('content-type', 'json');
        res.send(server.getDebugInfo(req, res));
        return next();
      });

    server.get('/routes', (req, res, next) => {
        if(CONFIG.debug) {
            routeList = [];
            _.each(server.router._registry._routes, function(a, b) {
                if (a.method == "OPTIONS" || a.path == "*") return;
                routeList.push({
                    "path": a.path,
                    "method": a.method,
                });
            });
            res.send(routeList);
            next();
        } else {
            res.send(404);
            return next();
        }
    });
}
