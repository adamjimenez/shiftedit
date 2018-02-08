define(['exports',"./lang","./prefs","./tabs","./layout","./drop",'./restore','./recent','./repositories','./editors', './tree', './site', './shortcuts','./hash','./definitions','./find', './exit', './notes', './snippets', './resize','./splash', './appcache', './prompt', './git', './servers', './notifications', "jquery-ui-bundle"], function (exports, lang, preferences, tabs, layout, drop, restore, recent, repositories, editors, tree, site, shortcuts, hash, definitions, find, exit, notes, snippets, resize, splash, appcache, prompt, git, servers, notifications) {
	var version = window.shifteditVersion ? window.shifteditVersion : 'dev';
	var locale = lang;
	
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
		layout.init();
	})
	.done(function (data) {
		var prefs = preferences.get_prefs();
		
		// yay!
		tabs.init();
		editors.init();
		tree.init();
		tree.setSingleClickOpen(prefs.singleClickOpen);
		site.init();

		splash.update('loading sites..');
		site.load({
			callback: function() {
				var hash = window.location.hash;
				if(prefs.restoreTabs) {
					restore.restoreBatch(preferences.getOpeningFilesBatch(), function() {
						$( ".ui-layout-east, .ui-layout-center, .ui-layout-south" ).each(function( index ) {
							if (!$( this ).children('.ui-tabs-nav').children(':not(.button)').length) {
								$( this ).tabs('add');
							}
						});
					});
				}
				console.log('load hash');
				if (hash) {
					window.location.hash = hash;
				}
			}
		});

		recent.load();
		repositories.load();
		shortcuts.load();
		find.init();
		notes.init();
		snippets.init();
		git.init();
		resize.init();

		splash.close();
	});

	exports.getVersion = function() {
		return version;
	};
});