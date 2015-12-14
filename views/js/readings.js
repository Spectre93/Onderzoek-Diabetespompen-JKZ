$(function () {
	$.get('/readingsData', function(data) {
		var jsonData = JSON.parse(data);

		/**
		 * Loop through the received data
		 * @param  {Number} var i             loop index
		 */
		for (var i = 0; i < jsonData.length; i++) {
			var cur = jsonData[i];
			$('#readingsTable > tbody:last-child').append('<tr><th>' + cur.day + '</th><td>00</td><td>01</td><td>02</td><td>03</td><td>04</td><td>05</td><td>06</td><td>07</td><td>08</td><td>09</td><td>10</td><td>11</td><td>12</td><td>13</td><td>14</td><td>15</td><td>16</td><td>17</td><td>18</td><td>19</td><td>20</td><td>21</td><td>22</td><td>23</td></tr>');

			// Calculate values and locations here
			var result = '<tr style="background-color:#ffffcc"><td>Glucose</td>';

			var indexGlucose = cur.glucoseHours.length-1;
			for(var j = 0; j < 24; j++){
				var curIDs = [];

				while(indexGlucose >= 0 && cur.glucoseValues[indexGlucose] == null)
					indexGlucose--;
				if(cur.glucoseHours[indexGlucose] == j){
					var lastIndexGlucose = indexGlucose;
					var value = parseFloat(parseFloat(cur.glucoseValues[indexGlucose].replace(",",".")).toFixed(1));

					curIDs.push(cur.ids[indexGlucose]);
					
					for(var k = indexGlucose-1; k >= 0; k--){
						if(cur.glucoseHours[lastIndexGlucose] == cur.glucoseHours[k]){
							value += parseFloat(parseFloat(cur.glucoseValues[k].replace(",",".")).toFixed(1));
							curIDs.push(cur.ids[k]);
							indexGlucose--;
						} else {
							break;
						}
					}
					indexGlucose--;
					result += '<td data-ids=' + curIDs + '>' + value + '</td>';
				} else
					result += '<td></td>';
			}

			result += '</tr>';

			// Calculate values and locations here
			result += '<tr style="background-color:#f6e9fc"><td>Koolhydraten</td>';

			var indexCarbs = cur.carbHours.length-1;
			for(var j = 0; j < 24; j++){
				var curIDs = [];

				while(indexCarbs >= 0 && cur.carbValues[indexCarbs] == null)
					indexCarbs--;
				if(cur.carbHours[indexCarbs] == j){
					var lastIndexCarbs = indexCarbs;
					var value = parseFloat(parseFloat(cur.carbValues[indexCarbs].replace(",",".")).toFixed(1));

					curIDs.push(cur.ids[indexCarbs]);
					
					for(var k = indexCarbs-1; k >= 0; k--){
						if(cur.carbHours[lastIndexCarbs] == cur.carbHours[k]){
							value += parseFloat(parseFloat(cur.carbValues[k].replace(",",".")).toFixed(1));
							curIDs.push(cur.ids[k]);
							indexCarbs--;
						} else {
							break;
						}
					}
					indexCarbs--;
					result += '<td data-ids=' + curIDs + '>' + value + '</td>';
				} else
					result += '<td></td>';
			}

			result += '</tr>';

			// Calculate values and locations here
			result += '<tr style="background-color:#e9fbd0"><td>Bolus</td>';

			var indexBolus = cur.bolusHours.length-1;
			for(var j = 0; j < 24; j++){
				var curIDs = [];

				while(indexBolus >= 0 && cur.bolusValues[indexBolus] == null)
					indexBolus--;
				if(cur.bolusHours[indexBolus] == j){
					var lastIndexBolus = indexBolus;
					var value = parseFloat(parseFloat(cur.bolusValues[indexBolus].replace(",",".")).toFixed(1));

					curIDs.push(cur.ids[indexBolus]);
					
					for(var k = indexBolus-1; k >= 0; k--){
						if(cur.bolusHours[lastIndexBolus] == cur.bolusHours[k]){
							value += parseFloat(parseFloat(cur.bolusValues[k].replace(",",".")).toFixed(1));
							curIDs.push(cur.ids[k]);
							indexBolus--;
						}else{
							break;
						}
					}
					indexBolus--;
					result += '<td data-ids=' + curIDs + '>' + value + '</td>';
				} else
					result += '<td></td>';
			}

			result += '</tr>';

			// Calculate values and locations here
			result += '<tr style="background-color:#ebfaeb"><td>Basaal</td>';

			var indexBasal = cur.basalHours.length-1;
			for(var j = 0; j < 24; j++){
				var curIDs = [];

				while(indexBasal >= 0 && cur.basalValues[indexBasal] == null)
					indexBasal--;
				if(cur.basalHours[indexBasal] == j){
					var lastIndexBasal = indexBasal;
					var value = parseFloat(parseFloat(cur.basalValues[indexBasal].replace(",",".")).toFixed(1));
					
					curIDs.push(cur.ids[indexBasal]);


					for(var k = indexBasal-1; k >= 0; k--){
						if(cur.basalHours[lastIndexBasal] == cur.basalHours[k]){
							value += parseFloat(parseFloat(cur.basalValues[k].replace(",",".")).toFixed(1));
							curIDs.push(cur.ids[k]);
							indexBasal--;
						}else{
							break;
						}
					}
					indexBasal--;
					result += '<td data-ids=' + curIDs + '>' + value + '</td>';
				}else
					result += '<td></td>';
			}

			result += '</tr>';

			$('#readingsTable > tbody:last-child').append(result);


			//console.log(jsonData[i]);
		}
	});
});