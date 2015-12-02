$(function () {
	$.get('/readingsData', function(data) {
		var jsonData = JSON.parse(data);

		/**
		 * Loop through the received data
		 * @param  {Number} var i             loop index
		 */
		for (var i = 0; i < jsonData.length; i++) {
			var cur = jsonData[i];
			console.log(cur);
			$('#readingsTable > tbody:last-child').append('<tr><th>' + cur.day + '</th><td>00</td><td>01</td><td>02</td><td>03</td><td>04</td><td>05</td><td>06</td><td>07</td><td>08</td><td>09</td><td>10</td><td>11</td><td>12</td><td>13</td><td>14</td><td>15</td><td>16</td><td>17</td><td>18</td><td>19</td><td>20</td><td>21</td><td>22</td><td>23</td></tr>');

			// Calculate values and locations here
			var result = '<tr><td>Basaal</td>';

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

			// Calculate values and locations here
			result += '<tr><td>Glucose</td>';

			var indexGlucose = cur.glucoseHours.length-1;
			for(var j = 0; j < 24; j++){
				while(indexGlucose >= 0 && cur.glucoseValues[indexGlucose] == null)
					indexGlucose--;
				if(cur.glucoseHours[indexGlucose] == j){
					var lastindexGlucose = indexGlucose;
					var value = parseFloat(parseFloat(cur.glucoseValues[indexGlucose].replace(",",".")).toFixed(1));

					curIDs.push(cur.ids[indexBasal]);
					
					for(var k = indexGlucose-1; k >= 0; k--){
						if(cur.glucoseHours[lastindexGlucose] == cur.glucoseHours[k]){
							value += parseFloat(parseFloat(cur.glucoseValues[k].replace(",",".")).toFixed(1));
							curIDs.push(cur.ids[k]);
							indexGlucose--;
						}else{
							break;
						}
					}
					indexGlucose--;
					result += '<td data-ids=' + curIDs + '>' + value + '</td>';
				}else
					result += '<td></td>';
			}

			result += '</tr>';

			// Calculate values and locations here
			result += '<tr><td>Bolus</td>';

			var indexBolus = cur.bolusHours.length-1;
			for(var j = 0; j < 24; j++){
				while(indexBolus >= 0 && cur.bolusValues[indexBolus] == null)
					indexBolus--;
				if(cur.bolusHours[indexBolus] == j){
					var lastindexBolus = indexBolus;
					var value = parseFloat(parseFloat(cur.bolusValues[indexBolus].replace(",",".")).toFixed(1));

					curIDs.push(cur.ids[indexBasal]);
					
					for(var k = indexBolus-1; k >= 0; k--){
						if(cur.bolusHours[lastindexBolus] == cur.bolusHours[k]){
							value += parseFloat(parseFloat(cur.bolusValues[k].replace(",",".")).toFixed(1));
							curIDs.push(cur.ids[k]);
							indexBolus--;
						}else{
							break;
						}
					}
					indexBolus--;
					result += '<td>' + value + '</td>';
				}else
					result += '<td data-ids=' + curIDs + '></td>';
			}

			result += '</tr>';

			$('#readingsTable > tbody:last-child').append(result);


			//console.log(jsonData[i]);
		}
	});
});