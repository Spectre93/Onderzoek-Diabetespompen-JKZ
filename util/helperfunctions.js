//Parses a CareLink csv file and returns a JSON-object containing the data
exports.parseCSV = function(fileName){	
	var baby = require("babyparse");
	var fs = require('fs');
	
	//Read the file and cut away the bits we don't need so it can be parsed
	var file = fs.readFileSync("views/files/"+ fileName).toString();
	if(fileName != "betereData.csv")	//DEBUG
		file = file.substring(file.indexOf(";-------")+11, file.indexOf("-------;", file.indexOf(";-------"))-3);
	
	//Parse the file, returns JSON-object
	var results = baby.parse(file, {	
		header: true,					//First row will be interpreted as field names.
		fastMode: true,				//Speeds up parsing for files that contain no quotes.
		skipEmptyLines: true,	//Skips empty lines.
		dynamicTyping: true,	//Numeric and boolean data will be converted to their type.
		delimiter: ";" 				//The delimiting character. Leave blank to auto-detect.
	});
	
	//Sort the array (results.data)
	results.data = results.data.sort(function (a, b) {
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
	
	//Return JSON-object with the data sorted
	return results;
}

/**
* Makes an object containing arrays for: graph, summary, donut, events
*/
exports.prepareData = function(inputData, req){
	var startDate = req.query.startDate || "0000/00/00 00:00:00";	//if undefined, use this as start date
	var endDate = req.query.endDate || "9999/99/99 99:99:99";			//if undefined, use this as end date
	
	//Loop through data and combine certain events
	var combinedData = [];
	for(var i = 0; i < inputData.length; i++){
		var newItem = {};
		var currentEntry = inputData[i];
		
		var date = currentEntry["Date"];
		var time = currentEntry["Time"];
		
		//Combine date and time for string comparison
		var timestamp = date + " " + time;
		
		if(timestamp >= startDate && timestamp <= endDate){
			newItem.timestamp = timestamp;
			newItem.date = date;
			newItem.time = time;
			
			//If there's a reading, add it to the new item
			var bgReading = currentEntry["BG Reading (mmol/L)"];
			if(bgReading != "")
				newItem.bgReading = bgReading;
			
			//If there's basal rate change, add it to the new item
			var basalRate = currentEntry["Basal Rate (U/h)"];
			if(basalRate != "")				
				newItem.basalRate = basalRate;
			
			//If there's a bolus entry, add it to the new item
			var bolusType = currentEntry["Bolus Type"];
			if(bolusType != ""){
				var bolusVolumeSelected = currentEntry["Bolus Volume Selected (U)"];
				var bolusVolumeDelivered = currentEntry["Bolus Volume Delivered (U)"];
				
				//If it's normal bolus, just add it to the new item
				if(bolusType == "Normal"){
					newItem.bolusType = bolusType;
					newItem.bolusVolumeSelected = bolusVolumeSelected;
					newItem.bolusVolumeDelivered = bolusVolumeDelivered;
				}
				//If it's a Dual bolus, put the normal part in the new item
				else if(bolusType == "Dual (normal part)"){
					newItem.bolusType = "Dual";
					newItem.bolusVolumeSelected = bolusVolumeSelected;
					newItem.bolusVolumeDelivered = bolusVolumeDelivered;
					
					//Look for the square part
					for(var j = 0; j < 10; j++){
						if(i + j < inputData.length){
							var bolusDuration = inputData[i+j]["Programmed Bolus Duration (h:mm:ss)"];
							if(bolusDuration != ""){
								//And add that to the item as well
								newItem.squareVolumeSelected = currentEntry["Bolus Volume Selected (U)"];
								newItem.squareVolumeDelivered = currentEntry["Bolus Volume Delivered (U)"];
								newItem.bolusDuration = bolusDuration;
								break;
							}
						}
					}
				}
			}
			
			//If there's a rewind, note it as '1' in the item
			var rewind = currentEntry["Rewind"];
			if(rewind != ""){
				newItem.rewind	= 1;
				
				//Look for the Primes it came with
				for(var j = 0; j < 10; j++){
					if(i + j < inputData.length){
						var primeType = inputData[i+j]["Prime Type"];
						if(primeType == "Manual"){
							newItem.primeType = primeType;
							newItem.manualPrimeVolumeDelivered = currentEntry["Prime Volume Delivered (U)"];
							
							//A Fixed one may come together with a manual one, always after manual
							for(var k = 0; k < 10; k++){
								if(i + j + k < inputData.length){
									var primeType = inputData[i+j+k]["Prime Type"];
									if(primeType == "Fixed"){
										newItem.primeType = "Both";
										newItem.fixedPrimeVolumeDelivered = currentEntry["Prime Volume Delivered (U)"];
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
				newItem.alarm = alarm;
				
			//If there's a BWZ entry, there will be more. Add them all.
			var bolusVolumeEstimate = currentEntry["BWZ Estimate (U)"];
			if(bolusVolumeEstimate != ""){
				newItem.bolusVolumeEstimate = bolusVolumeEstimate;
				newItem.bwzHighTarget = currentEntry["BWZ Target High BG (mmol/L)"];
				newItem.bwzLowTarget = currentEntry["BWZ Target Low BG (mmol/L)"];
				newItem.bwzCarbRatio = currentEntry["BWZ Carb Ratio (g/U)"];
				newItem.bwzInsulinSensitivity = currentEntry["BWZ Insulin Sensitivity (mmol/L/U)"];
				newItem.bwzCarbInput = currentEntry["BWZ Carb Input (grams)"];
				newItem.bwzBgInput = currentEntry["BWZ BG Input (mmol/L)"];
				newItem.bwzCorrectionEstimate = currentEntry["BWZ Correction Estimate (U)"];
				newItem.bwzFoodEstimate = currentEntry["BWZ Food Estimate (U)"];
				newItem.bwzActiveInsulin = currentEntry["BWZ Active Insulin (U)"];
			}
				
			// var sensorCalibration = currentEntry["Sensor Calibration BG (mmol/L)"];
			// if(sensorCalibration != "")
				// newItem.sensorCalibration = sensorCalibration;
		
			//Add the sensor readings
			var sensorBG = currentEntry["Sensor Glucose (mmol/L)"];
			if(sensorBG != "")
				newItem.sensorBG	= sensorBG;
			
			//If the object contains more than just time and date and a timestamp, push it
			if(Object.keys(newItem).length > 2){
				combinedData.push(newItem);
			}
		}
	}
	
	//Create the result item
	var result = {
		"graph" 	: []
	};
	
	//Add	graph data
	for(var i = 0; i < combinedData.length; i++){
		var resultObject = {};
		var currentEntry = combinedData[i];
		
		if(currentEntry.basalRate != undefined)
			resultObject.basalRate = currentEntry.basalRate;
		if(currentEntry.bgReading != undefined)
			resultObject.bgReading = currentEntry.bgReading;
		if(currentEntry.bolusVolumeEstimate != undefined)
			resultObject.bolusVolumeEstimate 	= currentEntry.bolusVolumeEstimate;
		if(currentEntry.bolusVolumeDelivered != undefined)
			resultObject.bolusVolumeDelivered = currentEntry.bolusVolumeDelivered;
		if(currentEntry.bwzCarbInput != undefined)
			resultObject.bwzCarbInput = currentEntry.bwzCarbInput;
		if(currentEntry.sensorBG != undefined)
			resultObject.sensorBG	= currentEntry.sensorBG;
		if(currentEntry.rewind != undefined)
			resultObject.rewind	= currentEntry.rewind;
		
		if(Object.keys(resultObject).length != 0){
			resultObject.date = currentEntry.timestamp;
			result.graph.push(resultObject);
		}
	}
	
	//If it's for the weekly view, there's no need to add the other data
	if(req.query.weekly)
		return result;
	
	//Add summary data
	result.summary = {
		"Date"										:	combinedData[0].date,
		"Daily carbs (grams)"			: 0,
		"BG readings"							: 0,
		"Readings avg. (mmol/L)"	: 0,
		"Fills"										: 0,
		
		"Total insulin (U)"				: 0,
		"Food bolus (U)"					: 0,
		"Correction bolus (U)"		: 0,
		"Basal (U)"								: 0
	}
	
	var bgReadingTotal = 0;
	var primeTotal = 0;
	
	for(var i = 0; i < combinedData.length; i++){
		result.summary["Daily carbs (grams)"] += combinedData[i].bwzCarbInput || 0;
		result.summary["Food bolus (U)"] += combinedData[i].bwzFoodEstimate || 0;
		result.summary["Correction bolus (U)"] += combinedData[i].bwzCorrectionEstimate || 0;
		
		if(combinedData[i].bgReading != undefined){
			result.summary["BG readings"]++;
			bgReadingTotal += combinedData[i].bgReading;
		}
			
		if(combinedData[i].rewind != undefined){
			result.summary["Fills"]++;
			primeTotal += combinedData[i].manualPrimeVolumeDelivered;
		}
	}

	result.summary["Readings avg. (mmol/L)"] = bgReadingTotal / result.summary["BG readings"];
	result.summary["Fills"] += " (" + (primeTotal || 0) + " U)";
	
	result.summary["Food bolus (U)"] = result.summary["Food bolus (U)"] || 23.3;						//TODO Remove hardcoded
	result.summary["Correction bolus (U)"] = result.summary["Correction bolus (U)"] || 5.1; //TODO Remove hardcoded
	result.summary["Basal (U)"] = result.summary["Basal (U)"] || 48;												//TODO Remove hardcoded
	
	result.summary["Total insulin (U)"] = result.summary["Food bolus (U)"] + result.summary["Correction bolus (U)"] + result.summary["Basal (U)"];

	//Add donut data
	result.donut = [{
    "title": "Basal",
    "value": result.summary["Basal (U)"]
  },{
    "title": "Corr.",
    "value": result.summary["Correction bolus (U)"]
  },{
    "title": "Food",
    "value": result.summary["Food bolus (U)"],
		"color": "#d38df1"
  }];
	
	//Add event data
	var bolusEventData = [{
		"Index"															: 1,						//Index
		"Time"															: "01:23",		//Time
		
		"BWZ Estimate (U)"									: 5.0, 						//Recommended Bolus
		"Bolus Type"												: "Normal",			//Bolus Type
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

	result.events = bolusEventData;
	
	return result;
}