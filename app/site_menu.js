define(["./util", './lang', './site', "jquery-contextmenu"], function (util, lang, site) {
lang = lang.lang;
var makeMenuText = util.makeMenuText;

function init() {
	var select = $( "#sites" );
	var placeholder = 'Select a site';
	var list;
	var dialog;
	
	var selectContainer = select.parent();
	select.after('<div class="label">'+placeholder+'</div><div class="caret"><i class="fas fa-caret-down"></i></div>').hide();
	
	// menu hover
	selectContainer.on('mouseover', function () {
		if (dialog) {
			return;
		}
		
		$(this).addClass('ui-state-hover');
	});
	selectContainer.on('mouseout', function () {
		$(this).removeClass('ui-state-hover');
	});
	
	selectContainer.click(function() {
		if (dialog) {
			dialog.dialog( "close" );
			return;
		}
		
		selectContainer.trigger('mouseout');
		
		$( "body" ).append('<div id="dialog-panel" class="sitePanel">\
			<form class="ui-corner-all vbox">\
				<div class="hbox">\
					<input type="text" placeholder="Filter" class="filter flex text ui-widget-content ui-corner-all" autocomplete="off" autofocus>\
					<button class="addSite" type="button">'+lang.newSiteText+'</button>\
				</div>\
				<ul></ul>\
			</form>\
		</div>');

		//open dialog
		dialog = $( "#dialog-panel" ).dialog({
			width: 300,
			height: 300,
			modal: true,
			open: function( event, ui ) {
				$(this).prev('.ui-dialog-titlebar').hide();
				
				// toggle caret
				selectContainer.find('.caret i').removeClass('fa-caret-down').addClass('fa-caret-up');
			},
			close: function( event, ui ) {
				$( this ).remove();
				selectContainer.css('z-index', 'inherit');
				$('.ui-layout-west').css('z-index', 0);
				
				// toggle caret
				selectContainer.find('.caret i').removeClass('fa-caret-up').addClass('fa-caret-down');
				dialog = null;
				list = null;
			},
			position: { my: "left top", at: "left bottom", of: selectContainer }
		});
		
		// show site bar
		selectContainer.css('z-index', 1000);
		$('.ui-layout-west').css('z-index', 'inherit');
		
		// use all available height
		dialog.parent().css('border-radius', 0);
		dialog.height(($(document).height()-dialog.offset().top)-20);
		
		// close on click out
		$(".ui-widget-overlay").one('click', function(){
			dialog.dialog( "close" );
		});
	
		list = dialog.find("ul").basicMenu();
		
		list.on('basicmenuclick basicmenuenter', function(event, ui) {
			dialog.dialog( "close" );
			if ($(ui.item).data('value')) {
				site.open($(ui.item).data('value'));
			}
		});
		
		dialog.find('.addSite').button().click(function() {
			dialog.dialog( "close" );
			site.edit();
		});
		
		// show sites
		refresh();
		
		// default selected current site
		list.basicMenu('select', list.find('li[data-value='+site.active()+']'));
		
		dialog.find( '.filter' ).keydown(function(e) {
			return list.trigger(e);
		});
	
		// filter on input
		dialog.find( '.filter' ).on('input', refresh);
	});

	function refresh() {
		var search = dialog.find( '.filter' ).val().toLowerCase();

		//populate with recent files
		var items = util.clone(site.get());

		for(var i in items) {
			if(items[i].name.toLowerCase().indexOf(search)==-1) {
				delete items[i];
			}
		}

		//clear old options
		list.children('li').remove();

		//create select items
		items.forEach(function(item) {
			var icon = '';
			if (item.shared) {
				icon = '<i class="fa fa-share-alt"></i>';
			}
			list.append( '<li data-value="'+item.id+'"><a href="#">'+item.name+icon+'</a></li>' );
		});
		
		list.find("li:first").addClass("ui-state-active");
	}
	
	$.contextMenu({
		selector: '.sitePanel ul li, #sitebar',
		events: {
			show: function(event) {
				if (list) {
					var tab = $(this);
					list.basicMenu('select', tab);
				}
			}
		},
		callback: function(key, opt){
			if (dialog) {
				dialog.dialog( "close" );
			}
			
			var tab = $(this);
			var value = tab.data('value');

			switch(key) {
				case 'new':
					site.edit();
				break;
				case 'edit':
					site.edit(value);
				break;
				case 'delete':
					site.remove(value);
				break;
				case 'duplicate':
					site.duplicate(value);
				break;
				case 'share':
					site.share(value);
				break;
				case 'database':
					site.database(value);
				break;
			}
		},
		items: {
			"new": {name: lang.newText + '...'},
			"edit": {name: lang.editText + '...', disabled: noValue},
			"delete": {name: lang.deleteText + '', disabled: noValue},
			"duplicate": {name: lang.duplicate + '...', disabled: noValue},
			"share": {name: lang.share + '...', disabled: noValue},
			"database": {name: lang.database, disabled: noValue}
		},
		zIndex: 3
	});
	
	function noValue() {
		return typeof $(this).data('value') === 'undefined';
	}
}

return {
	init: init
};

});