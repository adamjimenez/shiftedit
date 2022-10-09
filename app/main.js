define(['exports',"./lang","./prefs","./tabs","./layout","./drop",'./restore','./recent','./repositories','./editors','./virtual_keyboard', './tree', './site', './hash','./definitions','./find', './exit', './notes', './snippets', './resize','./splash', './prompt', './git', './notifications', './syntax_errors', "jquery-ui-bundle"], function (exports, lang, preferences, tabs, layout, drop, restore, recent, repositories, editors, virtual_keyboard, tree, site, hash, definitions, find, exit, notes, snippets, resize, splash, prompt, git, notifications, syntax_errors) {
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
		hash.init();
		site.init();

		splash.update('loading sites..');
		site.load({
			callback: function() {
				var hashVal = window.location.hash.substr(1);
				
				var openDefaultTab = function () {
					$( ".ui-layout-east, .ui-layout-center" ).each(function( index ) {
						if (!$( this ).children('.ui-tabs-nav').children(':not(.button)').length) {
							console.log('open default tab');
							$( this ).tabs('add');
						}
					});
				}
				
				var loadHash = function() {
					//console.log('load hash ' + hashVal);
					
					if (hashVal) {
						hash.set(hashVal);
					} else {
						openDefaultTab();
					}
				}
				
				if(prefs.restoreTabs) {
					restore.restoreBatch(preferences.getOpeningFilesBatch(), loadHash);
				} else {
					loadHash();
				}
			}
		});

		recent.load();
		repositories.load();
		find.init();
		notes.init();
		snippets.init();
		git.init();
		resize.init();
		syntax_errors.init();
		virtual_keyboard.init();

		splash.close();
	});

	exports.getVersion = function() {
		return version;
	};
});