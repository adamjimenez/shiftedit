/*

Based on jquery ui demo

Modified by Adam Jimenez to handle programmatic selection
*/
(function($) {
	$.widget("custom.autocomplete", $.ui.autocomplete, {
		_renderItem: function(ul, item) {
			var icon = $(item.option).data('icon');
			if (icon) {
				icon = '<i class="' + icon + '"></i>';
			} else {
				icon = '';
			}

			return $("<li>")
				.append($("<div>").html(item.label + icon))
				.appendTo(ul);
		}
	});

	$.widget("custom.combobox", {
		_create: function() {
			this.wrapper = $("<span>")
				.addClass("custom-combobox")
				.insertAfter(this.element);

			this.element.hide();
			this._createAutocomplete();
			this._createShowAllButton();
			this.value = '';
		},

		_createAutocomplete: function() {
			var selected = this.element.children(":selected"),
				value = selected.val() ? selected.text() : "";
			var options = this.options;
			var source = this.options.source ? this.options.source : $.proxy(this, "_source");

			this.input = $("<input>")
				.appendTo(this.wrapper)
				.val(value)
				.attr("title", "")
				.addClass("custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left")
				.autocomplete({
					delay: 0,
					minLength: 0,
					source: source,
					autoFocus: true
				})
				.tooltip({
					classes: {
						"ui-tooltip": "ui-state-highlight"
					}
				});
				
			if (options.editable===false) {
				this.input.prop('readonly', 'readonly');
			}

			this._on(this.input, {
				autocompleteselect: function(event, ui) {
					if (this.element.is( "input" )) {
						this.element.val(ui.item.id);
					} else if (ui.item.option) {
						ui.item.option.selected = true;
						this._trigger("select", event, {
							item: ui.item.option
						});
					}
				},
				autocompletechange: "_removeIfInvalid",
				autocompletesearch: function(e, ui) {
					// fix memory leak, see https://bugs.jqueryui.com/ticket/10050#comment:6
					$(this.input).data('customAutocomplete').menu.bindings = $();
				}
			});

			//adam jimenez - forceSelection option
			var self = this;
			var input = this.input;
			this.element.on('change', function() {
				if (self.options.forceSelection) {
					var selected = $(this).children(":selected");
					self.value = selected.val() ? selected.text() : "";
					input.focus().val(self.value).blur();
				}
			});

			input.on('focus', function() {
				if (options.selectOnFocus) {
					this.select();
				}
			});

			input.on('change', function() {
				self.element.change();
			});

			input.on('keyup', function(e) {
				if (e.keyCode == 27) { //escape
					this.value = self.value;
					this.select();
				}
			});
		},

		//adam jimenez
		val: function(value) {
			if (typeof value === 'string') {
				var option;
				if (value) {
					option = this.element.children('[value="' + value + '"]');
				}

				if (option && option.length) {
					this.value = option.text();
					return this.input.val(option.text());
				} else {
					return this.input.val(value);
				}
			} else {
				var selected = this.element.children(":selected");
				var val = selected.val() ? selected.val() : selected.text();
				if (selected.text() != this.input.val()) {
					val = this.input.val();
				}
				return val;
			}
		},

		_createShowAllButton: function() {
			var input = this.input,
				wasOpen = false;

			$("<a>")
				.attr("tabIndex", -1)
				//.attr( "title", "Show All Items" )
				.tooltip()
				.appendTo(this.wrapper)
				.button({
					icons: {
						primary: "ui-icon-triangle-1-s"
					},
					text: false
				})
				.removeClass("ui-corner-all")
				.addClass("custom-combobox-toggle ui-corner-right")
				.on("mousedown", function() {
					wasOpen = input.autocomplete("widget").is(":visible");
				})
				.on("click", function() {
					input.trigger("focus");

					// Close if already visible
					if (wasOpen) {
						return;
					}

					// Pass empty string as value to search for, displaying all results
					input.autocomplete("search", "");
				});
		},

		_source: function(request, response) {
			var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
			response(this.element.children("option").map(function() {
				var text = $(this).text();
				if (this.value && (!request.term || matcher.test(text)))
					return {
						label: text,
						value: text,
						option: this
					};
			}));
		},

		_removeIfInvalid: function(event, ui) {

			// Selected an item, nothing to do
			if (ui.item) {
				return;
			}

			if (!this.options.forceSelection) {
				this.value = this.input.val();
				this._trigger("change", event, {
					item: {
						label: this.value,
						value: this.value
					}
				});
				return;
			}

			// Search for a match (case-insensitive)
			var option;
			var value = this.input.val(),
				valueLowerCase = value.toLowerCase(),
				valid = false;
			this.element.children("option").each(function() {
				if ($(this).text().toLowerCase() === valueLowerCase) {
					option = $(this);
					this.selected = valid = true;
					return false;
				}
			});

			// Found a match, nothing to do
			if (valid) {
				this._trigger("change", event, {
					item: {
						label: option.text(),
						value: option.val()
					}
				});

				return;
			}

			// Remove invalid value
			this.input
				.val("")
				.attr("title", value + " didn't match any item")
				.tooltip("open");
			this.element.val("");
			this._delay(function() {
				this.input.tooltip("close").attr("title", "");
			}, 2500);
			if (this.input.autocomplete("instance")) {
				this.input.autocomplete("instance").term = "";
			}
		},

		_destroy: function() {
			this.wrapper.remove();
			this.element.show();
		}
	});
})(jQuery);