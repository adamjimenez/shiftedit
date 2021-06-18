define(['./tabs', './site'], function (tabs, site) {

var value = '';

var load = function (callback) {
	var hash = window.location.hash.substr(1);
	hash = decodeURIComponent(hash);

	console.log('current hash: ' + hash);
	
	var files = [];
	if(value !== hash){
		console.log('new hash: ' + hash);
	
		//protect from xss
		if(hash.indexOf('<') !== -1){
			console.warn('"<" in file name');
			return;
		}
	
		var line = 0;
		files = hash.split('|');
		files.forEach(function(path) {
			var siteName, file;
			var pos = path.indexOf('/');
			
			if (pos !== -1) {
				siteName = path.substr(0, pos);
				file = path.substr(pos + 1);
	
				pos = file.indexOf(':');
				if(pos!==-1) {
					line = file.substr(pos+1);
					file = file.substr(0, pos);
				}
			} else {
				siteName = path
			}

			var settings = site.getSettings(siteName);

			if (file) {
				tabs.open(file, settings.id, function(tab, firstOpen) {
					if(firstOpen) {
						var editor = tabs.getEditor(tab);
						editor.gotoLine(line);
						editor.focus();
					}
				});
			} else {
				site.open(settings.id);
			}
		});
	}

	if (callback) {
		callback(files);
	}
};

var set = function(hash) {
	if('#' + hash != window.location.hash) {
		value = hash;

		console.log('set hash: ' + value);
		
		if (value) {
			window.location.hash = '#' + value;
		} else {
			remove();
		}
	}
};

var init = function() {
	$(window).on('hashchange', function(e) { load(); });
	
	// clear hash when all center tabs are closed
	$('body').on('close', '.ui-layout-center', function(e) {
		if (!$(this).children('ul').children('li:not(.button)').length) {
			console.log('clear hash');
			set('');
		}
	});
}

var remove = function () {
	history.pushState("", document.title, window.location.pathname + window.location.search);
}

return {
	load: load,
	set: set,
	init: init,
	remove: remove
};

});