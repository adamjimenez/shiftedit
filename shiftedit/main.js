define(["jquery-ui","app/lang", "app/prefs", "app/site", "app/tabs", "app/tree", "app/layout"], function () {
    var locale = require("app/lang");
    var prefs = require("app/prefs");

    locale.load()
    .fail(function () {
        console.error("Cannot load language file");
    })
    .done(prefs.load())
    .then(function (lang) {
        // yay!
        var tabs = require("app/tabs");
        var tree = require("app/tree");
        tree.init();
        var site = require("app/site");
        site.init();
        var layout = require("app/layout");
    });
});