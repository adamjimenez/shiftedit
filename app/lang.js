define(['./config', "./storage", 'json!../locale/en.json'], function (config, storage, data) {
var lang = data;
var customLang = storage.get('strs');

if(customLang){
   lang = customLang;
}

function load() {
	return $.getJSON(config.apiBaseUrl+'lang')
		.then(function (data) {
			if(!data.success){
				console.log('lang not found');
			}

			lang = data.strs;

			storage.set('lang', data.lang);
			storage.set('strs', lang);

			return data;
		});
}

return {
	load: load,
	lang: lang
};

});