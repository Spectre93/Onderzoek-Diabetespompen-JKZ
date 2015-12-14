$(function () {
	$.post('/login', {email: 'basverhoog@live.nl', password: "test"}, function(data, textStatus, xhr) {
		/*optional stuff to do after success */
	});
})