define(['json!locale/en.json', "app/storage"], function (data) {
var storage = require('app/storage');
var lang = data;
var customLang = storage.get('strs');

if(customLang){
   lang = customLang;
}

function load() {
    return $.getJSON('/api/lang')
        .then(function (data) {
            if(!data.success){
                console.error('lang not found');
                return false;
            }

            lang = data.strs;

			storage.set('lang', data.lang);
			storage.set('strs', lang);

            return lang;
        });
}

return {
    load: load,
    lang: lang
};

});