(function($) {
	// the widget definition, where "custom" is the namespace,
	// "colorize" the widget name
	$.widget("custom.showPassword", {
		// default options
		options: {
		},

		// The constructor
		_create: function() {
			this.element.addClass("custom-show-password");
			this.button = $('<button type="button" class="ui-widget-content"><i class="fas fa-eye"></i></button>');
			this.container = this.element.wrap('<div class="custom-show-password-container text ui-widget-content ui-corner-all""></div>').parent();
			this.element.after(this.button);

			// Bind click events on the changer button to the random method
			this._on(this.button, {
				// _on won't call random when widget is disabled
				click: "toggle"
			});
			this._refresh();
		},

		// Called when created, and later when changing options
		_refresh: function() {
		},

		// Events bound via _on are removed automatically
		// revert other modifications here
		_destroy: function() {
			this.button.remove();
			this.element.removeClass("custom-show-password");
			this.element.unwrap();
		},

		// _setOptions is called with a hash of all options that are changing
		// always refresh when changing options
		_setOptions: function() {
			// _super and _superApply handle keeping the right this-context
			this._superApply(arguments);
			this._refresh();
		},

		// _setOption is called for each individual option that is changing
		_setOption: function(key, value) {
			// prevent invalid color values
			if (/red|green|blue/.test(key) && (value < 0 || value > 255)) {
				return;
			}
			this._super(key, value);
		},
		
		toggle: function() {
			var input = this.element;
			if(input.attr('type')==='text') {
				input.attr('type', 'password');
				this.button.html('<i class="fas fa-eye"></i>');
			}else{
				input.attr('type', 'text');
				this.button.html('<i class="fas fa-eye-slash"></i>');
			}
		}
	});
})(jQuery);