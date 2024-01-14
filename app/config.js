const packageConfig = require('../package.json');

const RotatingFileStream = require('bunyan-rotating-file-stream');

module.exports = {
	name: packageConfig.title,
	version: packageConfig.version,
	packageid: packageConfig.name,
	env: process.env.NODE_ENV || 'development',
	port: process.env.PORT || 8888,
	host: process.env.HOST || "0.0.0.0",
	welcome: "Welcome to SmartinfoLogiks API Server 2",

	debug: true,
	remoteDebug: true,
	audit: false,
	log_requests: false,
	log_sql: false,
	intercept_axios_request: false,
	intercept_axios_response: false,
	allow_home_info: false,
	default_lang: "en-gb",

	noauth: [
		"/auth",
		"/auth/register",
		"/auth/forgotpwd",
		"/auth/resetpwd",
		"/ping",
		"/test",
		"/"
	],
	IPWHITELISTING: {
		"/test": ["*"],
	},

	AUTHJWT: {
		secret: "Zv7QFrJWhSz6j2kA",
		expires: (60*60) //1 hour of expiration
	},

	mail:{
		host: 'email-smtp.us-east-1.amazonaws.com',
		port: 587,
		secure: false, // true for 465, false for other ports
		auth: {
		    user: "smtp-userid", // generated ses user
		    pass: "smtp-pwd" // generated ses password
		},
		default_from: 'noreply@smartinfologiks.com'
	},

	STORAGE: {
		type: "S3",
		bucket: "test1"
	},

	dbmongo: {
		enable: false,
		uri: 'mongodb://127.0.0.1:27017/silkapi'
	},
	dbmysql: {
		enable: false,
		host: '127.0.0.1',
		port: 3306,
		user: 'test',
		password: 'test',
		database: 'testdb',
		insecureAuth : true
  	},
	cache : {
		enable: false,
		host: '127.0.0.1',   // Redis host
		port: 6379,          // Redis port
		family: 4,           // 4 (IPv4) or 6 (IPv6)
		//password: 'auth',
		db: 0
	},
	queue : {
		enable: false,
		host: 'amqp://rabbit01:rabbit01@127.0.0.1:5672'
	},

	LOGGER: {
		default: [
			{
	            level: 'info',
	            path: './logs/info.log'
	        },
	        {
	            level: 'debug',
	            stream: process.stdout
	        },
	        {
	            level: 'error',
	            stream: new RotatingFileStream({
	                path: './logs/error.log',
	                period: '1d',          // daily rotation
	                totalFiles: 10,        // keep up to 10 back copies
	                rotateExisting: true,  // Give ourselves a clean file when we start up, based on period
	                threshold: '10m',      // Rotate log files larger than 10 megabytes
	                totalSize: '20m',      // Don't keep more than 20mb of archived log files
	                gzip: true             // Compress the archive log files to save space
	            })
	        }
		]
	}
};