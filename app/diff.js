define(['./tabs', './layout', './modes', './util', 'jquery','ace/ace','diff'], function (tabs, layout, modes, util) {

var updateTimer;

function updateOptions() {
	$( "select.diffFiles" ).each(function() {
		var select = $(this);
		var val = select.val();
		select.children( "option" ).remove();

		//add blank option
		select.append('<option value="">Choose a file</option>');

		//populate select menus
		$( "li[data-file]" ).each(function(index) {
			select.append( '<option value="'+$(this).attr('id')+'">'+$(this).attr('data-title')+'</option>' );
		});

		select.val(val);
	});
}

function create(tabpanel) {
	//create tab
	tab = $(tabpanel).tabs('add', 'File Compare', '\
		<div class="vbox">\
			<div class="diff_toolbar ui-widget-header ui-corner-all">\
				<select class="diffFiles flex ui-widget ui-state-default ui-corner-all"></select>\
				<select class="diffFiles flex ui-widget ui-state-default ui-corner-all"></select>\
				<label><input type="checkbox" id="autofold" value="1">Fold similar</label>\
			</div>\
			<div class="editor"></div>\
		</div>\
	');

	tab.addClass('closable');

	var panel = $(tab).closest(".ui-tabs").tabs('getPanelForTab', tab);
	var container = $(panel).find('div.editor')[0];
	var editor = ace.edit(container);
	editor.renderer.setHScrollBarAlwaysVisible(true);
	editor.renderer.setVScrollBarAlwaysVisible(true);
	editor.setReadOnly(true);
	updateOptions();
	
	$('#autofold').checkboxradio({icon: false}).change(select);

	return tab;
}

function select() {
	var autofold = $('#autofold').is(':checked');
	var panel = $(this).closest('.ui-tabs-panel');

	var val1 = $(panel).find('select').eq(0).val();
	var val2 = $(panel).find('select').eq(1).val();

	if(!val1 || !val2){
		return;
	}

	var tab1 = $('#'+val1);
	var tab2 = $('#'+val2);

	var content1 = tabs.getEditor(tab1).getValue();
	var content2 = tabs.getEditor(tab2).getValue();

	//show diff
	var container = $(panel).find('div.editor')[0];
	var editor = ace.edit(container);
	editor.$blockScrolling = Infinity;
	var session = editor.getSession();
	
	//remove markers
	var markers = session.getMarkers();
	for (var i in markers) {
		if (markers.hasOwnProperty(i)) {
			session.removeMarker(i);
		}
	}

	/*
	//set mode
	var ext = util.fileExtension(tab1.attr('data-file'));

	//check default file associations
	var mode = modes.find(ext);

	session.setMode("ace/mode/" + mode);
	*/

	// don't diff big files or the browser will crash
	if( content1.length < 100000 ){
		var range = require("ace/range").Range;
		var JsDiff = require("diff");
		var diff = JsDiff.diffLines(content1, content2);

		diffContent = '';
		var ranges = [];
		var index = 0;
		var start = {};
		var end = {};
		var className = '';
		var firstDiff = true;
		
		var lineCount = 0;
		var lineNum = 0;
		lineNumbers = [];
		for (i=0; i < diff.length; i++) {
			lineCount = diff[i].value.split(/\r\n|\r|\n/).length;
			
			if (i<diff.length-1) {
				lineCount--;
			}
			
			for (j=0; j<lineCount; j++) {
				if( !diff[i].removed ){
					lineNum += 1;
				}
				lineNumbers.push(lineNum);
			}
				
			diffContent += diff[i].value;
		}
		
		editor.setValue(diffContent);
		editor.moveCursorToPosition({column:0, row:0});

		var foldStart = 0;
		var foldEnd = 0;
		var lastRow = 0; // last diff row
		var diffPadding = 3; // 3 lines of padding
		for (i=0; i < diff.length; i++) {
			if( diff[i].added || diff[i].removed ){
				start = session.getDocument().indexToPosition(index);
				end = session.getDocument().indexToPosition(index+diff[i].value.length);

				if( diff[i].added ){
					className = 'added';
				}else if( diff[i].removed ){
					className = 'removed';
				}else{
					className = '';
				}

				if( className ){
					session.addMarker(new range(start.row, start.column, end.row, end.column), "ace_"+className, 'text');
				}
				
				// fold rows before
				foldEnd = start.row - diffPadding;
				if (autofold && foldEnd > foldStart) {
					session.addFold("...", new range(foldStart, 0, foldEnd, 0));
				}
				foldStart = end.row + diffPadding;

				// scroll to first marker
				if( firstDiff ){
					editor.scrollToRow(start.row-5);
					firstDiff = false;
				}
			}
			index += diff[i].value.length;
		}
		
		// final fold
		foldEnd = session.getLength();					
		if (autofold && foldEnd > foldStart) {
			session.addFold("...", new range(foldStart, 0, foldEnd, 0));
		}
	}else{
		editor.setValue(content1);
		editor.moveCursorToPosition({column:0, row:0});
	}
}

function update() {
	var id = $(this).attr('id');

	clearTimeout(updateTimer);
	updateTimer = setTimeout(
		function() {
			//trigger change in select handler
			$('option[value='+id+']:selected').parent().trigger('change');
		}, 100
	);
}

$('body').on('change', 'select.diffFiles', select);
$('body').on('change', 'li[data-file]', update);


$('body').on('close open', function() {
   updateOptions();
});

$('body').on('click','.newTab .diff', function(){
	var tabpanel = $(this).closest('.ui-tabs');
	create(tabpanel);

	var id = $(this).closest('[role=tabpanel]').attr('id');
	var tab = $('[aria-controls='+id+']');
	tabs.close(tab);
});

return {
};

});