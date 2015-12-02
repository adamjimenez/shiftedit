/*

Based on jquery ui demo

Modified by Adam Jimenez to handle programmatic selection
*/

  (function( $ ) {
    $.widget( "custom.autocompleteIcon", $.ui.autocomplete, {
        _renderItem: function( ul, item ) {
            var icon = $(item.option).data('icon');
            if(icon) {
                icon = '<i class="' + icon + '"></i>';
            } else {
            	icon = '';
            }

        	return $( "<li>" )
        			.append( $( "<div>" ).html( item.label + icon  ) )
        			.appendTo( ul );
        }
    } );

    $.widget( "custom.combobox", {
      _create: function() {
        this.wrapper = $( "<span>" )
          .addClass( "custom-combobox" )
          .insertAfter( this.element );

        this.element.hide();
        this._createAutocomplete();
        this._createShowAllButton();
      },

      _createAutocomplete: function() {
        var selected = this.element.children( ":selected" ),
          value = selected.val() ? selected.text() : "";

        this.input = $( "<input>" )
          .appendTo( this.wrapper )
          .val( value )
          .attr( "title", "" )
          .addClass( "custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left" )
          .autocompleteIcon({
            delay: 0,
            minLength: 0,
            source: $.proxy( this, "_source" )
          })
          .tooltip({
            tooltipClass: "ui-state-highlight"
          });

        this._on( this.input, {
          autocompleteiconselect: function( event, ui ) {
            ui.item.option.selected = true;
            this._trigger( "select", event, {
              item: ui.item.option
            });
          },

          autocompleteiconchange: "_removeIfInvalid"
        });

        //adam jimenez
        var me = this;
        var input = this.input;
        this.element.on('change', function(){
            var selected = $(this).children( ":selected" ),
            value = selected.val() ? selected.text() : "";
            input.focus().val(value).blur();
        });
      },

      //adam jimenez
      val: function(value){
        if(typeof value === 'string'){
            var option = this.element.children( "[value="+value+"]" );

            if (option.length) {
                return this.input.val(option.text());
            } else {
                return this.input.val(value);
            }
        }else{
            var selected = this.element.children( ":selected" );
            var val = selected.val() ? selected.val() : selected.text();
            if(!val) {
                val = this.input.val();
            }
            return val;
        }
      },

      _createShowAllButton: function() {
        var input = this.input,
          wasOpen = false;

        $( "<a>" )
          .attr( "tabIndex", -1 )
          //.attr( "title", "Show All Items" )
          .tooltip()
          .appendTo( this.wrapper )
          .button({
            icons: {
              primary: "ui-icon-triangle-1-s"
            },
            text: false
          })
          .removeClass( "ui-corner-all" )
          .addClass( "custom-combobox-toggle ui-corner-right" )
          .mousedown(function() {
            wasOpen = input.autocompleteIcon( "widget" ).is( ":visible" );
          })
          .click(function() {
            input.focus();

            // Close if already visible
            if ( wasOpen ) {
              return;
            }

            // Pass empty string as value to search for, displaying all results
            input.autocompleteIcon( "search", "" );
          });
      },

      _source: function( request, response ) {
        var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
        response( this.element.children( "option" ).map(function() {
          var text = $( this ).text();
          if ( this.value && ( !request.term || matcher.test(text) ) )
            return {
              label: text,
              value: text,
              option: this
            };
        }) );
      },

      _removeIfInvalid: function( event, ui ) {

        // Selected an item, nothing to do
        if ( ui.item ) {
          return;
        }

        if(!this.options.forceSelection){
            var val = this.input.val();
            this._trigger( "change", event, {
              item: {
                  label: val,
                  value: val
              }
            });
            return;
        }

        // Search for a match (case-insensitive)
        var option;
        var value = this.input.val(),
          valueLowerCase = value.toLowerCase(),
          valid = false;
        this.element.children( "option" ).each(function() {
          if ( $( this ).text().toLowerCase() === valueLowerCase ) {
              option = $( this );
            this.selected = valid = true;
            return false;
          }
        });

        // Found a match, nothing to do
        if ( valid ) {
            this._trigger( "change", event, {
              item: {
                  label: option.text(),
                  value: option.val()
              }
            });

          return;
        }

        // Remove invalid value
        this.input
          .val( "" )
          .attr( "title", value + " didn't match any item" )
          .tooltip( "open" );
        this.element.val( "" );
        this._delay(function() {
          this.input.tooltip( "close" ).attr( "title", "" );
        }, 2500 );
        this.input.autocomplete( "instance" ).term = "";
      },

      _destroy: function() {
        this.wrapper.remove();
        this.element.show();
      }
    });
  })( jQuery );
