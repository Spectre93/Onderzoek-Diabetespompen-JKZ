var parameters = {
	startDate: "2015/08/10 00:00:00",
	endDate: "2015/08/11 00:00:00"
};

var bolusEventRowNames = [
	"Bolus event",
	"Time",
	
	"Recommended bolus (U)",
	"Bolus type",
	"Delivered bolus (U)",
	"+Square portion (U, h:mm)",
	"Difference (U)",
	
	"Food bolus (U)",
	"Carbs (g)",
	"Carb ratio (g/U)",
	
	"Correction bolus (U)",
	"BG (mmol/L)",
	"BG high target",
	"BG low target",
	
	"Insulin sensitivity",
	"Active insulin"
];

$(document).ready(function(){			
	$('.datepicker').datepicker({
		autoclose: true,
		format: "dd/mm/yyyy",
		startDate: "10/11/2015",
		endDate: "20/11/2015",
		disableTouchKeyboard: true,
		todayHighlight: true,
		weekStart: 1
	});
	
	$.get('/getGraphData',parameters,function(data){	
		buildGraph(data.graph);
		buildSummary(data.summary);
		buildDonut(data.donut);
		buildEvents(data.events);
	});
});

function buildGraph(data){
	AmCharts.makeChart("chartdiv", {
		"decimalSeparator": ",",
		"thousandsSeparator": ".",
    "type": "serial",
    "theme": "light",
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
    "dataDateFormat": "YYYY-MM-DD JJ:NN:SS",
		"balloonDateFormat": "JJ:NN",
    "balloon": {
				"animationDuration": 0,
        "shadowAlpha": 0
    },
		"legend": {
			"valueText": "",
			"rollOverGraphAlpha": 0.1,
			"switchType": "v",
			"maxColumns": 3,
			"switchType": "x"
		},
    "graphs": [{
				"id": "basalRate",
				"title": "Basal Rate (U/h)",
				"valueAxis": "v1",
        "lineThickness": 2,
				"behindColumns": true,
				"type": "step",
				"showBalloon": false,
        "valueField": "basalRate"
		},{
				"id": "bgReading",
				"title": "BG Reading (mmol/L)",
				"valueAxis": "v1",
        "bullet": "round",
				"lineAlpha": 0,
        "lineThickness": 2,
				"bulletSize": 11,
        "valueField": "bgReading",
				"labelText": "[[value]] mmol/L",
				"labelPosition": "right",
				"showBalloon": false
		},{
				"id": "bolusVolumeEstimate",
				"title": "BWZ Estimate (U)",
				"valueAxis": "v1",
				"lineColor": "#e1ede9",
				"fillColors": "#e1ede9",
				"fillAlphas": 1,
				"type": "column",
				"clustered": false,
				"columnWidth": 15,
        "valueField": "bolusVolumeEstimate",
				"balloonText": "<b>[[value]]\b"			    
		},{
				"id": "bolusVolumeDelivered",
				"title": "Bolus Volume Delivered (U)",
				"valueAxis": "v1",
				"lineColor": "#62cf73",
				"fillColors": "#62cf73",
				"fillAlphas": 1,
				"type": "column",
				"clustered": false,
				"columnWidth": 15,
        "valueField": "bolusVolumeDelivered",
				"balloonText": "<b>[[value]]\b"
		},{
				"id": "bwzCarbInput",
				"title": "BWZ Carb Input (grams)",
				"valueAxis": "v2",
        "bullet": "diamond",
				"lineAlpha": 0,
				"bulletSize": 12,
				"labelText": "[[value]]g",
				"showBalloon": false,
        "valueField": "bwzCarbInput"
		},{
				"id": "sensorBG",
				"title": "Sensor Glucose (mmol/L)",
				"valueAxis": "v1",
        "lineThickness": 2,
				"lineColor": "#0D8ECF",
				"showBalloon": false,
        "valueField": "sensorBG"
		},{
				"id": "rewind",
				"title": "Rewind",
				"valueAxis": "v3",
				"lineColor": "#0D8ECF",
				"bullet": "custom",
				"customBullet": "img/refresh.png",
				"lineAlpha": 0,
				"bulletSize": 14,
				"showBalloon": false,
        "valueField": "rewind"
		}],
    "categoryField": "date",
    "categoryAxis": {
				"centerLabels": false,
				"boldPeriodBeginning": true,
        "parseDates": true,
        "minorGridEnabled": true,
				"labelRotation": 45,
				"minPeriod": "mm"
    },"valueAxes": [{
			"id": "v1",
			"title": "U",
			"position": "left",
			"strictMinMax": true,
			"minimum": 0
		},{
			"id": "v2",	//Used for carbs (in grams)
			"position": "right",
			"axisAlpha": 0,
			"labelsEnabled": false,
			"autoGridCount": false,
			"strictMinMax": true,
			"minimum": 0,
			"gridAlpha": 0
		},{
			"id": "v3",	//Used for rewinds
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

function buildSummary(data){
	for(prop in data){
		if(prop == "Date" || prop == "Total insulin (U)")
			$("#statTableBody").append("<tr><th class=\"info\">" + prop + "</th><th class=\"info\">" + data[prop] + "</th></tr>");
		else
			$("#statTableBody").append("<tr><td>" + prop + "</td><td>" + data[prop] + "</td></tr>");
	}
}

function buildDonut(data){
	AmCharts.makeChart( "bolusGraph", {
		"balloon": {
				"animationDuration": 0,
        "shadowAlpha": 0
    },
		"creditsPosition": "bottom-right",
		"decimalSeparator": ",",
		"thousandsSeparator": ".",
		"type": "pie",
		"theme": "light",
		"pullOutRadius": "0%",
		"startDuration": 0,
		"colorField": "color",
		"dataProvider": data,
		"titleField": "title",
		"valueField": "value",
		"labelRadius": 5,
		"radius": "38%",
		"innerRadius": "36%",
		"labelText": "[[title]]: [[value]]U",
		"balloonText": "[[percents]]%"
	});
}

function buildEvents(data){
	//Make the table rows with ids
	for(var i = 0; i < bolusEventRowNames.length; i++){
		var s = "";
		if(i >=2 && i <= 6)
			s = "bolus";
		else if(i >= 7 && i <= 9)
			s = "food";
		else if(i >= 10 && i <= 14)
			s = "bgl";
		
		var bottom = "";
		if(i == 1 || i == 6 || i == 9 || i == 14)
			bottom = "bottom";
		
		$("#eventTableBody").append("<tr id =\"" + i + "\" class=\"" + bottom + "\"><th class=\"" + s + "\">" + bolusEventRowNames[i] + "</th></tr>");
	}
	
	//Fill cells with known data, add empty cells to fill table to 10 columns
	for(var j = 0; j < 10; j++){
		var i = 0;
		if(data[j] != undefined){
			for(var propName in data[j]){		
				$("#eventTableBody>#"+i+"").append("<td>" + data[j][propName] + "</td>");
				i++;
			}
		}else{
			for(var i = 0; i < bolusEventRowNames.length; i++)
				$("#eventTableBody>#"+i+"").append("<td></td>");
		}
	}
}