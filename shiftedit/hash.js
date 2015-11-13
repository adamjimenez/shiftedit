define(['app/tabs', 'app/site'], function (tabs, site) {

load = function () {
	var hash = window.location.hash.substr(1);
	console.log('hash: '+ hash);

	//protect from xss
	if(hash.indexOf('<')!==-1){
	    return;
	}

	var files = hash.split('|');
	files.forEach(function(path){
		var pos = path.indexOf('/');
		if (pos !== -1) {
    		var siteName = path.substr(0, pos);
    		var file = path.substr(pos + 1);
    		var settings = site.getSettings(siteName);
	        tabs.open(file, settings.id);
		}
	});
};

window.onhashchange = load;

return {
    load: load
};
});