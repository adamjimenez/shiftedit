define(['exports', "./menubar", './status_bar', './prefs', "jquery.layout"], function (exports, menubar, status_bar, preferences) {
var myLayout;

function init() {
	prefs = preferences.get_prefs();
	
	console.log('layout');

	$('<div id="main-container" class="vbox">\
	<div id="layout-container" class="flex">\
		<div class="ui-layout-north ui-widget-content" style="display: none;">\
			<ul id="menubar" class="menubar"></ul>\
		</div>\
		\
		<div class="ui-layout-south ui-widget-content" style="display: none;"></div>\
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
				<li class="definitions"><a href="#tabs-definitions" title="Definitions"><i class="fa fa-code"></i></a></li>\
				<li class="notes"><a href="#tabs-notes" title="Notes"><i class="fas fa-pencil-alt"></i></a></li>\
				<li class="snippets"><a href="#tabs-snippets" title="Snippets"><i class="fa fa-cut"></i></a></li>\
				<li class="git"><a href="#tabs-git" title="Git"><i class="fab fa-git"></i></a></li>\
			</ul>\
			<!-- add wrapper that layout will auto-size to fill space -->\
			<div class="ui-layout-content">\
				<div id="tabs-filetree">\
					<div class="vbox">\
						<div class="hbox ui-widget-header panel-buttons">\
							<div id="sitebar" class="flex ui-widget-content ui-state-default">\
								<select id="sites">\
								</select>\
							</div>\
							<button id="refresh_site"><i class="fas fa-sync"></i></button>\
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
					<textarea id="notes" class="ui-widget ui-state-default ui-corner-all" placeholder="Put your development notes in here.."></textarea>\
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
		</div>\
	</div>\
	</div>').appendTo($('body'));

	menubar.init();
	status_bar.init();

	//page layout
	myLayout = $('#layout-container').layout({
		resizable: true,
		//showOverflowOnHover: true,
		west__size: 300,
		west__minSize: 200,
		north: {
			closable: false,
			resizable: false,
			spacing_open: 0,
			spacing_closed: 0,
			minSize: 36,
			size: 36,
			maxSize: 36
		},
		east: {
			//closable: false,
			//resizable: false,
			spacing_open: 10,
			spacing_closed: 10,
			//minSize: 36,
			size: 300,
			initClosed: true
		},
		south: {
			closable: false,
			resizable: false,
			spacing_open: 0,
			spacing_closed: 0,
			minSize: 36,
			size: 36,
			maxSize: 36,
			initHidden: !prefs.statusBar
		},
		west: {
			//closable: false,
			//resizable: false,
			spacing_open: 10,
			spacing_closed: 10,
			size: 300,
			minSize: 200
		},
		livePaneResizing: true,
		enableCursorHotkey: false,
		stateManagement__enabled: true,
		slideTrigger_close: 'click',
		noAlert: true
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
	$('body').on('mouseup', function(e) {
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
	var timer;
	$('.ui-layout-pane').on('layoutpaneonresize', function() { 
		$(window).trigger('resize');
		
		var needResize = false;
		if ($(window).width() < 768) {
			if ($('.ui-layout-resizer-east').is(':visible')) {
				$('.ui-layout-resizer-east').show();
				myLayout.hide("east");
				myLayout.state.isClosed = true;
				needResize = true;
			}
		} else {
			if (!$('.ui-layout-resizer-east').is(':visible')) {
				$('.ui-layout-resizer-east').show();
				myLayout.show("east");
				myLayout.state.isClosed = false;
				myLayout.sizePane('east', 200);
				needResize = true;
			}
		}
		
		if (needResize) {
			clearTimeout(timer);
			timer = setTimeout( function() {
				myLayout.resizeAll();
			}, 1000);
		}
	});
	
	// expand panes when tab is dragged over
	$('.ui-layout-resizer').droppable({
		over: function( e, ui ) {
			// get nearest panel
			var paneName = this.className.match('ui-layout-resizer-([a-z]*)')[1];
	
			// expand panel
			myLayout.open(paneName);
			
			// refresh target dropzones
			if ($( ".ui-layout-"+paneName+" .ui-tabs-nav" ).hasClass('ui-sortable')) {
				$( ".ui-layout-"+paneName+" .ui-tabs-nav" ).sortable( "refresh" );
			}
		}
	});
}

exports.init = init;
exports.get =  function() {
	return myLayout;
};

});