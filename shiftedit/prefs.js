define(function (require) {
var storage = require('./storage');
var prefs = storage.get('prefs');
var openingFilesBatch = [];

if(!prefs)
    prefs = {};

function load() {
    return $.getJSON('/api/prefs')
        .done(function (data) {
            prefs = data.prefs;
            openingFilesBatch = data.openingFilesBatch;
			storage.set('prefs', prefs);
            return prefs;
        });
}

function save() {

}

return {
    get_prefs: function() {
        return prefs;
    },
    getOpeningFilesBatch: function() {
        return openingFilesBatch;
    },
    load: load,
    save: save
};

});