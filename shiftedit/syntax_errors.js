define(['app/lang','app/tabs'], function () {
var lang = require('app/lang').lang;
var tabs = require('app/tabs');

/*
var editors = shiftedit.app.tabs.editors;
var indexes = shiftedit.app.tabs.indexes;

var jslint_options = shiftedit.app.preferences.jslint_options;
var coffeelint_options = shiftedit.app.preferences.coffeelint_options;
var csslint_options = shiftedit.app.preferences.csslint_options;

var prefs = shiftedit.app.get_prefs();
*/

var fixes = {
	'javascript': {
		"Missing semicolon.": function(str, o){
			return str.substr(0, o.column)+';'+str.substr(o.column);
		},
		"Expected '{a}' and instead saw '{b}'.": function(str, o){
			return str.substr(0, o.column)+'='+str.substr(o.column);
		},
		"A leading decimal point can be confused with a dot: '{a}'.": function(str, o){
			return str.substr(0, o.column).replace(/(\.\d+$)/, "0$1")+str.substr(o.column);
		},
		"Missing radix parameter.": function(str, o){
			return str.substr(0, o.column)+', 10'+str.substr(o.column);
		},
		"Mixed spaces and tabs.": function(str, o){
			var spaces='';
			for (i = 0; i < prefs.tabSize; i++) {
				spaces += ' ';
			}

			if (prefs.softTabs) {
				str = str.replace(/\t/g, spaces);
			} else {
				str = str.replace(new RegExp(spaces, 'g'), '\t');
			}

			return str;
		},
		"Unnecessary semicolon.": function(str, o){
			return str.substr(0, o.column)+str.substr(o.column+1);
		}
	},
	'css': {
		"Disallow overqualified elements": function(str, o){
			return str.substr(0, o.column)+str.substr(o.column).replace(/^[^\.#]+/, "");
		},
		"Disallow units for 0 values": function(str, o){
			return str.substr(0, o.column+1)+str.substr(o.column+1).replace(/^[a-zA-Z%]+/, "");
		}
	},
	'php': {

	}
};

function update() {
	var tab = this;
	var editor = tabs.getEditor(tab);
	var session = editor.getSession();

	//FIXME tab can be in any panel
	var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);
	var editor_status = $(panel).find('.editor_status');
	$(editor_status).attr('data-currentError', 0);

	//get errors
	var errors = session.getAnnotations();
	if (!errors.length) {
		$(panel).find('.status').html(lang.noSyntaxErrorsText);
		$('.editor_status').removeClass('ui-state-highlight');
		$('.editor_status').find('button').attr('disabled', 'disabled');
		return;
	}

	jQuery.proxy(show, this)();
}

function previous() {
	return jQuery.proxy(next, this, false)();
}

function next(forward) {
	var tab = this;

	//FIXME tab can be in any panel
	var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);
	var editor_status = $(panel).find('.editor_status');
	var currentError = parseInt($(editor_status).attr('data-currentError'));
	var nextError = forward ? currentError + 1 : currentError - 1;

	$(editor_status).attr('data-currentError', nextError);

	jQuery.proxy(show, this)();
}

function show() {
	var tab = this;
	var editor = tabs.getEditor(tab);
	var session = editor.getSession();

	//FIXME tab can be in any panel
	var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);
	var editor_status = $(panel).find('.editor_status');
	var errors = session.getAnnotations();

	//show current error
	var currentError = parseInt($(editor_status).attr('data-currentError'));

	if(!errors[currentError]){
		return;
	}

	var error = errors[currentError].text;
	var line = errors[currentError].row + 1;

	$(editor_status).find('.status').html('[' + (currentError + 1) + '/' + errors.length + '] ' + error +
	' on <a href="#" class="line" data-line="' + line + '">line ' + line + '</a>');

	$(editor_status).addClass('ui-state-highlight');

	// go to line
	$(editor_status).find('.line').click(function() {
		var line = $(this).attr('data-line');
		editor.gotoLine(line);
		editor.focus();
	});

	//activate buttons
	if ((currentError+1)<errors.length) {
		$(editor_status).find('.next').removeAttr('disabled');
	} else {
		$(editor_status).find('.next').attr('disabled', 'disabled');
	}

	if (currentError>0) {
		$(editor_status).find('.previous').removeAttr('disabled');
	} else {
		$(editor_status).find('.previous').attr('disabled', 'disabled');
	}
}

function fixError () {
	var tabs = shiftedit.app.get_tabs();
	var tab = tabs.getActiveTab();

	Ext.get('status_error_fix' + indexes[tabs.getActiveTab().id]).dom.disabled = true;
	var editor = editors[tabs.getActiveTab().id];
	var o = tabs.getActiveTab().errors[tabs.getActiveTab().currentError];

	if( !o || !fixes[tab.lang][o.raw] ){
		return;
	}

	editor.gotoLine(parseInt(o.row));

	var str = editor.getLine(o.row);

	var raw;
	if( !o.raw ){
		o.raw = o.rule;
	}

	var line = editor.getLine(o.row);
	var result = fixes[tab.lang][o.raw](line, o);

	if( typeof result === 'string' ){
		editor.setLine(parseInt(o.row+1), result);
	}
}

return {
	update: update,
	next: next,
	previous: previous
};

});
