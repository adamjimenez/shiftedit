define(['app/config', 'app/editors', 'app/prefs', 'exports', "ui.tabs.overflowResize","app/tabs_contextmenu", "app/prompt", "app/lang", "app/site", "app/modes", "app/loading", 'app/util', 'app/recent', 'app/repositories', 'app/ssh', 'app/preview', 'app/diff', 'app/tree', 'app/resize', 'coffee-script', 'app/hash', 'uglify/compress', 'cssmin/cssmin'], function (config, editors, preferences, exports) {
var tabs_contextmenu = require('app/tabs_contextmenu');
var prompt = require('app/prompt');
var site = require('app/site');
var loading = require('app/loading');
var util = require('app/util');
var lang = require('app/lang').lang;
var modes = require('app/modes').modes;
var recent = require('app/recent');
var repositories = require('app/repositories');
var tree = require('app/tree');
var hash = require('app/hash');
var resize = require('app/resize');
var closing = [];
var saving = [];
var opening = [];
var autoSaveTimer;
var CoffeeScript = require('coffee-script');
var manuallyAborted = false;

function active() {
	return $('.ui-layout-center .ui-tabs-active');
}

function next() {
	var tab = active().next('li:not(.button)');
	if(!tab.length) {
		tab = active().parent().children('li:not(.button):first');
	}

	$(".ui-layout-center").tabs("option", "active", tab.index());
}

function prev() {
	var tab = active().prev('li:not(.button)');
	if(!tab.length) {
		tab = active().parent().children('li:not(.button):last');
	}

	$(".ui-layout-center").tabs("option", "active", tab.index());
}

function getEditor(tab) {
	tab = $(tab);

	if (window.splits && window.splits[tab.attr('id')]) {
		return window.splits[tab.attr('id')].getEditor(0);
	}

	/*
	var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);

	if(panel.children('div.editor').length) {
		return ace.edit(panel.children('div.editor')[0]);
	}*/

	return false;
}

function open(file, siteId, options) {
	if(!file)
		return quickOpen();

	if(!siteId) {
		console.log('no site id');
		return;
	}

	var found = false;
	opening.forEach(function(item) {
		if(item.file === file && item.siteId === siteId){
			found = true;
			return;
		}
	});

	if(!found) {
		opening.push({
			siteId: siteId,
			file: file
		});
		openFiles(options);
	}
}

function isOpen(file, siteId) {
	//check if file already open
	var li = $("li[data-file='"+file+"'][data-site='"+siteId+"']");
	if(li.length && li.index()!==-1){
		console.log('file already open');
		li.closest('.ui-tabs').tabs("option", "active", li.index());
		return li;
	}
	
	return false;
}

function openFiles(options) {
	if (!opening.length)
		return;

	if(!options){
		options = {};
	}

	var item = opening.shift();
	var siteId = item.siteId;
	var fileId = item.file;
	var file = fileId;

	if(!siteId || !fileId) {
		console.trace('file open error');
		console.log(opening);
		console.log(item);
		return false;
	}

	if (!options.reload && isOpen(file, siteId)) {
		if (options.callback)
			options.callback(active(), false);
		return;
	}

	//switch site if need be
	if (siteId!==site.active()) {
		opening.unshift(item);

		site.open(siteId, {
			callback: function() {
				openFiles();
			}
		});
		return;
	}

	var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+siteId);
	var ajax;
	if (!loading.start('Opening ' + file, function(){
		console.log('abort opening files');
		manuallyAborted = true;
		ajax.abort();
		opening = [];
	})) {
		opening.push(item);
		console.log('in queue');
		return;
	}

	function openCallback(data) {
		var title = file;
		if(data.title) {
			title = data.title;
		}

		if (options.tabpanel) {
			data.tabpanel = options.tabpanel;
		}

		var type = util.fileExtension(title);

		loading.stop();

		if (!data.success) {
			prompt.alert({title:lang.failedText, msg:'Error opening file' + ': ' + data.error});
			opening = [];
		}else if (data.content===false) {
			prompt.alert({title:lang.failedText, msg:'Missing file'});
			opening = [];
		} else {
			$('#data .content').hide();
			switch(type) {
				case 'png':
				case 'jpg':
				case 'jpeg':
				case 'bmp':
				case 'gif':
					//$('#data .image img').one('load', function () { $(this).css({'marginTop':'-' + $(this).height()/2 + 'px','marginLeft':'-' + $(this).width()/2 + 'px'}); }).attr('src',d.content);
					//$('#data .image').show();
				break;
				default:
					//$('#data .default').html(d.content).show();
					if (options.reload) {
						tab = isOpen(file, siteId);
						
						if (tab) {
							editor = getEditor(tab);
							editor.setValue(data.content);
							editor.moveCursorToPosition({column:0, row:0});
							editor.focus();
						} else {
							console.error('reload tab not found');
						}
					} else {
						editors.create(file, data.content, ajaxOptions.site, data);
						recent.add(file, ajaxOptions.site);
					}
				break;
			}

			if (opening.length) {
				openFiles(options.callback);
			}else{
				recordOpenFiles();

				if (options.callback)
					options.callback(tab, true);
			}
		}
	}

	var directFn = site.getdirectFn();
	if(directFn) {
		directFn({
			cmd: 'open',
			file: fileId,
			callback: openCallback
		});
	} else {
		//backcompat turbo mode
		var params = util.clone(ajaxOptions.params);
		params.file = fileId;

		ajax = $.ajax(ajaxOptions.url+'&cmd=open&file=' + encodeURIComponent(fileId), {
			method: 'POST',
			dataType: 'json',
			data: params,
			success: openCallback
		}, 'json').fail(function() {
			loading.stop();
			if (!manuallyAborted) {
				prompt.alert({title:lang.failedText, msg:'Error opening file'});
			} else {
				manuallyAborted = false;
			}
			opening = [];
		});
	}
}

function reload(tab) {
	open(tab.attr('data-file'), tab.attr('data-site'), {reload: true});
}

function save(tab, options) {
	//saving[tab.attr('id')] = tab;
	var found = false;
	saving.forEach(function(item) {
		if(item.id === tab.attr('id')){
			found = true;
			return;
		}
	});

	if(!found) {
		saving.push({
			id: tab.attr('id'),
			tab: tab
		});
		saveFiles(options);
	}
}

function saveFiles(options) {
	if (!saving.length)
		return;

	if (!options) {
		options = {};
	}

	var item = saving.shift();

	console.log('save');

	var content;
	var tab;
	var siteId;
	var title;
	var file;
	var mdate;
	
	if (item.tab) {
		tab = item.tab;
		siteId = tab.data("site");
		title = tab.data("title");
		var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);
		var editor = getEditor(tab);
		mdate = tab.data("mdate");
		if(!mdate) {
			mdate = -1;
		}

		if(!editor){
			console.error('editor instance not found');
			return false;
		}

		file = tab.data("file");
		content = editor.getValue();
	} else if (typeof item.content != 'undefined') {
		siteId = item.site;
		title = item.title;
		file = item.file;
		content = item.content;
		mdate = -1;
	}

	//save pref
	if(tab && tab.data('pref')){
		preferences.save(tab.data('pref'), content);
		setEdited(tab, false);
		return;
	}

	//switch site if need be
	if (!siteId) {
		console.log('no site');
		saveAs(tab, options);
		return;
	}

	if (siteId!==site.active()) {
		saving.unshift(item);

		site.open(siteId, {
			callback: function() {
				saveFiles();
			}
		});
		return;
	}

	//strip whitespace
	var prefs = preferences.get_prefs();
	if (prefs.stripWhitespace) {
		var lines = content.split("\n");
		content = '';
		for (var i in lines) {
			if (lines.hasOwnProperty(i)) {
				content += lines[i].replace(/\s+$/, "") + '\n';
			}
		}
		//remove trailing line break
		content = content.substr(0, content.length-1);
	}

	var confirmed = 1;
	if (tab) {
		title = tab.data('title');

		//save as if new file
		if(!tab.data("site") || !tab.data("file")) {
			saveAs(tab, options);
			return;
		}

		confirmed = tab.data('overwrite') ? tab.data('overwrite') : 0;
	}

	var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+siteId);

	var params = util.clone(ajaxOptions.params);
	params.content = content;

	//compile LESS
	var fileExtension = util.fileExtension(title);
	if( prefs.compileLESS && ['less', 'scss'].indexOf(fileExtension)!==-1 ){
		params.compile = true;
	}

	var minify = options.minify ? 1 : 0;
	if( prefs.saveWithMinified && ['css', 'js'].indexOf(fileExtension)!==-1 ){
		minify = 1;
	}

	var ajax;
	if (!loading.start('Saving ' + title, function(){
		console.log('abort saving files');
		ajax.abort();
	})) {
		console.log('in queued save');
		return;
	}

	function saveCallback(data) {
		loading.stop();
		//console.log(data);

		if (data.success) {
			//trigger event save
			//tab.parent('div').trigger('save', [tab]);

			if(data.changed && !confirmed ){
				prompt.confirm({
					title: 'File changed',
					msg: 'File has changed since last save.. save anyway?',
					fn: function(value) {
						switch(value) {
							case 'yes':
								saving.unshift(item);
								tab.data('overwrite', 1);
								saveFiles();
							break;
							case 'no':
							case 'cancel':
							break;
					   }
					}
				});
			}else{
				if (tab) {
					setEdited(tab, false);
					tab.data('overwrite', 0);
					tab.data('mdate', data.last_modified);
					tab.trigger('save');

					if (data.file) {
						tab.attr('data-file', data.file);
						tab.data('file', data.file);
					}
				}

				//save revision for turbo mode or AJAX
				settings = site.getSettings(siteId);
				if( settings.turbo == 1 || settings.server_type=='AJAX' ){
					$.ajax({
						url: config.apiBaseUrl+'revisions?cmd=save&site='+siteId+'&file='+encodeURIComponent(params.file),
						method: 'POST',
						data: params,
						dataType: 'json'
					});
				}

				//compile coffee
				var newTitle, pos, file;
				if (prefs.compileCoffeeScript && util.fileExtension(title)==='coffee') {
					newTitle = tab.data('title');
					pos = newTitle.indexOf('.');
					newTitle = newTitle.substr(0, pos) + '.js';
					file = tab.data('file');
					pos = file.lastIndexOf('.');
					newFile = file.substr(0, pos) + '.js';
					
					content = CoffeeScript.compile(content);

					saving.push({
						site: tab.data('site'),
						title: newTitle,
						file: file,
						parent: parent,
						content: content
					});
				}
				
				//minify
				if (minify && util.fileExtension(title)==='js' && !util.endsWith(title, '.min.js')) {
					newTitle = tab.data('title');
					pos = newTitle.lastIndexOf('.');
					newTitle = newTitle.substr(0, pos) + '.min.js';
					file = tab.data('file');
					pos = file.lastIndexOf('.');
					newFile = file.substr(0, pos) + '.min.js';
					
					uglify_options = {};
					
					content = uglify(content, uglify_options);

					saving.push({
						site: tab.data('site'),
						title: newTitle,
						file: newFile,
						content: content
					});
				}
				
				if (minify && util.fileExtension(title)==='css' && !util.endsWith(title, '.min.css')) {
					newTitle = tab.data('title');
					pos = newTitle.lastIndexOf('.');
					newTitle = newTitle.substr(0, pos) + '.min.css';
					file = tab.data('file');
					pos = file.lastIndexOf('.');
					newFile = file.substr(0, pos) + '.min.css';
					
					content = cssmin(content);

					saving.push({
						site: tab.data('site'),
						title: newTitle,
						file: newFile,
						content: content
					});
				}
				
				// reload if file doesn't exist
				if (!tree.getNode(data.file) && data.file_id) {
					parent = util.dirname(data.file_id);
					if (!parent) {
						parent = '#root';
					}
					tree.refresh(parent);
				}

				//continue with next save
				if (saving.length) {
					saveFiles(options);
				} else if (options.callback) {
					if (tab) {
						tab.closest('.ui-tabs').trigger('save');
					}
					options.callback(tab);
				}
			}
		} else {
			if (data.require_master_password) {
				site.masterPasswordPrompt(function() {
					saveFiles(options);
				});
			} else {
				prompt.alert({title:lang.failedText, msg:'Error saving file' + ': ' + data.error});
			}
		}
	}

	var directFn = site.getdirectFn();
	if(directFn) {
		directFn({
			cmd: 'save',
			file: file,
			title: title,
			content: content,
			callback: saveCallback,
			mdate: mdate,
			confirmed: confirmed,
			//minify: minify,
			parent: options.parent
		});
	} else {
		//backcompat turbo mode
		params.file = file;
		params.mdate = mdate;
		params.confirmed = confirmed;
		//params.minify = minify;

		ajax = $.ajax(ajaxOptions.url+"&cmd=save&file="+encodeURIComponent(file)+"&mdate="+mdate+"&confirmed="+confirmed, {
			method: 'POST',
			dataType: 'json',
			data: params,
			content: content,
			success: saveCallback
		}).fail(function() {
			loading.stop();

			if (!manuallyAborted) {
				prompt.alert({title:lang.failedText, msg:'Error saving file'});
			} else {
				manuallyAborted = false;
			}
		});
	}
}

function saveAs(tab, options) {
	if(!options){
		options = {};
	}

	console.log('save as');
	if (!site.active()) {
		prompt.alert({title:'No site selected', msg:'Select a site from the site dropdown'});
		return;
	}

	prompt.prompt({
		title: lang.saveChangesText,
		msg: 'Save as:',
		value: tab.attr('data-file'),
		buttons: 'YESNOCANCEL',
		fn: function (btn, file) {
			function fileExistsCallback(data) {
				loading.stop();

				if (!data.success) {
					prompt.alert({title:lang.failedText, msg:'Error checking file: ' + data.error});
					opening = [];
				} else {
					options.callback = function() {
						tree.refresh();
					};

					if(data.file_exists) {
						prompt.confirm({
							title: 'Confirm',
							msg: '<strong>'+file+'</strong> exists, overwrite?',
							fn: function(btn) {
								switch(btn) {
									case 'yes':
										doSaveAs(tab, file, options);
									break;
								}
							}
						});
					} else {
						doSaveAs(tab, file, options);
					}
				}
			}

			if (btn == "ok") {
				//check if filename exists
				if (!loading.start('Check file exists', function(){
					console.log('abort checking file site');
					ajax.abort();
				})) {
					return;
				}

				var site = require('app/site');
				var siteId = site.active();

				var directFn = site.getdirectFn();
				if(directFn) {
					var node = tree.getNode(tab.attr('data-file'));
					//console.log(node);

					var parent = tree.getNode(node.parent);
					options.parent = parent.id;
					//console.log(parent);

					directFn({
						cmd: 'file_exists',
						parent: parent.id,
						title: file,
						callback: fileExistsCallback
					});
				} else {
					var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+siteId);
					var params = util.clone(ajaxOptions.params);
					
					$.ajax({
						url: ajaxOptions.url+'&cmd=file_exists&site='+siteId+'&file='+encodeURIComponent(file),
						method: 'POST',
						dataType: 'json',
						data: params
					})
					.then(function (data) {
						fileExistsCallback(data);
					}).fail(function() {
						loading.stop();
						prompt.alert({title:lang.failedText, msg:'Error checking site'});
					});
				}
			} else if (btn == 'cancel') {
				//focus editor
				var editor = getEditor(tab);
				editor.focus();
			}
		}
	});
}

function doSaveAs(tab, file, options) {
	setTitle(tab, file);
	tab.data('file', file);
	tab.attr('data-file', file);

	var site = require('app/site');
	var siteId = site.active();

	if(!siteId) {
		prompt.alert('Error', 'No site selected');
		return false;
	}
	
	settings = site.getSettings(siteId);
	title = settings.name + '/' + file;
	setTitle(tab, title);

	tab.data(site, siteId);
	tab.attr('data-site', siteId);

	//save
	save(tab, options);
}

function saveAll(tab) {
	$('li[data-file]').each(function( index ) {
		var tab = $(this);
		saving.push({
			id: tab.attr('id'),
			tab: tab
		});
	});
	saveFiles();
}

function setEdited(tab, edited) {
	var value = edited ? 1 : 0;

	tab = $(tab);
	tab.data("edited", value);
	tab.attr('data-edited', value);

	if(edited) {
		//change title
		tab.children('.ui-tabs-anchor').contents().last().replaceWith('*'+util.basename(tab.data('title')));
		tab.trigger('change');

		//autosave
		if(tab.data("file") && tab.data("site")) {
			prefs = preferences.get_prefs();

			clearTimeout(autoSaveTimer);
			if (prefs.autoSave) {
				autoSaveTimer = setTimeout(function() {
					save(tab);
				}, 5000);
			}
		}
	} else {
		//change title
		tab.children('.ui-tabs-anchor').contents().last().replaceWith(util.basename(tab.data('title')));
	}
}

function setTitle(tab, title) {
	tab.data('title', title);
	tab.attr('data-title', title);
	tab.children('.ui-tabs-anchor').attr('title', title);
	tab.children('.ui-tabs-anchor').contents().last().replaceWith(util.basename(title));

	$( tab ).tooltip({
		position: { my: "left bottom", at: "left top", collision: "flipfit" },
		classes: {
			"ui-tooltip": "highlight"
		}
	});
	$( tab ).tooltip( "option", "content", title );
}

function recordOpenFiles() {
	var files = [];

	$( "li[data-file][data-site]" ).each(function( index ) {
		var tab = $( this );

		files.push({
			site: tab.data('site'),
			file: tab.data('file')
		});
	});

	$.ajax({
		url: config.apiBaseUrl+'prefs?cmd=save_state',
		data: {
			files: JSON.stringify(files)
		},
		method: 'POST'
	});
}

function checkEdited (e, ui) {
	var tabpanel = this;

	if($(ui.tab).data('edited')) {
		prompt.confirm({
			title: lang.saveChangesText,
			msg: 'Save changes to: '+$(ui.tab).data('file'),
			buttons: 'YESNOCANCEL',
			fn: function (btn) {
				if (btn == "yes") {
					//save
					save($(ui.tab), { callback: close });
				} else if (btn == 'no') {
					//remove
					setEdited(ui.tab, false);
					close(ui.tab);
				} else if (btn == 'cancel') {
					//focus editor
					closing = [];
					$(ui.tab).trigger('closeCancel');
				}
			}
		});
		return false;
	}else{
		if($(ui.tab).attr('aria-selected')) {
			document.title = 'ShiftEdit';
		}

		$(ui.tab).trigger('beforeClose'); //destroy editor and firepad
	}
}

function afterClose(e, ui) {
	if(closing.length) {
		closing.splice(0, 1);
		close(closing[0]);
	}else{
		recordOpenFiles();
		$(ui.tab).closest('.ui-tabs').trigger('close');
	}
}

function close (tab) {
	var tabpanel = $(tab).closest(".ui-tabs");
	var index = $(tab).index();
	$(tabpanel).tabs('remove', index);
}

function closeAll (tab) {
	closing = $(tab).parent().children('li:not(.button)');
	close(closing[0]);
}

function closeOther (tab) {
	closing = $(tab).siblings('li.closable');
	close(closing[0]);
}

function closeTabsRight (tab) {
	closing = $(tab).nextAll('li:not(.button)');
	close(closing[0]);
}

function newTab (e, ui) {
	//show new tab page
	var tab = $(ui.tab);

	if(!tab.attr('data-newtab')){
		return;
	}

	tab.addClass('closable');

	var editors = require('app/editors');
	var panelId = tab.attr( "aria-controls" );
	var panel = $( "#"+panelId );
	
	var showMoreText = 'Show more';
	var showLessText = 'Show less';
	
	var prefs = preferences.get_prefs();
	var news = preferences.getNews();

	panel.append('\
		<div class="newTab">\
			<div class="box news">\
				<div class="ui-widget-content inner">\
					<h3><a href="/blog/' + news.page_name + '" target="_blank">' + news.headline + '</a></h3>\
					<div class="copy">' + news.copy + '</div>\
					<a href="#" class="closeButton" data-name="' + news.page_name + '"><i class="fa fa-times"></i></a>\
				</div>\
			</div>\
			<div class="columns">\
				<div class="box create">\
					<h3 class="ui-widget-header">Create</h3>\
					<ul class="fileTypes"></ul>\
					<ul class="moreFileTypes" style="display:none; margin-top: 10px;"></ul>\
					<a href="#" class="toggleMore ui-state-default">' + showMoreText + '</i></a>\
				</div>\
				<div class="box recent">\
					<h3 class="ui-widget-header">Recent</h3>\
					<ul class="recentFiles"></ul>\
					<ul class="moreRecentFiles" style="display:none;"></ul>\
					<a href="#" class="toggleMore ui-state-default">' + showMoreText + '</i></a>\
				</div>\
				<div class="box repositories">\
					<h3 class="ui-widget-header">\
						Repositories\
						<button type="button" class="addRepositories">Add repositories</button>\
					</h3>\
					<ul class="repos"></ul>\
					<ul class="moreRepos" style="display:none;"></ul>\
					<a href="#" class="toggleMore ui-state-default">' + showMoreText + '</i></a>\
				</div>\
				<div class="box tools">\
					<h3 class="ui-widget-header">Tools</h3>\
					<ul class="other">\
						<li class="ui-state-default"><a href="#" class="ssh"><i class="fa fa-terminal"></i> Terminal</a></li>\
						<li class="ui-state-default"><a href="#" class="preview"><i class="fa fa-desktop"></i> Preview</a></li>\
						<li class="ui-state-default"><a href="#" class="diff"><i class="fa fa-files-o"></i> File Compare</a></li>\
						<li class="ui-state-default"><a href="#" class="preferences"><i class="fa fa-wrench"></i> Preferences</a></li>\
						<li class="ui-state-default"><a href="#" class="server"><i class="fa fa-server"></i> Servers</a></li>\
					</ul>\
				</div>\
			</div>\
		</div>\
		<br style="clear: both">\
	');
	
	// hide for non-center panel
	var pane = tab.closest('.ui-layout-pane');
	var paneName = pane[0].className.match('ui-layout-pane-([a-z]*)')[1];
	if (paneName!='center') {
		panel.find('.news, .create, .recent, .repositories').hide();
	}
	
	// news
	if (!news.page_name || localStorage.read === news.page_name) {
		panel.find('.news').hide();
	}
	
	panel.find('.news .closeButton').click(function() {
		$(this).parent().hide();
		localStorage.read = $(this).data('name');
	});

	// new files
	var HTML = '';
	var addedModes = [];
	prefs.newFiles.forEach(function(value) {
		modes.forEach(function(mode) {
			if (mode[2][0]===value && addedModes.indexOf(mode[2][0])===-1) {
				HTML += '<li class="'+mode[0]+' ui-state-default"><a href="#" data-filetype="'+mode[2][0]+'" class="newfile file-' + mode[2][0] + '"><div class="handle"></div>' + mode[1] + '</a></li>';
				addedModes.push(mode[2][0]);
			}
		});
	});
	panel.find('ul.fileTypes').append(HTML);
	
	// other file types
	HTML = '';
	prefs.newFilesOther.forEach(function(value) {
		modes.forEach(function(mode) {
			if (mode[2][0]===value && addedModes.indexOf(mode[2][0])===-1) {
				HTML += '<li class="'+mode[0]+' ui-state-default"><a href="#" data-filetype="'+mode[2][0]+'" class="newfile file-' + mode[2][0] + '"><div class="handle"></div>' + mode[1] + '</a></li>';
				addedModes.push(mode[2][0]);
			}
		});
	});
	
	// lump any that aren't found into other
	modes.forEach(function(mode) {
		if (addedModes.indexOf(mode[2][0])===-1) {
			HTML += '<li class="'+mode[0]+' ui-state-default"><a href="#" data-filetype="'+mode[2][0]+'" class="newfile file-' + mode[2][0] + '"><div class="handle"></div>' + mode[1] + '</a></li>';
		}
	});
	panel.find('ul.moreFileTypes').append(HTML);

	panel.find('a.newfile').click(function() {
		var tabpanel = $(ui.tab.closest('.ui-tabs'));

		var content = '';
		if( prefs.defaultCode && prefs.defaultCode[this.dataset.filetype] ){
			content = prefs.defaultCode[this.dataset.filetype];
		}

		close(ui.tab);
		editors.create("untitled."+this.dataset.filetype, content, null, {tabpanel: tabpanel});
	});
	
	panel.find( ".fileTypes, .moreFileTypes" ).sortable({
		axis: "y",
		connectWith: panel.find( ".fileTypes, .moreFileTypes" ),
		start: function( event, ui ) {
			panel.find( ".fileTypes, .moreFileTypes" ).addClass('dropable')
			.next('.toggleMore').text(showLessText);
			panel.find('.moreFileTypes').slideDown();
		},
		stop: function( event, ui ) {
			panel.find( ".fileTypes, .moreFileTypes" ).removeClass('dropable');
			
			var newFiles = [];
			panel.find('.fileTypes li a').each(function( index ) {
				newFiles.push($(this).data('filetype'));
			});
			
			var newFilesOther = [];
			panel.find('.moreFileTypes li a').each(function( index ) {
				newFilesOther.push($(this).data('filetype'));
			});
			
			preferences.save('newFiles', newFiles);
			preferences.save('newFilesOther', newFilesOther);
		}
	});
	
	panel.find('.toggleMore').click(function() {
		var el = this;
		var more = $(el).prev();
		more.slideToggle(400, function() {
			$(el).text(more.is(':visible') ? showLessText : showMoreText);
		}); 
	});

	//recent files
	var recentFiles = recent.getRecent();
	
	//put current site files at the top
	recentFiles.sort(function(a, b){
	    var aCurrent = (a.site == site.active());
	    var bCurrent = (b.site == site.active());
	    
	    // compare if it has the current site
	    if(aCurrent && !bCurrent) return -1;
	    if(!aCurrent && bCurrent) return 1;
	    
	    // compare the 2 dates
	    if (a.date < b.date) return -1;
	    if (a.date > b.date) return 1;
	    
	    return 0;
	});
	
	HTML = {0:'', 1:''};
	var key = 0;
	for (var i in recentFiles) {
		if (recentFiles.hasOwnProperty(i)) {
			if (i==10){
				key = 1;
			}
		
			var title = recentFiles[i].file;
			settings = site.getSettings(recentFiles[i].site);
			
			if (settings) {
				title = settings.name+'/'+title;
			}
		
			HTML[key] += '<li class="ui-state-default">\
					<a href="#" title="'+title+'" data-file="'+recentFiles[i].file+'" data-site="'+recentFiles[i].site+'" class="openfile">' + 
						title + 
						'<i title="Remove" class="fa fa-times remove"></i>\
					</a>\
				</li>';
		}
	}

	panel.find('ul.recentFiles').append(HTML[0]);
	panel.find('ul.moreRecentFiles').append(HTML[1]);
	
	panel.find('a.openfile').click(function() {
		var tabpanel = $(ui.tab.closest('.ui-tabs'));
		close(ui.tab);
		open($(this).data('file'), $(this).data('site'), {tabpanel: tabpanel});
	});
	
	panel.find('.remove').click(function(e) {
		e.stopPropagation();

		var el = $(this).parent();
		recent.remove(el.data('file'), el.data('site'));
		el.parent().fadeOut(300, function(){ $(this).remove();});
	});
	
	function updateToggleMore() {
		panel.find('.toggleMore').each(function( index ) {
			var el = this;
			var more = $(el).prev();
			if (!more.children().length) {
				$(el).hide();
			}
		});
	}

	//repos
	var sources = {};
	function updateRepos() {
		panel.find('ul.moreRepos, ul.repos').html('');
		
		var items = repositories.getAll();
		var HTML = {0:'', 1:''};
		var key = 0;
		$.each(items, function( index, item ) {
			if (index==10){
				key = 1;
			}
			
			var icon = '';
			
			switch(item.source) {
				case 'github':
					icon = '<i class="fa fa-github"></i>';
				break;
				case 'bitbucket':
					icon = '<i class="fa fa-bitbucket"></i>';
				break;
			}
		
			HTML[key] += '<li class="ui-state-default"><a href="#" title="'+item.name+'" data-url="'+item.url+'" class="openRepo">' + icon + ' ' + item.name + '</a></li>';
		});
		
		panel.find('ul.repos').append(HTML[0]);
		panel.find('ul.moreRepos').append(HTML[1]);
		
		updateToggleMore();
		
		sources = repositories.getSources();
		if (sources && (!sources.github.active || !sources.bitbucket.active)) {
			$('.addRepositories').show();
		} else {
			$('.addRepositories').hide();
		}
	}
	updateRepos();

	panel.find('a.openRepo').click(function() {
		//close(ui.tab);
		var url = $(this).data('url');
		var name = $(this).attr('title');
		
		// load site if it exists or prompt to create one
		items = site.get();
		
		var found = false;
		$.each(items, function( index, item ) {
			//console.log(item);
			if (item.git_url == url) {
				console.log('load site');
				found = true;
				site.open(item.id);
				return false;
			}
		});
		
		if (!found) {
			site.edit(true);
			
			// set name
			$('#siteSettings input[name="name"]').val(name).focus();
			
			// select tab
			$('[name=serverTypeItem][value="Server"]:first').prop("checked", true).change();
			$( "#serverTypeRadio input[type='radio']" ).checkboxradio('refresh');
			
			// select repo
			$( "#git_url_select" ).combobox('val', url);
			$( "#git_url" ).val(url);
		}
	});
	
	panel.find('.addRepositories').button().click(function() {
		//import site dialog
		$( "body" ).append('<div id="dialog-addRepositories" title="Add Repositories">\
			<form>\
				<button type="button" class="connect-github" data-url="/account/services/github">\
					<i class="fa fa-github"></i>\
					Connect to Github\
				</button>\
				<button type="button" class="connect-bitbucket" data-url="/account/services/bitbucket">\
					<i class="fa fa-bitbucket"></i>\
					Connect to Bitbucket\
				</button>\
			</form>\
		</div>');
		
		$('.connect-github, .connect-bitbucket').button()
		.click(function() {
			window.open($(this).data('url'));
		});
		
		if (sources.github.active) {
			$('.connect-github').button( "option", "disabled", true );
		}
		
		if (sources.bitbucket.active) {
			$('.connect-bitbucket').button( "option", "disabled", true );
		}

		//open dialog
		var dialog = $( "#dialog-addRepositories" ).dialog({
			modal: true,
			width: 400,
			height: 220,
			resizable: false,
			close: function( event, ui ) {
				$( this ).remove();
				
				// refresh repos
				panel.find('ul.moreRepos, ul.repos').html('<div style="text-align: center; margin: 10px;"><i class="fa fa-spinner fa-spin fa-3x fa-fw"></i><span class="sr-only">Loading...</span></div>');
				
				repositories.load()
				.then(function (data) {
					updateRepos();
				});
			}
		});
		
	});

	$(this).trigger("tabsactivate", [{newTab:ui.tab}]);
}

//event listener
function tabActivate(tab) {
	var file = tab.data('file');
	var siteId = tab.data('site');
	var title = file ? file : 'ShiftEdit';
	document.title = title;

	//hash
	var hashVal = '';
	if(siteId){
		settings = site.getSettings(siteId);
		hashVal += settings.name + '/';
	}

	hashVal += file ? tab.data('file') : 'newfile';

	hash.set(hashVal);

	var editor = getEditor(tab);
	if (editor) {
		//editor.focus();
		setTimeout(function(){editor.focus();}, 0);
	} else {
		var tabpanel = $(tab).closest(".ui-tabs");
		var panel = tabpanel.tabs('getPanelForTab', tab);
		panel.find('.columns a').first().focus();
	}

	$(tab).trigger('activate');
}

function updateTabs(e, params) {
	var tab = $('li[data-file="'+params.oldname+'"][data-site="'+params.site+'"]');
	if(tab.length){
		tab = $(tab);
		
		var file = params.newname;
		tab.data('file', file);
		tab.attr('data-file', file);
		
		var title = file;
		if (params.site) {
			settings = site.getSettings(params.site);
			title = settings.name + '/' + title;
		}
		
		setTitle(tab, title);
		tabActivate(tab);
		recordOpenFiles();
	}
}

function quickOpen() {
	//construct dialog
	$( "body" ).append('<div id="dialog-message" title="Quick open">\
  <form class="vbox">\
	<input type="text" name="input" id="quickOpenSearch" value="" class="text ui-widget-content ui-corner-all" autocomplete="off" autofocus><br>\
	<select id="quickOpenFile" size="14" class="ui-widget ui-state-default ui-corner-all flex"></select>\
	<!-- Allow form submission with keyboard without duplicating the dialog button -->\
	<input type="submit" tabindex="-1" style="position:absolute; top:-1000px">\
  </form>\
</div>');

	var size = $('#quickOpenFile').prop('size');

	//handle keyboard: up / down enter / input
	$( "#quickOpenSearch" ).keydown(function(e) {
		var next;

		switch(e.keyCode){
			case 38: //up
				$('#quickOpenFile option:selected').prev().prop('selected', true);
				return false;
			case 40: //down
				$('#quickOpenFile option:selected').next().prop('selected', true);
				return false;
			case 33: //page up
				next = $('#quickOpenFile option:selected').prevAll( ":eq("+size+")");

				if(!next.length) {
					next = $('#quickOpenFile option:selected').prevAll().last();
				}

				next.prop('selected', true);
				return false;
			case 34: //page down
				next = $('#quickOpenFile option:selected').nextAll( ":eq("+size+")");

				if(!next.length) {
					next = $('#quickOpenFile option:selected').nextAll().last();
				}

				next.prop('selected', true);
				return false;
			case 35: //end
				$('#quickOpenFile option:selected').nextAll().last().prop('selected', true);
				return false;
			case 36: //home
				$('#quickOpenFile option:selected').prevAll().last().prop('selected', true);
				return false;
			case 13: //enter
				pickSelected();
				return false;
		}
	});

	function pickSelected() {
		var val = $( "#quickOpenFile" ).val();

		if (val){
			$( "#dialog-message" ).dialog( "close" );
			$( "#dialog-message" ).remove();

			var pos = val.indexOf('/');
			siteId = val.substr(0, pos);
			file = val.substr(pos+1);
			open(file, siteId);
		}
	}

	function refresh() {
		var search = $( "#quickOpenSearch" ).val();
		var val = $( "#quickOpenFile" ).val();

		//populate with recent files
		recentFiles = recent.getRecent();
		var items = util.clone(recentFiles);

		for(var i in items) {
			if(items[i].file.indexOf(search)==-1) {
				delete items[i];
			}
		}

		//TODO add tree items

		//clear old options
		$('#quickOpenFile').children('option').remove();

		//create select items
		items.forEach(function(item){
			$('#quickOpenFile').append('<option value="'+item.site+'/'+item.file+'">'+item.domain+'/'+item.file+'</option>');
		});

		//select last item
		var selected = $('#quickOpenFile').val(val);

		//or first one
		if(!$('#quickOpenFile option:selected').length){
			$('#quickOpenFile').children(':first').prop('selected', true);
		}
	}

	$( "#quickOpenSearch" ).on('input', refresh);
	refresh();

	//select item click
	$('#quickOpenFile').click(pickSelected);

	//open dialog
	var dialog = $( "#dialog-message" ).dialog({
		modal: true,
		width: 400,
		height: 320,
		close: function( event, ui ) {
			$( this ).remove();
		}
	});

	//make sure quick open is focused
	setTimeout(function(){ $('#quickOpenSearch').focus(); }, 100);

	//prevent form submit
	form = dialog.find( "form" ).on( "submit", function( event ) {
		event.preventDefault();
		options.fn('yes');
	});
}

function init() {
	tabs_contextmenu.init();

	// TABS - sortable
	$( ".ui-layout-west" ).tabs({event: 'mousedown'});
	var tabs = $( ".ui-layout-east, .ui-layout-center, .ui-layout-south" ).tabs({closable: true, addTab:true, event: 'mousedown'});

	//console.log(tabs);

	// initialize overflow
	$('.ui-layout-west, .ui-layout-east, .ui-layout-center, .ui-layout-south').tabs('overflowResize');
	$('.ui-layout-west, .ui-layout-east, .ui-layout-center, .ui-layout-south').on('tabsbeforeremove', checkEdited);
	$('.ui-layout-west, .ui-layout-east, .ui-layout-center, .ui-layout-south').on('tabsremove', afterClose);
	$('.ui-layout-west, .ui-layout-east, .ui-layout-center, .ui-layout-south').on('tabsadd', newTab);

	//remember scroll
	$( ".ui-layout-west, .ui-layout-east, .ui-layout-center, .ui-layout-south" ).on( "tabsbeforeactivate", function(e, ui){
		var oldPanel = $(ui.oldPanel);
		oldPanel.data('scrollTop', oldPanel.closest('.ui-layout-content').scrollTop());
	});

	//restore scroll
	$( ".ui-layout-west, .ui-layout-east, .ui-layout-center, .ui-layout-south" ).on( "tabsactivate", function(e, ui){
		var newPanel = $(ui.newPanel);
		newPanel.closest('.ui-layout-content').scrollTop(newPanel.data("scrollTop"));

		//set title etc
		tabActivate($(ui.newTab));
	});

	$( "#tree" ).on( "rename", updateTabs );
	//$(document).on("rename", "#tree", updateTabs);

	//connected sortable (http://stackoverflow.com/questions/13082404/multiple-jquery-ui-tabs-connected-sortables-not-working-as-expected)
	tabs.find( ".ui-tabs-nav" ).sortable({
		distance: 10,
		//revert: true,
		connectWith: '.ui-tabs-nav',
		receive: function (event, ui) {
			var receiver = $(this).parent();
			var sender = $(ui.sender[0]).parent();
			var tab = $(ui.item[0]);
			// Find the id of the associated panel
			var panelId = tab.attr( "aria-controls" );
			var insertBefore = document.elementFromPoint(event.pageX, event.pageY);

			if(insertBefore.parentElement == tab[0]){
				insertBefore = document.elementFromPoint(event.pageX + insertBefore.offsetWidth, event.pageY);
			}

			insertBefore = $(insertBefore).closest('li[role="tab"]').get(0);
			
			if (!insertBefore)
				insertBefore = receiver.find('.addTab');

			if(insertBefore)
				tab.insertBefore(insertBefore);
			else
				$(this).append(tab);

			//move panel
			receiver.find('.ui-layout-content')[0].appendChild(document.getElementById(panelId));

			tabs.tabs('refresh');

			//activate tab
			receiver.tabs("option", "active", tab.index());
		},

		//don't drag "add tab" button
		items: "li:not(.button)",
		//allow dragging out of panel Adam Jimenez
		sort: function(e, ui) {
			if (ui.item.parent().prop("tagName")!=='BODY') {
				ui.item.appendTo('body');
				ui.item.css('width', 'auto');
				ui.item.css('height', 'auto');
			}

			ui.helper.offset(ui.offset);
		},
		start: function(e, ui) {
			//remove tooltip
			ui.item.tooltip();
			ui.item.tooltip( "disable" );
		},
		stop: function(e, ui) {
			//reinstate tooltip
			ui.item.tooltip( "enable" );
			$( ui.item ).children('.ui-tabs-anchor').attr( "title", ui.item.data('title') );

			tabs.tabs('refresh');
		}
	});
}

var default_options = {
	parse: {
		strict: false
	},
	compress: {
		sequences     : true,
		properties    : true,
		dead_code     : true,
		drop_debugger : true,
		unsafe        : true,
		unsafe_comps  : true,
		conditionals  : true,
		comparisons   : true,
		evaluate      : true,
		booleans      : true,
		loops         : true,
		unused        : true,
		hoist_funs    : true,
		hoist_vars    : false,
		if_return     : true,
		join_vars     : true,
		cascade       : true,
		side_effects  : true,
		negate_iife   : true,
		screw_ie8     : false,
		
		warnings      : true,
		global_defs   : {}
	},
	output: {
		indent_start  : 0,
		indent_level  : 4,
		quote_keys    : false,
		space_colon   : true,
		ascii_only    : false,
		inline_script : true,
		width         : 80,
		max_line_len  : 32000,
		beautify      : false,
		source_map    : null,
		bracketize    : false,
		semicolons    : true,
		comments      : /@license|@preserve|^!/,
		preserve_line : false,
		screw_ie8     : false
	}
};
function uglify(code, options) {
	// Create copies of the options
	var parse_options = defaults({}, options.parse);
	var compress_options = defaults({}, options.compress);
	var output_options = defaults({}, options.output);

	parse_options = defaults(parse_options, default_options.parse, true);
	compress_options = defaults(compress_options, default_options.compress, true);
	output_options = defaults(output_options, default_options.output, true);

	// 1. Parse
	var toplevel_ast = parse(code, parse_options);
	toplevel_ast.figure_out_scope();

	// 2. Compress
	var compressor = new Compressor(compress_options);
	var compressed_ast = toplevel_ast.transform(compressor);

	// 3. Mangle
	compressed_ast.figure_out_scope();
	compressed_ast.compute_char_frequency();
	compressed_ast.mangle_names();

	// 4. Generate output
	code = compressed_ast.print_to_string(output_options);

	return code;
}

fullScreen = function (toggle) {
	var editor = getEditor(this);
	var editorDiv = $(editor.container);
	
	if (toggle!== false && !editorDiv.hasClass('fullScreen')) {
		editorDiv.addClass('fullScreen');
		$('body').addClass('fullScreen');
	} else {
		$('.fullScreen').removeClass('fullScreen');
	}
	
	editor.focus();
	resize.resize();
};

//listeners
$('body').on('click', 'a.openfile', function() {
	open($(this).data('file'), $(this).data('site'));
});

	exports.active = active;
	exports.getEditor = getEditor;
	exports.setEdited = setEdited;
	exports.save = save;
	exports.saveAs = saveAs;
	exports.saveAll = saveAll;
	exports.init = init;
	exports.close = close;
	exports.closeAll = closeAll;
	exports.closeOther = closeOther;
	exports.closeTabsRight = closeTabsRight;
	exports.open = open;
	exports.reload = reload;
	exports.isOpen = isOpen;
	exports.recordOpenFiles = recordOpenFiles;
	exports.next = next;
	exports.prev = prev;
	exports.setTitle = setTitle;
	exports.fullScreen = fullScreen;
});