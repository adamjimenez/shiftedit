define(['app/config', 'ace/ace','app/tabs', 'exports', 'app/prefs', 'jquery',"app/tabs", "app/util", "app/modes", 'jquery','app/lang','app/syntax_errors', "app/editor_toolbar", 'app/prompt','app/editor_contextmenu','app/autocomplete', 'ace/autocomplete', 'ace/ext-emmet', 'ace/ext-split', 'app/site', 'app/firebase', 'firepad/firepad', 'firepad/firepad-userlist', 'app/find', 'app/storage', 'app/resize', 'ace/ext/language_tools', "ace/keyboard/vim", "ace/keyboard/emacs", 'beautify', 'beautify-css', 'beautify-html', 'ace/ext/whitespace'], function (config, ace, tabs, exports, preferences) {
var util = require('app/util');
var syntax_errors = require('app/syntax_errors');
var lang = require('app/lang').lang;
var modes = require('app/modes');
var editor;
var editor_toolbar = require('app/editor_toolbar');
var editor_contextmenu = require('app/editor_contextmenu');
var prompt = require('app/prompt');
var autocomplete = require('app/autocomplete');
var Autocomplete = require("ace/autocomplete").Autocomplete;
var language_tools = require("ace/ext/language_tools");
var site = require('app/site');
var firebase = require('app/firebase');
var Firepad = require('firepad/firepad');
var find = require('app/find');
var storage = require('app/storage');
var resize = require('app/resize');
var beautify = require('beautify');
var css_beautify = require('beautify-css');
var html_beautify = require('beautify-html');

//ace.config.set("packaged", true);
//ace.config.set("basePath", require.toUrl("ace"));

var acePath = '//shiftedit.s3.amazonaws.com/lib/ace.20160218';

ace.config.set("modePath", acePath);
//ace.config.set("workerPath", acePath); //disabled to fix firefox security issue
ace.config.set("themePath", acePath);

// custom completions
var shifteditCompleter = {
	getCompletions: function(editor, session, pos, prefix, callback) {
		var completions = autocomplete.run(editor, session, pos, prefix, callback);

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
language_tools.addCompleter(shifteditCompleter);

//remove text completer
language_tools.textCompleter.getCompletions = function(){};

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

function onChangeCursor(e, selection) {
	var editor = tabs.getEditor(this);
	var session = selection.session;
	var pos = selection.getSelectionLead();
	var line = session.getLine(pos.row);
	var prefix = line.slice(0, pos.column);
	var value;
	var convertToRgb = false;

	$('#picker').remove();
	$('#args').remove();

	//color picker
	if (/(#[0-9a-f]*)$/i.test(prefix)) {
		before = pos.column - RegExp.$1.length;

		if (/(#[0-9a-f]*)/i.test(line.slice(before))) {
			rawValue = RegExp.$1;
		}

		value = rawValue;

		if( value.length == 4 ){
			value = '#'+value[1]+value[1]+value[2]+value[2]+value[3]+value[3];
		}

		type = 'color';
	//rgb color picker
	}else if (/rgb\(([0-9,\s]*)$/i.test(prefix)) {
		before = pos.column - RegExp.$1.length;

		if (/([0-9,\s]*)/i.test(line.slice(before))) {
			rawValue = RegExp.$1;
		}

		rawValue = RegExp.$1;

		value = rawValue.replace(/\s/g,'');

		var rgb = value.split(',');
		if( rgb.length >= 3 ){
			value = util.rgbToHex(rgb[0], rgb[1], rgb[2]);
		}

		type = 'color';
		convertToRgb = true;
	}

	if (value) {
		rawValue = rawValue ? rawValue : value;

		range = {
			start: {
				row: pos.row,
				column: before
			},
			end: {
				row: pos.row,
				column: before + rawValue.length
			}
		};

		//charCoords
		pos = editor.renderer.textToScreenCoordinates(range.start.row, range.start.column);
		var offset = $(editor.container).offset();
		pos.pageX -= offset.left;
		pos.pageY -= offset.top;

		el = document.createElement('input');
		el.type = type;

		if (type == 'number') {
			el.min = parseFloat(value) - 10;
			el.max = parseFloat(value) + 10;
			el.step = 1;
		}

		el.id = 'picker';
		el.value = value ? value : rawValue;

		//position picker
		el.style.top = pos.pageY + 20 + "px";
		el.style.left = pos.pageX +  "px";

		var container = editor.container;
		container.parentNode.appendChild(el);

		el.onclick = function () {
			selection.setSelectionRange(range);
			this.focus();
		};

		el.onchange = function () {
			var newValue = this.value;
			if( convertToRgb ){
				var rgb = util.hexToRgb(newValue);
				newValue = rgb.r+', '+rgb.g+', '+rgb.b;
			}

			selection.setSelectionRange(range);
			editor.insert(newValue);
		};
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

		$.post(config.apiBaseUrl+'files?cmd=state&site='+site, {
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

//runs when editor or firepad is ready
function ready(tab) {
	var editor = tabs.getEditor($(tab));
	
	editor.getSession().doc.on('change', jQuery.proxy(onChange, tab));
			
	if (prefs.autoTabs) {
		var whitespace = require("ace/ext/whitespace");
		whitespace.detectIndentation(editor.getSession());
	} 
}

function destroy(e) {
	var tab = $(this);
	var editor = tabs.getEditor($(tab));

	delete window.shiftedit.defs[tab.attr('id')];
	removeFirepad(tab);

	editor.session.$stopWorker();
	editor.destroy();
	editor.container.parentNode.removeChild(editor.container);
}

function removeFirepad(tab) {
	console.log('remove firepad');

	var firepad = $(tab).data('firepad');
	var firepadUserList = $(tab).data('firepadUserList');
	var firepadRef = $(tab).data('firepadRef');

	//remove firepad if last user
	if( firepadUserList && Object.keys(firepadUserList.users).length==1 ){
		firepadRef.off('value');
		firepadRef.remove();
	}

	if( firepadUserList ){
		firepadUserList.dispose();
	}

	if( firepad ){
		try{
			firepad.dispose();
		}catch(e){
			console.log(e);
		}
	}
}

function addFirepad(tab) {
	console.log('adding firepad');

	//TODO loading mask
	var editor = tabs.getEditor(tab);
	var options = {};
	var content = tab.data('original');
	if( typeof content === 'string' ){
		options.content = content.replace(/\r\n/g, "\n");
	}

	var siteId = tab.attr('data-site');
	var file = tab.attr('data-file');
	var doc_name = siteId + '/' + file;
	//firebase doesn't allow ".", "#", "$", "[", or "]"
	doc_name = doc_name.split('.').join('_');
	doc_name = doc_name.split('[').join('(');
	doc_name = doc_name.split(']').join(')');

	var url;
	if( tab.attr('shared') ){
		url = "https://shiftedit.firebaseio.com/public/";
	}else{
		url = "https://shiftedit.firebaseio.com/sites/";
	}

	$(tab).trigger('firebaseon');

	firepadRef = new Firebase(url+doc_name);
	tab.data('firepadRef', firepadRef);

	// Create Firepad.
	firepad = Firepad.fromACE(firepadRef, editor, {
		userId: storage.get('user')
	});

	//remove on dispose
	firepadRef.on('value', function(snapshot) {
		// you could just check "snapshot.val() == null" here, but it's much cheaper to check for children so do that first.
		if (!snapshot.hasChildren() && snapshot.val() === null) {
			console.log('firebase was removed');
			tabs.setEdited(tab, false);
			tabs.close(tab);
		}
	}, function(){
		console.log('firepad permission denied');

		removeFirepad();
		editor.getSession().setValue(content);
		editor.moveCursorToPosition({column:0, row:0});
		//loadmask.hide();
	});

	tab.data('firepad', firepad);
	tab.data('options', options);

	// Create FirepadUserList (with our desired userId)
	firepadUserList = FirepadUserList.fromDiv(firepadRef.child('users'), storage.get('user'), storage.get('username'), editor);
	tab.data('firepadUserList', firepadUserList);

	//// Initialize contents
	firepad.on('ready', $.proxy(function() {
		var tab = this;
		var firepad = tab.data('firepad');
		var editor = tabs.getEditor(tab);
		var options = tab.data('options');
		var firepadRef = tab.data('firepadRef');

		if( firepad.isHistoryEmpty() ){
			firepad.setText(content);
			editor.getSession().getUndoManager().reset();
		}else if( typeof content === 'string' && editor.getValue() !== options.content ){
			//firepad.setText(content);
			tabs.setEdited(tab, true);
		}else if(editor.getValue() === options.content){
			tabs.setEdited(tab, false);
		}

		//move cursor to start
		editor.moveCursorToPosition({column:0, row:0});

		saveRef = firepadRef.child('save');
		saveRef.on('value', function(snapshot) {
			if( !firepad ){
				return;
			}

			var data = snapshot.val();
			var revision = firepad.firebaseAdapter_.revision_;

			console.log('current revision: ' + revision);

			if( data && revision == data.revision ){
				console.log('new revision: ' + data.revision);
				tabs.setEdited(tab.id, false);
			}

			if( data && data.last_modified ){
				tab.attr('data-mdate', data.last_modified);
			}
		});

		//loadmask.hide();
		ready(tab);

		restoreState(options.state);
	}, tab));
}

fullscreen = function () {
	var editor = tabs.getEditor(this);
	var editorDiv = $(editor.container);
	
	if (!editorDiv.hasClass('fullscreen')) {
		editorDiv.addClass('fullscreen');
		$('body').addClass('fullscreen');
	} else {
		editorDiv.removeClass('fullscreen');
		$('body').removeClass('fullscreen');
	}
	
	editor.focus();
	resize.resize();
};

_autoIndentOnPaste = function(editor, noidea, e) {
	var session = editor.getSession();
	var pos = editor.getSelectionRange().start;
	var line = session.getLine(pos.row);
	var tabSize = session.getTabSize();

	var col = pos.column;
	for (var i = 0; i < pos.column; i++) {
		if (line[i] === "\t") {
			col += (tabSize - 1);
		}
	}
	var tabAsSpaces = "";
	for (i = 0; i < tabSize; i++) {
		tabAsSpaces += " ";
	}
	var text = e.text.replace(/\t/gm, tabAsSpaces);
	var lines = text.split("\n");
	var regexp = /\S/;
	var min = -1;
	var index;
	for (i = 1; i < lines.length; i++) {
		index = lines[i].search(regexp);
		if (index !== -1 && (index < min || min === -1)) {
			min = index;
		}
	}
	var adjust = col - min;
	if (min > -1 && adjust !== 0) {
		if (adjust < 0) {
			for (i = 1; i < lines.length; i++) {
				lines[i] = lines[i].substring(-adjust);
			}
		} else if (adjust > 0) {
			var add = "";
			for (i = 0; i < adjust; i++) {
				add += " ";
			}

			for (i = 1; i < lines.length; i++) {
				lines[i] = add + lines[i];
			}
		}
	}

	lines[0] = lines[0].substring(lines[0].search(regexp));
	e.text = lines.join("\n");
	if (!session.getUseSoftTabs()) {
		regexp = new RegExp(tabAsSpaces, "gm");
		e.text = e.text.replace(regexp, "\t");
	}
};

function applyPrefs(tab) {
	tab = $(tab);
	var prefs = preferences.get_prefs();

	window.splits[tab.attr('id')].forEach(function (editor) {
		setMode(editor, editor.getSession().$modeId.substr(9));

		if (prefs.behaviours) {
			editor.setBehavioursEnabled(true);
		}else{
			editor.setBehavioursEnabled(false);
		}

		editor.setDragDelay(0);
		editor.setHighlightSelectedWord(true);

		if (prefs.indentOnPaste) {
			editor.on("paste", function(e) {
				_autoIndentOnPaste(editor, session, e);
			});
		} else {
			editor.removeAllListeners("paste");
		}

		if( prefs.zen ){
			console.log('loading emmet');
			//emmet fka zen
			editor.setOption("enableEmmet", true);
		}else{
			editor.setOption("enableEmmet", false);
		}

		//var beautify = require("ace/ext/beautify");
		//editor.commands.addCommands(beautify.commands);

		var keybinding = null;
		switch (prefs.keyBinding) {
		case 'vim':
			keybinding = require("ace/keyboard/vim").handler;
			var vimApi = require("ace/keyboard/vim").CodeMirror.Vim;
			vimApi.defineEx("write", "w", jQuery.proxy(function(cm, input) {
				var editor = cm.ace;
				return editor.commands.exec('save', editor);
			}, tab));
			break;
		case 'emacs':
			keybinding = require("ace/keyboard/emacs").handler;
			break;
		}

		editor.setKeyboardHandler(keybinding);
		editor.getSession().setFoldStyle(prefs.codeFolding);

		// set linebreak mode. don't change if using firepad
		if(
			['auto','unix','windows'].indexOf(prefs.lineBreak) !== -1 &&
			!$(tab).data('firepad')
		){
			console.log('Linemode: '+prefs.lineBreak);
			editor.getSession().getDocument().setNewLineMode(prefs.lineBreak);
		}

		// set theme
		var codeTheme = prefs.codeTheme ? prefs.codeTheme : 'dreamweaver';
		if( codeTheme == 'custom' ){
			customTheme = prefs.customTheme;
			var themeObj = {
				cssClass: 'ace-custom',
				cssText: customTheme
			};

			editor.setTheme(themeObj);
		}else{
			editor.setTheme("ace/theme/" + codeTheme);
		}

		if (prefs.fullLineSelection) {
			editor.setSelectionStyle('line');
		} else {
			editor.setSelectionStyle('text');
		}

		editor.setHighlightActiveLine(prefs.highlightActiveLine);
		editor.setShowInvisibles(Boolean(prefs.showInvisibles));
		editor.setOption("scrollPastEnd", Boolean(prefs.scrollPastEnd));
		editor.renderer.setShowGutter(Boolean(prefs.lineNumbers));
		editor.renderer.setHScrollBarAlwaysVisible(false);
		editor.renderer.setVScrollBarAlwaysVisible(true);
		editor.renderer.setAnimatedScroll(true);

		editor.getSession().setTabSize(parseInt(prefs.tabSize, 10));
		editor.getSession().setUseSoftTabs(Boolean(prefs.softTabs));
		
		if (prefs.autoTabs) {
			var whitespace = require("ace/ext/whitespace");
			whitespace.detectIndentation(editor.getSession());
		}
		
		editor.getSession().setUseWrapMode(Boolean(prefs.wordWrap)); //wrap mode causing a problem!
		//editor.setScrollSpeed(parseInt(prefs.scrollSpeed, 10));
		editor.renderer.setPrintMarginColumn(parseInt(prefs.printMarginColumn, 10));
		editor.setShowPrintMargin(Boolean(prefs.printMargin));
		//editor.container.style.fontFamily = prefs.font;
		editor.setFontSize(prefs.fontSize + 'px');

		editor.setOptions({
			enableBasicAutocompletion: Boolean(prefs.autocomplete),
			enableLiveAutocompletion: Boolean(prefs.autocomplete)
		});

		//remove tab command
		if (editor.completer) {
			editor.completer.keyboardHandler.removeCommand('Tab');
			editor.completer.exactMatch = true;
			editor.completer.autoSelect = true;
		}
	});
}

function create(file, content, siteId, options) {
	var settings = {};

	if(!options){
		options = {};
	}

	var title = file;
	if(options.title) {
		title = options.title;
	}

	var tabpanel = options.tabpanel ? options.tabpanel : $(".ui-layout-center");

	//create tab
	tab = tabpanel.tabs('add', title, '<div class="vbox"><div class="editor_toolbar"></div>\
	<div class="editor_status" data-currentError="0">\
	<button class="previous" type="button" disabled>\
	<i class="fa fa-arrow-left"></i></button> \
	<button class="next" type="button" disabled>\
	<i class="fa fa-arrow-right"></i></button> \
	<!--<button class="fix" type="button" disabled>Fix</button>--> \
	<span class="status" style="font-size:11px;">' + lang.noSyntaxErrorsText + '</span>\
	</div>\
	<div class="editor"></div><div class="design flex" style="display: none;"></div></div>'
	//, 'site-'+siteId
	);

	tab.addClass('closable');
	tab.data(file, file);
	tab.attr('data-file', file);

	tab.data('view', 'code');
	tab.attr('data-view', 'code');

	if(siteId) {
		tab.data('site', siteId);
		tab.attr('data-site', siteId);
		settings = site.getSettings(siteId);
		title = settings.name + '/' + title;
	}
	
	tabs.setTitle(tab, title);

	if(options.mdate) {
		tab.data('mdate', options.mdate);
		tab.attr('data-mdate', options.mdate);
	}

	if(options.link) {
		tab.data('link', options.link);
		tab.attr('data-link', options.link);
	}

	tab.data('original', content);

	tabpanel.trigger("tabsactivate", [{newTab:tab}]);

	//load ace

	//fixme panels can be in other tabarea
	var panel = tabpanel.tabs('getPanelForTab', tab);
	panel.css('overflow', 'hidden');

	// Splitting
	var container = panel.find('.editor')[0];
	//editor = ace.edit(container);

	var Split = require("ace/split").Split;
	var theme = require("ace/theme/textmate");
	var split = new Split(container, theme, 1);
	editor = split.getEditor(0);
	editor.setTheme("ace/theme/monokai");
	editor.split = split;

	//disable warning
	editor.$blockScrolling = Infinity;

	//split isn't properly implemented in Ace so we have to use globals :|
	if(!window.splits) window.splits = {};
	window.splits[tab.attr('id')] = split;

	var session = editor.getSession();

	//syntax bar handlers
	panel.find('.previous').button()
	.click(jQuery.proxy(syntax_errors.previous, tab));

	panel.find('.next').button()
	.click(jQuery.proxy(syntax_errors.next, tab));

	//set mode
	var ext = util.fileExtension(file);

	//check default file associations
	var mode = modes.find(ext);

	//editor.getSession().setMode("ace/mode/"+mode);
	setMode(editor, mode);

	//FIREPAD
	var firepad = false;
	if( siteId && (settings.shared || tab.attr('shared')) ){
		firepad = true;

		if( !firebase.isConnected() ){
			tab.attr('data-firepad', 1);

			firebase.connect(function() {
				$('li[role=tab][data-firepad]').each(function(index){
					addFirepad($(this));
				});
			});
		}else{
			addFirepad(tab);
		}
	}else{
		//if no firepad:
		if (content !== null) {
			editor.getSession().getDocument().setValue(content);
		}

		ready(tab);

		//clear history //fixes undo redo when using split
		var UndoManager = require("ace/undomanager").UndoManager;
		editor.getSession().setUndoManager(new UndoManager());

		//prevent showing as edited
		//clearTimeout(editedTimer);

		//move cursor to start
		editor.moveCursorToPosition({column:0, row:0});
	}

	//event listeners
	editor.getSession().on('changeFold', jQuery.proxy(saveState, tab));
	editor.getSession().on('changeBreakpoint', jQuery.proxy(saveState, tab));
	editor.getSession().on("changeAnnotation", jQuery.proxy(syntax_errors.update, tab));
	editor.on('guttermousedown', jQuery.proxy(onGutterClick, tab));
	editor.getSession().selection.on('changeCursor', jQuery.proxy(onChangeCursor, tab));

	$(tab).on('beforeClose', destroy);

	//autocomplete
	editor.completer = new Autocomplete();

	window.shiftedit.defs[$(tab).attr('id')] = {
		'definitions': {},
		'definitionRanges': {}
	};

	//editor.completers = [shifteditCompleter];

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
		name: "find",
		bindKey: {
			win: "Ctrl-F",
			mac: "Command-F",
			sender: "editor"
		},
		exec: function (editor, args, request) {
			find.open(editor.getSelectedText());
			return true;
		}
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
						setTimeout(function(){editor.focus();}, 50);
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

			if (text.substr(0, start.length) == start && text.substr(text.length - end.length) == end) {
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
			var replacement = args[1];

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

	editor.commands.addCommand({
		name: "applySourceFormatting",
		bindKey: {
			win: "Alt-Shift-f",
			mac: "Alt-Shift-f",
			sender: "editor"
		},
		exec: function (editor, args, request) {
			var prefs = preferences.get_prefs();
			var toSelection = !editor.getSelection().isEmpty();
			var mode = editor.getSession().$modeId.substr(9);

			var tab = '';
			for (i = 0; i < prefs.tabSize; i++) {
				tab += ' ';
			}

			var code = toSelection ? editor.getSelectedText() : code = editor.getValue();

			switch (mode) {
			case 'javascript':
			case 'json':
				code = beautify.js_beautify(code, {
					'indent_size': prefs.softTabs ? prefs.tabSize : 1,
					'indent_char': prefs.softTabs ? ' ' : '\t',
					'brace_style': prefs.beautifier_brace_style,
					'preserve_newlines': prefs.beautifier_preserve_newlines,
					'keep_array_indentation': prefs.beautifier_keep_array_indentation,
					'break_chained_methods': prefs.beautifier_break_chained_methods,
					'space_before_conditional': prefs.beautifier_space_before_conditional,
					'indent_scripts': prefs.beautifier_indent_scripts
				});
				break;
			case 'css':
				code = css_beautify.css_beautify(code, {
					indent: tab,
					openbrace: prefs.beautifier_open_brace
				});
				break;
			case 'html':
			case 'php':
			case 'xml':
				code = html_beautify.html_beautify(code, {
					'indent_size': prefs.softTabs ? prefs.tabSize : 1,
					'indent_char': prefs.softTabs ? ' ' : '\t',
					'indent_scripts': prefs.beautifier_indent_scripts,
					'max_char': 78,
					'brace_style': prefs.beautifier_brace_style,
					'unformatted': ['?', '?=', '?php', 'a', 'span', 'bdo', 'em', 'strong', 'dfn', 'code', 'samp', 'kbd', 'var', 'cite', 'abbr', 'acronym', 'q', 'sub', 'sup', 'tt', 'i', 'b', 'big', 'small', 'u', 's', 'strike', 'font', 'ins', 'del', 'pre', 'address', 'dt', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
					'extra_liners': []
				});
				break;
			default:
				return;
			}

			if (toSelection) {
				editor.insert(code);
			} else {
				editor.setValue(code);
			}
		}
	});
	
	editor.commands.addCommand({
		name: "br",
		bindKey: {
			win: "Shift-Return",
			mac: "Shift-Return",
			sender: "editor"
		},
		exec: function (editor, args, request) {
			var sel = editor.getSelectionRange();
			var line = editor.getSession().getLine(sel.start.row);
			var whitespace = '';
	
			for (i = 0; i < line.length; i++) {
				if (line[i].match(/\s/)) {
					whitespace += line[i];
				} else {
					break;
				}
			}
	
			editor.insert('<br>\n'+whitespace);
		},
		multiSelectAction: "forEach"
	});

	//console.log(options);
	if (options && options.state) {
		restoreState(options.state);
	}

	//make toolbar
	editor_toolbar.create(tab);

	editor.focus();

	applyPrefs(tab);

	//reactivate
	$(tab).trigger('activate');

	$(tab).closest('.ui-tabs').trigger('open');
	
	$('<div class="fullscreenBtn" title="Full Screen (Ctrl+Shift+F)"><i class="fa fa-expand"></i></div>').appendTo($(editor.container))
	.click(jQuery.proxy(fullscreen, tab));

	return $(tab);
}

function setMode(editor, mode) {
	editor.getSession().setMode("ace/mode/" + mode);

	//worker settings
	if (editor.getSession().$worker) {
		var options = {};
		var prefs = preferences.get_prefs();

		switch (mode){
			case 'javascript':
				var jslint_options = preferences.jslint_options;

				$.each(jslint_options, function (key, item) {
					options[item.name] = prefs['jslint_' + item.name];
				});

				//console.log(options);

				editor.session.$worker.send("changeOptions", [options]);
				// or
				//session.$worker.send("setOptions",[ {onevar: false, asi:true}])
			break;
			case 'css':
				var csslint_options = preferences.csslint_options;

				var disable_rules = [];

				$.each(csslint_options, function (key, item) {
					disable_rules.push(item.name);
				});

				//console.log(disable_rules);

				editor.session.$worker.send("setDisabledRules", [disable_rules]);
				// or
				//session.$worker.send("setOptions",[ {onevar: false, asi:true}])
			break;
		}
	}
}

function init() {
	editor_contextmenu.init();
}

//cleanup firepads on exit
window.onunload = function(){
	//remove redundant firebases
	$('li[file]').each(function() {
		removeFirepad(this);
	});
};

/*
return {
	create: create
};*/

exports.init = init;
exports.create = create;
exports.focus = focus;
exports.setMode = setMode;
exports.applyPrefs = applyPrefs;

});