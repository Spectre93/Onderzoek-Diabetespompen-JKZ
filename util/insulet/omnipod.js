var parseString = require('xml2js').parseString,
    fs = require('fs'),
    xml2js = require('xml2js'),
    mongoose = require('mongoose'),
    Files = require('../../models/files'),
    us = require('underscore');

exports.readFile = function(req, path) {
    var json;

    try {
        var fileData = fs.readFileSync(path, 'ascii');

        var parser = new xml2js.Parser();
        parser.parseString(fileData.substring(0, fileData.length), function(err, result) {
            json = JSON.parse(JSON.stringify(result, null, 3));
        });

        req.session.file = json.RECORDS.RECORD;
        req.session.filetype = "text/xml";

        console.log("File '" + path + "' was successfully read. Size is " + json.RECORDS.RECORD.length + " \n");
    } catch (ex) {
        console.log("Unable to read file '" + path + "'.");
        console.log(ex);
    }
}

exports.prepareFile = function(req, res) {
	//var filesModel = req.db.model("Files");
	var json, 
        newFile = new Files(),
        fileModel = req.db.model("Files"),
        currentTime = Date.now();

    fs.rename(req.file.path, req.file.destination + '\\' + req.user._id + '\\' + currentTime + '.xml', function(err) {
        if ( err ) console.log('ERROR: ' + err);
    });

    newFile.time_uploaded = currentTime;
    newFile.user_id = req.user._id;
    newFile.original_name = req.file.originalname;
    newFile.path = req.file.destination + '/' + req.user._id + '/' + currentTime + '.xml';

    newFile.save(function(err) {
    	if (err) console.log(err);
    	else console.log("SAVED");
    });

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
}

exports.getReading = function(req) {
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
    }

    return result;
}

exports.getReadings = function(req) {
    var json = req.session.file;
    var curDate, curCat, curVal, curHour, curDay;
    var resultFile = [];

    console.log("getReadings");

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

        if (current.EVENTTYPE === "1") {
            curCat = "Glucosemeting";
            curVal = parseFloat(current.I1 / 18).toFixed(1);
        } else if (current.EVENTTYPE === "2") {
            curCat = "Basaal";
            curVal = current.D0;
        } else if (current.EVENTTYPE === "3") {
            curCat = "Bolus";
            curVal = current.D0;
        } else if (current.EVENTTYPE === "5") { // Descriptions need to be fixed here: re-read CoPilot import manual
                curCat = "Koolhydraten";
                curVal = current.D1;
        } else {
            curCat = "";
        }

        if (typeof curVal === 'undefined')
            curVal = "";

        if (curCat === "Bolus") {
            resultFile.push({
                id: current.id,
                date: curDate,
                day: curDay,
                bolusHour: curHour,
                bolusValue: curVal,
                category: curCat
            });
        } else if (curCat === "Basaal") {
            resultFile.push({
                id: current.id,
                date: curDate,
                day: curDay,
                basalHour: curHour,
                basalValue: curVal,
                category: curCat
            });
        } else if (curCat === "Glucosemeting") {
            resultFile.push({
                id: current.id,
                date: curDate,
                day: curDay,
                glucoseHour: curHour,
                glucoseValue: curVal,
                category: curCat
            });
        } else if (curCat === "Koolhydraten") {
            resultFile.push({
                id: current.id,
                date: curDate,
                day: curDay,
                carbHours: curHour,
                carbValues: curVal,
                category: curCat
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
            "carbValues": us.pluck(elem, 'carbValues'),
            "categories": us.pluck(elem, 'category'),
            "date": us.pluck(elem, 'date'),
            "day": us.pluck(elem, 'day')[0],
            "basalHours": us.pluck(elem, 'basalHour'),
            "bolusHours": us.pluck(elem, 'bolusHour'),
            "glucoseHours": us.pluck(elem, 'glucoseHour'),
            "carbHours": us.pluck(elem, 'carbHour')
        };
    })
    .value();

    return JSON.stringify(resultObj);
}

exports.getGraph = function (req) {
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

    return items;
}