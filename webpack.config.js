module.exports = {
	entry: {
		main: './app/main.js',
	},
	output: {
		filename: './bundle.js',
	},
	
	/*
    plugins: [
        new webpack.optimize.UglifyJsPlugin({minimize: true})
    ],
    */
	resolve: {
		alias: {
			// these ones below should be moved to node_modules
			"linkify": "../lib/linkify/linkify",
			"linkify-html": "../lib/linkify/linkify-html",
			"aes": "../lib/crypto/aes",
			"diff2html": "../lib/diff2html/diff2html",
			"diff2html-ui": "../lib/diff2html/diff2html-ui",
			"cssmin": "../lib/cssmin/cssmin",
			"coffee-script": "../lib/coffee-script/coffee-script",
			"emmet": "../lib/emmet/emmet",
			"jquery.layout": "../lib/layout/jquery.layout",
			"jstreetable": "../lib/jstreetable/jstreetable",
			"jquery.menubar": "../lib/menubar/jquery.menubar",
			"ui.basicMenu": "../lib/basicMenu/ui.basicMenu",
			"ui.tabs.addTab": "../lib/addTab/ui.tabs.addTab",
			"ui.tabs.closable": "../lib/closable/ui.tabs.closable",
			"ui.combobox": "../lib/combobox/ui.combobox",
			"ui.tabs.overflowResize": "../lib/overflowResize/ui.tabs.overflowResize",
			"firepad-userlist": "../lib/firepad-userlist/firepad-userlist",
			"ace/autocomplete": "../lib/tern/ext-tern",
			"ace/ext-emmet": "../lib/emmet/ext-emmet",
			"ace/ext/tern": "../lib/tern/ext-tern",
			
			"ace/worker/worker_client": "ace-builds/src/worker-css",
			"ace/mode/text": "ace-builds/src/mode-text",
			"ace/mode/text_highlight_rules": "ace-builds/src/mode-text",
			"ace/mode/css_completions": "ace-builds/src/mode-css",
			"ace/split": "ace-builds/src/ext-split",
			"ace/ext-split": "ace-builds/src/ext-split",
			"ace/tern/tern": "../lib/tern/ext-tern",
			"ace/theme/textmate": "ace-builds/src/theme-textmate",
			"ace/lib/dom": "ace-builds",
			"ace/lib/event": "ace-builds",
			"ace/lib/event_emitter": "ace-builds",
			"ace/lib/lang": "ace-builds",
			"ace/lib/oop": "ace-builds",
			"ace/ace": "ace-builds",
			"ace/edit_session": "ace-builds",
			"ace/editor": "ace-builds",
			"ace/range": "ace-builds",
			"ace/search": "ace-builds",
			"ace/token_iterator": "ace-builds",
			"ace/tokenizer": "ace-builds",
			"ace/undomanager": "ace-builds",
			"ace/virtual_renderer": "ace-builds"
		}
	},

	module: {
        //noParse: [
        //    /ace-builds.*/
        //],
		rules: [
			{use: ["imports-loader"]},
			{ test: /\.json$/, use: 'json-loader' },
		],
		loaders: [{ 
			test: /tern|emmet|editors/, 
			loader: 'imports?ace-builds'
		}/*, { 
			test: /\.json$/, 
			loader: "json-loader" 
		}*/]
	}
};