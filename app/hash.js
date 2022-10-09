define(['./tabs', './site'], function (tabs, site) {

var ignoreChange = 0;
var value = '';

var load = function (callback) {
	// console.log('hashchange ' + window.location.hash)
	if (ignoreChange) {
		ignoreChange--;
		return;
	}
	
	var hash = window.location.hash.substr(1);
	hash = decodeURIComponent(hash);

	// console.log('loading hash: ' + hash);
	
	var files = [];
	if(hash){
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
				if(pos !== -1) {
					line = file.substr(pos+1);
					file = file.substr(0, pos);
				}
			} else {
				siteName = path
			}

			var settings = site.getSettings(siteName);
			
			if (!settings) {
				return;
			}
			
			tabs.open(file, settings.id, {
				callback: function(tab, firstOpen) {
					if (!tab) {
						return;
					}
					
					// restore cursor position
					var editor = tabs.getEditor(tab);
					editor.gotoLine(line);
					editor.focus();
					
					// restore cursor in firepad
					tab.data('line', line);
				}
			});
		});
	}

	if (callback) {
		callback(files);
	}
};

var set = function(value, ignore) {
	if (value) {
		if (ignore) {
			ignoreChange++;
		}
	
		window.location.hash = '#' + value;
		
		// trigger update on initial load
		if(!ignore && '#' + value === window.location.hash) {
			load();
		}
		
	} else {
		remove();
	}
};

var init = function() {
	$(window).on('hashchange', function(e) { load(); });
	
	// clear hash when center tabs are closed
	$('body').on('tabsremove tabsactivate', '.ui-layout-center', function(e) {
		update();
	});
	
	$(document).on("changeSelection", function(e, tab) {
		update();
	});
}

var remove = function () {
	history.pushState("", document.title, window.location.pathname + window.location.search);
}

var update = function () {
	var tab = tabs.active();
	var siteId = tab.attr('data-site');
	var file = tab.attr('data-file');
	
	//hash
	var hashVal = '';
	
	if(siteId) {
		settings = site.getSettings(siteId);
		hashVal += settings.name + '/';
	}
	
	hashVal += file ? file : '';
	
	// cursor pos
	if (tab) {
		var editor = tabs.getEditor(tab);
		if (editor) {
			var sel = editor.session.getSelection();
			hashVal += ':' + (sel.lead.row + 1);
		}
	}

	set(hashVal, true);
	
	var title = file ? file : 'ShiftEdit';
	document.title = title;
}

return {
	load: load,
	set: set,
	init: init,
	remove: remove,
	update: update,
};

});