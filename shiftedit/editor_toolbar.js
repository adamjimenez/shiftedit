define(["app/menus", "app/tabs"], function (menus, tabs) {
	var menu = [{
		tooltip: 'Save',
		text: '<i class="fa fa-save"></i>',
		handler: function (tab) {
			tabs.save(tab);
		}
	}, {
		tooltip: 'Undo',
		text: '<i class="fa fa-undo"></i>',
		handler: function (tab) {
			tabs.getEditor(tab).undo();
		}
	}, {
		tooltip: 'Redo',
		text: '<i class="fa fa-undo fa-flip-horizontal"></i>',
		handler: function (button) {
			tabs.getEditor(tab).redo();
		}
	}, /*{
		id: 'codeButton',
		text: '<i class="fa fa-picture-o"></i>',
		tooltip: 'Design View',
		enableToggle: true,
		handler: function (button) {
			toggleView(this.pressed);
		}
	},*/ {
		id: 'codeSplit',
		text: '<i class="fa fa-columns"></i>',
		tooltip: 'Split',
		enableToggle: true,
		items: [{
			text: 'None',
			checked: true,
			checkHandler: function (item, checked) {
				if (checked) {
					var editor = shiftedit.app.tabs.get_editor();
					var sp = editor.editor.split;
					if (sp.getSplits() == 2) {
						secondSession = sp.getEditor(1).session;
					}
					sp.setSplits(1);
				}
			},
			group: 'codeSplit'
		}, {
			text: 'Below',
			checked: false,
			checkHandler: function (item, checked) {
				if (checked) {
					var secondSession = null;
					var editor = shiftedit.app.tabs.get_editor();
					var sp = editor.editor.split;
					var newEditor = (sp.getSplits() == 1);
					sp.setOrientation(sp.BELOW);
					sp.setSplits(2);
					if (newEditor) {
						var session = secondSession || sp.getEditor(0).session;
						var newSession = sp.setSession(session, 1);
						newSession.name = session.name;
						editor.applyEditorPrefs();
					}
				}
			},
			group: 'codeSplit'
		}, {
			text: 'Beside',
			checked: false,
			checkHandler: function (item, checked) {
				if (checked) {
					var secondSession = null;
					var editor = shiftedit.app.tabs.get_editor();
					var sp = editor.editor.split;
					var newEditor = (sp.getSplits() == 1);
					sp.setOrientation(sp.BESIDE);
					sp.setSplits(2);
					if (newEditor) {
						var session = secondSession || sp.getEditor(0).session;
						var newSession = sp.setSession(session, 1);
						newSession.name = session.name;
						editor.applyEditorPrefs();
					}
				}
			},
			group: 'codeSplit'
		}]
	}, {
	    text: 'Mode',
		xtype: 'combobox',
		id: 'language',
		displayField: 'label',
		valueField: 'value',
		items: []
	},{
		id: 'revisionButton',
		text: '<i class="fa fa-clock-o"></i>',
		tooltip: 'Revision History',
		handler: function (tab) {
			revisions.show(tab);
		}
	}, {
		id: 'syntaxErrorsButton',
		tooltip: 'Syntax Errors',
		text: '<i class="fa fa-warning"></i>',
		enableToggle: true,
		handler: function (tab) {
		    var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);
		    $(panel).find('.editor_status').toggle();
		}
	}];

	function create(tab) {
	    var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);
	    menus.create($(panel).find(".editor_toolbar"), menu, tab);
	}

    return {
        create: create
    };
});