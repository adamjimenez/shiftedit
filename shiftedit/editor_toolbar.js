define(["app/util", "app/menus", "app/tabs", "app/editors", "app/prefs", "app/resize", "app/site", "app/designs", "app/revisions", "app/preview", "app/modes"], function (util, menus, tabs, editors, preferences, resize, site, designs, revisions, preview ) {
var modes = require('app/modes').modes;

var saveMode = true;

var changeMode = function(tab) {
	var editor = tabs.getEditor(tab);
	var label = $(this).text().trim();
	var mode = $(this).attr('data-name');
	
	editor.focus();

	//set editor mode
	editors.setMode(editor, mode);

	//set button value
	$(this).parent().prev().children('.ui-button-text').text(label);

	var ext  = util.fileExtension(tab.data('file'));

	//save pref
	if (!saveMode) {
		return;
	}
	
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
	tooltip: 'Save',
	text: '<i class="fa fa-save"></i>',
	handler: function (tab) {
		var editor = tabs.getEditor(tab);
		editor.focus();
		tabs.save(tab);
	}
}, {
	tooltip: 'Undo',
	text: '<i class="fa fa-undo"></i>',
	handler: function (tab) {
		var editor = tabs.getEditor(tab);
		editor.focus();
		editor.undo();
	}
}, {
	tooltip: 'Redo',
	text: '<i class="fa fa-undo fa-flip-horizontal"></i>',
	handler: function (button) {
		var editor = tabs.getEditor(tab);
		editor.focus();
		editor.redo();
	}
}, {
	id: 'codeButton',
	text: '<i class="fa fa-picture-o"></i>',
	tooltip: 'Design View',
	enableToggle: true,
	handler: function (button) {
		var panel = $(this).closest('.ui-tabs-panel');
		var tab = $('[aria-controls='+panel.attr('id')+']');
		var editor = tabs.getEditor(tab);

		if (tab.data('view')==='code') {
			panel.find('.editor_status').hide();
			panel.find('.editor').hide();
			panel.find('.design').show();

			tab.data('view', 'design');
			tab.attr('data-view', 'design');

			//initiated?
			if(!tab.data('design-ready')) {
				var designs = require('app/designs');
				designs.create(tab);
				inst = tinymce.get(panel.find('.design textarea').attr('id'));
			} else {
				var inst = tinymce.get(panel.find('.design textarea').attr('id'));
				inst.setContent(editor.getValue());
			}
			
			inst.focus();
		} else {
			panel.find('.editor_status').show();
			panel.find('.design').hide();
			panel.find('.editor').show();

			tab.data('view', 'code');
			tab.attr('data-view', 'code');
			editor.focus();
		}

		$(tab).trigger('activate');
	}
}, {
	id: 'codeSplit',
	text: '<i class="fa fa-columns"></i>',
	tooltip: 'Split',
	enableToggle: true,
	items: [{
		text: 'None',
		checked: true,
		handler: function (item, checked) {
			var editor = tabs.getEditor(tab);
			var sp = window.splits[tab.attr('id')];
			if (sp.getSplits() == 2) {
				secondSession = sp.getEditor(1).session;
			}
			sp.setSplits(1);
			editor.focus();
		},
		group: 'codeSplit'
	}, {
		text: 'Below',
		checked: false,
		handler: function (tab) {
			var secondSession = null;
			var editor = tabs.getEditor(tab);
			var sp = window.splits[tab.attr('id')];
			var newEditor = (sp.getSplits() == 1);
			sp.setOrientation(sp.BELOW);
			sp.setSplits(2);
			if (newEditor) {
				var session = secondSession || sp.getEditor(0).session;
				var newSession = sp.setSession(session, 1);
				newSession.name = session.name;
				editors.applyPrefs(tab);
			}
			editor.focus();
		},
		group: 'codeSplit'
	}, {
		text: 'Beside',
		checked: false,
		handler: function (tab) {
			var secondSession = null;
			var editor = tabs.getEditor(tab);
			var sp = window.splits[tab.attr('id')];
			var newEditor = (sp.getSplits() == 1);
			sp.setOrientation(sp.BESIDE);
			sp.setSplits(2);
			if (newEditor) {
				var session = secondSession || sp.getEditor(0).session;
				var newSession = sp.setSession(session, 1);
				newSession.name = session.name;
				editors.applyPrefs(tab);
			}
			editor.focus();
		},
		group: 'codeSplit'
	}]
}, {
	text: 'Mode',
	xtype: 'combobox',
	displayField: 'label',
	valueField: 'value',
	items: modeItems
},{
	id: 'revisionButton',
	text: '<i class="fa fa-clock-o"></i>',
	tooltip: 'Revision History',
	handler: function (tab) {
		var editor = tabs.getEditor(tab);
		editor.focus();
		revisions.open(tab);
	}
}, {
	tooltip: 'Run',
	text: '<i class="fa fa-play"></i>',
	handler: function (tab) {
		preview.run(tab);
		var editor = tabs.getEditor(tab);
		editor.focus();
	}
}, '->', {
	id: 'syntaxErrorsButton',
	tooltip: 'Syntax Errors',
	text: '<i class="fa fa-warning"></i>',
	enableToggle: true,
	handler: function (tab) {
		var editor = tabs.getEditor(tab);
		editor.focus();
		
		var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);
		$(panel).find('.editor_status').toggle();
		resize.resize();
	}
}];

function create(tab) {
	var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);
	menus.create($(panel).find(".editor_toolbar"), menu, tab);

	//select mode
	var editor = tabs.getEditor(tab);
	var mode = editor.getSession().$modeId.substr(9);
	
	saveMode = false;
	$(panel).find('[data-name='+mode+']').children('a').trigger('click');
	saveMode = true;
}

return {
	create: create
};

});
