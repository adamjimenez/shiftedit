define(["./util",'./lang','./tabs','./prompt','./site','./tree','./prefs', "jquery-contextmenu"], function (util, lang, tabs, prompt, site, tree, preferences) {
lang = lang.lang;
var makeMenuText = util.makeMenuText;

function init() {
	$.contextMenu({
		selector: '.ui-tabs-nav li.closable',
		beforeOpen: function(event, ui) {
			// appear above layout bars
			ui.menu.zIndex(3);
		},
		callback: function(key, opt){
			var tab = $(this);
			var siteId;

			switch(key) {
				case 'new':
					$(this).closest(".ui-tabs").tabs('add');
				break;
				case 'reload':
					var tabpanel = tab.closest(".ui-tabs");
					tabs.reload(tab);
				break;
				case 'revert':
					var editor = tabs.getEditor(tab);

					if( editor && tab.data('original')!==editor.getValue() ){
						editor.setValue(tab.data('original'));
					} else {
						console.log('file is unchanged');
					}
					
					tabs.setEdited(tab, false);
				break;
				case 'close':
					return tabs.close($(this));
				case 'closeOtherTabs':
					return tabs.closeOther($(this));
				case 'closeAllTabs':
					return tabs.closeAll($(this));
				case 'closeTabsRight':
					return tabs.closeTabsRight($(this));
				case 'save':
					return tabs.save($(this));
				case 'saveAs':
					return tabs.saveAs($(this));
				case 'saveAll':
					return tabs.saveAll($(this));
				case 'revealInTree':
					siteId = tab.data('site');

					function revealFile() {
						return tree.select(tab.data('file'));
					}

					if(site.active()==siteId) {
						return revealFile();
					}else{
						$('#tree').one('refresh.jstree', revealFile);
						return site.open(siteId, null);
					}
				break;
				case 'bookmarkAll':
					var name = '';
					var link = location.protocol+'//'+location.host+location.pathname+'#';

					$('li[role="tab"][data-site][data-file]:not(.button)').each(function() {
						var siteId = $(this).data('site');
						var file = $(this).data('file');
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
			"reload": {name: makeMenuText('Reload', preferences.getKeyBinding('reload'), 'reload'), isHtmlName: true},
			"revert": {name: makeMenuText('Revert to Saved', preferences.getKeyBinding('revertToOriginal'), 'revertToOriginal'), isHtmlName: true},
			"sep2": "---------",
			"close": {name: makeMenuText('Close Tab', 'Alt-W'), isHtmlName: true},
			"closeOtherTabs": {name: "Close other tabs", isHtmlName: true},
			"closeAllTabs": {name: makeMenuText('Close all tabs', 'Ctrl-Shift-W'), isHtmlName: true},
			"closeTabsRight": {name: "Close tabs to the right", isHtmlName: true},
			"sep3": "---------",
			"save": {name: makeMenuText('Save', preferences.getKeyBinding('save'), 'save'), isHtmlName: true},
			"saveAs": {name: makeMenuText('Save as...', preferences.getKeyBinding('saveAs'), 'saveAs'), isHtmlName: true},
			"saveAll": {name: makeMenuText('Save all', 'Ctrl-Shift-S'), isHtmlName: true},
			"sep4": "---------",
			"revealInTree": {name: "Reveal in file tree", isHtmlName: true},
			"bookmarkAll": {name: "Bookmark all files", isHtmlName: true}
		}
	});
}

return {
	init: init
};

});