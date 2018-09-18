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
			<div class="hbox container-west expanded">\
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
		animatePaneSizing: true,
		enableCursorHotkey: false,
		fxSpeed: "fast",
		livePaneResizing: true,
		noAlert: true,
		resizable: true,
		stateManagement__enabled: true,
		slideTrigger_close: 'click',
		onresize_start: function() {
			animating = true;
		},
		onresize_end: function() {
			animating = false;
		},
		north: {
			closable: false,
			maxSize: 44,
			minSize: 44,
			resizable: false,
			size: 44,
			spacing_open: 0,
			spacing_closed: 0
		},
		east: {
			initClosed: true,
			size: 300,
			spacing_open: 10,
			spacing_closed: 10,
			//minSize: 36,
		},
		south: {
			closable: false,
			initHidden: !prefs.statusBar,
			maxSize: 36,
			minSize: 36,
			resizable: false,
			size: 36,
			spacing_open: 0,
			spacing_closed: 0
		},
		west: {
			closable: false,
			minSize: 48,
			resizable: true,
			size: prefs.westSize,
			spacing_open: 10,
			spacing_closed: 10
		}
	});

	// allow contextmenu to overflow
	$('body').on('menufocus focusin', '.ui-layout-pane', function() {
		myLayout.allowOverflow($(this));
	});
	
	// close slide out panes
	$('body').on('mouseup', function(e) {
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
	
	$('body').on('mouseenter', '.ui-layout-west', function(e) {
		if (!prefs.hidePanel) {
			return;
		}
		
		if (!westIsOpen()) {
			openWest(false);
		}
	});
	
	// min west panel on center panel click
	$('body').on('mouseup', '.ui-layout-center, .ui-layout-north, .ui-layout-east, .ui-layout-south', function(e) {
		if (!prefs.hidePanel) {
			return;
		}
		
		closeWest();
	});
	
	// min west panel on center panel click
	$('body').on('mouseenter', '.ui-layout-center, .ui-layout-north, .ui-layout-east, .ui-layout-south', function(e) {
		if (!prefs.hidePanel) {
			return;
		}
		
		if (!westFocused && westIsOpen()) {
			closeWest(false);
		}
	});
	
	// close when active tab clicked
	var li = $('.ui-layout-west li');
	li.first().addClass('my_active');
	li.on('mouseup', function(e) {
		if(e.button!==0) {
			return;
		}
		
		if ( $(this).hasClass('my_active') ) {
			if (westIsOpen()) {
				closeWest();
			} else {
				openWest();
			}
			
			e.stopPropagation();
		} else {
			li.removeClass('my_active');
			$(this).addClass('my_active');
		}
	});
	
	// START autohide west panel
	$('body').on('mouseup', '.ui-layout-west', function(e) {
		if (!westIsOpen()) {
			openWest();
		}
	});
	
	/*
	// close when active tab is clicked
	$('.ui-layout-west li a').on('click', function() {
		console.log(currentTab);
		if($(this).closest('li').hasClass('ui-state-active')){
			alert('this tab is already active');
		}
	});
	*/
	// END autohide west panel

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

var animating = false;
var westFocused = true;
var westOpen = true;
function westIsOpen() {
	return westOpen;
}

function openWest(focus=true) {
	if (animating) {
		return;
	}
	if (focus) {
		westFocused = true;
	}
	if (!westIsOpen()) {
		myLayout.sizePane('west', prefs.westSize);
		westOpen = true;
		$('.container-west').addClass('expanded');
	}
}

function closeWest(focus=true) {
	if (animating) {
		return;
	}
	if (focus) {
		westFocused = false;
	}
	if (westIsOpen()) {
		preferences.save('westSize', myLayout.west.state.layoutWidth);
		myLayout.sizePane('west', myLayout.west.state.minSize);
		westOpen = false;
		$('.container-west').removeClass('expanded');
	}
}

exports.init = init;
exports.get =  function() {
	return myLayout;
};
exports.westIsOpen = westIsOpen;
exports.openWest = openWest;
exports.closeWest = closeWest;

});