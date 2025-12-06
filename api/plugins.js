/*
 * All Plugins are loaded and configured here
 * 
 * */
const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const multer = require('multer');
const useragent = require('express-useragent');
const rateLimit = require('express-rate-limit');
const basicAuth = require('express-basic-auth');

module.exports = function(server) {

    // ---------- Basic security & logging ----------
    server.use(helmet());                 // Sets various HTTP headers for security
    //server.use(morgan('dev'));            // Logs requests to the console
    // app.use(bunyanMiddleware({              // Logs requests using Bunyan, 
    //     _LOGGER.loggers().default,
    //     excludes: ['req.headers.authorization'], // optional security
    //     format: ':method :url :status :response-time ms',
    //     parseUA: true,
    // }));
    server.use(express.json());           // Parse JSON bodies
    server.use(express.urlencoded({ extended: true })); // Parse form-encoded bodies

    /**
     * =========================================================
     * PRE-MIDDLEWARE (Restify pre equivalents)
     * =========================================================
     */

    // context() → Express stores context naturally in req/res
    // dedupeSlashes() → normalize URLs
    server.use((req, res, next) => {
        req.url = req.url.replace(/\/{2,}/g, '/');
        next();
    });

    // sanitizePath()
    server.use((req, res, next) => {
        try {
            decodeURIComponent(req.path);
            next();
        } catch (err) {
            return res.status(400).json({ error: 'Bad Request' });
        }
    });

    /**
     * =========================================================
     * MIDDLEWARE (Restify plugins → Express equivalents)
     * =========================================================
     */

    // bodyParser
    server.use(bodyParser.json({
        limit: '0', // unlimited like maxBodySize: 0
    }));

    server.use(bodyParser.urlencoded({
        extended: true,
        parameterLimit: 100000,
        limit: '20mb' // maxFieldsSize: 20MB
    }));

    // queryParser
    // Express automatically parses req.query

    // acceptParser
    server.use((req, res, next) => {
        res.format({
            json: () => next(),
            text: () => next(),
            default: () => res.status(406).send('Not Acceptable')
        });
    });

    // dateParser (Date header)
    server.use((req, res, next) => {
        res.setHeader('Date', new Date().toUTCString());
        next();
    });

    // fullResponse
    server.use((req, res, next) => {
        res.set('Connection', 'keep-alive');
        next();
    });

    // gzipResponse
    server.use(compression());

    // userAgent support (Restify req.userAgent())
    server.use(useragent.express());
    
    /**
     * =========================================================
     * OPTIONAL: THROTTLING (Restify throttle → Express rate-limit)
     * =========================================================
     */
    /*
    const limiter = rateLimit({
        windowMs: 2 * 1000, // 2 seconds
        max: 1,
        standardHeaders: true,
        legacyHeaders: false
    });
    server.use(limiter);
    */

    /**
     * =========================================================
     * OPTIONAL: BASIC AUTH (Restify authorizationParser)
     * =========================================================
     */
    /*server.use(basicAuth({
        users: { 'bkm': 'test123' },
        challenge: true
    }));
    */
}
