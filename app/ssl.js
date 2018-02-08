define(function (require) {
require('jquery');

var blocked = true;

return {
	test: function () {
		return $.ajax({
			url: 'http://shiftedit.s3.amazonaws.com/js/insecure.js',
			success: function() {
				blocked = false;
			},
			xhrFields: {
				withCredentials: false
			},
			timeout: 3000
		});
	},
	is_blocked: function () {
		return blocked;
	}
};

});