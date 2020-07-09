define(["./util", './lang', './git', "jquery-contextmenu"], function (util, lang, git) {
lang = lang.lang;
var makeMenuText = util.makeMenuText;

function init() {
	var select = $( "#gitBranch" );
	var placeholder = lang.selectBranch;
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
		
		$( "body" ).append('<div id="dialog-panel" class="gitPanel">\
			<form class="ui-corner-all vbox">\
				<div class="hbox">\
					<input type="text" placeholder="Filter" class="filter flex text ui-widget-content ui-corner-all" autocomplete="off" autofocus>\
					<button class="addBranch" type="button">' + lang.newBranch + '</button>\
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
			if ($(ui.item).data('value')) {
				git.checkout($(ui.item).data('value').trim());
			} else {
				git.checkout(dialog.find( '.filter' ).val().trim());
			}
			dialog.dialog( "close" );
		});
		
		dialog.find('.addBranch').button().click(function() {
			dialog.dialog( "close" );
			git.createBranch();
		});
		
		// show sites
		refresh();
		
		// default selected current site
		list.basicMenu('select', list.find('li[data-value='+git.activeBranch()+']'));
		
		dialog.find( '.filter' ).keydown(function(e) {
			return list.trigger(e);
		});
	
		// filter on input
		dialog.find( '.filter' ).on('input', refresh);
	});

	function refresh() {
		var search = dialog.find( '.filter' ).val().toLowerCase();

		//populate with recent files
		var items = util.clone(git.getBranches());

		for(var i in items) {
			if(items[i].name.toLowerCase().indexOf(search)==-1) {
				delete items[i];
			}
		}

		//clear old options
		list.children('li').remove();

		//create select items
		items.forEach(function(item) {
			list.append( '<li data-value="'+item.name+'"><a href="#">'+item.name+'</a></li>' );
		});
		
		list.find("li:first").addClass("ui-state-active");
	}
	
	$.contextMenu({
		selector: '.gitPanel ul li, #gitBranchBar',
		events: {
			show: function(event, ui) {
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
			var value = $(this).data('value');

			switch(key) {
				case 'delete':
					git.removeBranch(value);
				break;
			}
		},
		items: {
			"delete": {name: lang.deleteText, disabled: function() { return ($(this).data('value')==='master'); }}
		},
		zIndex: 3
	});
}

return {
	init: init
};

});