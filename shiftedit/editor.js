define(['app/tabs', 'exports', 'jquery','ace',"app/tabs", "app/util", "app/modes", 'jquery'], function (tabs, exports) {
var util = require('app/util');
var modes = require('app/modes').modes;
var editor;

function onChange(e) {
    var tabs = require("app/tabs");
	tabs.setEdited(this, true);
}

function saveFolds() {
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

function create(file, content, siteId, options) {
    //create tab
	tab = $(".ui-layout-center").tabs('add', file, '<div class="editor"></div>');
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

    $(".ui-layout-center").trigger("tabsactivate", [{newTab:tab}]);

	//load ace
	var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);
	editor = ace.edit(panel.children('div')[0]);
	editor.setTheme("ace/theme/monokai");

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

    //event listeners
	editor.getSession().doc.on('change', jQuery.proxy(onChange, tab));
	editor.getSession().on('changeFold', jQuery.proxy(saveFolds, tab));

	//shortcuts
	//save
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

	editor.focus();
}

function focus() {
    editor.focus();
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

/*
return {
    create: create
};*/

exports.create = create;
exports.focus = focus;

});