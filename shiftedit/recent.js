define(['app/config', "app/site"], function (config, site) {

var recentFiles = [];

function load() {
	return $.getJSON(config.apiBaseUrl+'prefs?cmd=recent')
		.done(function (data) {
			if(data.success){
				recentFiles = data.recent;
			}
		});
}

function getRecent() {
	return recentFiles;
}

function add(file, siteId) {
	//remove if already in list
	for (var i in recentFiles) {
		if (recentFiles[i].file === file && recentFiles[i].site === siteId) {
			recentFiles.splice(i, 1);
			break;
		}
	}

	settings = site.getSettings(siteId);

	//add to beginning
	recentFiles.unshift({
		file: file,
		site: siteId,
		domain: settings.domain
	});
}

return {
	load: load,
	getRecent: getRecent,
	add: add
};

});