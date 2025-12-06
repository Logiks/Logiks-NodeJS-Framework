/*
 * All Routing Logic is written here
 * 
 * */

const express = require('express');
const getDebugInfo = require('./debug')
module.exports = function(server) {

    server.use((req, res, next) => {
        //res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", req.header("Access-Control-Request-Method"));
        res.header("Access-Control-Allow-Headers", req.header("Access-Control-Request-Headers"));
        next();
    });

  // Serve public folder
  if (CONFIG.enable_public_folder) {
    const staticPath = path.join(CONFIG.ROOT_PATH, CONFIG.html_public_folder);

    // GET /
    server.get("/", (req, res) => {
      if (CONFIG.html_server_allow_root) {
        res.sendFile(path.join(staticPath, "index.html"));
      } else {
        res.send(CONFIG.welcome);
      }
    });

    // Serve SPA entry
    server.get(`/${CONFIG.html_server_path}`, (req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });

    // Serve static assets
    server.use(
      `/${CONFIG.html_server_path}`,
      express.static(staticPath, {
        index: false,
        setHeaders: (res) => {
          res.setHeader("Cache-Control", "no-store");
        },
      })
    );

    // SPA fallback
    server.use((req, res, next) => {
      const root = `/${CONFIG.html_server_path}`;
      if (req.path === root || req.path.startsWith(root + "/")) {
        return res.sendFile(path.join(staticPath, "index.html"));
      }
      next();
    });
  } else {
    server.get("/", (req, res) => {
      res.send(CONFIG.welcome);
    });
  }

  // POST /
  server.post("/", (req, res) => {
    res.send(CONFIG.welcome);
  });

  // Health Check
  server.get("/health", (req, res) => {
    res.json({
      STATUS: "ok",
      SERVER: CONFIG.name,
      VERSION: CONFIG.version,
      TIMESTAMP: moment().format("Y-M-D HH:mm:ss"),
    });
  });

  // Ping
  server.get("/ping", (req, res) => {
    if (!CONFIG.debug) return res.sendStatus(404);

    res.json({
      SERVER: CONFIG.name,
      VERSION: CONFIG.version,
      TIMESTAMP: moment().format("Y-M-D HH:mm:ss"),
    });
  });

  // Timestamp
  server.get("/_/timestamp", (req, res) => {
    res.send(moment().format("Y-MM-DD HH:mm:ss"));
  });

  // Reboot
  server.get("/_/reboot", (req, res) => {
    res.send("ok");
    process.exit();
  });

  // Debug info
  server.get("/_/debug", (req, res) => {
    if (!CONFIG.debug) return res.sendStatus(404);
    res.json(getDebugInfo(req, res));
  });

  // List routes (Express version)
  server.get("/_/routes", (req, res) => {
    if (!CONFIG.debug) return res.sendStatus(404);

    const list = [];

    function scan(stack, prefix = "") {
      stack.forEach((layer) => {
        if (layer.route) {
          const path = prefix + layer.route.path;
          const methods = Object.keys(layer.route.methods)
            .map((m) => m.toUpperCase())
            .join(", ");

          list.push({ path, methods });
        } else if (layer.handle?.stack) {
          scan(layer.handle.stack, prefix);
        }
      });
    }

    scan(server._router?.stack || []);

    res.json(list);
  });

  server.get("/_/log-test", (req, res) => {
    _LOGGER.log({ msg: "Test route hit", ip: req.ip }, "server", "info");
    res.send("Logged to 'server' logger");
  });

  // Catch-all for unknown routes
  server.use((req, res) => {
    res.status(404).json({
      error: "Method or Path not found",
      path: req.path,
    });
  });
};
