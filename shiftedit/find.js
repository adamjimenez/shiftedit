define(['app/tabs','app/layout', 'app/site', 'autosize', 'jquery-ui', 'ace/ace'], function (tabs, layout, site, autosize) {

    var timer;
    var findIn = 'current';
    var lastSearch = '';
    var searchSource;

	function find(needle, options) {
		if( !options ){
			options = {};
		}

		editor.find(needle, options);
	}

	function findAll(editor, options){
		if(!editor) {
			return;
		}

		var Search = require("ace/search").Search;
		var search = new Search().set(options);
		return search.findAll(editor.getSession());
	}

	function editorReplace(editor, find, replace) {
		if (!editor) {
			return false;
		}

		if (tab.view === 'design') {
			toggleView('code');
		}

		if (find === editor.getSession().doc.getTextRange(getSelectionRange())) {
			editor.insert(replace);
		} else {
			editor.replace(replace, {
				needle: find
			});
		}
		return;
	}

	function replaceAll(editor, find, replace) {
		if(!editor) {
			return;
		}

		if (tab.view === 'design') {
			toggleView('code');
		}

		var count = 0;

		var Search = require('ace/search').Search;

		var search = new Search().set({
			needle: find,
			regExp: true,
			wrap: true
		});

		var results = search.findAll(editor.getSession());
		count = results.length;

		editor.find(find);
		editor.replaceAll(replace);

		return count;
	}

	function save(){
		if( !$("#find") ){
			return;
		}

		//save fields
		var state = {
			findIn: findIn,
			find: $("#find").val(),
			replace: $("#replace").val(),
			caseSensitive: $("#caseSensitive").pressed,
			wholeWord: $("#wholeWord").pressed,
			regExp: $("#regex").pressed
		};

		preferences.setPref('find', JSON.stringify(state));
	}

	function update(next, dontSelect) {
		//clearTimeout(timer);
		//timer = setTimeout(save, 2000);
		if (['remote'].indexOf(findIn) !== -1) {
		    return;
		}

		var needle = $("#find").val();
		$("#findStatus").text('');

		//count all results
		if (needle) {
		    var files = [];
			var start;
			var end;
			var editor;

			if (findIn == 'open') {
				files = $('li[data-file]');
			} else {
				files = tabs.active();
			}

			options = {};
			options.caseSensitive = $("#caseSensitive").prop('checked');
			options.wholeWord = $("#wholeWord").prop('checked');
			options.regExp = $("#regex").prop('checked');
			options.needle = needle;
			options.start = {
				start: {
					column: 0,
					row: 0
				},
				end: {
					column: 0,
					row: 0
				}
			};

			var active = tabs.active();
			editor = tabs.getEditor(active);

			if( editor && findIn == 'selection' ){
				options.range =	editor.getSelectionRange();
				dontSelect = true;
			}

			var num_results = 0;
			var results = {};
			var id;

			//search file tabs
			files.each(function(){
			    editor = tabs.getEditor(this);
			    if (editor) {
			    	id = $(this).attr('id');
					results[id] = findAll(editor, options);
					num_results += results[id].length;
			    }
			});

			editor = tabs.getEditor(active);

			if(!editor) {
				return;
			}

			if (num_results) {
				//highlight next result

				options.skipCurrent = false;
				delete options.start;

				var oldRange = editor.getSelectionRange();

				if( !dontSelect ){
					editor.find(needle, options);
				}

				var range = editor.getSelectionRange();
				var selectionChanged = false;

				if (
					oldRange.start.row !== range.start.row ||
					oldRange.start.column !== range.start.column ||
					oldRange.end.row !== range.end.row ||
					oldRange.end.column !== range.end.column
				) {
					selectionChanged = true;
				}

				//find out what number we are
				var current = 0;

				var found = false;
				for (var tab in results) {
					for (i = 0; i < results[tab].length; i++) {
						if (
							active.attr('id') == $('#'+tab).attr('id') &&
							results[tab][i].start.row == range.start.row &&
							results[tab][i].start.column == range.start.column &&
							results[tab][i].end.row == range.end.row &&
							results[tab][i].end.column == range.end.column
						) {
							found = true;
							break;
						}

						current++;
					}

					if (found) {
						break;
					}
				}

				// next or prev
				if (typeof next == 'boolean' && !selectionChanged) {
					var target = current;

					if (next) {
						if (current < (num_results - 1)) {
							target++;
						} else {
							target = 0;
						}
					} else {
						if (current === 0) {
							target = num_results - 1;
						} else {
							target--;
						}
					}

					found = false;
					var count = 0;
					for (tabId in results) {
						for (i = 0; i < results[tabId].length; i++) {
						    tab = $('#'+tabId);
							if (count == target) {
							    //fixme get tab panel

								// set tab
								$(".ui-layout-center").tabs("option", "active", tab.index());

								//select
								tabs.getEditor(tab).selection.setSelectionRange(results[tabId][i]);

								found = true;
								break;
							}

							count++;
						}

						if (found) {
							break;
						}
					}

					current = target;
				}

				if( !found ){
					current = -1;
				}
				$("#findStatus").text((current + 1) + ' of ' + num_results);
				if( !dontSelect ){
					editor.find(needle, options);
				}
				return num_results;
			} else {
				$("#findStatus").text('no results');
				return false;
			}
		}
	}

	function nextSearch() {
		update(true);
	}

	function previousSearch() {
		update(false);
	}

	function searchReplace() {
		var tab = tabs.active();
		var editor = tabs.getEditor(tab);

		if (update()) {
			var replace = $("#replace").val();

			if( $("#regex").prop('checked') ){
				var find = $("#find").val();
				var value = editor.getSelectedText();
				replace = value.replace(new RegExp(find), replace);
			}

			editor.insert(replace);
			update(true);
			return true;
		}

		return false;
	}

	function searchReplaceAll() {
		if( findIn == 'selection' ){
    		var tab = tabs.active();
    		var editor = tabs.getEditor(tab);

			var Search = require('ace/search').Search;
			var find = $("#find").val();
			var options = {
				needle: find,
				regExp: $("#regex").prop('checked'),
				wrap: false
			};

			var search = new Search().set(options);

			var input = editor.getSelectedText();
			var replacement = $("#replace").val();
			//var result = search.replace(input, replacement);

			var re = search.$assembleRegExp(options);
			var result = input.replace(re, replacement);

			if( result!==null ){
				editor.insert(result);
			}
		}else{
			var num_results = update();
            //console.log(num_results);
			if (num_results) {
				for (var i = 0; i < num_results;) {
					if (searchReplace()) {
						i++;
					}
				}
			}
		}
	}

	function keyUp(e){
		if (['remote'].indexOf(findIn) !== -1) {
    		var s = $('#find').val();
		    $('#findResults').html('');

			if (!s || lastSearch == s) {
				return;
			}

		    var currentSite = site.active();

		    if(!currentSite) {
		    	return;
		    }

			$('#findResults').html('');

			//remote search
			if( searchSource ){
				searchSource.close();
			}

			//searching..
			$("#findprogress").progressbar( "option", "disabled", false ).show();

			var options = site.getAjaxOptions("/api/files?site="+currentSite);
			searchSource = new EventSource(options.url+'&cmd=search&s='+s);

			searchSource.addEventListener('message', function(event) {
				var data = JSON.parse(event.data);
				$('#findResults').append('<li><a href="#" data-file="'+data.msg+'" data-site="'+currentSite+'" class="openfile">' + data.msg + '</a></li>');
			}, false);

			searchSource.addEventListener('error', function(event) {
				if (event.eventPhase == 2) { //EventSource.CLOSED
					searchSource.close();

					//finished
		        	$( "#findprogress" ).progressbar( "option", "disabled", true ).hide();
				}
			}, false);
		} else {
			update();
		}
	}

	function focusFind(){
		var editor = tabs.getEditor();
		$('#westTabs').setActiveTab(1);
		var find = $("#find");
		if (editor) {
			if( findIn !== 'selection' && editor.getSelectedText()) {
				find.setValue(editor.getSelectedText());
			}
		}
		find.focus(true);

		$('#west').un('expand', focusFind);
	}

	function toggleFields() {
		findIn = $('#findForm input[name=findIn]:checked').val();

		if (['remote'].indexOf(findIn) !== -1) {
			$('#replace').hide();
			$('#findButtons').hide();
			$('#replaceButtons').hide();
			$('#findResults').show();
			keyUp();
		} else {
			$( "#findprogress" ).progressbar( "option", "disabled", true ).hide();
			$('#replace').show();
			$('#findButtons').show();
			$('#replaceButtons').show();
			$('#findResults').hide();
			update();
		}

		if( findIn == 'selection' ){
		    $('#findNextBtn').button("disable");
		    $('#findPrevBtn').button("disable");
		    $('#replaceBtn').button("disable");
		}else{
		    $('#findNextBtn').button("enable");
		    $('#findPrevBtn').button("enable");
		    $('#replaceBtn').button("enable");
		}

		$('#findProgress').hide();
	}

	function open(val) {
		//expand panel
		layout.get().open('west');

		//activate tab
		$(".ui-layout-west").tabs("option", "active", $('li[aria-controls=tabs-find]').index());

		//focus find
		if(val) {
		    $('#find').val(val);
		    update();
		}

		$('#find').focus().select();
		return;
	}

	function init() {
	    $('<form id="findForm">\
	    <div id="findInRadio" class="row">\
	        <input type="radio" id="findInSelection" name="findIn" value="selection"><label for="findInSelection" title="Find in selection"><i class="fa fa-file-text-o"></i></label>\
	        <input type="radio" id="findInCurrent" name="findIn" value="current" checked="checked"><label for="findInCurrent" title="Find in current document"><i class="fa fa-file-o"></i></label>\
	        <input type="radio" id="findInOpen" name="findIn" value="open"><label for="findInOpen" title="Find in open documents"><i class="fa fa-files-o"></i></label>\
	        <input type="radio" id="findInRemote" name="findIn" value="remote"><label for="findInRemote" title="Find in remote site"><i class="fa fa-cloud"></i></label>\
	    </div>\
	    <div class="row">\
	        <textarea id="find" name="find" class="ui-widget ui-state-default ui-corner-all"></textarea>\
	    </div>\
	    <div id="findprogress"></div>\
	    <div id="findResults">\
	    </div>\
	    <div id="findButtons" class="row">\
	        <input type="checkbox" id="regex" title="Regular expression"><label for="regex"><i class="icon-regex"></i></label>\
	        <input type="checkbox" id="caseSensitive" title="Case sensitive"><label for="caseSensitive"><i class="icon-case-sensitive"></i></label>\
	        <input type="checkbox" id="wholeWord" title="Whole words"><label for="wholeWord"><i class="icon-whole-word"></i></label>\
	        <span class="flex"></span>\
	        <span id="findStatus">no results</span>\
	        <button type="button" id="findNextBtn"><i class="fa fa-chevron-down"></i></button>\
	        <button type="button" id="findPrevBtn"><i class="fa fa-chevron-up"></i></button>\
	    </div>\
	    <p></p>\
	    <div class="row">\
	        <textarea id="replace" name="replace" class="ui-widget ui-state-default ui-corner-all"></textarea>\
	    </div>\
	    <div id="replaceButtons" class="row">\
	        <button type="button" id="replaceBtn">Replace</button>\
	        <button type="button" id="replaceAllBtn">Replace all</button>\
	    </div>\
	</form>').appendTo('#tabs-find');

	    $( "#findInRadio" ).buttonset();
	    $( "#findForm button" ).button();
	    $( "#findForm input[type=checkbox]" ).button();
	    $('#findprogress').progressbar({
	      disabled: true,
	      value: false
	    }).hide();

	    autosize($('#findForm textarea'));

	    //listeners
	    $('#findForm [name=find]').keypress(function(e) {
	        if(!e.ctrlKey && e.keyCode==13) {
	            e.preventDefault();
	            return nextSearch();
	        }
	    });
	    $('#findForm [name=find]').keyup(keyUp);
	    $('#findNextBtn').click(nextSearch);
	    $('#findPrevBtn').click(previousSearch);
	    $('#replaceBtn').click(searchReplace);
	    $('#replaceAllBtn').click(searchReplaceAll);
	    $( "#findForm button, #findForm input[type=checkbox]" ).change(update);
	    $( "#findForm input[type=radio]" ).change(toggleFields);

		$('body').on('activate', 'li', function() {
		    update(null, true);
		});
	}

    return {
        init: init,
        open: open
    };
});





