/*
 * All Additional Middlewares are defined here
 * They are loaded before routes are processed
 * 
 * */
module.exports = function (server) {

    /**
     * =========================================================
     * CORS HANDLER (Fully Preserved)
     * =========================================================
     */
    server.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');

        if (req.method.toUpperCase() === "OPTIONS") {
            const allowHeaders = [
                "Accept",
                "Accept-Version",
                "Content-Type",
                "Api-Version",
                "Origin",
                "X-Requested-With",
                "x-data-hash",
                "authorization",
                "auth-token",
                "appid",
                "appkey",
                "apikey",
                "sesskey",
            ];

            res.header("Access-Control-Allow-Credentials", true);
            res.header("Access-Control-Allow-Headers", allowHeaders.join(", "));
            res.header(
                "Access-Control-Allow-Methods",
                "GET, POST, OPTIONS, PUT, DELETE, AUTHORIZATION"
            );
            return res.sendStatus(204);
        }

        next();
    });

    /**
     * =========================================================
     * REQUEST LOGGER (Restify log → Express equivalent)
     * =========================================================
     */
    server.use((req, res, next) => {
        if (req.useragent?.source === 'ELB-HealthChecker/2.0') {
            return next();
        }

        if (CONFIG.log_requests) {
            const logPayload = {
                PATH: req.path,
                METHOD: req.method,
                BODY: req.body,
                QUERY: req.query,
                PARAMS: req.params,
                HEADERS: req.headers,
                HOST: req.get("host"),
                CLIENT_IP: MISC.getClientIP(req),
                USER_AGENT: req.useragent?.source,
            };

            console.info(logPayload);

            _LOGGER.log(logPayload, "requests");
        }

        next();
    });

    /**
     * =========================================================
     * GLOBAL ERROR HANDLER
     * =========================================================
    */
    server.use((err, req, res, next) => {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    });
};
