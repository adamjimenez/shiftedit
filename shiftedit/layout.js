define(['exports', "jquery.layout", "app/menubar"], function (exports) {
var menubar = require("app/menubar");
var myLayout;

function init() {
	console.log('layout');

	$('<div class="ui-layout-north ui-widget-content" style="display: none;">\
		<ul id="menubar" class="menubar"></ul>\
	</div>\
	\
	<div class="ui-layout-south ui-widget-content" style="display: none;">\
		<ul></ul>\
		<!-- add wrapper that layout will auto-size to fill space -->\
		<div class="ui-layout-content">\
		</div>\
	</div>\
	\
	<div class="ui-layout-center" style="display: none;">\
		<ul></ul>\
		<!-- add wrapper that layout will auto-size to fill space -->\
		<div class="ui-layout-content">\
		</div>\
	</div>\
	\
	<div class="ui-layout-west" style="display: none;">\
		<ul>\
			<li><a href="#tabs-filetree" title="File tree"><i class="fa fa-folder"></i></a></li>\
			<li><a href="#tabs-find" title="Find"><i class="fa fa-search"></i></a></li>\
			<li><a href="#tabs-definitions" title="Definitions"><i class="fa fa-code"></i></a></li>\
			<li><a href="#tabs-notes" title="Notes"><i class="fa fa-pencil"></i></a></li>\
			<li><a href="#tabs-snippets" title="Snippets"><i class="fa fa-cut"></i></a></li>\
			<li><a href="#tabs-git" title="Git"><i class="fa fa-git"></i></a></li>\
		</ul>\
		<!-- add wrapper that layout will auto-size to fill space -->\
		<div class="ui-layout-content">\
			<div id="tabs-filetree">\
				<div class="vbox">\
					<div id="filetree-buttons" class="hbox">\
						<div id="sitebar" class="flex">\
							<select id="sites">\
							</select>\
						</div>\
						<button id="refresh_site"><i class="fa fa-refresh"></i></button>\
						<button id="siteNenuBtn"><i class="fa fa-bars"></i></button>\
						<ul id="siteMenu"></ul>\
					</div>\
					<div id="tree-container" class="vbox" style="display: none;">\
						<input type="text" name="filter" class="filter ui-widget ui-state-default ui-corner-all" style="display: none;">\
						<div id="tree"></div>\
					</div>\
				</div>\
			</div>\
			\
			<div id="tabs-find"></div>\
			<div id="tabs-definitions"></div>\
			<div id="tabs-notes">\
				<textarea id="notes" class="ui-widget ui-state-default ui-corner-all"></textarea>\
			</div>\
			<div id="tabs-snippets">\
				<div id="snippets"></div>\
			</div>\
			<div id="tabs-git"></div>\
		</div>\
	</div>\
	\
	<div class="ui-layout-east" style="display: none;">\
		<ul></ul>\
		<!-- add wrapper that layout will auto-size to fill space -->\
		<div class="ui-layout-content">\
		</div>\
	</div>').appendTo($('body'));

	menubar.init();

	//page layout
	myLayout = $('body').layout({
		resizable: true,
		//showOverflowOnHover: true,
		west__size: 300,
		west__minSize: 200,
		east__size: 300,
		east__initClosed: true,
		south__size: 300,
		south__initClosed: true,
		livePaneResizing: true,
		north: {
			enableCursorHotkey: false,
			closable: false,
			resizable: false,
			spacing_open: 0,
			spacing_closed: 0,
			minSize: 30,
			size: 30,
			maxSize: 30
		},
		stateManagement__enabled: true,
		slideTrigger_close: 'click'
		//maskContents: true
		// RESIZE Accordion widget when panes resize
		//west__onresize: $.layout.callbacks.resizePaneAccordions
		//east__onresize: $.layout.callbacks.resizePaneAccordions
	});

	// allow contextmenu to overflow
	$('body').on('menufocus focusin', '.ui-layout-pane', function() {
		myLayout.allowOverflow($(this));
	});
	
	// close slide out panes
	$('body').on('mousedown', function(e) {
		console.log('hide');
		if (myLayout.state.west.isSliding) {
			if ($(e.target).closest('.ui-layout-west').length===0) {
				console.log(e.target);
				myLayout.slideClose('west');
			}
		}
		if (myLayout.state.east.isSliding) {
			if ($(e.target).closest('.ui-layout-east').length===0) {
				myLayout.slideClose('east');
			}
		}
		if (myLayout.state.south.isSliding) {
			if ($(e.target).closest('.ui-layout-south').length===0) {
				myLayout.slideClose('south');
			}
		}
	});
	
	// unless using tree context menu
	$('body').on('mousedown', '.jstree-contextmenu', function(e) {
		e.stopPropagation();
	});

	// if a new theme is applied, it could change the height of some content,
	// so call resizeAll to 'correct' any header/footer heights affected
	// NOTE: this is only necessary because we are changing CSS *AFTER LOADING* using themeSwitcher
	setTimeout( function() {
		myLayout.resizeAll();

		// some shenanigans to get the resize bars in the right place
		var eastWidth = myLayout.panes.east.outerWidth();
		var westWidth = myLayout.panes.west.outerWidth();

		myLayout.sizePane('east', eastWidth+1);
		myLayout.sizePane('east', eastWidth);
		myLayout.sizePane('west', westWidth+1);
		myLayout.sizePane('west', westWidth);
	}, 1000 ); /* allow time for browser to re-render with new theme */

	//send resize events to window
	$('.ui-layout-pane').on('layoutpaneonresize', function() { $(window).trigger('resize'); });
}

exports.init = init;
exports.get =  function() {
	return myLayout;
};

});