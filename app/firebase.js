define(['./tabs','./prefs', './storage', 'firebase'],function (tabs, preferences, storage) {

var firebase = require('firebase');
var connected = false;
var connecting = false;
var firebaseDatabase = null;
var callbacks = [];

reconnect = function() {
	preferences.load()
	.then(function() {
		connect();
	});
	connected = false;
};

connect = function (callback) {
	if (callback) {
		callbacks.push(callback);
	}
	
	if (connected || connecting) {
		return;
	}
	
	connecting = true;
	
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
	} catch(error) {
		var errorCode = error.code;
		var errorMessage = error.message;

		console.log("Firebase init failed", error.message);

		//token expired, load a new one
		//reconnect();
		connecting = false;
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
		connecting = false;
		reconnect();
		return false;
	})
	.then(function() {
		console.log("Firebase login succeeded");
		connected = true;
		connecting = false;
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
	
		// process callbacks
		if( callbacks.length ) {
			while(callbacks.length) {
				var func = callbacks.shift();
				func();
			}
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