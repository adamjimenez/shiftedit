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
		var self = this, initialized = false, buttonWidth, containerWidth, resizeTimer = null, hover = false;

		// initialize overflow
		function init() {
			destroy();
			$(window).on('resize', resize);
			$(self._getList()).on('mouseover', mouseenter);
			$(self._getList()).on('mouseout', mouseout);
			initialized = true;
			resize();
		}

		function destroy() {
			$(window).off('resize', resize);
			$(self._getList()).off('mouseenter', mouseenter);
			$(self._getList()).off('mouseout', mouseout);
			initialized = false;
		}

		function doResize(animate) {
			//console.log('resize overflow');
			buttonWidth = 0;
			containerWidth = self._getList().width();

			// get button width
			self.tabs.each(function(i) {
				var tab = self.tabs.eq(i);

				if (tab.hasClass('button')) {
					buttonWidth += tab.outerWidth(true);
				}
			});

			// calc new widths
			var maxWidth = (containerWidth - buttonWidth) / self.tabs.length;

			var css = {'max-width' : maxWidth-2};

			if(animate) {
				self._getList().children(':not(.button)').animate(css, 'fast'); //subtract padding between tabs
			} else {
				self._getList().children(':not(.button)').css(css);
			}
		}

		function mouseenter() {
			hover = true;
		}

		function mouseout() {
			hover = false;

			if (resizeTimer) clearTimeout(resizeTimer);
			resizeTimer = setTimeout(function(){ doResize(true) }, 500);
		}

		function resize(e, animate) {
			if (resizeTimer) clearTimeout(resizeTimer);
			resizeTimer = setTimeout(function(){ doResize(animate) }, 50);
		}

		self._ui = function( tab, panel ) {
			return {
				tab: tab,
				panel: panel,
				index: this.anchors.index( tab )
			};
		};

		// temporarily remove overflow buttons before adding a tab
		self.add = function(name, content, iconCls) {
			var newTab = false;

			if (!name) {
				name = 'New tab';
				newTab = true;
			}

			if (!content)
				content = '';

			var id = $( "<div>"+content+"</div>" ).appendTo( this.element.children(':last-child') ).uniqueId().attr('id');
			var ul = self._getList();
			var li = $( '<li><a href="#'+id+'" class="closable" role="presentation">'+name+'</a></li>' ).insertBefore( $(ul).children('li.addTab') );

			if (iconCls)
				li.children('a').prepend('<span class="ui-icon '+iconCls+'"></span>');

			li.uniqueId();

			if(newTab)
				li.attr('data-newtab', 1);

			var index = li.index();

			this.refresh(this);
			doResize(true);

			//middle click close
			li.on('click', function(e){
				if(e.which === 2) {
					var li = $( this ).closest( "li" );
					self.remove(li.index());
				}
			});

			this.option( "active", index );
			this._trigger( "add", null, this._ui( this.tabs[ index ], this.panels[ index ] ) );

			return li;
		};

		self.remove = function(index) {
			var result = this._trigger( "beforeRemove", null, this._ui( this.tabs[ index ], this.panels[ index ] ) );

			if(result===false)
				return;

			index = this._getIndex( index );
			var options = this.options,
				tab = this.tabs.eq( index ).remove(),
				panel = this._getPanelForTab( tab ).remove();

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
				doResize();

			this._trigger( "remove", null, this._ui( this.tabs[ index ], this.panels[ index ] ) );

			return this;
		};

		self.getPanelForTab = function( tab ) {
			return this._getPanelForTab( tab );
		};

		init();
	}
});

})(jQuery);