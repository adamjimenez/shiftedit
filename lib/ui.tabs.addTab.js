/*!
 * Copyright (c) 2015 Adam Jimenez
 *
 * Dual licensed under the MIT (MIT_LICENSE.txt)
 * and GPL (GPL_LICENSE.txt) licenses
 *
 * http://github.com/adamjimenez
 */
(function() {

var old_method = $.ui.tabs.prototype._create;

$.extend($.ui.tabs.prototype, {

    _create: function() {
        var self = this;

        // if addTab then add button
        if (self.options.addTab === true) {
            this._getList().append('<li class="addTab button"><a href="#add">+</a></li>');
            var ul = self._getList();
            ul.children('.addTab').click(function(){
            	self.add();
            });
        }

        self.options.beforeActivate = function(e, data) {
            if(data.newTab.hasClass('button')) {
                return false;
            }
        };

		old_method.apply(this, arguments);
    }
});

})(jQuery);