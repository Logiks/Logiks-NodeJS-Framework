/*
 * worker mangement api routes
 * 
 * */

module.exports = function(server) {
    server.get("/workers", (req, res) => {
        res.json(WORKERS.listWorkers());
    });

    app.post("/workers/job/:name", express.json(), (req, res) => {
        res.json(WORKERS.enqueueJob(req.params.name, req.body));
    });

    server.post("/workers/load/:name", (req, res) => {
        res.json(WORKERS.loadWorker(req.params.name));
    });

    server.post("/workers/unload/:name", (req, res) => {
        res.json(WORKERS.unloadWorker(req.params.name));
    });

    server.post("/workers/restart/:name", (req, res) => {
        res.json(WORKERS.restartWorker(req.params.name));
    });

    server.post("/workers/send/:name", express.json(), (req, res) => {
        res.json(WORKERS.sendMessage(req.params.name, req.body));
    });
}