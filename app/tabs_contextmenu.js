define(["./util",'./lang','./tabs','./prompt','./site','./tree','./prefs', "jquery-contextmenu"], function (util, lang, tabs, prompt, site, tree, preferences) {
lang = lang.lang;
var makeMenuText = util.makeMenuText;

function init() {
	$.contextMenu({
		selector: '.ui-tabs-nav li.closable',
		callback: function(key, opt){
			var tab = $(this);
			var siteId;

			switch(key) {
				case 'new':
					tab.closest(".ui-tabs").tabs('add');
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
						title: 'Bookmark all files',
						msg: 'Drag the link to your bookmarks: <br>\
						<a href="' + link + '">' + name + '</a>'
					});
			}
		},
		items: {
			"new": {name: makeMenuText(lang.newText + '...', 'Alt-N'), isHtmlName: true},
			"sep1": "---------",
			"reload": {name: makeMenuText('Reload', preferences.getKeyBinding('reload'), 'reload'), isHtmlName: true, disabled: notFile},
			"revert": {name: makeMenuText('Revert to Saved', preferences.getKeyBinding('revertToOriginal'), 'revertToOriginal'), isHtmlName: true, disabled: notFile},
			"sep2": "---------",
			"close": {name: makeMenuText('Close Tab', 'Alt-W'), isHtmlName: true},
			"closeOtherTabs": {name: "Close other tabs", isHtmlName: true},
			"closeAllTabs": {name: makeMenuText('Close all tabs', 'Ctrl-Shift-W'), isHtmlName: true},
			"closeTabsRight": {name: "Close tabs to the right", isHtmlName: true},
			"sep3": "---------",
			"save": {name: makeMenuText('Save', preferences.getKeyBinding('save'), 'save'), isHtmlName: true, disabled: notFile},
			"saveAs": {name: makeMenuText('Save as...', preferences.getKeyBinding('saveAs'), 'saveAs'), isHtmlName: true, disabled: notFile},
			"saveAll": {name: makeMenuText('Save all', 'Ctrl-Shift-S'), isHtmlName: true, disabled: notFile},
			"saveWithMinified": {name: makeMenuText('Save with minified'), isHtmlName: true, disabled: notFile, match: 'js|css'},
			"download": {name: makeMenuText('Download'), isHtmlName: true, disabled: notFile},
			"sep4": "---------",
			"revealInTree": {name: "Reveal in file tree", isHtmlName: true, disabled: notFile},
			"bookmarkAll": {name: "Bookmark all files", isHtmlName: true}
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