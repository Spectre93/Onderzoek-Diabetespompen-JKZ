var parameters = { 	startDate: "2015/08/10 00:00:00",
										endDate: "2015/08/11 00:00:00"};

var tableData = [{
    "title": "Date",
    "value": "10-08-2015"
  },{
    "title": "Daily carbs",
    "value": "159 grams"
  },{
    "title": "BG readings",
    "value": "4"
  },{
    "title": "Readings avg.",
    "value": "11,2 mmol/L"
  },{
    "title": "Total daily insulin",
    "value": "76,4 U"
  },{
    "title": "-Daily basal",
    "value": "48 U"
  },{
    "title": "-Daily bolus",
    "value": "28,4"
  },{
    "title": "Fills",
    "value": "2 (10,3U)"
  }];
	
var donutData = [{
    "title": "Basal",
    "value": 48
  },{
    "title": "Corr.",
    "value": 5.1
  },{
    "title": "Food",
    "value": 23.3,
		"color": "#d38df1"
  }
];

var bolusEventRowNames = [
	"Bolus Event",
	"Time",
	
	"Recommended Bolus(U)",
	"Bolus Type",
	"Delivered Bolus(U)",
	"+Square Portion(U, h:mm)",
	"Difference (U)",
	
	"Food Bolus(U)",
	"Carbs(g)",
	"Carb Ratio(g/U)",
	
	"Correction Bolus(U)",
	"BG(mmol/L)",
	"BG Target High",
	"BG Target Low",
	
	"Insulin Sens.",
	"Active Insulin"
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

$(document).ready(function(){
	$(function() {
    $( "#datepicker" ).datepicker({});
  });
			
	$.get('/getGraphData',parameters,function(data){	
		buildChart(data);
		buildStatTable(tableData);
		buildDonutChart(donutData);
		buildEventTable(bolusEventData);
	});
});

function buildChart(data){
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
		"minSelectedTime": 10800000,
		"legend": {
			//"useGraphSettings": true,
			"valueText": "",
			"rollOverGraphAlpha": 0.1,
			"switchType": "v",
			"maxColumns": 3
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
				"id": "bwzCarbInputG",
				"title": "BWZ Carb Input (grams)",
				"valueAxis": "v2",
        "bullet": "diamond",
				"lineAlpha": 0,
				"bulletSize": 12,
				"labelText": "[[value]]g",
				"showBalloon": false,
        "valueField": "bwzCarbInputG"
		},{
				"id": "sensorBG",
				"title": "Sensor Glucose (mmol/L)",
				"valueAxis": "v1",
        "lineThickness": 2,
				"lineColor": "#0D8ECF",
				//"behindColumns": true,
				"showBalloon": false,
        "valueField": "sensorBG"
		},{
				"id": "rewind",
				"title": "Rewind",
				"valueAxis": "v3",
				"lineColor": "#0D8ECF",
				"bullet": "triangleDown",
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
			//"autoGridCount": false,
			//"minorGridEnabled": true,
			"strictMinMax": true,
			"minimum": 0
		},{
			"id": "v2",
			//"title": "gram",
			"position": "right",
			"axisAlpha": 0,
			"labelsEnabled": false,
			"autoGridCount": false,
			"strictMinMax": true,
			"minimum": 0,
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

function buildStatTable(data){
	for(var i = 0; i < data.length; i++){
		if(i%4==0){
			if(i==0){
				$("#statTableHeader").append("<tr><th class=\"info\">" + data[i]["title"] + "</th>"
																+"<th class=\"info\">" + data[i]["value"] + "</th></tr>");
			}else{
				$("#statTableBody").append("<tr><th class=\"info\">" + data[i]["title"] + "</th>"
																+"<th class=\"info\">" + data[i]["value"] + "</th></tr>");
			}
		}else{
			$("#statTableBody").append("<tr><td>" + data[i]["title"] + "</td><td>" + data[i]["value"] + "</td></tr>");
		}
	}
}

function buildDonutChart(data){
	AmCharts.makeChart( "bolusGraph", {
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
		"radius": "42%",
		"innerRadius": "40%",
		//"showBalloon": false,
		"labelText": "[[title]]: [[value]]U",
		"balloonText": "[[percents]]%"
	});
}

function buildEventTable(data){
	for(var i = 0; i < bolusEventRowNames.length; i++){
		var id = i;
		
		var s = "";
		if(i >=2 && i <= 6){
			s = "bolus";
		}else if(i >= 7 && i <= 9){
			s = "food";
		}else if(i >= 10 && i <= 14){
			s = "bgl";
		}
		
		var bottom = "";
		if(i == 1 || i == 6 || i == 9 || i == 14){
			bottom = "bottom";
		}
		
		$("#eventTableBody").append("<tr id =\"" + id + "\" class=\"" + bottom + "\"><th class=\"" + s + "\">" + bolusEventRowNames[i] + "</th></tr>");
	}
	
	for(var j = 0; j < data.length; j++){
		var i = 0;
		for(var propName in data[j]){		
			$("#eventTableBody>#"+i+"").append("<td>" + data[j][propName] + "</td>");
			i++;
		}
	}
	
	for(var h = 0; h < 7; h++)
		for(var k = 0; k < 16; k++)
			$("#eventTableBody>#"+k+"").append("<td></td>");
}