var express = require("express"),
    router = express.Router(),
    parseString = require('xml2js').parseString,
    fs = require('fs'),
    xml2js = require('xml2js'),
    us = require('underscore'),
    multer = require('multer'),
    helper = require('../util/helperfunctions.js');; //,
//test = require('./test')();

var uploading = multer({
    dest: './public/uploads/'
});

module.exports = (function() {
    "use strict";

    router.get('/*', function(req, res, next) {
        var protocol = 'http' + (req.connection.encrypted ? 's' : '') + '://',
            host = req.headers.host,
            href;

        // no www. present, nothing to do here
        if (!/^www\./i.test(host)) {
            next();
            return;
        }

        // remove www.
        host = host.replace(/^www\./i, '');
        href = protocol + host + req.url;
        res.statusCode = 301;
        res.setHeader('Location', href);
        res.write('Redirecting to ' + host + req.url + '');
        res.end();
    });

    router.get('/', function(req, res) {
        res.render('index', {
            title: "Home",
            header: "Welkom!",
            readFile: req.session.file
        });
    });

    router.get('/fileupload', function(req, res) {
        res.render("file-upload", {
            title: "Upload bestand",
            header: "Bestand uploaden",
            readFile: req.session.file,
            messages: req.flash()
        });
    });

    router.post('/upload', uploading.single('xml'), function(req, res) {
        if (typeof req.file === 'undefined') {
            req.flash('error', 'Kies een bestand om te uploaden');
            res.redirect('/fileupload');
        }

        req.session.filename = req.file.originalname;

        var json;

        try {
            var fileData = fs.readFileSync(req.file.originalname, 'ascii');

            var parser = new xml2js.Parser();
            parser.parseString(fileData.substring(0, fileData.length), function(err, result) {
                json = JSON.parse(JSON.stringify(result, null, 3));
            });

            console.log("File '" + req.file.path + req.file.filename + "' was successfully read. Size is " + json.RECORDS.RECORD.length + " \n");
        } catch (ex) {
            console.log("Unable to read file '" + req.file.path + req.file.filename + "'.");
            console.log(ex);
        }

        req.session.file = json.RECORDS.RECORD;

        res.redirect('/readings');
    });

    router.get('/table', function (req, res) {
  		var blacklist = []//[4,5,13,14,15,16,17,18,30,31,32,19,20,21,22,23,24,25,26,27,28,29]
  		var results = helper.getData("realData.csv");
  		res.render('table', {
        title: 'Table',
  			Results: results,
  			Blacklist: blacklist,
        readFile: req.session.file
      })
  	});

  	router.get('/getGraphData', function(req, res){
  		res.send(helper.parseData(req));
  	});

  	router.get('/dailyGraph', function(req, res){
      res.render('dailyGraph', {
        title: 'Graph',
        readFile: req.session.file
      });
  	});

  	router.get('/moregraphs', function(req, res){
  		res.render('moreGraphs', {
        title: 'More graphs',
        readFile: req.session.file
      });
  	});

  	////////////////////
  	// GET table page //
  	////////////////////
    router.get('/readings', function(req, res) {
        var json = req.session.file;
        var curDate, curCat, curVal, curDesc, curCom, curHour, curDay;
        var resultFile = [];

        if (typeof json === 'undefined') {
            req.flash("error", "Lees eerst een bestand in.");
            res.redirect("/fileupload");
        }

        json.sort(function(a, b) {
            return (b.ROW[0].$.DATEEVENT.replace(",", ".") - a.ROW[0].$.DATEEVENT.replace(",", "."));
        });

        for (var n = 0; n < json.length; n++) {
            var current = json[n].ROW[0].$;
            var unixTime = (current.DATEEVENT.replace(",", ".") - 25569) * 86400;

            current.id = json[n].ROW[0].$.id = n + 1;

            // Read the dates and put them in an array
            var date = new Date(unixTime * 1000);

            var day = date.getUTCDate();
            var month = date.getUTCMonth() + 1;
            var year = date.getUTCFullYear();
            var hours = "0" + date.getUTCHours();
            var minutes = "0" + date.getUTCMinutes();
            var seconds = "0" + date.getUTCSeconds();

            curDate = day + "-" + month + "-" + year + " " + hours.substr(-2) + ":" + minutes.substr(-2) + ":" + seconds.substr(-2);
            curHour = hours.substr(-2);
            curDay = day + "-" + month + "-" + year;

            if (current.EVENTTYPE === "0") {
                curCat = "Beweging";
                curDesc = current.C0 + "\n" + current.C1 + "\n" + current.C2;
            } else if (current.EVENTTYPE === "1") {
                curCat = "Glucosemeting";
                curVal = parseFloat(current.I1 / 18).toFixed(2);// + " mmol\/L";
                curDesc = current.C0;
            } else if (current.EVENTTYPE === "2") {
                curCat = "Basaal";
                curVal = current.D0;// + " eenheden";
                curDesc = current.C1;
            } else if (current.EVENTTYPE === "3") {
                curCat = "Bolus";
                curVal = current.D0;// + " eenheden";
                curDesc = current.C0 + "\n" + current.C1 + "\n" + current.C2;
            } else if (current.EVENTTYPE === "4") {
                curCat = "Labresultaten";
                curVal = current.C1;
                curDesc = current.C0 + "\n" + current.C1 + "\n" + current.C2 + "\n" + current.C3;
            } else if (current.EVENTTYPE === "5") { // Descriptions need to be fixed here: re-read CoPilot import manual
                curCat = "Maaltijd";
                curVal = current.D1;// + " gram";
            } else if (current.EVENTTYPE === "6") {
                curCat = "Medisch onderzoek";
                curDesc = current.C0 + "\n" + current.C1;
            } else if (current.EVENTTYPE === "7") {
                curCat = "Medicijnen";
                curDesc = current.C0 + "\n" + current.C1 + "\n" + current.C2;
            } else if (current.EVENTTYPE === "8") {
                curCat = "Notities";
                curDesc = current.C0 + "\n" + current.C1;
            } else if (current.EVENTTYPE === "9") {
                curCat = "Gezondheid";
                curDesc = current.C0;
            } else if (current.EVENTTYPE === "10") {
                curCat = "Keton";
                curVal = current.D0;
                curDesc = current.C0 + "\n" + current.C1 + "\n" + current.C2;
            } else if (current.EVENTTYPE === "15") {
                curCat = "Alarm";
                curVal = current.I0;
            } else if (current.EVENTTYPE === "16") {
                curCat = "Generiek";
            } else {
                curCat = "";
                curDesc = "";
            }

            if (typeof curDesc === 'undefined')
                curDesc = "";

            // Read comments and push them to an array
            if (typeof current.COMMENT != 'undefined')
                curCom = current.COMMENT.replace(/; /g, "\n").replace(".", ". ");
            else
                curCom = "";

            if (typeof curVal === 'undefined')
                curVal = "";

            if (curCat === "Bolus") {
	            resultFile.push({
	                id: current.id,
	                date: curDate,
	                day: curDay,
	                bolusHour: curHour,
	                bolusValue: curVal,
	                category: curCat,
	                description: curDesc,
	                comment: curCom
	            });
            } else if (curCat === "Basaal") {
            	resultFile.push({
	                id: current.id,
	                date: curDate,
	                day: curDay,
	                basalHour: curHour,
	                basalValue: curVal,
	                category: curCat,
	                description: curDesc,
	                comment: curCom
	            });
            } else if (curCat === "Glucosemeting") {
            	resultFile.push({
	                id: current.id,
	                date: curDate,
	                day: curDay,
	                glucoseHour: curHour,
	                glucoseValue: curVal,
	                category: curCat,
	                description: curDesc,
	                comment: curCom
	            });
            }
        }

		var resultObj = us.chain(resultFile)
		.groupBy('day')
		.map(function(elem, hour) {
			return {
				"ids": us.pluck(elem, 'id'),
            	"basalValues": us.pluck(elem, 'basalValue'),
            	"bolusValues": us.pluck(elem, 'bolusValue'),
            	"glucoseValues": us.pluck(elem, 'glucoseValue'),
            	"categories": us.pluck(elem, 'category'),
            	"descriptions": us.pluck(elem, 'description'),
            	"comments": us.pluck(elem, 'comment'),
            	"date": us.pluck(elem, 'date'),
            	"day": us.pluck(elem, 'day')[0],
                "basalHours": us.pluck(elem, 'basalHour'),
                "bolusHours": us.pluck(elem, 'bolusHour'),
                "glucoseHours": us.pluck(elem, 'glucoseHour')
			}
		})
		.value();

        res.render('readings', {
            title: 'Tabel OmniPod',
            header: 'Uitgelezen waarden',
            readFile: JSON.stringify(resultObj)
        });
    });

	////////////////////
	// GET graph page //
	////////////////////
    router.get('/graph', function(req, res) {
        if (typeof req.session.file === 'undefined') {
            req.flash("error", "Lees eerst een bestand in.");
            res.redirect("/fileupload");
        }

        var json;
        var dates = [],
            values = [],
            items = [],
            valuesCarbs = [],
            datesCarbs = [],
            itemsCarbs = [];

        json = req.session.file;

        json.sort(function(a, b) {
            return (a.ROW[0].$.DATEEVENT.replace(",", ".") - b.ROW[0].$.DATEEVENT.replace(",", "."));
        });

        for (var n = 0; n < json.length; n++) {
            var current = json[n].ROW[0].$;
            var unixTime = (current.DATEEVENT.replace(",", ".") - 25569) * 86400;

            // Read the dates and put them in an array
            var date = new Date(unixTime * 1000);

            var day = "0" + date.getUTCDate();
            var month = "0" + (date.getUTCMonth() + 1);
            var year = date.getUTCFullYear();
            var hours = "0" + date.getUTCHours();
            var minutes = "0" + date.getUTCMinutes();
            var seconds = "0" + date.getUTCSeconds();

            // Read glucose values and put them in an array of the same size
            if (current.EVENTTYPE === "1") {
                items.push({
                    waarde: parseFloat(current.I1 / 18).toFixed(2),
                    datum: year + "-" + day.substr(-2) + "-" + month.substr(-2) + " " + hours.substr(-2) + ":" + minutes.substr(-2) + ":" + seconds.substr(-2)
                });
            } else if (current.EVENTTYPE === "2") {
                items.push({
                    waardeBasal: parseInt(current.D0),
                    datum: year + "-" + day.substr(-2) + "-" + month.substr(-2) + " " + hours.substr(-2) + ":" + minutes.substr(-2) + ":" + seconds.substr(-2)
                });
            } else if (current.EVENTTYPE === "3") {
                items.push({
                    waardeBolus: parseInt(current.D0),
                    datum: year + "-" + day.substr(-2) + "-" + month.substr(-2) + " " + hours.substr(-2) + ":" + minutes.substr(-2) + ":" + seconds.substr(-2)
                });
            } else if (current.EVENTTYPE === "5") {
                items.push({
                    waardeCarbs: parseInt(current.D1),
                    datum: year + "-" + day.substr(-2) + "-" + month.substr(-2) + " " + hours.substr(-2) + ":" + minutes.substr(-2) + ":" + seconds.substr(-2)
                });
            }
        }

        res.render("graph", {
            title: "Grafiek OmniPod",
            header: "Gemeten waarden",
            items: JSON.stringify(items),
            readFile: req.session.file
        });

    });

    return router;
})();
