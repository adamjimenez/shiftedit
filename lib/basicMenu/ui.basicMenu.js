/*
Turn an unordered list into a basic menu
Adds a keynav and jquery ui styling
*/

(function( $ ) {
	$.widget( "custom.basicMenu", {
		_create: function(options) {
			var defaults = {
				multiselect: false
			};
	
			options = $.extend({}, defaults, options);
			
			
			$( this.element ).addClass( "custom-basicMenu" );
			
			var self = this;
			var current = $(this).first();
			
			// select
			this.select = function (e) {
				var li = $(this).parent();
				
				if (e.shiftKey) {
					li.parent().children().removeClass('ui-state-active');
					$(current).addClass('ui-state-active');
					
					var selectItems = false;
					$( self.element ).children('li').each(function() {
						if(selectItems) {
							$(this).addClass('ui-state-active');
						}
						if (current.is(this) || li.is(this)) {
							if(selectItems) {
								return false;
							}
							selectItems = true;
						}
					});
				} else if (e.ctrlKey) {
				} else {
					current = li;
					li.parent().children().removeClass('ui-state-active');
				}
				
				li.addClass('ui-state-active');
		
				// scroll
				var container = li.parent().parent();
				var scrollPos = container.scrollTop();
				var offset = li.position().top;
				
				// scroll down
				if (offset+li.height() > scrollPos+container.height()) {
					container.scrollTop((offset+li.height()) - container.height());
				}
				
				// scroll up
				if (offset-li.height() < scrollPos) {
					container.scrollTop(offset);
				}
				
				if(e.type==="click" && e.target.nodeName!=='INPUT') {
					self._trigger( "click", e, {
						item: li
					});
				}
				
				self._trigger( "select", event, {
					item: li
				});
			};
			
			$( this.element ).on('click', 'a', this.select);
			
			// hover state
			this.mouseover = function () {
				$(this).addClass('ui-state-hover');
			};
			
			this.mouseout = function () {
				$(this).removeClass('ui-state-hover');
			};
			
			$( this.element ).on('mouseover', 'li', this.mouseover);
			$( this.element ).on('mouseout', 'li', this.mouseout);
			
			$( this.element ).on('DOMNodeInserted', function() {
				$(this).children().addClass('ui-state-default');
			});
			
			// keynav
			this._keydown = function(e) {
				var activeEl = $(this).find('.ui-state-active');
				var size = Math.floor($(this).height()/activeEl.height());
				
				switch(e.keyCode){
					case 38: //up
						activeEl.prev().children('a').click();
						return false;
					case 40: //down
						activeEl.next().children('a').click();
						return false;
					case 33: //page up
						next = activeEl.prevAll( ":eq("+size+")");
		
						if(!next.length) {
							next = activeEl.prevAll().last();
						}
		
						next.children('a').click();
						return false;
					case 34: //page down
						next = activeEl.nextAll( ":eq("+size+")");
		
						if(!next.length) {
							next = activeEl.nextAll().last();
						}
		
						next.children('a').click();
						return false;
					case 35: //end
						activeEl.nextAll().last().children('a').click();
						return false;
					case 36: //home
						activeEl.prevAll().last().children('a').click();
						return false;
				}
			};
			
			$( this.element ).on('keydown', this._keydown);
		},
		
		_destroy: function() {
			$( this.element ).removeClass( "custom-basicMenu" )
			.off('click', 'a', this.select)
			.off('keydown', this._keydown)
			.children().removeClass('ui-state-focus').removeClass('ui-state-default');
		}
	});
})( jQuery );
