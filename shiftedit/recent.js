define(function (require) {

var recentFiles = [];

function load() {
    return $.getJSON('/api/prefs?cmd=recent')
        .done(function (data) {
            if(data.success){
                recentFiles = data.recent;
            }
        });
}

function getRecent() {
    return recentFiles;
}

function add(file, site) {
    //remove if already in list
	for (var i in recentFiles) {
		if (recentFiles[i].file === file && recentFiles[i].site === site) {
			recentFiles.splice(i, 1);
			break;
		}
	}

	//add to beginning
    recentFiles.unshift({
		file: file,
		site: site
	});
}

return {
    load: load,
    getRecent: getRecent,
    add: add
};

});