var parseString = require('xml2js').parseString,
    fs = require('fs'),
    xml2js = require('xml2js'),
    mongoose = require('mongoose'),
    Files = require('../models/files');

var newFile = new Files();

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