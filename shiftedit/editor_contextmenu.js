define(["jquery.contextMenu","app/util",'app/lang','app/tabs','app/menubar'], function () {
var lang = require('app/lang').lang;
var makeMenuText = require('app/util').makeMenuText;
var tabs = require('app/tabs');
var selectionMenuItems = require('app/menubar').selectionMenuItems;

var items = {};
var i = 0;
selectionMenuItems.forEach(function(item) {
	if(item==='-'){
		items["sep"+i] = "---------";
		i++;
	}else{
		items[item.id] = {
			"name": item.text,
			"callback": item.handler
		};
	}
});

function init() {
	//prevent gutter context menu
	$(document).on('contextmenu', '.editor', function(e) {
		if (e.target.classList.contains('ace_gutter-cell')) {
			e.preventDefault();
			e.stopImmediatePropagation();
		}
	});

	$.contextMenu({
		selector: '.editor',
		callback: function(key, opt){
			var panel = $(this).closest("[role=tabpanel]");
			var tab = $("[role=tab][aria-controls="+panel.attr('id')+"]");
			var editor = tabs.getEditor(tab);

			switch(key) {
				case 'find':
					editor.exec('find', editor);
				break;
				case 'findPrev':
					editor.exec('findprevious', editor);
				break;
				case 'findNext':
					editor.exec('findnext', editor);
				break;
				case 'replace':
					editor.exec('replace', editor);
				break;
				case 'replaceAll':
					editor.exec('replaceall', editor);
				break;
				case 'selectAll':
					editor.selectAll();
				break;
				case 'undo':
					editor.redo();
				break;
				case 'redo':
					editor.undo();
				break;
			}
		},
		items: {
			"selection": {
				"name": "Selection",
				"items": items
			},
			"find": {name: makeMenuText('Find', 'Ctrl-F')},
			"findPrev": {name: makeMenuText('Find Previous', 'Ctrl-Shift-K')},
			"findNext": {name: makeMenuText('Find Next', 'Ctrl-K')},
			"replace": {name: makeMenuText('Replace', 'Ctrl-R')},
			"replaceAll": {name: makeMenuText('Replace All', 'Ctrl-Shift-R')},
			"sep1": "---------",
			"selectAll": {name: makeMenuText('Select All', 'Ctrl-A')},
			"sep2": "---------",
			"undo": {name: makeMenuText('Undo', 'Ctrl-Z')},
			"redo": {name: makeMenuText('Redo', 'Ctrl-Y')}
		}
	});
}

return {
	init: init
};

});