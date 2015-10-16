define(["jquery.menubar",'app/lang','app/prefs', 'app/tabs'], function () {
var lang = require('app/lang').lang;
var makeMenuText = require('app/util').makeMenuText;
var prefs = require('app/prefs').get_prefs();
var tabs = require('app/tabs');

//console.log(prefs);
function init () {
    console.log('menubar');
    var menu = {
        "file": {
            text: lang.fileText,
    		items: [
    		{
    			id: 'new',
    			text: makeMenuText(lang.newText + '...', 'Alt+N'),
    			handler: function () {
    				$('.ui-layout-center').tabs('add');
    			}
    		},
    		{
    			text: makeMenuText(lang.open + '...', 'Ctrl+O'),
    			handler: function () {
    				shiftedit.app.tabs.fileSearch();
    			}
    		},
    		{
    			text: 'Upload',
    		},
            '-',
    	    {
    		    id: 'save',
    		    text: makeMenuText(lang.saveText, 'Ctrl+S'),
    			handler: function () {
    				shiftedit.app.tabs.save();
    			},
    			disabled: true
    	    },
    		{
    			id: 'saveAs',
    			text: makeMenuText(lang.saveAsText + '...'),
    			handler: function () {
    				shiftedit.app.tabs.saveAs();
    			},
    			disabled: true
    		},
    		{
    			id: 'saveAll',
    			text: makeMenuText(lang.saveAllText + '...', 'Ctrl+Shift+S'),
    			handler: function () {
    				shiftedit.app.tabs.saveAll();
    			},
    			disabled: true
    		},
    		{
    			id: 'minify',
    			text: lang.minify,
    			disabled: true
    		},
    		{
    			id: 'download',
    			text: makeMenuText('Download', ''),
    			handler: function () {
    				shiftedit.app.tabs.download();
    			},
    			disabled: true
    		},
    		{
    			id: 'revertToOriginal',
    			text: 'Revert to Saved',
    			handler: function () {
    				var editor = shiftedit.app.tabs.get_editor();
    				if( editor ){
    					editor.setValue(editor.original);
    				}
    			},
    			disabled: true
    		},
    		{
    			id: 'revisionHistory',
    			text: lang.revisionHistoryText,
    			disabled: true,
    			hidden: true
    		},
    		{
    			id: 'validate',
    			text: lang.validateText,
    			disabled: true
    		}, '-',
    		{
    			id: 'print',
    			text: makeMenuText(lang.print+'...', 'Ctrl+P'),
    			disabled: true
    		}]
        },
    	 "edit": {
    		text: lang.editText,
    		items: [{
    			id: 'goToLine',
    			text: makeMenuText(lang.goToLineText, 'Ctrl+L'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().gotoLine();
    			},
    			disabled: true
    		}, '-',
    		{
    			id: 'toggleBreakpoint',
    			text: makeMenuText('Toggle Breakpoint', 'Alt+B'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().toggleBreakpoint();
    				shiftedit.app.tabs.get_editor().focus();
    			},
    			disabled: true
    		},
    		{
    			id: 'nextBreakpoint',
    			text: makeMenuText('Next Breakpoint', 'Ctrl+B'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().nextBreakpoint();
    				shiftedit.app.tabs.get_editor().focus();
    			},
    			disabled: true
    		},
    		{
    			id: 'prevBreakpoint',
    			text: makeMenuText('Previous Breakpoint', 'Ctrl+Shift+B'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().prevBreakpoint();
    				shiftedit.app.tabs.get_editor().focus();
    			},
    			disabled: true
    		},
    		{
    			id: 'clearBreakpoints',
    			text: makeMenuText('Clear Breakpoints'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().clearBreakpoints();
    				shiftedit.app.tabs.get_editor().focus();
    			},
    			disabled: true
    		}, '-',
    		{
    			id: 'toggleComment',
    			text: makeMenuText(lang.toggleComment, 'Ctrl+/'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().toggleComment();
    				shiftedit.app.tabs.get_editor().focus();
    			},
    			disabled: true
    		},
    		{
    			id: 'jumpToMatching',
    			text: makeMenuText('Jump to Matching', 'Ctrl+P'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().editor.jumpToMatching();
    				shiftedit.app.tabs.get_editor().focus();
    			},
    			disabled: true
    		},
    		{
    			id: 'selectToMatching',
    			text: makeMenuText('Select to Matching', 'Ctrl+Shift+P'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().editor.jumpToMatching(true);
    				shiftedit.app.tabs.get_editor().focus();
    			},
    			disabled: true
    		},
    		'-',
    		{
    			id: 'selection',
    			text: lang.selection,
    			disabled: true,
    			items: [{
    				id: 'collapseSelection',
    				text: makeMenuText(lang.collapseSelection, 'Ctrl+Shift+C'),
    				handler: function () {
    					shiftedit.app.tabs.get_editor().collapseSelection();
    				},
    				disabled: true
    			},{
    				id: 'expandSelection',
    				text: makeMenuText(lang.expandSelection, 'Ctrl+Shift+E'),
    				handler: function () {
    					shiftedit.app.tabs.get_editor().expandSelection();
    				},
    				disabled: true
    			}, '-',{
    				id: 'applyHTMLComment',
    				text: lang.applyHTMLComment,
    				handler: function () {
    					shiftedit.app.tabs.get_editor().wrapSelection('<!--', '-->');
    				},
    				disabled: true
    			},{
    				id: 'applySlashStarComment',
    				text: lang.applySlashStarComment,
    				handler: function () {
    					shiftedit.app.tabs.get_editor().wrapSelection('/*', '*/');
    				},
    				disabled: true
    			},{
    				id: 'applySlashComment',
    				text: lang.applySlashComment,
    				handler: function () {
    					shiftedit.app.tabs.get_editor().prependLineSelection('//');
    				},
    				disabled: true
    			}, '-',{
    				id: 'convertSingleQuotes',
    				text: lang.convertSingleQuotes,
    				handler: function () {
    					shiftedit.app.tabs.get_editor().replaceInSelection('\'', '"');
    				},
    				disabled: true
    			},{
    				id: 'convertDoubleQuotes',
    				text: lang.convertDoubleQuotes,
    				handler: function () {
    					shiftedit.app.tabs.get_editor().replaceInSelection('"', '\'');
    				},
    				disabled: true
    			},{
    				id: 'convertTabs',
    				text: 'Convert Tabs To Spaces',
    				handler: function () {
    					shiftedit.app.tabs.get_editor().replaceInSelection('	', '  ');
    				},
    				disabled: true
    			},{
    				id: 'convertSpaces',
    				text: lang.convertSpaces,
    				handler: function () {
    					shiftedit.app.tabs.get_editor().replaceInSelection('  ', '	');
    				},
    				disabled: true
    			},{
    				id: 'addLineBreaks',
    				text: lang.addLineBreaks,
    				handler: function () {
    					shiftedit.app.tabs.get_editor().appendLineSelection('<br>');
    				},
    				disabled: true
    			}, '-',{
    				id: 'convertToUppercase',
    				text: lang.convertToUppercase,
    				handler: function () {
    					shiftedit.app.tabs.get_editor().selectionToUppercase();
    				},
    				disabled: true
    			},{
    				id: 'convertToLowercase',
    				text: lang.convertToLowercase,
    				handler: function () {
    					shiftedit.app.tabs.get_editor().selectionToLowercase();
    				},
    				disabled: true
    			}],
    			handler: function () {
    				return false;
    			}
    		}, '-', {
    			id: 'copyLinesUp',
    			text: makeMenuText(lang.copyLinesUp, 'Shift+Alt+Up'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().copyLinesUp();
    			},
    			disabled: true
    		},{
    			id: 'copyLinesDown',
    			text: makeMenuText(lang.copyLinesDown, 'Shift+Alt+Down'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().copyLinesDown();
    			},
    			disabled: true
    		},{
    			id: 'moveLinesUp',
    			text: makeMenuText(lang.moveLinesUp, 'Alt+Up'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().moveLinesUp();
    			},
    			disabled: true
    		},{
    			id: 'moveLinesDown',
    			text: makeMenuText(lang.moveLinesDown, 'Alt+Down'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().moveLinesDown();
    			},
    			disabled: true
    		},{
    			id: 'deleteLines',
    			text: makeMenuText(lang.deleteLines, 'Ctrl+D'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().deleteLines();
    			},
    			disabled: true
    		}, '-',{
    			id: 'addSemicolon',
    			text: makeMenuText(lang.addSemicolon, 'Ctrl+;'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().addSemicolon();
    			},
    			disabled: true
    		}, {
    			id: 'applySourceFormatting',
    			text: makeMenuText('Beautify', 'Alt+Shift+F'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().exec('applySourceFormatting');
    			},
    			disabled: true
    		}, {
    			text: makeMenuText(lang.preferencesText, 'Ctrl+U'),
    			scope: this,
    			handler: function () {
    				shiftedit.app.preferences.edit();
    			},
    		}]
    	},
    	"view": {
    		text: lang.viewText,
    		items: [{
    			text: 'Toolbars',
    			items: [{
    				id: 'standardToolbar',
    				text: lang.standardToolbar,
    				checked: Boolean(prefs.standardToolbar), // when checked has a boolean value, it is assumed to be a CheckItem
    				checkHandler: function (item, checked) {
    					var tabs = Ext.getCmp('tabs');
    					var indexes = shiftedit.app.tabs.indexes;
    					var tbar;

    					Ext.each(tabs.items.items, function (tab) {
    						tbar = Ext.getCmp('standardToolbar' + indexes[tab.id]);
    						if (tbar) {
    							if (checked) {
    								tbar.show();
    							} else {
    								tbar.hide();
    								//tab.syncSize();
    							}
    						}
    					});
    					prefs.standardToolbar = checked;
    					shiftedit.app.preferences.save();
    				}
    			},{
    				id: 'syntaxErrors',
    				text: lang.syntaxErrors,
    				checked: Boolean(prefs.syntaxErrors), // when checked has a boolean value, it is assumed to be a CheckItem
    				checkHandler: function (item, checked) {
    					var tabs = Ext.getCmp('tabs');
    					var indexes = shiftedit.app.tabs.indexes;
    					var tbar;

    					Ext.each(tabs.items.items, function (tab) {
    						if( Ext.getCmp('syntaxErrorsButton' + indexes[tab.id]) ){
    							Ext.getCmp('syntaxErrorsButton' + indexes[tab.id]).toggle(checked);
    						}
    					});

    					prefs.syntaxErrors = checked;
    					shiftedit.app.preferences.save();
    				}
    			}]
        	}, {
        		text: 'Default',
        		//items: defaultCodeItems,
        		handler: function () {
        			return false;
        		}
        	}, {
        		text: 'Skin',
        		id: 'themesMenu',
        		items: [{
        			text: 'Grey',
        			checked: false,
        			group: 'theme'
        		},{
        			text: 'Blue',
        			checked: false,
        			group: 'theme'
        		},{
        			text: 'DarkOrange',
        			checked: false,
        			group: 'theme'
        		}],
        		handler: function () {
        			return false;
        		}
        	}, {
        		text: 'Code Theme',
        		//items: codeThemeMenuItems,
        		handler: function () {
        			return false;
        		}
        	}, {
        		id: 'customCodeTheme',
        		text: 'Custom Theme',
        		handler: function () {
        			shiftedit.app.tabs.open('customTheme.css', prefs.customTheme, 0);
        		},
        		iconCls: 'blist'
        	}, {
        		id: 'wordWrap',
        		text: lang.wordWrap,
        		checked: Boolean(prefs.wordWrap), // when checked has a boolean value, it is assumed to be a CheckItem
        		checkHandler: function (item, checked) {
        			prefs.wordWrap = checked;
        			shiftedit.app.preferences.save();
        		}
        	}, {
        		id: 'fullLineSelection',
        		text: lang.fullLineSelection,
        		checked: Boolean(prefs.fullLineSelection), // when checked has a boolean value, it is assumed to be a CheckItem
        		checkHandler: function (item, checked) {
        			prefs.fullLineSelection = checked;
        			shiftedit.app.preferences.save();
        		}
        	}, {
        		id: 'highlightActiveLine',
        		text: lang.highlightActiveLine,
        		checked: Boolean(prefs.highlightActiveLine), // when checked has a boolean value, it is assumed to be a CheckItem
        		checkHandler: function (item, checked) {
        			prefs.highlightActiveLine = checked;
        			shiftedit.app.preferences.save();
        		}
        	}, {
        		id: 'showInvisibles',
        		text: lang.showInvisibles,
        		checked: Boolean(prefs.showInvisibles), // when checked has a boolean value, it is assumed to be a CheckItem
        		checkHandler: function (item, checked) {
        			prefs.showInvisibles = checked;
        			shiftedit.app.preferences.save();
        		}
        	}, {
        		id: 'lineNumbers',
        		text: lang.lineNumbers,
        		checked: Boolean(prefs.lineNumbers), // when checked has a boolean value, it is assumed to be a CheckItem
        		checkHandler: function (item, checked) {
        			prefs.lineNumbers = checked;
        			shiftedit.app.preferences.save();
        		}
        	}, {
        		id: 'printMargin',
        		text: lang.printMargin,
        		checked: Boolean(prefs.printMargin), // when checked has a boolean value, it is assumed to be a CheckItem
        		checkHandler: function (item, checked) {
        			prefs.printMargin = checked;
        			shiftedit.app.preferences.save();
        		}
        	}, {
        		id: 'fileColumns',
        		text: 'File Columns',
        		checked: Boolean(prefs.fileColumns), // when checked has a boolean value, it is assumed to be a CheckItem
        		checkHandler: function (item, checked) {
        			prefs.fileColumns = checked;
        			shiftedit.app.preferences.save();
        		}
        	}]
    	},
    	"help": {
    		text: 'Help',
    		items: [{
    			id: 'support',
    			text: lang.support
    		},{
    			id: 'feedback',
    			text: lang.feedback
    		},{
    			id: 'mailingList',
    			text: lang.mailingList
    		},{
    			id: 'changelog',
    			text: lang.changelog
    		},{
    			id: 'keyboardShortcuts',
    			text: makeMenuText('Shortcuts', 'Ctrl+/'),
    			disabled: false
    		},{
    			id: 'about',
    			text: lang.aboutShiftEdit
    		}]
    	},


    /*
    	{
    		id: 'chatButton',
    		tooltip: 'Chat',
    		text: '<i class="fa fa-comment"></i>',
    		hidden: true
    	},

    	{
    		id: 'share',
    		text: 'Share',
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

    			var site = shiftedit.app.tabs.openSites[tab.id];
    			var file = shiftedit.app.tabs.openFiles[tab.id];

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
    							var editor = shiftedit.app.tabs.get_editor();
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
    										var editor = shiftedit.app.tabs.get_editor();
    										editor.removeFirepad();

    										if( tab.shared || shiftedit.app.site.shared[site] ){
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
    	}, {
    		text: shiftedit.app.storage.get('username'),
    		items: [{
    			text: lang.updateDetailsText,
    			handler: function () {
    				window.open('update-details');
    			}
    		}, {
    			text: lang.logOutText,
    			handler: function () {
    				location.href = 'logout';
    			}
    		}]
    	},{
    		id: 'goPremier',
    		text: (shiftedit.app.storage.get('edition') == 'Trial' ? 'Trial Period' : 'Go Premier'),
    		handler: function () {
    			window.open('premier');
    		},
    		hidden: (shiftedit.app.storage.get('premier') == 'true')
    	}
    */

    };

    function buildMenu(el, menu){
        for(var i in menu) {
            if(menu[i]==='-') {
                el.append('<li>-</li>');
            }else{
                var item = $('<li>\
                    <a href="#'+i+'">'+menu[i].text+'</a>\
                </li>').appendTo(el);

                if(menu[i].disabled) {
                    item.addClass('ui-state-disabled');
                }

                if(menu[i].handler) {
                    item.children('a').click(menu[i].handler);
                }

                if(typeof menu[i].items === 'object'){
                    var submenu = $('<ul></ul').appendTo(item);
                    buildMenu(submenu, menu[i].items);
                }
            }
        }
    }

    buildMenu($("#menubar"), menu);

    /*
    function select(event, ui) {
        console.log("Selected: " + ui.item.text());
    }
    */

    $("#menubar").menubar({
        autoExpand: true,
        menuIcon: true,
        buttons: false,
        //position: {
        //    within: $("#demo-frame").add(window).first()
        //},
        //select: select
    });
}

return {
    init: init
};

});