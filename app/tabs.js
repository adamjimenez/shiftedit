define(['./config', './editors', './designs', './prefs', 'exports', "./prompt", "./lang", "./site", "./modes", "./loading", './util', './recent', './ssh', './preview', './diff', './tree', './resize', './hash', "./tabs_contextmenu", "ui.tabs.stretchyTabs", 'cssmin', 'dialogResize'], function (config, editors, designs, preferences, exports, prompt, lang, site, modes, loading, util, recent, ssh, preview, diff, tree, resize, hash, tabs_contextmenu) {
	lang = lang.lang;
	modes = modes.modes;
	var closing = [];
	var saving = [];
	var opening = [];
	var autoSaveTimer;
	var manuallyAborted = false;

	function active() {
		return $('.ui-layout-center .ui-tabs-active');
	}

	function next() {
		var tab = active().next('li:not(.button)');
		if (!tab.length) {
			tab = active().parent().children('li:not(.button):first');
		}

		$(".ui-layout-center").tabs("option", "active", tab.index());
	}

	function prev() {
		var tab = active().prev('li:not(.button)');
		if (!tab.length) {
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
		if (!file)
			return quickOpen();

		if (!siteId) {
			console.log('no site id');
			return;
		}

		var found = false;
		opening.forEach(function(item) {
			if (item.file === file && item.siteId === siteId) {
				found = true;
				return;
			}
		});

		if (!found) {
			var reload = options && options.reload ? true: false;

			opening.push({
				siteId: siteId,
				file: file,
				reload: reload
			});
			openFiles(options);
		}
	}

	function isOpen(file, siteId) {
		//check if file already open
		var li = $("li[data-file='"+file+"'][data-site='"+siteId+"']");
		if (li.length && li.index()!==-1) {
			console.log('file already open');
			li.closest('.ui-tabs').tabs("option", "active", li.index());
			return li;
		}

		return false;
	}

	function openFiles(options) {
		if (!opening.length)
			return;

		if (!options) {
			options = {};
		}

		var item = opening.shift();
		var siteId = item.siteId;
		var fileId = item.file;
		var file = fileId;

		if (!siteId || !fileId) {
			console.trace('file open error');
			console.log(opening);
			console.log(item);
			return false;
		}

		if (!item.reload && isOpen(file, siteId)) {
			if (options.callback)
				options.callback(active(), false);
			return;
		}

		//switch site if need be
		if (siteId !== site.active()) {
			opening.unshift(item);

			site.open(siteId, {
				callback: function() {
					openFiles(options);
				}
			});
			return;
		}

		var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl + 'files?site='+siteId);
		var ajax;
		if (!loading.start('Opening ' + file, function() {
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
			if (data.title) {
				title = data.title;
			}

			if (options.tabpanel) {
				data.tabpanel = options.tabpanel;
			}

			var type = util.fileExtension(title);

			loading.stop();

			if (!data.success) {
				prompt.alert({
					title: lang.failedText, msg: 'Error opening file' + ': ' + data.error
				});
				opening = [];
			} else if (data.content === false) {
				prompt.alert({
					title: lang.failedText, msg: 'Missing file'
				});
				opening = [];
			} else {
				$('#data .content').hide();
				switch (type) {
					case 'png':
					case 'jpg':
					case 'jpeg':
					case 'bmp':
					case 'gif':
						break;
					default:
						if (item.reload) {
							tab = isOpen(file, siteId);

							if (tab) {
								editor = getEditor(tab);
								editor.setValue(data.content);
								editor.moveCursorToPosition({
									column: 0, row: 0
								});
								editor.focus();

								if (tab.data('view') === 'design') {
									var inst = designs.get(tab);
									designs.update(inst);
								}

								setEdited(tab, false);
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
				} else {
					recordOpenFiles();
					
					if (options.callback) {
						options.callback(active(), false);
					}
				}
			}
		}

		var directFn = site.getdirectFn();
		if (directFn) {
			directFn({
				cmd: 'open',
				file: fileId,
				callback: openCallback
			});
		} else {
			//backcompat turbo mode
			var params = util.clone(ajaxOptions.params);
			params.file = fileId;

			ajax = $.ajax(ajaxOptions.url + '&cmd=open&file=' + encodeURIComponent(fileId), {
				method: 'POST',
				dataType: 'json',
				data: params,
				xhrFields: {
					withCredentials: true
				},
				success: openCallback
			}, 'json').fail(function() {
				loading.stop();
				if (!manuallyAborted) {
					prompt.alert({
						title: lang.failedText, msg: 'Error opening file'
					});
				} else {
					manuallyAborted = false;
				}
				opening = [];
			});
		}
	}

	function reload(tab) {
		open(tab.attr('data-file'),
			tab.attr('data-site'),
			{
				reload: true
			});
	}

	function reloadActive(tab) {
		// reload files
		$("li[data-file][data-site='" + site.active() + "'][data-edited='0']").each(function(index) {
			var tab = $(this);
			reload(tab);
		});
	}

	function save(tab, options) {
		//saving[tab.attr('id')] = tab;
		var found = false;
		saving.forEach(function(item) {
			if (item.id === tab.attr('id')) {
				found = true;
				return;
			}
		});

		if (!found) {
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
			if (!mdate) {
				mdate = -1;
			}

			if (!editor) {
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
		if (tab && tab.data('pref')) {
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

		if (siteId !== site.active()) {
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
			if (!tab.data("site") || !tab.data("file")) {
				saveAs(tab, options);
				return;
			}

			confirmed = tab.data('overwrite') ? tab.data('overwrite'): 0;
		}

		var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+siteId);

		var params = util.clone(ajaxOptions.params);
		params.content = content;

		//compile LESS
		var fileExtension = util.fileExtension(title);
		if (prefs.compileLESS && ['less', 'scss'].indexOf(fileExtension)!==-1) {
			params.compile = true;
		}

		var minify = options.minify ? 1: 0;
		if (prefs.saveWithMinified && ['css', 'js'].indexOf(fileExtension)!==-1) {
			minify = 1;
		}

		var ajax;
		if (!loading.start('Saving ' + title, function() {
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

				if (data.changed && !confirmed) {
					prompt.confirm({
						title: 'File changed',
						msg: 'File has changed since last save.. save anyway?',
						fn: function(value) {
							switch (value) {
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
				} else {
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
					if (settings.turbo == 1 || settings.server_type == 'AJAX') {
						$.ajax({
							url: config.apiBaseUrl+'revisions?cmd=save&site='+siteId+'&file='+encodeURIComponent(params.file),
							method: 'POST',
							data: params,
							dataType: 'json'
						});
					}

					//compile coffee
					var newTitle,
					pos,
					file;
					if (prefs.compileCoffeeScript && util.fileExtension(title) === 'coffee') {
						newTitle = tab.data('title');
						pos = newTitle.indexOf('.');
						newTitle = newTitle.substr(0, pos) + '.js';
						file = tab.data('file');
						pos = file.lastIndexOf('.');
						newFile = file.substr(0, pos) + '.js';


						require(['coffee-script'], function(CoffeeScript) {
							content = CoffeeScript.compile(content);

							saving.push({
								site: tab.data('site'),
								title: newTitle,
								file: file,
								parent: parent,
								content: content
						});
						});
				}

				//minify
				if (minify && util.fileExtension(title) === 'js' && !util.endsWith(title, '.min.js')) {
					newTitle = tab.data('title');
					pos = newTitle.lastIndexOf('.');
					newTitle = newTitle.substr(0, pos) + '.min.js';
					file = tab.data('file');
					pos = file.lastIndexOf('.');
					newFile = file.substr(0, pos) + '.min.js';

					uglify_options = {};

					require(['uglify-js/lib/compress'], function() {
						content = uglify(content, uglify_options);

						if (content !== false) {
							saving.push({
								site: tab.data('site'),
								title: newTitle,
								file: newFile,
								content: content
						});
					}
					});
			}

			if (minify && util.fileExtension(title) === 'css' && !util.endsWith(title, '.min.css')) {
				newTitle = tab.data('title');
				pos = newTitle.lastIndexOf('.');
				newTitle = newTitle.substr(0, pos) + '.min.css';
				file = tab.data('file');
				pos = file.lastIndexOf('.');
				newFile = file.substr(0, pos) + '.min.css';

				content = cssmin(content);

				if (content !== false) {
					saving.push({
						site: tab.data('site'),
						title: newTitle,
						file: newFile,
						content: content
					});
				}
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
			prompt.alert({
				title: lang.failedText, msg: 'Error saving file' + ': ' + data.error
			});
		}
	}
}

	var directFn = site.getdirectFn();
	if (directFn) {
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
			xhrFields: {
				withCredentials: true
			},
			content: content,
			success: saveCallback
		}).fail(function() {
			loading.stop();

			if (!manuallyAborted) {
				prompt.alert({
					title: lang.failedText, msg: 'Error saving file'
				});
			} else {
				manuallyAborted = false;
			}
		});
	}
}

function saveAs(tab, options) {
	if (!options) {
		options = {};
	}

	console.log('save as');
	if (!site.active()) {
		prompt.alert({
			title: 'No site selected', msg: 'Select a site from the site dropdown'
		});
		return;
	}

	prompt.prompt({
		title: lang.saveChangesText,
		msg: 'Save as:',
		value: tab.attr('data-file'),
		fn: function (btn, file) {
			function fileExistsCallback(data) {
				loading.stop();

				if (!data.success) {
					prompt.alert({
						title: lang.failedText, msg: 'Error checking file: ' + data.error
					});
					opening = [];
				} else {
					options.callback = function() {
						tree.refresh();
					};

					if (data.file_exists) {
						prompt.confirm({
							title: 'Confirm',
							msg: '<strong>'+file+'</strong> exists, overwrite?',
							fn: function(btn) {
								switch (btn) {
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
				if (!loading.start('Check file exists', function() {
					console.log('abort checking file site');
					ajax.abort();
				})) {
					return;
				}

				var siteId = site.active();

				var directFn = site.getdirectFn();
				if (directFn) {
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
						data: params,
						xhrFields: {
							withCredentials: true
						}
					})
					.then(function (data) {
						fileExistsCallback(data);
					}).fail(function() {
						loading.stop();
						prompt.alert({
							title: lang.failedText, msg: 'Error checking site'
						});
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
	setTitle(tab,
		file);
	tab.data('file',
		file);
	tab.attr('data-file',
		file);

	var siteId = site.active();

	if (!siteId) {
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
	$('li[data-file]').each(function(index) {
		var tab = $(this);
		saving.push({
			id: tab.attr('id'),
			tab: tab
		});
	});
	saveFiles();
}

function download(tab) {
	var editor = getEditor(tab);
	var content = editor.getValue();
	var filename = util.basename(tab.attr('data-file'));
	var blob = new Blob([content]);
	var evt = new MouseEvent('click');

	var a = document.createElement('a');
	a.download = filename;
	a.href = URL.createObjectURL(blob);
	a.dispatchEvent(evt);
}

function revert(tab) {
	var editor = getEditor(tab);

	if (editor && tab.data('original') !== editor.getValue()) {
		editor.setValue(tab.data('original'));

		if (tab.data('view') === 'design') {
			var inst = designs.get(tab);
			designs.update(inst);
		}
	} else {
		console.log('file is unchanged');
	}

	setEdited(tab, false);
}

function revealInTree(tab) {
	siteId = tab.data('site');

	function revealFile() {
		return tree.select(tab.data('file'));
	}

	if (site.active() == siteId) {
		return revealFile();
	} else {
		$('#tree').one('refresh.jstree', revealFile);
		return site.open(siteId, null);
	}
}

function setEdited(tab, edited) {
	var value = edited ? 1: 0;

	tab = $(tab);
	tab.data("edited", value);
	tab.attr('data-edited', value);

	if (edited) {
		tab.trigger('change');

		//autosave
		if (tab.data("file") && tab.data("site")) {
			prefs = preferences.get_prefs();

			clearTimeout(autoSaveTimer);
			if (prefs.autoSave) {
				autoSaveTimer = setTimeout(function() {
					save(tab);
				}, 5000);
			}
		}
	}

	//update tab
	tab.trigger('mouseout');
}

function setTitle(tab, title) {
	tab.data('title', title);
	tab.attr('data-title', title);
	tab.children('.ui-tabs-anchor').attr('title', title);
	tab.children('.ui-tabs-anchor').contents().last().replaceWith(util.basename(title));


	/*
	// disabled because it wipes the title attribute
	$( tab ).tooltip({
		position: { my: "left bottom", at: "left top", collision: "flipfit" },
		classes: {
			"ui-tooltip": "highlight"
		}
	});
	$( tab ).tooltip( "option", "content", title );*/
}

function recordOpenFiles() {
	var files = [];

	$("li[data-file][data-site]").each(function(index) {
		var tab = $(this);

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

	if ($(ui.tab).data('edited')) {
		prompt.confirm({
			title: lang.saveChangesText,
			msg: 'Save changes to: '+$(ui.tab).data('file'),
			fn: function (btn) {
				if (btn == "yes") {
					//save
					save($(ui.tab), {
						callback: close
					});
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
	} else {
		$(ui.tab).trigger('beforeClose'); //destroy editor and firepad
	}
}

function afterClose(e, ui) {
	var queue = false;
	if (closing.length > 1) {
		queue = true;
	}

	if (closing.length) {
		closing.splice(0, 1);
		close(closing[0]);
	}

	if (!queue) {
		$(ui.tab).closest('.ui-tabs').trigger('close');
		recordOpenFiles();
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

	if (!tab.attr('data-newtab')) {
		return;
	}

	tab.data('file', 'newTab');
	tab.addClass('closable');

	var panelId = tab.attr("aria-controls");
	var panel = $("#" + panelId);

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
					<div class="closeButton" data-name="' + news.page_name + '"><i class="fa fa-times"></i></div>\
				</div>\
			</div>\
			<div class="columns">\
				<div class="box create">\
					<h3 class="ui-widget-header">' + lang.createText + '</h3>\
					<ul class="fileTypes"></ul>\
					<ul class="moreFileTypes" style="display:none; margin-top: 10px;"></ul>\
					<div class="toggleMore ui-state-default">' + showMoreText + '</i></div>\
				</div>\
				<div class="box tools">\
					<h3 class="ui-widget-header">' + lang.toolsText + '</h3>\
					<ul class="other">\
						<li class="ui-state-default"><div class="addSite"><i class="fas fa-plus-square"></i> ' + lang.addSite + '</div></li>\
						<li class="ui-state-default"><div class="ssh"><i class="fa fa-terminal"></i> ' + lang.terminal + '</div></li>\
						<li class="ui-state-default"><div class="preview"><i class="fa fa-desktop"></i> ' + lang.preview + '</div></li>\
						<li class="ui-state-default"><div class="diff"><i class="fa fa-copy"></i> ' + lang.fileCompare + '</div></li>\
						<li class="ui-state-default"><div class="preferences"><i class="fa fa-wrench"></i> ' + lang.preferencesText + '</div></li>\
						<li class="ui-state-default"><div class="serverwand"><i class="fa fa-server"></i> ServerWand</div></li>\
						<li class="ui-state-default"><div class="database"><i class="fas fa-database"></i> ' + lang.database + '</div></li>\
					</ul>\
				</div>\
			</div>\
		</div>\
		<br style="clear: both">\
	');

	// hide for non-center panel
	var pane = tab.closest('.ui-layout-pane');
	var paneName = pane[0].className.match('ui-layout-pane-([a-z]*)')[1];
	if (paneName != 'center') {
		panel.find('.news, .create').hide();
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
			if (mode[2][0] === value && addedModes.indexOf(mode[2][0])===-1) {
				HTML += '<li class="'+mode[0]+' ui-state-default"><div data-filetype="'+mode[2][0]+'" class="newfile file-' + mode[2][0] + '"><div class="handle"></div>' + mode[1] + '</div></li>';
				addedModes.push(mode[2][0]);
			}
		});
	});
	panel.find('ul.fileTypes').append(HTML);

	// other file types
	HTML = '';
	prefs.newFilesOther.forEach(function(value) {
		modes.forEach(function(mode) {
			if (mode[2][0] === value && addedModes.indexOf(mode[2][0])===-1) {
				HTML += '<li class="'+mode[0]+' ui-state-default"><div data-filetype="'+mode[2][0]+'" class="newfile file-' + mode[2][0] + '"><div class="handle"></div>' + mode[1] + '</div></li>';
				addedModes.push(mode[2][0]);
			}
		});
	});

	// lump any that aren't found into other
	modes.forEach(function(mode) {
		if (addedModes.indexOf(mode[2][0])===-1) {
			HTML += '<li class="'+mode[0]+' ui-state-default"><div data-filetype="'+mode[2][0]+'" class="newfile file-' + mode[2][0] + '"><div class="handle"></div>' + mode[1] + '</div></li>';
		}
	});
	panel.find('ul.moreFileTypes').append(HTML);

	panel.find('div.newfile').click(function() {
		var tabpanel = $(ui.tab.closest('.ui-tabs'));

		var content = '';
		if (prefs.defaultCode && prefs.defaultCode[this.dataset.filetype]) {
			content = prefs.defaultCode[this.dataset.filetype];
		}

		close(ui.tab);
		editors.create("untitled."+this.dataset.filetype, content, null, {
			tabpanel: tabpanel
		});
	});

	panel.find(".fileTypes, .moreFileTypes").sortable({
		axis: "y",
		connectWith: panel.find(".fileTypes, .moreFileTypes"),
		start: function(event, ui) {
			panel.find(".fileTypes, .moreFileTypes").addClass('dropable')
			.next('.toggleMore').text(showLessText);
			panel.find('.moreFileTypes').slideDown();
		},
		stop: function(event, ui) {
			panel.find(".fileTypes, .moreFileTypes").removeClass('dropable');

			var newFiles = [];
			panel.find('.fileTypes li div').each(function(index) {
				newFiles.push($(this).data('filetype'));
			});

			var newFilesOther = [];
			panel.find('.moreFileTypes li div').each(function(index) {
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
			$(el).text(more.is(':visible') ? showLessText: showMoreText);
		});
	});

	panel.find('.serverwand').click(function() {
		window.open('https://manage.serverwand.com');
	});

}

//event listener
function tabActivate(tab) {
	var editor = getEditor(tab);

	if (!$("#find").is(":focus")) {
		if (editor) {
			//editor.focus();
			if (tab.data('view') === 'design') {
				setTimeout(function() {
					var inst = designs.get(tab);
					inst.focus();
				}, 0);
			} else {
				setTimeout(function() {
					editor.focus();
				}, 0);
			}
		} else {
			var tabpanel = $(tab).closest(".ui-tabs");
			var panel = tabpanel.tabs('getPanelForTab', tab);
			panel.find('.columns a').first().focus();
		}
	}

	$(tab).trigger('activate', [tab]);
}

function updateTabs(e, params) {
	var tab = $('li[data-file="'+params.oldname+'"][data-site="'+params.site+'"]');
	if (tab.length) {
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

		console.log('update tabs');
		tabActivate(tab);
		recordOpenFiles();
	}
}

function quickOpen() {
	//construct dialog
	$("body").append('<div id="dialog-message" title="Quick open">\
  <form class="vbox">\
	<input type="text" name="input" id="quickOpenSearch" value="" class="text ui-widget-content ui-corner-all" autocomplete="off" autofocus><br>\
	<select id="quickOpenFile" size="14" class="ui-widget ui-state-default ui-corner-all flex"></select>\
	<!-- Allow form submission with keyboard without duplicating the dialog button -->\
	<input type="submit" tabindex="-1" style="position:absolute; top:-1000px">\
  </form>\
</div>');

	var size = $('#quickOpenFile').prop('size');

	//handle keyboard: up / down enter / input
	$("#quickOpenSearch").keydown(function(e) {
		var next;

		switch (e.keyCode) {
			case 38: //up
				$('#quickOpenFile option:selected').prev().prop('selected', true);
				return false;
			case 40: //down
				$('#quickOpenFile option:selected').next().prop('selected', true);
				return false;
			case 33: //page up
				next = $('#quickOpenFile option:selected').prevAll(":eq("+size+")");

				if (!next.length) {
					next = $('#quickOpenFile option:selected').prevAll().last();
				}

				next.prop('selected', true);
				return false;
			case 34: //page down
				next = $('#quickOpenFile option:selected').nextAll(":eq("+size+")");

				if (!next.length) {
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
		var val = $("#quickOpenFile").val();

		if (val) {
			$("#dialog-message").dialogResize("close");
			$("#dialog-message").remove();

			var pos = val.indexOf('/');
			siteId = val.substr(0, pos);
			file = val.substr(pos+1);
			open(file, siteId);
		}
	}

	function refresh() {
		var search = $("#quickOpenSearch").val();
		var val = $("#quickOpenFile").val();

		//populate with recent files
		recentFiles = recent.getRecent();
		var items = util.clone(recentFiles);

		for (var i in items) {
			if (items[i].file.indexOf(search)==-1) {
				delete items[i];
			}
		}

		//TODO add tree items

		//clear old options
		$('#quickOpenFile').children('option').remove();

		//create select items
		items.forEach(function(item) {
			$('#quickOpenFile').append('<option value="'+item.site+'/'+item.file+'">'+item.domain+'/'+item.file+'</option>');
		});

		//select last item
		var selected = $('#quickOpenFile').val(val);

		//or first one
		if (!$('#quickOpenFile option:selected').length) {
			$('#quickOpenFile').children(':first').prop('selected', true);
		}
	}

	$("#quickOpenSearch").on('input', refresh);
	refresh();

	//select item click
	$('#quickOpenFile').click(pickSelected);

	//open dialog
	var dialog = $("#dialog-message").dialogResize({
		width: 800,
		height: 600,
		modal: true,
		close: function(event, ui) {
			$(this).remove();
		}
	});

	//make sure quick open is focused
	setTimeout(function() {
		$('#quickOpenSearch').focus();
	}, 100);

	//prevent form submit
	form = dialog.find("form").on("submit", function(event) {
		event.preventDefault();
		options.fn('yes');
	});
}

function init() {
	var prefs = preferences.get_prefs();

	// hide tabs
	if (!prefs.showDefinitions) {
		$('.ui-layout-west').find('.definitions').hide();
	}
	if (!prefs.showNotes) {
		$('.ui-layout-west').find('.notes').hide();
	}
	if (!prefs.showSnippets) {
		$('.ui-layout-west').find('.snippets').hide();
	}
	if (!prefs.showGit) {
		$('.ui-layout-west').find('.git').hide();
	}

	tabs_contextmenu.init();

	// TABS - sortable
	$(".ui-layout-west").tabs({
		event: 'mousedown'
	});
	var tabs = $(".ui-layout-east, .ui-layout-center").tabs({
		closable: true, addTab: true, event: 'mousedown'
	});

	// hide tabs
	if (!prefs.showDefinitions) {
		$('.ui-layout-west').find('.definitions').hide();
	}
	if (!prefs.showNotes) {
		$('.ui-layout-west').find('.notes').hide();
	}
	if (!prefs.showSnippets) {
		$('.ui-layout-west').find('.snippets').hide();
	}
	if (!prefs.showGit) {
		$('.ui-layout-west').find('.git').hide();
	}

	// initialize overflow
	$('.ui-layout-west').tabs();
	$('.ui-layout-east, .ui-layout-center').tabs('stretchyTabs');
	$('.ui-layout-east, .ui-layout-center').on('tabsbeforeremove', checkEdited);
	$('.ui-layout-east, .ui-layout-center').on('tabsremove', afterClose);
	$('.ui-layout-east, .ui-layout-center').on('tabsadd', newTab);

	//remember scroll
	$(".ui-layout-east, .ui-layout-center").on("tabsbeforeactivate", function(e, ui) {
		var oldPanel = $(ui.oldPanel);
		oldPanel.data('scrollTop', oldPanel.closest('.ui-layout-content').scrollTop());
	});

	//restore scroll
	$(".ui-layout-east, .ui-layout-center").on("tabsactivate", function(e, ui) {
		var newPanel = $(ui.newPanel);
		newPanel.closest('.ui-layout-content').scrollTop(newPanel.data("scrollTop"));

		//set focus etc
		tabActivate($(ui.newTab));
	});

	$("#tree").on("rename", updateTabs);

	//connected sortable (http://stackoverflow.com/questions/13082404/multiple-jquery-ui-tabs-connected-sortables-not-working-as-expected)
	tabs.find(".ui-tabs-nav").sortable({
		distance: 10,
		//revert: true,
		connectWith: '.ui-tabs-nav',
		receive: function (event, ui) {
			var receiver = $(this).parent();
			var sender = $(ui.sender[0]).parent();
			var tab = $(ui.item[0]);
			// Find the id of the associated panel
			var panelId = tab.attr("aria-controls");
			var insertBefore = document.elementFromPoint(event.pageX, event.pageY);

			if (insertBefore.parentElement == tab[0]) {
				insertBefore = document.elementFromPoint(event.pageX + insertBefore.offsetWidth, event.pageY);
			}

			insertBefore = $(insertBefore).closest('li[role="tab"]').get(0);

			if (!insertBefore)
				insertBefore = receiver.find('.addTab');

			if (insertBefore)
				tab.insertBefore(insertBefore);
			else
				$(this).append(tab);

			//move panel
			receiver.find('.ui-layout-content')[0].appendChild(document.getElementById(panelId));

			tabs.tabs('refresh');

			//activate tab
			receiver.tabs("option", "active", tab.index());

			// overflow resize
			tabs.tabs('doResize');
		},

		//don't drag "add tab" button
		items: "li:not(.button)",
		//allow dragging out of panel Adam Jimenez
		sort: function(e, ui) {
			if (ui.item.parent().prop("tagName") !== 'BODY') {
				ui.item.appendTo('body');
				ui.item.css('width', 'auto');
				ui.item.css('height', 'auto');
			}

			ui.helper.offset(ui.offset);
		},
		start: function(e, ui) {
			//remove tooltip
			//ui.item.tooltip();
			//ui.item.tooltip( "disable" );
		},
		stop: function(e, ui) {
			//reinstate tooltip
			//ui.item.tooltip( "enable" );
			//$( ui.item ).children('.ui-tabs-anchor').attr( "title", ui.item.data('title') );

			tabs.tabs('refresh');
		},
		change: function(e, ui) {
			var receiver = $(this).parent();

			// overflow resize
			receiver.tabs('doResize');
		}
	});
}

var default_options = {
	parse: {
		strict: false
	},
	compress: {
		sequences: true,
		properties: true,
		dead_code: true,
		drop_debugger: true,
		unsafe: true,
		unsafe_comps: true,
		conditionals: true,
		comparisons: true,
		evaluate: true,
		booleans: true,
		loops: true,
		unused: true,
		hoist_funs: true,
		hoist_vars: false,
		if_return: true,
		join_vars: true,
		side_effects: true,
		negate_iife: true,

		warnings: true,
		global_defs: {}
	},
	output: {
		indent_start: 0,
		indent_level: 4,
		quote_keys: false,
		ascii_only: false,
		inline_script: true,
		width: 80,
		max_line_len: 32000,
		beautify: false,
		source_map: null,
		bracketize: false,
		semicolons: true,
		comments: /@license|@preserve|^!/,
		preserve_line: false
	}
};
function uglify(code, options) {
	// Create copies of the options
	var parse_options = defaults({},
		options.parse);
	var compress_options = defaults({},
		options.compress);
	var output_options = defaults({},
		options.output);

	parse_options = defaults(parse_options,
		default_options.parse,
		true);
	compress_options = defaults(compress_options,
		default_options.compress,
		true);
	output_options = defaults(output_options,
		default_options.output,
		true);

	// 1. Parse
	var toplevel_ast;
	try {
		toplevel_ast = parse(code,
			parse_options);
		toplevel_ast.figure_out_scope();
	} catch(e) {
		prompt.alert({
			title: lang.failedText,
			msg: 'Error parsing file' + ': ' + e.message
		});
		return false;
	}


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
	var tab = active();
	if (!tab) {
		return;
	}

	if (tab.data('file')) {
		var editor = getEditor(this);
		var editorDiv = $(editor.container);

		if (toggle !== false && !editorDiv.hasClass('fullScreen')) {
			editorDiv.addClass('fullScreen');
			$('body').addClass('fullScreen');
		} else {
			$('.fullScreen').removeClass('fullScreen');
		}

		editor.focus();
	} else if (tab.data('ssh')) {
		var session = tab.data('session');
		var el = $(session.term.element);

		if (toggle !== false && !el.hasClass('fullScreen')) {
			el.addClass('fullScreen');
			$('body').addClass('fullScreen');
		} else {
			$('.fullScreen').removeClass('fullScreen');
		}

		session.focus();
	}
	resize.resize();
};

//listeners
$('body').on('click', '.openfile', function() {
	open($(this).data('file'), $(this).data('site'));
});

$('body').on('click', 'div.database', function() {
	site.database(site.active());
});

exports.active = active;
exports.getEditor = getEditor;
exports.setEdited = setEdited;
exports.save = save;
exports.saveAs = saveAs;
exports.saveAll = saveAll;
exports.download = download;
exports.revert = revert;
exports.revealInTree = revealInTree;
exports.init = init;
exports.close = close;
exports.closeAll = closeAll;
exports.closeOther = closeOther;
exports.closeTabsRight = closeTabsRight;
exports.open = open;
exports.openFiles = openFiles;
exports.reload = reload;
exports.reloadActive = reloadActive;
exports.isOpen = isOpen;
exports.recordOpenFiles = recordOpenFiles;
exports.next = next;
exports.prev = prev;
exports.setTitle = setTitle;
exports.fullScreen = fullScreen;
});