define(['exports',"jquery-ui","app/lang","app/prefs","app/tabs","app/layout","app/drop",'app/restore','app/recent','app/editors','app/shortcuts','app/hash','app/definitions','app/find', 'app/exit', 'app/notes', 'app/snippets', 'app/resize','app/splash', 'app/appcache', 'app/prompt', 'app/git'], function (exports) {
	var version = window.shifteditVersion ? window.shifteditVersion : 'dev';
	var locale = require("app/lang");
	var preferences = require("app/prefs");
	var splash = require("app/splash");
	var prompt = require("app/prompt");
	
	// send cookie by default - needed when running from localhost
	$(document).ajaxSend(function (event, xhr, settings) {
		settings.xhrFields = {
			withCredentials: true
		};
	});

	splash.update('loading strings..');
	locale.load()
	.then(function(data) {
		if(!data.success) {
			console.log("logged out");
			window.onbeforeunload = null;
			prompt.alert({title: 'Error', msg:data.error});
			location.href = '/login';
			throw "logged out";
		}
		
		splash.update('loading preferences..');
		return preferences.load();
	})
	.fail(function () {
		console.error("Cannot load language file");
		location.href='/login';
		throw "logged out";
	})
	.done(function () {
		var layout = require("app/layout");
		layout.init();
	})
	.done(function (data) {
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

		splash.update('loading sites..');
		site.load({
			callback: function() {
				console.log('load hash');
	   			require("app/hash").load();
				if(prefs.restoreTabs) {
					require('app/restore').restoreBatch(preferences.getOpeningFilesBatch(), function() {
						$( ".ui-layout-east, .ui-layout-center, .ui-layout-south" ).each(function( index ) {
							if (!$( this ).children('.ui-tabs-nav').children(':not(.button)').length) {
								$( this ).tabs('add');
							}
						});
					});
				}
			}
		});

		var recent = require("app/recent");
		recent.load();
		var shortcuts = require("app/shortcuts");
		shortcuts.load();
		var definitions = require("app/definitions");
		var find = require("app/find");
		find.init();
		var exit = require("app/exit");
		var notes = require("app/notes").init();
		var snippets = require("app/snippets").init();
		var git = require("app/git").init();
		var resize = require("app/resize");
		resize.init();

		splash.close();
	});

	exports.getVersion = function() {
		return version;
	};
});