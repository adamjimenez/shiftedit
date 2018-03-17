define(['./config', "./site"], function (config, site) {

var sources = [];
var items = [];

function load(val) {
	return $.getJSON(config.apiBaseUrl+'repositories')
		.done(function (data) {
			if(data.success){
				sources = data.sources;
				items = data.repos;
			}
		});
}

function getSources() {
	return sources;
}

function getAll() {
	return items;
}

return {
	load: load,
	getSources: getSources,
	getAll: getAll
};

});