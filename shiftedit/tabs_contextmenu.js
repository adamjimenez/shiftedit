define(["jquery.contextMenu","app/util",'app/lang','app/tabs'], function () {
var lang = require('app/lang').lang;
var makeMenuText = require('app/util').makeMenuText;
var tabs = require('app/tabs');

function init() {
    $.contextMenu({
        selector: '.ui-tabs-nav li:not(.button)',
        callback: function(key, opt){
            switch(key) {
                case 'new':
                    $(this).closest(".ui-tabs").tabs('add');
                break;
                case 'close':
                    return tabs.close($(this));
                case 'closeOtherTabs':
                    lis = $(this).siblings('li:not(.button)');
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
                break;
                case 'bookmarkAll':
                break;
            }
        },
        items: {
            "new": {name: makeMenuText(lang.newText + '...', 'Alt+N')},
            "close": {name: makeMenuText('Close Tab', 'Alt+W')},
            "sep1": "---------",
            "closeOtherTabs": {name: "Close other tabs"},
            "closeAllTabs": {name: makeMenuText('Close all tabs', 'Ctrl+Shift+W')},
            "closeTabsRight": {name: "Close tabs to the right"},
            "save": {name: makeMenuText('Save', 'Ctrl+S')},
            "saveAs": {name: makeMenuText('Save as...', 'Ctrl+Alt+S')},
            "saveAll": {name: makeMenuText('Save all', 'Ctrl+Shift+S')},
            "revealInTree": {name: "Reveal in file tree", disabled: true},
            "bookmarkAll": {name: "Bookmark all files", disabled: true}
        }
    });
}

return {
    init: init
};

});