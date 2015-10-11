define(function (require) {
var storage = require('./storage');
var prefs = storage.get('prefs');

if(!prefs)
    prefs = {};

function load() {
    return $.getJSON('/api/prefs')
        .then(function (data) {
            prefs = data.prefs;
			storage.set('prefs', prefs);
            return prefs;
        });
}

function save() {

}

return {
    prefs: prefs,
    load: load,
    save: save
};

});