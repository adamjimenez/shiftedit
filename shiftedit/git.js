define(['exports', 'app/loading', 'app/config', 'app/layout', 'app/site', 'app/tree', 'app/tabs', 'app/prompt', 'app/lang', "ui.basicMenu", 'diff2html/diff2html', 'diff2html/diff2html-ui', 'linkify-html'], function (exports, loading, config, layout, site, tree, tabs, prompt) {
var linkifyHtml = require('linkify-html');
var lang = require('app/lang').lang;
var gitEditor;
var gitConfig = {
	name: '',
	email: ''
};

function init() {
	$('#tabs-git').append('<div class="vbox">\
		<p id="notAvailable" class="flex" style="text-align:center; color:#ccc;">Git panel will appear here</p>\
		<div id="gitLoading" style="display: none; text-align: center; margin: 10px;"><i class="fa fa-spinner fa-spin fa-3x fa-fw"></i><span class="sr-only">Loading...</span></div>\
		<div id="gitContainer" class="vbox" style="display: none;">\
			<div id="git-buttons" class="hbox">\
				<div id="gitBranchBar">\
					<select id="gitBranch">\
					</select>\
				</div>\
				<div class="flex" id="gitViewContainer">\
					<span id="gitViewRadio">\
						<input type="radio" name="gitViewItem" value="Changes" id="changesRadio"><label for="changesRadio">Changes</label>\
						<input type="radio" name="gitViewItem" value="History" id="historyRadio" checked><label for="historyRadio">History</label>\
					</span>\
				</div>\
				<button id="gitMenuBtn"><i class="fa fa-bars"></i></button>\
				<ul id="gitMenu"></ul>\
			</div>\
			<div id="gitContentContainer" class="vbox">\
				<ul id="gitHistory"></ul>\
				<div id="changesContainer" class="vbox" style="display: none;">\
					<ul id="gitChanges" class="flex"></ul>\
					<div id="commitPanel">\
						<input id="gitSubject" type="text" name="subject" placeholder="Summary" class="text ui-widget-content ui-corner-all">\
						<textarea id="gitDescription" placeholder="Description" class="text ui-widget-content ui-corner-all"></textarea>\
						<button type="button" id="commitBtn" disabled>Commit to master</button>\
					</div>\
				</div>\
			</div>\
		</div>\
	</div>');
	
	$( "#gitViewRadio input[type='radio']" ).checkboxradio({
		icon: false
	});
	var gitCombo = $( "#gitBranch" ).combobox({
		select: function (event, ui) {
			// load branch
			checkout(ui.item.value);
		},
		change: function (event, ui) {
			// load branch
			checkout(ui.item.value);
		},
		create: function( event, ui ) {
		}
	});
	
	//button menu
	var items = [{
		id: 'gitrefresh',
		text: 'Refresh',
		handler: refresh
	}, {
		id: 'gitsync',
		text: 'Sync',
		handler: sync
	}, {
		id: 'gitcreatebranch',
		text: 'Create branch',
		handler: createBranch
	}, {
		id: 'gitdeletebranch',
		text: 'Delete branch',
		handler: deleteBranch
	}, {
		id: 'gitConfig',
		text: 'Config',
		handler: editConfig
	}];
		
	var el = $("#gitMenu");
	var context;
	items.forEach(function(item) {
		if(item==='-') {
			el.append('<li>-</li>');
		} else {
			var itemEl = $('<li id="'+item.id+'">\
				<a href="#">'+item.text+'</a>\
			</li>').appendTo(el);

			if(item.disabled) {
				itemEl.addClass('ui-state-disabled');
			}

			if(item.handler) {
				itemEl.click(jQuery.proxy(item.handler, undefined, context));
			}
		}
	});

	var menu = el.menu().hide();

	$("#gitMenuBtn").button()
	.click(function() {
		// Make use of the general purpose show and position operations
		// open and place the menu where we want.
		menu.show().position({
			  my: "left top",
			  at: "left bottom",
			  of: this
		});

		// Register a click outside the menu to close it
		$( document ).on( "click", function() {
			  menu.hide();
		});

		// Make sure to return false here or the click registration
		// above gets invoked.
		return false;
	});
	
	// update on file rename / delete
	$('#tree').on('loaded.jstree rename delete', function(e, obj) {
		refresh();
	});
	
	// update on tree reload (extract/ move triggers a reload)
	$('#tree').on('open_node.jstree', function(e, obj) {
		if (obj.node.id==='#root')
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
				var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+site.active());
				loading.fetch(ajaxOptions.url+'&cmd=show&commit='+hash, {
					action: 'show commit',
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
	
	$("#gitChanges").basicMenu({
		select: function (event, ui) {
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
	
	$('#gitViewContainer input:radio').change(function() {
		if (this.value==='Changes') {
			$('#gitHistory').hide();
			$('#changesContainer').show();
		} else if (this.value==='History') {
			$('#gitHistory').show();
			$('#changesContainer').hide();
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
			switch(key) {
				case 'open':
					tabs.open($(this).data('path'), site.active());
				break;
				case 'discard':
					var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+site.active());
					loading.fetch(ajaxOptions.url+'&cmd=discard&path='+$(this).data('path'), {
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
			"open": {name: "Open file"},
			"discard": {name: "Discard changes"}
		}
	});
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
	
	var diff2htmlUi = new Diff2HtmlUI({diff: result});

	diff2htmlUi.draw('#gitDiff', {
		inputFormat: 'json', //diff
		//showFiles: true,
		matching: 'lines'
	});
	//diff2htmlUi.highlightCode('#gitDiff');
}

function refresh() {
	// must have a git folder and use SFTP or a proxy
	var settings = site.getSettings(site.active());
	
	var supported = (
		['AJAX','SFTP','AWS','Linode'].indexOf(settings.server_type)!==-1 || settings.turbo 
	);
	
	var hasRepo = $('#tree').jstree(true).get_node('.git')
	
	if (!supported) {
		$('#gitContainer').hide();
		$('#notAvailable').html('Git not supported for this server type').show();
		return;
	} else if (!hasRepo) {
		$('#gitContainer').hide();
		
		var rootNode = $('#tree').jstree(true).get_node('#root');
		
		if (rootNode.children.length) {
			$('#notAvailable').html('No Git repository and root not empty.').show();
		} else {
			$('#notAvailable').html('<a href="#" class="gitClone">Clone a repository</a>.').show();
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

			$.each(data.branches, function( index, branch ) {
				$( "#gitBranch" ).append( '<option value="'+branch.name+'">' + branch.name + '</option>' );
				if (branch.selected) {
					$( "#gitBranch" ).combobox('val', branch.name);
					$( '#commitBtn' ).text('Commit to '+branch.name);
					
					if (branch.name==='master') {
						$('#gitdeletebranch').addClass('ui-state-disabled');
					} else {
						$('#gitdeletebranch').removeClass('ui-state-disabled');
					}
				}
			});
			
			// history
			$( "#gitHistory" ).children().remove();
			$.each(data.commits, function( index, item ) {
				$( '<li><a href="#"><span class="subject">' + item.subject + '</span><br><span class="date">' + item.date + '</span> by <span class="author">' + item.author + '</span></a></li>' ).appendTo( "#gitHistory" )
				.attr('data-hash', item.hash);
			});
			
			// changes
			$("#gitChanges li").addClass('delete').removeData('diff');
			$.each(data.changes, function( index, item ) {
				var li = $("#gitChanges").find('[data-path="'+item.path+'"]');
				if ( li.length ) {
					li.removeClass('delete');
				} else {
					$( '<li><a href="#"><input type="checkbox" value="1" checked>' + item.path + '</a></li>' ).appendTo( "#gitChanges" )
					.attr('data-path', item.path);
				}
			});
			$( "#gitChanges" ).children('.delete').remove();
			
			$('#notAvailable').hide();
			$('#gitLoading').hide();
			$('#gitContainer').show();
		},
		error: function(error) {
			$('#gitContainer').hide();
			$('#gitLoading').hide();
			$('#notAvailable').html(error).show();
		}
	});
}

function checkout(branch) {
	var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+site.active());
	
	loading.fetch(ajaxOptions.url+'&cmd=checkout&branch='+branch, {
		action: 'git checkout '+branch,
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
			<label>Name:</label>\
			<input type="text" name="name" class="flex text ui-widget-content ui-corner-all">\
		</p>\
		<p class="hbox">\
			<label>From branch:</label>\
			<select name="from" class="flex text ui-widget-content ui-corner-all"></select>\
		</p>\
	  </form>\
	</div>');
	
	var dialog = $( "#dialog-branch" ).dialog({
		modal: true,
		width: 320,
		height: 200,
		close: function( event, ui ) {
			$( this ).remove();
		},
		buttons: {
			create: {
				text: "Create new branch",
				id: "createBranchBtn",
				click: function() {
					var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+site.active());
					var name = $('#branchForm input[name=name]').val();
					var from = $('#branchForm select[name=from]').val();
					
					loading.fetch(ajaxOptions.url+'&cmd=create_branch&name='+name+'&from='+from, {
						action: 'git checkout -b '+name+' '+from,
						success: function(data) {
							if (data.success) {
								$( '#dialog-branch' ).dialog( "close" );
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
	$.each($('#gitBranch option'), function( index ) {
		var option = $( "#branchForm select[name=from]" ).append( '<option value="'+this.value+'">' + this.value + '</option>' );
	});
	
	$('#branchForm select[name=from]').val($( "#gitBranch" ).combobox('val'));
	
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

function deleteBranch() {
	var branch = $( "#gitBranch" ).combobox('val');
	
	prompt.confirm({
		title: 'Delete branch '+branch,
		msg: 'Are you sure?',
		fn: function(value) {
			if (value==='yes') {
				var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+site.active());
				loading.fetch(ajaxOptions.url+'&cmd=delete_branch&branch='+branch, {
					action: 'git branch -d '+branch,
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
								title: 'Force Delete branch '+branch,
								msg: 'Branch is not fully merged, delete anyway?',
								fn: function(value) {
									if (value==='yes') {
										var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+site.active());
										loading.fetch(ajaxOptions.url+'&cmd=delete_branch&branch='+branch+'&force=1', {
											action: 'git branch -D '+branch,
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
						} else {
							prompt.alert({title:'Error', msg:data.error});
						}
					}
				});
			
				return;
			}
			
			return false;
		}
	});
}

function editConfig() {
	$( "body" ).append('<div id="dialog-config" title="Config">\
	  <form id="configForm" class="tidy">\
		<p class="hbox">\
			<label>Name:</label>\
			<input type="text" name="name" class="flex text ui-widget-content ui-corner-all">\
		</p>\
		<p class="hbox">\
			<label>Email:</label>\
			<input type="email" name="email" class="flex text ui-widget-content ui-corner-all">\
		</p>\
	  </form>\
	</div>');
	
	$('#configForm input[name=name]').val(gitConfig.name);
	$('#configForm input[name=email]').val(gitConfig.email);
	
	var dialog = $( "#dialog-config" ).dialog({
		modal: true,
		width: 320,
		height: 200,
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
								$( '#dialog-config' ).dialog( "close" );
								refresh();
							} else {
								prompt.alert({title:'Error', msg:data.error});
							}
						}
					});
				}
			},
		}
	});
	
	// branch options
	$.each($('#gitBranch option'), function( index ) {
		var option = $( "#branchForm select[name=from]" ).append( '<option value="'+this.value+'">' + this.value + '</option>' );
	});
	
	$('#branchForm select[name=from]').val($( "#gitBranch" ).combobox('val'));
	
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
}

function sync() {
	var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+site.active());
	loading.fetch(ajaxOptions.url+'&cmd=sync', {
		action: 'syncing',
		success: function(data) {
			if (data.success) {
				tree.refresh();
				var html = data.result;
				html = html.replace(/remote:\s/g, '');
				html = html.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br>$2');
				html = linkifyHtml(html);
				prompt.alert({title:'Success', msg:html});
			} else {
				prompt.alert({title:'Error', msg:data.error});
			}
		}
	});
}

return {
	init: init
};
});