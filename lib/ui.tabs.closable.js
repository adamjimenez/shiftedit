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

			var unclosable_lis = this.tabs.filter(function() {
                // return the lis that do not have a close button
                return $('span.ui-icon-circle-close', this).length === 0;
            });

			// append the close button and associated events
            unclosable_lis.has('.closable').each(function() {
                $(this)
                    .append('<a href="#" class="tabCloseButton" style="padding-top: 0.5em; padding-right: 0.2em;"><span class="ui-icon ui-icon-circle-close" style="display:inline-block;margin-left:-0.5em;" ></span></a>')
                    .find('a:last')
                        .hover(
                            function() {
                                $(this).css('cursor', 'pointer');
                            },
                            function() {
                                $(this).css('cursor', 'default');
                            }
                        )
                    .end();
            });
        }
    }
});

})(jQuery);

$('body').on('click', '.tabCloseButton', function(){
	var tab = $(this).closest('li');
    var tabpanel = tab.closest('.ui-tabs');
    console.log('yo')
    tabpanel.tabs('remove', tab.index());

    // don't follow the link
    return false;
});