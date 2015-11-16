// For any third party dependencies, like jQuery, place them in the lib folder.

// Configure loading modules from the lib directory,
// except for 'app' ones, which are in a sibling
// directory.
requirejs.config({
    baseUrl: "lib",
    paths: {
        "json": 'require/json',
        "locale": '../locale',
        "app": "../shiftedit",
        "jquery.contextMenu": "contextMenu/jquery.contextMenu",
        "jquery.menubar": "menubar/jquery.menubar",
        "ui.combobox": "combobox/ui.combobox",
        "jstree": "jstree/jstree",
        "ace": "ace.20141108/src",
        //"ace/split": 'ace.20141108/src/ext-split',
        //"ace/autocomplete": "ace.20141108/src/ext-language_tools",
        "ace/mode/css/csslint": "ace.20141108/src/worker-css",
        //"ace/ext/emmet": 'ace.20141108/src/ext-emmet',
        "firepad": 'firepad/firepad',
        "firepad-userlist": 'firepad/firepad-userlist',
        "jsdiff": 'jsdiff/diff',
    },
    "shim": {
        /*
        "ace/ext/emmet": {
            deps: ['emmet','ace/ace']
        },
        */
        "ace/mode/css/csslint": {
            deps: ["ace/ace"]
        },
        "ace/ext-split": {
            deps: ["ace/ace"]
        },
        "ace/ext-language_tools": {
            deps: ["ace/ace"]
        },
        "jquery-ui": {
            exports: "$",
            deps: ["jquery"]
        },
        "jquery.contextMenu": {
            exports: "$",
            deps: ["jquery"]
        },
        "jquery.layout": {
            exports: "$",
            deps: ["jquery-ui"]
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
        "ui.tabs.overflowResize": {
            exports: "$",
            deps: ["jquery-ui", "ui.tabs.addTab", "ui.tabs.closable"]
        },
        "jstree": {
            exports: "$",
            deps: ["jquery"]
        },
        "app/firebase": {
            deps: ["https://cdn.firebase.com/v0/firebase.js",'firepad','firepad-userlist']
        },
        "firebase": {
            deps: ['Firepad']
        },
        "firepad": {
            deps: ['ace/ace']
        },
        "app/ssh": {
            deps: ["https://ssh.shiftedit.net/socket.io/socket.io.js",'https://ssh.shiftedit.net/term.js']
        },
        "app/gdrive": {
            deps: ["https://apis.google.com/js/client.js"]
        }
    }
});

// Start loading the main app file. Put all of
// your application logic in there.
window.shiftedit = {};
requirejs(['app/main']);