define(['exports', "jquery.menubar",'app/menus','app/lang','app/prefs', 'app/tabs', 'app/storage', 'app/main', 'app/prompt', 'app/util', 'app/shortcuts', 'app/editors', 'app/revisions', 'app/chat'], function (exports) {
var lang = require('app/lang').lang;
var makeMenuText = require('app/util').makeMenuText;
var preferences = require('app/prefs');
var prefs = {};
var tabs = require('app/tabs');
var storage = require('app/storage');
var main = require('app/main');
var prompt = require('app/prompt');
var util = require('app/util');
var menus = require('app/menus');
var shortcuts = require('app/shortcuts');
var editors = require('app/editors');

var selectionMenuItems = [{
	id: 'collapseSelection',
	text: makeMenuText(lang.collapseSelection, 'Ctrl+Shift+C'),
	handler: function () {
	    var tab = $('.ui-layout-center .ui-tabs-active');
	    var editor = tabs.getEditor(tab);
	    editor.commands.exec('fold', editor);
	},
	disabled: true,
    target: 'file'
}, {
	id: 'expandSelection',
	text: makeMenuText(lang.expandSelection, 'Ctrl+Shift+E'),
	handler: function () {
	    var tab = $('.ui-layout-center .ui-tabs-active');
	    var editor = tabs.getEditor(tab);
	    editor.commands.exec('unfold', editor);
	},
	disabled: true,
    target: 'file'
}, '-', {
	id: 'applyHTMLComment',
	text: lang.applyHTMLComment,
	handler: function () {
	    var tab = $('.ui-layout-center .ui-tabs-active');
	    var editor = tabs.getEditor(tab);
	    editor.commands.exec('wrapSelection', editor, ['<!--', '-->']);
	},
	disabled: true,
    target: 'file'
}, {
	id: 'applySlashStarComment',
	text: lang.applySlashStarComment,
	handler: function () {
	    var tab = $('.ui-layout-center .ui-tabs-active');
	    var editor = tabs.getEditor(tab);
	    editor.commands.exec('wrapSelection', editor, ['/*', '*/']);
	},
	disabled: true,
    target: 'file'
}, {
	id: 'applySlashComment',
	text: lang.applySlashComment,
	handler: function () {
	    var tab = $('.ui-layout-center .ui-tabs-active');
	    var editor = tabs.getEditor(tab);
	    editor.commands.exec('prependLineSelection', editor, ['//']);
	},
	disabled: true,
    target: 'file'
}, '-', {
	id: 'convertSingleQuotes',
	text: lang.convertSingleQuotes,
	handler: function () {
	    var tab = $('.ui-layout-center .ui-tabs-active');
	    var editor = tabs.getEditor(tab);
	    editor.commands.exec('replaceInSelection', editor, ['\'', '"']);
	},
	disabled: true,
    target: 'file'
}, {
	id: 'convertDoubleQuotes',
	text: lang.convertDoubleQuotes,
	handler: function () {
	    var tab = $('.ui-layout-center .ui-tabs-active');
	    var editor = tabs.getEditor(tab);
	    editor.commands.exec('replaceInSelection', editor, ['"', "\'"]);
	},
	disabled: true,
    target: 'file'
}, {
	id: 'convertTabs',
	text: 'Convert Tabs To Spaces',
	handler: function () {
	    var tab = $('.ui-layout-center .ui-tabs-active');
	    var editor = tabs.getEditor(tab);
	    editor.commands.exec('replaceInSelection', editor, ["\t", "    "]);
	},
	disabled: true,
    target: 'file'
}, {
	id: 'convertSpaces',
	text: lang.convertSpaces,
	handler: function () {
	    var tab = $('.ui-layout-center .ui-tabs-active');
	    var editor = tabs.getEditor(tab);
	    editor.commands.exec('replaceInSelection', editor, ["    ", "\t"]);
	},
	disabled: true,
    target: 'file'
}, {
	id: 'addLineBreaks',
	text: lang.addLineBreaks,
	handler: function () {
	    var tab = $('.ui-layout-center .ui-tabs-active');
	    var editor = tabs.getEditor(tab);
	    editor.commands.exec('appendLineSelection', editor, ['<br>']);
	},
	disabled: true,
    target: 'file'
}, '-', {
	id: 'convertToUppercase',
	text: lang.convertToUppercase,
	handler: function () {
	    var tab = $('.ui-layout-center .ui-tabs-active');
	    var editor = tabs.getEditor(tab);
	    editor.commands.exec('selectionToUppercase', editor);
	},
	disabled: true,
    target: 'file'
}, {
	id: 'convertToLowercase',
	text: lang.convertToLowercase,
	handler: function () {
	    var tab = $('.ui-layout-center .ui-tabs-active');
	    var editor = tabs.getEditor(tab);
	    editor.commands.exec('selectionToLowercase', editor);
	},
	disabled: true,
    target: 'file'
}];

function toggleOptions(target) {
    $("#menubar [data-target]").addClass('ui-state-disabled');

    if(target) {
        //get active tab
        var tab = $('.ui-layout-center .ui-tabs-active');
        var file = tab.attr('data-file');

        if(!file)
            return;

        var extension = util.fileExtension(file);

        $("#menubar [data-target='"+target+"']").each(function() {
            var show = true;
            var match = $(this).attr('data-match');
            if(match) {
                var r = new RegExp(match, "i");
                if (!r.test(extension)){
                    show = false;
                }
            }

            if(show)
                $(this).removeClass('ui-state-disabled');
        });
    }
}

function init () {
    prefs = preferences.get_prefs();

    $('body').append('<input type="file" id="upload" style="visibility: hidden;">');

    //handle uploads
    $('#upload').change(function(e){
        var files = e.target.files; // FileList object

		if (files.length === 0) {
			return;
		}
		var reader = {};
        for (var i = 0, f; file = files[i]; i++) {
			reader[i] = new FileReader();
			reader[i].onloadend = function (file, i) {
				return function () {
					editors.create(file.name, reader[i].result);
				};
			}(file, i);

            reader[i].readAsText(file);
        }
    });

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
    		}, {
    			text: makeMenuText(lang.open + '...', 'Ctrl+O'),
    			handler: function () {
    				tabs.open();
    			}
    		}, {
    			text: 'Upload',
    			handler: function(){
    			    $('#upload').click();
    			}
    		}, '-', {
    		    id: 'save',
    		    text: makeMenuText(lang.saveText, 'Ctrl+S'),
    			handler: function () {
    				tabs.save($('.ui-layout-center .ui-tabs-active'));
    			},
    			disabled: true,
    			target: 'file'
    	    }, {
    			id: 'saveAs',
    			text: makeMenuText(lang.saveAsText + '...'),
    			handler: function () {
    				tabs.saveAs($('.ui-layout-center .ui-tabs-active'));
    			},
    			disabled: true,
    			target: 'file'
    		}, {
    			id: 'saveAll',
    			text: makeMenuText(lang.saveAllText + '...', 'Ctrl+Shift+S'),
    			handler: function () {
    				tabs.saveAll();
    			},
    			disabled: true,
    			target: 'file'
    		}, {
    			id: 'minify',
    			text: lang.minify,
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
    			text: makeMenuText('Download', ''),
    			handler: function () {
    			    var tab = $('.ui-layout-center .ui-tabs-active');
    			    var editor = tabs.getEditor(tab);
            		var content = editor.getValue();
            		var filename = util.basename(tab.attr('data-file'));
            		var blob = new Blob([content]);
            		var evt = document.createEvent("HTMLEvents");
            		evt.initEvent("click");

            		var a = document.createElement('a');
            		a.download = filename;
            		a.href = URL.createObjectURL(blob);
            		a.dispatchEvent(evt);
    			},
    			disabled: true,
    			target: 'file'
    		}, {
    			id: 'revertToOriginal',
    			text: 'Revert to Saved',
    			handler: function () {
    			    var tab = $('.ui-layout-center .ui-tabs-active');
    			    var editor = tabs.getEditor(tab);

    				if( editor ){
    					editor.setValue(tab.data('original'));
    				}
    			},
    			disabled: true,
    			target: 'file'
    		}, {
    			id: 'revisionHistory',
    			text: lang.revisionHistoryText,
    			disabled: true,
    			target: 'file'
    		},/*
    		{
    			id: 'validate',
    			text: lang.validateText,
    			disabled: true,
    			target: 'file'
    		},*/ '-',
    		{
    			id: 'print',
    			text: makeMenuText(lang.print+'...', 'Ctrl+P'),
    			disabled: true,
    			target: 'file',
    			handler: function() {
    			    var tab = $('.ui-layout-center .ui-tabs-active');
			        window.open('/print?s=' + tab.attr('data-site') + '&f=' + tab.attr('data-file'));
    			}
    		}]
        },
    	 "edit": {
    		text: lang.editText,
    		items: [{
    			id: 'goToLine',
    			text: makeMenuText(lang.goToLineText, 'Ctrl+L'),
    			handler: function () {
    			    var tab = $('.ui-layout-center .ui-tabs-active');
    			    var editor = tabs.getEditor(tab);
					editor.commands.exec('gotoLinePrompt', editor);
    			},
    			disabled: true,
    			target: 'file'
    		}, '-', {
    			id: 'toggleBreakpoint',
    			text: makeMenuText('Toggle Breakpoint', 'Alt+B'),
    			handler: function () {
    			    var tab = $('.ui-layout-center .ui-tabs-active');
    			    var editor = tabs.getEditor(tab);
					editor.commands.exec('toggleBreakpoint', editor);
    			},
    			disabled: true,
    			target: 'file'
    		}, {
    			id: 'nextBreakpoint',
    			text: makeMenuText('Next Breakpoint', 'Ctrl+B'),
    			handler: function () {
    			    var tab = $('.ui-layout-center .ui-tabs-active');
    			    var editor = tabs.getEditor(tab);
					editor.commands.exec('nextBreakpoint', editor);
					editor.focus();
    			},
    			disabled: true,
    			target: 'file'
    		}, {
    			id: 'prevBreakpoint',
    			text: makeMenuText('Previous Breakpoint', 'Ctrl+Shift+B'),
    			handler: function () {
    			    var tab = $('.ui-layout-center .ui-tabs-active');
    			    var editor = tabs.getEditor(tab);
					editor.commands.exec('prevBreakpoint', editor);
					editor.focus();
    			},
    			disabled: true,
    			target: 'file'
    		}, {
    			id: 'clearBreakpoints',
    			text: makeMenuText('Clear Breakpoints'),
    			handler: function () {
    			    var tab = $('.ui-layout-center .ui-tabs-active');
    			    var editor = tabs.getEditor(tab);
					editor.commands.exec('clearBreakpoints', editor);
    			},
    			disabled: true,
    			target: 'file'
    		}, '-', {
    			id: 'toggleComment',
    			text: makeMenuText(lang.toggleComment, 'Ctrl+/'),
    			handler: function () {
    			    var tab = $('.ui-layout-center .ui-tabs-active');
    			    var editor = tabs.getEditor(tab);
					editor.toggleCommentLines();
    			},
    			disabled: true,
    			target: 'file'
    		}, {
    			id: 'jumpToMatching',
    			text: makeMenuText('Jump to Matching', 'Ctrl+P'),
    			handler: function () {
    			    var tab = $('.ui-layout-center .ui-tabs-active');
    			    var editor = tabs.getEditor(tab);
    				editor.jumpToMatching();
    				editor.focus();
    			},
    			disabled: true,
    			target: 'file'
    		}, {
    			id: 'selectToMatching',
    			text: makeMenuText('Select to Matching', 'Ctrl+Shift+P'),
    			handler: function () {
    			    var tab = $('.ui-layout-center .ui-tabs-active');
    			    var editor = tabs.getEditor(tab);
    				editor.jumpToMatching(true);
    				editor.focus();
    			},
    			disabled: true,
    			target: 'file'
    		}, '-', {
    			id: 'selection',
    			text: lang.selection,
    			disabled: true,
			    target: 'file',
    			items: selectionMenuItems,
    			handler: function () {
    				return false;
    			}
    		}, '-', {
    			id: 'copyLinesUp',
    			text: makeMenuText(lang.copyLinesUp, 'Shift+Alt+Up'),
    			handler: function () {
    			    var tab = $('.ui-layout-center .ui-tabs-active');
    			    var editor = tabs.getEditor(tab);
    				editor.copyLinesUp();
    			},
    			disabled: true,
    			target: 'file'
    		}, {
    			id: 'copyLinesDown',
    			text: makeMenuText(lang.copyLinesDown, 'Shift+Alt+Down'),
    			handler: function () {
    			    var tab = $('.ui-layout-center .ui-tabs-active');
    			    var editor = tabs.getEditor(tab);
    				editor.copyLinesDown();
    			},
    			disabled: true,
    			target: 'file'
    		}, {
    			id: 'moveLinesUp',
    			text: makeMenuText(lang.moveLinesUp, 'Alt+Up'),
    			handler: function () {
    			    var tab = $('.ui-layout-center .ui-tabs-active');
    			    var editor = tabs.getEditor(tab);
    				editor.moveLinesUp();
    			},
    			disabled: true,
    			target: 'file'
    		}, {
    			id: 'moveLinesDown',
    			text: makeMenuText(lang.moveLinesDown, 'Alt+Down'),
    			handler: function () {
    			    var tab = $('.ui-layout-center .ui-tabs-active');
    			    var editor = tabs.getEditor(tab);
    				editor.moveLinesDown();
    			},
    			disabled: true,
    			target: 'file'
    		}, {
    			id: 'deleteLines',
    			text: makeMenuText(lang.deleteLines, 'Ctrl+D'),
    			handler: function () {
    			    var tab = $('.ui-layout-center .ui-tabs-active');
    			    var editor = tabs.getEditor(tab);
					editor.commands.exec('removeline', editor);
    			},
    			disabled: true,
    			target: 'file'
    		}, '-', {
    			id: 'addSemicolon',
    			text: makeMenuText(lang.addSemicolon, 'Ctrl+;'),
    			handler: function () {
    			    var tab = $('.ui-layout-center .ui-tabs-active');
    			    var editor = tabs.getEditor(tab);
					editor.commands.exec('addSemicolon', editor);
    			},
    			disabled: true,
    			target: 'file'
    		}, {
    			id: 'applySourceFormatting',
    			text: makeMenuText('Beautify', 'Alt+Shift+F'),
    			handler: function () {
    			    var tab = $('.ui-layout-center .ui-tabs-active');
    			    var editor = tabs.getEditor(tab);
    				//editor.commands.exec('beautify', editor);
					editor.commands.exec('applySourceFormatting', editor);
    			},
    			disabled: true,
    			target: 'file'
    		}, {
    		    id: 'openPreferences',
    			text: makeMenuText(lang.preferencesText, 'Ctrl+U'),
    			scope: this
    		}]
    	},

    	"view": {
    		text: lang.viewText,
    		items: [/*{
    			text: 'Toolbars',
    			items: [{
    				id: 'standardToolbar',
    				text: lang.standardToolbar,
    				checked: Boolean(prefs.standardToolbar), // when checked has a boolean value, it is assumed to be a CheckItem
    				checkHandler: function (item, checked) {
    					var tabs = Ext.getCmp('tabs');
    					var indexes = tabs.indexes;
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
    					preferences.save();
    				}
    			},{
    				id: 'syntaxErrors',
    				text: lang.syntaxErrors,
    				checked: Boolean(prefs.syntaxErrors), // when checked has a boolean value, it is assumed to be a CheckItem
    				checkHandler: function (item, checked) {
    					var tabs = Ext.getCmp('tabs');
    					var indexes = tabs.indexes;
    					var tbar;

    					Ext.each(tabs.items.items, function (tab) {
    						if( Ext.getCmp('syntaxErrorsButton' + indexes[tab.id]) ){
    							Ext.getCmp('syntaxErrorsButton' + indexes[tab.id]).toggle(checked);
    						}
    					});

    					prefs.syntaxErrors = checked;
    					preferences.save();
    				}
    			}]
        	}, */

        	/*{
        		text: 'Default',
        		//items: defaultCodeItems,
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
        			tabs.open('customTheme.css', prefs.customTheme, 0);
        		},
        		iconCls: 'blist'
        	},*/ {
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
        			//prefs.printMargin = $(this).prop('checked');
        			preferences.save('printMargin', checked);
        		}
        	}/*, {
        		id: 'fileColumns',
        		text: 'File Columns',
        		checked: Boolean(prefs.fileColumns), // when checked has a boolean value, it is assumed to be a CheckItem
        		handler: function (item, checked) {
        			prefs.fileColumns = checked;
        			preferences.save();
        		}
        	}*/]
    	},
    	"help": {
    		text: 'Help',
    		items: [{
    			id: 'support',
    			text: lang.support,
    			handler: function() {
		            window.open('/docs/');
    			}
    		}, {
    			id: 'reportIssue',
    			text: 'Report an issue',
    			handler: function() {
		            window.open('https://github.com/adamjimenez/shiftedit/issues');
    			}
    		}, {
    			id: 'feedback',
    			text: lang.feedback,
    			handler: function() {
		            window.open('/contact');
    			}
    		}, {
    			id: 'mailingList',
    			text: lang.mailingList,
    			handler: function() {
		            window.open('http://groups.google.co.uk/group/shiftedit?hl=en"');
    			}
    		}, {
    			id: 'changelog',
    			text: lang.changelog,
    			handler: function() {
		            window.open('/changelog');
    			}
    		}, {
    			id: 'keyboardShortcuts',
    			text: makeMenuText('Shortcuts', 'Ctrl+/'),
    			handler: shortcuts.show
    		}, {
    			id: 'about',
    			text: lang.aboutShiftEdit,
    			handler: function() {
            		var d = new Date();
            		var year = d.getFullYear();
            		var edition = storage.get('edition') ? storage.get('edition') : '';
            		var title = 'ShiftEdit';
            		var version = main.getVersion();
            		var html = 'Version: '+version+'<br>Edition: ' + edition + '\
            		    <br><br>Copyright &copy; 2007-'+year+' ShiftCreate Limited. All Rights Reserved.<br>\
            		    ShiftEdit is made possible thanks to the following open source projects:<br><br> \
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
            		    height: 520
            		});
    			}
    		}]
    	},

    	'-':'->',


    	'chat': {
    		id: 'chatButton',
    		tooltip: 'Chat',
    		text: '<i class="fa fa-comment"></i>'
    	},

    	'share': {
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
    		text: storage.get('username'),
    		items: [{
    			text: lang.updateDetailsText,
    			handler: function () {
    				window.open('/update-details');
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
    		text: (storage.get('edition') == 'Trial' ? 'Trial Period' : 'Go Premier'),
    		handler: function () {
    			window.open('/premier');
    		},
    		hidden: storage.get('premier')
    	}

    };

    menus.create($("#menubar"), menu);

    $( ".ui-layout-center" ).on( "tabsactivate", function(e, ui){ toggleOptions('file') } );
    $( ".ui-layout-center" ).on( "tabsremove", function(e, ui){
        if (!$('.ui-layout-center .ui-tabs-active').length)
            toggleOptions(false);
    });
}

exports.init = init;
exports.selectionMenuItems = selectionMenuItems;

});