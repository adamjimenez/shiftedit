define(["./util",'./lang','./tabs','./prompt','./site','./tree','./prefs', "jquery-contextmenu"], function (util, lang, tabs, prompt, site, tree, preferences) {
lang = lang.lang;
var makeMenuText = util.makeMenuText;

function init() {
	var prefs = preferences.get_prefs();
	
	$.contextMenu({
		selector: '.ui-tabs-nav li.closable',
		callback: function(key, opt){
			var tab = $(this);
			var siteId;

			switch(key) {
				case 'new':
					tab.closest(".ui-tabs").tabs('add');
				break;
				case 'copyPath':
					util.copy(tab.data('title'));
				break;
				case 'reload':
					tabs.reload(tab);
				break;
				case 'revert':
					return tabs.revert(tab);
				case 'close':
					return tabs.close(tab);
				case 'closeOtherTabs':
					return tabs.closeOther(tab);
				case 'closeAllTabs':
					return tabs.closeAll(tab);
				case 'closeTabsRight':
					return tabs.closeTabsRight(tab);
				case 'save':
					return tabs.save(tab);
				case 'saveAs':
					return tabs.saveAs(tab);
				case 'saveAll':
					return tabs.saveAll(tab);
				case 'saveWithMinified':
					return tabs.save(tab, {minify: true});
				case 'download':
					return tabs.download(tab);
				case 'revealInTree':
					return tabs.revealInTree(tab);
				case 'bookmarkAll':
					var name = '';
					var link = location.protocol+'//'+location.host+location.pathname+'#';

					$('li[role="tab"][data-site][data-file]:not(.button)').each(function() {
						var tab = $(this);
						var siteId = tab.data('site');
						var file = tab.data('file');
						var settings = site.getSettings(siteId);

						link += settings.name + '/' + file + '|';
						name += file + ', ';
					});

					link = link.substr(0, (link.length - 1));
					name = name.substr(0, (name.length - 2));

					return prompt.alert({
						title: lang.bookmarkAllFiles,
						msg: 'Drag the link to your bookmarks: <br>\
						<a href="' + link + '">' + name + '</a>'
					});
			}
		},
		items: {
			"new": {name: makeMenuText(lang.newText + '...', 'Alt-N'), isHtmlName: true},
			"sep1": "---------",
			"copyPath": {name: 'Copy path'},
			"sep2": "---------",
			"reload": {name: makeMenuText(lang.reload, preferences.getKeyBinding('reload'), 'reload'), isHtmlName: true, disabled: notFile},
			"revert": {name: makeMenuText(lang.revertToSaved, preferences.getKeyBinding('revertToOriginal'), 'revertToOriginal'), isHtmlName: true, disabled: notFile},
			"sep3": "---------",
			"close": {name: makeMenuText(lang.closeTab, 'Alt-W'), isHtmlName: true},
			"closeOtherTabs": {name: lang.closeOtherTabs, isHtmlName: true},
			"closeAllTabs": {name: makeMenuText(lang.closeAllTabs, 'Ctrl-Shift-W'), isHtmlName: true},
			"closeTabsRight": {name: lang.closeTabsRight, isHtmlName: true},
			"sep4": "---------",
			"save": {name: makeMenuText(lang.saveText, preferences.getKeyBinding('save'), 'save'), isHtmlName: true, disabled: notFile},
			"saveAs": {name: makeMenuText(lang.saveAsText + '...', preferences.getKeyBinding('saveAs'), 'saveAs'), isHtmlName: true, disabled: notFile},
			"saveAll": {name: makeMenuText(lang.saveAllText, 'Ctrl-Shift-S'), isHtmlName: true, disabled: notFile},
			"saveWithMinified": {name: makeMenuText(lang.minify), isHtmlName: true, disabled: notFile, match: 'js|css'},
			"download": {name: makeMenuText(lang.download), isHtmlName: true, disabled: notFile},
			"sep5": "---------",
			"revealInTree": {name: lang.revealInFileTree, isHtmlName: true, disabled: notFile},
			"bookmarkAll": {name: lang.bookmarkAllFiles, isHtmlName: true}
		},
		zIndex: 3
	});
	
	// east tabs toggles
	$.contextMenu({
		selector: '.ui-layout-west .ui-tabs-nav',
		callback: function(key, opt){
			var tab = $(this);

			switch(key) {
				case 'definitions':
					tab.parent().find('.definitions').toggle(!prefs.showDefinitions);
					preferences.save('showDefinitions', !prefs.showDefinitions);
				break;
				case 'notes':
					tab.parent().find('.notes').toggle(!prefs.showNotes);
					preferences.save('showNotes', !prefs.showNotes);
				break;
				case 'snippets':
					tab.parent().find('.snippets').toggle(!prefs.showSnippets);
					preferences.save('showSnippets', !prefs.showSnippets);
				break;
				case 'git':
					tab.parent().find('.git').toggle(!prefs.showGit);
					preferences.save('showGit', !prefs.showGit);
				break;
				case 'hidePanel':
					preferences.save('hidePanel', !prefs.hidePanel);
				break;
			}
			
			// if current tab, default to first tab
			if (!tab.is(':visible')) {
				$(".ui-layout-west").tabs("option", "active", 0);
			}
		},
		items: {
			"file": {
				name: 'Files', 
				disabled: true,
				icon: 'context-menu-icon check'
			},
			"find": {
				name: 'Find', 
				disabled: true,
				icon: 'context-menu-icon check'
			},
			"definitions": {
				name: 'Definitions',
				icon: function(opt, $itemElement, itemKey, item) {
					if (prefs.showDefinitions) {
						return 'context-menu-icon check';
					}
				}
			},
			"notes": {
				name: 'Notes',
				icon: function(opt, $itemElement, itemKey, item) {
					if (prefs.showNotes) {
						return 'context-menu-icon check';
					}
				}
			},
			"snippets": {
				name: 'Snippets',
				icon: function(opt, $itemElement, itemKey, item) {
					if (prefs.showSnippets) {
						return 'context-menu-icon check';
					}
				}
			},
			"git": {
				name: 'Git',
				icon: function(opt, $itemElement, itemKey, item) {
					if (prefs.showGit) {
						return 'context-menu-icon check';
					}
				}
			},
			"hidePanel": {
				name: 'Auto-hide',
				icon: function(opt, $itemElement, itemKey, item) {
					if (prefs.hidePanel) {
						return 'context-menu-icon check';
					}
				}
			},
		},
		zIndex: 3
	});
	
}

function notFile(name, menu) {
	var file = $(this).data('file');
	if (typeof file === 'undefined') {
		return true;
	}
	
	var item = menu.items[name];
	if (item.match) {
		var extension = util.fileExtension(file);
		var r = new RegExp(item.match, "i");
		if (!r.test(extension)){
			return true;
		}
	}
	
	return false;
}

return {
	init: init
};

});