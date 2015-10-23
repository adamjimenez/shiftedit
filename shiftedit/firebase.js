define(function (require) {

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

return {
    connect: connect,
    isConnected: function() {
        return connected;
    }
};

});