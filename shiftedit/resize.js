define(['jquery'], function () {

var timer;

function doResize() {
	console.log('resize');
	//active file tabs
	$('.ui-tabs-active[data-file]').each(function() {
		window.splits[$(this).attr('id')].resize(true);

		var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);
		var inst = tinymce.get(panel.find('.design textarea').attr('id'));
		if(inst) {
			var container = panel.find('.design');
			inst.theme.resizeTo(container.width(), container.height()-110);
		}
	});

	//active file tabs
	$('.ui-tabs-active[data-ssh]').each(function() {
		var session = tab.data('session');
		if(session)
			session.doResize();
	});
}

function resize() {
	clearTimeout(timer);
	timer = setTimeout(doResize, 250);
}

function init() {
	$(window).on('resize activate', resize);
}

return {
	init: init,
	resize: resize
};

});