var helper = require('../util/helperfunctions.js');

module.exports = function(app){

	app.get('/', function (req, res) {
		res.redirect('/Home');
	});
				
	app.get('/home', function (req, res) {
		res.render('home', {title: 'Home'});
	});

	app.get('/table', function (req, res) {
		var blacklist = []//[4,5,13,14,15,16,17,18,30,31,32,19,20,21,22,23,24,25,26,27,28,29]
		var results = helper.getData("realData.csv");	
		res.render('table', {	title: 'Table',
													Results: results,
													Blacklist: blacklist})
	});

	app.get('/getGraphData', function(req, res){
		res.send(helper.parseData(req));
	});

	app.get('/graph', function(req, res){
		res.render('graph', {title: 'Graph'});
	});

	app.get('/moregraphs', function(req, res){
		res.render('moreGraphs', {title: 'More graphs'});
	});
	
	app.get('/index', function (req, res) {
   res.status(404).send('Sorry, we cannot find that!');
	});
}