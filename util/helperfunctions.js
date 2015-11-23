function getTheRightData(file){
	var outputFile = file.substring(file.indexOf(";-------")+11, file.indexOf("-------;", file.indexOf(";-------")) - 3);
	return outputFile.length > 20 ? outputFile : file;
}

//Possible filenames: realData || betereData
exports.getData = function(fileName){	
	var baby = require("babyparse");
	var fs = require('fs');
	
	var file = fs.readFileSync("public/files/"+ fileName).toString();
	if(fileName == "realData.csv")	//DEBUG
		file = getTheRightData(file);
	
	return baby.parse(file, {	header: true,					//First row will be interpreted as field names.
														fastMode: true,				//Speeds up parsing for files that contain no quotes.
														skipEmptyLines: true,	//Skips empty lines.
														dynamicTyping: true,	//Numeric and boolean data will be converted to their type.
														delimiter: ";" 				//The delimiting character. Leave blank to auto-detect.
	});
}

exports.parseData = function(req){
	var inputData = this.getData("betereData.csv");
	var resultData = [];
	
	var startDate = req.query.startDate || "0000/00/00 00:00:00";	//if undefined, use this as start date
	var endDate = req.query.endDate || "9999/99/99 99:99:99";			//if undefined, use this as end date
	
	for(var i = 0; i < inputData.data.length; i++){
		var resultObject = {};
		var currentEntry = inputData.data[i];

		var date 									= currentEntry.Date + " " + currentEntry.Time;
		var basalRate 						= currentEntry["Basal Rate (U/h)"];
		var bgReading 						= currentEntry["BG Reading (mmol/L)"];
		var bolusVolumeEstimate 	= currentEntry["BWZ Estimate (U)"];
		var bolusVolumeDelivered 	= currentEntry["Bolus Volume Delivered (U)"];
		var bwzCarbInputG 				= currentEntry["BWZ Carb Input (grams)"];
		var sensorBG							= currentEntry["Sensor Glucose (mmol/L)"];
		var rewind								= currentEntry["Rewind"];
		
		if(basalRate != ""){						resultObject.basalRate 						= basalRate;}
		if(bgReading != ""){						resultObject.bgReading 						= bgReading;}			
		if(bolusVolumeEstimate != ""){	resultObject.bolusVolumeEstimate 	= bolusVolumeEstimate;}
		if(bolusVolumeDelivered != ""){	resultObject.bolusVolumeDelivered = bolusVolumeDelivered;}			
		if(bwzCarbInputG != ""){				resultObject.bwzCarbInputG 				= bwzCarbInputG;}
		if(sensorBG != ""){							resultObject.sensorBG			 				= sensorBG;}
		if(rewind == "Rewind"){					resultObject.rewind			 					= 1;}
		
		if(Object.keys(resultObject).length != 0){	//if empty object, don't add the date				
			if(date >= startDate && date <= endDate){
				resultObject.date = date;
				resultData.push(resultObject);
			}
		}
	}
	
	resultData.sort(function (a, b) {	//sort when done
		if (a.date > b.date)
			return 1;
		else if (a.date < b.date)
			return -1;
		else 
			return 0;
	});
	return resultData;
}