define(['./config', './loading','./tabs', './site', './prefs', './util', "./modes", "jquery-ui-bundle",'ace/ace',"ui.basicMenu","dialogResize"], function (config, loading, tabs, site, preferences, util, modes) {

var revisionsEditor;
var lineNumbers = [];

function show(li) {
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
	if( editor && editor.getValue().length < 100000 ){
		var range = require("ace/range").Range;
		
		require(["diff"], function(JsDiff) {
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
				session.addFold("...", new range(foldStart, 0, foldEnd, 0));
			}
		});
	}else{
		revisionsEditor.setValue(content);
		revisionsEditor.moveCursorToPosition({column:0, row:0});
	}
}

function select(li) {
	var tab;
	li.parent().children().find('button').remove();
	li.append('<button type="button" class="restore">Restore revision</button>');
	
	$('.restore').button().click(function() {
		//revert file
		tab = tabs.active();
		var editor = tabs.getEditor(tab);
		if (editor) {
			var content = $( this ).parent().data('content');
			editor.setValue(content);
		}

		$( "#dialog-revisions" ).dialogResize( "close" );
	});
	
	var content = li.data('content');
	
	if (content) {
		show(li);
	} else {
		tab = tabs.active();
	
		var siteId;
		var file;
		if(tab.data('site')) {
			siteId = tab.data('site');
			file = $( "#revisionFile" ).val();
		} else {
			siteId = site.active();
		}
		
		
		load(siteId, file, li.data('id'));
	}
}

function load(siteId, file, revision) {
	revision = revision || '';
	
	loading.fetch(config.apiBaseUrl+'revisions?site='+siteId+'&file='+file+'&revision='+revision+'&no_content=1', {
		action: 'getting revisions',
		success: function(data) {
			if (typeof(data.content)!=='undefined') {
				$( "#revision li[data-id='"+data.id+"']" ).data('content', data.content)
				.children('a').click();
			} else {
				$( "#revisionFile" ).children('option').remove();
				
				// add file options
				$.each(data.files, function( index, item ) {
					$( '<option value="'+item+'">' + item + '</option>' ).appendTo( "#revisionFile" )
					.data('content', item.content);
				});
				$( "#revisionFile" ).val(file);
				$( "#revisionFile" ).selectmenu('refresh');
				
				// remove existing revision options
				$( "#revisionFile option, #revision" ).children().remove();
	
				// add revision options if content is different
				var tab = tabs.active();
				var editor = tabs.getEditor(tab);
				var content = '';
				if (editor) {
					content = editor.getValue();
				}
				$.each(data.revisions, function( index, item ) {
					if (item.content!==content) {
						$( '<li><a href="#"><span class="date">' + item.date + '</span><span class="author">' + item.author + '</span></a></li>' ).appendTo( "#revision" )
						.attr('data-id', item.id);
					}
				});
				
				if (!revision) {
					$( "#revision li:first-child a" ).trigger('click');
				}
			}
		}
	});
}

function open() {
	var tab = tabs.active();

	var siteId;
	var file;
	if(tab.data('site')) {
		siteId = tab.data('site');
		file = tab.data('file');
	} else {
		siteId = site.active();
	}
	
	if (!siteId) {
		return false;
	}

	//revisions dialog
	$( "body" ).append('<div id="dialog-revisions" title="Revisions">\
		<div class="revisionsContainer hbox">\
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
		</div>\
	</div>');

	//open dialog
	var w = $(window).width()-20;
	var h = $(window).height()-20;
	
	var dialog = $( "#dialog-revisions" ).dialogResize({
		modal: true,
		width: w,
		height: h,
		scaleW: 1,
		scaleH: 1,
		resizeStop: function( event, ui ) {
			setTimeout(function() {
				revisionsEditor.resize();
			}, 250);
		},
		close: function( event, ui ) {
			$( this ).remove();
		}
	});
	
	$("#revision").basicMenu({
		select: function (event, ui) {
			select(ui.item);
		}
	});

	//load files and revisions
	load(siteId, file);

	//revision panel
	var container = $('#revisionDiff')[0];
	revisionsEditor = ace.edit(container);
	revisionsEditor.$blockScrolling = Infinity; // disable warning
	revisionsEditor.setReadOnly(true);
	$(revisionsEditor.textInput.getElement()).attr('readonly', 'readonly');
	
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

return {
	open: open
};

});