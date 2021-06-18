requirejs.config({
    map: {
        "*": {
            "firebase/app": "@firebase/app",
            "firebase/database": "@firebase/database",
        }
    },
	paths: {
		"@firebase/app": "node_modules/firebase/firebase-app",
		"@firebase/database": "node_modules/firebase/firebase-database",
		"@firebase/auth": "node_modules/firebase/firebase-auth",
		
		"jstree": "node_modules/jstree/dist/jstree",
		"jquery": "node_modules/jquery/dist/jquery",
		"xterm": "node_modules/xterm/lib/xterm",
		"xterm-addon-fit": "node_modules/xterm-addon-fit/lib/xterm-addon-fit",
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
		"jquery-ui-bundle": "node_modules/jquery-ui-bundle/jquery-ui",
		"jquery.layout": "node_modules/layout-jquery3/dist/jquery.layout_and_plugins",
		"linkify": "node_modules/linkifyjs/dist/linkify.amd",
		"linkify-html": "node_modules/linkifyjs/dist/linkify-html.amd",
		"firepad": "node_modules/firepad/dist/firepad",
		"ui.tabs.stretchyTabs": "node_modules/stretchy-tabs/ui.tabs.stretchyTabs",
		
		// these ones below should be moved to node_modules
		"diff2html": "lib/diff2html/diff2html",
		"diff2html-ui": "lib/diff2html/diff2html-ui",
		
		"aes": "lib/crypto/aes",
		"cssmin": "lib/cssmin/cssmin",
		"virtualKeyboardDetector": "lib/virtualKeyboardDetector/virtualKeyboardDetector",
		"jstreetable": "lib/jstreetable/jstreetable",
		"jquery.menubar": "lib/menubar/jquery.menubar",
		"ui.basicMenu": "lib/basicMenu/ui.basicMenu",
		"ui.tabs.addTab": "lib/addTab/ui.tabs.addTab",
		"ui.tabs.closable": "lib/closable/ui.tabs.closable",
		"ui.combobox": "lib/combobox/ui.combobox",
		"firepad-userlist": "lib/firepad-userlist/firepad-userlist",
		"emmet": "lib/emmet/emmet",
		"ace/ext-emmet": "lib/emmet/ext-emmet",
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
		"ace/autocomplete": {
			deps: ["ace/ace"]
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
		"ui.tabs.stretchyTabs": {
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