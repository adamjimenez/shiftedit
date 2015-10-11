// For any third party dependencies, like jQuery, place them in the lib folder.

// Configure loading modules from the lib directory,
// except for 'app' ones, which are in a sibling
// directory.
requirejs.config({
    baseUrl: "lib",
    paths: {
        "app": "../shiftedit",
        "jquery.contextMenu": "contextMenu/jquery.contextMenu",
        "jquery.menubar": "menubar/jquery.menubar",
        "ui.combobox": "combobox/ui.combobox",
        "jstree": "jstree/jstree",
        //ace: "/js/ace.20141108/src"
    },
    "shim": {
        "jquery-ui": {
            exports: "$",
            deps: ["jquery"]
        },
        "jquery.contextMenu": {
            exports: "$",
            deps: ["jquery"]
        },
        "jquery.menubar": {
            exports: "$",
            deps: ["jquery-ui"]
        },
        "ui.combobox": {
            exports: "$",
            deps: ["jquery-ui"]
        },
        "ui.tabs.addTab": {
            exports: "$",
            deps: ["jquery-ui"]
        },
        "ui.tabs.closable": {
            exports: "$",
            deps: ["jquery-ui"]
        },
        "ui.tabs.paging": {
            exports: "$",
            deps: ["jquery-ui", "ui.tabs.addTab", "ui.tabs.closable"]
        },
        "jstree": {
            exports: "$",
            deps: ["jquery"]
        },
    }
});

// Start loading the main app file. Put all of
// your application logic in there.
requirejs(['app/main']);