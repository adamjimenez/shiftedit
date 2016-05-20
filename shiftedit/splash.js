define(['jquery-ui'], function () {
	/*
	$( ".splash .progressbar" ).progressbar({
		value: false
	});
	*/

	return {
		update: function(str) {
			$('.splash .status').text(str);
		},
		close: function() {
			$('.splash').fadeOut(300, function() { $(this).remove(); });
		}
	};
});