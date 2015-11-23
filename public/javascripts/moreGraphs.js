function addLeadingZeros(input){
	if(input<10)
		return "0" + input;
	return input;
}

AmCharts.useUTC = true;
// Date.prototype.toString = function(){
	// return AmCharts.formatDate(this.toUTCString(), "YYYY/MM/DD JJ:NN:SS");
// }

Date.prototype.toString = function(){
	return this.getUTCFullYear() + "/" + addLeadingZeros(this.getUTCMonth()+1) + "/" + addLeadingZeros(this.getUTCDate()) + " " +
				 addLeadingZeros(this.getUTCHours()) + ":" + addLeadingZeros(this.getUTCMinutes()) + ":" + addLeadingZeros(this.getUTCSeconds());
}

var startDate = new Date('2014/05/08 00:00:00 UTC+0000');
var endDate = new Date('2015/09/06 00:00:00 UTC+0000');

var parameters = {startDate: startDate.toString(),endDate: endDate.toString()};

$(document).ready(function() {
	$.get( '/getGraphData',parameters, function(data) {
		if(data.length == 0){
			$(".chartcontainer").append( "<h3>Er is geen data over deze tijdsperiode.</h3>" );
			return;
		}
		var totalTime = endDate.getTime() - startDate.getTime();
		var lastDate = startDate;	
		var lastKnownBasal = undefined;
		
		//split the data in x day pieces
		var timePeriod = 4*86400000;
		var parts = Math.round(totalTime/(timePeriod-1000));
		var resultGraphsData = [];
		for(var i = 0; i < parts; i++){
			var date1 = lastDate;
			var date2 = new Date(date1.getTime()+timePeriod);
			resultGraphsData.push({	periodStartDate: date1,
															periodEndDate: date2,
															periodGraphData: []});
			lastDate = date2;
			
		}
		
		for(var i = 0; i < data.length; i++){
			if(data[i].basalRate != undefined) lastKnownBasal = data[i].basalRate;
			for(var j = 0; j < resultGraphsData.length; j++){
				if(data[i].date >= resultGraphsData[j].periodStartDate.toString() && data[i].date < resultGraphsData[j].periodEndDate.toString()){
					if(resultGraphsData[j].firstKnownBasal == undefined) resultGraphsData[j].firstKnownBasal = lastKnownBasal;
					resultGraphsData[j].lastKnownBasal = lastKnownBasal;
					resultGraphsData[j].periodGraphData.push(data[i]);
				}
			}
		}
		
		for(var j = 0; j < resultGraphsData.length; j++){
			if(resultGraphsData[j].periodGraphData.length != 0){
				if(resultGraphsData[j].firstKnownBasal != undefined){
				resultGraphsData[j].periodGraphData.unshift({	date: resultGraphsData[j].periodStartDate,
																											basalRate: resultGraphsData[j].firstKnownBasal});
				}else{
					resultGraphsData[j].periodGraphData.unshift({date: resultGraphsData[j].periodStartDate})
				}
				
				if(resultGraphsData[j].lastKnownBasal != undefined){
									resultGraphsData[j].periodGraphData.push({date: resultGraphsData[j].periodEndDate,
																														basalRate: resultGraphsData[j].lastKnownBasal})
				}else{
					resultGraphsData[j].periodGraphData.push({date: resultGraphsData[j].periodEndDate})
				}
				
				//make graphs for every chunk
				if(resultGraphsData[j].periodGraphData.length > 2){
					$(".chartcontainer").append( "<div id=\"chart_" + j + "\"></div>" );
					buildChart("chart_" + j, resultGraphsData[j].periodGraphData);
				}
				
				//console.log(resultGraphsData[j].periodGraphData);
			}
			
			
		}
		
	});
});

function buildChart(id,data){
	AmCharts.makeChart(id, {
		"fontSize": 9,
		"decimalSeparator": ",",
		"thousandsSeparator": ".",
    "type": "serial",
    "theme": "light",
    "dataDateFormat": "YYYY-MM-DD JJ:NN:SS",
		"balloonDateFormat": "DD-MM-YYYY JJ:NN",
		//"mouseWheelZoomEnabled": true,
    "balloon": {
				"animationDuration": 0,
        "shadowAlpha": 0
    },
		"guides": [{
			"tickLength": 0,
			"fillAlpha": 0.1,
			"fillColor": "#00FF00",
			"id": "Guide-1",
			"lineAlpha": 0,
			"position": "top",
			"toValue": 8,
			"value": 3,
			"valueAxis": "v1"
		}],
    "graphs": [{
				"id": "basalRate",
				"valueAxis": "v1",
        "lineThickness": 1,
				"behindColumns": true,
				"type": "step",
				"showBalloon": false,
        "valueField": "basalRate"
		},{
				"id": "bgReading",
				"valueAxis": "v1",
        "bullet": "round",
				"lineAlpha": 0,
        "lineThickness": 2,
				"bulletSize": 6,
        "valueField": "bgReading",
				"showBalloon": false,
				"labelText": "[[value]]",
				"labelPosition": "right"
		},{
				"id": "bolusVolumeEstimate",
				"valueAxis": "v1",
				"lineColor": "#e1ede9",
				"fillColors": "#e1ede9",
				"fillAlphas": 1,
				"type": "column",
				"clustered": false,
				"columnWidth": 35,
        "valueField": "bolusVolumeEstimate"
		},{
				"id": "bolusVolumeDelivered",
				"valueAxis": "v1",
				"lineColor": "#62cf73",
				"fillColors": "#62cf73",
				"fillAlphas": 1,
				"type": "column",
				"clustered": false,
				"columnWidth": 35,
        "valueField": "bolusVolumeDelivered"
		},{
				"id": "bwzCarbInputG",
				"valueAxis": "v2",
        "bullet": "diamond",
				"lineAlpha": 0,
				"bulletSize": 8,
				"showBalloon": false,
				"labelText": "[[value]]g",
        "valueField": "bwzCarbInputG"
		},{
				"id": "sensorBG",
				"valueAxis": "v1",
        "lineThickness": 2,
				"lineColor": "#96CBFF",
				//"behindColumns": true,
				//"type": "step",
				"showBalloon": false,
        "valueField": "sensorBG"
		},{
				"id": "rewind",
				"title": "Rewind",
				"valueAxis": "v3",
				"bullet": "round",
				"lineColor": "#000000",
				"lineAlpha": 0,
				"bulletSize": 8,
				"showBalloon": false,
        "valueField": "rewind"
		}],
    "categoryField": "date",
    "categoryAxis": {
				"centerLabels": false,
				"boldPeriodBeginning": true,
        "parseDates": true,
				//"labelRotation": 45,
				"minPeriod": "mm"
    },"valueAxes": [{
			"id": "v1",
			"title": "Bolus(U)/BGL(mmol/L)",
			"position": "left",
			"includeAllValues": true,
			"minorGridEnabled": true,
			//"strictMinMax": true,
			"minimum": 0,
			//"maximum": 25
		},{
			"id": "v2",
			"title": "Carbohydrates (g)",
			"position": "right",
			"includeAllValues": true,
			//"strictMinMax": true,
			"minimum": 0,
			//"maximum": 150,
			"gridAlpha": 0
		},{
			"id": "v3",
			//"title": "rewinds",
			"position": "right",
			"axisAlpha": 0,
			"labelsEnabled": false,
			"strictMinMax": true,
			"minimum": 0,
			"maximum": 1,
			"gridAlpha": 0
		}],
    "dataProvider": data
	});
}