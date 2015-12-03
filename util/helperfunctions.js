exports.getDailyGraphData = function(combinedData, req){
	var startDate = req.query.startDate || "2015/08/10 00:00:00";
	var endDate = req.query.endDate || "2015/08/10 23:59:59";
	
	var inputData = [];
	var lastKnownBasal = 0;
	for(var i = 0; i < combinedData.length; i++){
		if(combinedData[i].timestamp >= startDate && combinedData[i].timestamp <= endDate){
			if(combinedData[i].basalRate != undefined)
				lastKnownBasal = combinedData[i].basalRate;
			inputData.push(combinedData[i]);
		}
	}
	
	if(!req.query.weekly){
		if(inputData[inputData.length-1].timestamp < endDate)
			inputData.push({
				timestamp: endDate,
				basalRate: lastKnownBasal});
		else
			if(inputData[inputData.length-1].basalRate == undefined)
				inputData[inputData.length-1].basalRate = lastKnownBasal;
	}

	//Create the result item
	var result = {
		"graph" 	: []
	};
	
	//Add	graph data
	for(var i = 0; i < inputData.length; i++){
		var resultObject = {};
		var currentEntry = inputData[i];
		
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
	// if(req.query.weekly)
		// return result;
	
	//Add summary data
	result.summary = {
		"Date"										:	inputData[0].date,
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
	var basalChanged = [];
	for(var i = 0; i < inputData.length; i++){
		result.summary["Daily carbs (grams)"] += inputData[i].bwzCarbInput || 0;
		result.summary["Food bolus (U)"] += inputData[i].bwzFoodEstimate || 0;
		result.summary["Correction bolus (U)"] += inputData[i].bwzCorrectionEstimate || 0;
		
		if(inputData[i].bgReading != undefined){
			result.summary["BG readings"]++;
			bgReadingTotal += inputData[i].bgReading;
		}
			
		if(inputData[i].rewind != undefined){
			result.summary["Fills"]++;
			primeTotal += inputData[i].manualPrimeVolumeDelivered;
		}
		
		if(inputData[i].basalRate != undefined){
			basalChanged.push({
				"timestamp": inputData[i].timestamp,
				"basalRate": inputData[i].basalRate
			});
		}
	}

	result.summary["Readings avg. (mmol/L)"] = (bgReadingTotal / result.summary["BG readings"]).toFixed(1) || 0;
	result.summary["Fills"] += " (" + (primeTotal || 0) + " U)";
	
	result.summary["Food bolus (U)"] = result.summary["Food bolus (U)"];
	result.summary["Correction bolus (U)"] = result.summary["Correction bolus (U)"];
	
	for(var l = 0; l < basalChanged.length-1; l++){
		var firstDate = new Date(basalChanged[l].timestamp + ' UTC+0000');
		var secondDate = new Date(basalChanged[l+1].timestamp + ' UTC+0000');
		result.summary["Basal (U)"] += (((secondDate.getTime() - firstDate.getTime())/ 3600000) * basalChanged[l].basalRate);
	}
	result.summary["Basal (U)"] = +result.summary["Basal (U)"].toFixed(1);
	
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
	result.events = [];
	var eventIndex = 1;
	for(var i = 0; i < inputData.length; i++){
		var cur = inputData[i];
		if(cur.hasOwnProperty("bolusVolumeEstimate")){
			var res = {
				"index": eventIndex,
				"time": cur.time.substring(0,5),
				
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