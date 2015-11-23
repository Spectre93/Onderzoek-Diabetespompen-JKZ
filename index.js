var express = require('express');
var app = express();
var routes = require('./routes/routes.js')(app);

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'jade');
		
if (app.get('env') === 'development')
	app.locals.pretty = true;	//pretty means not minified

var server = app.listen(3000, function () {
  var host = server.address().address
  var port = server.address().port

  console.log("Listening at http://%s:%s", host, port);
});