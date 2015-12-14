var parseString = require('xml2js').parseString,
    fs = require('fs'),
    xml2js = require('xml2js'),
    mongoose = require('mongoose'),
    baby = require('babyparse'),
    Files = require('../../models/files');

var newFile = new Files();

exports.prepareFile = function(req, res) {
    //##### Paradigm Veo #####              

    var filesModel = req.db.model("Files");
        
    var path = req.file.path;
    //Read the file and cut away the bits we don't need so it can be parsed
    var file = fs.readFileSync(path).toString();
    file = file.substring(file.indexOf(";-------")+11, file.indexOf("-------;", file.indexOf(";-------"))-3).replace(/,/g, '.');
    
    fs.rename(req.file.path, req.file.destination + '\\' + req.user._id + '\\' + Date.now() + '.csv', function(err) {
        if ( err ) console.log('ERROR: ' + err);
    });

    newFile.user_id = req.user._id;
    newFile.original_name = req.file.originalname;
    newFile.path = req.file.destination + '/' + req.user._id + '/' + Date.now() + '.csv';

    newFile.save(function(err) {
        if (err) console.log(err);
        else console.log("SAVED");
    });

    //Parse the file, returns JSON-object
    var parseResults = baby.parse(file,{    
        header: true,
        fastMode: true,     //Speeds up parsing for files that contain no quotes.
        skipEmptyLines: true,
        dynamicTyping: true,
        delimiter: ";"
    });
    
    //Sort the results.data array
    parseResults.data = parseResults.data.sort(function (a, b) {
        if (a.Date > b.Date)
            return 1;
        else if (a.Date < b.Date)
            return -1;
        
        //When the dates are equal, check the times
        if(a.Time > b.Time)
            return 1;
        else if(a.Time < b.Time)
            return -1;
        
        //If the times are equal too, check for any of these
        if(a.Suspend || a["BWZ Estimate (U)"] || a["Temp Basal Type"])
            return -1;
        else 
            return 1;
    });
    
    //Loop through data and combine certain events
    var combinedData = [];
    for(var i = 0; i < parseResults.data.length; i++){
        var currentEntry = parseResults.data[i];
        var resultItem = {};
                
        resultItem.date = currentEntry.Date;
        resultItem.time = currentEntry.Time;
        resultItem.timestamp = resultItem.date + " " + resultItem.time;
        
        //If there's a reading, add it to the new item
        var bgReading = currentEntry["BG Reading (mmol/L)"];
        if(bgReading !== "")
            resultItem.bgReading = bgReading;
        
        //If there's basal rate change, add it to the new item
        var basalRate = currentEntry["Basal Rate (U/h)"];
        if(basalRate !== "")                
            resultItem.basalRate = basalRate;

        //If there's a bolus entry, add it to the new item
        var bolusType = currentEntry["Bolus Type"];
        if(bolusType !== ""){
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
                        if(bolusDuration !== ""){
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
        var rewind = currentEntry.Rewind;
        if(rewind !== ""){
            resultItem.rewind = 1;
            
            //Look for the Primes it came with
            for(var j = 0; j < 10; j++){
                if(i + j < parseResults.data.length){
                    var primeType = parseResults.data[i+j]["Prime Type"];
                    if(primeType == "Manual"){
                        resultItem.primeType = primeType;
                        resultItem.manualPrimeVolumeDelivered = parseResults.data[i+j]["Prime Volume Delivered (U)"];
                        //A Fixed one may come together with a manual one, always after manual
                        for(var k = 0; k < 10; k++){
                            if(i + j + k < parseResults.data.length){
                                var primeType = parseResults.data[i+j+k]["Prime Type"];
                                if(primeType == "Fixed"){
                                    resultItem.primeType = "Both";
                                    resultItem.fixedPrimeVolumeDelivered = parseResults.data[i+j+k]["Prime Volume Delivered (U)"];
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
        var alarm = currentEntry.Alarm;
        if(alarm !== "")
            resultItem.alarm = alarm;
            
        //If there's a BWZ entry, there will be more. Add them all.
        var bolusVolumeEstimate = currentEntry["BWZ Estimate (U)"];
        if(bolusVolumeEstimate !== ""){
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
        if(sensorBG !== "")
            resultItem.sensorBG = sensorBG;
        
        //If the object contains more than just time and date and a timestamp, push it
        if(Object.keys(resultItem).length > 2){
            combinedData.push(resultItem);
        }
    }
    req.session.file = combinedData;
}

exports.getDailyGraphData = function(req) {
    var combinedData = req.session.file;
    var startDate = req.query.startDate || "2015/08/10 00:00:00";
    var endDate = req.query.endDate || "2015/08/10 23:59:59";

    var inputData = [];
    var lastKnownBasal = 0;
    for (var i = 0; i < combinedData.length; i++) {
        if (combinedData[i].timestamp >= startDate && combinedData[i].timestamp <= endDate) {
            if (combinedData[i].basalRate != undefined)
                lastKnownBasal = combinedData[i].basalRate;
            inputData.push(combinedData[i]);
        }
    }
    if (inputData.length === 0)
        return;

    if (!req.query.weekly) {
        if (inputData[inputData.length - 1].timestamp < endDate)
            inputData.push({
                timestamp: endDate,
                basalRate: lastKnownBasal
            });
        else
        if (inputData[inputData.length - 1].basalRate == undefined)
            inputData[inputData.length - 1].basalRate = lastKnownBasal;
    }

    //Create the result item
    var result = {
        "graph": []
    };

    //Add   graph data
    for (var i = 0; i < inputData.length; i++) {
        var resultObject = {};
        var currentEntry = inputData[i];

        if (currentEntry.basalRate != undefined)
            resultObject.basalRate = currentEntry.basalRate;
        if (currentEntry.bgReading != undefined)
            resultObject.bgReading = currentEntry.bgReading;
        if (currentEntry.bolusVolumeEstimate != undefined)
            resultObject.bolusVolumeEstimate = currentEntry.bolusVolumeEstimate;
        if (currentEntry.bolusVolumeDelivered != undefined)
            resultObject.bolusVolumeDelivered = currentEntry.bolusVolumeDelivered;
        if (currentEntry.bwzCarbInput != undefined)
            resultObject.bwzCarbInput = currentEntry.bwzCarbInput;
        if (currentEntry.sensorBG != undefined)
            resultObject.sensorBG = currentEntry.sensorBG;
        if (currentEntry.rewind != undefined)
            resultObject.rewind = currentEntry.rewind;

        if (Object.keys(resultObject).length != 0) {
            resultObject.date = currentEntry.timestamp;
            result.graph.push(resultObject);
        }
    }

    //If it's for the weekly view, there's no need to add the other data
    if (req.query.weekly)
        return result;

    //Add summary data
    result.summary = {
        "Statistics": inputData[0].date,
        "Readings avg. (mmol/L)": 0,
        "BG readings": 0,
        "Daily carbs (grams)": 0,

        "Total insulin (U)": 0,
        "Food bolus (U)": 0,
        "Correction bolus (U)": 0,
        "Basal (U)": 0,

        "Fills": 0
    }

    var bgReadingTotal = 0;
    var primeTotal = 0;
    var basalChanged = [];
    for (var i = 0; i < inputData.length; i++) {
        result.summary["Daily carbs (grams)"] += inputData[i].bwzCarbInput || 0;
        result.summary["Food bolus (U)"] += inputData[i].bwzFoodEstimate || 0;
        result.summary["Correction bolus (U)"] += inputData[i].bwzCorrectionEstimate || 0;

        if (inputData[i].bgReading != undefined) {
            result.summary["BG readings"]++;
            bgReadingTotal += inputData[i].bgReading;
        }

        if (inputData[i].rewind != undefined) {
            result.summary["Fills"]++;
            primeTotal += inputData[i].manualPrimeVolumeDelivered;
        }

        if (inputData[i].basalRate != undefined) {
            basalChanged.push({
                "timestamp": inputData[i].timestamp,
                "basalRate": inputData[i].basalRate
            });
        }
    }

    result.summary["Readings avg. (mmol/L)"] = (bgReadingTotal / result.summary["BG readings"] || 0).toFixed(1);
    result.summary["Fills"] += " (" + (primeTotal || 0) + " U)";

    result.summary["Food bolus (U)"] = result.summary["Food bolus (U)"];
    result.summary["Correction bolus (U)"] = result.summary["Correction bolus (U)"];

    for (var l = 0; l < basalChanged.length - 1; l++) {
        var firstDate = new Date(basalChanged[l].timestamp + ' UTC+0000');
        var secondDate = new Date(basalChanged[l + 1].timestamp + ' UTC+0000');
        result.summary["Basal (U)"] += (((secondDate.getTime() - firstDate.getTime()) / 3600000) * basalChanged[l].basalRate);
    }
    result.summary["Basal (U)"] = +result.summary["Basal (U)"].toFixed(1);

    result.summary["Total insulin (U)"] = result.summary["Food bolus (U)"] + result.summary["Correction bolus (U)"] + result.summary["Basal (U)"];

    //Add donut data
    result.donut = [{
        "title": "Basal",
        "value": result.summary["Basal (U)"]
    }, {
        "title": "Corr.",
        "value": result.summary["Correction bolus (U)"]
    }, {
        "title": "Food",
        "value": result.summary["Food bolus (U)"],
        "color": "#d38df1"
    }];

    //Add event data
    result.events = [];
    var eventIndex = 1;
    for (var i = 0; i < inputData.length; i++) {
        var cur = inputData[i];
        if (cur.hasOwnProperty("bolusVolumeEstimate")) {
            var res = {
                "index": eventIndex,
                "time": cur.time.substring(0, 5),

                "bwzEstimate": cur.bolusVolumeEstimate || "--",
                "bolusType": cur.bolusType || "--",
                "bolVolDeliv": cur.bolusVolumeDelivered || cur.squareVolumeDelivered || "--",
                "bolusDuration": cur.bolusDuration || "--",
                "difference": +(cur.bolusVolumeEstimate - cur.bolusVolumeDelivered).toFixed(1) || "--",

                "bwzFoodEstimate": cur.bwzFoodEstimate || "--",
                "bwzCarbInput": cur.bwzCarbInput || "--",
                "bwzCarbRatio": cur.bwzCarbRatio || "--",

                "bwzCorrEst": cur.bwzCorrectionEstimate || "--",
                "bwzBgInput": cur.bwzBgInput || "--",
                "bwzHighTarget": cur.bwzHighTarget || "--",
                "bwzLowTarget": cur.bwzLowTarget || "--",

                "bwzInsSens": cur.bwzInsulinSensitivity || "--",
                "bwzActInsulin": cur.bwzActiveInsulin || "--"
            };
            result.events.push(res);
            eventIndex++;
        }
    }
    return result;
}

exports.getReadings = function(req) {
    var file = req.session.file;
    var result = {};

    for(var i = file.length-1; i >= 0; i--){
        var cur = result[file[i].date];
        if(cur === undefined){
            cur = {
                header: [file[i].date],
                basalValues: ['Basal'],
                glucoseValues: ['Glucose'],
                bolusValues: ['Bolus']
            };
            
            for(var j = 0; j < 24; j++){
                if(j<10)
                    cur.header.push('0' + j);
                else 
                    cur.header.push('' + j);
                cur.basalValues.push('');
                cur.glucoseValues.push('');
                cur.bolusValues.push('');
            }
            result[file[i].date] = cur;
        }

        if(file[i].basalRate !== undefined){
            result[file[i].date].basalValues[+file[i].time.substring(0,2)+1] = file[i].basalRate;
        }
        
        if(file[i].bwzBgInput !== undefined){
            result[file[i].date].glucoseValues[+file[i].time.substring(0,2)+1] = file[i].bwzBgInput;
        }
        
        if(file[i].bolusVolumeDelivered !== undefined){
            result[file[i].date].bolusValues[+file[i].time.substring(0,2)+1] = file[i].bolusVolumeDelivered;
        }
    }

    return result;
}