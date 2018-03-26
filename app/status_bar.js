define(['exports','./lang', './util', './prefs', './tabs', './menus',  './editors', './site', './modes'], function (exports, lang, util, preferences, tabs, menus, editors, site, modes) {
lang = lang.lang;
modes = modes.modes;

var activeTab;

var changeMode = function() {
	var tab = activeTab;
	var editor = tabs.getEditor(tab);
	if (!editor) {
		return;
	}
	
	var label = $(this).text().trim();
	var mode = $(this).attr('data-name');
	
	editor.focus();

	//set editor mode
	editors.setMode(editor, mode);

	//set button value
	$(this).parent().prev().children('.ui-button-text').text(label);

	//save pref
	var ext = util.fileExtension(tab.data('file'));
	var defaultMode = 'text';

	//check default file associations
	modes.forEach(function (item) {
		if (item[2].indexOf(ext) !== -1) {
			defaultMode = item[0];
			return;
		}
	});

	var prefs = preferences.get_prefs();

	if(typeof(prefs.fileAssociations)!=='object')
		prefs.fileAssociations = {};

	if( defaultMode === mode ){
		delete prefs.fileAssociations[ext];
	}else{
		if(prefs.fileAssociations[ext]===mode) {
			return;
		}

		prefs.fileAssociations[ext] = mode;
	}

	preferences.save('fileAssociations', prefs.fileAssociations);
};

function init() {
	$('.ui-layout-south').append('\
		<div class="status_bar"></div>\
	');
	
	var modeItems = [];
	modes.forEach(function (item) {
		modeItems.push({
			name: item[0],
			text: item[1],
			handler: changeMode,
			group: 'mode',
			checked: false
		});
	});
	
	var menu = [{
		text: '&nbsp;',
		className: 'title',
		tooltip: 'Click to copy',
		handler: function (tab) {
			var clipboard = $('<input id="clipboard">').appendTo('body').val(this.children('a').text()).focus().select();
		    document.execCommand("Copy");
		    clipboard.remove();
		    $('.ui-tooltip-content').text('Copied');
		}
	}, {
		text: '&nbsp;',
		className: 'pos',
		handler: function () {
			var editor = tabs.getEditor(activeTab);
			if (editor) {
				editor.commands.exec('gotoLinePrompt', editor);
			}
		}
	}, '->', {
		text: 'Mode',
		className: 'mode',
		displayField: 'label',
		valueField: 'value',
		items: modeItems,
		disabled: true
	}];
	
	menus.create($(".ui-layout-south .status_bar"), menu);
	
	$( '.ui-layout-south .title a' ).tooltip();
	
	$(document).on("activate tabsactivate tabsremove focusEditor", function(e, ui) {
		var tab = ui.newTab ? $(ui.newTab) : $(ui);
		showTitle(tab);
		showPos(tab);
		showMode(tab);
	});
	
	$(document).on("changeSelection", function(e, tab) {
		showPos(tab);
	});
	
	$(document).on("changeMode", function(e, tab) {
		showMode(tab);
	});
}

function showTitle(tab) {
	activeTab = tab;
	
	var title = tab.children('a.ui-tabs-anchor').prop('title');
	if (!title) {
		title = tab.children('a.ui-tabs-anchor').text();
	}
	
	$('.ui-layout-south .title a').text(title);
}

function showMode(tab) {
	// get mode
	var editor = tabs.getEditor(tab);
	if (editor) {
		var mode = editor.getSession().$modeId.substr(9);
		$('.status_bar').find('[data-name='+mode+']').find('input').prop('checked', true);
		$('.status_bar .mode .ui-button-text').text($('.status_bar').find('[data-name='+mode+']').text());
		$('.status_bar .mode').removeClass('ui-state-disabled');
	} else {
		$('.status_bar .mode .ui-button-text').text('Mode');
		$('.status_bar .mode').addClass('ui-state-disabled');
	}
}

function showPos(tab) {
	var editor = tabs.getEditor(tab);
	if (!editor) {
		$('.ui-layout-south .pos a').html('&nbsp;');
		return;
	}
	
	var sel = editor.session.getSelection();
	var text = (sel.lead.row+1)+':'+(sel.lead.column+1);
	if (!sel.isEmpty()) {
		text += ' ('+(sel.anchor.row+1)+':'+(sel.anchor.column+1)+')';
	}
	$('.ui-layout-south .pos a').text(text);
}

exports.init = init;

});