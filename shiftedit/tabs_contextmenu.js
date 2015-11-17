define(["jquery.contextMenu","app/util",'app/lang','app/tabs','app/prompt','app/site','app/tree'], function () {
var lang = require('app/lang').lang;
var makeMenuText = require('app/util').makeMenuText;
var tabs = require('app/tabs');
var site = require('app/site');
var prompt = require('app/prompt');
var tree = require('app/tree');

function init() {
    $.contextMenu({
        selector: '.ui-tabs-nav li.closable',
        callback: function(key, opt){
        	var tab = $(this);
        	var siteId;

            switch(key) {
                case 'new':
                    $(this).closest(".ui-tabs").tabs('add');
                break;
                case 'reload':
                	var tabpanel = tab.closest(".ui-tabs");

                	function reloadTab() {
                		console.log('yo')
                    	tabs.open(file, siteId);
                	}

                	tabpanel.one('close', reloadTab);
                	tab.one('closeCancel', function() {
                		tabpanel.off('close', reloadTab);
                	});

                   	var file = tab.data('file');
                   	siteId = tab.data('site');
                    if (file && siteId) {
                    	tabs.close(tab);
                    }
                break;
                case 'close':
                    return tabs.close($(this));
                case 'closeOtherTabs':
                    lis = $(this).siblings('li.closable');
                break;
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
            "new": {name: makeMenuText(lang.newText + '...', 'Alt+N')},
            "reload": {name: makeMenuText('Reload', '')},
            "close": {name: makeMenuText('Close Tab', 'Alt+W')},
            "sep1": "---------",
            "closeOtherTabs": {name: "Close other tabs"},
            "closeAllTabs": {name: makeMenuText('Close all tabs', 'Ctrl+Shift+W')},
            "closeTabsRight": {name: "Close tabs to the right"},
            "save": {name: makeMenuText('Save', 'Ctrl+S')},
            "saveAs": {name: makeMenuText('Save as...', 'Ctrl+Alt+S')},
            "saveAll": {name: makeMenuText('Save all', 'Ctrl+Shift+S')},
            "revealInTree": {name: "Reveal in file tree"},
            "bookmarkAll": {name: "Bookmark all files"}
        }
    });
}

return {
    init: init
};

});