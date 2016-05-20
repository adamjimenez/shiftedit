define(['app/tabs','app/find', 'app/prefs', 'app/site', 'app/tree', 'jquery'], function (tabs, find, preferences, site, tree) {
	var shortcuts = [];
	var defaultShortcuts = [{ //escape
		key: 27,
		ctrl: false,
		alt: false,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			$('#shortcutsSheet').remove();
		}
	}, { //close ctrl-alt-n
		key: 78,
		ctrl: false,
		alt: true,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			$('.ui-layout-center').tabs('add');
		}
	}, { //close ctrl-o
		key: 79,
		ctrl: true,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			tabs.open();
		}
	}, { //close ctrl-shift-o
		key: 79,
		ctrl: true,
		shift: true,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			site.focus();
		}
	}, { //saveAll ctrl-shift-s
		key: 83,
		ctrl: true,
		shift: true,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			tabs.saveAll();
		}
	}, { //close ctrl-alt-w
		key: 87,
		ctrl: false,
		alt: true,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			tabs.close($('.ui-layout-center .ui-tabs-active'));
		}
	}, { //close all ctrl-shift-w
		key: 87,
		ctrl: true,
		shift: true,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			tabs.closeAll();
		}
	}, { //find ctrl+f
		key: 70,
		ctrl: true,
		shift: false,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			//var prefs = get_prefs();

			//if (prefs.keyBinding == 'default') {
				find.open();
			//}
		}
	}, /*{ //find ctrl+k
		key: 75,
		ctrl: true,
		shift: false,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			if (tabs.getEditor()) {
				tabs.getEditor().editor.findNext();
			}
		}
	}, { //find ctrl+shift+k
		key: 75,
		ctrl: true,
		shift: true,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			if (tabs.getEditor()) {
				tabs.getEditor().editor.findPrevious();
			}
		}
	},*/ /*{ //run F12
		key: 123,
		ctrl: false,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			tabs.run();
		}
	},*/ { //fullscreen ctrl+shift+f
		key: 70,
		ctrl: true,
		shift: true,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			tabs.getEditor().fullScreen();
		}
	}, { //ctrl+u
		key: 85,
		ctrl: true,
		shift: false,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			preferences.open();
		}
	},
	{ //refresh view shift+F5
		key: 116,
		shift: true,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			//tabs.fireEvent('refresh', tabs.getActiveTab());
		}
	}, { //alt-left
		key: 37,
		alt: true,
		shift: false,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			tabs.prev();
		}
	}, { //alt-right
		key: 39,
		alt: true,
		shift: false,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			tabs.next();
		}
	}, { //shortcuts ctrl /
		key: 191,
		ctrl: true,
		scope: this,
		stopEvent: false,
		fn: show
	}, { //print
		key: 80,
		ctrl: true,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			print.run();
		}
	}, { //alt-f
		key: 70,
		alt: true,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			$('a[href="#file"]').focus().click();
		}
	}, { //alt-e
		key: 69,
		alt: true,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			$('a[href="#edit"]').focus().click();
		}
	}, { //alt-v
		key: 86,
		alt: true,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			$('a[href="#view"]').focus().click();
		}
	}, { //alt-h
		key: 72,
		alt: true,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			$('a[href="#help"]').focus().click();
		}
	}, { //shift-escape
		key: 27,
		shift: true,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			if (document.activeElement) {
				document.activeElement.blur();
			}
		}
	}, { //ctrl-\
		key: 220,
		ctrl: true,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			tree.toggle();
		}
	}];

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

	this.load = function() {
		$.ajax({
			dataType: "json",
			url: '/api/snippets?cmd=shortcuts',
			success: function(data) {
				shortcuts = defaultShortcuts.slice(0);

				for(var i in data.snippets) {
					if (data.snippets.hasOwnProperty(i)) {
						var item = data.snippets[i];
						if(item.shortcut) {
							shortcuts.push({
								key: parseInt(item.shortcut),
								ctrl: true,
								shift: true,
								stopEvent: true,
								fn: function (key, e) {
									var editor = tabs.getEditor(tabs.active());

									if (editor) {
										if(parseInt(item.wrap)) {
											editor.commands.exec('wrapSelection', editor, [item.snippet1, item.snippet2]);
										} else {
											editor.insert(item.snippet1);
										}
									}
								}
							});
						}
					}
				}
			}
		});
	};

	function keyDown(e) {
		if (shortcuts) {
			var keyCode = (e.charCode) ? e.charCode : e.keyCode;

			for (var i in shortcuts) {
				if (shortcuts.hasOwnProperty(i)) {
					if (!shortcuts[i].ctrl) {
						shortcuts[i].ctrl = false;
					}
					if (!shortcuts[i].shift) {
						shortcuts[i].shift = false;
					}
					if (!shortcuts[i].alt) {
						shortcuts[i].alt = false;
					}

					if (
						shortcuts[i].key === keyCode &&
						shortcuts[i].ctrl === e.ctrlKey &&
						shortcuts[i].shift === e.shiftKey &&
						shortcuts[i].alt === e.altKey
					) {
						setTimeout(shortcuts[i].fn(e), 0);

						if (shortcuts[i].stopEvent) {
							e.preventDefault();
							e.stopPropagation();

							//console.log(e)
							return false;
						}
					}
				}
			}
		}
	}

	$( "body" ).keydown(keyDown);

	return {
		show: show,
		load: load
	};
});