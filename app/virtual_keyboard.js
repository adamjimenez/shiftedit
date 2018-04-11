define(["./util", './tabs', './resize', './ssh', 'virtualKeyboardDetector'], function (util, tabs, resize, ssh) {

var keyboard;

var editorKeys = [{
	label: '<',
	action: function(editor) {
		editor.insert('<');
		editor.commands.exec('startAutocomplete', editor);
	}
}, {
	label: '>'
}, {
	label: '('
}, {
	label: ')'
}, {
	label: 'HOME',
	command: 'gotolinestart'
}, {
	label: '<i class="fas fa-arrow-up"></i>',
	command: 'golineup'
}, {
	label: 'END',
	command: 'gotolineend'
}, {
	label: 'PGUP',
	command: 'gotopageup'
}, {
	label: '{'
}, {
	label: '}'
}, {
	label: ';'
}, {
	label: 'TAB',
	command: 'indent'
}, {
	label: '<i class="fas fa-arrow-left"></i>',
	command: 'gotoleft'
}, {
	label: '<i class="fas fa-arrow-down"></i>',
	command: 'golinedown'
}, {
	label: '<i class="fas fa-arrow-right"></i>',
	command: 'gotoright'
}, {
	label: 'PGDN',
	command: 'gotopagedown'
}];

var termKeys = [{
	label: 'ESC',
	key: 27
}, {
	label: '/'
}, {
	label: '|'
}, {
	label: '-'
}, {
	label: 'HOME',
	key: 36
}, {
	label: '<i class="fas fa-arrow-up"></i>',
	key: 38
}, {
	label: 'END',
	key: 35
}, {
	label: 'PGUP',
	key: 33
}, {
	label: 'TAB',
	key: 9
}, {
	label: 'CTRL',
	action: function(session, el) {
		session.ctrlKey = !session.ctrlKey;
		$(el).toggleClass('active');
	}
}, {
	label: 'ALT',
	action: function(session, el) {
		session.altKey = !session.altKey;
		$(el).toggleClass('active');
	}
}, {
	label: '&nbsp;',
	key: 0
}, {
	label: '<i class="fas fa-arrow-left"></i>',
	key: 37
}, {
	label: '<i class="fas fa-arrow-down"></i>',
	key: 40
}, {
	label: '<i class="fas fa-arrow-right"></i>',
	key: 39
}, {
	label: 'PGDN',
	key: 34
}];

function showKeyboard(tab) {
	var keys;
	
	if (tab.data('file') && tab.data('view')==='code') {
		keys = editorKeys;
	} else if (tab.data('ssh')) {
		keys = termKeys;
	}
	
	if (keys) {
		keys.forEach(function(item) {
			$('<li><div>'+item.label+'</div></li>').appendTo($('.virtual_keyboard ul')).on('click touchstart', function(e) {
				if (tab.data('file')) {
					var editor = tabs.getEditor(tab);
					editor.focus();
					
					if (item.action) {
						item.action(editor);
					} else if (item.command) {
						editor.commands.exec(item.command, editor);
					} else {
						editor.insert(item.label);
					}
				} else if (tab.data('ssh')) {
					var session = tab.data('session');
					session.focus();
					
					if (item.key) {
						var event = jQuery.Event("keydown", { keyCode: item.key });
						session.term._keyDown(event);
					} else if (item.action) {
						item.action(session, this);
					} else {
						session.insert(item.label);
					}
				}
			});
		});
		
		keyboard.show();
	}
}

function hideKeyboard() {
	$('.virtual_keyboard ul li').remove();
	keyboard.hide();
}

function init() {
	keyboard = $('<div class="virtual_keyboard"><ul></ul></div>').disableSelection().appendTo('#main-container').hide();
	
	// prevent longpress
	keyboard.on('touchstart touchend', function(e) {
		e.preventDefault();
		e.stopPropagation();
	});
	
	var activeTab;
	/*
	$(document).on("focusEditor", function(e, tab) {
		activeTab = tab;
		editor = tabs.getEditor(tab);
	});
	*/
	
	$(window).on( "tabsadd tabsactivate", function(e, ui) {
		var tab = ui.newTab ? ui.newTab : ui.tab;
		activeTab = $(tab);
	});
	
	virtualKeyboardDetector.init( { recentlyFocusedTimeoutDuration: 3000 } );
	
	virtualKeyboardDetector.on( 'virtualKeyboardVisible', function() {
		if (activeTab) {
			showKeyboard(activeTab);
		}
	} );
	
	virtualKeyboardDetector.on( 'virtualKeyboardHidden', function() {
		hideKeyboard();
	} );
}

return {
	init: init
};

});