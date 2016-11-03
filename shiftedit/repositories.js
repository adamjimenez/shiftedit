define(['app/config', "app/site"], function (config, site) {

var sources = [];

function load(val) {
	return $.getJSON(config.apiBaseUrl+'repositories')
		.done(function (data) {
			if(data.success){
				sources = data.sources;
			}
		});
}

function getSources() {
	return sources;
}

function getAll() {
	var items = [];
	for (var source in sources) {
    	if (sources.hasOwnProperty(source)) {
			sources[source].repositories.forEach(function(item) {
				items.push({
					name: item.name,
					url: item.url,
					source: source
				});
			});
    	}
	}
	
	// sort them
	items.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} ); 
	
	return items;
}

return {
	load: load,
	getSources: getSources,
	getAll: getAll
};

});