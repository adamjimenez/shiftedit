define(['app/config', 'app/loading','app/tabs', 'app/prefs', 'app/util', "app/modes", "jquery-ui",'ace/ace','jsdiff'], function (config, loading, tabs, preferences, util) {
var modes = require('app/modes');

var revisionsEditor;
var lineNumbers = [];

function select() {
	var li = $(this).parent();
	li.parent().children().removeClass('ui-state-focus');
	li.addClass('ui-state-focus');
	
	// scroll
	var container = li.parent().parent();
	var scrollPos = container.scrollTop();
	var offset = li.position().top;
	
	// scroll down
	if (offset+li.height() > scrollPos+container.height()) {
		container.scrollTop((offset+li.height()) - container.height());
	}
	
	// scroll up
	if (offset-li.height() < scrollPos) {
		container.scrollTop(offset);
	}
	
	var content = li.data('content');
	var tab = tabs.active();
	var editor = tabs.getEditor(tab);

	//show diff
	//remove markers
	var session = revisionsEditor.getSession();
	var markers = session.getMarkers();
	for (var i in markers) {
		if (markers.hasOwnProperty(i)) {
			session.removeMarker(i);
		}
	}

	// don't diff big files or the browser will crash
	if( editor.getValue().length < 100000 ){
		var range = require("ace/range").Range;
		var diff = JsDiff.diffLines(editor.getValue(), content);

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
		
		revisionsEditor.setValue(diffContent);
		revisionsEditor.moveCursorToPosition({column:0, row:0});

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
				if (foldEnd > foldStart) {
					session.addFold("...", new range(foldStart, 0, foldEnd, 0));
				}
				foldStart = end.row + diffPadding;

				// scroll to first marker
				if( firstDiff ){
					revisionsEditor.scrollToRow(start.row-5);
					firstDiff = false;
				}
			}
			index += diff[i].value.length;
		}
		
		// final fold
		foldEnd = session.getLength();					
		if (foldEnd > foldStart) {
			session.addFold("", new range(foldStart, 0, foldEnd, 0));
		}
	}else{
		revisionsEditor.setValue(content);
		revisionsEditor.moveCursorToPosition({column:0, row:0});
	}
}

function load(siteId, file) {
	loading.fetch(config.apiBaseUrl+'revisions?site='+siteId+'&file='+file, {
		action: 'getting revisions',
		success: function(data) {
			// remove old options
			$( "#revisionFile option, #revision" ).children().remove();
			
			// add file options
			$.each(data.files, function( index, item ) {
				$( '<option value="'+item+'">' + item + '</option>' ).appendTo( "#revisionFile" )
				.data('content', item.content);
			});
			$( "#revisionFile" ).val(file);
			$( "#revisionFile" ).selectmenu('refresh');

			// add revision options if content is different
			var tab = tabs.active();
			var editor = tabs.getEditor(tab);
			var content = editor.getValue();
			$.each(data.revisions, function( index, item ) {
				if (item.content!==content) {
					$( '<li value="'+item.id+'"><a href="#">' + item.date + ' ' + item.author + '</a></li>' ).appendTo( "#revision" )
					.data('content', item.content);
				}
			});
			$( "#revision li:first-child a" ).trigger('click');
		}
	});
}

function open() {
	tab = tabs.active();

	if(!tab) {
		return false;
	}
	
	var siteId = tab.data('site');
	var file = tab.data('file');
	
	if (!siteId) {
		return false;
	}

	//revisions dialog
	$( "body" ).append('<div id="dialog-revisions" title="Revisions">\
		<div class="revisions vbox">\
			<div id="revisionFileHolder">\
				<select id="revisionFile" class="ui-widget ui-state-default ui-corner-all"></select>\
			</div>\
			<div id="revisionHolder" class="flex">\
				<ul id="revision"></ul>\
			</div>\
		</div>\
		<div id="revisionDiff">\
		</div>\
	</div>');

	//open dialog
	var dialog = $( "#dialog-revisions" ).dialog({
		modal: true,
		width: $(window).width()-20,
		height: $(window).height()-20,
		buttons: {
			Revert: function() {
				//revert file
				var tab = tabs.active();
				var editor = tabs.getEditor(tab);
				var content = $( "#revision option:selected" ).data('content');
				editor.setValue(content);

				$( this ).dialog( "close" );
			},
			Cancel: function() {
				$( this ).dialog( "close" );
			}
		},
		resizeStop: function( event, ui ) {
			setTimeout(function() {
				revisionsEditor.resize();
			}, 250);
		},
		close: function( event, ui ) {
			$( this ).remove();
		}
	});

	$('#revision').on('click', 'a', select);
	
	//handle keyboard: up / down
	$( "#revision" ).keydown(function(e) {
		var activeEl = $('#revision .ui-state-focus');
		var size = Math.floor($(this).height()/activeEl.height());
		
		switch(e.keyCode){
			case 38: //up
				activeEl.prev().children('a').click();
				return false;
			case 40: //down
				activeEl.next().children('a').click();
				return false;
			case 33: //page up
				next = activeEl.prevAll( ":eq("+size+")");

				if(!next.length) {
					next = activeEl.prevAll().last();
				}

				next.children('a').click();
				return false;
			case 34: //page down
				next = activeEl.nextAll( ":eq("+size+")");

				if(!next.length) {
					next = activeEl.nextAll().last();
				}

				next.children('a').click();
				return false;
			case 35: //end
				activeEl.nextAll().last().children('a').click();
				return false;
			case 36: //home
				activeEl.prevAll().last().children('a').click();
				return false;
		}
	});

	//load files and revisions
	load(siteId, file);

	//revision panel
	var container = $('#revisionDiff')[0];
	revisionsEditor = ace.edit(container);
	revisionsEditor.$blockScrolling = Infinity; // disable warning
	revisionsEditor.setReadOnly(true);
	
	revisionsEditor.session.gutterRenderer =  {
		getWidth: function(session, lastLineNumber, config) {
			return lastLineNumber.toString().length * config.characterWidth;
		},
		getText: function(session, row) {
			return lineNumbers[row] || row;
		}
	};
	
	$('#revision').focus();

	$( "#revisionFile" ).selectmenu({
		select: function() {
			//load revisions
			load(siteId, $(this).val());
		}
	});

}

//listener
$('body').on('click', '#revisionHistory a', open);

return {
	open: open
};


});