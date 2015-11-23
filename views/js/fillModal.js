$(function () {
	$(".table-striped").find('tr[data-id]').on('click', function () {
		//do all your operation populate the modal and open the modal now. Don't need to use show event of modal again
		var tdValues = $(this).children('td').map(function (index, val) {
			return $(this).text();
		}).toArray();

		$('#itemDetails').html($('<strong> ID: ' + $(this).data('id') + '</strong><br />' +
															'Datum en tijdstip: ' + tdValues[1] + '<br />' +
															'Categorie: ' + tdValues[2] + '<br />' +
															'Waarde: ' + tdValues[3] + '<br />' +
															'Omschrijving: ' + tdValues[4] + '<br />' +
															'Commentaar: ' + tdValues[5] + '<br />'));
		$('#detailModal').modal('show');


	});
    
	$('#detailModal').modal({
		keyboard: true,
		show: false,

	}).on('show.bs.modal', function (e) {

	});

});