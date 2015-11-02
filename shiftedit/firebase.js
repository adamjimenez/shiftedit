define(['app/tabs','app/preferences'],function (tabs, preferences) {

var connected = false;

connect = function (callback) {
	//firebase login - put this someplace else
	var dataRef = new Firebase("https://shiftedit.firebaseio.com/");
	// Log me in.
	dataRef.auth(localStorage.authToken, function(error) {
		if(error) {
			console.log("Firebase login failed", error);

			//token expired, load a new one
			preferences.load(function(){
				connect(callback);
			});
			connected = false;
		} else {
			console.log("Firebase login succeeded");
			connected = true;

			if( callback ){
				callback();
			}
		}
	}, function(error){
		console.log('Firebase login expired', error);

		//token expired, load a new one
		preferences.load();
		connected = false;
	});
};

$('body').on('click', 'a.user', function() {
    var user = $(this).data('user');
    var tab = tabs.active();
    var editor = tabs.getEditor(tab);
    var firepad = tab.data('firepad');

	if( firepad.editorAdapter_.otherCursors ){
		var range = firepad.editorAdapter_.otherCursors[user];
		editor.renderer.scrollToLine(range.start.row, true, true);
	}
	editor.focus();

	return false;
});

return {
    connect: connect,
    isConnected: function() {
        return connected;
    }
};

});