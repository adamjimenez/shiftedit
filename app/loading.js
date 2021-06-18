define(['./prompt','./lang'], function (prompt, lang) {
lang = lang.lang;
require('jquery');

var isLoading = false;
var timer;
var abortCallback;
var overlay;
var ajax;
var giveWay = false;

function start(action, abortFunction, modal) {
	if (giveWay) {
		if (ajax) {
			console.log('aborting last request to give way');
			ajax.abort();
		}
		isLoading = false;
		giveWay = false;
	}
	
	if (isLoading) {
		console.warn(lang.ftpBusyText, lang.waitForFtpText);
		return false;
	} else {
		if (action !== false) {
			console.log(action);
			if (modal) {
				overlay = $( "<div>" )
				.appendTo( 'body' )
				.addClass( "ui-widget-overlay ui-front" )
				.css( "z-index", 100001 );
			}
			
			isLoading = true;
			if (!action) {
				action = 'Loading';
			}
			if (!$('#serverProgress').length) {
				$('body').append('<div id="serverProgress"></div>');
			}
	
			serverProgress = $('#serverProgress');
			serverProgress.html('<strong class="ui-state-highlight">' + action + '&nbsp;&nbsp; <a href="#" class="abort">cancel</a></strong>');
			serverProgress.show();
			timer = setInterval(title, 1000);
	
			abortCallback = abortFunction;
			$('#serverProgress .abort').click(abort);
		} else {
			console.log('Loading');
		}

		return true;
	}
}

function stop(animate) {
	isLoading = false;
	giveWay = false;
	
	if (overlay) {
		overlay.remove();
	}
	
	if (timer) {
		clearInterval(timer);
	}
	if (document.title.substr(0, 4).indexOf('>') !== -1) {
		document.title = document.title.substr(4);
	}
	$('#serverProgress').remove();
}

function title() {
	var anim = document.title.substr(0, 3);
	if (anim === '>--') {
		document.title = '->- ' + document.title.substr(4);
	} else if (anim === '->-') {
		document.title = '--> ' + document.title.substr(4);
	} else if (anim === '-->') {
		document.title = '>-- ' + document.title.substr(4);
	} else {
		document.title = '>-- ' + document.title;
	}
}

function abort() {
	stop();

	if( abortCallback ){
		abortCallback();
	}
}

function inProgress() {
	return isLoading;
}

function fetch(url, options) {
	var defaults = {
		action: 'loading',
		success: function(){},
		complete: function(){},
		data: []
	};

	options = $.extend({}, defaults, options);

	if (!start(options.action, function(){
		ajax.abort();
	}), options.modal) {
		return;
	}

	var method = typeof(options.data)==='object' ? 'POST' : 'GET';

	ajax = $.ajax({
		url: url,
		method: method,
		dataType: 'json',
		data: options.data,
		xhrFields: {
			withCredentials: true
		}
	});
	
	if (options.giveWay) {
		giveWay = true;
	}
		
	ajax.then(function (data) {
		stop();
		if(data.success) {
			options.success(data);
		} else {
			console.log(data);
			
			if (options.error) {
				options.error(data.error);
			} else {
				prompt.alert({title: 'Error', msg:data.error});
			}
		}
		options.complete(data);
	}).fail(function(error) {
		console.log(error);
		stop();
		if (options.error) {
			options.error(error);
		} else {
			prompt.alert({title: 'Failed ' + options.action, msg: error});
		}
	});
}

return {
	start: start,
	stop: stop,
	abort: abort,
	fetch: fetch
};
});