define(["jquery.menubar"], function () {
	var context;

	function build(el, menu){
		for(var i in menu) {
			if(menu[i]==='-') {
				el.append('<li>&nbsp;</li>');
			}else if(menu[i]==='->') {
				el.css('display', 'flex');
				el.css('flex-wrap', 'nowrap');
				//el.css('overflow-x', 'auto');
				el.css('-webkit-overflow-scrolling', 'touch');
				el.append('<li class="ui-state-default" style="flex-grow:2"></li>');
			}else if(menu[i]==='-') {
				el.append('<li class="ui-state-default">&nbsp;</li>');
			}else{
				var tooltip = menu[i].tooltip ? menu[i].tooltip : '';

				var item = $('<li>\
					<div title="'+tooltip+'">'+menu[i].text+'</div>\
				</li>').appendTo(el);

				if(menu[i].id) {
					item.attr('id', menu[i].id);
				}

				if(menu[i].className) {
					item.attr('class', menu[i].className);
				}

				if(menu[i].disabled) {
					item.addClass('ui-state-disabled');
				}

				if(menu[i].name) {
					item.attr('data-name', menu[i].name);
				}

				if(menu[i].target) {
					item.attr('data-target', menu[i].target);
				}

				if(menu[i].match) {
					item.attr('data-match', menu[i].match);
				}

				if(menu[i].cls) {
					item.addClass(menu[i].cls);
				}

				// checkboxes
				var toggle = false;
				if(menu[i].group) {
					toggle = true;
					item.data('group', menu[i].group);
					item.attr('data-group', menu[i].group);
				}else if(typeof menu[i].checked === "boolean") {
					toggle = true;
				}

				if(toggle) {
					item.data('toggle', true);
					
					var icon = $('<i class="check fas fa-check"></i>').prependTo(item.children('div'));
					if (!menu[i].checked) {
						icon.hide();
					}
				}

				//trigger the correct handler with the checkbox value
				if(menu[i].handler && !menu[i].buttons) {
					item.click(
						(function(i, item, context) {
							return function(e) {
								var check = $(item).find('.check');
								var group = $(item).data('group');
								
								if ($(item).data('toggle')) {
									if (check.is(":visible")) {
										if (!group) {
											check.hide();
										}
									} else {
										if (group) {
											el.find('[data-group='+group+'] .check').hide();
										}
										
										check.show();
									}
								}

								jQuery.proxy(menu[i].handler, item, context, check.is(":visible"))();
							};
						}(i, item, context))
					);
				}
				
				
				if(typeof menu[i].buttons === 'object'){
					item.find('.label').removeClass('label');
					
					menu[i].buttons.forEach(function(button) {
						var input = $('<label><input type="radio" name="' + button.group + '" value="' + button.value + '">' + button.text + '</label>').appendTo(item.find('.shortcut'))
						.attr('id', button.id);
						
						if(button.checked) {
							input.prop('checked', true);
						}
					});
					
					var buttons = $(item).find('input');
					buttons.checkboxradio({icon: false});
					
					buttons.change(menu[i].handler);
				}

				if(typeof menu[i].items === 'object'){
					var submenu = $('<ul></ul').appendTo(item);
					build(submenu, menu[i].items);
				}

				if(menu[i].hidden) {
					item.hide();
				}
			}
		}
	}

	function create(el, menu, contextEl){
		context = contextEl;

		build(el, menu);

		function select(event, ui) {
			console.log("Selected: " + ui.item.text());
		}
		
		$(el).menubar({
			autoExpand: true,
			menuIcon: true,
			buttons: false,
			//position: {
			//	within: $("#demo-frame").add(window).first()
			//},
			//select: select
		});
	}

	return {
		create: create
	};
});