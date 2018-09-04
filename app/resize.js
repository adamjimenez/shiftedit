define(['jquery'], function () {

var timer;

function doResize() {
	console.log('resize');
	//active file tabs
	$('.ui-tabs-active[data-file]').each(function() {
		var tab = $(this);
		window.splits[tab.attr('id')].resize(true);

		var panel = $(tab).closest('.ui-layout-pane').tabs('getPanelForTab', tab);
		var inst = tinymce.get(panel.find('.design .tinymce').attr('id'));
		if(inst && inst.theme && tab.data('design-ready')) {
			var container = panel.find('.design');
			inst.theme.resizeTo(panel.width(), panel.height()-$('.mce-top-part').height());
		}
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