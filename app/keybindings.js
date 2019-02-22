define([ './prefs', './lang', './config',  './tabs', './find', './site', './tree', './revisions', 'dialogResize'], function (preferences, lang, config, tabs, find, site, tree, revisions) {
lang = lang.lang;
	
var actions = {
	'save': {
		label: 'Save',
		defaultKeyBinding: 'Ctrl-S',
		exec: function() {
			var tab = tabs.active();
			tabs.save(tab);
		}
	},
	'saveAs': {
		label: 'Save As',
		defaultKeyBinding: 'Ctrl-Alt-S'
	},
	'saveWithMinified': {
		label: 'Save With Minified',
		defaultKeyBinding: ''
	},
	'find': {
		label: 'Find Panel',
		defaultKeyBinding: 'Ctrl-F',
		exec: function (key, e) {
			find.toggle();
		}
	},
	'gotoLinePrompt': {
		label: 'Goto Line',
		defaultKeyBinding: 'Ctrl-G'
	},
	'toggleBreakpoint': {
		label: 'Toggle Breakpoint',
		defaultKeyBinding: 'Alt-B'
	},
	'nextBreakpoint': {
		label: 'Next Breakpoint',
		defaultKeyBinding: 'Ctrl-B'
	},
	'prevBreakpoint': {
		label: 'Previous Breakpoint',
		defaultKeyBinding: 'Ctrl-Shift-B'
	},
	'tabNext': {
		label: 'Next Tab',
		defaultKeyBinding: 'Alt-Right'
	},
	'tabPrev': {
		label: 'Previous Tab',
		defaultKeyBinding: 'Alt-Left'
	},
	'applySourceFormatting': {
		label: 'Apply Source Formatting',
		defaultKeyBinding: 'Alt-Shift-F'
	},
	'copyLinesUp': {
		label: 'Copy Lines Up',
		defaultKeyBinding: 'Alt-Shift-Up'
	},
	'copyLinesDown': {
		label: 'Copy Lines Down',
		defaultKeyBinding: 'Alt-Shift-Down'
	},
	'moveLinesUp': {
		label: 'Move Lines Up',
		defaultKeyBinding: 'Alt-Up'
	},
	'moveLinesDown': {
		label: 'Move Lines Down',
		defaultKeyBinding: 'Alt-Down'
	},
	'removeLine': {
		label: 'Remove Line',
		defaultKeyBinding: 'Ctrl-D'
	},
	'reload': {
		label: 'Reload tab',
		defaultKeyBinding: ''
	},
	'fullScreen': {
		label: 'FullScreen',
		defaultKeyBinding: 'Ctrl-Shift-F'
	},
	'collapseSelection': {
		label: lang.collapseSelection,
		defaultKeyBinding: 'Alt-L'
	},
	'expandSelection': {
		label: lang.expandSelection,
		defaultKeyBinding: 'Alt-Shift-L'
	},
	'addSemicolon': {
		label: lang.addSemicolon,
		defaultKeyBinding: ''
	},
	'jumpToMatching': {
		label: lang.jumpToMatching,
		defaultKeyBinding: 'Ctrl-P'
	},
	'selectToMatching': {
		label: lang.selectToMatching,
		defaultKeyBinding: 'Ctrl-Shift-P'
	},
	'preferences': {
		label: lang.preferencesText,
		defaultKeyBinding: 'Ctrl-U',
		exec: function() {
			preferences.open();
		}
	},
	'escape': {
		label: "Clear",
		defaultKeyBinding: 'Escape',
		exec: function (key, e) {
			$('#shortcutsSheet').remove();
			$('#link').remove();
		}
	}, 
	'openNewTab': {
		label: "New tab",
		defaultKeyBinding: 'Alt-N',
		exec: function (key, e) {
			$('.ui-layout-center').tabs('add');
		}
	}, 
	'open': {
		label: "Open",
		defaultKeyBinding: 'Ctrl-O',
		exec: function (key, e) {
			tabs.open();
		}
	}, 
	'chooseSite': {
		label: "Choose Site",
		defaultKeyBinding: 'Ctrl-Shift-O',
		exec: function (key, e) {
			site.focus();
		}
	}, 
	'saveAll': {
		label: "Save All",
		defaultKeyBinding: 'Ctrl-Shift-S',
		exec: function (key, e) {
			tabs.saveAll();
		}
	}, 
	'close': {
		label: "Close",
		defaultKeyBinding: 'Ctrl-Alt-W',
		exec: function (key, e) {
			tabs.close($('.ui-layout-center .ui-tabs-active'));
		}
	}, 
	'closeAll': {
		label: "Close All",
		defaultKeyBinding: 'Ctrl-Shift-W',
		exec: function (key, e) {
			tabs.closeAll();
		}
	},
	'previousTab': {
		label: "Previous Tab",
		defaultKeyBinding: 'Alt-Left',
		exec: function (key, e) {
			tabs.prev();
		}
	}, 
	'nextTab': {
		label: "Next Tab",
		defaultKeyBinding: 'Alt-Right',
		exec: function (key, e) {
			tabs.next();
		}
	}, 
	'shortcuts': {
		label: "Shortcuts",
		defaultKeyBinding: 'Ctrl-/',
		exec: show
	}, 
	'print': {
		label: "Print",
		defaultKeyBinding: '',
		exec: function (key, e) {
			var tab = tabs.active();
			if (tab && tab.attr('data-file')) {
				window.open('/print?s=' + tab.attr('data-site') + '&f=' + tab.attr('data-file'));
			}
		}
	}, 
	'blurEditor': {
		label: "Blur Editor",
		defaultKeyBinding: 'Shift-Escape',
		exec: function (key, e) {
			if (document.activeElement) {
				document.activeElement.blur();
			}
		}
	}, 
	'toggleTree': {
		label: "Toggle Tree",
		defaultKeyBinding: 'Ctrl-\\',
		exec: function (key, e) {
			jQuery.proxy(tabs.fullScreen, tabs.active())(false);
			tree.toggle();
		}
	}, 
	'openRevisions': {
		label: "Open Revisions",
		defaultKeyBinding: 'Ctrl-Alt-Shift-H',
		exec: function (key, e) {
			revisions.open();
		}
	}
};

var reservedKeys = [
	'Esc',
	'`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace',
	'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\',
	'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', '\'', '#',
	'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Space',
	'Shift-`', 'Shift-1', 'Shift-2', 'Shift-3', 'Shift-4', 'Shift-5', 'Shift-6', 'Shift-7', 'Shift-8', 'Shift-9', 'Shift-0', 'Shift--', 'Shift-=',
	'Shift-¬', 'Shift-!', 'Shift-"', 'Shift-£', 'Shift-$', 'Shift-%', 'Shift-^', 'Shift-&', 'Shift-*', 'Shift-(', 'Shift-)', 'Shift-_', 'Shift-+',
	'Shift-Q', 'Shift-W', 'Shift-E', 'Shift-R', 'Shift-T', 'Shift-Y', 'Shift-U', 'Shift-I', 'Shift-O', 'Shift-P', 'Shift-[', 'Shift-]', 'Shift-\\',
	'Shift-{', 'Shift-}', 'Shift-|',
	'Shift-A', 'Shift-S', 'Shift-D', 'Shift-F', 'Shift-G', 'Shift-H', 'Shift-J', 'Shift-K', 'Shift-L', 'Shift-;', 'Shift-\'', 'Shift-#',
	'Shift-:', 'Shift-@', 'Shift-~',
	'Shift-Z', 'Shift-X', 'Shift-C', 'Shift-V', 'Shift-B', 'Shift-N', 'Shift-M', 'Shift-,', 'Shift-.', 'Shift-/',
	'Shift-<', 'Shift->', 'Shift-?',
	'Shift-Space',
	'Enter', 'Tab', 'Insert', 'Delete', 'Home', 'End', 'PageUp', 'PageDown',
	'Up', 'Down', 'Left', 'Right',
	'Shift-Up', 'Shift-Down', 'Shift-Left', 'Shift-Right',
	'Ctrl-Tab', 'Ctrl-X', 'Ctrl-C', 'Ctrl-V', 'Ctrl-T', 'Ctrl-W', 'Ctrl-N', 'Ctrl-PageUp', 'Ctrl-PageDown', // chrome shortcuts
	'Ctrl-Shift-Tab', 'Ctrl-Shift-X', 'Ctrl-Shift-C', 'Ctrl-Shift-V', 'Ctrl-Shift-T', 'Ctrl-Shift-W', 'Ctrl-Shift-N', // chrome shift shortcuts
	'Ctrl-Alt-Delete', 'Ctrl-Esc', 'Ctrl-Shift-Esc', 'Alt-F4', 'Alt-Tab', 'Alt-Shift-Tab', 'Ctrl-Alt-Up', 'Ctrl-Alt-Down', // OS shortcuts
	'Alt-F', 'Alt-E', 'Alt-V', 'Alt-H',
];

function changeBinding() {
	var keyBindingName = $(this).data('name');
	
	$( "body" ).append('<div id="dialog-changeKeyBindings" title="Key Bindings">\
		<p>Press a key from those available</p>\
		<input type="text" id="keyBindingInput">\
		<p>\
			<div class="keyboard">\
				<div class="section-a">\
				<div class="key function space1 esc">\
					Esc\
				</div>\
				\
				<div class="key function">\
					F1\
				</div>\
				<div class="key function">\
					F2\
				</div>\
				<div class="key function">\
					F3\
				</div>\
				\
				<div class="key function space2">\
					F4\
				</div>\
				<div class="key function">\
					F5\
				</div>\
				<div class="key function">\
					F6\
				</div>\
					<div class="key function">\
					F7\
				</div>\
				<div class="key function space2">\
					F8\
				</div>\
				\
				<div class="key function">\
					F9\
				</div>\
				<div class="key function">\
					F10\
				</div>\
					<div class="key function">\
					F11\
				</div>\
				<div class="key function">\
					F12\
				</div>\
					<!--END FUNCTION KEYS -->\
					\
				<div class="key num dual">\
					`\
				</div>\
					\
				<div class="key num dual">\
					1\
				</div>\
				<div class="key num dual">\
					2\
				</div>\
				<div class="key num dual">\
					3\
				</div>\
				<div class="key num dual">\
					4\
				</div>\
				<div class="key num dual">\
					5\
				</div>\
				<div class="key num dual">\
					6\
				</div>\
				<div class="key num dual">\
					7\
				</div>\
				<div class="key num dual">\
					8\
				</div>\
				<div class="key num dual">\
					9\
				</div>\
				<div class="key num dual">\
					0\
				</div>\
				<div class="key num dual">\
					-\
				</div>\
				<div class="key num dual">\
					=\
				</div>\
				<div class="key backspace">\
					Backspace\
				</div>\
				 <!--END NUMBER KEYS -->\
					\
				<div class="key tab">\
					Tab\
				</div>\
				\
				<div class="key letter">\
					Q\
				</div>\
					<div class="key letter">\
					W\
				</div>\
					<div class="key letter">\
					E\
				</div>\
					<div class="key letter">\
					R\
				</div>\
					<div class="key letter">\
					T\
				</div>\
					<div class="key letter">\
					Y\
				</div>\
					<div class="key letter">\
					U\
				</div>\
					<div class="key letter">\
					I\
				</div>\
					<div class="key letter">\
					O\
				</div>\
					<div class="key letter">\
					P\
				</div>\
					<div class="key letter">\
					[\
				</div>\
					<div class="key letter">\
					]\
				</div>\
					<div class="key letter dual slash">\
					\\\
				</div>\
				<div class="key caps disabled">\
					Caps<br>Lock\
				</div>\
				<div class="key letter">\
					A\
				</div>\
					<div class="key letter">\
					S\
				</div>\
					<div class="key letter">\
					D\
				</div>\
					<div class="key letter">\
					F\
				</div>\
					<div class="key letter">\
					G\
				</div>\
					<div class="key letter">\
					H\
				</div>\
					<div class="key letter">\
					J\
				</div>\
					<div class="key letter">\
					K\
				</div>\
					<div class="key letter">\
					L\
				</div>\
					<div class="key letter">\
					;\
				</div>\
					<div class="key letter">\
					\'\
				</div>\
					<div class="key enter">\
					Enter\
				</div>\
					\
				<div class="key shift left">\
					Shift\
				</div>\
				<div class="key letter">\
					Z\
				</div>	\
					<div class="key letter">\
					X\
				</div>\
					<div class="key letter">\
					C\
				</div>\
				<div class="key letter">\
					V\
				</div>\
				<div class="key letter">\
					B\
				</div>\
				<div class="key letter">\
					N\
				</div>\
				<div class="key letter">\
					M\
				</div>\
				<div class="key letter">\
					,\
				</div>\
				<div class="key letter">\
					.\
				</div>\
				<div class="key letter">\
					/\
				</div>\
				<div class="key shift right">\
					Shift\
				</div>\
				<div class="key ctrl">\
					Ctrl\
				</div>\
				<div class="key disabled">\
					&nbsp;\
				</div>\
				<div class="key alt">\
					Alt\
				</div>\
				<div class="key space" style="text-align: center;">\
					Space\
				</div>\
				<div class="key alt">\
					Alt\
				</div>\
				<div class="key disabled" style="width: 90px;">\
					&nbsp;\
				</div>\
				<div class="key ctrl">\
					Ctrl\
				</div>\
				</div><!-- end section-a-->\
				\
				<div class="section-b">\
					<div class="key function small disabled">\
						Prnt Scrn\
					</div>\
					<div class="key function small disabled">\
						Scroll Lock\
					</div>\
					<div class="key function small disabled">\
						Pause Break\
					</div>\
					\
					<dic class="sec-func">\
					<div class="key insert">\
						Insert\
					</div>\
					<div class="key home">\
						Home\
					</div>\
					<div class="key dual page_up">\
						Page Up\
					</div>\
					<div class="key del">\
						Delete\
					</div>\
					<div class="key end">\
						End\
					</div>\
						<div class="key dual page_down">\
						Page Down\
					</div>\
						\
					<div class="arrows">\
					<div class="key hidden">\
						\
					</div>\
					<div class="key arrow">\
						Up\
					</div>\
					<div class="key hidden">\
						\
					</div>\
					<div class="key arrow">\
						Left\
					</div>\
					<div class="key arrow">\
						Down\
					</div>\
						<div class="key arrow">\
						Right\
					</div>\
						</div><!-- end arrows -->\
					</div><!-- end sec-func -->\
					\
				</div><!-- end section-b-->\
				\
			</div>\
		</p>\
	</div>');

	//open dialog
	var dialog = $( "#dialog-changeKeyBindings" ).dialogResize({
		width: 880,
		height: 600,
		modal: true,
		close: function( event, ui ) {
			$( this ).remove();
		}
	});
	
	$('#keyBindingInput').focus();
	$('#keyBindingInput').on('blur', function() {
	    var element = this;
	    setTimeout(function() {
	        element.focus();
	    }, 1);
	});
	$('#keyBindingInput').keydown(checkPressed);
	$('#keyBindingInput').keyup(checkPressed);
	
	var currentKey = '';
	function checkPressed(e) {
		e.preventDefault();
		e.stopPropagation();
		
		var newKeyCombo = '';
		var newKey = '';
		if (e.ctrlKey) {
			newKeyCombo += 'Ctrl-';
		}
		if (e.altKey) {
			newKeyCombo += 'Alt-';
		}
		if (e.shiftKey) {
			newKeyCombo += 'Shift-';
		}
		
		$('.key').removeClass('pressed');
		$('.ctrl').toggleClass('pressed', e.ctrlKey);
		$('.alt').toggleClass('pressed', e.altKey);
		$('.shift').toggleClass('pressed', e.shiftKey);
		
		if (['Control', 'Shift', 'Alt', 'Meta', 'CapsLock'].indexOf(e.key)==-1) {
			e.key = e.key.replace('Arrow', '');
			e.key = e.key.replace('Escape', 'Esc');
			
			newKey = e.key.charAt(0).toUpperCase() + e.key.slice(1);
			newKeyBinding = newKeyCombo + newKey;
			
			// check taken
			if(reservedKeys.indexOf(newKeyBinding)===-1) {
				if (e.type==='keydown') {
					// find key and highlight
					$('.key').each(function() {
						if($(this).text().replace(/\s/g,'') === newKey) {
							$(this).addClass('pressed');
							return false;
						}
					});
				} else {
					setKeyBinding(keyBindingName, newKeyBinding);
				}
			}
			return;
		}
		
		if (newKeyCombo!==currentKey) {
			currentKey = newKeyCombo;
			showAvailableKeys();
		}
	}
	
	function showAvailableKeys() {
		$('.key').addClass('available');
		$('.disabled').removeClass('available');
		
		var taken = reservedKeys;
		taken.forEach(function(item) {
			// find key and deactivate it
			$('.key').each(function() {
				if(currentKey+$(this).text().replace(/\s/g,'') === item.replace(/\s/g,'')) {
					$(this).removeClass('available');
					return false;
				}
			});
		});
	}
	
	$('.ctrl, .shift, .alt').addClass('available');
	showAvailableKeys();
}

function setKeyBinding(keyBindingName, newKeyBinding) {
	console.log(newKeyBinding);
	
	var prefs = preferences.get_prefs();
	
	// unset existing binding
	Object.keys(prefs.customKeyBindings).forEach(function(key, index) {
		if(prefs.customKeyBindings[key]===newKeyBinding) {
			prefs.customKeyBindings[key] = '';
		}
	});
	
	// save pref
	if (!prefs.customKeyBindings) {
		prefs.customKeyBindings = {};
	}

	prefs.customKeyBindings[keyBindingName] = newKeyBinding;
	
	if (prefs.customKeyBindings[keyBindingName]===actions[keyBindingName].defaultKeyBinding) {
		delete prefs.customKeyBindings[keyBindingName];
	}
	
	preferences.save('customKeyBindings', prefs.customKeyBindings);
	
	// close
	$( '#dialog-changeKeyBindings' ).dialogResize( "close" );
	
	// update button
	$( 'button.changeKeyBinding[data-name='+keyBindingName+']').text(newKeyBinding ? newKeyBinding : 'Blank');
}

function openKeyBindings() {
	var keyBindingsHTML = '';
	Object.keys(actions).forEach(function(key, index) {
		var item = actions[key];
		var keyLabel = getKeyBinding(key);
		keyLabel = keyLabel ? keyLabel : 'Blank';
		
		keyBindingsHTML += '<p>\
			<label>\
				' + item.label + '\
			</label><br>\
			<button type="button" class="changeKeyBinding" data-name="' + key + '">' + keyLabel + '\</button>\
			<button type="button" class="clearKeyBinding" data-name="' + key + '">Clear</button>\
			<button type="button" class="resetKeyBinding" data-name="' + key + '">Use default</button>\
		</p>';
	});
	
	$( "body" ).append('<div id="dialog-keyBindings" title="Key Bindings">\
		<div class="prefs">\
			' + keyBindingsHTML + '\
		</prefs>\
	</div>');

	//open dialog
	var dialog = $( "#dialog-keyBindings" ).dialogResize({
		width: 600,
		height: 600,
		modal: true,
		close: function( event, ui ) {
			$( this ).remove();
		},
		buttons: {
			Close: function(){
				$( this ).dialogResize( "close" );
			}
		}
	});
	
	$('.changeKeyBinding').button().click(changeBinding);
	
	$('.clearKeyBinding').button().click(function() {
		setKeyBinding($(this).data('name'), '');
	});
	
	$('.resetKeyBinding').button().click(function() {
		var item = actions[$(this).data('name')];
		setKeyBinding($(this).data('name'), item.defaultKeyBinding);
	});
}

function getKeyBinding(name, os) {
	var prefs = preferences.get_prefs();
	
	var keyBinding;
	if (prefs.customKeyBindings.hasOwnProperty(name) ) {
		keyBinding = prefs.customKeyBindings[name];
	} else if (actions[name]){
		keyBinding = actions[name].defaultKeyBinding;
	}
	
	if (keyBinding && os==='mac') {
		keyBinding = keyBinding.replace('Ctrl', 'Command');
	}
	
	return keyBinding;
}

function updateKeyBindings() {
	shortcuts = {};
	
	Object.keys(actions).forEach(function(key, index) {
		if (actions[key].exec) {
			shortcuts[getKeyBinding(key)] = actions[key];
		}
		
		// console.log('.' + key + ' .shortcut');
		$('.' + key + ' .shortcut').text(getKeyBinding(key));
	});
	
	// snippets
	$.ajax({
		dataType: "json",
		url: config.apiBaseUrl+'snippets?cmd=shortcuts',
		success: function(data) {
			for(var i in data.snippets) {
				if (data.snippets.hasOwnProperty(i)) {
					var item = data.snippets[i];
					
					if(item.shortcut) {
						shortcuts['Ctrl-Shift-'+item.shortcut] = {
							exec: function (key, e) {
								var editor = tabs.getEditor(tabs.active());

								if (editor) {
									if(parseInt(item.wrap)) {
										editor.commands.exec('wrapSelection', editor, [item.snippet1, item.snippet2]);
									} else {
										editor.insert(item.snippet1);
									}
								}
							}
						};
					}
				}
			}
		}
	});
}

function show() {
	if (!document.getElementById('shortcutsSheet')) {
		$.ajax({
			url: '/screens/shortcuts',
			success: function (result) {
				if (!document.getElementById('shortcutsSheet')) {
					var div = document.createElement('div');
					div.id = 'shortcutsSheet';
					div.innerHTML = result;
					document.body.appendChild(div);
				}
			}
		});
	}
}

var shortcuts = {};
function init() {
	function keyDown(e) {
		var keyStr = '';
		var keyCode = (e.charCode) ? e.charCode : e.keyCode;
		
		if (e.ctrlKey) {
			keyStr += 'Ctrl-';
		}
		
		if (e.altKey) {
			keyStr += 'Alt-';
		}
		
		if (e.shiftKey) {
			keyStr += 'Shift-';
		}
		
		if (e.key) {
			var key = e.key.replace("Arrow", "");
			keyStr += key.charAt(0).toUpperCase() + key.substr(1);
		}
		
		if (shortcuts[keyStr]) {
			shortcuts[keyStr].exec();

			if (shortcuts[keyStr].stopEvent !== false) {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}
		}
	}

	$( "body" ).keydown(keyDown);
}

return {
	getKeyBinding: getKeyBinding,
	openKeyBindings: openKeyBindings,
	updateKeyBindings: updateKeyBindings,
	show: show,
	init: init
};

});