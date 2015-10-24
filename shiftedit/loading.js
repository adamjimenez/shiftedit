define(['app/prompt','app/lang'], function (prompt) {
var lang = require('app/lang').lang;
require('jquery');

var isLoading = false;
var timer;
var abortCallback;

function start(action, abortFunction) {
	if (isLoading) {
		console.warn(lang.ftpBusyText, lang.waitForFtpText);
		return false;
	} else {
		console.log(action);

		isLoading = true;
		if (!action) {
			action = 'Loading';
		}
		if (!$('#serverProgress').length) {
			$('body').append('<div id="serverProgress"></div>');
		}

		serverProgress = $('#serverProgress');
		serverProgress.html('<strong>' + action + '&nbsp;&nbsp; <a href="#" class="abort">cancel</a></strong>');
		serverProgress.show();
		timer = setInterval(title, 1000);

		abortCallback = abortFunction;
		$('#serverProgress .abort').click(abort);

		return true;
	}
}

function stop(animate) {
	isLoading = false;
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
        data: []
    };

    options = $.extend({}, defaults, options);

    var ajax;
	if (!start(options.action, function(){
		ajax.abort();
	})) {
		return;
	}

    ajax = $.ajax({
        url: url,
	    method: 'GET',
	    dataType: 'json',
    })
    .then(function (data) {
        stop();

        if(data.success){
			options.success(data);
        }else{
            prompt.alert({title:'Error', msg:data.error});
        }
    }).fail(function() {
        stop();
		prompt.alert({title:lang.failedText, msg:'Error '+options.action});
    });
}

return {
    start: start,
    stop: stop,
    abort: abort,
    fetch: fetch
};
});