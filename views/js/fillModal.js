$(function () {
	$(document).on("click", "td[data-ids]", function () {
		var ids = $(this).data('ids')+"";
		var resultString = "";

		//do all your operation populate the modal and open the modal now. Don't need to use show event of modal again
		// var tdValues = $(this).children('td').map(function (index, val) {
		// 	return $(this).text();
		// }).toArray();

		$.get('/reading', {
			ids: ids
		}).done(function(data) {
			/*optional stuff to do after success */

			for (var i = 0; i < data.length; i++) {
				resultString += "<strong> ID: " + data[i].id + "</strong><br>" +
								"Datum en tijdstip: " + data[i].date + "<br>" +
								"Categorie: " + data[i].category + "<br>" +
								"Waarde: " + data[i].value + "<br>" +
								"Omschrijving: " + data[i].description + "<br>" +
								"Commentaar: " + data[i].comment + "<br><br>";
			}

			$('#itemDetails').html(resultString);
			$('#detailModal').modal('show');
		});


	});
    
	$('#detailModal').modal({
		keyboard: true,
		show: false,

	}).on('show.bs.modal', function (e) {

	});

});