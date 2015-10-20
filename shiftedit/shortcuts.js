define(['app/tabs','jquery'], function (tabs) {

	var shortcuts = [{ //close ctrl-alt+n
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
	}, /*{ //save ctrl-s
		key: 83,
		ctrl: true,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			tabs.save();
		}
	},*/ { //saveAll ctrl-shift-s
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
		}/*
	}, { //find ctrl+f
		key: 70,
		ctrl: true,
		shift: false,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			var prefs = get_prefs();

			if (prefs.keyBinding == 'default') {
				find.open();
			}
		}*/
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
	},*/ { //run F12
		key: 123,
		ctrl: false,
		scope: this,
		stopEvent: true,
		fn: function (key, e) {
			tabs.run();
		}
	}, { //fullscreen ctrl+shift+f
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
			preferences.edit();
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

	function keyDown(e) {
		if (shortcuts) {
			var keyCode = (e.charCode) ? e.charCode : e.keyCode;

			for (var i in shortcuts) {
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

	$( "body" ).keydown(keyDown);

    return {
        show: show
    };
});