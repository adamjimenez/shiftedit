define(function (require) {
    require('ace/ace');
    var locale = require('./lang');
    var prefs = require('./prefs');

    locale.load()
    .fail(function () {
        console.error("Cannot load language file");
    })
    .done(prefs.load())
    .then(function (lang) {
        // yay!
        var site = require('./site');
        var tabs = require('./tabs');
        var tree = require('./tree');
        tree.init();
        var layout = require('./layout');
    });
});