/*
 * Logging functions
 * Create A Logger, may be we will remove this in future
 * LEVELS : trace,debug,info,warn,error,fatal
 * 
 * // console.error("ERROR CONSOLE 1");
 * // logger.debug("DEBUG CONSOLE 3");
 * // logger.info("INFO CONSOLE 3");
 * // logger.warn("WARN CONSOLE 3");
 * // logger.error("ERROR CONSOLE 30");
 * 
 * 
 * */

const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const expressWinston = require("express-winston");

const LEVELS = ["error", "warn", "info", "http", "verbose", "debug", "silly"];

module.exports = {
  LOGGERS: {},

  logKeys() {
    return Object.keys(this.LOGGERS);
  },

  loggers() {
    return this.LOGGERS;
  },

  initLoggers() {
    const that = this;

    // Ensure logs directory exists
    try {
      if (!fs.existsSync("./logs")) fs.mkdirSync("./logs");
    } catch (e) {
      // ignore
    }

    Object.entries(CONFIG.LOGGER || {}).forEach(([loggerName, streams]) => {
      const transports = [];

      (streams || []).forEach((s) => {
        if (s.stream === "console" || s.stream === process.stdout) {
          transports.push(
            new winston.transports.Console({
              level: s.level || "info",
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.colorize(),
                winston.format.simple()
              ),
            })
          );
          return;
        }

        if (s.path) {
          const rotateOpts = s.rotate || {};
          transports.push(
            new DailyRotateFile({
              filename:
                path.basename(s.path).replace(/\.log$/, "") + "-%DATE%.log",
              dirname: path.dirname(s.path) || ".",
              datePattern: rotateOpts.period || "YYYY-MM-DD",
              zippedArchive: !!rotateOpts.gzip,
              maxSize: rotateOpts.maxSize || "20m",
              maxFiles: rotateOpts.maxFiles || "14d",
              level: s.level || "info",
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
              ),
            })
          );
          return;
        }

        transports.push(
          new winston.transports.Console({
            level: s.level || "info",
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.simple()
            ),
          })
        );
      });

      // Create logger
      const logger = winston.createLogger({
        // default
        level: "info",
        transports: transports.length
          ? transports
          : [new winston.transports.Console()],
      });

      that.LOGGERS[loggerName] = logger;
    });

    global.logger = this.LOGGERS["default"] || Object.values(this.LOGGERS)[0];

    console.log("\x1b[36m%s\x1b[0m", "WINSTON LOGGERS Initialized");
  },

  log(logObj, logKey = "default", logLevel = "info") {
    const logger = this.LOGGERS[logKey] || this.LOGGERS["default"];
    if (!logger) {
      // fallback to console
      console[logLevel === "error" ? "error" : "log"](logObj);
      return;
    }

    // Normalize level
    const lvl =
      typeof logLevel === "string" && LEVELS.includes(logLevel)
        ? logLevel
        : "info";

    if (typeof logObj !== "object") {
      logger.log({ level: lvl, message: String(logObj) });
    } else {
      logger.log({ level: lvl, ...logObj });
    }
  },

  requestLogger(options = {}) {
    const opts = Object.assign(
      {
        winstonInstance:
          this.LOGGERS["requests"] ||
          this.LOGGERS["default"] ||
          winston.createLogger({
            transports: [new winston.transports.Console()],
          }),
        meta: true,
        msg: "{{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms",
        expressFormat: false,
        colorize: false,
        level: function (req, res) {
          const status = res.statusCode;
          if (status >= 500) return "error";
          if (status >= 400) return "warn";
          return "info";
        },
      },
      options
    );

    return expressWinston.logger({
      winstonInstance: opts.winstonInstance,
      meta: opts.meta,
      msg: opts.msg,
      expressFormat: opts.expressFormat,
      colorize: opts.colorize,
      level: opts.level,
    });
  },
};
