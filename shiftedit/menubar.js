define(["jquery.menubar",'app/menus','app/lang','app/prefs', 'app/tabs', 'app/storage', 'app/main', 'app/prompt', 'app/util'], function () {
var lang = require('app/lang').lang;
var makeMenuText = require('app/util').makeMenuText;
var prefs = require('app/prefs').get_prefs();
var tabs = require('app/tabs');
var storage = require('app/storage');
var main = require('app/main');
var prompt = require('app/prompt');
var util = require('app/util');
var menus = require('app/menus');

var themes = [{
	title: "Black Tie",
	name: "black-tie",
	icon: "theme_90_black_tie.png"
},
{
	title: "Blitzer",
	name: "blitzer",
	icon: "theme_90_blitzer.png"
},
{
	title: "Cupertino",
	name: "cupertino",
	icon: "theme_90_cupertino.png"
},
{
	title: "Dark Hive",
	name: "dark-hive",
	icon: "theme_90_dark_hive.png"
},
{
	title: "Dot Luv",
	name: "dot-luv",
	icon: "theme_90_dot_luv.png"
},
{
	title: "Eggplant",
	name: "eggplant",
	icon: "theme_90_eggplant.png"
},
{
	title: "Excite Bike",
	name: "excite-bike",
	icon: "theme_90_excite_bike.png"
},
{
	title: "Flick",
	name: "flick",
	icon: "theme_90_flick.png"
},
{
	title: "Hot Sneaks",
	name: "hot-sneaks",
	icon: "theme_90_hot_sneaks.png"
},
{
	title: "Humanity",
	name: "humanity",
	icon: "theme_90_humanity.png"
},
{
	title: "Le Frog",
	name: "le-frog",
	icon: "theme_90_le_frog.png"
},
{
	title: "Mint Choc",
	name: "mint-choc",
	icon: "theme_90_mint_choco.png"
},
{
	title: "Overcast",
	name: "overcast",
	icon: "theme_90_overcast.png"
},
{
	title: "Pepper Grinder",
	name: "pepper-grinder",
	icon: "theme_90_pepper_grinder.png"
},
{
	title: "Redmond",
	name: "redmond",
	icon: "theme_90_windoze.png"
},
{
	title: "Smoothness",
	name: "smoothness",
	icon: "theme_90_smoothness.png"
},
{
	title: "South Street",
	name: "south-street",
	icon: "theme_90_south_street.png"
},
{
	title: "Start",
	name: "start",
	icon: "theme_90_start_menu.png"
},
{
	title: "Sunny",
	name: "sunny",
	icon: "theme_90_sunny.png"
},
{
	title: "Swanky Purse",
	name: "swanky-purse",
	icon: "theme_90_swanky_purse.png"
},
{
	title: "Trontastic",
	name: "trontastic",
	icon: "theme_90_trontastic.png"
},
{
	title: "UI Darkness",
	name: "ui-darkness",
	icon: "theme_90_ui_dark.png"
},
{
	title: "UI Lightness",
	name: "ui-lightness",
	icon: "theme_90_ui_light.png"
},
{
	title: "Vader",
	name: "vader",
	icon: "theme_90_black_matte.png"
}];

for(var i in themes) {
    if (themes.hasOwnProperty(i)) {
        themes[i].text = themes[i].title;
        themes[i].checked = false;
        themes[i].group = 'theme';
        themes[i].cls = 'skin';
    }
}

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
    				tabs.save($('.ui-layout-center .ui-tabs-active'));
    			},
    			disabled: true,
    			target: 'file'
    	    },
    		{
    			id: 'saveAs',
    			text: makeMenuText(lang.saveAsText + '...'),
    			handler: function () {
    				tabs.saveAs($('.ui-layout-center .ui-tabs-active'));
    			},
    			disabled: true,
    			target: 'file'
    		},
    		{
    			id: 'saveAll',
    			text: makeMenuText(lang.saveAllText + '...', 'Ctrl+Shift+S'),
    			handler: function () {
    				tabs.saveAll();
    			},
    			disabled: true,
    			target: 'file'
    		},
    		{
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
    		},
    		{
    			id: 'download',
    			text: makeMenuText('Download', ''),
    			handler: function () {
    				shiftedit.app.tabs.download();
    			},
    			disabled: true,
    			target: 'file'
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
    			disabled: true,
    			target: 'file'
    		},
    		{
    			id: 'revisionHistory',
    			text: lang.revisionHistoryText,
    			disabled: true,
    			hidden: true,
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
    			target: 'file'
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
    			disabled: true,
    			target: 'file'
    		}, '-',
    		{
    			id: 'toggleBreakpoint',
    			text: makeMenuText('Toggle Breakpoint', 'Alt+B'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().toggleBreakpoint();
    				shiftedit.app.tabs.get_editor().focus();
    			},
    			disabled: true,
    			target: 'file'
    		},
    		{
    			id: 'nextBreakpoint',
    			text: makeMenuText('Next Breakpoint', 'Ctrl+B'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().nextBreakpoint();
    				shiftedit.app.tabs.get_editor().focus();
    			},
    			disabled: true,
    			target: 'file'
    		},
    		{
    			id: 'prevBreakpoint',
    			text: makeMenuText('Previous Breakpoint', 'Ctrl+Shift+B'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().prevBreakpoint();
    				shiftedit.app.tabs.get_editor().focus();
    			},
    			disabled: true,
    			target: 'file'
    		},
    		{
    			id: 'clearBreakpoints',
    			text: makeMenuText('Clear Breakpoints'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().clearBreakpoints();
    				shiftedit.app.tabs.get_editor().focus();
    			},
    			disabled: true,
    			target: 'file'
    		}, '-',
    		{
    			id: 'toggleComment',
    			text: makeMenuText(lang.toggleComment, 'Ctrl+/'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().toggleComment();
    				shiftedit.app.tabs.get_editor().focus();
    			},
    			disabled: true,
    			target: 'file'
    		},
    		{
    			id: 'jumpToMatching',
    			text: makeMenuText('Jump to Matching', 'Ctrl+P'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().editor.jumpToMatching();
    				shiftedit.app.tabs.get_editor().focus();
    			},
    			disabled: true,
    			target: 'file'
    		},
    		{
    			id: 'selectToMatching',
    			text: makeMenuText('Select to Matching', 'Ctrl+Shift+P'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().editor.jumpToMatching(true);
    				shiftedit.app.tabs.get_editor().focus();
    			},
    			disabled: true,
    			target: 'file'
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
    				disabled: true,
    			    target: 'file'
    			},{
    				id: 'expandSelection',
    				text: makeMenuText(lang.expandSelection, 'Ctrl+Shift+E'),
    				handler: function () {
    					shiftedit.app.tabs.get_editor().expandSelection();
    				},
    				disabled: true,
    			    target: 'file'
    			}, '-',{
    				id: 'applyHTMLComment',
    				text: lang.applyHTMLComment,
    				handler: function () {
    					shiftedit.app.tabs.get_editor().wrapSelection('<!--', '-->');
    				},
    				disabled: true,
    			    target: 'file'
    			},{
    				id: 'applySlashStarComment',
    				text: lang.applySlashStarComment,
    				handler: function () {
    					shiftedit.app.tabs.get_editor().wrapSelection('/*', '*/');
    				},
    				disabled: true,
    			    target: 'file'
    			},{
    				id: 'applySlashComment',
    				text: lang.applySlashComment,
    				handler: function () {
    					shiftedit.app.tabs.get_editor().prependLineSelection('//');
    				},
    				disabled: true,
    			    target: 'file'
    			}, '-',{
    				id: 'convertSingleQuotes',
    				text: lang.convertSingleQuotes,
    				handler: function () {
    					shiftedit.app.tabs.get_editor().replaceInSelection('\'', '"');
    				},
    				disabled: true,
    			    target: 'file'
    			},{
    				id: 'convertDoubleQuotes',
    				text: lang.convertDoubleQuotes,
    				handler: function () {
    					shiftedit.app.tabs.get_editor().replaceInSelection('"', '\'');
    				},
    				disabled: true,
    			    target: 'file'
    			},{
    				id: 'convertTabs',
    				text: 'Convert Tabs To Spaces',
    				handler: function () {
    					shiftedit.app.tabs.get_editor().replaceInSelection('	', '  ');
    				},
    				disabled: true,
    			    target: 'file'
    			},{
    				id: 'convertSpaces',
    				text: lang.convertSpaces,
    				handler: function () {
    					shiftedit.app.tabs.get_editor().replaceInSelection('  ', '	');
    				},
    				disabled: true,
    			    target: 'file'
    			},{
    				id: 'addLineBreaks',
    				text: lang.addLineBreaks,
    				handler: function () {
    					shiftedit.app.tabs.get_editor().appendLineSelection('<br>');
    				},
    				disabled: true,
    			    target: 'file'
    			}, '-',{
    				id: 'convertToUppercase',
    				text: lang.convertToUppercase,
    				handler: function () {
    					shiftedit.app.tabs.get_editor().selectionToUppercase();
    				},
    				disabled: true,
    			    target: 'file'
    			},{
    				id: 'convertToLowercase',
    				text: lang.convertToLowercase,
    				handler: function () {
    					shiftedit.app.tabs.get_editor().selectionToLowercase();
    				},
    				disabled: true,
    			    target: 'file'
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
    			disabled: true,
    			target: 'file'
    		},{
    			id: 'copyLinesDown',
    			text: makeMenuText(lang.copyLinesDown, 'Shift+Alt+Down'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().copyLinesDown();
    			},
    			disabled: true,
    			target: 'file'
    		},{
    			id: 'moveLinesUp',
    			text: makeMenuText(lang.moveLinesUp, 'Alt+Up'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().moveLinesUp();
    			},
    			disabled: true,
    			target: 'file'
    		},{
    			id: 'moveLinesDown',
    			text: makeMenuText(lang.moveLinesDown, 'Alt+Down'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().moveLinesDown();
    			},
    			disabled: true,
    			target: 'file'
    		},{
    			id: 'deleteLines',
    			text: makeMenuText(lang.deleteLines, 'Ctrl+D'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().deleteLines();
    			},
    			disabled: true,
    			target: 'file'
    		}, '-',{
    			id: 'addSemicolon',
    			text: makeMenuText(lang.addSemicolon, 'Ctrl+;'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().addSemicolon();
    			},
    			disabled: true,
    			target: 'file'
    		}, {
    			id: 'applySourceFormatting',
    			text: makeMenuText('Beautify', 'Alt+Shift+F'),
    			handler: function () {
    				shiftedit.app.tabs.get_editor().exec('applySourceFormatting');
    			},
    			disabled: true,
    			target: 'file'
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
        		items: themes,
        		/*items: [{
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
        		}],*/
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
    			text: lang.support,
    			handler: function() {
		            window.open('/docs/');
    			}
    		},{
    			id: 'feedback',
    			text: lang.feedback,
    			handler: function() {
		            window.open('/contact');
    			}
    		},{
    			id: 'mailingList',
    			text: lang.mailingList,
    			handler: function() {
		            window.open('http://groups.google.co.uk/group/shiftedit?hl=en"');
    			}
    		},{
    			id: 'changelog',
    			text: lang.changelog,
    			handler: function() {
		            window.open('/changelog');
    			}
    		},{
    			id: 'keyboardShortcuts',
    			text: makeMenuText('Shortcuts', 'Ctrl+/'),
    			handler: function() {
            		if (!document.getElementById('shortcutsSheet')) {
            			$.ajax({
            				url: '/screens/shortcuts',
            				success: function (result) {
            					if (!document.getElementById('shortcutsSheet')) {
            						var div = document.createElement('div');
            						div.id = 'shortcutsSheet';
            						div.innerHTML = result;
            						document.body.appendChild(div);
            					}
            				}
            			});
            		}
    			}
    		},{
    			id: 'about',
    			text: lang.aboutShiftEdit,
    			handler: function() {
            		var d = new Date();
            		var year = d.getFullYear();
            		var edition = storage.get('edition') ? storage.get('edition') : '';
            		var title = 'ShiftEdit';
            		var version = main.getVersion();
            		var html = version + ' ' + edition + '\
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
        						<a href="https://www.jstree.com/" target="_blank">JSTree</a>\
        					</td>\
        					<td>\
        						<a href="https://raw.githubusercontent.com/vakata/jstree/master/LICENSE-MIT" target="_blank">License</a>\
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
            		    height: 490
            		});
    			}
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

    menus.create($("#menubar"), menu);

    function updateTheme(name){
        var url;
        var currentStyle = [];

        //name = 'blitzer';

        var settings = {
            themepath: 'https://ajax.googleapis.com/ajax/libs/jqueryui/',
            jqueryuiversion: '1.8.10',
        };

        if (!url) {
            var urlPrefix = settings.themepath + settings.jqueryuiversion + "/themes/";
            url = urlPrefix + name + "/jquery-ui.css";
            currentStyle = $('link[href^="' + urlPrefix + '"]').first();
        }

        if (currentStyle.length) {
            currentStyle[0].href = url;
        } else {
            var style = $("<link/>")
            .attr("type","text/css")
            .attr("rel","stylesheet")
            .attr("href", url);

            style.appendTo("head");
        }

        /*
        $.cookie(settings.cookiename, data.name,
            { expires: settings.cookieexpires, path: settings.cookiepath }
        );*/
    }

    $("#menubar").on('menufocus', function(e, ui) {
        if ($(ui.item).hasClass('skin'))
            updateTheme($(ui.item).attr('data-name'));
    });

    $( ".ui-layout-center" ).on( "tabsactivate", function(e, ui){ toggleOptions('file') } );
    $( ".ui-layout-center" ).on( "tabsremove", function(e, ui){
        if (!$('.ui-layout-center .ui-tabs-active').length)
            toggleOptions(false);
    });
}

return {
    init: init
};

});