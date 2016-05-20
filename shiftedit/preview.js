define(['app/tabs', 'app/lang', 'app/layout', 'app/site', 'app/prompt', 'jquery'], function (tabs, lang, layout, site, prompt) {
	lang = lang.lang;

	var combobox;
	var childWindow;
	var url = '';
	var tab;

function refresh() {
	if(combobox) {
		var val = combobox.input.val();
		if (val.indexOf('://') == -1) {
			val = 'http://' + val;
			$( ".address" ).combobox('val', val);
		}

		url = val;

		if(!$( ".address option[value='"+val+"']" ).length) {
			$( ".address" ).append( '<option value="' + val + '">'+val+'</option>' );
		}
	}

	var separator = (url.indexOf('?') === -1) ? '?' : '&';
	var preview_url = url + separator + 'shiftedit=' + new Date().getTime();

	$('#preview').attr('src', preview_url);

	if( childWindow ){
		childWindow.location.href = preview_url;
	}
}

function create() {
	layout.get().open('east');

	//create tab
	tab = $(".ui-layout-east").tabs('add', 'Preview', '<div class="preview_toolbar ui-widget-header ui-corner-all">\
	<button type="button" class="runButton"><i class="fa fa-play"></i></button>\
	<button type="button" class="refreshButton"><i class="fa fa-refresh"></i></button>\
	<select class="address" class="flex"></select>\
	<button type="button" class="popoutPreviewButton"><i class="fa fa-external-link"></i></button>\
	</div>\
	<iframe id="preview" style="width:100%;height:100%;display:block;background:#fff;" src="/screens/default_live" frameborder=0></iframe>');

	tab.addClass('closable');

	//profile combo
	var addressbar = $( ".address" ).combobox({
		select: function (event, ui) {
			combobox.input.val(ui.item.value);
			refresh();
		},
		change: function (event, ui) {
			//refresh();
		}
	});

	combobox = $('.address').data().customCombobox;

	//select url on focus
	$( combobox.input ).focus(function() {
		$(this).select();
	});

	//handle keyboard: up / down enter / input
	$( combobox.input ).keydown(function(e) {
		switch(e.keyCode){
			case 13: //enter
				refresh();
			return;
			case 27: //esc
				//revert value
				$( ".address" ).combobox('val', url);
			return;
		}
	});

	$('.refreshButton').button().click(refresh);
	$('.runButton').button().click(function() {
		var tab = tabs.active();

		if(tab) {
			var siteId = tab.data('site');

			if(siteId) {
				var file = tab.data('file');
				var url = tab.data('link');

				if (!url) {
					var settings = site.getSettings(siteId);
					if(settings.web_url) {
						url = settings.web_url+file;
					}
				}

				if(url) {
					combobox.input.val(url);
					refresh();
				}else{
					prompt.alert({title:'Missing web url', msg:'Add a web url in site settings'});
				}
			}
		}
	});

	$('.popoutPreviewButton').click(function() {
		if( url ){
			var separator;
			if (url.indexOf('?') === -1) {
				separator = '?';
			} else {
				separator = '&';
			}

			childWindow = window.open(url + separator + 'shiftedit=' + new Date().getTime());
			refresh();

			//close tab
			var tabpanel = $(tab).closest(".ui-tabs");
			var index = $(tab).index();
			$(tabpanel).tabs('remove', index);
		}
	});
}

	$('body').on('click','.newTab .preview', function(){
		var tabpanel = $(this).closest('.ui-tabs');
		create(tabpanel);

		var id = $(this).closest('[role=tabpanel]').attr('id');
		var tab = $('[aria-controls='+id+']');
		tabs.close(tab);
	});

	//refresh on save
	$('body').on('save','.ui-tabs', refresh);

	return {
	};
});
