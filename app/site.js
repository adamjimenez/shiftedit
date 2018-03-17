define(['exports', './config', "./prompt", "./tree", "./storage", "./util", "./ssl", "./loading", './prefs', './layout', 'aes', './gdrive', './editors', './servers', './repositories', './lang',  "ui.combobox", 'dialogResize'], function (exports, config, prompt, tree, storage, util, ssl, loading, preferences, layout, Aes, gdrive, editors, servers, repositories, lang) {
define(['exports', './config', "./prompt", "./tree", "./storage", "./util", "./ssl", "./loading", './prefs', './layout', 'aes', './gdrive', './editors', './servers', './repositories', './lang',  "ui.combobox", 'dialogResize', 'showPassword'], function (exports, config, prompt, tree, storage, util, ssl, loading, preferences, layout, Aes, gdrive, editors, servers, repositories, lang) {
lang = lang.lang;
var directFn;
var sites = [];
var currentSite;
var combobox;
var site = {};
var definitions = {};
var manuallyAborted = false;

function setSiteValues(obj) {
	for (var i in obj) {
		if (obj.hasOwnProperty(i)) {
			var field = $('[name='+i+']');
			field.val(obj[i]);
		}
	}
}

window.shiftedit = {};
window.shiftedit.setSiteValues = setSiteValues;

function enableMenuItems(site) {
	var items = ['editsite', 'duplicate', 'deletesite', 'export', 'shareSite'];

	if(site.db_phpmyadmin)
		items.push('phpmyadmin');

	items.forEach(function(item){
		$('#'+item).removeClass('ui-state-disabled');
	});
	
	$(window).trigger('siteEnable');
}

function disableMenuItems() {
	var items = ['editsite', 'duplicate', 'deletesite', 'export', 'shareSite', 'phpmyadmin'];

	items.forEach(function(item){
		$('#'+item).addClass('ui-state-disabled');
	});
	
	$(window).trigger('siteDisable');
}

function init() {
	var prefs = preferences.get_prefs();
	
	if (prefs.restoreTabs) {
		currentSite = storage.get('currentSite');
	}
	
	$('body').on('click','.newTab .site', function(){
		create();
	});
	
	function initCombo() {
		combobox = $( "#sites" ).combobox({
			forceSelection: true,
			selectOnFocus: true,
			selectFirst: true,
			select: function (event, ui) {
				open(ui.item.value);
			},
			change: function (event, ui) {
				open(ui.item.value);
			}
		});
	}
	initCombo();

	$( "#refresh_site" ).button()
	.click(function() {
		if (currentSite) {
			open(currentSite);
		}
	});

	//button menu
	var items = [{
		id: 'newsite',
		text: 'Add site...',
		handler: create,
		disabled: false
	}, {
		id: 'editsite',
		text: 'Edit site...',
		handler: edit,
		disabled: true
	}, {
		id: 'duplicate',
		text: 'Duplicate...',
		handler: duplicate,
		disabled: true
	}, {
		id: 'deletesite',
		text: 'Delete site',
		handler: function(undef, e, confirmed) {
			if(!confirmed) {
				var me = this;
				prompt.confirm({
					title: 'Delete site',
					msg: 'Are you sure?',
					fn: function(value) {
						switch(value) {
							case 'yes':
								$(me).trigger('click', [true]);
								return;
							default:
								return false;
						}
					}
				});
				return;
			}

			loading.fetch(config.apiBaseUrl+'sites?cmd=delete&site='+currentSite, {
				action: 'Deleting site '+site.name,
				success: function(data) {
					//remove this site from any active tabs
					$("li[data-site='"+currentSite+"']").attr('data-site', '');

					//disable file tree
					$('#tree-container').hide();

					//disable site options
					disableMenuItems();

					currentSite = 0;
					storage.set('currentSite', currentSite);

					//refresh combo
					$( "#sites" ).combobox('val', '');
					load();
				}
			});
		},
		disabled: true
	}, '-', /*{
		id: 'export',
		text: 'Export',
		handler: function() {
			loading.fetch(config.apiBaseUrl+'sites?cmd=export&site='+currentSite, {
				action: 'Exporting site',
				success: function(data) {
					var link = $('<a href="data:text/xml;base64,'+btoa(data.content)+'" download="'+data.file+'"></a>').appendTo('body');
					link.get(0).click();
					link.remove();
				}
			});
		},
		disabled: true
	}, */{
		id: 'shareSite',
		text: 'Share site...',
		handler: function() {
			//share site dialog
			$( "body" ).append('<div id="dialog-share-site" title="Share site">\
				<form id="shareSiteForm">\
					<div class="hbox">\
						<input id="share_email" type="text" name="email" placeholder="Email address" class="flex text ui-widget-content ui-corner-all" required autofocus>\
						<button type="submit">Add</button>\
					</div>\
					<h2>Shared with</h2>\
					<div id="users">\
						nobody\
					</div>\
					<h2>Contacts</h2>\
					<div id="contacts">\
						no contacts\
					</div>\
				</form>\
			</div>');

			$('#shareSiteForm button').button();

			loadUsers();

			//handle add user
			$('#shareSiteForm').submit(function(event){
				event.preventDefault();

				loading.fetch(config.apiBaseUrl+'share?cmd=save&site=' + currentSite + '&email=' + $('#shareSiteForm input[name=email]').val(), {
					action: 'saving user',
					success: function(data) {
						$('#shareSiteForm input[name=email]').val('');
						loadUsers();
					}
				});
			});

			//handle add user
			$('#shareSiteForm').on('click', 'a.add', function() {
				loading.fetch(config.apiBaseUrl+'share?cmd=save&site=' + currentSite + '&email=' + $(this).data('email'), {
					action: 'saving user',
					success: function(data) {
						$('#shareSiteForm input[name=email]').val('');
						loadUsers();
					}
				});
			});

			//handle remove user
			$('#shareSiteForm').on('click', 'a.delete', function() {
				loading.fetch(config.apiBaseUrl+'share?cmd=delete&site='+currentSite+'&contact='+$(this).data('id'), {
					action: 'deleting user',
					success: function(data) {
						loadUsers();
					}
				});
			});

			//open dialog
			var dialog = $( "#dialog-share-site" ).dialogResize({
				width: 400,
				height: 300,
				modal: true,
				close: function( event, ui ) {
					$( this ).remove();
				}
			});
		},
		disabled: true
	}, /*{
		id: 'downloadRevisions',
		text: 'Download revisions',
		handler: function() {
			window.open('_ajax/download_revisions.php?site='+currentSite);
		},
		disabled: true
	},*/
	'-', {
		id: 'phpmyadmin',
		text: 'PhpMyAdmin',
		handler: function() {
			var prefs = preferences.get_prefs();
			var settings = getSettings(currentSite);
			var password = settings.db_password;

			if (prefs.useMasterPassword && password) {
				password = Aes.Ctr.decrypt(password, storage.get('masterPassword'), 256);
			}

			// create hidden form
			var form = $('<form id="pma_form" method="post" target="_blank" action="'+settings.db_phpmyadmin+'">\
			<input type="hidden" name="pma_username" value="'+settings.db_username+'">\
			<input type="hidden" name="pma_password" value="'+password+'">\
			</form>').appendTo('body')
			.on('submit', function(){
				var el = this;
				setTimeout(function() {
					el.remove();
				}, 10);
			})
			.submit();
		},
		disabled: true
	}, '-', {
		id: 'servers',
		text: 'Servers...'
	}];

	var el = $("#siteMenu");
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

	var menu = $("#siteMenu").menu().hide();

	$("#siteNenuBtn").button()
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
}

function open(siteId, options) {
	if(!options) {
		options = {};
	}

	//hide tree
	$('#tree-container').hide();

	if(!siteId || siteId == '0') {
		currentSite = null;
		storage.set('currentSite', currentSite);
		disableMenuItems();
		return;
	}

	site = getSettings(siteId);
	currentSite = siteId;
	storage.set('currentSite', currentSite);
	enableMenuItems(site);
	$( "#sites" ).combobox('val', currentSite+'');

	var ajax;
	if (!loading.start('Connecting to site '+site.name, function(){
		console.log('abort opening site');
		manuallyAborted = true;
		ajax.abort();
		opening = {};
	})) {
		console.log('in queue');
		return;
	}

	var refresh_icon = $( "#refresh_site" ).children('i').addClass('fa-spin');
	function openCallback() {
		refresh_icon.removeClass('fa-spin');
		
		$('#tree-container').show();
		
		// drop opacity for tabs from other sites
		$('#siteStyle').remove();
		$('<style id="siteStyle">li[data-site]:not([data-site="' + siteId + '"]){opacity: 0.5;}</style>').appendTo('head');
		
		if(options.callback) {
			options.callback();
		}
	}

	if(site.turbo == 1){
		var ajaxOptions = getAjaxOptions();
		console.log("connecting to: "+ajaxOptions.url);
		tree.setAjaxOptions(ajaxOptions);
		loading.stop();
		openCallback();
		return;
	//} else if(settings.server_type == 'GDriveJS'){
	} else if(['GDrive','GDriveLimited'].indexOf(site.server_type)!=-1) {
		gdrive.setFullAccess(site.server_type === 'GDrive');
		$('#tree').data('dir', site.dir);
		$('#tree').data('dir_id', site.dir_id);

		gdrive.authorise(function() {
			loading.stop();
			$('#tree-container').show();
			tree.setAjaxOptions(gdrive.directFn);
			directFn = gdrive.directFn;
			openCallback();
		});
		return;
	}

	directFn = null;
	ajax = $.ajax({
		url: config.apiBaseUrl+'sites?site='+siteId,
		method: 'POST',
		dataType: 'json',
		data: {
			password: options.password,
			masterPassword: options.masterPassword,
			save_password: 1
		}
	});
	
	ajax.then(function (data) {
		refresh_icon.removeClass('fa-spin');
		loading.stop();
		//console.log(data);

		if(data.success){
			console.log('connected');
			
			definitions[siteId] = data.definitions;

			//load file tree
			var ajaxOptions = getAjaxOptions(config.apiBaseUrl+'files?site='+siteId);
			tree.setAjaxOptions(ajaxOptions);
			openCallback();
		}else{
			if (data.require_password) {
				password = site.ftp_pass;

				var prefs = preferences.get_prefs();
				if (prefs.useMasterPassword) {
					if (password) {
						password = (Aes.Ctr.decrypt(password, storage.get('masterPassword'), 256));
					}
				}

				prompt.prompt({
					title: 'Require server password for '+site.name,
					msg: lang.passwordText,
					value: password,
					password: true,
					fn: function(btn, password) {
						switch(btn) {
							case 'ok':
								options.password = password;

								var prefs = preferences.get_prefs();
								if (prefs.useMasterPassword) {
									if (password) {
										options.password = Aes.Ctr.encrypt(password, storage.get('masterPassword'), 256);
									}
								}

								open(siteId, options);
							break;
						}
					}
				});
			}else if (data.require_master_password) {
				masterPasswordPrompt(function() {
					options.masterPassword = storage.get('masterPassword');
					open(siteId, options);
				});
			}else{
				prompt.alert({title:'Error', msg:data.error});
			}
		}
	}).fail(function() {
		refresh_icon.removeClass('fa-spin');
		loading.stop();
		if (!manuallyAborted) {
			prompt.alert({title:lang.failedText, msg:'Error opening site'});
		} else {
			manuallyAborted = false;
		}
	});

	return ajax;
}

function focus() {
	//expand panel
	layout.get().open('west');

	//activate tab
	$(".ui-layout-west").tabs("option", "active", $('li[aria-controls=tabs-filetree]').index());
	$('#sitebar input').focus();
	return;
}

function masterPasswordPrompt(callback) {
	prompt.prompt({
		title: lang.requireMasterPasswordText,
		msg: lang.passwordText,
		password: true,
		fn: function(btn, password) {
			switch(btn) {
				case 'ok':
					storage.set('masterPassword', preferences.createHash(password));
					callback();
				break;
			}
		}
	});
}

function loadUsers() {
	loading.fetch(config.apiBaseUrl+'share?cmd=list&site='+currentSite, {
		action: 'getting users',
		success: function(data) {
			// shared
			var html = '';
			data.shared.forEach(function(item){
				html += '<p>' + item.name + ' <a href="#" data-id="'+item.id+'" class="delete">X</a></p>';
			});

			if (html) {
				$('#users').html(html);
			} else {
				$('#users').html('nobody');
			}
			
			// contacts
			html = '';
			data.contacts.forEach(function(item){
				html += '<p>' + item.name + ' <a href="#" data-email="'+item.email+'" class="add">Add</a></p>';
			});

			if (html) {
				$('#contacts').html(html);
			} else {
				$('#contacts').html('no contacts');
			}
			
			$('#shareSiteForm input[name=email]').focus();
			
			// toggle shared site
			sites.forEach(function(entry) {
				if(entry.id == currentSite) {
					var shared = data.shared.length ? true : false;
					
					if (entry.shared != shared) {
						entry.shared = shared;
						
						// toggle shared icon
						var icon = '';
						if (entry.shared) {
							icon = 'fa fa-share-alt';
						}
						
						$( "#sites option[value='"+currentSite+"']" ).attr( 'data-icon', icon ).data( 'icon', icon );
						
						// toggle firepad from open files
						var action = shared ? 'share' : 'unshare';
						$("li[data-site='"+currentSite+"']").trigger(action);
					}
					
					return;
				}
			});
		}
	});
}

function load(options) {
	return $.getJSON(config.apiBaseUrl+'sites')
		.then(function (data) {
			sites = data.sites;
			$( "#sites" ).children('option').remove();

			if (!sites || !sites.length) {
				currentSite = 0;
				create();
				return;
			}
			
			// empty option
			$( "#sites" ).append( '<option value="0"></option>' );

			$.each(sites, function( index, site ) {
				var icon = '';
				if (site.shared) {
					//shared = '<i class="fa fa-share-alt" style="position: absolute; right: 0; top: 25%;"></i>';
					icon = 'fa fa-share-alt';
				}

				$( "#sites" ).append( '<option data-icon="'+icon+'" value="'+site.id+'">' + site.name + '</option>' );
			});

			if(currentSite) {
				return open(currentSite, options);
			} else {
				if (options && options.callback)
					options.callback();
			}
			return sites;
		});
}

function create() {
	edit(true);
}

function duplicate() {
	edit(false, true);
}

function updateCategory() {
	var category = $('input[name=server_type]').val();

	fields = [
		'server_container',
		'stack_container',
		'database',
		'git_container',
		'cloud_container',
		'host_container',
		'proxyfield',
		'domainContainer',
		'portContainer',
		'timeoutContainer',
		'authentication_container',
		'ftp_user_container',
		'pass_container',
		'ssh_key_container',
		'dir_container',
		'web_url',
		'turbo_mode_container',
		's3_public',
		'compression',
		'max_age',
		's3info',
		'gdrivelimited'
	];

	categories = {
		'FTP': [
			'host_container',
			'portContainer',
			'timeoutContainer',
			'ftp_user_container',
			'pass_container',
			'dir_container',
			'web_url',
			'turbo_mode_container'
		],
		'SFTP': [
			'host_container',
			'portContainer',
			'timeoutContainer',
			'authentication_container',
			'ftp_user_container',
			'pass_container',
			'dir_container',
			'web_url',
			'turbo_mode_container'
		],
		'Cloud': [
			'cloud_container',
		],
		'AmazonS3': [
			'cloud_container',
			's3_public',
			'compression',
			'max_age',
			's3info',
			'ftp_user_container',
			'pass_container',
			'dir_container',
			'web_url'
		],
		'Dropbox': [
			'cloud_container',
			'dir_container',
			'web_url'
		],
		'GDrive': [
			'cloud_container',
			'gdrivelimited',
			'dir_container',
			'web_url'
		],
		'GDriveLimited': [
			'cloud_container',
			'gdrivelimited',
			'dir_container',
			'web_url'
		],
		'WebDAV': [
			'host_container',
			'ftp_user_container',
			'pass_container',
			'dir_container',
			'web_url'
		]
	};
	
	fields.forEach(function(field){
		$('#'+field).hide();
	});

	if (categories[category]) {
		categories[category].forEach(function(field){
			$('#'+field).show();
		});

		if( ['GDrive', 'GDriveLimited', 'Dropbox', 'AmazonS3'].indexOf(category) !== -1 ){
			$('[name=serverTypeItem][value=Cloud]:first').prop("checked", true);
		} else {
			$('[name=serverTypeItem][value=' + category + ']:first').prop("checked", true);
		}

		$( "#serverTypeRadio input[type='radio']" ).checkboxradio('refresh');
	}

	//domain placeholder
	var domain_placeholder = '';
	var domain_title = '';
	if( category==='FTP' ){
		domain_placeholder = 'mydomain.com';
		domain_title = 'The address of the server, e.g:\n- ftp.mydomain.com\n- ftps://ftp.mydomain.com';
	} else if( category==='SFTP' ){
		domain_placeholder = 'mydomain.com';
	} else if( category==='WebDAV' ){
		domain_placeholder = 'www.mydomain.com';
	}

	$('#domain').attr('placeholder', domain_placeholder);
	$('#domain').attr('title', domain_title);

	//username placeholder
	var username_placeholder = 'your username';
	if( category === 'AmazonS3' ){
		username_placeholder = 'access key id';
	}

	$('#ftp_user').attr('placeholder', username_placeholder);

	//password placeholder
	var password_placeholder = '';
	if( category==='AmazonS3' ){
		password_placeholder = 'secret access key';
	}

	$('#ftp_pass').attr('placeholder', password_placeholder);

	if (category === 'SFTP' && $('input[name=logon_type]:checked').val()==='key') {
		$('#logon_key').click();
	}
}

function findPath() {
	var prefs = preferences.get_prefs();
	var ajaxOptions = {
		url: config.apiBaseUrl+'files?site='
	};
	var params = $.extend({}, ajaxOptions.params, util.serializeObject($('#siteSettings')));

	if (prefs.useMasterPassword) {
		if (params.ftp_pass) {
			params.ftp_pass = Aes.Ctr.encrypt(params.ftp_pass, storage.get('masterPassword'), 256);
		}
		if (params.db_password) {
			params.db_password = Aes.Ctr.encrypt(params.db_password, storage.get('masterPassword'), 256);
		}
	}
	
	var ajax;
	if (!loading.start('Looking up path', function(){
		console.log('abort looking up path');
		manuallyAborted = true;
		ajax.abort();
	})) {
		console.log('in queue');
		return;
	}
	
	$.ajax(ajaxOptions.url+'&cmd=get', {
		method: 'POST',
		dataType: 'json',
		data: params,
		xhrFields: {
			withCredentials: true
		},
		success: function(data) {
			loading.stop();
			
			if(!data.success) {
				prompt.alert({title: 'Error', msg: 'Login incorrect'});
			} else {
				if (!$("#siteSettings input[name='dir']").val()) {
					data.files.forEach(function(item) {
						if(item.text.match(/^public|public_html|httpdocs$/)) {
							$("#siteSettings input[name='dir']").val(item.text);
							return false;
						}
					});
				}
			}
		}
	});
}

function chooseFolder() {
	var prefs = preferences.get_prefs();
	var ajaxOptions = {
		url: config.apiBaseUrl+'files?site='
	};
	var params = $.extend({}, ajaxOptions.params, util.serializeObject($('#siteSettings')));

	if (prefs.useMasterPassword) {
		if (params.ftp_pass) {
			params.ftp_pass = Aes.Ctr.encrypt(params.ftp_pass, storage.get('masterPassword'), 256);
		}
		if (params.db_password) {
			params.db_password = Aes.Ctr.encrypt(params.db_password, storage.get('masterPassword'), 256);
		}
	}

	delete params.dir;
	delete params.dir_id;

	$( "body" ).append('<div id="dialog-choose-folder" title="Choose folder">\
<div id="folderTree"></div>\
</div>');

	var folderTree = $('#folderTree').jstree({
		'core' : {
			'data' : function (node, callback) {
				if( ['GDrive', 'GDriveLimited'].indexOf(params.server_type) !== -1 ){
					gdrive.directFn({node: node, callback: callback, tree: $('#folderTree')});
				}else{
					if(!ajaxOptions.url){
						return false;
					}

					if(node.id==='#') {
						return callback.call($('#folderTree'), {
							children: true,
							id: '#root',
							text: ajaxOptions.dir,
							type: 'folder'
						});
					}

					//backcompat old turbo mode
					params.path = '';
					if(node.id!=='#root')
						params.path = encodeURIComponent(node.id);

					$.ajax(ajaxOptions.url+'&cmd=get&path='+params.path, {
						method: 'POST',
						dataType: 'json',
						data: params,
						xhrFields: {
							withCredentials: true
						},
						success: function(data) {
							if(!data.success) {
								prompt.alert({title: 'Error', msg: 'Login incorrect'});
								return;
							}
							if(data.error) {
								prompt.alert({title:'Error', msg:data.error});
								return;
							}

							//backcompat old turbo mode
							if(!data)
								return;

							if(!data.files) {
								var files = [];
								data.forEach(function(item){
									files.push({
										children: (!item.leaf),
										data: {
											perms: item.perms,
											modified: item.modified,
											size: item.size
										},
										icon: (item.leaf ? 'file' : 'folder'),
										id: item.id,
										text: item.text,
										type: (item.leaf ? 'file' : 'folder')
									});
								});
								data.files = files;
							}

							callback.call(tree, data.files);
						}
					});
				}
			},
			'themes': {
				'responsive': false,
				'variant': 'small',
				'stripes': true
			}
		},
		'types' : {
			'default' : { 'icon' : 'folder' },
			'file' : { 'valid_children' : [], 'icon' : 'file' }
		},
		'sort' : function(a, b) {
			return this.get_type(a) === this.get_type(b) ? (this.get_text(a).toLowerCase() > this.get_text(b).toLowerCase() ? 1 : -1) : (this.get_type(a) >= this.get_type(b) ? 1 : -1);
		},
		'plugins' : [
			'sort','types'
		]
	}).on('loaded.jstree', function(e, data) {
		//expand root node
		var inst = $.jstree.reference($('#folderTree'));
		var rootNode = $('#folderTree').jstree(true).get_node('#').children[0];
		inst.open_node(rootNode);
	});

	$( "#dialog-choose-folder" ).dialogResize({
		width: 300,
		height: 360,
		modal: true,
		buttons: {
			OK: function() {
				var reference = folderTree;
				var instance = $.jstree.reference(folderTree);
				var selected = instance.get_selected();
				var node = instance.get_node(selected);

				if(node){
					var parent;
					if (node.children===false) {
						parent = node.parent;
					} else {
						parent = node;
					}

					var dir = node.id;
					if(dir.substr(0,1)==='#') {
						dir = node.text;
					}

					var dir_id = dir;

					//set web url for gdrive (https://googledrive.com/host/0B716ywBKT84AMXBENXlnYmJISlE/GoogleDriveHosting.html)
					if( params.server_type == 'GDrive' || params.server_type == 'GDriveLimited' ){
						$('input[name=web_url]').val('https://googledrive.com/host/'+node.id+'/');
						dir = node.text;
					}

					setSiteValues({
						dir: dir,
						dir_id: dir_id
					});
				}

				$( this ).dialogResize( "close" );
			},
			Cancel: function() {
				$( this ).dialogResize( "close" );
			}
		},
		close: function( event, ui ) {
			$( this ).remove();
		}
	});

	if(params.server_type == 'GDrive' || params.server_type == 'GDriveLimited'){
		gdrive.fullAccess = (params.server_type === 'GDrive');
		gdrive.authorise(function(){
			folderTree.jstree(true).refresh();
		});
	}
}

function connect() {
	var server_type = $('#siteSettings [name=server_type]').val();

	if( ['Dropbox', 'GDrive', 'GDriveLimited'].indexOf(server_type) !== -1 ){
		if(server_type==='Dropbox'){
			return window.open('/popups/dropbox');
		}else{
			return window.open('/popups/google_drive?server_type='+server_type);
		}
	}

	var params = util.serializeObject($('#siteSettings'));
	var ajaxOptions = getAjaxOptions(config.apiBaseUrl+'sites?site=', params);
	params = $.extend({}, ajaxOptions.params, params);
	var prefs = preferences.get_prefs();

	if (prefs.useMasterPassword) {
		if (!storage.get('masterPassword')) {
			return masterPasswordPrompt(test);
		}

		params.masterPassword = storage.get('masterPassword');

		if (params.ftp_pass) {
			params.ftp_pass = Aes.Ctr.encrypt(params.ftp_pass, storage.get('masterPassword'), 256);
		}
		if (params.db_password) {
			params.db_password = Aes.Ctr.encrypt(params.db_password, storage.get('masterPassword'), 256);
		}
	}

	var ajax;
	if (!loading.start('Testing site ' + params.name, function(){
		console.log('abort testing site');
		ajax.abort();
	})) {
		return;
	}

	ajax = $.ajax({
		url: ajaxOptions.url+'&cmd=test',
		method: 'POST',
		dataType: 'json',
		data: params,
		xhrFields: {
			withCredentials: true
		}
	});
	
	ajax.then(function (data) {
		loading.stop();

		if(data.success) {
			if(data.private){
				prompt.prompt({
					title: 'Folder permissions',
					msg: 'Make folder public readable?',
					fn: function (btn) {
						if (btn == "yes") {
							$('#siteSettings [name=share]').val('1');
							connect();
						}
					}
				});
			}else{
				//remember preview node for tidy up
				if( data.preview_node ){
					params.preview_node = data.preview_node;
				}

				//check web url - disabled
				if( false && params.web_url ){
					if (!loading.start('Testing site '+site.name, function(){
						clearTimeout(errorTimeout);
						$('#test_iframe').remove();
					})) {
						return;
					}

					//appending slash
					if( params.web_url.substr(-1)!=='/' ){
						params.web_url += '/';
					}

					//create iframe
					$('body').append('<iframe id="test_iframe" src="http'+(params.encryption ? 's' : '')+'://' + params.web_url + '_shiftedit_test_preview.html?shiftedit=' + new Date().getTime() + '"></iframe>');

					//give up after 10 seconds
					errorTimeout = setTimeout(function(){
						loading.stop();

						$('#test_iframe').remove();

						var hints = '';

						if( params.web_url.substr(0, 7) == 'http://' ){
							hints+= '<li>* Enable SSL or click Shield icon in address bar, then "Load unsafe scripts</li>';
						}

						hints += '<li>* Ensure Dir points to web root e.g. /httpdocs/</li>';

						prompt.alert({title: 'Error', msg: "Couldn't access web url:<ul>"+hints+'</ul>'});
					}, 5000);

					//listen for postmessage
					$(window).one('message', function(event) {
						loading.stop();

						clearTimeout(errorTimeout);
						$('#test_iframe').remove();

						if( event.originalEvent.data == 'preview' ){
							prompt.alert({title: 'Success', msg: lang.connectionEstablishedText});
						}
					});
				}else{
					prompt.alert({title: 'Success', msg: lang.connectionEstablishedText});
				}
			}
		} else {
			if (data.require_master_password) {
				return masterPasswordPrompt(test);
			} else {
				prompt.alert({title:'Error', msg:data.error});
			}
		}
	}).fail(function() {
		loading.stop();
		prompt.alert({title:lang.failedText, msg:'Error testing site'});
	});
}

function save() {
	var params = util.serializeObject($('#siteSettings'));

	var siteId = $('#siteSettings [name=id]').val();
	var ajax;
	var duration = '';
	var wait = false;
	if (['Server'].indexOf(params.server_type) !== -1 && !siteId) {
		duration = ' (this may take a few minutes)';
		wait = true;
	}
	
	if (!loading.start('Saving site ' + params.name + duration, function(){
		console.log('abort saving site');
		ajax.abort();
	})) {
		return;
	}

	var prefs = preferences.get_prefs();
	if (prefs.useMasterPassword) {
		if (!storage.get('masterPassword')) {
			loading.stop();
			return masterPasswordPrompt(save);
		}

		params.masterPassword = storage.get('masterPassword');

		if (params.ftp_pass) {
			params.ftp_pass = Aes.Ctr.encrypt(params.ftp_pass, storage.get('masterPassword'), 256);
		}
		if (params.db_password) {
			params.db_password = Aes.Ctr.encrypt(params.db_password, storage.get('masterPassword'), 256);
		}
	}

	ajax = $.ajax({
		url: config.apiBaseUrl+'sites?cmd=save&site='+siteId,
		method: 'POST',
		dataType: 'json',
		data: params
	});
	
	ajax.then(function (data) {
		loading.stop();

		if(data.success){
			/*
			//set gdrive folder to public
			if(
				(
					server_type === 'GDrive' ||
					server_type === 'GDriveLimited'
				) &&
				dir_id
			){
				console.log('set permissions');
				gdrive.set_public(dir_id, true);
			}
			*/
			
			var siteId = data.site;
			if (!siteId) {
				console.log('no site id');
				return false;
			}
			
			$('#siteSettings [name=id]').val(siteId);
			
			var finish = function() {
				currentSite = siteId;
				if (wait) {
					load({callback: edit});
				} else {
					load();
				}
	
				$( "#dialog-site" ).dialogResize( "close" );
				$( "#dialog-site" ).remove();
			};
			
			var status = '';
			var ajax;
			var check_status = function() {
				ajax = $.ajax({
					url: config.apiBaseUrl+'sites?cmd=get_status&site='+siteId,
					method: 'GET',
					dataType: 'json',
					data: {
						status: status
					}
				});
				
				ajax.then(function (data) {
					loading.stop();
					
					if(data.success) {
						status = data.status;
						
						if (status==='ready') {
							finish();
						} else {
							check_status();
						}
					} else {
						prompt.alert({title:'Error', msg:data.error});
						return;
					}
				});
				
				loading.start(status, function(){
					console.log('abort site status');
					ajax.abort();
				}, true);
			};
			
			if (wait) {
				var source = new EventSource(config.apiBaseUrl+'sites?cmd=create&site='+siteId, {withCredentials: true});
				var abortFunction = function(){
					if( source ){
						source.close();
					}
				};
			
				var stopLoading = true;
				source.addEventListener('message', function(event) {
					var result = JSON.parse(event.data);
					var msg = result.msg;

					loading.stop(false);
					
					if (msg.substr(0, 6)==='Error:') {
						prompt.alert({title:'Error', msg: msg});
					} else if (msg==='waiting for server') {
						stopLoading = false;
						check_status();
					} else if (msg==='ready') {
						stopLoading = false;
						finish();
					} else {
						loading.start(msg, abortFunction, true);
					}
				}, false);
			
				source.addEventListener('error', function(event) {
					if (stopLoading) {
						loading.stop(false);
					}
					if (event.eventPhase == 2) { //EventSource.CLOSED
						abortFunction();
					}
				}, false);
			} else {
				finish();
			}
		}else{
			var error = 'unknown';
			if (data.error) {
				error = data.error.replace(/\n/g, "<br>");
			}
			prompt.alert({title:'Error', msg: error});
		}
	}).fail(function() {
		loading.stop();
		prompt.alert({title:lang.failedText, msg:'Error saving site'});
	});
}

function edit(newSite, duplicate) {
	/*
	if (newSite && storage.get('premier') == 'false' && storage.get('edition') == 'Standard' && sites.length >= (1+1)) {
		return prompt.alert({title: 'Quota exceeded', msg:'Free edition is limited to 1 site. <a href="/premier" target="_blank">Go Premier</a>'});
	} else if (newSite && storage.get('premier') == 'false' && storage.get('edition') == 'Education' && sites.length >= (5+1)) {
		return prompt.alert({title: 'Quota exceeded', msg:'Education edition is limited to 5 sites. <a href="/premier" target="_blank">Go Premier</a>'});
	}
	*/

	var prefs = preferences.get_prefs();
	var title = newSite ? 'Add site' : 'Edit site';

	//create dialog BEWARE UGLY LONG STRING!
	$( "body" ).append('<div id="dialog-site" title="'+title+'">\
		<form id="siteSettings" autocomplete="off">\
			<input type="hidden" name="server_type" value="">\
			<input type="hidden" name="id" value="">\
			<input type="hidden" name="share" value="">\
			<p id="addTypeContainer">\
				<span id="addTypeRadio">\
					<input type="radio" name="addType" value="new" id="addTypeRadio1">\
					<label for="addTypeRadio1">\
						<i class="fa fa-plus-square" style="font-size: 50px;"></i><br>\
						Create new\
					</label>\
					<input type="radio" name="addType" value="add" id="addTypeRadio2">\
					<label for="addTypeRadio2">\
						<i class="fa fa-plug" style="font-size: 50px;"></i><br>\
						Add existing\
					</label>\
					<input type="radio" name="addType" value="import" id="addTypeRadio3">\
					<label for="addTypeRadio3">\
						<i class="fa fa-upload" style="font-size: 50px;"></i><br>\
						Import site\
					</label>\
				</span>\
			</p>\
			<div id="nameContainer" style="display:none;">\
				<p>\
					<label>Name:</label>\
					<input type="text" name="name" value="" placeholder="my awesome website" class="text ui-widget-content ui-corner-all" required>\
				</p>\
			</div>\
			<div id="newContainer" style="display:none;">\
				<p>\
					<label for="server">Server:</label>\
					<input type="text" id="server" name="server">\
					<button type="button" id="add_server"><i class="fas fa-plus"></i></button>\
				</p>\
				<div>\
					<p>\
						<label>Stack:</label>\
						<span id="stackRadio">\
							<input type="radio" name="stack" value="php" id="stackRadio1" checked>\
							<label for="stackRadio1"" title="PHP">\
								<i class="fab fa-php" style="font-size: 30px;"></i><br>\
							</label>\
							<input type="radio" name="stack" value="wordpress" id="stackRadio2">\
							<label for="stackRadio2"" title="Wordpress">\
								<i class="fab fa-wordpress" style="font-size: 30px;"></i><br>\
							</label>\
							<input type="radio" name="stack" value="git" id="stackRadio3">\
							<label for="stackRadio3" title="Git Repository">\
								<i class="fab fa-git" style="font-size: 30px;"></i><br>\
							</label>\
						</span>\
					</p>\
				</div>\
				<p id="gitURLContainer" style="display:none;">\
					<label>Git URL:</label>\
					<input type="hidden" id="git_url" name="git_url">\
					<button type="button" id="repo_sources"><i class="fas fa-plus"></i></button>\
				</p>\
				<p style="display: none;">\
					<label>Create Database:</label>\
					<input type="checkbox" name="database" value="1" checked class="text ui-widget-content ui-corner-all" >\
				</p>\
				<div id="domainsContainer" style="display: none;">\
					<div style="display: flex;">\
						<label>Domains:</label>\
						<div class="flex">\
							<table id="domains" width="100%"></table>\
							<button type="button" id="addDomain">Add domain</button>\
						</div>\
					</div>\
				</div>\
			</div>\
			<div id="addContainer" style="display:none;">\
				<div>\
					<p>\
						<label>Server type:</label>\
						<span id="serverTypeRadio">\
							<input type="radio" name="serverTypeItem" value="FTP" id="radio1"><label for="radio1">FTP</label>\
							<input type="radio" name="serverTypeItem" value="SFTP" id="radio2"><label for="radio2">SFTP</label>\
							<input type="radio" name="serverTypeItem" value="Cloud" id="radio3"><label for="radio3">Cloud Services</label>\
							<input type="radio" name="serverTypeItem" value="WebDAV" id="radio4"><label for="radio4">WebDAV</label>\
						</span>\
					</p>\
					<div id="cloud_container">\
						<p>\
							<label>Cloud services:</label>\
							<span id="cloudRadio">\
								<input type="radio" name="cloud" value="Dropbox" id="cloudRadio1">\
								<label for="cloudRadio1">\
									<img src="https://shiftedit.s3.amazonaws.com/images/logos/dropbox.svg" height="32" width="32"><br>\
									Dropbox\
								</label>\
								<input type="radio" name="cloud" value="GDrive" id="cloudRadio2">\
								<label for="cloudRadio2">\
									<img src="https://shiftedit.s3.amazonaws.com/images/logos/googledrive.svg" height="32" width="32"><br>\
									Google Drive\
								</label>\
								<input type="radio" name="cloud" value="AmazonS3" id="cloudRadio3">\
								<label for="cloudRadio3">\
									<img src="https://shiftedit.s3.amazonaws.com/images/logos/amazons3.svg" height="32" width="32"><br>\
									Amazon S3\
								</label>\
							</span>\
						</p>\
					</div>\
					\
					<label id="proxyfield">Use a PHP proxy file to handle connections. You will need to configure and upload the \
					<a href="https://raw.githubusercontent.com/adamjimenez/shiftedit-ajax/master/shiftedit-proxy.php" target="_blank">proxy file</a>\
					to your webspace.</label>\
					\
					<div id="host_container">\
						<p>\
							<label>Host:</label>\
							<input type="text" id="domain" name="domain" value="" class="text ui-widget-content ui-corner-all">\
							<span id="portContainer">\
								<label>&nbsp;:</label>\
								<input type="number" name="port" value="" placeholder="Port" min="1" class="text ui-widget-content ui-corner-all">\
							</span>\
						</p>\
					</div>\
					<p id="authentication_container">\
						<label>Authentication:</label>\
						<span id="authenticationRadio">\
							<input type="radio" name="logon_type" value="" id="logon_password" checked><label for="logon_password">Password</label>\
							<input type="radio" name="logon_type" value="key" id="logon_key"><label for="logon_key">Public Key</label>\
						</span>\
					</p>\
					<p id="ftp_user_container">\
						<label>Username:</label>\
						<input type="text" id="ftp_user" name="ftp_user" value="" class="text ui-widget-content ui-corner-all">\
					</p>\
					<p id="pass_container">\
						<label>Password:</label>\
						<input type="password" id="ftp_pass" name="ftp_pass" value="" class="showPassword text ui-widget-content ui-corner-all" required disabled>\
					</p>\
					<p id="ssh_key_container">\
						<label>Your SSH key:</label>\
						<textarea id="sshKey" rows="4" class="text ui-widget-content ui-corner-all" readonly>'+storage.get('public_key')+'</textarea>\
						<label>Save the SSH key in: ~/.ssh/authorized_keys</label>\
					</p>\
					<div id="dir_container" class="hbox">\
						<label>Path:</label>\
						<input type="hidden" name="dir_id" value="">\
						<div class="custom-show-password-container text ui-widget-content ui-corner-all">\
							<input type="text" name="dir" value="" class="text ui-widget-content ui-corner-all">\
							<button type="button" id="chooseFolder" class="ui-widget-content"><i class="fas fa-folder-open"></i></button>\
						</div>\
					</div>\
					<p id="web_url">\
						<label>Website URL:</label>\
						<select name="encryption" class="ui-widget ui-state-default ui-corner-all">\
							<option value="1">https://</option>\
							<option value="0">http://</option>\
						</select>\
						<input type="text" name="web_url" value="" class="text ui-widget-content ui-corner-all">\
					</p>\
					<p id="turbo_mode_container">\
						<label>Turbo mode:</label>\
						<label>\
						<input type="checkbox" name="turbo" value="1" class="text ui-widget-content ui-corner-all" >\
						Use a proxy file for faster connections.\
						</label>\
					</p>\
					<div class="accordion">\
						<h3>Advanced</h3>\
						<div>\
							<h4>Database</h4>\
							<div>\
								<p>\
									<label>PhpMyAdmin Url:</label>\
									<input type="text" name="db_phpmyadmin" value="" class="text ui-widget-content ui-corner-all">\
								</p>\
								<p>\
									<label>DB Username:</label>\
									<input type="text" name="db_username" value="" class="text ui-widget-content ui-corner-all">\
								</p>\
								<p>\
									<label>DB Password:</label>\
									<input type="password" id="db_password" name="db_password" value="" class="showPassword text ui-widget-content ui-corner-all" disabled>\
								</p>\
							</div>\
							<h4>Misc</h4>\
							<p id="timeoutContainer">\
								<label>Timeout:</label>\
								<input type="number" name="timeout" value="" min="0" max="90" class="text ui-widget-content ui-corner-all">\
							</p>\
							<p>\
								<label>Wordpress completions:</label>\
								<input type="checkbox" name="ac_wordpress" value="1" class="text ui-widget-content ui-corner-all">\
							</p>\
							<p>\
								<label>Bootstrap completions:</label>\
								<input type="checkbox" name="ac_bootstrap" value="1" class="text ui-widget-content ui-corner-all">\
							</p>\
							<p>\
								<label>Custom completions:</label>\
								<input type="text" name="ac_custom" value="" placeholder="https://domain.com/completions.json" class="text ui-widget-content ui-corner-all">\
							</p>\
							<p>\
								<label for="encoding">Encoding</label>\
								<select name="encoding" class="ui-widget ui-state-default ui-corner-all">\
									<option value=""></option>\
								</select>\
							</p>\
							<p>\
								<label>Revisions per file:</label>\
								<input type="number" name="revisions" value="" min="-1" max="50" class="text ui-widget-content ui-corner-all">\
							</p>\
							<p id="gdrivelimited">\
								<label>Limited access:</label>\
								<input type="checkbox" name="gdrivelimited" value="1" class="text ui-widget-content ui-corner-all" >\
								Limit access to only files created in ShiftEdit.\
							</p>\
							<p id="s3_public">\
								<label>Save files with public access:</label>\
								<input type="checkbox" name="s3_public" value="1" class="text ui-widget-content ui-corner-all" >\
							</p>\
							<p id="compression">\
								<label>Use compression:</label>\
								<input type="checkbox" name="compression" value="1" class="text ui-widget-content ui-corner-all" >\
							</p>\
							<p id="max_age">\
								<label>Cache expiration (s):</label>\
								<input type="number" name="max_age" value="0" class="text ui-widget-content ui-corner-all" style="max-width:80px;" >\
							</p>\
						</div>\
					</div>\
				</div>\
			</div>\
			<div id="importContainer" style="display:none;">\
				<p>\
					Import a Dreamweaver site definition or Filezilla xml file.\
				</p>\
				<p>\
					<input type="file" name="file" id="importSite" class="text ui-widget-content ui-corner-all">\
				</p>\
			</div>\
			<input type="submit" tabindex="-1" style="position:absolute; top:-1000px">\
		</form>\
	</div>');
	
	// accordion
	$( ".accordion" ).accordion({
		collapsible: true,
		active: false,
		heightStyle: "content"
	});
	
	//automatically set username, website url
	$("#siteSettings input[name='ftp_pass']").change(function() {
		//check password
		findPath();
	});
	
	//automatically set username, website url
	$("#siteSettings input[name='name']").change(function() {
		var value = this.value;
		
		if(value.indexOf('.')!==-1) {
			if(!$("#siteSettings input[name='domain']").val()) {
				$("#siteSettings input[name='domain']").val(value);
			}
			if(!$("#siteSettings input[name='ftp_user']").val()) {
				$("#siteSettings input[name='ftp_user']").val(value);
			}
			if(!$("#siteSettings input[name='web_url']").val()) {
				$("#siteSettings input[name='web_url']").val(value);
			}
		}
	});

	//defeat chrome autofill
	setTimeout(function(){
		$('#ftp_pass').removeAttr("disabled");
		$('#db_password').removeAttr("disabled");
	}, 500);

	//encoding dropdown
	var charsets = preferences.charsets;
	for(var i in charsets) {
		if (charsets.hasOwnProperty(i)) {
			$('#siteSettings select[name=encoding]').append( '<option value="'+i+'">'+charsets[i]+' ('+i+')</option>' );
		}
	}

	//set values
	var defaults = {
		server_type: 'FTP',
		timeout: 10
	};
	var settings = newSite ? defaults : getSettings();
	
	if(settings.port==="0") {
		delete settings.port;
	}

	if(duplicate===true) {
		settings.name = 'Copy of '+settings.name;
		settings.id = '';
		settings.server = '';
	}
	
	if(newSite || settings.server>0) {
		$('[name=addType][value=new]:first').prop("checked", true);
		
		if(settings.server>0) {
			$('#addTypeContainer').hide();
		}
	} else {
		$('[name=addType][value=add]:first').prop("checked", true);
		$('#addTypeContainer').hide();
	}

	for(i in settings) {
		if (settings.hasOwnProperty(i)) {
			var field = $('[name='+i+']');
			switch(field.attr('type')){
				case 'checkbox':
					if (settings[i]==1)
						field.prop('checked', true);
				break;
				case 'radio':
					field.filter('[value="'+settings[i]+'"]').prop('checked', true);
				break;
				default:
					field.val(settings[i]);
				break;
			}
		}
	}
	
	// checkbox widget
	$( "#addTypeRadio input[type='radio']" ).checkboxradio({
		icon: false
	});
	$( "#stackRadio input[type='radio']" ).checkboxradio({
		icon: false,
		disabled: !newSite
	});
	
	//toggle fields
	$("#addTypeRadio input[type='radio']").change(function() {
		var value = this.value;
		
		$('#newContainer, #addContainer, #importContainer, #nameContainer').hide();
			
		if (value==='new') {
			$('#newContainer, #nameContainer').show();
			$('input[name=server_type]').val('Server');
		} else if (value==='add') {
			$('#addContainer, #nameContainer').show();
			if ( $("#cloud_container input:checked").val()) {
				$('input[name=server_type]').val($("#cloud_container input:checked").val());
			} else {
				$('input[name=server_type]').val($("#serverTypeRadio input:checked").val());
			}
		} else if (value==='import') {
			$('#importContainer').show();
		}
	});
	
	//toggle fields
	$("#stackRadio input[type='radio']").change(function() {
		var value = this.value;
		
		$('#gitURLContainer').hide();
		if (value==='git') {
			$('#gitURLContainer').show();
		}
	});
	
	// set cloud checkbox
	if (settings.server_type) {
		if( ['GDrive', 'GDriveLimited', 'Dropbox', 'AmazonS3'].indexOf(settings.server_type) !== -1 ){
			if( ['GDrive', 'GDriveLimited'].indexOf(settings.server_type) !== -1 ){
				$('[name=cloud][value=GDrive]:first').prop("checked", true);
			} else {
				$('[name=cloud][value=' + settings.server_type + ']:first').prop("checked", true);
			}
		}
	}
	
	$('#logon_password').click(function() {
		$('#pass_container').show();
		$('#ssh_key_container').hide();
		$('#turbo_mode_container').show();
	});

	$('#logon_key').click(function() {
		$('#pass_container').hide();
		$('#ssh_key_container').show();
		$('#turbo_mode_container').hide();
	});

	//select ssh key
	$('#sshKey').click(function(){
		$(this).select();
	});
	
	$('#chooseFolder').click(chooseFolder);
	
	$('#add_server').button().click(function() {
		servers.edit(true);
	});
	
	$('#repo_sources').button().click(function() {
		window.open('https://shiftedit.net/account/services');
	});

	//"Other" split button
	$('#otherMenu').menu().hide();
	$('#otherMenu a').click(function() {
		$('#otherLabel').contents().last().replaceWith($(this).text());
		$('#other').val($(this).text());
		$('#other').trigger('click');
		//$('#otherLabel').trigger('click');
	});
	$('#otherLabel').click(function() {
		var menu = $('#otherMenu').show().position({
			my: "left top",
			at: "left bottom",
			of: this
		});
		$( document ).one( "click", function() {
			menu.hide();
		});
		return false;
	});

	//tabs and buttons
	$( "#serverTypeRadio input[type='radio']" ).checkboxradio({
		icon: false
	});
	$( "#providerRadio input[type='radio']" ).checkboxradio({
		icon: false
	});
	$( "#stackRadio input[type='radio']" ).checkboxradio({
		icon: false
	});
	$( "#cloudRadio input[type='radio']" ).checkboxradio({
		icon: false
	});
	$( "#authenticationRadio input[type='radio']" ).checkboxradio({
		icon: false
	});

	//server combo
	if(settings.server>0) {
		$('#add_server, #repo_sources').hide();
		$('#git_url').attr('type', 'text').attr('disabled', 'disabled');
		$('input[name=database]').prop('checked', (settings.db_username!=='')).attr('disabled', 'disabled');
		
		if (!newSite) {
			$('input[name=name]').attr('readonly', 'readonly');
			$('#domainsContainer').show();
			
			var loadDomains = function() {
				loading.fetch(config.apiBaseUrl+'sites?cmd=domains&site='+settings.id, {
					action: 'getting domains',
					success: function(data) {
						$( "#domains tr" ).remove();
						
						domains = data.domains;
						$.each(domains, function( index, item ) {
							if (item.default) {
								$('input[name=web_url]').val(item.domain);
							}
							
							var defaultStr = item.default ? 'Default' : '<span class="link default" data-domain="'+item.domain+'">Make default</span>';
							var li = $( '<tr><td>' + item.domain + '</td><td>' + defaultStr + '</td><td><span class="link delete" data-domain="'+item.domain+'">Delete</span></td></tr>' ).appendTo( "#domains" );
						});
					}
				});
			};
			loadDomains();
			
			$('#domains').on('click', '.delete', function() {
				var value = $(this).data('domain');
				
				prompt.confirm({
					title: 'Detete domain alias',
					msg: 'Are you sure?',
					fn: function (btn) {
						if (btn == "yes") {
							// check domain
							var ajax = $.ajax({
								url: config.apiBaseUrl+'sites?cmd=delete_domain&site='+settings.id+'&domain='+value,
								method: 'GET',
								dataType: 'json',
							});
							
							if (!loading.start('Deleting domain', function(){
								ajax.abort();
							})) {
								console.log('busy');
								return;
							}
							
							ajax.then(function (data) {
								loading.stop();
								loadDomains();
							});
						}
					}
				});
			});
			
			$('#domains').on('click', '.default', function() {
				var value = $(this).data('domain');
				
				// check domain
				var ajax = $.ajax({
					url: config.apiBaseUrl+'sites?cmd=set_default_domain&site='+settings.id+'&domain='+value,
					method: 'GET',
					dataType: 'json',
				});
				
				if (!loading.start('Setting default domain', function(){
					ajax.abort();
				})) {
					console.log('busy');
					return;
				}
				
				ajax.then(function (data) {
					$("#siteSettings input[name='web_url']").val(value);
					loading.stop();
					loadDomains();
				});
			});
			
			var addDomain = function() {
				//create dialog markup
				$( "body" ).append('<div id="dialog-prompt" title="Add domain">\
			<form>\
				<div class="vbox">\
					<input type="text" name="input" id="input" value="" placeholder="example.org" class="flex text ui-widget-content ui-corner-all" required>\
				</div>\
				<!-- Allow form submission with keyboard without duplicating the dialog button -->\
				<input type="submit" tabindex="-1" style="position:absolute; top:-1000px">\
			</form>\
		</div>');
		
				//select filename before dot
				$('#input').focus(util.selectFilename);
		
				//handle buttons/ submit
				function ok() {
					var value = $('#input').val();
					
					// check domain
					var ajax = $.ajax({
						url: config.apiBaseUrl+'sites?cmd=add_domain&site='+settings.id+'&domain='+value,
						method: 'GET',
						dataType: 'json',
					});
					
					if (!loading.start('Adding domain', function(){
						ajax.abort();
					})) {
						console.log('busy');
						return;
					}
					
					ajax.then(function (data) {
						loading.stop();
						if(data.success){
							$( '#dialog-prompt' ).dialogResize( "close" );
							
							// refresh domain list
							loadDomains();
						} else {
							prompt.alert({title:'Error', msg:data.error});
						}
					});
				}
				$( "#dialog-prompt" ).submit(ok);
		
				//open dialog
				var dialog = $( "#dialog-prompt" ).dialogResize({
					modal: true,
					close: function( event, ui ) {
						$( this ).remove();
					},
					buttons: {
						OK: ok,
						Cancel: function() {
							$( this ).dialogResize( "close" );
						}
					}
				});
		
				//ensure focus
				setTimeout(function(){ $('#input').focus(); }, 100);
		
				//prevent form submit
				form = dialog.find( "form" ).on( "submit", function( event ) {
					event.preventDefault();
					options.fn('yes');
				});
			};
	
			$('#addDomain').button().click(addDomain);
		}
	} else {
		serverCombo = $( "#server" ).combobox({
			editable: false,
			source: function( request, response ) {
				var ajax;
				
				if (!loading.start('Loading', function() {
					ajax.abort();
				})) {
					console.log('busy');
					return;
				}
				
				ajax = $.ajax({
					url: config.apiBaseUrl+'servers',
					dataType: "json",
					data: {
						term: request.term
					},
					success: function( data ) {
						loading.stop();
						response(data.servers);
					}
				});
			},
			select: function (event, ui) {
				$('#server').val(ui.item.value).change();
			},
			change: function (event, ui) {
				$('#server').val(ui.item.value).change();
			}
		});
		
		//git combo
		gitCombo = $( "#git_url" ).combobox({
			source: function( request, response ) {
				var ajax;
				
				if (!loading.start('Loading', function() {
					ajax.abort();
				})) {
					console.log('busy');
					return;
				}
				
				ajax = $.ajax({
					url: config.apiBaseUrl+'repositories',
					dataType: "json",
					data: {
						term: request.term
					},
					success: function( data ) {
						loading.stop();
						response(data.repos);
					}
				});
			},
			select: function (event, ui) {
				$('#git_url').val(ui.item.value);
			},
			change: function (event, ui) {
				$('#git_url').val(ui.item.value);
			}
		});
	}
	
	// password toggle
	$('.showPassword').showPassword();
	
	//toggle fields
	$('#serverTypeRadio input:radio, #cloud_container input:radio, #providerRadio input:radio').change(function() {
		if (this.value==='Cloud' && $("#cloud_container input:checked").val()) {
			$('input[name=server_type]').val($("#cloud_container input:checked").val());
		} else if (this.value==='Server' && $("#providerRadio input:checked").val()) {
			$('input[name=server_type]').val($("#providerRadio input:checked").val());
		} else {
			$('input[name=server_type]').val(this.value);
		}
		
		updateCategory();
			
		if( ['GDrive', 'GDriveLimited', 'Dropbox'].indexOf(this.value) !== -1 ){
			connect();
		}
	});

	//trim values
	$('#siteSettings input[type=text]').blur(function(){
		$(this).val($(this).val().trim());
	});

	updateCategory();
	$("#addTypeRadio input:checked").change();
	
	// validation
	$('#siteSettings input').on('change keyup input', function() {
		var required = {
			'FTP': [
				'name',
				'domain',
				'ftp_user'
			],
			'SFTP': [
				'name',
				'domain',
				'ftp_user'
			],
			'Server': [
				'name',
				'server'
			],
			'Cloud': [
				'cloud',
			],
			'Dropbox': [
				'name'
			],
			'GDrive': [
				'name'
			],
			'AmazonS3': [
				'name',
				'ftp_user',
				'ftp_pass'
			],
			'WebDAV': [
				'name'
			]
		};
		
		var server_type = $('input[name=server_type]').val();
		var valid = true;
		if(required[server_type]) {
			$.each(required[server_type], function( index, value ) {
				var field = $('[name='+value+']');
				switch(field.attr('type')){
					case 'checkbox':
					case 'radio':
						if (field.is(':checked') === false) {
							valid = false;
							return false;
						}
					break;
					default:
						if (field.val() === '') {
							valid = false;
							return false;
						}
					break;
				}
			});
		}
		
		if (valid) {
			$('#saveBtn').button( "option", "disabled", false );
			//$('#connectBtn').button( "option", "disabled", false );
		} else {
			$('#saveBtn').button( "option", "disabled", true );
			//$('#connectBtn').button( "option", "disabled", true );
		}
	});

	//open dialog
	var dialog = $( "#dialog-site" ).dialogResize({
		width: 600,
		height: 540,
		modal: true,
		close: function( event, ui ) {
			$( this ).remove();
		},
		buttons: {
			/*
			Connect: {
				text: "Connect",
				id: "connectBtn",
				click: test,
				disabled: newSite
			},*/
			Save: {
				text: "Save",
				id: "saveBtn",
				click: save,
				disabled: newSite
			}
		}
	});

	//passwords
	function decryptPasswords() {
		if(settings.ftp_pass) {
			$('input[name=ftp_pass').val(Aes.Ctr.decrypt(settings.ftp_pass, storage.get('masterPassword'), 256));
		}

		if(settings.db_password) {
			$('input[name=db_password]').val(Aes.Ctr.decrypt(settings.db_password, storage.get('masterPassword'), 256));
		}
	}

	if (!newSite && prefs.useMasterPassword) {
		if (!storage.get('masterPassword')) {
			return masterPasswordPrompt(decryptPasswords);
		} else {
			decryptPasswords();
		}
	}
	
	//import
	function doImport(content){
		$( "#dialog-site" ).dialogResize( "close" );
		$( "#dialog-site" ).remove();

		loading.fetch(config.apiBaseUrl+'sites?cmd=import', {
			action: 'Importing site',
			data: {
				content: content
			},
			success: function(data) {
				prompt.alert({title: 'Success', msg: data.imported+' site(s) imported.'});
				currentSite = data.site;
				
				load();
			}
		});
	}

	$('#importSite').change(function(e){
		var files = e.target.files; // FileList object

		if (files.length === 0) {
			return;
		}

		var file = files[0];
		var reader = new FileReader();
		reader.onloadend = (function (file) {
			return function () {
				doImport(reader.result);
			};
		}(file));

		reader.readAsText(file);
	});
}

function active() {
	return currentSite;
}

function getSettings(val) {
	if(!val) {
		val = currentSite;
	}

	var key = isNaN(val) ? 'name' : 'id';

	site = false;
	sites.forEach(function(entry) {
		if(entry[key]==val){
			site = entry;
			return;
		}
	});

	return util.clone(site);
}

function getAjaxOptions(ajaxUrl, settings) {
	if (!settings) {
		settings = getSettings();
	}
	
	var params = {};

	if(settings.server_type == 'AJAX' || settings.turbo == 1) {
		if( settings.web_url ){
			ajaxUrl = settings.web_url;
			
			if (!util.endsWith(ajaxUrl, '/')) {
				ajaxUrl = ajaxUrl+'/';
			}
			
			ajaxUrl = ajaxUrl+'shiftedit-proxy.php?ModPagespeed=off';
		}else{
			prompt.alert({title:lang.errorText, msg:'Missing website URL for proxy, edit site settings and set a website url or disable turbo option.'});
		}

		if (!util.startsWith(ajaxUrl, 'http://') && !util.startsWith(ajaxUrl, 'https://')) {
			if( settings.encryption == '1' ){
				ajaxUrl = 'https://'+ajaxUrl;
			}else{
				ajaxUrl = 'http://'+ajaxUrl;
			}
		}
		
		//fixme prompt for master password
		var prefs = preferences.get_prefs();
		var pass = prefs.useMasterPassword ? Aes.Ctr.decrypt(settings.ftp_pass, storage.get('masterPassword'), 256) : settings.ftp_pass;

		params = {
			user: settings.ftp_user,
			pass: util.sha1(pass)
		};

		// check if non-ssl blocked
		if(location.protocol==='https:' && util.startsWith(ajaxUrl, 'http://') && !util.startsWith(ajaxUrl, 'http://localhost/') && ssl.is_blocked()) {
			ssl.test()
			.fail(function () {
				prompt.alert({title:'Proxy Blocked', msg:'Enable SSL or click Shield icon in address bar, then "Load unsafe scripts"'});
			});
		}
	}

	return {
		site: settings.id,
		dir: settings.dir,
		url: ajaxUrl,
		params: params
	};
}

function get() {
	return sites;
}


$('body').on('click', '.newTab .addSite', function(e){
	edit(true);
});

exports.init = init;
exports.load = load;
exports.open = open;
exports.active = active;
exports.getSettings = getSettings;
exports.getAjaxOptions = getAjaxOptions;
exports.getdirectFn = function(){ return directFn; };
exports.definitions = definitions;
exports.focus = focus;
exports.masterPasswordPrompt = masterPasswordPrompt;
exports.get = get;
exports.edit = edit;

});