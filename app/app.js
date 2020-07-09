requirejs.config({
	paths: {
		"@firebase/app": "node_modules/firebase/firebase-app",
		"@firebase/database": "node_modules/firebase/firebase-database",
		"@firebase/auth": "node_modules/firebase/firebase-auth",
		
		"jstree": "node_modules/jstree/dist/jstree",
		"jquery": "node_modules/jquery/dist/jquery",
		"xterm": "node_modules/xterm/lib/xterm",
		"xterm-addon-fit": "node_modules/xterm-addon-fit/lib/xterm-addon-fit",
		//"xterm/dist/addons/attach/attach": "node_modules/xterm/dist/addons/attach/attach",
		//"xterm/dist/addons/fit/fit": "node_modules/xterm/dist/addons/fit/fit",
		"jquery-contextmenu": "node_modules/jquery-contextmenu/dist/jquery.contextMenu",
		"markdown-it": "node_modules/markdown-it/dist/markdown-it",
		"resumablejs": "node_modules/resumablejs/resumable",
		"lzma": "node_modules/lzma",
		"uglify-js": "node_modules/uglify-js",
		"diff": "node_modules/diff/dist/diff",
		"autosize": "node_modules/autosize/dist/autosize",
		"md5": "node_modules/blueimp-md5/js/md5",
		"ace": "node_modules/ace-builds/src",
		"ace/keyboard/emacs": "node_modules/ace-builds/src/keybinding-emacs",
		"ace/keyboard/vim": "node_modules/ace-builds/src/keybinding-vim",
		"ace/ext/language_tools": "node_modules/ace-builds/src/ext-language_tools",
		"ace/autocomplete": "node_modules/ace-builds/src/ext-language_tools",
		"ace/mode/css/csslint": "node_modules/ace-builds/src/worker-css",
		"ace/ext/searchbox": "node_modules/ace-builds/src/ext-searchbox",
		"ace/ext/whitespace": "node_modules/ace-builds/src/ext-whitespace",
		"ace/ext/beautify": "node_modules/ace-builds/src/ext-beautify",
		"text": "node_modules/text/text",
		"json": "node_modules/requirejs-plugins/src/json",
		
		// these ones below should be moved to node_modules
		"firepad": "lib/firepad/dist/firepad",
		"jquery-ui-bundle": "lib/jquery-ui/jquery-ui",
		"virtualKeyboardDetector": "lib/virtualKeyboardDetector/virtualKeyboardDetector",
		"linkify": "lib/linkify/linkify",
		"linkify-html": "lib/linkify/linkify-html",
		"aes": "lib/crypto/aes",
		"diff2html": "lib/diff2html/diff2html",
		"diff2html-ui": "lib/diff2html/diff2html-ui",
		"cssmin": "lib/cssmin/cssmin",
		//"coffee-script": "lib/coffee-script/coffee-script",
		"jquery.layout": "lib/layout/jquery.layout",
		"jstreetable": "lib/jstreetable/jstreetable",
		"jquery.menubar": "lib/menubar/jquery.menubar",
		"ui.basicMenu": "lib/basicMenu/ui.basicMenu",
		"ui.tabs.addTab": "lib/addTab/ui.tabs.addTab",
		"ui.tabs.closable": "lib/closable/ui.tabs.closable",
		"ui.combobox": "lib/combobox/ui.combobox",
		"ui.tabs.overflowResize": "lib/overflowResize/ui.tabs.overflowResize",
		"firepad-userlist": "lib/firepad-userlist/firepad-userlist",
		"emmet": "lib/emmet/emmet",
		"ace/ext-emmet": "lib/emmet/ext-emmet",
		//"ace/autocomplete": "lib/tern/ext-tern",
		//"ace/ext/tern": "lib/tern/ext-tern",
		"dialogResize": "lib/dialogResize/ui.dialog.dialogResize",
		"showPassword": "lib/showPassword/showPassword",
	},
	"shim": {
		"app/main": {
			deps: ["ace/ace"]
		},
		"ace/ext-emmet": {
			deps: ["ace/ace"]
		},
		"ace/mode/css/csslint": {
			deps: ["ace/ace"]
		},
		"ace/ext-split": {
			deps: ["ace/ace"]
		},
		/*
		"ace/ext-tern": {
			deps: ["ace/ace"]
		},
		*/
		"ace/autocomplete": {
			deps: ["ace/ace"/*, "ace/ext/tern"*/]
		},
		"jquery-ui-bundle": {
			exports: "$",
			deps: ["jquery"]
		},
		"jquery.contextMenu": {
			exports: "$",
			deps: ["jquery"]
		},
		"jquery.layout": {
			exports: "$",
			deps: ["jquery-ui-bundle"]
		},
		"jquery.menubar": {
			exports: "$",
			deps: ["jquery-ui-bundle"]
		},
		"ui.combobox": {
			exports: "$",
			deps: ["jquery-ui-bundle"]
		},
		"ui.basicMenu": {
			exports: "$",
			deps: ["jquery-ui-bundle"]
		},
		"ui.tabs.addTab": {
			exports: "$",
			deps: ["jquery-ui-bundle"]
		},
		"ui.tabs.closable": {
			exports: "$",
			deps: ["jquery-ui-bundle"]
		},
		"ui.tabs.overflowResize": {
			exports: "$",
			deps: ["jquery-ui-bundle", "ui.tabs.addTab", "ui.tabs.closable"]
		},
		"dialogResize": {
			exports: "$",
			deps: ["jquery-ui-bundle"]
		},
		"showPassword": {
			exports: "$",
			deps: ["jquery-ui-bundle"]
		},
		"jstree": {
			exports: "$",
			deps: ["jquery"]
		},
		"firepad": {
			deps: ["ace/ace", '@firebase/app', '@firebase/database']
		},
		"firepad-userlist": {
			exports: "FirepadUserList"
		},
		"linkify-html": {
			deps: [
				"linkify"
			]
		},
		"diff2html": {
			deps: [
				"diff"
			]
		},
		"diff2html-ui": {
			deps: [
				"diff2html"
			]
		},
		"uglify-js/lib/compress": {
			exports: "Compressor",
			deps: ["uglify-js/lib/parse", "uglify-js/lib/transform", "uglify-js/lib/scope", "uglify-js/lib/output"]
		},
		"uglify-js/lib/parse": {
			deps: ["uglify-js/lib/utils"]
		},
		"uglify-js/lib/transform": {
			deps: ["uglify-js/lib/ast"]
		},
		"uglify-js/lib/scope": {
			deps: ["uglify-js/lib/ast"]
		},
		"uglify-js/lib/output": {
			deps: ["uglify-js/lib/ast"]
		}
	}
});

// Start loading the main app file
requirejs(["app/main"]);