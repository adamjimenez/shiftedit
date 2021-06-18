define(['exports','./lang', './util', './prefs', './tabs', './storage', './main', './prompt','./menus',  './keybindings',  './editors', './site', './tree', './preview', './designs', './revisions', "jquery.menubar", './chat'], function (exports, lang, util, preferences, tabs,storage, main, prompt, menus, keybindings, editors, site, tree, preview, designs, revisions) {
lang = lang.lang;
var makeMenuText = util.makeMenuText;
var prefs = {};

var selectionMenuItems = [];
var activeTab;
var timer;

function toggleOptions(target, show) {
	if(target) {
		$("#menubar [data-target='"+target+"']").addClass('ui-state-disabled');
		
		if(!show) {
			return;
		}
		
		var extension;
		if (target=='file') {
			//get active tab
			var tab = activeTab;
			
			if (!tab)
				return;
			
			var file = tab.attr('data-file');
	
			if(!file)
				return;
	
			extension = util.fileExtension(file);
		}

		$("#menubar [data-target='"+target+"']").each(function() {
			show = true;
			
			if (target=='file') {
				var match = $(this).attr('data-match');
				if(match) {
					var r = new RegExp(match, "i");
					if (!r.test(extension)){
						show = false;
					}
				}
			}

			if(show)
				$(this).removeClass('ui-state-disabled');
		});
	}
}

function init () {
	prefs = preferences.get_prefs();

	$('#layout-container').append('<input type="file" id="upload" style="visibility: hidden;">');

	//handle uploads
	$('#upload').change(function(e){
		var files = e.target.files; // FileList object

		if (files.length === 0) {
			return;
		}
		var reader = {};
		for (var i = 0, f; file = files[i]; i++) {
			reader[i] = new FileReader();
			reader[i].onloadend = (function (file, i) {
				return function () {
					editors.create(file.name, reader[i].result);
				};
			}(file, i));

			reader[i].readAsText(file);
		}
	});
	
	var fileItems = [{
		id: 'new',
		text: makeMenuText(lang.newText + '...', preferences.getKeyBinding('openNewTab'), 'openNewTab'),
		handler: function () {
			$('.ui-layout-center').tabs('add');
		}
	}, {
		text: makeMenuText(lang.open + '...', preferences.getKeyBinding('open'), 'open'),
		handler: function () {
			tabs.open();
		}
	}, {
		text: lang.upload + '...',
		handler: function(){
			$('#upload').click();
		}
	}, '-', {
		id: 'save',
		text: makeMenuText(lang.saveText, preferences.getKeyBinding('save'), 'save'),
		handler: function () {
			tabs.save($('.ui-layout-center .ui-tabs-active'));
		},
		disabled: true,
		target: 'file'
	}, {
		id: 'saveAs',
		text: makeMenuText(lang.saveAsText + '...', preferences.getKeyBinding('saveAs'), 'saveAs'),
		handler: function () {
			tabs.saveAs($('.ui-layout-center .ui-tabs-active'));
		},
		disabled: true,
		target: 'file'
	}, {
		id: 'saveAll',
		text: makeMenuText(lang.saveAllText + '...', preferences.getKeyBinding('saveAll'), 'saveAll'),
		handler: function () {
			tabs.saveAll();
		},
		disabled: true,
		target: 'file'
	}, {
		id: 'minify',
		text: makeMenuText(lang.minify + '...', preferences.getKeyBinding('saveWithMinified'), 'saveWithMinified'),
		handler: function () {
			tabs.save($('.ui-layout-center .ui-tabs-active'),{
				minify: true
			});
		},
		disabled: true,
		target: 'file',
		match: 'js|css'
	}, {
		id: 'download',
		text: makeMenuText(lang.download, ''),
		handler: function () {
			tabs.download($('.ui-layout-center .ui-tabs-active'));
		},
		disabled: true,
		target: 'file'
	}, {
		id: 'revisionHistory',
		text: makeMenuText(lang.revisionHistoryText + '...', preferences.getKeyBinding('revisionHistory'), 'revisionHistory'),
		handler: function () {
			revisions.open();
		},
		disabled: true,
		target: 'site'
	}, {
		id: 'print',
		text: makeMenuText(lang.print + '...', preferences.getKeyBinding('print'), 'print'),
		disabled: true,
		target: 'file',
		handler: function() {
			var tab = activeTab;
			if (tab.attr('data-file')) {
				window.open('/print?s=' + tab.attr('data-site') + '&f=' + tab.attr('data-file'));
			}
		}
	}];
	
	var siteItems = [{
		id: 'new',
		text: lang.newText + '...',
		handler: function() {
			site.edit();
		}
	}, {
		id: 'edit',
		text: lang.editText + '...',
		disabled: true,
		target: 'site',
		handler: function() {
			site.edit(site.active());
		}
	}, {
		id: 'delete',
		text: lang.deleteText,
		disabled: true,
		target: 'site',
		handler: function() {
			site.remove(site.active());
		}
	}, {
		id: 'duplicate',
		text: lang.duplicate + '...',
		disabled: true,
		target: 'site',
		handler: function() {
			site.duplicate(site.active());
		}
	}, {
		id: 'share',
		text: lang.share + '...',
		disabled: true,
		target: 'site',
		handler: function() {
			site.share(site.active());
		}
	}, {
		id: 'database',
		text: lang.database + '...',
		disabled: true,
		target: 'site',
		handler: function() {
			site.database(site.active());
		}
	}];
	
	var editItems = [{
		id: 'undo',
		className: 'undoBtn',
		text: makeMenuText(lang.undo, 'Ctrl-Z'),
		handler: function () {
			var tab = activeTab;
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
			checkUndoRedo();
		},
		disabled: true
	}, {
		id: 'redo',
		className: 'redoBtn',
		text: makeMenuText(lang.redo, 'Ctrl-Y'),
		handler: function () {
			var tab = activeTab;
			if (tab.data('view')==='design') {
				var panel = $(tab).closest('.ui-layout-pane').tabs('getPanelForTab', tab);
				var inst = tinymce.get(panel.find('.design .tinymce').attr('id'));
				inst.undoManager.redo();
				inst.focus();
			} else {
				var editor = tabs.getEditor(tab);
				editor.focus();
				editor.redo();
			}
			checkUndoRedo();
		},
		disabled: true
	}, {
		id: 'goToLine',
		text: makeMenuText(lang.goToLineText, preferences.getKeyBinding('gotoLinePrompt'), 'gotoLinePrompt'),
		handler: function () {
			var tab = activeTab;
			var editor = tabs.getEditor(tab);
			editor.commands.exec('gotoLinePrompt', editor);
		},
		disabled: true,
		target: 'file'
	}, '-', {
		id: 'toggleBreakpoint',
		text: makeMenuText(lang.toggleBreakpoint, preferences.getKeyBinding('toggleBreakpoint'), 'toggleBreakpoint'),
		handler: function () {
			var tab = activeTab;
			var editor = tabs.getEditor(tab);
			editor.commands.exec('toggleBreakpoint', editor);
		},
		disabled: true,
		target: 'file'
	}, {
		id: 'nextBreakpoint',
		text: makeMenuText(lang.nextBreakpoint, preferences.getKeyBinding('nextBreakpoint'), 'nextBreakpoint'),
		handler: function () {
			var tab = activeTab;
			var editor = tabs.getEditor(tab);
			editor.commands.exec('nextBreakpoint', editor);
			editor.focus();
		},
		disabled: true
	}, {
		id: 'prevBreakpoint',
		text: makeMenuText(lang.previousBreakpoint, preferences.getKeyBinding('prevBreakpoint'), 'prevBreakpoint'),
		handler: function () {
			var tab = activeTab;
			var editor = tabs.getEditor(tab);
			editor.commands.exec('prevBreakpoint', editor);
			editor.focus();
		},
		disabled: true
	}, {
		id: 'clearBreakpoints',
		text: makeMenuText(lang.clearBreakpoints),
		handler: function () {
			var tab = activeTab;
			var editor = tabs.getEditor(tab);
			editor.commands.exec('clearBreakpoints', editor);
		},
		disabled: true
	}, '-', {
		id: 'toggleComment',
		text: makeMenuText(lang.toggleComment, 'Ctrl-/'),
		handler: function () {
			var tab = activeTab;
			var editor = tabs.getEditor(tab);
			editor.toggleCommentLines();
		},
		disabled: true,
		target: 'file'
	}, {
		id: 'jumpToMatching',
		text: makeMenuText(lang.jumpToMatching, preferences.getKeyBinding('jumpToMatching'), 'jumpToMatching'),
		handler: function () {
			var tab = activeTab;
			var editor = tabs.getEditor(tab);
			editor.jumpToMatching();
			editor.focus();
		},
		disabled: true,
		target: 'file'
	}, {
		id: 'selectToMatching',
		text: makeMenuText(lang.selectToMatching, preferences.getKeyBinding('selectToMatching'), 'selectToMatching'),
		handler: function () {
			var tab = activeTab;
			var editor = tabs.getEditor(tab);
			editor.jumpToMatching(true);
			editor.focus();
		},
		disabled: true,
		target: 'file'
	}, '-', {
		id: 'copyLinesUp',
		text: makeMenuText(lang.copyLinesUp, preferences.getKeyBinding('copyLinesUp'), 'copyLinesUp'),
		handler: function () {
			var tab = activeTab;
			var editor = tabs.getEditor(tab);
			editor.copyLinesUp();
		},
		disabled: true,
		target: 'file'
	}, {
		id: 'copyLinesDown',
		text: makeMenuText(lang.copyLinesDown, preferences.getKeyBinding('copyLinesDown'), 'copyLinesDown'),
		handler: function () {
			var tab = activeTab;
			var editor = tabs.getEditor(tab);
			editor.copyLinesDown();
		},
		disabled: true,
		target: 'file'
	}, {
		id: 'moveLinesUp',
		text: makeMenuText(lang.moveLinesUp, preferences.getKeyBinding('moveLinesUp'), 'moveLinesUp'),
		handler: function () {
			var tab = activeTab;
			var editor = tabs.getEditor(tab);
			editor.moveLinesUp();
		},
		disabled: true,
		target: 'file'
	}, {
		id: 'moveLinesDown',
		text: makeMenuText(lang.moveLinesDown, preferences.getKeyBinding('moveLinesDown'), 'moveLinesDown'),
		handler: function () {
			var tab = activeTab;
			var editor = tabs.getEditor(tab);
			editor.moveLinesDown();
		},
		disabled: true,
		target: 'file'
	}, {
		id: 'deleteLines',
		text: makeMenuText(lang.deleteLines, preferences.getKeyBinding('removeLine'), 'removeLine'),
		handler: function () {
			var tab = activeTab;
			var editor = tabs.getEditor(tab);
			editor.commands.exec('removeline', editor);
		},
		disabled: true,
		target: 'file'
	}, '-', {
		id: 'addSemicolon',
		text: makeMenuText(lang.addSemicolon, preferences.getKeyBinding('addSemicolon'), 'addSemicolon'),
		handler: function () {
			var tab = activeTab;
			var editor = tabs.getEditor(tab);
			editor.commands.exec('addSemicolon', editor);
		},
		disabled: true,
		target: 'file'
	}, {
		id: 'applySourceFormatting',
		text: makeMenuText(lang.beautify, preferences.getKeyBinding('applySourceFormatting'), 'applySourceFormatting'),
		handler: function () {
			var tab = activeTab;
			var editor = tabs.getEditor(tab);
			//editor.commands.exec('beautify', editor);
			editor.commands.exec('applySourceFormatting', editor);
		},
		disabled: true,
		target: 'file'
	}, {
		id: 'keyboardShortcuts',
		text: makeMenuText(lang.keyboardBindings + '...'),
		handler: preferences.openKeyBindings
	}];
	
	var viewItems = [{
		id: 'wordWrap',
		text: lang.wordWrap,
		checked: Boolean(prefs.wordWrap), // when checked has a boolean value, it is assumed to be a CheckItem
		handler: function (item, checked) {
			preferences.save('wordWrap', checked);
		}
	}, {
		id: 'fullLineSelection',
		text: lang.fullLineSelection,
		checked: Boolean(prefs.fullLineSelection), // when checked has a boolean value, it is assumed to be a CheckItem
		handler: function (item, checked) {
			preferences.save('fullLineSelection', checked);
		}
	}, {
		id: 'highlightActiveLine',
		text: lang.highlightActiveLine,
		checked: Boolean(prefs.highlightActiveLine), // when checked has a boolean value, it is assumed to be a CheckItem
		handler: function (item, checked) {
			preferences.save('highlightActiveLine', checked);
		}
	}, {
		id: 'showInvisibles',
		text: lang.showInvisibles,
		checked: Boolean(prefs.showInvisibles), // when checked has a boolean value, it is assumed to be a CheckItem
		handler: function (item, checked) {
			preferences.save('showInvisibles', checked);
		}
	}, {
		id: 'lineNumbers',
		text: lang.lineNumbers,
		checked: Boolean(prefs.lineNumbers), // when checked has a boolean value, it is assumed to be a CheckItem
		handler: function (item, checked) {
			preferences.save('lineNumbers', checked);
		}
	}, {
		id: 'printMargin',
		text: lang.printMargin,
		checked: Boolean(prefs.printMargin), // when checked has a boolean value, it is assumed to be a CheckItem
		handler: function (item, checked) {
			preferences.save('printMargin', checked);
		}
	},  {
		id: 'statusBar',
		text: 'Status bar',
		checked: Boolean(prefs.statusBar), // when checked has a boolean value, it is assumed to be a CheckItem
		handler: function (item, checked) {
			preferences.save('statusBar', checked);
		}
	}, {
		id: 'codeSplit',
		text: makeMenuText(lang.splitText, ''),
		tooltip: 'Split',
		enableToggle: true,
		disabled: true,
		target: 'file',
		handler: function () {
			var tab = activeTab;
			var sp = window.splits[tab.attr('id')];
			var editor = tabs.getEditor(tab);
			var secondSession;
			var newEditor;
			var session;
			var newSession;
			
			switch(this.value) {
				case 'beside':
					secondSession = null;
					newEditor = (sp.getSplits() == 1);
					sp.setOrientation(sp.BESIDE);
					sp.setSplits(2);
					if (newEditor) {
						session = secondSession || sp.getEditor(0).session;
						newSession = sp.setSession(session, 1);
						newSession.name = session.name;
						editors.applyPrefs(tab);
					}
				break;
				case 'below':
					secondSession = null;
					newEditor = (sp.getSplits() == 1);
					sp.setOrientation(sp.BELOW);
					sp.setSplits(2);
					if (newEditor) {
						session = secondSession || sp.getEditor(0).session;
						newSession = sp.setSession(session, 1);
						newSession.name = session.name;
						editors.applyPrefs(tab);
					}
				break;
				default:
					sp.setSplits(1);
					sp.setOrientation(sp.BESIDE);
				break;
			}
		},
		buttons: [{
			id: 'split1_0',
			text: '<i class="far fa-window-maximize"></i>',
			value: 'none',
			checked: true,
			group: 'codeSplit'
		}, {
			id: 'split2_1',
			text: '<i class="fas fa-columns fa-rotate-270"></i>',
			value: 'below',
			checked: false,
			group: 'codeSplit'
		}, {
			id: 'split2_0',
			text: '<i class="fas fa-columns"></i>',
			value: 'beside',
			checked: false,
			group: 'codeSplit'
		}]
	}, {
		id: 'toggleTreeView',
		text: makeMenuText(lang.toggleTreeView, 'Ctrl-\\'),
		handler: function (item, checked) {
			tree.toggle();
		}
	}, {
		id: 'shortcuts',
		text: makeMenuText(lang.shortcuts, 'Ctrl-/'),
		handler: function (item, checked) {
			keybindings.show();
		}
	}];
	
	var date1 = new Date(); 
	var date2 = new Date(storage.get('trial_end')); 
	  
	// To calculate the no. of days between two dates 
	var trial_days = Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 3600 * 24));

	console.log('menubar');
	var menu = {
		'mobile': {
			text: '<i class="fas fa-bars"></i>',
			className: 'mobileButton',
			items: [{text: 'File', className: 'header', disabled: true}].concat(fileItems).concat(['-']).concat([{text: 'Site', className: 'header', disabled: true}]).concat(siteItems).concat(['-']).concat([{text: 'Edit', className: 'header', disabled: true}]).concat(editItems).concat(['-']).concat([{text: 'View', className: 'header', disabled: true}]).concat(viewItems)
		}, 
		"file": {
			className: 'desktopButton',
			text: lang.fileText,
			items: fileItems
		},
		 "site": {
			className: 'desktopButton',
			text: lang.siteText,
			items: siteItems
		},
		 "edit": {
			className: 'desktopButton',
			text: lang.editText,
			items: editItems
		},
		"view": {
			className: 'desktopButton',
			text: lang.viewText,
			items: viewItems
		},
		
		'save': {
			tooltip: lang.saveText + ' (Ctrl-S)',
			className: 'fileButton saveBtn',
			text: '<i class="far fa-save"></i>',
			handler: function () {
				var tab = activeTab;
				var editor = tabs.getEditor(tab);
				editor.focus();
				tabs.save(tab);
			},
			hidden: true
		}, 
		
		'undo': {
			tooltip: lang.undo + ' (Ctrl-Z)',
			className: 'fileButton undoBtn',
			text: '<i class="fa fa-undo"></i>',
			handler: function () {
				var tab = activeTab;
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
				checkUndoRedo();
			},
			disabled: true,
			hidden: true
		}, 
		
		'redo': {
			tooltip: lang.redo + ' (Ctrl-Y)',
			className: 'fileButton redoBtn',
			text: '<i class="fa fa-undo fa-flip-horizontal"></i>',
			handler: function () {
				var tab = activeTab;
				if (tab.data('view')==='design') {
					var panel = $(tab).closest('.ui-layout-pane').tabs('getPanelForTab', tab);
					var inst = tinymce.get(panel.find('.design .tinymce').attr('id'));
					inst.undoManager.redo();
					inst.focus();
				} else {
					var editor = tabs.getEditor(tab);
					editor.focus();
					editor.redo();
				}
				checkUndoRedo();
			},
			disabled: true,
			hidden: true
		}, 
		
		'code': {
			className: 'fileButton codeBtn',
			target: 'file',
			match: 'htm|html|php',
			text: '<i class="fas fa-font"></i>',
			tooltip: lang.designView,
			enableToggle: true,
			handler: function () {
				var tab = activeTab;
				var panel = $(tab).closest('.ui-layout-pane').tabs('getPanelForTab', tab);
				var editor = tabs.getEditor(tab);
				var inst;
				var code;
				
				var extension = util.fileExtension(tab.data('file'));
				if (!extension.match(menu.code.match)) {
					return false;
				}
		
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
						code = editor.getValue();
						inst.setContent(code);
						
						designs.updateDesignSelection(inst);
						
						inst.focus();
					}
				} else {
					// preserve selection
					inst = tinymce.get(panel.find('.design .tinymce').attr('id'));
					designs.updateEditorSelection(inst);

					panel.find('.editor_status').show();
					panel.find('.design').hide();
					panel.find('.editor').show();
		
					tab.data('view', 'code');
					tab.attr('data-view', 'code');
					
					editor.focus();
					editor.renderer.scrollCursorIntoView(null, 0.5);
				}
		
				$(tab).trigger('activate', [tab]);
			},
			hidden: true
		}, 
		
		'run': {
			tooltip: lang.run,
			className: 'fileButton previewBtn',
			text: '<i class="fa fa-play"></i>',
			handler: function () {
				var tab = activeTab;
				preview.run(tab);
				var editor = tabs.getEditor(tab);
				editor.focus();
			},
			hidden: true
		},

		'->':'->',

		'chat': {
			id: 'chatButton',
			tooltip: lang.chat,
			text: '<i class="fa fa-comment"></i>',
			disabled: true
		},

		'share': {
			id: 'share',
			text: lang.share,
			hidden: true,
			handler: function () {
				if( prefs.useMasterPassword ){
					Ext.MessageBox.alert('Notice', 'You can not share files when Master Password feature is enabled.');
					return;
				}

				var tab = Ext.getCmp('tabs').getActiveTab();

				if( !tab ){
					return;
				}

				var site = tabs.openSites[tab.id];
				var file = tabs.openFiles[tab.id];

				//share window
				var shareWin = new Ext.Window({
					id: 'shareWin',
					layout: 'fit',
					width: 400,
					height: 200,
					minWidth: 400,
					minHeight: 200,
					closeAction: 'destroy',
					plain: true,
					modal: true,
					title: 'Share',
					items: [{
						xtype: 'form',
						bodyStyle: 'padding:5px;border:0',
						items: [{
							xtype:'textfield',
							fieldLabel: 'Link to share',
							name: 'share_url',
							value: 'https://shiftedit.net/home#'+site+'/'+file,
							anchor: '100%'
						},{
							id: 'allow',
							xtype: 'checkbox',
							inputType: 'checkbox',
							fieldLabel: 'Allow anyone with link to edit',
							name: 'allow',
							value: 1,
							inputValue: 1,
							labelWidth: 160,
							checked: tab.shared
						}]
					}],
					buttons: [{
						text: 'OK',
						handler: function (button) {
							//prevent double click
							button.disable();

							var allow = Ext.getCmp('allow').getValue();

							if(!allow){
								//remove firebase before it's deleted!
								var editor = editor;
								editor.removeFirepad();
							}

							Ext.Ajax.request({
								url: '/_ajax/share.php',
								params: {
									allow: allow,
									site: site,
									file: file
								},
								method: 'POST',
								success: function (result, request) {
									var o;
									try {
										o = Ext.decode(result.responseText);
									} catch (ex) {
										Ext.MessageBox.alert(lang.errorText, result.responseText);
									}

									if (o.success) {
										if( tab.shared != allow ){
											tab.shared = allow;

											//switch firebase
											var editor = editor;
											editor.removeFirepad();

											if( tab.shared || site.shared[site] ){
												var content = editor.getValue();
												editor.setValue('');
												editor.addFirepad(content);
											}
										}

										Ext.getCmp('shareWin').close();
									}else{
										Ext.MessageBox.alert(lang.failedText, lang.errorText + ': ' + o.error);
									}
								},
								failure: function (result, request) {
									Ext.MessageBox.alert(lang.failedText, 'Connection error');
								}
							});
						}
					}, {
						text: 'Close',
						handler: function () {
							Ext.getCmp('shareWin').close();
						}
					}]
				});
				shareWin.center();
				shareWin.show();
			},
			cls: 'shareBtn',
			disabled: true
		},

		name: {
			text: '<i class="fas fa-user"></i>',
			items: [{
				text: '<img src="' + storage.get('avatar') + '">' + storage.get('username'), 
				className: 'header', 
				disabled: true
			}, {
				text: lang.accountText,
				handler: function () {
					window.open('/account');
				}
			}, {
				text: lang.logOutText,
				handler: function () {
					location.href = '/logout';
				}
			}]
		},

		upgrade: {
			id: 'goPremier',
			text: (storage.get('edition') == 'Trial' ? 'Trial Period: ' + trial_days + 'd' : 'Go Premier'),
			handler: function () {
				window.open('/premier');
			},
			hidden: ['Basic', 'Business', 'Premier'].indexOf(storage.get('edition'))!==-1
		},

		"help": {
			text: '<i class="fas fa-cog"></i>',
			items: [{
				id: 'preferences',
				text: makeMenuText(lang.preferencesText, 'Ctrl-U'),
				handler: preferences.open
			}, '-', {
				id: 'reportIssue',
				text: lang.reportAnIssue,
				handler: function() {
					window.open('https://github.com/adamjimenez/shiftedit/issues');
				}
			}, {
				id: 'about',
				text: lang.aboutShiftEdit + '...',
				handler: function() {
					var d = new Date();
					var year = d.getFullYear();
					var edition = storage.get('edition') ? storage.get('edition') : '';
					var title = 'ShiftEdit';
					var version = main.getVersion();
					var html = 'Version: '+version+'<br>Edition: ' + edition + '\
						<br><br>Copyright &copy; 2007-'+year+' ShiftCreate Limited. All Rights Reserved.<br>\
						ShiftEdit is made possible thanks to the following open source projects:<br>\
						<table width="100%">\
						<tr>\
							<td>\
								<a href="http://ace.ajax.org/" target="_blank">Ace</a>\
							</td>\
							<td>\
								<a href="https://raw.github.com/ajaxorg/ace/master/LICENSE" target="_blank">License</a>\
							</td>\
						</tr>\
						<tr>\
							<td>\
								<a href="http://coffeelint.org/" target="_blank">Coffee Lint</a>\
							</td>\
							<td>\
								<a href="https://raw.github.com/clutchski/coffeelint/master/LICENSE" target="_blank">License</a>\
							</td>\
						</tr>\
						<tr>\
							<td>\
								<a href="http://csslint.net/" target="_blank">CSS Lint</a>\
							</td>\
							<td>\
								<a href="https://raw.github.com/stubbornella/csslint/master/LICENSE" target="_blank">License</a>\
							</td>\
						</tr>\
						</tr>\
						<tr>\
							<td>\
								<a href="https://diff2html.rtfpessoa.xyz/" target="_blank">Diff2HTML</a>\
							</td>\
							<td>\
								<a href="https://raw.githubusercontent.com/rtfpessoa/diff2html/master/LICENSE" target="_blank">License</a>\
							</td>\
						</tr>\
						<tr>\
							<td>\
								<a href="http://fortawesome.github.io/Font-Awesome/" target="_blank">Font Awesome</a>\
							</td>\
							<td>\
								<a href="http://fontawesome.io/license/" target="_blank">License</a>\
							</td>\
						</tr>\
						<tr>\
							<td>\
								<a href="https://jquery.com/" target="_blank">jQuery</a>\
							</td>\
							<td>\
								<a href="https://raw.githubusercontent.com/jquery/jquery/master/LICENSE.txt" target="_blank">License</a>\
							</td>\
						</tr>\
						<tr>\
							<td>\
								<a href="http://swisnl.github.io/jQuery-contextMenu/" target="_blank">jQuery Contextmenu</a>\
							</td>\
							<td>\
								<a href="http://opensource.org/licenses/mit-license" target="_blank">License</a>\
							</td>\
						</tr>\
						<tr>\
							<td>\
								<a href="https://jqueryui.com/" target="_blank">jQuery UI</a>\
							</td>\
							<td>\
								<a href="https://raw.githubusercontent.com/jquery/jquery-ui/master/LICENSE.txt" target="_blank">License</a>\
							</td>\
						</tr>\
						<tr>\
							<td>\
								<a href="https://github.com/kpdecker/jsdiff" target="_blank">JSDiff</a>\
							</td>\
							<td>\
								<a href="https://raw.github.com/kpdecker/jsdiff/master/LICENSE" target="_blank">License</a>\
							</td>\
						</tr>\
						<tr>\
							<td>\
								<a href="http://jshint.com/" target="_blank">JSHint</a>\
							</td>\
							<td>\
								<a href="https://raw.github.com/jshint/jshint/master/LICENSE" target="_blank">License</a>\
							</td>\
						</tr>\
						<tr>\
							<td>\
								<a href="https://www.jstree.com/" target="_blank">jsTree</a>\
							</td>\
							<td>\
								<a href="https://raw.githubusercontent.com/vakata/jstree/master/LICENSE-MIT" target="_blank">License</a>\
							</td>\
						</tr>\
						<tr>\
							<td>\
								<a href="https://github.com/adamjimenez/jstree-table" target="_blank">jsTreeTable</a>\
							</td>\
							<td>\
								<a href="https://raw.githubusercontent.com/adamjimenez/jstree-table/master/LICENSE" target="_blank">License</a>\
							</td>\
						</tr>\
						<tr>\
							<td>\
								<a href="https://github.com/markdown-it/markdown-it" target="_blank">Markdown it</a>\
							</td>\
							<td>\
								<a href="https://github.com/markdown-it/markdown-it/blob/master/LICENSE" target="_blank">License</a>\
							</td>\
						</tr>\
						<tr>\
							<td>\
								<a href="https://www.tinymce.com/" target="_blank">TinyMce</a>\
							</td>\
							<td>\
								<a href="https://github.com/tinymce/tinymce/blob/master/LICENSE.TXT" target="_blank">License</a>\
							</td>\
						</tr>\
						<tr>\
							<td>\
								<a href="http://layout.jquery-dev.com/" target="_blank">UI Layout</a>\
							</td>\
							<td>\
								<a href="https://raw.githubusercontent.com/allpro/layout/master/LICENSE.txt" target="_blank">License</a>\
							</td>\
						</tr>\
						</table>\
						<br>\
						<p>Special thanks to all the Premier subscribers who help to make my dreams a reality.</p>';

					prompt.alert({
						title: title,
						msg: html,
						width: 500,
						height: 520,
						show: { effect: "fade", duration: 250 } 
					});
				}
			}, {
				id: 'support',
				text: lang.help,
				handler: function() {
					window.open('/docs/');
				}
			}]
		}
	};

	menus.create($("#menubar"), menu);
	
	var undoEnabled = false;
	var redoEnabled = false;
	function checkUndoRedo() {
		tab = activeTab;
		
		if (tab) {
			//redo undo
			var canRedo = false;
			var canUndo = false;
			if (tab.data('view')==='code') {
				var firepad = $(tab).data('firepad');
				
				// chechk if ready
				if (firepad && !firepad.client_) {
					return;
				}
				
				var editor = tabs.getEditor(tab);
				var undoManager = firepad ? firepad.client_.undoManager : editor.session.getUndoManager();
				canRedo = undoManager.canRedo();
				canUndo = undoManager.canUndo();
			} else if(tab.data('view')==='design') {
				var panel = $(tab).closest('.ui-layout-pane').tabs('getPanelForTab', tab);
				var inst = tinymce.get(panel.find('.design .tinymce').attr('id'));
				if (inst && inst.undoManager) {
					canRedo = inst.undoManager.hasRedo();
					canUndo = inst.undoManager.hasUndo();
				}
			}
			
			if (canRedo) {
				if (!redoEnabled) {
					$('#menubar .redoBtn').removeClass('ui-state-disabled');
					redoEnabled = true;
				}
			} else {
				if (redoEnabled) {
					$('#menubar .redoBtn').addClass('ui-state-disabled');
					redoEnabled = false;
				}
			}
			
			if (canUndo) {
				if (!undoEnabled) {
					$('#menubar .undoBtn').removeClass('ui-state-disabled');
					undoEnabled = true;
				}
			} else {
				if (undoEnabled) {
					$('#menubar .undoBtn').addClass('ui-state-disabled');
					undoEnabled = false;
				}
			}	
		}
	}
	
	var inFile = false;
	var breakpointEnabled = false;
	function checkButtons(tab) {
		var editor = tabs.getEditor(tab);
		
		if (editor) {
			if (!inFile) {
				inFile = true;
			
				toggleOptions('file', true);
			
				// preview button
				var disable = false;
				var mode = editor.getSession().$modeId.replace('ace/mode/', '');
				if (mode !== 'markdown') {
					var siteId = tab.data('site');
					if(!siteId) {
						disable = true;
					} else {
						var settings = site.getSettings(siteId);
						if(!settings.web_url) {
							disable = true;
						}
					}
				}

				if (disable) {
					$('#menubar .previewBtn').addClass('ui-state-disabled');
				} else {
					$('#menubar .previewBtn').removeClass('ui-state-disabled');
				}
				
				$('.fileButton').show();
			}
			
			// save button
			if (tab.data('edited')) {
				$('#menubar .saveBtn').removeClass('ui-state-disabled');
			} else {
				$('#menubar .saveBtn').addClass('ui-state-disabled');
			}
			
			// split state
			var sp = window.splits[tab.attr('id')];
			var input = $('#split'+sp.getSplits()+'_'+sp.getOrientation() + ' input');
			if (!input.prop('checked')) {
				input.prop('checked', true);
				$('#menubar input[name=codeSplit]').checkboxradio('refresh');
			}
			
			checkUndoRedo();
			
			// breakpoint buttons
			if (Object.keys(editor.session.getBreakpoints()).length) {
				if (!breakpointEnabled) {
					$('#prevBreakpoint, #nextBreakpoint, #clearBreakpoints').removeClass('ui-state-disabled');
					breakpointEnabled = true;
				}
			} else {
				if (breakpointEnabled) {
					$('#prevBreakpoint, #nextBreakpoint, #clearBreakpoints').addClass('ui-state-disabled');
					breakpointEnabled = false;
				}
			}
		} else {
			disableFileButtons();
		}
	}
	
	function disableFileButtons() {
		if (inFile) {
			inFile = false;
			$('.fileButton').hide();
			toggleOptions('file', false);
		}
	}
	
	$(document).on("focusEditor editorChange", function(e, tab) {
		activeTab = tab;
		clearTimeout(timer);
		timer = setTimeout(function() {checkButtons(tab);}, 50);
	});
	
	$(window).on( "tabsadd tabsactivate", function(e, ui) {
		var tab = ui.newTab ? ui.newTab : ui.tab;
		if (activeTab && activeTab.parent().has(tab).length) {
			disableFileButtons();
			activeTab = $(tab);
		}
	});
	
	$(window).on( "tabsremove", function(e, ui) {
		if (activeTab && activeTab.attr('id') === ui.tabId) {
			disableFileButtons();
			activeTab = null;
		}
	});
	
	$(window).on( "siteEnable", function(e, ui){
		console.log('show site');
		toggleOptions('site', true); 
	});
	
	$( window ).on( "siteDisable", function(e, ui){ 
		console.log('hide site');
		toggleOptions('site', false); 
	});
	
	// stop buttons from de-activating
	$('#menubar').on('menublur', function(event) {
		setTimeout(function() {checkButtons(activeTab);}, 10);
	});
}

exports.init = init;

});