var express = require('express'),
		flash = require('connect-flash'),
		session = require('express-session'),
		morgan = require('morgan');

var app = express();

if (app.get('env') === 'development') {
  app.locals.pretty = true;
}

app.set("view engine", "jade")
app.use(morgan("dev"))
app.use(express.static(__dirname + "/views"));
app.use(session({
	secret: "HagaZiekenhuis",
	cookie: { maxAge: 1000 * 60 * 60 * 48, secure: false },
	resave: true,
	saveUninitialized: false
}));
app.use(flash());

var web = require('./routes/web');
app.use('/', web);

app.listen(3000, '127.0.0.1', function() {
	console.log('Listening');
});