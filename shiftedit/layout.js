define(['exports', "jquery.layout", "app/menubar"], function (exports) {
var menubar = require("app/menubar");
var myLayout;

function init() {
    console.log('layout');

    menubar.init();

    //page layout
    myLayout = $('body').layout({
        resizable: true,
    	west__size:			300,
    	west__minSize:			300,
    	east__size:			300,
    	south__size:		300,
    	south__initClosed:	true,
    	north: {
            enableCursorHotkey: false,
            closable: false,
            resizable: false,
            spacing_open: 0,
            spacing_closed: 0
        },
        stateManagement__enabled:	true
    	// RESIZE Accordion widget when panes resize
    	//west__onresize:		$.layout.callbacks.resizePaneAccordions
    	//east__onresize:		$.layout.callbacks.resizePaneAccordions
    });

    myLayout.allowOverflow("north");

    // if a new theme is applied, it could change the height of some content,
    // so call resizeAll to 'correct' any header/footer heights affected
    // NOTE: this is only necessary because we are changing CSS *AFTER LOADING* using themeSwitcher
    //setTimeout( myLayout.resizeAll, 1000 ); /* allow time for browser to re-render with new theme */

    //send resize events to window
    $('.ui-layout-pane').on('layoutpaneonresize', function() { $(window).trigger('resize'); });
}

exports.init = init;
exports.get =  function() {
    return myLayout;
};

});