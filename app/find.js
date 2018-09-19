define(['./tabs','./layout', './site', "jquery-ui-bundle", 'ace/ace'], function (tabs, layout, site) {

	var timer;
	var findIn = 'current';
	var lastSearch = '';
	var searchSource;
	var history = [''];
	var historyIndex = 0;

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
		
		// save history
		if(next && history[history.length-2]!==needle) {
			history[history.length-1] = needle;
			history.push('');
			historyIndex = history.length-1;
		} else if (needle && historyIndex===history.length-1) {
			history[historyIndex] = needle;
		}
		
		$("#findStatus").text('');

		//count all results
		if (needle) {
			var files = [];
			var start;
			var end;
			var editor;
			var i;

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

			var current = 0;
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
				var found = false;
				for (var tab in results) {
					if(results.hasOwnProperty(tab)) {
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
					for (var tabId in results) {
						if(results.hasOwnProperty(tabId)) {
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
					}

					current = target;
				}

				if(!found) {
					current = -1;
				}
				
				
				if(!dontSelect) {
					editor.find(needle, options);
				}
			} else {
				current = -1;
			}
			
			$("#findStatus").text((current + 1) + ' of ' + num_results);
			return num_results;
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
	
	function keyDown(e){
		if (['ArrowUp', 'ArrowDown'].indexOf(e.key) != -1) {
			// skip back if current entry hasn't changed
			if (e.key === 'ArrowUp' && history.length && historyIndex == history.length-1 && history[history.length-1]==history[history.length-2]) {
				historyIndex--;
			}
			
			// skip to last if current entry is the same
			if (e.key === 'ArrowDown' && history.length && historyIndex == history.length-3 && history[history.length-1]==history[history.length-2]) {
				historyIndex++;
			}
			
			if (e.key === 'ArrowUp' && historyIndex > 0) {
				historyIndex--;
			} else if (e.key === 'ArrowDown' && historyIndex < (history.length-1) ) {
				historyIndex++;
			}
			
			$('#find').val(history[historyIndex]);
			e.preventDefault();
		} else if(e.altKey) {
			switch(e.key) {
				case 'c':
					$("#caseSensitive").click();
				break;
				case 'r':
					$("#regex").click();
				break;
				case 'w':
					$("#wholeWord").click();
				break;
			}
			e.stopPropagation();
		}
	}

	function keyUp(e){
		if (e && e.key === 'Escape') {
			//focus editor
			var tab = tabs.active();
			$(".ui-layout-center").trigger("tabsactivate", [{newTab: tab}]);
			return;
		}
		
		if (['remote'].indexOf(findIn) !== -1) {
			var s = $('#find').val();
			$('#findResults').html('');
			$('#findResults').hide();

			if (!s || lastSearch == s) {
				return;
			}

			var currentSite = site.active();

			if(!currentSite) {
				return;
			}

			$('#findResults').html('');
			$('#findResults').hide();

			//remote search
			if( searchSource ){
				searchSource.close();
			}

			//searching..
			$("#findprogress").show();

			var options = site.getAjaxOptions("/api/files?site="+currentSite);
			searchSource = new EventSource(options.url+'&cmd=search&s='+s);

			searchSource.addEventListener('message', function(event) {
				var data = JSON.parse(event.data);
				$('#findResults').show();
				$('#findResults').append('<li><a data-file="'+data.msg+'" data-site="'+currentSite+'" class="openfile">' + data.msg + '</a></li>');
			}, false);

			searchSource.addEventListener('error', function(event) {
				if (event.eventPhase == 2) { //EventSource.CLOSED
					searchSource.close();

					//finished
					$( "#findprogress" ).hide();
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
			$( "#findprogress" ).hide();
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
		layout.openWest();

		//activate tab
		$(".ui-layout-west").tabs("option", "active", $('li[aria-controls=tabs-find]').index());
		$('.ui-layout-west li').removeClass('my_active');
		$('li[aria-controls=tabs-find]').addClass('my_active');

		//focus find
		if(val) {
			$('#find').val(val);
			update();
		}

		$('#find').focus().select();
		return;
	}
	
	function toggle() {
		if (!layout.westIsOpen() || $(".ui-layout-west").tabs("option", "active") !== $('li[aria-controls=tabs-find]').index()) {
			open();
		} else {
			layout.closeWest(true);
			
			var tab = tabs.active();
			if (tab) {
				var editor = tabs.getEditor(tab);
				if (editor) {
					editor.focus();
				}
			}
		}
	}

	function init() {
		$('<form id="findForm">\
		<div id="findInRadio" class="hbox panel-buttons ui-widget-header">\
			<input type="radio" id="findInSelection" name="findIn" value="selection"><label class="flex" for="findInSelection" title="Find in selection"><i class="far fa-file-alt"></i></label>\
			<input type="radio" id="findInCurrent" name="findIn" value="current" checked="checked"><label class="flex" for="findInCurrent" title="Find in current document"><i class="far fa-file"></i></label>\
			<input type="radio" id="findInOpen" name="findIn" value="open"><label class="flex" for="findInOpen" title="Find in open documents"><i class="far fa-copy"></i></label>\
			<input type="radio" id="findInRemote" name="findIn" value="remote"><label class="flex" for="findInRemote" title="Find in remote site"><i class="fa fa-cloud"></i></label>\
		</div>\
		<div class="row ta findHolder">\
			<textarea id="find" name="find" placeholder="find" class="ui-widget ui-state-default ui-corner-all"></textarea>\
			<span id="findStatus"></span>\
		</div>\
		<progress id="findprogress"></progress>\
		<ul id="findResults">\
		</ul>\
		<div id="findButtons" class="row">\
			<input type="checkbox" id="regex"><label for="regex" title="Regular expression (Alt-R)"><i class="icon-regex"></i></label>\
			<input type="checkbox" id="caseSensitive"><label for="caseSensitive" title="Case sensitive (Alt-C)"><i class="icon-case-sensitive"></i></label>\
			<input type="checkbox" id="wholeWord"><label for="wholeWord" title="Whole words (Alt-W)"><i class="icon-whole-word"></i></label>\
			<span class="flex"></span>\
			<button type="button" id="findPrevBtn" title="Previous"><i class="fa fa-chevron-up"></i></button>\
			<button type="button" id="findNextBtn" title="Next"><i class="fa fa-chevron-down"></i></button>\
		</div>\
		<div class="row ta" style="margin-top: 10px;">\
			<textarea id="replace" name="replace" placeholder="replace with.." class="ui-widget ui-state-default ui-corner-all"></textarea>\
		</div>\
		<div id="replaceButtons" class="row">\
			<button type="button" id="replaceBtn">Replace</button>\
			<button type="button" id="replaceAllBtn">Replace all</button>\
		</div>\
	</form>').appendTo('#tabs-find');

		$( "#findInRadio input[type='radio']" ).checkboxradio({
			icon: false
		});
		$( "#findForm button" ).button();
		$( "#findForm input[type=checkbox]" ).checkboxradio({
			icon: false
		});
		$('#findprogress').hide();

		function insertNL() {
			var val = this.value;
			if (typeof this.selectionStart == "number" && typeof this.selectionEnd == "number") {
				var start = this.selectionStart;
				this.value = val.slice(0, start) + "\n" + val.slice(this.selectionEnd);
				this.selectionStart = this.selectionEnd = start + 1;
			} else if (document.selection && document.selection.createRange) {
				this.focus();
				var range = document.selection.createRange();
				range.text = "\r\n";
				range.collapse(false);
				range.select();
			}
		}

		//listeners
		$('#findForm [name=find]').keypress(function(e) {
			if (e.keyCode==10) {
				$.proxy(insertNL, this)();
				return true;
			} else if (e.keyCode==13) {
				if(e.ctrlKey) { // enter
					$.proxy(insertNL, this)();
					return true;
				} else if (e.shiftKey) {
					e.preventDefault();
					return previousSearch();
				} else  {
					e.preventDefault();
					return nextSearch();
				}
			}
		});
		$('#findForm [name=replace]').keypress(function(e) {
			if (e.keyCode==10) {
				$.proxy(insertNL, this)();
				return true;
			} else if (e.keyCode==13) {
				if(e.ctrlKey) { // enter
					$.proxy(insertNL, this)();
					return true;
				} else if (e.shiftKey) {
				} else  {
					e.preventDefault();
					return searchReplace();
				}
			}
		});
		$('#findForm [name=find], #findForm [name=replace]').keydown(function(e) {
			if (e.keyCode==70 && e.ctrlKey) { // ctrl-f
				toggle();
				e.preventDefault();
			}
			if (['ArrowUp', 'ArrowDown'].indexOf(e.key)!=-1) {
				e.preventDefault();
			}
		});
		$('#findForm [name=find]').keyup(keyUp);
		$('#findForm [name=find]').keydown(keyDown);
		$('#findNextBtn').click(nextSearch);
		$('#findPrevBtn').click(previousSearch);
		$('#replaceBtn').click(searchReplace);
		$('#replaceAllBtn').click(searchReplaceAll);
		$( "#findForm button, #findForm input[type=checkbox]" ).change(update);
		$( "#findForm input[type=radio]" ).change(toggleFields);

		$('body').on('activate', 'li', function() {
			update(null, true);
		});
		
		var timer;
		$('body').on('change', 'li[role=tab][data-file]', function() {
			clearTimeout(timer);
			timer = setTimeout(function() {
				update(null, true);
			}, 1000);
		});
		
		$("#findResults").basicMenu({
			select: function (event, ui) {
				//select(ui.item);
			}
		});
		
		$('#findForm .findHolder #findStatus').click(function() { $('#find').focus(); });
	}

	return {
		init: init,
		open: open,
		toggle: toggle
	};
});