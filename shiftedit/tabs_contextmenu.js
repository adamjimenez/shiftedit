define(function (require) {
var lang = require('./lang').lang;
var makeMenuText = require('./util').makeMenuText;

$.contextMenu({
    selector: '.ui-tabs-nav li',
    callback: function(key, opt){
        var lis = [];

        switch(key) {
            case 'new':
                $(this).closest(".ui-tabs").tabs('add');
            break;
            case 'close':
                lis = $(this);
            break;
            case 'closeOtherTabs':
                lis = $(this).siblings('li:not(.button)');
            break;
            case 'closeAllTabs':
                lis = $(this).parent().children('li:not(.button)');
            break;
            case 'closeTabsRight':
                lis = $(this).nextAll('li:not(.button)');
            break;
            case 'save':
            break;
            case 'saveAs':
            break;
            case 'saveAll':
            break;
            case 'revealInTree':
            break;
            case 'bookmarkAll':
            break;
        }

        if(lis.length){
            $.each( lis, function( index, value ){
                $(this).closest(".ui-tabs").tabs('remove', $(value).index());
            });
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
        "revealInTree": {name: "Reveal in file tree"},
        "bookmarkAll": {name: "Bookmark all files"}
    }
});

return {
};

});