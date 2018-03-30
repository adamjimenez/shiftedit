/*!
 * Copyright (c) 2018 Adam Jimenez
 *
 * Dual licensed under the MIT (MIT_LICENSE.txt)
 * and GPL (GPL_LICENSE.txt) licenses
 *
 * https://github.com/adamjimenez/dialogResize
 */
 
 // this extension will resize and reposition the dialog to keep it inside the window bounds during window resizing

(function($) {
	$.widget("ui.dialogResize", $.ui.dialog, {
		_create: function() {
			this._super();
			$(window).on("resize orientationchange", $.proxy(this._resize, this));
		},
		_resize: function(e) {
			if (!this.isOpen())
				return;
			
			// resize dialog on window resize
			if (e.target == window) {
				// reduce size if bigger than window
				var w = Math.min(this.origWidth, $( window ).width()-10);
				var h = Math.min(this.origHeight, $( window ).height()-10);
				
				// set size and reposition
				this.option("width", w);
				this.option("height", h);
				this.option("position", this.origPosition);
			} else {
				var parent = this.element.parent();
				
				// update default size if dialog is manually sized
				if (e.target==parent.get(0)) {
					this.origWidth = parent.outerWidth();
					this.origHeight = parent.outerHeight();
				}
			}
		},
		_destroy: function() {
			this._super();
			
			// remove listener if last dialog
			if($(':ui-dialogResize').length===1) {
				$(window).off("resize orientationchange", $.proxy(this._resize, this));
			}
		},
		open: function() {
			this._super();
			this.origPosition = this.option("position");
			this.origWidth = this.element.parent().outerWidth();
			this.origHeight = this.element.parent().outerHeight();
			$(window).trigger("resize");
		}
	});
})(jQuery);