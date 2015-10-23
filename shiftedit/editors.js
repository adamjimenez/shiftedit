define(['app/tabs', 'exports', 'jquery','ace',"app/tabs", "app/util", "app/modes", 'jquery','app/lang','app/syntax_errors', "app/editor_toolbar", 'app/prompt','app/editor_contextmenu','app/autocomplete', 'ace/autocomplete','ace/split'], function (tabs, exports) {
var util = require('app/util');
var syntax_errors = require('app/syntax_errors');
var lang = require('app/lang').lang;
var modes = require('app/modes').modes;
var editor;
var editor_toolbar = require('app/editor_toolbar');
var editor_contextmenu = require('app/editor_contextmenu');
var prompt = require('app/prompt');
var autocomplete = require('app/autocomplete');
var Autocomplete = require("ace/autocomplete").Autocomplete;

function onChange(e) {
    var tabs = require("app/tabs");
	tabs.setEdited(this, true);
}

function onGutterClick(e, editor) {
	if( e.domEvent.button == 2 ){
		var s = editor.getSession();
		var className =  e.domEvent.target.className;
		if (className.indexOf('ace_fold-widget') < 0) {
			if (className.indexOf("ace_gutter-cell") != -1) {
				var row = e.getDocumentPosition().row;

        		if( s.$breakpoints[row] ){
        			s.clearBreakpoint(row);
        		}else{
        			s.setBreakpoint(row);
        		}

				e.stop();
			}
		}
	}
}

function saveState() {
	var site = $(this).attr('data-site');
	var file = $(this).attr('data-file');

	if (site && file) {
		console.log('save state');

		var session = editor.getSession();

		var folds = session.getAllFolds().map(function (fold) {
			return {
				start: fold.start,
				end: fold.end,
				placeholder: fold.placeholder
			};
		});

		var sel = session.getSelection();

		var breakpoints = [];

		for( i=0; i<session.$breakpoints.length; i++ ){
			if( session.$breakpoints[i] ){
				breakpoints.push(i);
			}
		}

		var state = {
			scrolltop: session.getScrollTop(),
			scrollleft: session.getScrollLeft(),
			selection: sel.getRange(),
			folds: folds,
			breakpoints: breakpoints
		};

		$.post('/api/files?cmd=state&site='+site, {
			file: file,
			state: JSON.stringify(state)
		});
	}
}

function restoreState(state) {
	//restore folds and breakpoints
	if (state) {
		console.log('restore state');
		state = JSON.parse(state);

		var Range = require("ace/range").Range;
		var session = editor.getSession();
		//are those 3 lines set the values in per document base or are global for editor
		editor.selection.setSelectionRange(state.selection, false);
		session.setScrollTop(state.scrolltop);
		session.setScrollLeft(state.scrollleft);
		if (state.folds) {
			for (var i = 0, l = state.folds.length; i < l; i++) {
				var fold = state.folds[i];
				//console.log(fold);
				var range = Range.fromPoints(fold.start, fold.end);
				//console.log(range);
				session.addFold(fold.placeholder, range);
			}
		}

		// if newfile == 1 and there is text cached, restore it
		var node = session.getNode && session.getNode();
		if (node && parseInt(node.getAttribute("newfile") || 0, 10) === 1 && node.childNodes.length) {
			// the text is cached within a CDATA block as first childNode of the <file>
			if (session.getNode().childNodes[0] instanceof CDATASection) {
				session.setValue(doc.getNode().childNodes[0].nodeValue);
			}
		}

		//console.log(state.breakpoints);
		if(state.breakpoints){
			session.setBreakpoints(state.breakpoints);
		}
	}
}

function refresh(tab) {
	//editor.resize();

	window.splits[tab.attr('id')].forEach(
		function (editor) {
	        editor.setTheme("ace/theme/monokai");
		}
	);
}

function create(file, content, siteId, options) {
    if(!options){
        options = {};
    }

    //create tab
	tab = $(".ui-layout-center").tabs('add', file, '<div class="editor_toolbar"></div>\
	<div class="editor_status" data-currentError="0">\
    <button class="previous" type="button" disabled>\
    <i class="fa fa-arrow-left"></i></button> \
    <button class="next" type="button" disabled>\
    <i class="fa fa-arrow-right"></i></button> \
    <button class="fix" type="button" disabled>Fix</button> \
    <span class="status" style="font-size:11px;">' + lang.noSyntaxErrorsText + '</span>\
	</div>\
	\
	<div class="editor"></div>');

	tab.data(file, file);
	tab.attr('data-file', file);
	tab.attr('title', file);

	if(siteId) {
	    tab.data('site', siteId);
	    tab.attr('data-site', siteId);
	}

	if(options.mdate) {
	    tab.data('mdate', options.mdate);
	    tab.attr('data-mdate', options.mdate);
	}

    tab.data('original', content);

    $(".ui-layout-center").trigger("tabsactivate", [{newTab:tab}]);

	//load ace

	//fixme panels can be in other tabarea
	var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);

	// Splitting
	var container = panel.children('.editor')[0];
	//editor = ace.edit(container);

	var Split = require("ace/split").Split;
	var theme = require("ace/theme/textmate");
	var split = new Split(container, theme, 1);
	editor = split.getEditor(0);
	editor.setTheme("ace/theme/monokai");
	editor.split = split;

	//split isn't properly implemented in Ace so we have to use globals :|
	if(!window.splits) window.splits = {};
	window.splits[tab.attr('id')] = split;

	var session = editor.getSession();

	//syntax bar handlers
	panel.find('.previous').click(jQuery.proxy(syntax_errors.previous, tab));

	panel.find('.next').click(jQuery.proxy(syntax_errors.next, tab));

	//set mode
	var ext = util.fileExtension(file);
	var mode = 'text';

	//check default file associations
	modes.forEach(function (item) {
		if (item[2].indexOf(ext) !== -1) {
			mode = item[0];
			return;
		}
	});

	editor.getSession().setMode("ace/mode/"+mode);
	editor.getSession().getDocument().setValue(content);

	//clear history //fixes undo redo when using split
	var UndoManager = require("ace/undomanager").UndoManager;
	editor.getSession().setUndoManager(new UndoManager());

    //event listeners
	editor.getSession().doc.on('change', jQuery.proxy(onChange, tab));
	editor.getSession().on('changeFold', jQuery.proxy(saveState, tab));
	editor.getSession().on('changeBreakpoint', jQuery.proxy(saveState, tab));
	editor.getSession().on("changeAnnotation", jQuery.proxy(syntax_errors.update, tab));
	editor.on('guttermousedown', jQuery.proxy(onGutterClick, tab));

	//autocomplete
	editor.completer = new Autocomplete();

	//remove tab command
	editor.completer.keyboardHandler.removeCommand('Tab');
	editor.completer.liveAutocompletionAutoSelect = true;
	editor.completer.exactMatch = true;

	editor.setOptions({
		enableBasicAutocompletion: true,
		enableLiveAutocompletion: true
	});


    window.shiftedit.defs[$(tab).attr('id')] = {
        'definitions': {},
	    'definitionRanges': {}
    };
	var shifteditCompleter = {
	    getCompletions: function(editor, session, pos, prefix, callback) {
	        var completions = autocomplete.run(editor, session, pos, prefix, callback);
	        //console.log(completions);

	        if (completions) {
	        	callback(null, completions);
	        }
	    },
	    getDocTooltip: function(selected){
	    	if (selected.doc) {
		    	return {
		    		docHTML: selected.doc
		    	};
	    	}
	    }
	};

	//var language_tools = require("ace/ext/language_tools");
	//editor.completers = [language_tools.keyWordCompleter];
	editor.completers = [shifteditCompleter];

	//shortcuts
	editor.commands.addCommand({
		name: "save",
		bindKey: {
			win: "Ctrl-S",
			mac: "Command-S",
			sender: "editor"
		},
		exec: jQuery.proxy(function (editor, args, request) {
			return tabs.save(this);
		}, tab)
	});
	editor.commands.addCommand({
		name: "saveAs",
		bindKey: {
			win: "Ctrl-Alt-S",
			mac: "Command-Alt-S",
			sender: "editor"
		},
		exec: jQuery.proxy(function (editor, args, request) {
			return tabs.saveAs(this);
		}, tab)
	});
	editor.commands.addCommand({
		name: "gotoLinePrompt",
		bindKey: {
			win: "Ctrl-G",
			mac: "Command-G",
			sender: "editor"
		},
		exec: function (editor, args, request) {
			prompt.prompt({
			    title: 'Go to Line',
			    fn :function (button, line) {
    				if (button == 'ok') {
    					editor.gotoLine(line);
    					setTimeout(function(){editor.focus()}, 50);
    				}
			    }
			});
			return true;
		}
	});
	editor.commands.addCommand({
		name: "toggleBreakpoint",
		bindKey: {
			win: "Ctrl-F2|Alt-b",
			mac: "Command-F2|Alt-b",
			sender: "editor"
		},
		exec: function (editor, args, request) {
			var cursor = editor.getCursorPosition();
			row = cursor.row;

    		var s = editor.getSession();

    		if( s.$breakpoints[row] ){
    			s.clearBreakpoint(row);
    		}else{
    			s.setBreakpoint(row);
    		}
		}
	});
	editor.commands.addCommand({
		name: "nextBreakpoint",
		bindKey: {
			win: "F2|Ctrl-b",
			mac: "F2|Command-b",
			sender: "editor"
		},
		exec: function (editor, args, request) {
    		var breakpoints = editor.getSession().$breakpoints;

    		var cursor = editor.getCursorPosition();
    		var row = cursor.row;

    		var real_breakpoints = [];

    		for( var i=0; i<breakpoints.length; i++ ) {
    			if(breakpoints[i]=='ace_breakpoint') {
    				if( i>row ){
    					editor.gotoLine(i+1);
    					return;
    				}

    				real_breakpoints.push(i);
    			}
    		}

    		//go back to beginning
    		if( real_breakpoints[0] ){
    			editor.gotoLine(real_breakpoints[0]+1);
    		}
		}
	});

	editor.commands.addCommand({
		name: "prevBreakpoint",
		bindKey: {
			win: "Shift-F2|Ctrl-Shift-b",
			mac: "Shift-F2|Command-Shift-b",
			sender: "editor"
		},
		exec: function (editor, args, request) {
    		var breakpoints = editor.getSession().$breakpoints;

    		var cursor = editor.getCursorPosition();
    		var row = cursor.row;

    		var real_breakpoints = [];

    		for( var i=breakpoints.length; i>0; i-- ) {
    			if(breakpoints[i]=='ace_breakpoint') {
    				if( i<row ){
    					editor.gotoLine(i+1);
    					return;
    				}

    				real_breakpoints.push(i);
    			}
    		}


    		if( real_breakpoints[0] ){
    			editor.gotoLine(real_breakpoints[0]+1);
    		}
		}
	});

	editor.commands.addCommand({
		name: "clearBreakpoints",
		exec: function (editor, args, request) {
    		if(typeof row === "undefined"){
    			var cursor = editor.getCursorPosition();
    			row = cursor.row;
    		}

    		var s = editor.getSession();

    		for( var row in s.$breakpoints ){
    			if(s.$breakpoints[row])
    				s.clearBreakpoint(row);
    		}
		}
	});

	editor.commands.addCommand({
		name: "wrapSelection",
		exec: function (editor, args, request) {
		    var start = args[0];
		    var end = args[1];

    		var text = editor.getSelectedText();

    		if (
    		text.substr(0, start.length) == start && text.substr(text.length - end.length) == end) {
    			text = text.substr(start.length, text.length - start.length - end.length);
    		} else {
    			text = start + text + end;
    		}

    		editor.insert(text, true);
		}
	});

	editor.commands.addCommand({
		name: "prependLineSelection",
		exec: function (editor, args, request) {
		    var string = args[0];

    		var text = editor.getSelectedText();
    		editor.insert(string + text.replace(new RegExp("\n", 'g'), "\n" + string), true);
		}
	});

	editor.commands.addCommand({
		name: "appendLineSelection",
		exec: function (editor, args, request) {
		    var string = args[0];

    		var text = editor.getSelectedText();
    		editor.insert(text.replace(new RegExp("\n", 'g'), string + "\n") + string, true);
		}
	});

	editor.commands.addCommand({
		name: "replaceInSelection",
		exec: function (editor, args, request) {
		    var needle = args[0];
		    var replacement = args[0];

    		var text = editor.getSelectedText();
    		editor.insert(text.replace(new RegExp(needle, 'g'), replacement), true);
		}
	});

	editor.commands.addCommand({
		name: "selectionToUppercase",
		exec: function (editor, args, request) {
    		var text = editor.getSelectedText();
    		editor.insert(text.toUpperCase(), true);
		}
	});

	editor.commands.addCommand({
		name: "selectionToLowercase",
		exec: function (editor, args, request) {
    		var text = editor.getSelectedText();
    		editor.insert(text.toLowerCase(), true);
		}
	});

	editor.commands.addCommand({
		name: "tabPrev",
		bindKey: {
			win: "Alt-Left",
			mac: "Command-Left",
			sender: "editor"
		},
		exec: function (editor, args, request) {
			tabs.prev();
			return true;
		}
	});

	editor.commands.addCommand({
		name: "tabNext",
		bindKey: {
			win: "Alt-Right",
			mac: "Command-Right",
			sender: "editor"
		},
		exec: function (editor, args, request) {
			tabs.next();
			return true;
		}
	});

	//move cursor to top
	var startLine = 0;

	editor.selection.setSelectionRange({
		start: {
			row: startLine,
			column: 0
		},
		end: {
			row: startLine,
			column: 0
		}
	});
	//console.log(options);
	if (options && options.state) {
	    restoreState(options.state);
	}

	//make toolbar
	editor_toolbar.create(tab);

	editor.focus();

	//reactivate
	$(tab).trigger('activate');
}

function setMode(editor, mode) {
    editor.getSession().setMode("ace/mode/" + mode);
}

function init() {
    editor_contextmenu.init();
}

/*
return {
    create: create
};*/

exports.init = init;
exports.create = create;
exports.focus = focus;
exports.refresh = refresh;
exports.setMode = setMode;

});