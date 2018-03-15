define(["./util", "./menus", "./tabs", "./editors", "./prefs", "./resize", "./site", "./designs", "./revisions", "./preview", "./modes"], function (util, menus, tabs, editors, preferences, resize, site, designs, revisions, preview, modes ) {
modes = modes.modes;

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

	var ext = util.fileExtension(tab.data('file'));

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
	className: 'undoBtn',
	text: '<i class="fa fa-undo"></i>',
	handler: function (tab) {
		if (tab.data('view')==='design') {
			var panel = $(tab).closest('.ui-layout-pane').tabs('getPanelForTab', tab);
			var inst = tinymce.get(panel.find('.design .tinymce').attr('id'));
			inst.undoManager.undo();
			inst.focus();
		} else {
			var editor = tabs.getEditor(tab);
			editor.focus();
			editor.undo();
		}
	},
	disabled: true
}, {
	tooltip: 'Redo',
	text: '<i class="fa fa-undo fa-flip-horizontal"></i>',
	handler: function (tab) {
		var editor = tabs.getEditor(tab);
		editor.focus();
		editor.redo();
	}

}, '-', {
	tooltip: 'Bold',
	text: '<i class="fa fa-bold"></i>',
	handler: function (tab) {
		var editor = tabs.getEditor(tab);
		editor.focus();
		editor.commands.exec('bold', editor);
	}
}, {
	tooltip: 'Italic',
	text: '<i class="fa fa-italic"></i>',
	handler: function (tab) {
		var editor = tabs.getEditor(tab);
		editor.focus();
		editor.commands.exec('italic', editor);
	}
}, {
	tooltip: 'Heading',
	text: '<i class="fa fa-header"></i>',
	items: [{
		text: 'Heading 1',
		handler: function (tab, checked) {
			var editor = tabs.getEditor(tab);
			editor.focus();
			editor.commands.exec('heading', editor, [1]);
		}
	}, {
		text: 'Heading 2',
		handler: function (tab, checked) {
			var editor = tabs.getEditor(tab);
			editor.focus();
			editor.commands.exec('heading', editor, [2]);
		}
	}, {
		text: 'Heading 3',
		handler: function (tab, checked) {
			var editor = tabs.getEditor(tab);
			editor.focus();
			editor.commands.exec('heading', editor, [3]);
		}
	}, {
		text: 'Heading 4',
		handler: function (tab, checked) {
			var editor = tabs.getEditor(tab);
			editor.focus();
			editor.commands.exec('heading', editor, [4]);
		}
	}, {
		text: 'Heading 5',
		handler: function (tab, checked) {
			var editor = tabs.getEditor(tab);
			editor.focus();
			editor.commands.exec('heading', editor, [5]);
		}
	}, {
		text: 'Heading 6',
		handler: function (tab, checked) {
			var editor = tabs.getEditor(tab);
			editor.focus();
			editor.commands.exec('heading', editor, [6]);
		}
	}]
}, {
	tooltip: 'Quote',
	text: '<i class="fa fa-quote-left"></i>',
	handler: function (tab) {
		var editor = tabs.getEditor(tab);
		editor.focus();
		editor.commands.exec('quote', editor);
	}
}, {
	tooltip: 'List',
	text: '<i class="fa fa-list-ul"></i>',
	handler: function (tab) {
		var editor = tabs.getEditor(tab);
		editor.focus();
		editor.commands.exec('ul', editor);
	}
}, {
	tooltip: 'Numbered List',
	text: '<i class="fa fa-list-ol"></i>',
	handler: function (tab) {
		var editor = tabs.getEditor(tab);
		editor.focus();
		editor.commands.exec('ol', editor);
	}
}, {
	tooltip: 'Create Link',
	text: '<i class="fa fa-link"></i>',
	handler: function (tab) {
		var editor = tabs.getEditor(tab);
		editor.focus();
		editor.commands.exec('createLink', editor);
	}
}, {
	tooltip: 'Insert Image',
	text: '<i class="fa fa-picture-o"></i>',
	handler: function (tab) {
		var editor = tabs.getEditor(tab);
		editor.focus();
		editor.commands.exec('insertImage', editor);
	}
}, '-', {
	id: 'codeButton',
	text: '<i class="fas fa-font"></i>',
	tooltip: 'Design View',
	enableToggle: true,
	handler: function (tab) {
		var panel = $(tab).closest('.ui-layout-pane').tabs('getPanelForTab', tab);
		var editor = tabs.getEditor(tab);
		var inst;

		if (tab.data('view')==='code') {
			panel.find('.editor_status').hide();
			panel.find('.editor').hide();
			panel.find('.design').show();

			tab.data('view', 'design');
			tab.attr('data-view', 'design');

			//initiated?
			if(!tab.data('design-ready')) {
				designs.create(tab);
				inst = tinymce.get(panel.find('.design .tinymce').attr('id'));
			} else {
				inst = tinymce.get(panel.find('.design .tinymce').attr('id'));
				inst.setContent(editor.getValue());
				inst.focus();
			}
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
	text: '<i class="far fa-clock"></i>',
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
	className: 'syntaxErrorsButton',
	tooltip: 'Syntax Errors',
	text: '<i class="fas fa-exclamation-triangle"></i>',
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
	
	// toolbar scroll
	$(panel).find(".editor_toolbar").scrollLeft(0);
}

function update(tab) {
	setTimeout(function() {
		var panel = $(tab).closest('.ui-layout-pane').tabs('getPanelForTab', tab);
		var canRedo = false;
		var canUndo = false;
		if (tab.data('view')==='code') {
			var editor = tabs.getEditor(tab);
			canRedo = editor.session.getUndoManager().canRedo();
			canUndo = editor.session.getUndoManager().canUndo();
		} else if(tab.data('view')==='design') {
			var inst = tinymce.get(panel.find('.design .tinymce').attr('id'));
			if (inst && inst.undoManager) {
				canRedo = inst.undoManager.hasRedo();
				canUndo = inst.undoManager.hasUndo();
			}
		}
		
		if (canRedo) {
			$(panel).find('.editor_toolbar .redoBtn').removeClass('ui-state-disabled');
		} else {
			$(panel).find('.editor_toolbar .redoBtn').addClass('ui-state-disabled');
		}
		
		if (canUndo) {
			$(panel).find('.editor_toolbar .undoBtn').removeClass('ui-state-disabled');
		} else {
			$(panel).find('.editor_toolbar .undoBtn').addClass('ui-state-disabled');
		}
	}, 50);
}

exports.create = create;
exports.update = update;

});