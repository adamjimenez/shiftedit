define(["jquery-ui","app/lang","app/prefs","app/tabs","app/layout","app/drop"], function () {
    var locale = require("app/lang");
    var prefs = require("app/prefs");

    locale.load()
    .fail(function () {
        console.error("Cannot load language file");
    })
    .done(prefs.load())
    .always(function (lang) {
        // yay!
        var tabs = require("app/tabs");
        tabs.init();
        var tree = require("app/tree");
        tree.init();
        var site = require("app/site");
        site.init();
        var layout = require("app/layout");
        layout.init();
    });
});