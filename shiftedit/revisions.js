define(['app/loading','app/tabs','jquery','ace/ace','jsdiff'], function (loading, tabs) {

var revisionsEditor;

function load(siteId, file) {
    loading.fetch('/api/revisions?site='+siteId+'&file='+file, {
        action: 'getting revisions',
        success: function(data) {
            //remove old options
            $( "#revisionFile option, #revision option" ).remove();

            $.each(data.files, function( index, item ) {
                $( '<option value="'+item+'">' + item + '</option>' ).appendTo( "#revisionFile" )
                .data('content', item.content);
            });
            $( "#revisionFile" ).val(file);

            $.each(data.revisions, function( index, item ) {
                $( '<option value="'+item.id+'">' + item.date + ' ' + item.author + '</option>' ).appendTo( "#revision" )
                .data('content', item.content);
            });
            $( "#revision option:first-child" ).prop('selected', true);
            $( "#revision" ).trigger('change');
        }
    });
}

function open() {
    console.log(arguments);
    if(!tab) {
        tab = tabs.active();
    }

    if(!tab) {
        return false;
    }

    //revisions dialog
    $( "body" ).append('<div id="dialog-revisions" title="Revisions">\
        <div class="revisions">\
            <p><select id="revisionFile"></select></p>\
            <p><select id="revision" size="20"></select></p>\
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
        }
    });

    //load files and revisions
    var siteId = tab.data('site');
    var file = tab.data('file');
    load(siteId, file);

    //revision panel
	var container = $('#revisionDiff')[0];
	revisionsEditor = ace.edit(container);

	$( "#revisionFile" ).change(function() {
	    //load revisions
        load(siteId, $(this).val());
	});
	$( "#revision" ).change(function() {
	    var content = $( "#revision option:selected" ).data('content');
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

			for (i=0; i < diff.length; i++) {
				diffContent += diff[i].value;
			}
			revisionsEditor.setValue(content);
			revisionsEditor.moveCursorToPosition({column:0, row:0});

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
						revisionsEditor.scrollToRow(start.row-5);
						firstDiff = false;
					}
				}

				index += diff[i].value.length;
			}
		}else{
			revisionsEditor.setValue(selections[0].data.content);
			revisionsEditor.moveCursorToPosition({column:0, row:0});
		}
	});

}

//listener
$('body').on('click', '#revisionHistory a', function(e){ open(); });
    return {
        open: open
    };
});