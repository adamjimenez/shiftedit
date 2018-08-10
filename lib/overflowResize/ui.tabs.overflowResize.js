/*!
 * Copyright (c) 2015 Adam Jimenez
 *
 * Dual licensed under the MIT (MIT_LICENSE.txt)
 * and GPL (GPL_LICENSE.txt) licenses
 *
 * https://github.com/adamjimenez/ui.tabs.overflowResize
 */

(function($) {

//  overridden ui.tabs functions
var uiTabsFuncs = {
	option: $.ui.tabs.prototype.option,
	_ui: $.ui.tabs.prototype._ui,
};

uiTabsFuncs = $.extend(
	uiTabsFuncs,
	{
		add: $.ui.tabs.prototype.add,
		remove: $.ui.tabs.prototype.remove
	}
);

$.extend($.ui.tabs.prototype, {
	overflowResize: function(options) {
		var self = this, initialized = false, resizeTimer = null, hover = false, touch = false, dirty = false;

		// initialize overflow
		function init() {
			destroy();
			//$(window).on('resize', resize);
			$(self._getList()).on('mouseover', mouseenter);
			$(self._getList()).on('mouseout touchend', mouseout);
			initialized = true;
			self.resize();
		}

		function destroy() {
			$(window).off('resize', self.resize);
			$(self._getList()).off('mouseover', mouseenter);
			$(self._getList()).off('mouseout', mouseout);
			initialized = false;
		}

		this.doResize = function(animate) {
			//console.log('resize overflow');
			
			// calc new widths
			var item = self._getList().children(':not(.button):visible');
			if(!item.length)
				return;
				
			// get button width
			var totalButtonWidth = 0;
			self.tabs.each(function(i) {
				var tab = $(this);
				if (tab.hasClass('button')) {
					totalButtonWidth += tab.outerWidth();
				}
			});

			var tabMaxWidth = 1/item.length;
			var borderWidth = item.outerWidth() - item.width();
			var excess = borderWidth + (totalButtonWidth / item.length);
			if (totalButtonWidth) {
				excess += 2;
			}
			var css = {'max-width' : 'calc('+(tabMaxWidth*100) + '% - ' + excess + 'px)'};

			if(animate) {
				var containerWidth = self._getList().width();
				var nextWidth = (tabMaxWidth*containerWidth) - excess;
				
				// set widths to fixed as jquery can't animate with calc
				item.each(function() {
					$(this).css({
						maxWidth: $(this).width()-1
					});
				});
				
				item.animate({
					maxWidth: nextWidth
				}, {
					duration: 'fast', 
					complete: function(){ 
						item.css(css); 
					} 
				});
			} else {
				item.css(css);
			}
			
			dirty = false;
		};

		function mouseenter(e) {
			if (touch) {
				touch = false;
			} else {
				hover = true;
				if (resizeTimer) clearTimeout(resizeTimer);
			}
		}

		function mouseout(e) {
			hover = false;
			
			if (e.type==='touchend') {
				touch = true;
			}
			
			if (!dirty) {
				return;
			}
			
			if (resizeTimer) clearTimeout(resizeTimer);
			resizeTimer = setTimeout(function(){ self.doResize(true); }, 500);
		}

		self.resize = function(e, animate) {
			dirty = true;
			if (resizeTimer) clearTimeout(resizeTimer);
			resizeTimer = setTimeout(function(){ self.doResize(animate); }, 50);
		};

		self._ui = function( tab, panel ) {
			return {
				tab: tab,
				panel: panel,
				index: this.anchors.index( tab )
			};
		};

		// temporarily remove overflow buttons before adding a tab
		self.add = function(name, content, iconCls) {
			dirty = true;
			
			var newTab = false;

			if (!name) {
				name = 'New tab';
				newTab = true;
			}

			if (!content)
				content = '';

			var id = $( "<div>"+content+"</div>" ).appendTo( this.element.children(':last-child') ).uniqueId().attr('id');
			var ul = self._getList();
			var li = $( '<li style="max-width: 0;"><a href="#'+id+'" class="closable" role="presentation">'+name+'</a></li>' ).insertBefore( $(ul).children('li.addTab') );

			if (iconCls)
				li.children('a').prepend('<span class="ui-icon '+iconCls+'"></span>');

			li.uniqueId();

			if(newTab)
				li.attr('data-newtab', 1);

			var index = li.index();

			this.refresh(this);
			self.doResize(true);

			//middle click close
			li.children('a').on('mouseup', function(e){
				if(e.which === 2) {
					e.preventDefault();
				    var tabpanel = li.closest('.ui-tabs');
				    tabpanel.tabs('remove', li.index());
					return false;
				}
			});

			this.option( "active", index );
			this._trigger( "add", null, this._ui( this.tabs[ index ], this.panels[ index ] ) );

			return li;
		};

		self.remove = function(index) {
			dirty = true;
			
			var result = this._trigger( "beforeRemove", null, this._ui( this.tabs[ index ], this.panels[ index ] ) );

			if(result===false)
				return;

			index = this._getIndex( index );
			
			var tab = this.tabs.eq( index );
			var tabId = tab.attr('id');
			tab.remove();
			
			var panel = this._getPanelForTab( tab ).remove();

			// If selected tab was removed focus tab to the right or
			// in case the last tab was removed the tab to the left.
			// We check for more than 2 tabs, because if there are only 2,
			// then when we remove this tab, there will only be one tab left
			// so we don't need to detect which tab to activate.
			if ( tab.hasClass( "ui-tabs-active" ) && this.anchors.length > 2 ) {
				this._activate( index + ( index + 1 < this.anchors.length ? 1 : -1 ) );
			}

			this.refresh(this);

			if(!hover)
				self.doResize();

			this._trigger( "remove", null, {
				tabId: tabId,
				panel: this.panels[ index ]
			});

			return this;
		};

		self.getPanelForTab = function( tab ) {
			return this._getPanelForTab( tab );
		};

		init();
	}
});

})(jQuery);

