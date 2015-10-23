define(['app/lang'], function () {
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

return {
    start: start,
    stop: stop,
    abort: abort,
};
});