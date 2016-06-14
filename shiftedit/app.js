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
		"ace": "ace.20160218/src",
		//"ace/split": 'ace.20151029/src/ext-split',
		"ace/ext/language_tools": "ace.20160218/src/ext-language_tools",
		"ace/autocomplete": "ace.20160218/src/ext-language_tools",
		"ace/mode/css/csslint": "ace.20160218/src/worker-css",
		//"ace/ext/emmet": 'ace.20151029/src/ext-emmet',
		//"firepad": 'firepad/firepad',
		"firepad-userlist": 'firepad/firepad-userlist',
		"jsdiff": 'jsdiff/diff',
		"ui.tabs.overflowResize": 'ui.tabs.overflowResize/ui.tabs.overflowResize',
		"ace/keyboard/vim": "ace.20160218/src/keybinding-vim",
		"ace/keyboard/emacs": "ace.20160218/src/keybinding-emacs",
		"ace/ext/whitespace": "ace.20160218/src/ext-whitespace",
		'beautify': 'js-beautify/beautify',
		'beautify-css': 'js-beautify/beautify-css',
		'beautify-html': 'js-beautify/beautify-html'
	},
	"shim": {
		"ace/ext-emmet": {
			deps: ['ace/ace','emmet']
		},
		"ace/mode/css/csslint": {
			deps: ["ace/ace"]
		},
		"ace/ext-split": {
			deps: ["ace/ace"]
		},
		"ace/autocomplete": {
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
		"firepad/firepad": {
			deps: ['ace/ace', 'firepad/firebase']
		},
		"firepad-userlist": {
			deps: ['firepad/firebase']
		},
		"app/ssh": {
			deps: [
				//"https://ssh.shiftedit.net/socket.io/socket.io.js",'https://ssh.shiftedit.net/term.js'
			]
		},
		"app/gdrive": {
			deps: [
				//"https://apis.google.com/js/client.js"
			]
		}
	}
});

// Start loading the main app file
requirejs(['app/main']);