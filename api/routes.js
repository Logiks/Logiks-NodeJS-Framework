/*
 * All Routing Logic is written here
 * 
 * */

const express = require('express');

module.exports = function(server) {

    server.use((req, res, next) => {
        //res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", req.header("Access-Control-Request-Method"));
        res.header("Access-Control-Allow-Headers", req.header("Access-Control-Request-Headers"));
        next();
    });

    // server.options("*", function(req, res, next) {
    //     res.header('Access-Control-Allow-Origin', '*');
    //     res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    //     res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    //     res.sendStatus(200);
    // });

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
                res.send(CONFIG.welcome);
                return next();
            });
        }
        
        const staticPath = path.join(
            CONFIG.ROOT_PATH,
            CONFIG.html_public_folder
        );

        // Serve main index.html explicitly
        server.get(`/${CONFIG.html_server_path}`, (req, res) => {
            res.sendFile(path.join(staticPath, 'index.html'));
        });

        // Serve all static assets under the same route
        server.use(
            `/${CONFIG.html_server_path}`,
            express.static(staticPath, {
                index: false,          // match Restify behavior
                fallthrough: true,
                setHeaders: (res) => {
                    res.setHeader('Cache-Control', 'no-store');
                }
            })
        );

        // SPA fallback for deep routes (equivalent to /* in Restify)
        // server.get(new RegExp(`^/${CONFIG.html_server_path}(?:/.*)?$`), (req, res) => {
        //     res.sendFile('index.html', { root: staticPath });
        // });

        server.use((req, res, next) => {
            console.log("debug routes.js")
            const root = `/${CONFIG.html_server_path}`;
            console.log("root: ", root)
            if (req.path === root || req.path.startsWith(root + '/')) {
                return res.sendFile('index.html', { root: staticPath });
            }
            next();
        });

    } else {
        server.get('/', (req, res, next) => {
            res.sendRaw(CONFIG.welcome);
            return next();
        });
    }
    server.post('/', (req, res, next) => {
        res.sendRaw(CONFIG.welcome);
        return next();
    });

    server.get('*', (req, res, next) => {
        return next(new errors.NotAcceptableError("Method or Path was not found or not acceptable by server"));
    });
    server.post('*', (req, res, next) => {
        return next(new errors.NotAcceptableError("Method or Path was not found or not acceptable by server"));
    });

    server.get('/health', (req, res, next) => {
        res.send({
            "STATUS": "ok",
            "SERVER": CONFIG.name,
            "VERSION": CONFIG.version,
            "TIMESTAMP": moment().format("Y-M-D HH:mm:ss")
        });
        return next();
    });

    server.get('/ping', (req, res, next) => {
        if(CONFIG.debug) {
            res.header('content-type', 'json');
            //res.header('timestamp', );
            res.send({
                "SERVER": CONFIG.name,
                "VERSION": CONFIG.version,
                "TIMESTAMP": moment().format("Y-M-D HH:mm:ss")
            });
            return next();
        } else {
            res.send(404);
            return next();
        }
    });

    server.get('/_/timestamp', (req, res, next) => {
        res.send(moment().format("Y-MM-DD HH:mm:ss"));
        return next();
    });

    server.get('/_/reboot', (req, res, next) => {
        res.send("ok");
        process.exit();
    });

    server.get('/_/debug', (req, res, next) => {
        if (!CONFIG.debug) {
          res.send(404);
          return next();
        }
        res.header('content-type', 'json');
        res.send(server.getDebugInfo(req, res));
        return next();
      });

    server.post('/_/debug', (req, res, next) => {
        if (!CONFIG.debug) {
          res.send(404);
          return next();
        }
        res.header('content-type', 'json');
        res.send(server.getDebugInfo(req, res));
        return next();
      });

    server.get('/_/routes', (req, res, next) => {
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
