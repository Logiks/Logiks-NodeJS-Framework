const packageConfig = require("../package.json");

module.exports = {
  name: packageConfig.title,
  version: packageConfig.version,
  packageid: packageConfig.name,
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 8888,
  host: process.env.HOST || "0.0.0.0",
  welcome: "Welcome to Logiks NodeJS Framework",

  debug: true,
  remoteDebug: true,
  audit: false,
  log_requests: false,
  log_sql: false,
  intercept_axios_request: false,
  intercept_axios_response: false,
  allow_home_info: false,
  default_lang: "en-gb",

  html_server_path: "assets",
  html_public_folder: "public",
  html_server_allow_root: true,
  enable_public_folder: true,

  allow_core_routes: false,
  strict_routes: false,

  is_microservice: false,
  microservice_client: {
	host_url: "",
	host_key: "",
	autoconnect: true,
  },

  microservice_server: {
	host_key: "",
	autodiscover: false,
  },

  cors: {
	domains: [],
  },

  NOAUTH: [
	"/auth",
	"/public",
	"/auth/register",
	"/auth/forgotpwd",
	"/auth/resetpwd",
	"/ping",
	"/test",
	"/",
  ],
  IPWHITELISTING: {
	"/test": ["*"],
  },

  AUTHJWT: {
	secret: "Zv7QFrJWhSz6j2kA",
	expires: 60 * 60, //1 hour of expiration
  },

  mail: {
	host: "email-smtp.us-east-1.amazonaws.com",
	port: 587,
	secure: false, // true for 465, false for other ports
	auth: {
	  user: "smtp-userid", // generated ses user
	  pass: "smtp-pwd", // generated ses password
	},
	default_from: "noreply@smartinfologiks.com",
  },

  STORAGE: {
	type: "S3",
	bucket: "test1",
  },

  dbmongo: {
	enable: false,
	uri: "mongodb://127.0.0.1:27017/silkapi",
  },
  dbmysql: {
	enable: false,
	host: "127.0.0.1",
	port: 3306,
	user: "test",
	password: "test",
	database: "testdb",
	connectionLimit: 4,
	debug: false,
	insecureAuth: true,
  },
  cache: {
	enable: false,
	host: "127.0.0.1", // Redis host
	port: 6379, // Redis port
	family: 4, // 4 (IPv4) or 6 (IPv6)
	//password: 'auth',
	db: 0,
  },
  queue: {
	enable: false,
	host: "amqp://rabbit01:rabbit01@127.0.0.1:5672",
  },

  LOGGER: {
	default: [
	  {
		level: "info",
		path: "./logs/info.log",
	  },
	  {
		level: "debug",
		stream: "console",
	  },
	  {
		level: "error",
		path: "./logs/error.log",
		rotate: {
		  period: "1d",
		  maxFiles: "10d", // keep last 10 days
		  maxSize: "10m",
		  gzip: true,
		},
	  },
	],
	server: [
	  {
		level: "info",
		path: "./logs/server.log",
	  },
	  {
		level: "debug",
		stream: "console",
	  },
	  {
		level: "error",
		path: "./logs/error.log",
		rotate: {
		  period: "1d",
		  maxFiles: "10d", // keep last 10 days
		  maxSize: "10m",
		  gzip: true,
		},
	  },
	],
  },

  AUTOMATOR_JOBS: {
	// demo1: {
	//   schedule: "* * * * * *",
	//   plugin: "demo",
	//   params: {
	//     test1: "hello world",
	//   },
	// },
  }
};
