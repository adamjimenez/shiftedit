define(["./util",'./lang','./tabs','./menubar','./prefs', "jquery-contextmenu"], function (util, lang, tabs, menubar, preferences) {
lang = lang.lang;
var makeMenuText = util.makeMenuText;

function init() {
	// selection menu
	var selectionMenuItems = menubar.selectionMenuItems();
	var items = {};
	var i = 0;
	selectionMenuItems.forEach(function(item) {
		if(item==='-'){
			items["sep"+i] = "---------";
			i++;
		}else{
			items[item.id] = {
				"name": item.text,
				"callback": item.handler,
				isHtmlName: true
			};
		}
	});

	//prevent gutter context menu
	$(document).on('contextmenu', '.editor', function(e) {
		if (e.target.classList.contains('ace_gutter-cell')) {
			e.preventDefault();
			e.stopImmediatePropagation();
		}
	});

	$.contextMenu({
		selector: '.ace_editor',
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
			"find": {name: makeMenuText('Find', preferences.getKeyBinding('find'), 'find'), isHtmlName: true},
			"findPrev": {name: makeMenuText('Find Previous', 'Ctrl-Shift-K'), isHtmlName: true},
			"findNext": {name: makeMenuText('Find Next', 'Ctrl-K'), isHtmlName: true},
			"replace": {name: makeMenuText('Replace', 'Ctrl-R'), isHtmlName: true},
			"replaceAll": {name: makeMenuText('Replace All', 'Ctrl-Shift-R'), isHtmlName: true},
			"sep1": "---------",
			"selectAll": {name: makeMenuText('Select All', 'Ctrl-A'), isHtmlName: true},
			"sep2": "---------",
			"undo": {name: makeMenuText('Undo', 'Ctrl-Z'), isHtmlName: true},
			"redo": {name: makeMenuText('Redo', 'Ctrl-Y'), isHtmlName: true}
		}
	});
}

return {
	init: init
};

});