define(['exports', './loading', './config', './layout', './site', './tree', './tabs', './prompt', './git_menu', 'linkify-html', './lang', './util', "ui.basicMenu", 'dialogResize', 'diff2html-ui'], function (exports, loading, config, layout, site, tree, tabs, prompt, git_menu, linkifyHtml, lang, util) {
lang = lang.lang;
var gitEditor;
var gitConfig = {
	name: '',
	email: ''
};

var branches;
var currentBranch;

function init() {
	$('#tabs-git').append('<div class="vbox">\
		<div id="notAvailable" class="flex" style="text-align:center; color:#ccc;">Connect to a site</div>\
		<div id="gitLoading" style="display: none; text-align: center; margin: 10px;"><i class="fa fa-spinner fa-spin fa-3x fa-fw"></i><span class="sr-only">Loading...</span></div>\
		<div id="gitContainer" class="vbox" style="display: none;">\
			<div class="hbox ui-widget-header panel-buttons">\
				<div class="flex" id="gitViewContainer">\
					<span id="gitViewRadio" class="hbox">\
						<input type="radio" name="gitViewItem" value="Changes" id="changesRadio"><label class="flex" for="changesRadio" title="Changes"><i class="far fa-folder"></i></label>\
						<input type="radio" name="gitViewItem" value="History" id="historyRadio" checked><label class="flex" for="historyRadio" title="History"><i class="fas fa-history"></i></label>\
						<input type="radio" name="gitViewItem" value="Stashes" id="stashesRadio"><label class="flex" for="stashesRadio" title="Stashes"><i class="far fa-clipboard"></i></label>\
					</span>\
				</div>\
			</div>\
			<div id="gitContentContainer" class="vbox">\
				<ul id="gitHistory"></ul>\
				<div id="changesContainer" class="vbox" style="display: none;">\
					<label class="toggle ui-state-default" style="padding: 0.4em 1em; margin: 0;"><input type="checkbox" checked><span class="count">0</span> changed files</label>\
					<ul id="gitChanges" class="flex"></ul>\
					<div id="commitPanel">\
						<input id="gitSubject" type="text" name="subject" placeholder="' + lang.summary + '" class="text ui-widget-content ui-corner-all">\
						<textarea id="gitDescription" placeholder="' + lang.description + '" class="text ui-widget-content ui-corner-all"></textarea>\
						<button type="button" id="commitBtn" disabled></button>\
					</div>\
				</div>\
				<div id="stashesContainer" class="vbox" style="display: none;">\
					<ul id="gitStashes" class="flex"></ul>\
					<div id="stashPanel">\
						<input id="gitStashSubject" type="text" name="subject" placeholder="' + lang.summary + '" class="text ui-widget-content ui-corner-all">\
						<button type="button" id="createStashBtn">Create Stash</button>\
					</div>\
				</div>\
			</div>\
		</div>\
	</div>');
	
	$( "#gitViewRadio input[type='radio']" ).checkboxradio({
		icon: false
	});
	
	$('.gitSync').click(sync);
	
	// update on file rename / delete
	$('#tree').on('loaded.jstree rename delete', function(e, obj) {
		refresh();
	});
	
	// update on tree reload (extract/ move triggers a reload)
	$('#tree').on('open_node.jstree', function(e, obj) {
		if (obj.node.id === '#root')
			refresh();
	});
	
	// update on file save
	$('body').on('save','.ui-tabs', refresh);
	
	$("#gitHistory").basicMenu({
		select: function (event, ui) {
			var title = $(ui.item).find('.subject').text();
			if ($(ui.item).data('diff')) {
				show(title, $(ui.item).data('diff'));
			} else {
				var hash = $(ui.item).data('hash');
				var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl + 'files?site=' + site.active());
				loading.fetch(ajaxOptions.url+'&cmd=show&commit=' + hash, {
					action: 'show commit',
					success: function(data) {
						if (data.success) {
							$(ui.item).data('diff', data.result);
							
							if ($(ui.item).data('diff')) {
								show(title, $(ui.item).data('diff'));
							}
						} else {
							prompt.alert({title:'Error', msg:data.error});
						}
					}
				});
			}
		}
	});
	
	$("#gitChanges").basicMenu({
		click: function (event, ui) {
			var title = $(ui.item).text();
			if ($(ui.item).data('diff')) {
				show(title, $(ui.item).data('diff'));
			} else {
				var path = $(ui.item).data('path');
				var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+site.active());
				loading.fetch(ajaxOptions.url+'&cmd=diff&path='+path, {
					action: 'diff '+path,
					success: function(data) {
						if (data.success) {
							$(ui.item).data('diff', data.result);
							show(title, $(ui.item).data('diff'));
						} else {
							prompt.alert({title:'Error', msg:data.error});
						}
					}
				});
			}
		}
	});
	
	$("#gitStashes").basicMenu({
		select: function (event, ui) {
			var title = $(ui.item).find('.name').text();
			
			if ($(ui.item).data('diff')) {
				show(title, $(ui.item).data('diff'));
			} else {
				var index = $(ui.item).data('index');
				var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+site.active());
				loading.fetch(ajaxOptions.url+'&cmd=stash_show&index=' + index, {
					action: 'show stash',
					success: function(data) {
						if (data.success) {
							$(ui.item).data('diff', data.result);
							
							if ($(ui.item).data('diff')) {
								show(title, $(ui.item).data('diff'));
							}
						} else {
							prompt.alert({title:'Error', msg:data.error});
						}
					}
				});
			}
		}
	});
	
	$('#createStashBtn').button().click(function() {
		var params = {};
		params.subject = $('#gitStashSubject').val();
		
		// post it
		var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+site.active());
		loading.fetch(ajaxOptions.url+'&cmd=stash_push', {
			action: 'create stash',
			data: params,
			success: function(data) {
				if (data.success) {
					// clear values
					$('#gitStashSubject').val('');
					
					tree.refresh();
				} else {
					prompt.alert({title:'Error', msg:data.error});
				}
			}
		});
	});
	
	$('#gitViewContainer input:radio').change(function() {
		$('#gitHistory').hide();
		$('#stashesContainer').hide();
		$('#changesContainer').hide();
			
		if (this.value==='Changes') {
			$('#changesContainer').show();
		} else if (this.value==='History') {
			$('#gitHistory').show();
		} else if (this.value==='Stashes') {
			$('#stashesContainer').show();
		}
	});
	
	var checkCommit = function() {
		if ($('#gitSubject').val() && $('#gitChanges input:checked').length) {
			$('#commitBtn').button('enable');
		} else {
			$('#commitBtn').button('disable');
		}
	};
	
	$('#gitChanges').on('change click input', 'input', checkCommit);
	$('#gitSubject').on('change keyup input', checkCommit);
	$('#changesContainer .toggle').on('change', 'input', function() {
		$('#gitChanges input').prop("checked", this.checked);
	});

	// toggle all when individual items are ticked	
	$('#gitChanges').on('change', 'input', function() {
		if ($('#gitChanges input:checked').length == $('#gitChanges input').length) {
			$('#changesContainer .toggle input').prop("checked", true);
		} else if($('#gitChanges input:checked').length === 0) {
			$('#changesContainer .toggle input').prop("checked", false);
		} else {
			$('#changesContainer .toggle input').prop("indeterminate", true);
		}
	});
	
	$('#commitBtn').button().click(function() {
		var params = {};
		params.subject = $('#gitSubject').val();
		params.description = $('#gitDescription').val();
		
		// get checked files
		params.paths = [];
		$.each($('#gitChanges input:checked'), function( index, item ) {
			params.paths.push($(this).closest('li').data('path'));
		});
		
		// post it
		var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+site.active());
		loading.fetch(ajaxOptions.url+'&cmd=commit', {
			action: 'commit',
			data: params,
			success: function(data) {
				if (data.success) {
					if (data.result.indexOf('***')!==-1) {
						var msg = data.result.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
						prompt.alert({title:'Notice', msg:msg});
					}
					
					// clear values
					$('#gitSubject').val('');
					$('#gitDescription').val('');
					
					tree.refresh();
				} else {
					prompt.alert({title:'Error', msg:data.error});
				}
			}
		});
	});
	
	$.contextMenu({
		selector: '#gitChanges li',
		callback: function(key, opt){
			var ajaxOptions;
			
			switch(key) {
				case 'open':
					tabs.open($(this).data('path'), site.active());
				break;
				case 'discard':
					ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+site.active());
					loading.fetch(ajaxOptions.url+'&cmd=discard&path=' + $(this).data('path'), {
						action: 'discard file',
						success: function(data) {
							if (data.success) {
								tree.refresh();
							} else {
								prompt.alert({title:'Error', msg:data.error});
							}
						}
					});
				break;
				case 'ignore':
					ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+site.active());
					loading.fetch(ajaxOptions.url+'&cmd=ignore&path=' + $(this).data('path'), {
						action: 'discard file',
						success: function(data) {
							if (data.success) {
								tree.refresh();
							} else {
								prompt.alert({title:'Error', msg:data.error});
							}
						}
					});
				break;
			}
		},
		items: {
			"open": {name: lang.openFile},
			"discard": {name: lang.discardChanges},
			"ignore": {name: 'Add to .gitignore'}
		}
	});
	
	$.contextMenu({
		selector: '#gitHistory li',
		callback: function(key, opt){
			switch(key) {
				case 'copy':
					util.copy($(this).data('hash'));
				break;
				case 'revert':
					var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl + 'files?site=' + site.active());
					loading.fetch(ajaxOptions.url+'&cmd=revert&hash=' + $(this).data('hash'), {
						action: 'revert commit',
						success: function(data) {
							if (data.success) {
								tree.refresh();
							} else {
								prompt.alert({title:'Error', msg:data.error});
							}
						}
					});
				break;
			}
		},
		items: {
			"copy": {name: lang.copy},
			"revert": {name: lang.revert}
		}
	});
	
	$.contextMenu({
		selector: '#gitStashes li',
		callback: function(key, opt){
			var ajaxOptions;
			var index = $(this).data('index');
			
			switch(key) {
				case 'apply':
					ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+site.active());
					loading.fetch(ajaxOptions.url+'&cmd=stash_apply&index=' + index, {
						action: 'remove stash',
						success: function(data) {
							if (data.success) {
								if (data.result.substr(0, 6) === 'error:' ) {
									prompt.alert({title:'Error', msg:data.result});
								} else {
									tree.refresh();
									prompt.alert({title:'Success', msg:'Git stash applied'});
								}
							} else {
								prompt.alert({title:'Error', msg:data.error});
							}
						}
					});
				break;
				case 'remove':
					prompt.confirm({
						title: 'Remove stash',
						msg: 'Are you sure you want to remove this stash?',
						fn: function(value) {
							if (value==='yes') {
								ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+site.active());
								loading.fetch(ajaxOptions.url+'&cmd=stash_drop&index=' + index, {
									action: 'remove stash',
									success: function(data) {
										if (data.success) {
											tree.refresh();
										} else {
											prompt.alert({title:'Error', msg:data.error});
										}
									}
								});
							}
						}
					});
				break;
			}
		},
		items: {
			"apply": {name: 'Apply'},
			"remove": {name: 'Remove'}
		}
	});
	
	git_menu.init();
}

function show(title, result) {
	// check for tab or create it
	
	// add result to tab
	var tab = $('li[data-type=git]');
	var minWidth = 300;
	var myLayout = layout.get();
	
	if(tab.length) {
		tabpanel = tab.closest('.ui-tabs');
		tabpanel.tabs("option", "active", tab.index());

		//get nearest panel
		var pane = tab.closest('.ui-layout-pane');
		var paneName = pane[0].className.match('ui-layout-pane-([a-z]*)')[1];

		//expand panel
		myLayout.open(paneName);
		if (pane.outerWidth() < minWidth) {
			myLayout.sizePane(paneName, minWidth);
		}
	} else {
		tab = $(".ui-layout-center").tabs('add', 'Git', '<div id="gitDiff" class="git"></div>');
		tab.addClass('closable');
		tab.attr('data-type', 'git');
	}
	
	tab.children('.ui-tabs-anchor').attr('title', title);
	tab.children('.ui-tabs-anchor').contents().last().replaceWith(title);

	/*	
	var Diff2HtmlUI = require('diff2html-ui');
	var configuration = { matching: 'lines' };
	var diff2htmlUi = new Diff2HtmlUI.Diff2HtmlUI(document.getElementById('gitDiff'), result, configuration);
	diff2htmlUi.draw();
	*/
	
	require(['diff2html-ui'], function() {
		var diff2htmlUi = new Diff2HtmlUI({diff: result});
	
		diff2htmlUi.draw('#gitDiff', {
			inputFormat: 'json', //diff
			//showFiles: true,
			matching: 'lines'
		});
		//diff2htmlUi.highlightCode('#gitDiff');
	});
}

function refresh() {
	// must have a git folder and use SFTP or a proxy
	var settings = site.getSettings(site.active());
	
	var supported = (
		['AJAX','SFTP','AWS','Linode'].indexOf(settings.server_type)!==-1 || parseInt(settings.turbo)
	);
	
	var hasRepo = $('#tree').jstree(true).get_node('.git');

	$('.status_bar .gitBranchBar, .status_bar .gitSync').addClass('ui-state-disabled');
	
	if (!supported) {
		$('#gitContainer').hide();
		$('#notAvailable').html('Not supported for ' + settings.server_type).show();
		
		return;
	} else if (!hasRepo) {
		$('#gitContainer').hide();
		
		var rootNode = $('#tree').jstree(true).get_node('#root');
		
		if (rootNode.children && rootNode.children.length) {
			$('#notAvailable').html('Empty root folder before cloning a repository').show();
		} else {
			$('#notAvailable').html('<a href="#" class="gitClone">Clone a repository</a>').show();
		}
		
		$('a.gitClone').click(function() {
			prompt.prompt({
				title: 'Clone a git repository',
				msg: 'URL',
				fn: function(btn, value) {
					switch(btn) {
						case 'ok':
							var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+site.active());
							
							loading.fetch(ajaxOptions.url+'&cmd=clone&url='+encodeURIComponent(value), {
								action: 'git clone '+value+' .',
								success: function(data) {
									if (data.success) {
										tree.refresh();
									} else {
										prompt.alert({title:'Error', msg:data.error});
									}
								}
							});
						break;
					}
				}
			});
		});
		
		return;
	}
	
	$('.status_bar .gitBranchBar, .status_bar .gitSync').removeClass('ui-state-disabled');
	
	// get commits / branches / status
	gitLog();
}

function gitLog() {
	$('#notAvailable').hide();
	$('#gitContainer').hide();
	$('#gitLoading').show();
	
	var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+site.active());
	
	loading.fetch(ajaxOptions.url+'&cmd=git_info', {
		giveWay: true,
		action: false,
		success: function(data) {
			// config
			gitConfig = data.config;
			
			// branches
			$( "#gitBranch" ).children('option').remove();
			
			branches = data.branches;
			
			$.each(data.branches, function( index, branch ) {
				if (branch.selected) {
					currentBranch = branch.name;
				}
			});
			
			$( ".gitBranchBar .label" ).html('<i class="fas fa-code-branch"></i> ' + currentBranch);
			$( ".gitBranchBar" ).data('value', currentBranch);
			$( '#commitBtn' ).html('Commit to ' + currentBranch);
			
			// history
			$( "#gitHistory" ).children().remove();
			$.each(data.commits, function( index, item ) {
				$( '<li><a href="#"><span class="subject">' + item.subject + '</span><br><span class="date">' + item.date + '</span> by <span class="author">' + item.author + '</span></a></li>' ).appendTo( "#gitHistory" )
				.attr('data-hash', item.hash);
			});
			
			// changes
			$("#gitChanges li").addClass('delete').removeData('diff');
			$.each(data.changes, function( index, item ) {
				var li = $("#gitChanges").find('[data-path="'+item.path.replace(/"/g, '')+'"]');
				if (li.length) {
					li.removeClass('delete');
				} else {
					$( '<li><a href="#"><input type="checkbox" value="1" checked>' + item.path + '</a></li>' ).appendTo( "#gitChanges" )
					.attr('data-path', item.path);
				}
			});
			
			var changes = data.changes ? data.changes.length : '';
			$('#changesContainer .count').text(changes);
			
			$( "#gitChanges" ).children('.delete').remove();
			
			if (data.changes && data.changes.length > 0) {
				$( ".gitBranchBar .label" ).append('<span>*</span>');
			}
			
			// stashes
			$( "#gitStashes" ).children().remove();
			$.each(data.stashes, function( index, item ) {
				$( '<li><a href="#"><span class="name">' + item.name + '</span></a></li>' ).appendTo( "#gitStashes" )
				.attr('data-index', item.index);
			});
			
			$( "#gitViewRadio input[type='radio']" ).checkboxradio('refresh');
			
			$('#notAvailable').hide();
			$('#gitLoading').hide();
			$('#gitContainer').show();
			
			// status: "## master...origin/master [ahead 1]"
			if (data.status) {
				var matches = data.status.match(/\[(ahead|behind)\s(.*)\]/);
				
				var count = matches ? matches[2] : '';
				var status = matches ? matches[1] : '';
				
				$('.gitSync .count').text(count);

				$('.gitSync i').removeClass('fa-sync');
				$('.gitSync i').removeClass('fa-arrow-down');
				$('.gitSync i').removeClass('fa-arrow-up');
				$('.gitSync').removeClass('ui-state-highlight');
				
				switch(status) {
					case 'ahead':
						$('.gitSync i').addClass('fa-arrow-up');
						$('.gitSync').addClass('ui-state-highlight');
					break;
					case 'behind':
						$('.gitSync i').addClass('fa-arrow-down');
						$('.gitSync').addClass('ui-state-highlight');
					break;
					default:
						$('.gitSync i').addClass('fa-sync');
					break;
				}
			}
		},
		error: function(data) {
			console.log(arguments)
			$('#gitContainer').hide();
			$('#gitLoading').hide();
			$('#notAvailable').html(data).show();
			$('.status_bar .gitBranchBar, .status_bar .gitSync').addClass('ui-state-disabled');
		}
	});
}

function checkout(branch) {
	$( ".gitBranchBar .label" ).html('<i class="fas fa-code-branch"></i> ' + branch);
	
	var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl + 'files?site=' + site.active());
	
	loading.fetch(ajaxOptions.url + '&cmd=checkout&branch=' + encodeURIComponent(branch), {
		action: 'git checkout ' + branch,
		success: function(data) {
			if (data.success) {
				tree.refresh();
			} else {
				prompt.alert({title:'Error', msg:data.error});
			}
		}
	});
}

function createBranch() {
	$( "body" ).append('<div id="dialog-branch" title="Branch">\
	  <form id="branchForm" class="tidy">\
		<p class="hbox">\
			<label>'+lang.name+':</label>\
			<input type="text" name="name" class="flex text ui-widget-content ui-corner-all">\
		</p>\
		<p class="hbox">\
			<label>'+lang.fromBranch+':</label>\
			<select name="from" class="flex text ui-widget-content ui-corner-all"></select>\
		</p>\
	  </form>\
	</div>');
	
	var dialog = $( "#dialog-branch" ).dialogResize({
		width: 320,
		height: 200,
		modal: true,
		close: function( event, ui ) {
			$( this ).remove();
		},
		buttons: {
			create: {
				text: lang.createNewBranch,
				id: "createBranchBtn",
				click: function() {
					var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+site.active());
					var name = $('#branchForm input[name=name]').val();
					var from = $('#branchForm select[name=from]').val();
					
					loading.fetch(ajaxOptions.url+'&cmd=create_branch&name=' + encodeURIComponent(name) + '&from=' + encodeURIComponent(from), {
						action: 'git checkout -b ' + name + ' ' + from,
						success: function(data) {
							if (data.success) {
								$( '#dialog-branch' ).dialogResize( "close" );
								tree.refresh();
							} else {
								prompt.alert({title:'Error', msg:data.error});
							}
						}
					});
				},
				disabled: true
			},
		}
	});
	
	// branch options
	$.each(branches, function( index ) {
		var option = $( "#branchForm select[name=from]" ).append( '<option value="'+this.name+'">' + this.name + '</option>' );
	});
	
	$('#branchForm select[name=from]').val(currentBranch);
	
	$('#branchForm input[name=name]').on('change input keyup', function() {
		// replace non-alphanumeric characters
		var name = $(this).val();
		var newName = name.replace(/\W/g, "-");
		if (name!=newName) {
			$(this).val(newName);
		}
		
		if ($(this).val()) {
			$('#createBranchBtn').button( "option", "disabled", false );
		} else {
			$('#createBranchBtn').button( "option", "disabled", true );
		}
	});
	
	$('#branchForm').submit(function(e) {
		$('#createBranchBtn').not(":disabled").click();
		e.preventDefault();
	});
}

function doRemoveBranch(branch) {
	var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl + 'files?site=' + site.active());
	loading.fetch(ajaxOptions.url + '&cmd=delete_branch&branch=' + encodeURIComponent(branch), {
		action: 'git branch -d ' + branch,
		success: function(data) {
			if (data.success) {
				tree.refresh();
			} else {
				prompt.alert({title:'Error', msg:data.error});
			}
		},
		error: function(error) {
			if (error.indexOf('is not fully merged')) {
				prompt.confirm({
					title: lang.forceDeleteBranch + ' ' + branch,
					msg: lang.confirmDeleteUnmergedBranch,
					fn: function(value) {
						if (value === 'yes') {
							var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl + 'files?site='+site.active());
							loading.fetch(ajaxOptions.url + '&cmd=delete_branch&branch=' + encodeURIComponent(branch) + '&force=1', {
								action: 'git branch -D ' + branch,
								success: function(data) {
									if (data.success) {
										tree.refresh();
									} else {
										prompt.alert({title: 'Error', msg: data.error});
									}
								}
							});
						}
					}
				});
			} else {
				prompt.alert({title:'Error', msg:error});
			}
		}
	});
}

function removeBranch(branch) {
	prompt.confirm({
		title: lang.deleteBranch + ' ' + branch,
		msg: lang.areYouSure,
		fn: function(value) {
			if (value === 'yes') {
				doRemoveBranch(branch);
				return;
			}
			
			return false;
		}
	});
}

function doMerge(branch) {
	var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl + 'files?site=' + site.active());
	loading.fetch(ajaxOptions.url + '&cmd=merge&branch=' + encodeURIComponent(branch), {
		action: 'git merge ' + branch,
		success: function(data) {
			if (data.success) {
				tree.refresh();
			} else {
				prompt.alert({title:'Error', msg:data.error});
			}
		},
		error: function(error) {
			prompt.alert({title:'Error', msg:error});
		}
	});
}

function merge(branch) {
	prompt.confirm({
		title: 'Merge ' + branch,
		msg: lang.areYouSure,
		fn: function(value) {
			if (value === 'yes') {
				doMerge(branch);
				return;
			}
			
			return false;
		}
	});
}

function configure() {
	$( "body" ).append('<div id="dialog-config" title="Config">\
	  <form id="configForm" class="tidy">\
		<p class="hbox">\
			<label>'+lang.name+':</label>\
			<input type="text" name="name" class="flex text ui-widget-content ui-corner-all">\
		</p>\
		<p class="hbox">\
			<label>'+lang.email+':</label>\
			<input type="email" name="email" class="flex text ui-widget-content ui-corner-all">\
		</p>\
	  </form>\
	</div>');
	
	$('#configForm input[name=name]').val(gitConfig.name);
	$('#configForm input[name=email]').val(gitConfig.email);
	
	var dialog = $( "#dialog-config" ).dialogResize({
		width: 320,
		height: 200,
		modal: true,
		close: function( event, ui ) {
			$( this ).remove();
		},
		buttons: {
			create: {
				text: "Save",
				click: function() {
					var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+site.active());
					var name = $('#configForm input[name=name]').val();
					var email = $('#configForm input[name=email]').val();
					
					loading.fetch(ajaxOptions.url+'&cmd=config&name='+name+'&email='+email, {
						action: 'git config user.name "'+name+'"; git config user.email "'+email+'"',
						success: function(data) {
							if (data.success) {
								$( '#dialog-config' ).dialogResize( "close" );
								refresh();
							} else {
								prompt.alert({title: lang.errorText, msg:data.error});
							}
						}
					});
				}
			},
		}
	});
}

function sync() {
	$('.gitSync i').removeClass('fa-arrow-down').removeClass('fa-arrow-up');
	$('.gitSync').removeClass('ui-state-highlight');
	$('.gitSync i').addClass('fa-sync').addClass('fa-spin');
	
	var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl + 'files?site=' + site.active());
	loading.fetch(ajaxOptions.url + '&cmd=sync', {
		action: 'syncing',
		success: function(data) {
			$('.gitSync i').removeClass('fa-spin');
			
			if (data.success) {
				tree.refresh();
				var html = data.result;
				html = html.replace(/remote:\s/g, '');
				html = html.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
				html = linkifyHtml(html);
				prompt.alert({title:lang.success, msg: html});
			} else {
				prompt.alert({title: 'Sync Unsuccessful', msg: $(data.error).text()});
			}
		},
		error: function(error) {
			$('.gitSync i').removeClass('fa-spin');
			prompt.alert({title: 'Sync Error', msg: util.escapeHTML(error)});
		}
	});
}

function getBranches() {
	return branches;
}

function activeBranch() {
	return currentBranch;
}

exports.init = init;
exports.configure = configure;
exports.getBranches = getBranches;
exports.activeBranch = activeBranch;
exports.createBranch = createBranch;
exports.removeBranch = removeBranch;
exports.merge = merge;
exports.checkout = checkout;
exports.refresh = refresh;
exports.sync = sync;

});