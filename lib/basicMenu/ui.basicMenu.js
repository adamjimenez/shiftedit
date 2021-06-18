/*
Turn an unordered list into a basic menu
Adds a keynav and jquery ui styling
*/

(function( $ ) {
	$.widget( "custom.basicMenu", {
		_create: function() {
			$( this.element )
			.addClass( "custom-basicMenu" );
			
			var self = this;
			
			$( this.element ).on('click', 'a', function(event) {
				if ($(event.target).is('input')) {
					return true;
				}
				
				var item = $(this).parent();
				self.select(item);
				self._trigger( "click", event, {
					item: item
				});
				
				return false;
			});
			
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
				var item = $(this).find('.ui-state-active');
				var size = Math.floor($(this).height()/item.height());
				
				switch(e.keyCode){
					case 38: //up
						self.select(item.prev());
						return false;
					case 40: //down
						self.select(item.next());
						return false;
					case 33: //page up
						next = item.prevAll( ":eq("+size+")");
		
						if(!next.length) {
							next = item.prevAll().last();
						}
		
						self.select(next);
						return false;
					case 34: //page down
						next = item.nextAll( ":eq("+size+")");
		
						if(!next.length) {
							next = item.nextAll().last();
						}
		
						self.select(next);
						return false;
					case 35: //end
						self.select(item.nextAll().last());
						return false;
					case 36: //home
						self.select(item.prevAll().last());
						return false;
					case 13: //enter
						self._trigger( "enter", e, {
							item: item
						});
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
		},
		
		// select
		select: function (item) {
			if (!item.length) {
				return;
			}
			
			item.parent().children().removeClass('ui-state-active');
			item.addClass('ui-state-active');
			
			var container = $( this.element );
			
			// scroll
			var newScroll;
			var height = container.height();
			var pos = item.offset().top - container.offset().top;
			
			if (pos<0) {
				newScroll = container.scrollTop()+pos;
			} else if((pos+item.height())>height) {
				newScroll = container.scrollTop()+(pos-height) + (item.height()*1.5);
			}
			
			if (newScroll>=0) {
				container.animate({
					scrollTop: newScroll
				}, 10);
			}
			
			this._trigger( "select", null, {
				item: item
			});
		}
	});
})( jQuery );