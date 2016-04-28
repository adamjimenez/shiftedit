define(['app/tabs', 'app/layout', 'app/modes', 'app/util', 'jquery','ace/ace','jsdiff'], function (tabs, layout, modes, util) {

var updateTimer;

function updateOptions() {
    $( "select.diffFiles" ).each(function() {
        var select = $(this);
        var val = select.val();
        select.children( "option" ).remove();

        //add blank option
        select.append('<option value=""></option>');

        //populate select menus
        $( "li[data-file]" ).each(function(index) {
            select.append( '<option value="'+$(this).attr('id')+'">'+$(this).attr('data-title')+'</option>' );
        });

        select.val(val);
    });
}

function create() {
    layout.get().open('east');

    //create tab
	tab = $(".ui-layout-east").tabs('add', 'File Compare', '<div class="vbox"><div class="diff_toolbar ui-widget-header ui-corner-all">\
	<select class="diffFiles flex"></select>\
	<select class="diffFiles flex"></select>\
	</div>\
	<div class="editor"></div></div>');

    tab.addClass('closable');

    var panel = $(tab).closest(".ui-tabs").tabs('getPanelForTab', tab);
	var container = $(panel).find('div.editor')[0];
	var editor = ace.edit(container);
	editor.renderer.setHScrollBarAlwaysVisible(true);
	editor.renderer.setVScrollBarAlwaysVisible(true);
	editor.setReadOnly(true);

    updateOptions();

    return tab;
}

function select() {
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
	//remove markers
	var container = $(panel).find('div.editor')[0];
	var editor = ace.edit(container);
	var session = editor.getSession();
	var markers = session.getMarkers();

	/*
	//set mode
	var ext = util.fileExtension(tab1.attr('data-file'));

	//check default file associations
	var mode = modes.find(ext);

    session.setMode("ace/mode/" + mode);
	for (var i in markers) {
        if (markers.hasOwnProperty(i)) {
		    session.removeMarker(i);
        }
	}
	*/

	// don't diff big files or the browser will crash
	if( content1.length < 100000 ){
		var range = require("ace/range").Range;
		var diff = JsDiff.diffLines(content1, content2);

		diffContent = '';
		var ranges = [];
		var index = 0;
		var start = {};
		var end = {};
		var className = '';
		var firstDiff = true;

		for (i=0; i < diff.length; i++) {
			diffContent += diff[i].value;
		}
		editor.setValue(diffContent);
		editor.moveCursorToPosition({column:0, row:0});

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

				//scroll to first marker
				if( firstDiff ){
					editor.scrollToRow(start.row-5);
					firstDiff = false;
				}
			}

			index += diff[i].value.length;
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