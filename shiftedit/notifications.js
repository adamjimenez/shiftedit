define(['app/util', 'app/site', 'app/prefs', 'jquery'], function (util, site, preferences) {
	var lastEventType;
	var paused = false;
	var running = false;
	var timer;
	var ajax;
	
	// check for notifications
	var check = function() {
		running = true;
		ajax = $.ajax({
			url: '/api/notifications',
			method: 'GET',
			dataType: 'json'
		}).done(function (data) {
			if (data.message) {
				$('.notification').remove();
				$('<div class="notification ui-widget-header"><div class="inner">'+util.escapeHTML(data.message)+'</strong> <a href="#" class="dismiss"><i class="fa fa-times"></i></a></div></div>').appendTo($('body'));
	
				$('.notification .dismiss').click(function() {
					$('.notification').fadeOut(300, function() { $(this).remove(); });
				});
			}
			
			switch(data.subject) {
				case 'site':
					// refresh site list
					site.load();
					
					// update firebase token
					preferences.load();
				break;
			}
		}).always(function() {
			if (paused) {
				running = false;
			} else {
				timer = setTimeout(check, 5000);
				running = true;
			}
		});
	};
	
	$(window).on("blur focus", function(e) {
		if (lastEventType != e.type) {   //  reduce double fire issues
			switch (e.type) {
				case "blur":
					console.log('paused notifications');
					paused = true;
					clearTimeout(timer);
					break;
				case "focus":
					console.log('resumed notifications');
					paused = false;
					
					if (!running) {
						check();
					}
					break;
			}
		}
	
		lastEventType = e.type;
	});
	
	check();

	return {
	};
});