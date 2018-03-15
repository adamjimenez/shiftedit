define(['./config', 'ace/ace','./tabs', 'exports', './prefs', "./util", "./modes", './lang','./syntax_errors', "./editor_toolbar", './prompt','./editor_contextmenu','./autocomplete', './site', './firebase', './find', './storage', './resize', 'ace/ext/beautify', "ace/ext/language_tools", 'ace/autocomplete', 'ace/ext-emmet', 'ace/ext-split', 'firepad', 'firepad-userlist',  "ace/keyboard/vim", "ace/keyboard/emacs", 'ace/ext/whitespace', 'ace/ext/searchbox', 'ace/ext/tern', 'firebase', 'jquery'], function (config, ace, tabs, exports, preferences, util, modes, lang, syntax_errors, editor_toolbar, prompt, editor_contextmenu, autocomplete, site, firebase, find, storage, resize, beautify, language_tools) {

lang = lang.lang;
var editor;
var tern = require("ace/tern/tern");
var snippetManager = require("ace/snippets").snippetManager;
var Firepad = require('firepad');
var FirepadUserList = require('firepad-userlist');
var Range = require("ace/range").Range;
var Autocomplete = require("ace/autocomplete").Autocomplete;

//ace.config.set("packaged", true);
//ace.config.set("basePath", require.toUrl("ace"));

var acePath = '//shiftedit.s3.amazonaws.com/node_modules/ace-builds/src';

ace.config.set("modePath", acePath);
//ace.config.set("workerPath", acePath); //disabled to fix firefox security issue
ace.config.set("themePath", acePath);

// fix firepad bug (undo/ redo doesn't scroll in ace #226)
Firepad.ACEAdapter.prototype.setCursor = function(cursor) {
	var end, start, _ref;
	start = this.posFromIndex(cursor.position);
	end = this.posFromIndex(cursor.selectionEnd);
	if (cursor.position > cursor.selectionEnd) {
		_ref = [end, start];
		start = _ref[0];
		end = _ref[1];
	}
	this.aceSession.selection.setSelectionRange(new this.aceRange(start.row, start.column, end.row, end.column));
	this.ace.renderer.scrollCursorIntoView(null, 0.5);
};

// custom completions
var shifteditCompleter = {
	getCompletions: function(editor, session, pos, prefix, callback) {
		var completions = autocomplete.run(editor, session, pos, prefix, callback);
		
		var prefs = preferences.get_prefs();
		if (prefs.snippets) {
			language_tools.snippetCompleter.getCompletions(editor, session, pos, prefix, function(empty, snippetCompletions) {
				if (!completions) {
					completions = [];
				}
				
				callback(null, completions.concat(snippetCompletions));
			});
		} else if (completions) {
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

// set completer
tern.addCompleter(shifteditCompleter);

/*
var ternCompleter = {
	getCompletions: function(editor, session, pos, prefix, callback) {
		return editor.ternServer.getCompletions(editor, session, pos, prefix, callback);
	}
};
*/
//language_tools.addCompleter(shifteditCompleter);
//tern.addCompleter(ternCompleter);

//remove text completer
//language_tools.textCompleter.getCompletions = function(){};

function onChange(e, document) {
	var tab = $(this);
	var editor = tabs.getEditor(tab);
	tabs.setEdited(this, true);
	
	//maintain breakpoint position
	var breakpointsArray = editor.session.getBreakpoints();
	if(Object.keys(editor.session.getBreakpoints()).length>0){
		if(e.lines.length>1){
			Object.keys(editor.session.getBreakpoints()).forEach(function(item) {
				var breakpoint = parseInt(item);
				var lines = e.lines.length -1;
				var start = e.start.row;
				var end = e.end.row;
				if(e.action==='insert'){
					//console.log('new lines',breakpoint, start , end );
					if(breakpoint>start ){
						//console.log('breakpoint forward');
						editor.session.clearBreakpoint(breakpoint);
						editor.session.setBreakpoint(breakpoint + lines);
					}
				} else if(e.action==='remove'){
					//console.log('removed lines',breakpoint, start , end);
					if(breakpoint>start && breakpoint<end ){
						//console.log('breakpoint remove');
						editor.session.clearBreakpoint(breakpoint);
					}
					if(breakpoint>=end ){
						//console.log('breakpoint behind');
						editor.session.clearBreakpoint(breakpoint);
						editor.session.setBreakpoint(breakpoint - lines);
					}
				}
			});
		}
	}

	editor_toolbar.update(tab);
	
	// clear tinymce undo stack
	if (tab.data('view')==='code') {
		var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);
		var inst = tinymce.get(panel.find('.design .tinymce').attr('id'));
		if (inst) {
			inst.undoManager.clear();
		}
	}
}

function onGutterClick(e, editor) {
	if( e.domEvent.button == 2 ){
		var s = editor.getSession();
		var className = e.domEvent.target.className;
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
	var tab = $(this);
	var editor = tabs.getEditor(tab);
	var session = selection.session;
	var pos = selection.getSelectionLead();
	var line = session.getLine(pos.row);
	var prefix = line.slice(0, pos.column);
	var value;
	var convertToRgb = false;
	var before;
	var url;
	var image = false;
	var offset;
	var container = editor.container;
	var target = '';

	$('#picker').remove();
	$('#args').remove();
	$('#link').remove();

	//image
	if (/[href|src]="([^"]+)$/i.test(prefix)) {
		before = pos.column - RegExp.$1.length;

		if (/([^"]+)/i.test(line.slice(before))) {
			url = RegExp.$1;
		}
	}
	
	//css image url
	if (/url\("([^"]+)$/i.test(prefix)) {
		before = pos.column - RegExp.$1.length;

		if (/([^"]+)/i.test(line.slice(before))) {
			url = RegExp.$1;
		}
	}
	
	if(url) {
		console.log(url);
		if (document.getElementById('link')) {
			el = document.getElementById('link');
		} else {
			el = document.createElement('a');
		}
		
		if (url.substr(0, 4)!='http' && url.substr(0, 2)!='//') {
			if (tab.data("site")) {
				var settings = site.getSettings(tab.data("site"));
				url = settings.web_url + url;

				if (settings.encryption == "1") {
					url = 'https://'+url;
				} else {
					url = 'http://'+url;
				}
			} else {
				url = false;
			}
		}

		if(url) {
			//calulate the container offset
			range = {
				start: {
					row: pos.row,
					column: before
				},
				end: {
					row: pos.row,
					column: before + url.length
				}
			};
	
			pos = editor.renderer.textToScreenCoordinates(range.start.row, range.start.column);
			offset = $(editor.container).offset();
			pos.pageX -= offset.left;
			pos.pageY -= offset.top;
	
			el.id = 'link';
			el.target = '_blank';
			el.href = url;
			
			var image_extensions = ['jpg', 'jpeg', 'png', 'gif', 'pxd'];
			var file_extension = util.fileExtension(url);
			if (image_extensions.indexOf(file_extension) != -1) {
				el.innerHTML = '<img src="' + url + '" style="max-width: 50px; max-height: 50px;">';
			} else {
				el.innerHTML = 'Open';
			}
			
			el.style.top = pos.pageY + 20 + "px";
			el.style.left = pos.pageX + "px";
			el.style.display = 'block';
			el.style.position = 'absolute';
			el.style.background = '#fff';
			el.style.color = '#000';
			el.style.zIndex = 1;
			el.style.textDecoration = 'none';
	
			container.parentNode.appendChild(el);
			return;
		}
	}
	
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
		offset = $(editor.container).offset();
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
	
	var prefs = preferences.get_prefs();
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
		console.log('remove firepad session');
		firepadRef.off('value');
		firepadRef.remove();
	}

	if( firepadUserList ){
		firepadUserList.dispose();
		$(tab).data('firepadUserList', false);
	}

	if( firepad ){
		try{
			firepad.dispose();
			$(tab).data('firepad', false);
		}catch(e){
			console.log(e);
		}
	}
}

function addFirepad(tab) {
	console.log('adding firepad');

	//TODO loading mask
	var content = '';
	var editor = tabs.getEditor(tab);
	
	if (editor.getValue()) {
		content = editor.getValue();
	} else {
		content = tab.data('original');
	}
	content = content.replace(/\r\n/g, "\n");
	var edited = tab.data("edited");
	editor.setValue('');
	
	var options = {};
	if( typeof content === 'string' ){
		options.content = content;
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

	var firebaseUrl = url+doc_name;
	var firebaseDatabase = firebase.get();
	var firepadRef = firebaseDatabase.refFromURL(firebaseUrl);
	
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
			console.log('new firepad session');
			firepad.setText(content);
			editor.getSession().getUndoManager().reset();
			tabs.setEdited(tab, edited);
		}else if( typeof content === 'string' && editor.getValue() !== options.content ){
			console.log('firepad session has changes');
			tabs.setEdited(tab, true);
		}else if(editor.getValue() === options.content){
			console.log('firepad session is the same');
			tabs.setEdited(tab, false);
		}

		//move cursor to start
		editor.gotoLine(1, 0);

		saveRef = firepadRef.child('save');
		saveRef.on('value', function(snapshot) {
			if( !firepad ){
				return;
			}

			var data = snapshot.val();
			var revision = firepad.firebaseAdapter_.revision_;

			console.log('current revision: ' + revision);

			if(data && revision == data.revision && data.username !== localStorage.username){
				// propagate save
				console.log('new revision: ' + data.revision);
				tabs.setEdited(tab, false);
				
				// refresh preview
				tab.trigger('save');
			}

			if( data && data.last_modified ){
				tab.attr('data-mdate', data.last_modified).data('mdate', data.last_modified);
			}
		});

		//loadmask.hide();
		ready(tab);

		restoreState(options.state);
	}, tab));
}

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
		
		// tern
		editor.setOptions({
			/**
			 * Either `true` or `false` or to enable with custom options pass object that
			 * has options for tern server: http://ternjs.net/doc/manual.html#server_api
			 * If `true`, then default options will be used
			 */
			enableTern: {
				/* http://ternjs.net/doc/manual.html#option_defs */
				defs: ['browser', 'ecma5', 'jquery'],
				/* http://ternjs.net/doc/manual.html#plugins */
				plugins: {
					doc_comment: {
						fullDocs: true
					}
				},
				/**
				 * (default is true) If web worker is used for tern server.
				 * This is recommended as it offers better performance, but prevents this from working in a local html file due to browser security restrictions
				 */
				//useWorker: true,
				/* if your editor supports switching between different files (such as tabbed interface) then tern can do this when jump to defnition of function in another file is called, but you must tell tern what to execute in order to jump to the specified file */
				switchToDoc: function (name, start) {
					console.log('switchToDoc called but not defined. name=' + name + '; start=', start);
				},
				/**
				 * if passed, this function will be called once ternServer is started.
				 * This is needed when useWorker=false because the tern source files are loaded asynchronously before the server is started.
				 */
				startedCb: function () {
					//once tern is enabled, it can be accessed via editor.ternServer
					console.log('editor.ternServer:', editor.ternServer);
				},
			},
			/**
			 * when using tern, it takes over Ace's built in snippets support.
			 * this setting affects all modes when using tern, not just javascript.
			 */
			//enableSnippets: true,
			/**
			 * when using tern, Ace's basic text auto completion is enabled still by deafult.
			 * This settings affects all modes when using tern, not just javascript.
			 * For javascript mode the basic auto completion will be added to completion results if tern fails to find completions or if you double tab the hotkey for get completion (default is ctrl+space, so hit ctrl+space twice rapidly to include basic text completions in the result)
			 */
			//enableBasicAutocompletion: true,
		});
		

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
		
		editor.commands.addCommands(beautify.commands);

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
			enableLiveAutocompletion: Boolean(prefs.autocomplete),
			enableSnippets: Boolean(prefs.snippets)
		});
		
		//remove tab command
		if (editor.completer) {
			editor.completer.keyboardHandler.removeCommand('Tab');
			editor.completer.exactMatch = true;
			editor.completer.autoSelect = true;
		}
		
		//shortcuts
		editor.commands.removeCommands([
			'save', 
			'saveAs', 
			'findPanel', 
			'gotoLinePrompt', 
			'toggleBreakpoint', 
			'nextBreakpoint', 
			'prevBreakpoint',
			'clearBreakpoints',
			'wrapSelection',
			'prependLineSelection',
			'appendLineSelection',
			'replaceInSelection',
			'selectionToUppercase',
			'selectionToLowercase',
			'tabPrev',
			'tabNext',
			'applySourceFormatting',
			'br',
			'copylinesup',
			'copylinesdown',
			'movelinesup',
			'movelinesdown',
			'removeline',
			'reload',
			'fullScreen',
		]);
		
		editor.commands.addCommands([{
			name: "save",
			bindKey: {
				win: preferences.getKeyBinding('save'),
				mac: preferences.getKeyBinding('save', 'mac'),
				sender: "editor"
			},
			exec: jQuery.proxy(function (editor, args, request) {
				return tabs.save(this);
			}, tab)
		}, {
			name: "saveAs",
			bindKey: {
				win: preferences.getKeyBinding('saveAs'),
				mac: preferences.getKeyBinding('saveAs', 'mac'),
				sender: "editor"
			},
			exec: jQuery.proxy(function (editor, args, request) {
				return tabs.saveAs(this);
			}, tab)
		}, {
			name: "saveWithMinified",
			bindKey: {
				win: preferences.getKeyBinding('saveWithMinified'),
				mac: preferences.getKeyBinding('saveWithMinified', 'mac'),
				sender: "editor"
			},
			exec: jQuery.proxy(function (editor, args, request) {
				tabs.save(this, {
					minify: true
				});
			}, tab)
		}, {
			name: "findPanel",
			bindKey: {
				win: preferences.getKeyBinding('find'),
				mac: preferences.getKeyBinding('find', 'mac'),
				sender: "editor"
			},
			exec: function (editor, args, request) {
				if (!$(editor.container).hasClass('fullScreen')) {
					find.open(editor.getSelectedText());
					return true;
				} else {
					return false;
				}
			}
		}, {
			name: "gotoLinePrompt",
			bindKey: {
				win: preferences.getKeyBinding('gotoLinePrompt'),
				mac: preferences.getKeyBinding('gotoLinePrompt', 'mac'),
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
		}, {
			name: "toggleBreakpoint",
			bindKey: {
				win: preferences.getKeyBinding('toggleBreakpoint'),
				mac: preferences.getKeyBinding('toggleBreakpoint', 'mac'),
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
		}, {
			name: "nextBreakpoint",
			bindKey: {
				win: preferences.getKeyBinding('nextBreakpoint'),
				mac: preferences.getKeyBinding('nextBreakpoint', 'mac'),
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
		}, {
			name: "prevBreakpoint",
			bindKey: {
				win: preferences.getKeyBinding('prevBreakpoint'),
				mac: preferences.getKeyBinding('prevBreakpoint', 'mac'),
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
		}, {
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
		}, {
			name: "wrapSelection",
			exec: function (editor, args, request) {
				var start = args[0];
				var end = args[1];
				
				var selStart = editor.getSelectionRange();
				var text = editor.getSelectedText();
	
				if (text.substr(0, start.length) == start && text.substr(text.length - end.length) == end) {
					text = text.substr(start.length, text.length - start.length - end.length);
				} else {
					text = start + text + end;
				}

				editor.insert(text);
				
				// set selection
				var selEnd = editor.getSelectionRange();
				editor.selection.setSelectionRange({
					start: selStart.start,
					end: selEnd.end
				});
			}
		}, {
			name: "wrapLineSelection",
			exec: function (editor, args, request) {
				var start = args[0];
				var end = args[1];
				
				var sel = editor.getSelectionRange();
				var newSel = sel.clone();
				newSel.start.column = 0;
				newSel.end.column = editor.getSession().getLine(newSel.end.row).length;
				editor.selection.setSelectionRange(newSel);
	
				var text = editor.getSelectedText();
				var newText = start + text.replace(new RegExp(/(?:\r\n|\r|\n)/, 'g'), end + "\n" + start) + end;
				editor.insert(newText);
				
				// set selection
				var selEnd = editor.getSelectionRange();
				editor.selection.setSelectionRange({
					start: newSel.start,
					end: selEnd.end
				});
			}
		}, {
			name: "prependLineSelection",
			exec: function (editor, args, request) {
				function escapeRegExp(str) {
					return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
				}
				
				var string = args[0];
				var toggle = args[1];
				
				var sel = editor.getSelectionRange();
				var newSel = sel.clone();
				newSel.start.column = 0;
				editor.selection.setSelectionRange(newSel);
	
				var text = editor.getSelectedText();
				
				var newText = '';
				if (toggle && text.startsWith(string)) {
					newText = text.substr(string.length).replace(new RegExp("\n" + escapeRegExp(string), 'g'), "\n");
					sel.start.column -= string.length;
				} else {
					newText = string + text.replace(new RegExp("\n", 'g'), "\n" + string);
					sel.start.column += string.length;
				}
				editor.insert(newText);
				
				// restore selection if multiline
				var selEnd = editor.getSelectionRange();
				if (sel.isMultiLine()) {
					editor.selection.setSelectionRange({
						start: sel.start,
						end: selEnd.end
					});
				}
			}
		}, {
			name: "appendLineSelection",
			exec: function (editor, args, request) {
				var string = args[0];
	
				var text = editor.getSelectedText();
				editor.insert(text.replace(new RegExp("\n", 'g'), string + "\n") + string, true);
			}
		}, {
			name: "replaceInSelection",
			exec: function (editor, args, request) {
				var needle = args[0];
				var replacement = args[1];
	
				var text = editor.getSelectedText();
				editor.insert(text.replace(new RegExp(needle, 'g'), replacement), true);
			}
		}, {
			name: "selectionToUppercase",
			exec: function (editor, args, request) {
				var text = editor.getSelectedText();
				editor.insert(text.toUpperCase(), true);
			}
		}, {
			name: "selectionToLowercase",
			exec: function (editor, args, request) {
				var text = editor.getSelectedText();
				editor.insert(text.toLowerCase(), true);
			}
		}, {
			name: "tabPrev",
			bindKey: {
				win: preferences.getKeyBinding('tabPrev'),
				mac: preferences.getKeyBinding('tabPrev', 'mac'),
				sender: "editor"
			},
			exec: function (editor, args, request) {
				tabs.prev();
				return true;
			}
		}, {
			name: "tabNext",
			bindKey: {
				win: preferences.getKeyBinding('tabNext'),
				mac: preferences.getKeyBinding('tabNext', 'mac'),
				sender: "editor"
			},
			exec: function (editor, args, request) {
				tabs.next();
				return true;
			}
		}, {
			name: "applySourceFormatting",
			bindKey: {
				win: preferences.getKeyBinding('applySourceFormatting'),
				mac: preferences.getKeyBinding('applySourceFormatting', 'mac'),
				sender: "editor"
			},
			exec: function (editor, args, request) {
				editor.commands.exec('beautify', editor);
			}
		}, {
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
		}, {
			name: "heading",
			bindKey: {
				win: preferences.getKeyBinding('heading'),
				mac: preferences.getKeyBinding('heading', 'mac'),
				sender: "editor"
			},
			exec: function (editor, args, request) {
				var heading = args[0];
				if (!heading) {
					heading = 1;	
				}
				
				if (editor.getSession().$modeId.match(/markdown$/) ){
					var markup = '';
					for (var i=0; i<heading; i++) {
						markup += '#';
					}
					
					editor.commands.exec('prependLineSelection', editor, [markup+' ', true]);
				} else {
					editor.commands.exec('wrapSelection', editor, ['<h'+heading+'>', '</h'+heading+'>']);
				}
			},
			multiSelectAction: "forEach"
		}, {
			name: "bold",
			bindKey: {
				win: preferences.getKeyBinding('bold'),
				mac: preferences.getKeyBinding('bold', 'mac'),
				sender: "editor"
			},
			exec: function (editor, args, request) {
				if (editor.getSession().$modeId.match(/markdown$/) ){
					editor.commands.exec('wrapSelection', editor, ['**', '**']);
				} else {
					editor.commands.exec('wrapSelection', editor, ['<strong>', '</strong>']);
				}
			},
			multiSelectAction: "forEach"
		}, {
			name: "italic",
			bindKey: {
				win: preferences.getKeyBinding('italic'),
				mac: preferences.getKeyBinding('italic', 'mac'),
				sender: "editor"
			},
			exec: function (editor, args, request) {
				if (editor.getSession().$modeId.match(/markdown$/) ){
					editor.commands.exec('wrapSelection', editor, ['*', '*']);
				} else {
					editor.commands.exec('wrapSelection', editor, ['<em>', '</em>']);
				}
			},
			multiSelectAction: "forEach"
		}, {
			name: "quote",
			bindKey: {
				win: preferences.getKeyBinding('quote'),
				mac: preferences.getKeyBinding('quote', 'mac'),
				sender: "editor"
			},
			exec: function (editor, args, request) {
				if (editor.getSession().$modeId.match(/markdown$/) ){
					editor.commands.exec('prependLineSelection', editor, ['> ', true]);
				} else {
					editor.commands.exec('wrapSelection', editor, ['<blockquote>', '</blockquote>']);
				}
			},
			multiSelectAction: "forEach"
		}, {
			name: "ul",
			bindKey: {
				win: preferences.getKeyBinding('ul'),
				mac: preferences.getKeyBinding('ul', 'mac'),
				sender: "editor"
			},
			exec: function (editor, args, request) {
				if (editor.getSession().$modeId.match(/markdown$/) ){
					editor.commands.exec('prependLineSelection', editor, ['* ', true]);
				} else {
					editor.commands.exec('wrapLineSelection', editor, ["<li>", "</li>"]);
					editor.indent();
					var sel = editor.getSelectionRange();
					sel.start.column = 0;
					editor.selection.setSelectionRange(sel);
					editor.commands.exec('wrapSelection', editor, ["<ul>\n", "\n</ul>"]);
				}
			},
			multiSelectAction: "forEach"
		}, {
			name: "ol",
			bindKey: {
				win: preferences.getKeyBinding('ol'),
				mac: preferences.getKeyBinding('ol', 'mac'),
				sender: "editor"
			},
			exec: function (editor, args, request) {
				if (editor.getSession().$modeId.match(/markdown$/) ){
					editor.commands.exec('prependLineSelection', editor, ['1. ', true]);
				} else {
					editor.commands.exec('wrapLineSelection', editor, ["<li>", "</li>"]);
					editor.indent();
					var sel = editor.getSelectionRange();
					sel.start.column = 0;
					editor.selection.setSelectionRange(sel);
					editor.commands.exec('wrapSelection', editor, ["<ol>\n", "\n</ol>"]);
				}
			},
			multiSelectAction: "forEach"
		}, {
			name: "createLink",
			bindKey: {
				win: preferences.getKeyBinding('createLink'),
				mac: preferences.getKeyBinding('createLink', 'mac'),
				sender: "editor"
			},
			exec: function (editor, args, request) {
				prompt.prompt({
					title: 'Insert Link',
					fn :function (button, string) {
						if (button == 'ok') {
							var link_text = editor.getSelectedText();
							if (!link_text.length) {
								link_text = string;
							}
							if (editor.getSession().$modeId.match(/markdown$/) ){
								editor.insert('['+link_text+']('+string+')');
							} else {
								editor.insert('<a href="'+string+'">'+link_text+'</a>');
							}
						}
					}
				});
			},
			multiSelectAction: "forEach"
		}, {
			name: "insertImage",
			bindKey: {
				win: preferences.getKeyBinding('insertImage'),
				mac: preferences.getKeyBinding('insertImage', 'mac'),
				sender: "editor"
			},
			exec: function (editor, args, request) {
				prompt.prompt({
					title: 'Insert Image',
					placeholder: 'Enter image url e.g. http://..',
					fn :function (button, string) {
						if (button == 'ok') {
							if (editor.getSession().$modeId.match(/markdown$/) ){
								var sel = editor.selection.getSelectionLead();
								editor.insert('![]('+string+')');
								editor.selection.moveCursorToPosition(sel);
								editor.selection.moveCursorBy(0, 2);
							} else {
								editor.insert('<img src="'+string+'" alt="">');
								editor.selection.moveCursorBy(0, -2);
							}
						}
					}
				});
			},
			multiSelectAction: "forEach"
		}, {
			name: "copylinesup",
			bindKey: {
				win: preferences.getKeyBinding('copyLinesUp'),
				mac: preferences.getKeyBinding('copyLinesUp', 'mac'),
				sender: "editor"
			},
			exec: function(editor) { editor.copyLinesUp(); },
			scrollIntoView: "cursor"
		}, {
			name: "movelinesup",
			bindKey: {
				win: preferences.getKeyBinding('moveLinesUp'),
				mac: preferences.getKeyBinding('moveLinesUp', 'mac'),
				sender: "editor"
			},
			exec: function(editor) { editor.moveLinesUp(); },
			scrollIntoView: "cursor"
		}, {
			name: "copylinesdown",
			bindKey: {
				win: preferences.getKeyBinding('copyLinesDown'),
				mac: preferences.getKeyBinding('copyLinesDown', 'mac'),
				sender: "editor"
			},
			exec: function(editor) { editor.copyLinesDown(); },
			scrollIntoView: "cursor"
		}, {
			name: "movelinesdown",
			bindKey: {
				win: preferences.getKeyBinding('moveLinesDown'),
				mac: preferences.getKeyBinding('moveLinesDown', 'mac'),
				sender: "editor"
			},
			exec: function(editor) { editor.moveLinesDown(); },
			scrollIntoView: "cursor"
		}, {
			name: "removeline",
			bindKey: {
				win: preferences.getKeyBinding('removeLine'),
				mac: preferences.getKeyBinding('removeLine', 'mac'),
				sender: "editor"
			},
			exec: function(editor) { editor.removeLines(); },
			scrollIntoView: "cursor",
			multiSelectAction: "forEachLine"
		}, {
			name: "reload",
			bindKey: {
				win: preferences.getKeyBinding('reload'),
				mac: preferences.getKeyBinding('reload', 'mac'),
				sender: "editor"
			},
			exec: jQuery.proxy(function (editor, args, request) {
				return tabs.reload(this);
			}, tab)
		}, {
			name: "fullScreen",
			bindKey: {
				win: preferences.getKeyBinding('fullScreen'),
				mac: preferences.getKeyBinding('fullScreen', 'mac'),
				sender: "editor"
			},
			exec: jQuery.proxy(function (editor, args, request) {
				return jQuery.proxy(tabs.fullScreen, this)();
			}, tab)
		}, {
			name: "fold",
			bindKey: {
				win: preferences.getKeyBinding('collapseSelection'),
				mac: preferences.getKeyBinding('collapseSelection', 'mac'),
				sender: "editor"
			},
			exec: function(editor) { editor.session.toggleFold(false); },
			multiSelectAction: "forEach",
			scrollIntoView: "center",
			readOnly: true
		}, {
			name: "unfold",
			bindKey: {
				win: preferences.getKeyBinding('expandSelection'),
				mac: preferences.getKeyBinding('expandSelection', 'mac'),
				sender: "editor"
			},
			exec: function(editor) { editor.session.toggleFold(false); },
			multiSelectAction: "forEach",
			scrollIntoView: "center",
			readOnly: true
		}, {
			name: "tag-start",
			bindKey: {
				win: '<',
				mac: '<',
				sender: "editor"
			},
			exec: function(editor) { 
				editor.insert('<');
				editor.commands.exec('startAutocomplete', editor);
			},
			multiSelectAction: "forEach",
		}, {
			name: "php-tag-start",
			bindKey: {
				win: '?',
				mac: '?',
				sender: "editor"
			},
			exec: function(editor) { 
				editor.insert('?');
				editor.commands.exec('startAutocomplete', editor);
			},
			multiSelectAction: "forEach",
		}]);
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
	var tab = tabpanel.tabs('add', title, '<div class="vbox"><div class="editor_toolbar"></div>\
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
	
		// tab colour - disabled as the colours are hard to interpret
		/*
		if ($('#siteStyle-'+siteId).length===0) {
			var color = util.strToHex(siteId);
			$('<style id="siteStyle-'+siteId+'">li[data-site="' + siteId + '"]{border-top: 1px solid ' + color + ' !important;}</style>').appendTo('head');
		}
		*/
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

	//check mode for default file associations
	var ext = util.fileExtension(file);
	var mode = modes.find(ext);

	// hack to get html snippets in php
	if(mode=='php') {
		var setPHPMode = function(e, editor) {
			setMode(editor, 'php');
			
			// load more php snippets
			var snippets = snippetManager.parseSnippetFile("snippet <?\n\
	<?php\n\
\n\
	${1}\n\
snippet ec\n\
	echo ${1};\n\
snippet <?e\n\
	<?php echo ${1} ?>\n\
# this one is for php5.4\n\
snippet <?=\n\
	<?=${1}?>\n\
snippet foreachkil\n\
	<?php foreach ($${1:variable} as $${2:key} => $${3:value}): ?>\n\
		${4:<!-- html... -->}\n\
	<?php endforeach; ?>\n\
snippet ifil\n\
	<?php if (${1:true}): ?>\n\
		${2:<!-- code... -->}\n\
	<?php endif; ?>\n\
snippet ifeil\n\
	<?php if (${1:true}): ?>\n\
		${2:<!-- html... -->}\n\
	<?php else: ?>\n\
		${3:<!-- html... -->}\n\
	<?php endif; ?>\n\
	${4}\n\
snippet foreachil\n\
	<?php foreach ($${1:variable} as $${2:value}): ?>\n\
		${3:<!-- html... -->}\n\
	<?php endforeach; ?>\n\
			");
			snippetManager.register(snippets || [], 'html');
			
			snippets = snippetManager.parseSnippetFile("snippet ifil\n\
	<?php if (${1:true}): ?>${2:code}<?php endif; ?>\n\
snippet ifeil\n\
	<?php if (${1:true}): ?>${2:code}<?php else: ?>${3:code}<?php endif; ?>${4}\n\
			");
			snippetManager.register(snippets || [], 'html-tag');
			
			editor.off("changeMode", setPHPMode);
		};
		
		editor.on("changeMode", setPHPMode);
		setMode(editor, 'html');
	} else {
		setMode(editor, mode);
	}

	//disable warning
	editor.$blockScrolling = Infinity;

	//split isn't properly implemented in Ace so we have to use globals :|
	if(!window.splits) window.splits = {};
	window.splits[tab.attr('id')] = split;

	var session = editor.getSession();
	
	// fix Double click php var selects $ #2882	
	session.getWordRange = function(row, column) {
		var line = this.getLine(row);
		var tokenRe = this.tokenRe;
		var nonTokenRe = this.nonTokenRe;
		var state = this.getState(row, column);
		var tokenizer = this.$mode.getTokenizer();
		var tokens = tokenizer.getLineTokens(line.substr(0, column), state, row);
		var tokenState = typeof tokens.state == 'object' ? tokens.state[0] : tokens.state;
		var match = tokenState.match(/^([a-z]+\-)/i);
		
		if (match) {
			tokenRe = this.$mode.$modes[match[1]].tokenRe;
			nonTokenRe = this.$mode.$modes[match[1]].tokenRe;
		}
		
		var prefs = preferences.get_prefs();
		if (prefs.selectDollar) {
			tokenRe = this.tokenRe;
			nonTokenRe = this.nonTokenRe;
		}

		var inToken = false;
		if (column > 0)
			inToken = !!line.charAt(column - 1).match(tokenRe);

		if (!inToken)
			inToken = !!line.charAt(column).match(tokenRe);

		var re;
		if (inToken)
			re = tokenRe;
		else if (/^\s+$/.test(line.slice(column-1, column+1)))
			re = /\s/;
		else
			re = nonTokenRe;

		var start = column;
		if (start > 0) {
			do {
				start--;
			}
			while (start >= 0 && line.charAt(start).match(re));
			start++;
		}

		var end = column;
		while (end < line.length && line.charAt(end).match(re)) {
			end++;
		}

		return new Range(row, start, row, end);
	};

	//syntax bar handlers
	panel.find('.previous').button()
	.click(jQuery.proxy(syntax_errors.previous, tab));

	panel.find('.next').button()
	.click(jQuery.proxy(syntax_errors.next, tab));

	//FIREPAD
	var firepad = false;
	if( siteId && (settings.shared || tab.attr('shared')) ){
		firepad = true;

		if( !firebase.isConnected() ){
			tab.attr('data-firepad', 1);

			firebase.connect(function() {
				addFirepad(tab);
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

	$(tab).on('save', function() {
		var firepad = $(tab).data('firepad');
		
		if( firepad ){
			var revision = firepad.firebaseAdapter_.revision_;
			firepad.firebaseAdapter_.ref_.child('save').set({
				revision: revision,
				last_modified: $(tab).data('mdate'),
				username: localStorage.username
			});
			console.log('revision set to: '+revision);
		}
	});
	
	$(tab).on('share', function() {
		console.log('shared');
		
		// add firepad
		var firepad = $(tab).data('firepad');
		if (!firepad) {
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
		}
	});
	
	$(tab).on('unshare', function() {
		console.log('unshared');
		
		// remove firepad
		var firepad = $(tab).data('firepad');
		if (firepad) {
			removeFirepad(tab);
		}
	});
	
	$(tab).on('beforeClose', destroy);

	//autocomplete
	editor.completer = new Autocomplete();

	window.shiftedit.defs[$(tab).attr('id')] = {
		'definitions': {},
		'definitionRanges': {},
		'definitionLibs': {}
	};

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
	
	$('<div class="fullScreenBtn" title="Full Screen (Ctrl-Shift-F)"><i class="fa fa-expand"></i></div>').appendTo($(editor.container))
	.click(jQuery.proxy(tabs.fullScreen, tab));

	return $(tab);
}

function setMode(editor, mode) {
	editor.getSession().setMode("ace/mode/" + mode);

	//worker settings
	var options = {};
	var prefs = preferences.get_prefs();
	var panel = $(editor.container).closest('.ui-tabs-panel');
	
	var useLint = true;
	switch (mode){
		case 'javascript':
			useLint = !prefs.jslint_disable;
			
			if (useLint) {
				// set lint prefs
				var jslint_options = preferences.jslint_options;
	
				$.each(jslint_options, function (key, item) {
					options[item.name] = prefs['jslint_' + item.name];
				});
	
				if (editor.session.$worker) {
					editor.session.$worker.send("changeOptions", [options]);
				}
			}
		break;
		case 'css':
			useLint = !prefs.csslint_disable;
			
			if (useLint) {
				var csslint_options = preferences.csslint_options;
				var disable_rules = [];
	
				$.each(csslint_options, function (key, item) {
					disable_rules.push(item.name);
				});
	
				if (editor.session.$worker) {
					editor.session.$worker.send("setDisabledRules", [disable_rules]);
				}
			}
		break;
		case 'coffee':
			useLint = !prefs.coffeelint_disable;
		break;
	}
	
	// disable for modes that don't have a linter
	if (['coffee','css','html','javascript','json','lua','php','xquery'].indexOf(mode)===-1) {
		useLint = false;
	}

	// toggle lint checking
	editor.session.setUseWorker(useLint);
	$(panel).find('.editor_status').toggle(useLint);
	$(panel).find('.syntaxErrorsButton').toggleClass('ui-state-disabled', !useLint);
	resize.resize();
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