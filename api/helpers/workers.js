/*
 * Worker Manager Controller
 * Features:
 * - Auto Respawn
 * - Max Concurrency
 * - Job Queue
 * - Graceful Shutdown
 * - Hybrid Execution (threads / processes)
 * 
 * Manages worker threads: load, unload, send messages, broadcast, restart, list.
 * Workers are located in app/workers directory.
 * 
 * Environment variable WORKER_MODE can be set to "threads" or "process" (default: "threads").
 *  threads → uses worker_threads
 *  process → uses child_process.fork()
 * */

const { Worker: ThreadWorker } = require("worker_threads");
const { fork: ProcessWorker } = require("child_process");

const WORKER_MODE = process.env.WORKER_MODE || "threads";  // "threads" | "process"
const MAX_CONCURRENCY_PER_WORKER = parseInt(process.env.MAX_CONCURRENCY || "5");
const AUTO_RESPAWN = process.env.AUTO_RESPAWN !== "false";

module.exports = function(server) {

    const WORKER_DIR = path.join(CONFIG.ROOT_PATH+'/app/workers');
    const workers = new Map(); // name → worker instance
    const workerMeta = new Map(); // name → status, file, pid, uptime
    const jobQueues = new Map();     // name → job queue (FIFO)

    initialize = function() {
        setupGracefulShutdown();

        console.log("\x1b[36m%s\x1b[0m", `Worker Manager Initialized  [Mode: ${WORKER_MODE}], MaxConcurrency=${MAX_CONCURRENCY_PER_WORKER}, AutoRespawn=${AUTO_RESPAWN}`);// With-"+Object.keys(ACTIVE_JOBS).length+" Active Jobs
    };

    // ------------------------
    // INTERNAL SPAWN
    // ------------------------
    function spawnWorker(name, filePath) {
        return WORKER_MODE === "threads"
            ? new ThreadWorker(filePath)
            : ProcessWorker(filePath);
    }

    // ------------------------
    // PROCESS JOB QUEUE
    // ------------------------
    function processQueue(workerName) {
        const meta = workerMeta.get(workerName);
        const queue = jobQueues.get(workerName);
        const worker = workers.get(workerName);

        if (!worker || meta.runningJobs >= MAX_CONCURRENCY_PER_WORKER) return;
        if (!queue || queue.length === 0) return;

        const job = queue.shift();
        meta.runningJobs++;

        sendRaw(worker, job.payload);
    }

    // ------------------------
    // RAW SEND (MODE SAFE)
    // ------------------------
    function sendRaw(worker, payload) {
        worker.send ? worker.send(payload) : worker.postMessage(payload);
    }

    // ------------------------
    // LOAD WORKER
    // ------------------------
    loadWorker = function (workerName) {
        if (workers.has(workerName)) return { status: "already_loaded" };

        const filePath = path.join(WORKER_DIR, `${workerName}.worker.js`);
        if (!fs.existsSync(filePath)) throw new Error(`Worker not found: ${filePath}`);

        const worker = spawnWorker(workerName, filePath);

        workers.set(workerName, worker);
        jobQueues.set(workerName, []);

        workerMeta.set(workerName, {
            name: workerName,
            file: filePath,
            mode: WORKER_MODE,
            pid: worker.pid || worker.threadId,
            status: "running",
            startedAt: Date.now(),
            runningJobs: 0,
            processedJobs: 0,
            crashes: 0
        });

        // MESSAGE HANDLER
        worker.on("message", (msg) => {
            const meta = workerMeta.get(workerName);
            meta.runningJobs = Math.max(0, meta.runningJobs - 1);
            meta.processedJobs++;

            processQueue(workerName);
        });

        // AUTO RESPAWN LOGIC
        worker.on("exit", (code) => {
            console.warn(`Worker exited [${workerName}] Code=${code}`);

            const meta = workerMeta.get(workerName);
            meta.status = "stopped";

            workers.delete(workerName);

            if (AUTO_RESPAWN && code !== 0) {
                meta.crashes++;
                console.log(`Auto-respawning ${workerName}`);
                loadWorker(workerName);
            }
        });

        worker.on("error", (err) => {
            console.error(`Worker crashed [${workerName}]`, err);
            workerMeta.get(workerName).status = "crashed";
        });

        return { status: "loaded", worker: workerName };
    };

    // ------------------------
    // UNLOAD WORKER
    // ------------------------
    unloadWorker = function (workerName) {
        const worker = workers.get(workerName);
        if (!worker) return { status: "not_running" };

        WORKER_MODE === "threads"
            ? worker.terminate()
            : worker.kill("SIGTERM");

        workers.delete(workerName);
        workerMeta.get(workerName).status = "terminated";

        return { status: "unloaded", worker: workerName };
    };

    // ------------------------
    // RESTART WORKER
    // ------------------------
    restartWorker = function (workerName) {
        unloadWorker(workerName);
        return loadWorker(workerName);
    };

    // ------------------------
    // QUEUE JOB (CONCURRENCY SAFE)
    // ------------------------
    enqueueJob = function (workerName, payload) {
        const meta = workerMeta.get(workerName);
        if (!meta) throw new Error("Worker not loaded");

        jobQueues.get(workerName).push({ payload });
        processQueue(workerName);

        return {
            status: "queued",
            worker: workerName,
            queueLength: jobQueues.get(workerName).length,
            running: meta.runningJobs
        };
    };

    // ------------------------
    // BROADCAST
    // ------------------------
    broadcast = function (payload) {
        for (const [name] of workers.entries()) {
            enqueueJob(name, payload);
        }

        return { status: "broadcast_queued", count: workers.size };
    };

    // ------------------------
    // LIST WORKERS
    // ------------------------
    listWorkers = function () {
        return Array.from(workerMeta.values()).map(meta => ({
            ...meta,
            uptime: Date.now() - meta.startedAt,
            queueLength: jobQueues.get(meta.name)?.length || 0
        }));
    };

    // ------------------------
    // AUTOLOAD
    // ------------------------
    autoload = function () {
        fs.readdirSync(WORKER_DIR).forEach(file => {
            if (file.endsWith(".worker.js")) {
                loadWorker(file.replace(".worker.js", ""));
            }
        });
    };

    // ------------------------
    // GRACEFUL SHUTDOWN
    // ------------------------
    function setupGracefulShutdown() {
        const shutdown = (signal) => {
            console.log(`Graceful shutdown triggered: ${signal}`);

            for (const [name, worker] of workers.entries()) {
                try {
                    WORKER_MODE === "threads"
                        ? worker.terminate()
                        : worker.kill("SIGTERM");
                } catch (e) {}
            }

            setTimeout(() => process.exit(0), 1000);
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
    }

    return this;
}