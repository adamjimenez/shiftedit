/*!
 * Copyright (c) 2010 Andrew Watts
 *
 * Dual licensed under the MIT (MIT_LICENSE.txt)
 * and GPL (GPL_LICENSE.txt) licenses
 *
 * http://github.com/andrewwatts/ui.tabs.closable
 */
(function() {

var ui_tabs_tabify = $.ui.tabs.prototype._processTabs;

$.extend($.ui.tabs.prototype, {
    _processTabs: function() {
        var self = this;

		ui_tabs_tabify.apply(this, arguments);

        // if closable tabs are enable, add a close button
        if (self.options.closable === true) {
			var lis = this.tabs.filter(function() {
                // return the lis that do not have a close button
                return $('a.tabCloseButton', this).length === 0;
            });

			// append the close button and associated events
            $('<a href="#" class="tabCloseButton"><i class="fas fa-times"></i></a>')
			.appendTo(lis.has('.closable')).css('visibility', 'hidden');
        }
    }
});

})(jQuery);

$(document).on('click', '.tabCloseButton', function(){
	var tab = $(this).closest('li');
    var tabpanel = tab.closest('.ui-tabs');
    tabpanel.tabs('remove', tab.index());

    // don't follow the link
    return false;
});

$(document).on('mouseover', '.closable', function(){
	$(this).find('.tabCloseButton').css('visibility', 'visible').css('opacity', 0.5).children('i').removeClass('fa-circle').addClass('fa-times');
});

$(document).on('mouseout', '.closable', function(){
	if ($(this).data('edited')) {
		$(this).find('.tabCloseButton').css('visibility', 'visible').css('opacity', 1).children('i').removeClass('fa-times').addClass('fa-circle');
	} else {
		$(this).find('.tabCloseButton').css('visibility', 'hidden');
	}
});