define(['./tabs', './lang', './layout', './site', './prompt', './util', './ssl', 'jquery'], function (tabs, lang, layout, site, prompt, util, ssl) {
	lang = lang.lang;

	var combobox;
	var childWindow;
	var childWindowSource;
	var url = '';
	var tab;
	var default_url = '/screens/default_live';

function change() {
	var source;
	if (childWindow) {
		source = childWindowSource;
	} else {
		var previewTab = $('li[data-type=preview]');
		source = previewTab.data('source');
	}
	
	if (source) {
		// get mode
		var editor = tabs.getEditor(source);
		var mode = editor.getSession().$modeId.replace('ace/mode/', '');
		
		if (mode === 'markdown' && $(source).attr('id') === $(this).attr('id')) {
			refresh();
		}
	}
}

function refresh() {
	var source;
	if (childWindow) {
		source = childWindowSource;
	} else {
		var previewTab = $('li[data-type=preview]');
		source = previewTab.data('source');
	}
	
	if (!source) {
		return;
	}
	
	// get mode
	var editor = tabs.getEditor(source);
	var mode = editor.getSession().$modeId.replace('ace/mode/', '');
	
	if (mode === 'markdown') {
		require(['markdown-it'], function(MarkdownIt){
			var md = new MarkdownIt();
			var result = md.render(editor.getValue());
			
			if($('.preview > iframe')) {
				var loadPreview = function() {
					$('.preview > iframe').contents().find('html').html(result);
				};
				
				if (url!=default_url) {
					url = default_url;
					$('.preview > iframe').attr('src', default_url).on("load", loadPreview);
				} else {
					loadPreview();
				}
			}
		
			if( childWindow ){
				childWindow.document.body.innerHTML = result;
			}
		});
	} else {
		if(combobox) {
			var val = combobox.input.val();
			if (val.indexOf('://') == -1) {
				val = 'https://' + val;
				$( ".address" ).combobox('val', val);
			}
	
			url = val;
	
			if(!$( ".address option[value='"+val+"']" ).length) {
				$( ".address" ).append( '<option value="' + val + '">'+val+'</option>' );
			}
		}
	
		var separator = (url.indexOf('?') === -1) ? '?' : '&';
		var preview_url = url + separator + 'shiftedit=' + new Date().getTime();
	
		if($('.preview > iframe')) {
			if(util.startsWith(url, 'http://') && ssl.is_blocked()) {
				ssl.test()
				.fail(function () {
					prompt.alert({title:'Preview Blocked', msg:'Enable SSL or click Shield icon in address bar, then "Load unsafe scripts"'});
				});
			}
			
			$('.preview > iframe').on("load", function() {
				$('.refreshButton i').removeClass('fa-spin');
			});
			
			$('.refreshButton i').addClass('fa-spin');
			$('.preview > iframe').attr('src', preview_url);
		}
		
		if( childWindow ){
			childWindow.location.href = preview_url;
		}
	}
}

function create(tabpanel) {
	//create tab
	tab = $(tabpanel).tabs('add', 'Preview', '\
	<div class="vbox">\
		<div class="preview_toolbar ui-widget-header ui-corner-all" style="min-height: 28px;">\
			<button type="button" class="refreshButton"><i class="fas fa-sync"></i></button>\
			<div class="flex">\
				<div class="addressbar flex">\
					<select class="address"></select>\
				</div>\
			</div>\
			<button type="button" class="popoutPreviewButton"><i class="fas fa-external-link-alt"></i></button>\
		</div>\
		<div class="preview" style="flex: 1;">\
			<iframe class="iframe" style="width:100%;height:100%;display:block;background:#fff;" src="'+default_url+'" frameborder="0"></iframe>\
		</div>\
	</div>\
	');

	tab.addClass('closable');
	tab.attr('data-type', 'preview');

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
		load();
	});

	$('.popoutPreviewButton').button().click(function() {
		if( url ){
			var separator;
			if (url.indexOf('?') === -1) {
				separator = '?';
			} else {
				separator = '&';
			}

			childWindow = window.open(url + separator + 'shiftedit=' + new Date().getTime());
			childWindowSource = $(tab).data('source');
			
			if( url == default_url ){
				// load when ready for markdown
				$(childWindow).on('load', refresh);
			} else {
				// refresh fallback for external url
				refresh();
			}

			//close tab
			var tabpanel = $(tab).closest(".ui-tabs");
			var index = $(tab).index();
			$(tabpanel).tabs('remove', index);
		}
	});
}

function load(tab) {
	if (!tab) {
		tab = tabs.active();
	}

	if(tab) {
		var previewTab = $('li[data-type=preview]');
		previewTab.data('source', tab);
		
		var siteId = tab.data('site');
		
		// get mode
		var editor = tabs.getEditor(tab);
		var mode = editor.getSession().$modeId.replace('ace/mode/', '');
		
		$('.preview_toolbar .addressbar').show();
		
		if (mode === 'markdown') {
			// hide toolbar
			$('.preview_toolbar .addressbar').hide();
			refresh();
		} else if(siteId) {
			var file = tab.data('file');
			var url = tab.data('link');

			if (!url) {
				var settings = site.getSettings(siteId);
				if(settings.web_url) {
					url = settings.web_url+file;
				}

				if (!util.startsWith(url, 'http://') && !util.startsWith(url, 'https://')) {
					url = 'https://' + url;
				}
			}

			if(url) {
				combobox.input.val(url);
				refresh();
			}else{
				prompt.alert({title:'Missing web url', msg:'Add a web url in site settings'});
			}
		} else {
			prompt.alert({title:'File is not saved', msg:'Save the file to a site first'});
		}
	}
}

function run(tab) {
	var siteId = tab.data('site');
	var editor = tabs.getEditor(tab);
	var mode = editor.getSession().$modeId.replace('ace/mode/', '');
	if (mode !== 'markdown') {
		if(!siteId) {
			prompt.alert({title:'File is not saved', msg:'Save the file to a site first'});
			return;
		} else {
			var settings = site.getSettings(siteId);
			if(!settings.web_url) {
				prompt.alert({title:'Missing web url', msg:'Add a web url in site settings'});
				return;
			}
		}
	}
	
	var myLayout = layout.get();
	
	// find existing
	var previewTab = $('li[data-type=preview]');
	
	// open
	var panel = 'east';
	var minWidth = 300;
	
	if (!$('.ui-layout-resizer-east').is(':visible')) {
		panel = 'center';
	}

	if(previewTab.length) {
		tabpanel = previewTab.closest('.ui-tabs');
		tabpanel.tabs("option", "active", previewTab.index());

		//get nearest panel
		var pane = previewTab.closest('.ui-layout-pane');
		panel = pane[0].className.match('ui-layout-pane-([a-z]*)')[1];

		//expand panel
		myLayout.open(panel);
		if (pane.outerWidth() < minWidth) {
			myLayout.sizePane(panel, minWidth);
		}
		
		load(tab);
		return;
	}

	tabpanel = '.ui-layout-'+panel;
	//expand east panel
	myLayout.open(panel);
	if(myLayout.panes.east.outerWidth() < minWidth) {
		myLayout.sizePane(panel, minWidth);
	}
	
	create($(tabpanel));
	load(tab);
}

$('body').on('click','.newTab .preview', function(){
	var tabpanel = $(this).closest('.ui-tabs');
	create(tabpanel);

	var id = $(this).closest('[role=tabpanel]').attr('id');
	var tab = $('[aria-controls='+id+']');
	tabs.close(tab);
});

//refresh on save
$('body').on('save', '.ui-tabs', refresh);
$('body').on('change', '.ui-tab', change);

return {
	run: run
};

});