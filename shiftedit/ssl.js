define(function (require) {
require('jquery');

var blocked = true;

$.ajax({
   url: 'http://shiftedit.s3.amazonaws.com/js/insecure.js',
   success: function() {
	   blocked = false;
   },
   xhrFields: {
	  //withCredentials: true
   }
});



return {
	check_blocked: function () {
		return blocked;
	}
};

});