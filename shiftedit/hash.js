define(['app/tabs', 'app/site'], function (tabs, site) {

var value = '';

load = function (callback) {
	var hash = window.location.hash.substr(1);
	hash = decodeURIComponent(hash);

	var files = [];
	if(value !== hash){
		console.log('hash: '+ hash);
	
		//protect from xss
		if(hash.indexOf('<')!==-1){
			console.warn('"<" in file name');
			return;
		}
	
		var line = 0;
		files = hash.split('|');
		files.forEach(function(path){
			var pos = path.indexOf('/');
			if (pos !== -1) {
				var siteName = path.substr(0, pos);
				var file = path.substr(pos + 1);
	
				pos = file.indexOf(':');
				if(pos!==-1) {
					line = file.substr(pos+1);
					file = file.substr(0, pos);
				}
	
				var settings = site.getSettings(siteName);
				tabs.open(file, settings.id, function(tab, firstOpen) {
					if(firstOpen) {
						var editor = tabs.getEditor(tab);
						editor.gotoLine(line);
						editor.focus();
					}
				});
			}
		});
	}

	if (callback) {
		callback(files);
	}
};

set = function(hash) {
	if(hash!=window.location.hash){
		value = hash;

		console.log('set hash: #'+ value);
		window.location.hash = '#'+value;
	}
};

$(window).on( 'hashchange', function(e) { load(); } );

return {
	load: load,
	set: set
};
});

