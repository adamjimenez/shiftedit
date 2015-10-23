define(['app/tabs', 'app/site'], function (tabs, site) {

this.loadFromHash = function () {
	var hash = window.location.hash.substr(1);
	console.log('hash: '+ hash);

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

window.onhashchange = this.loadFromHash;

return {
};
});