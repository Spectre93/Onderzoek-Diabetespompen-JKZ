var express = require("express"),
    router = express.Router(),
    parseString = require('xml2js').parseString,
    fs = require('fs'),
    xml2js = require('xml2js'),
    us = require('underscore'),
    multer = require('multer'),
    helper = require('../util/helperfunctions.js'),
    baby = require('babyparse'); //,
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

    router.post('/upload', uploading.single('inputFile'), function(req, res) {
        req.session.filename = req.file.originalname;
        req.session.filetype = req.file.mimetype;

        if (req.file.mimetype === "text/xml") {
            var json;

            try {
                var fileData = fs.readFileSync(req.file.originalname, 'ascii');

                var parser = new xml2js.Parser();
                parser.parseString(fileData.substring(0, fileData.length), function(err, result) {
                    json = JSON.parse(JSON.stringify(result, null, 3));
                });

                console.log("File '" + req.file.path + req.file.filename + "' was successfully read. Encoding " + req.file.encoding + " en MIME type " + req.file.mimetype + ". Size is " + json.RECORDS.RECORD.length + " \n");
            } catch (ex) {
                console.log("Unable to read file '" + req.file.path + req.file.filename + "'.");
                console.log(ex);
            }

            req.session.file = json.RECORDS.RECORD;
            res.redirect('/readings');
        }else{
			//##### Paradigm Veo #####				
		
			var path = req.file.path;
			//Read the file and cut away the bits we don't need so it can be parsed
			var file = fs.readFileSync(path).toString();
			file = file.substring(file.indexOf(";-------")+11, file.indexOf("-------;", file.indexOf(";-------"))-3);;
			
			//Parse the file, returns JSON-object
			var parseResults = baby.parse(file,{	
				header: true,
				fastMode: true,		//Speeds up parsing for files that contain no quotes.
				skipEmptyLines: true,
				dynamicTyping: true,
				delimiter: ";"
			});
			
			//Sort the results.data array
			parseResults.data = parseResults.data.sort(function (a, b) {
				if (a["Date"] > b["Date"])
					return 1;
				else if (a["Date"] < b["Date"])
					return -1;
				
				//When the dates are equal, check the times
				if(a["Time"] > b["Time"])
					return 1;
				else if(a["Time"] < b["Time"])
					return -1;
				
				//If the times are equal too, check for any of these
				if(a["Suspend"] || a["BWZ Estimate (U)"] || a["Temp Basal Type"])
					return -1;
				else 
					return 1;
			});
			
			//Loop through data and combine certain events
			var combinedData = [];
			for(var i = 0; i < parseResults.data.length; i++){
				var currentEntry = parseResults.data[i];
				var resultItem = {};
						
				resultItem.date = currentEntry["Date"];
				resultItem.time = currentEntry["Time"];
				resultItem.timestamp = resultItem.date + " " + resultItem.time;
				
				//If there's a reading, add it to the new item
				var bgReading = currentEntry["BG Reading (mmol/L)"];
				if(bgReading != "")
					resultItem.bgReading = bgReading;
				
				//If there's basal rate change, add it to the new item
				var basalRate = currentEntry["Basal Rate (U/h)"];
				if(basalRate != "")				
					resultItem.basalRate = basalRate;

				//If there's a bolus entry, add it to the new item
				var bolusType = currentEntry["Bolus Type"];
				if(bolusType != ""){
					var bolusVolumeSelected = currentEntry["Bolus Volume Selected (U)"];
					var bolusVolumeDelivered = currentEntry["Bolus Volume Delivered (U)"];
					
					//If it's normal bolus, just add it to the new item
					if(bolusType == "Normal"){
						resultItem.bolusType = bolusType;
						resultItem.bolusVolumeSelected = bolusVolumeSelected;
						resultItem.bolusVolumeDelivered = bolusVolumeDelivered;
					}
					//If it's a Dual bolus, put the normal part in the new item
					else if(bolusType == "Dual (normal part)"){
						resultItem.bolusType = "Dual";
						resultItem.bolusVolumeSelected = bolusVolumeSelected;
						resultItem.bolusVolumeDelivered = bolusVolumeDelivered;
						
						//Look for the square part
						for(var j = 0; j < 10; j++){
							if(i + j < parseResults.data.length){
								var bolusDuration = parseResults.data[i+j]["Programmed Bolus Duration (h:mm:ss)"];
								if(bolusDuration != ""){
									//And add that to the item as well
									resultItem.squareVolumeSelected = parseResults.data[i+j]["Bolus Volume Selected (U)"];
									resultItem.squareVolumeDelivered = parseResults.data[i+j]["Bolus Volume Delivered (U)"];
									resultItem.bolusDuration = bolusDuration;
									break;
								}
							}
						}
					}
				}
				
				//If there's a rewind, note it as '1' in the item
				var rewind = currentEntry["Rewind"];
				if(rewind != ""){
					resultItem.rewind	= 1;
					
					//Look for the Primes it came with
					for(var j = 0; j < 10; j++){
						if(i + j < parseResults.data.length){
							var primeType = parseResults.data[i+j]["Prime Type"];
							if(primeType == "Manual"){
								resultItem.primeType = primeType;
								resultItem.manualPrimeVolumeDelivered = currentEntry["Prime Volume Delivered (U)"];
								
								//A Fixed one may come together with a manual one, always after manual
								for(var k = 0; k < 10; k++){
									if(i + j + k < parseResults.data.length){
										var primeType = parseResults.data[i+j+k]["Prime Type"];
										if(primeType == "Fixed"){
											resultItem.primeType = "Both";
											resultItem.fixedPrimeVolumeDelivered = currentEntry["Prime Volume Delivered (U)"];
											break;
										}
									}
								}
								break;
							}
						}
					}
				}
				
				//Alarms are added too
				var alarm = currentEntry["Alarm"];
				if(alarm != "")
					resultItem.alarm = alarm;
					
				//If there's a BWZ entry, there will be more. Add them all.
				var bolusVolumeEstimate = currentEntry["BWZ Estimate (U)"];
				if(bolusVolumeEstimate != ""){
					resultItem.bolusVolumeEstimate = bolusVolumeEstimate;
					resultItem.bwzHighTarget = currentEntry["BWZ Target High BG (mmol/L)"];
					resultItem.bwzLowTarget = currentEntry["BWZ Target Low BG (mmol/L)"];
					resultItem.bwzCarbRatio = currentEntry["BWZ Carb Ratio (g/U)"];
					resultItem.bwzInsulinSensitivity = currentEntry["BWZ Insulin Sensitivity (mmol/L/U)"];
					resultItem.bwzCarbInput = currentEntry["BWZ Carb Input (grams)"];
					resultItem.bwzBgInput = currentEntry["BWZ BG Input (mmol/L)"];
					resultItem.bwzCorrectionEstimate = currentEntry["BWZ Correction Estimate (U)"];
					resultItem.bwzFoodEstimate = currentEntry["BWZ Food Estimate (U)"];
					resultItem.bwzActiveInsulin = currentEntry["BWZ Active Insulin (U)"];
				}
					
				// var sensorCalibration = currentEntry["Sensor Calibration BG (mmol/L)"];
				// if(sensorCalibration != "")
					// resultItem.sensorCalibration = sensorCalibration;
			
				//Add the sensor readings
				var sensorBG = currentEntry["Sensor Glucose (mmol/L)"];
				if(sensorBG != "")
					resultItem.sensorBG	= sensorBG;
				
				//If the object contains more than just time and date and a timestamp, push it
				if(Object.keys(resultItem).length > 2){
					combinedData.push(resultItem);
				}
			}
			req.session.file = combinedData;
			res.redirect('/graph');
		}
    });

    router.get('/getGraphData', function(req, res){
      res.send(helper.getDailyGraphData(req.session.file, req));
    });

    /*router.get('/dailyGraph', function(req, res){
      res.render('dailyGraph', {
        title: 'Grafiek Paradigm Veo',
        header: 'Grafiek',
        readFile: req.session.file
      });
    });*/

    router.get('/moregraphs', function(req, res){
        res.render('moreGraphs', {
        title: 'Meer grafieken',
        header: 'Grafieken',
        readFile: req.session.file
      });
    });

    ///////////////////////////////////////////////////////////////
    // GET readings, formatted for use in the full-detail modal. //
    ///////////////////////////////////////////////////////////////
    router.get('/reading', fileActive, function(req, res) {
        var json = req.session.file;
        var curDate, curCat, curVal, curDesc, curCom, curHour, curDay;
        var ids = req.query.ids.split(',');
        var result = [];

        for (var i = json.length - 1; i >= 0; i--) {
            var current = json[i].ROW[0].$;

            if (ids.indexOf(current.id+"") === -1) {
                continue;
            }

            var unixTime = (current.DATEEVENT.replace(",", ".") - 25569) * 86400;

            // Read the dates and put them in an array
            var date = new Date(unixTime * 1000);

            var day = date.getUTCDate();
            var month = date.getUTCMonth() + 1;
            var year = date.getUTCFullYear();
            var hours = "0" + date.getUTCHours();
            var minutes = "0" + date.getUTCMinutes();
            var seconds = "0" + date.getUTCSeconds();

            curDate = day + "-" + month + "-" + year + " " + hours.substr(-2) + ":" + minutes.substr(-2) + ":" + seconds.substr(-2);

            if (current.EVENTTYPE === "0") {
                curCat = "Beweging";
                curDesc = current.C0 + "\n" + current.C1 + "\n" + current.C2;
            } else if (current.EVENTTYPE === "1") {
                curCat = "Glucosemeting";
                curVal = parseFloat(current.I1 / 18).toFixed(1);
                curDesc = current.C0;
            } else if (current.EVENTTYPE === "2") {
                curCat = "Basaal";
                curVal = current.D0;
                curDesc = current.C1;
            } else if (current.EVENTTYPE === "3") {
                curCat = "Bolus";
                curVal = current.D0;
                curDesc = current.C0 + "\n" + current.C1 + "\n" + current.C2;
            } else if (current.EVENTTYPE === "4") {
                curCat = "Labresultaten";
                curVal = current.C1;
                curDesc = current.C0 + "\n" + current.C1 + "\n" + current.C2 + "\n" + current.C3;
            } else if (current.EVENTTYPE === "5") { // Descriptions need to be fixed here: re-read CoPilot import manual
                curCat = "Maaltijd";
                curVal = current.D1;
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

            result.push({
                id: current.id,
                date: curDate,
                value: curVal,
                comment: curCom,
                description: curDesc,
                category: curCat
            });
        };
        res.send(result);
    });

    ///////////////////////////////////////////////////////////////////
    // GET table data, to display in page via client-side JS.        //
    // This is for debugging purposes, to be able to print the data. //
    ///////////////////////////////////////////////////////////////////
    router.get('/readingsData', fileActive, function(req, res) {
        var json = req.session.file;
        var curDate, curCat, curVal, curDesc, curCom, curHour, curDay;
        var resultFile = [];

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
                curVal = parseFloat(current.I1 / 18).toFixed(1);
                curDesc = current.C0;
            } else if (current.EVENTTYPE === "2") {
                curCat = "Basaal";
                curVal = current.D0;
                curDesc = current.C1;
            } else if (current.EVENTTYPE === "3") {
                curCat = "Bolus";
                curVal = current.D0;
                curDesc = current.C0 + "\n" + current.C1 + "\n" + current.C2;
            } else if (current.EVENTTYPE === "4") {
                curCat = "Labresultaten";
                curVal = current.C1;
                curDesc = current.C0 + "\n" + current.C1 + "\n" + current.C2 + "\n" + current.C3;
            } else if (current.EVENTTYPE === "5") { // Descriptions need to be fixed here: re-read CoPilot import manual
                curCat = "Maaltijd";
                curVal = current.D1;
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
            };
        })
        .value();

        var readFile = JSON.stringify(resultObj);

        res.send(readFile);
    });


    ////////////////////
    // GET table page //
    ////////////////////
    router.get('/readings', fileActive, function(req, res) {
        var json = req.session.file;
        var curDate, curCat, curVal, curDesc, curCom, curHour, curDay;
        var resultFile = [];

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
                curVal = parseFloat(current.I1 / 18).toFixed(1);
                curDesc = current.C0;
            } else if (current.EVENTTYPE === "2") {
                curCat = "Basaal";
                curVal = current.D0;
                curDesc = current.C1;
            } else if (current.EVENTTYPE === "3") {
                curCat = "Bolus";
                curVal = current.D0;
                curDesc = current.C0 + "\n" + current.C1 + "\n" + current.C2;
            } else if (current.EVENTTYPE === "4") {
                curCat = "Labresultaten";
                curVal = current.C1;
                curDesc = current.C0 + "\n" + current.C1 + "\n" + current.C2 + "\n" + current.C3;
            } else if (current.EVENTTYPE === "5") { // Descriptions need to be fixed here: re-read CoPilot import manual
                curCat = "Maaltijd";
                curVal = current.D1;
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
            };
        })
        .value();

        res.render('readings', {
            title: 'Tabel OmniPod',
            header: 'Tabel',
            readFile: JSON.stringify(resultObj)
        });
    });

    ////////////////////
    // GET graph page //
    ////////////////////
    router.get('/graph', fileActive, function(req, res) {

        if (req.session.filetype === 'text/xml') {
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
                header: "Grafiek",
                items: JSON.stringify(items),
                readFile: req.session.file
            });
        } else {
            res.render('dailyGraph', {
                title: 'Grafiek Paradigm Veo',
                header: 'Grafiek',
                readFile: req.session.file
            });
        }

    });

    return router;
})();

function fileActive(req, res, next) {
    if (typeof req.session.file === 'undefined') {
        req.flash("error", "Lees eerst een bestand in.");
        res.redirect("/fileupload");
    } else {
        next();
    }
}