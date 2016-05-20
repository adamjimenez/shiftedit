define(['app/prefs'], function (preferences) {
	function init() {
		var prefs = preferences.get_prefs();
		$('#notes').val(prefs.notes);
		$('#notes').on('change', function() {
			preferences.save('notes', $(this).val());
		});

		$( ".ui-layout-west" ).on( "tabsactivate", function(e, ui){
			if(ui.newTab.attr('aria-controls')==='tabs-notes') {
				$('#notes').focus();
			}
		} );
	}

	return {
		init: init
	};
});