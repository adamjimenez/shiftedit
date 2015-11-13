define(['exports',"jquery-ui","app/lang","app/prefs","app/tabs","app/layout","app/drop",'app/restore','app/recent','app/editors','app/shortcuts','app/hash','app/definitions','app/find', 'app/exit', 'app/notes', 'app/snippets', 'app/resize'], function (exports) {
    var version = '17.0.0';
    var locale = require("app/lang");
    var preferences = require("app/prefs");

    locale.load()
    .fail(function () {
        console.error("Cannot load language file");
    })
    .done(
        preferences.load()
        .done(function () {
            var prefs = preferences.get_prefs();

            // yay!
            var tabs = require("app/tabs");
            tabs.init();
            var editors = require("app/editors");
            editors.init();
            var tree = require("app/tree");
            tree.init();
            tree.setSingleClickOpen(prefs.singleClickOpen);
            var site = require("app/site");
            site.init();

            site.load()
            .done(function() {
                if(prefs.restoreTabs) {
                    require('app/restore').restoreBatch(preferences.getOpeningFilesBatch());
                }

                var hash = require("app/hash").load();
            });

            var layout = require("app/layout");
            layout.init();
            var recent = require("app/recent");
            recent.load();
            var shortcuts = require("app/shortcuts");
            shortcuts.load();
            var definitions = require("app/definitions");
            var find = require("app/find");
            var exit = require("app/exit");
            var notes = require("app/notes").init();
            var snippets = require("app/snippets");
            var resize = require("app/resize");
            resize.init();
        })
    );

    exports.getVersion = function() {
        return version;
    };
});