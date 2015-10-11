define(function (require) {
var storage = require('./storage');

var lang = storage.get('strs');

function load() {
    return $.getJSON('/api/lang')
        .then(function (data) {
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