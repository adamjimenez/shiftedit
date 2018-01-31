// For any third party dependencies, like jQuery, place them in the lib folder.

// Configure loading modules from the lib directory,
// except for 'app' ones, which are in a sibling
// directory.
requirejs.config({
	baseUrl: "",
	paths: {
		'firepad': 'node_modules/firepad/dist/firepad',
		'firebase': 'node_modules/firebase/firebase',
		"jstree": "node_modules/jstree/dist/jstree",
		'jquery': 'node_modules/jquery/dist/jquery',
		'xterm': 'node_modules/xterm/dist/xterm',
		'addons/attach/attach': 'node_modules/xterm/dist/addons/attach/attach',
		'addons/fit/fit': 'node_modules/xterm/dist/addons/fit/fit',
		"jquery.contextMenu": "node_modules/jquery-contextmenu/dist/jquery.contextMenu",
		'beautify': 'node_modules/js-beautify/js/lib/beautify',
		'beautify-css': 'node_modules/js-beautify/js/lib/beautify-css',
		'beautify-html': 'node_modules/js-beautify/js/lib/beautify-html',
		'markdown-it': 'node_modules/markdown-it/dist/markdown-it',
		'resumable': 'node_modules/resumablejs/resumable',
		'lzma': 'node_modules/lzma/src',
		'jquery-ui': 'node_modules/jquery-ui-bundle/jquery-ui',
		'uglify': 'node_modules/uglify-js/lib',
		"diff": 'node_modules/diff/dist/diff',
		'autosize': 'node_modules/autosize/dist/autosize',
		'md5': 'node_modules/blueimp-md5/js/md5',
		"ace": "node_modules/ace-builds/src",
		"ace/keyboard/emacs": "node_modules/ace-builds/src/keybinding-emacs",
		"ace/keyboard/vim": "node_modules/ace-builds/src/keybinding-vim",
		"ace/ext/language_tools": "node_modules/ace-builds/src/ext-language_tools",
		"ace/mode/css/csslint": "node_modules/ace-builds/src/worker-css",
		"ace/ext/searchbox": "node_modules/ace-builds/src/ext-searchbox",
		"ace/ext/whitespace": "node_modules/ace-builds/src/ext-whitespace",
		'linkify': 'node_modules/linkifyjs/dist/linkify',
		'linkify-html': 'node_modules/linkifyjs/dist/linkify-html',
		'text': 'node_modules/text/text',
		"json": 'node_modules/requirejs-plugins/src/json',
		'aes': 'node_modules/crypto-libraries/aes',
		
		// these ones below should be moved to node_modules
		'diff2html': 'lib/diff2html/diff2html',
		'diff2html-ui': 'lib/diff2html/diff2html-ui',
		'cssmin': 'lib/cssmin/cssmin',
		'coffee-script': 'lib/coffee-script/coffee-script',
		'emmet': 'lib/emmet/emmet',
		'jquery.layout': 'lib/layout/jquery.layout',
		'jstreetable': 'lib/jstreetable/jstreetable',
		"jquery.menubar": "lib/menubar/jquery.menubar",
		"ui.basicMenu": "lib/basicMenu/ui.basicMenu",
		'ui.tabs.addTab': 'lib/addTab/ui.tabs.addTab',
		'ui.tabs.closable': 'lib/closable/ui.tabs.closable',
		"ui.combobox": "lib/combobox/ui.combobox",
		"ui.tabs.overflowResize": 'lib/overflowResize/ui.tabs.overflowResize',
		"firepad-userlist": 'lib/firepad-userlist/firepad-userlist',
		"ace/autocomplete": "lib/tern/ext-tern",
		"ace/ext-emmet": "lib/emmet/ext-emmet",
		"ace/ext/tern": "lib/tern/ext-tern",
		
		"app": "shiftedit"
	},
	"shim": {
		"app/main": {
			deps: ['ace/ace']
		},
		"ace/ext-emmet": {
			deps: ['ace/ace','emmet']
		},
		"ace/mode/css/csslint": {
			deps: ["ace/ace"]
		},
		"ace/ext-split": {
			deps: ["ace/ace"]
		},
		"ace/ext-tern": {
			deps: ["ace/ace"]
		},
		"ace/autocomplete": {
			deps: ["ace/ace", "ace/ext/tern"]
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
		"ui.basicMenu": {
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
		'firebase': {
			exports: 'firebase'
		},
		"firepad": {
			deps: ['ace/ace', 'firebase']
		},
		"firepad-userlist": {
			exports: "FirepadUserList",
			deps: ['firebase']
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
		},
		"linkify-html": {
			deps: [
				'linkify'
			]
		},
		"diff2html": {
			deps: [
				'diff'
			]
		},
		"diff2html-ui": {
			deps: [
				'diff2html'
			]
		},
		/*
		"uglify/transform": {
			deps: ['uglify/ast']
		},
		*/
		"uglify/compress": {
			exports: "Compressor",
			deps: ['uglify/utils', 'uglify/ast', 'uglify/parse', 'uglify/transform', 'uglify/scope', 'uglify/output']
		}
	}
});

// Start loading the main app file
requirejs(['app/main']);