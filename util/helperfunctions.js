var tableData = {
	"Date"										:	"10-08-2015",
	"Daily carbs (grams)"			: 159,
	"BG readings"							: 4,
	"Readings avg. (mmol/L)"	: 11.2,
	"Fills"										: "2 (10,3U)",
	
	"Total insulin (U)"				: 76.4,
	"Food bolus (U)"							: 23.3,
	"Correction bolus (U)"				: 5.1,
	"Basal (U)"								: 48
	//"-Daily bolus (U)"				: 28.4,
}
	
var donutData = [{
    "title": "Basal",
    "value": tableData["Basal (U)"]
  },{
    "title": "Corr.",
    "value": tableData["Correction bolus (U)"]
  },{
    "title": "Food",
    "value": tableData["Food bolus (U)"],
		"color": "#d38df1"
  }
];

var bolusEventData = [{
	"Index"															: 1,						//Index
	"Time"															: "01:23",		//Time
	
	"BWZ Estimate (U)"									: 5.0, 						//Recommended Bolus
	"Bolus Type"												: "Normal",			//Bolus Type
	//"Bolus Volume Selected (U)"					: 5.0,
	"Bolus Volume Delivered (U)"				: 5.0,
	"Programmed Bolus Duration (h:mm:ss)": "--",				//Square part
	"Difference (U)"										: "--",					//Calculated
	
	"BWZ Food Estimate (U)"							: 16.0,	//Food bolus
	"BWZ Carb Input (grams)"						: 80,
	"BWZ Carb Ratio (g/U)"							: 5.0,
	
	"BWZ Correction Estimate (U)"				: 1.1,	//Corr bolus
	"BWZ BG Input (mmol/L)"							: 9.7,	//BGL
	"BWZ Target High BG (mmol/L)"				: 5.6,
	"BWZ Target Low BG (mmol/L)"				: 3.4,
	
	"BWZ Insulin Sensitivity (mmol/L/U)": 1.5,
	"BWZ Active Insulin (U)"						: 0
},{
	"Index"															: 2,						//Index
	"Time"															: "01:23:45",		//Time
	
	"BWZ Estimate (U)"									: 5.0, 						//Recommended Bolus
	"Bolus Type"												: "Normal",			//Bolus Type
	//"Bolus Volume Selected (U)"					: 5.0,
	"Bolus Volume Delivered (U)"				: 5.0,
	"Programmed Bolus Duration (h:mm:ss)": "--",				//Square part
	"Difference (U)"										: "--",					//Calculated
	
	"BWZ Food Estimate (U)"							: 16.0,	//Food bolus
	"BWZ Carb Input (grams)"						: 80,
	"BWZ Carb Ratio (g/U)"							: 5.0,
	
	"BWZ Correction Estimate (U)"				: 1.1,	//Corr bolus
	"BWZ BG Input (mmol/L)"							: 9.7,	//BGL
	"BWZ Target High BG (mmol/L)"				: 5.6,
	"BWZ Target Low BG (mmol/L)"				: 3.4,
	
	"BWZ Insulin Sensitivity (mmol/L/U)": 1.5,
	"BWZ Active Insulin (U)"						: 0
},{
	"Index"															: 3,						//Index
	"Time"															: "01:23:45",		//Time
	
	"BWZ Estimate (U)"									: 5.0, 						//Recommended Bolus
	"Bolus Type"												: "Normal",			//Bolus Type
	//"Bolus Volume Selected (U)"					: 5.0,
	"Bolus Volume Delivered (U)"				: 5.0,
	"Programmed Bolus Duration (h:mm:ss)": "--",				//Square part
	"Difference (U)"										: "--",					//Calculated
	
	"BWZ Food Estimate (U)"							: 16.0,	//Food bolus
	"BWZ Carb Input (grams)"						: 80,
	"BWZ Carb Ratio (g/U)"							: 5.0,
	
	"BWZ Correction Estimate (U)"				: 1.1,	//Corr bolus
	"BWZ BG Input (mmol/L)"							: 9.7,	//BGL
	"BWZ Target High BG (mmol/L)"				: 5.6,
	"BWZ Target Low BG (mmol/L)"				: 3.4,
	
	"BWZ Insulin Sensitivity (mmol/L/U)": 1.5,
	"BWZ Active Insulin (U)"						: 0
}];

function getTheRightData(file){
	var outputFile = file.substring(file.indexOf(";-------")+11, file.indexOf("-------;", file.indexOf(";-------")) - 3);
	return outputFile.length > 20 ? outputFile : file;
}

//Possible filenames: realData || betereData
exports.getData = function(fileName){	
	var baby = require("babyparse");
	var fs = require('fs');
	
	var file = fs.readFileSync("views/files/"+ fileName).toString();
	if(fileName == "realData.csv")	//DEBUG
		file = getTheRightData(file);
	
	return baby.parse(file, {	header: true,					//First row will be interpreted as field names.
														fastMode: true,				//Speeds up parsing for files that contain no quotes.
														skipEmptyLines: true,	//Skips empty lines.
														dynamicTyping: true,	//Numeric and boolean data will be converted to their type.
														delimiter: ";" 				//The delimiting character. Leave blank to auto-detect.
	});
}

//Makes an object containing arrays for: graph, summary, donut, events
exports.parseData = function(req){
	var inputData = this.getData("betereData.csv");
	var result = {
		"graph" 	: [],
		"summary"	: tableData,
		"donut"		: donutData,
		"events"	: bolusEventData
	};
	
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
				result.graph.push(resultObject);
			}
		}
	}
	
	result.graph.sort(function (a, b) {	//sort when done
		if (a.date > b.date)
			return 1;
		else if (a.date < b.date)
			return -1;
		else 
			return 0;
	});
	return result;
}