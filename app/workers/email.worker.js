//Sample Worker to handle Email Sending Tasks

const isThread = !!require("worker_threads").parentPort;
const parent = isThread
    ? require("worker_threads").parentPort
    : process;

console.log("📨 Email Worker Started | Mode:", isThread ? "threads" : "process");

parent.on("message", async (job) => {
    try {
        if (job.action === "send") {
            await new Promise(r => setTimeout(r, 500)); // simulated IO
            respond({ status: "sent", to: job.to });
        }
    } catch (err) {
        respond({ status: "failed", error: err.message });
    }
});

function respond(msg) {
    parent.postMessage ? parent.postMessage(msg) : parent.send(msg);
}
