define(['app/tabs','app/prefs', 'app/storage', 'firebase'],function (tabs, preferences, storage) {

var firebase = require('firebase');
var connected = false;
var firebaseDatabase = null;

reconnect = function(callback) {
	preferences.load()
	.then(function() {
		connect(callback);
	});
	connected = false;
};

connect = function (callback) {
	if (connected) {
		return;
	}
	
	//firebase login - put this someplace else
	var config = {
		apiKey: "AIzaSyCZScKs0pAv97SAOM9SQvHx49niOJKA8K4",
		authDomain: "shiftedit.firebaseapp.com",
		databaseURL: "https://shiftedit.firebaseio.com",
		projectId: "firebase-shiftedit",
		storageBucket: "firebase-shiftedit.appspot.com",
		messagingSenderId: "899582558962"
	};

	try{
		if (!firebase.apps.length) {
			firebase.initializeApp(config);
		}
	}catch(error) {
		var errorCode = error.code;
		var errorMessage = error.message;

		console.log("Firebase init failed", error.message);

		//token expired, load a new one
		//reconnect(callback);
		return false;
	}
	
	firebaseDatabase = firebase.database();
	var dataRef = firebaseDatabase.ref();
	
	// Log me in.
	firebase.auth().signInWithCustomToken(storage.get('newAuthToken')).catch(function(error) {
		var errorCode = error.code;
		var errorMessage = error.message;

		console.log("Firebase login failed", error.message);

		//token expired, load a new one
		reconnect(callback);
		return false;
	})
	.then(function() {
		console.log("Firebase login succeeded");
		connected = true;
		//console.log(authData);
	
		// get a new token every day
		setTimeout(function() {
			console.log('get new firebase token');
			
			// get a new token
			preferences.load()
			.then(function(data) {
				console.log('reconnect to firebase');
				connect();
			});
		}, 3600*1000);
	
		if( callback ){
			callback();
		}
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
	},
	get: function() {
		return firebaseDatabase;
	}
};

});