var express = require('express'),
	flash = require('connect-flash'),
	session = require('express-session'),
	morgan = require('morgan'),
	passport = require('passport'),
	mongoose = require('mongoose'),
	bodyParser = require('body-parser');

var app = express();

var configDB = require('./config/database.js');

try {
	// Database connect options
	var options = { replset: { socketOptions: { connectTimeoutMS : 1000 * 30 }}};

	mongoose.connect(configDB.url, configDB.options);

	var db = mongoose.connection;
	db.on("error", console.error.bind(console, "connection error:"));
	db.once("open", function callback() {
		// connected
		console.log("connection mongodb opened");
	})
} catch(err) {
	console.log(err);
}

// make our db accessible to our router - globals
app.use(function(req, res, next) {
	req.db = db;
	next();
});

require('./config/passport')(passport);

if (app.get('env') === 'development') {
  app.locals.pretty = true;
}

app.use( bodyParser.urlencoded({ extended: true }) );

app.set("view engine", "jade");
app.use(morgan("dev"));
app.use(express.static(__dirname + "/views"));
app.use(session({
	secret: "HagaZiekenhuis",
	cookie: { maxAge: 1000 * 60 * 60 * 48, secure: false },
	resave: true,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash());

var web = require('./routes/web')();
var users = require('./routes/users')(passport);
var files = require('./routes/files')();
app.use('/', web);
app.use('/', users);
app.use('/', files);

app.listen(3000, '127.0.0.1', function() {
	console.log('Listening');
});