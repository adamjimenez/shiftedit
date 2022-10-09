define(['exports', './config', "./prompt", "./tree", "./storage", "./util", "./ssl", "./loading", './prefs', './layout', 'aes', './gdrive', './editors', './git', './site_menu', './lang',  "ui.combobox", 'dialogResize', 'showPassword'], function (exports, config, prompt, tree, storage, util, ssl, loading, preferences, layout, Aes, gdrive, editors, git, site_menu, lang) {
lang = lang.lang;
var directFn;
var sites = [];
var currentSite;
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

	items.forEach(function(item){
		$('#'+item).removeClass('ui-state-disabled');
	});
	
	$(window).trigger('siteEnable');
}

function disableMenuItems() {
	var items = ['editsite', 'duplicate', 'deletesite', 'export', 'shareSite'];

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
	
	/*
	$( "#sites" ).combobox({
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
	*/
	
	site_menu.init();

	$( "#refresh_site" ).button()
	.click(function() {
		if (currentSite) {
			open(currentSite);
		}
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
	directFn = null;
	//$( "#sites" ).combobox('val', currentSite+'');
	
	$( "#sitebar .label" ).html(site.name);
	$( "#sitebar" ).data('value', site.id);
	
	var refresh_icon = $( "#refresh_site" ).children('i').addClass('fa-spin');

	var ajax;
	if (!loading.start('Connecting to site ' + site.name, function(){
		console.log('abort opening site');
		manuallyAborted = true;
		if (ajax) {
			refresh_icon.removeClass('fa-spin');
			ajax.abort();
		}
		opening = {};
	})) {
		console.log('in queue');
		return;
	}

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
		// prompt for master password
		var prefs = preferences.get_prefs();
		if (prefs.useMasterPassword && !storage.get('masterPassword')) {
			loading.stop();
			return masterPasswordPrompt(function() {
				open(siteId, options);
			});
		}
		
		var ajaxOptions = getAjaxOptions();
		
		if (!ajaxOptions) {
			loading.stop();
			return;
		}
		
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
					type: 'password',
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
		type: 'password',
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

function loadUsers(siteId) {
	
	loading.fetch(config.apiBaseUrl+'share?cmd=list&site=' + siteId, {
		action: 'getting users',
		success: function(data) {
			// shared
			var html = '';
			data.shared.forEach(function(item){
				html += '<p>' + item.name + ' <a href="#" data-id="' + item.id + '" class="delete">X</a></p>';
			});

			if (html) {
				$('#users').html(html);
			} else {
				$('#users').html('nobody');
			}
			
			// contacts
			html = '';
			data.contacts.forEach(function(item){
				html += '<p>' + item.name + ' <a href="#" data-email="' + item.email + '" class="add">Add</a></p>';
			});

			if (html) {
				$('#contacts').html(html);
			} else {
				$('#contacts').html('no contacts');
			}
			
			$('#shareSiteForm input[name=email]').focus();
			
			// toggle shared site
			sites.forEach(function(entry) {
				if(entry.id == siteId) {
					var shared = data.shared.length ? true : false;
					
					if (entry.shared != shared) {
						console.log('toggle shared');
						entry.shared = shared;
						
						// toggle shared icon
						var icon = '';
						if (entry.shared) {
							icon = 'fa fa-share-alt';
						}
						
						$( "#sites option[value='" + siteId + "']" ).attr( 'data-icon', icon ).data( 'icon', icon );
						
						// toggle firepad from open files
						var action = shared ? 'share' : 'unshare';
						$("li[data-site='" + siteId + "']").trigger(action);
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
	edit();
}

function duplicate(siteId) {
	edit(siteId, true);
}

function doRemove(siteId) {
	loading.fetch(config.apiBaseUrl+'sites?cmd=delete&site='+siteId, {
		action: 'Deleting site',
		success: function(data) {
			//remove this site from any active tabs
			$("li[data-site='"+siteId+"']").attr('data-site', '');

			if (currentSite == siteId) {
				//disable file tree
				$('#tree-container').hide();

				//disable site options
				disableMenuItems();

				currentSite = 0;
				storage.set('currentSite', currentSite);

				//refresh combo
				$( "#sitebar .label" ).html('');
				$( "#sitebar" ).data('value', currentSite);
			}
			
			load();
		}
	});
}

function remove(siteId) {
	var settings = getSettings(siteId);
	prompt.confirm({
		title: 'Delete site '+settings.name,
		msg: 'Are you sure?',
		fn: function(value) {
			switch(value) {
				case 'yes':
					doRemove(siteId);
					return;
				default:
					return false;
			}
		}
	});
	return;
}

function share(siteId) {
	var settings = getSettings(siteId);
	
	//share site dialog
	$( "body" ).append('<div id="dialog-share-site" title="Share site '+settings.name+'">\
		<form id="shareSiteForm">\
			<div class="hbox">\
				<input id="share_email" type="text" name="email" placeholder="Email address" class="flex text ui-widget-content ui-corner-all" required autofocus>\
				<button type="submit">' + lang.add + '</button>\
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

	loadUsers(siteId);

	//handle add user
	$('#shareSiteForm').submit(function(event){
		event.preventDefault();

		loading.fetch(config.apiBaseUrl+'share?cmd=save&site=' + siteId + '&email=' + $('#shareSiteForm input[name=email]').val(), {
			action: 'saving user',
			success: function(data) {
				$('#shareSiteForm input[name=email]').val('');
				loadUsers(siteId);
			}
		});
	});

	//handle add user
	$('#shareSiteForm').on('click', 'a.add', function() {
		loading.fetch(config.apiBaseUrl+'share?cmd=save&site=' + siteId + '&email=' + $(this).data('email'), {
			action: 'saving user',
			success: function(data) {
				$('#shareSiteForm input[name=email]').val('');
				loadUsers(siteId);
			}
		});
	});

	//handle remove user
	$('#shareSiteForm').on('click', 'a.delete', function() {
		loading.fetch(config.apiBaseUrl+'share?cmd=delete&site='+siteId+'&contact='+$(this).data('id'), {
			action: 'deleting user',
			success: function(data) {
				loadUsers(siteId);
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
}

function database(siteId) {
	var settings = getSettings(siteId);
	
	if(!settings.db_phpmyadmin) {
		edit(siteId);
		return;
	}
	
	var password = settings.db_password;
	
	var prefs = preferences.get_prefs();
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
}

function updateCategory() {
	var category = $('input[name=server_type]').val();

	fields = [
		'serverwand',
		'database',
		'cloud_container',
		'host_container',
		'encryption_container',
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
		'gdrivelimited',
		'ftpcurl'
	];

	categories = {
		'FTP': [
			'serverwand',
			'host_container',
			'encryption_container',
			'portContainer',
			'timeoutContainer',
			'ftp_user_container',
			'pass_container',
			'dir_container',
			'web_url',
			'turbo_mode_container',
			'ftpcurl'
		],
		'FTPCURL': [
			'host_container',
			'encryption_container',
			'portContainer',
			'timeoutContainer',
			'ftp_user_container',
			'pass_container',
			'dir_container',
			'web_url',
			'turbo_mode_container',
			'ftpcurl'
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

		$('[name=serverTypeItem][value=' + category + ']:first').prop("checked", true);
		$( "#serverTypeRadio input[type='radio']" ).checkboxradio('refresh');
	}

	//domain placeholder
	var domain_placeholder = '';
	var domain_title = '';
	if( category === 'FTP' ){
		domain_placeholder = 'mydomain.com';
		domain_title = 'The address of the server, e.g:\n- ftp.mydomain.com';
	} else if( category === 'SFTP' ){
		domain_placeholder = 'mydomain.com';
	} else if( category === 'WebDAV' ){
		domain_placeholder = 'www.mydomain.com';
	}

	$('#domain').attr('placeholder', domain_placeholder);
	$('#domain').attr('title', domain_title);

	//username placeholder
	var username_placeholder = 'server username';
	if( category === 'AmazonS3' ){
		username_placeholder = 'access key id';
	}

	$('#ftp_user').attr('placeholder', username_placeholder);

	//password placeholder
	var password_placeholder = 'server password';
	if (category === 'AmazonS3') {
		password_placeholder = 'secret access key';
	}

	$('#ftp_pass').attr('placeholder', password_placeholder);

	if (category === 'SFTP' && $('input[name=logon_type]:checked').val() === 'key') {
		$('#logon_key').click();
	}
	
	// hide
	if ($('#siteSettings [name=id]').val()) {
		$('#serverwand').hide();
	}
}

function findPath() {
	var prefs = preferences.get_prefs();
	var ajaxOptions = {
		url: config.apiBaseUrl+'files?site='
	};
	var params = $.extend({}, ajaxOptions.params, util.serializeObject($('#siteSettings')));
	
	if (!params.domain) {
		return;
	}

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
	
	if (!params.domain && params.server_type != 'AmazonS3' ) {
		prompt.alert({title:'Error', msg:'Missing domain'});
		return;
	}

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
				'variant': prefs.treeThemeVariant,
				'dots': false
			}
		},
		'types' : {
			'default' : { 'icon' : 'fas fa-folder' },
			'file' : { 'icon' : 'fas fa-file' }
		},
		'sort' : function(a, b) {
			return this.get_type(a) === this.get_type(b) ? (this.get_text(a).toLowerCase() > this.get_text(b).toLowerCase() ? 1 : -1) : (this.get_type(a) >= this.get_type(b) ? 1 : -1);
		},
		'plugins' : [
			'sort','types'
		]
	})
	.on('open_node.jstree', function (e, data) { data.instance.set_icon(data.node, "fas fa-folder-open"); })
	.on('close_node.jstree', function (e, data) { data.instance.set_icon(data.node, "fas fa-folder"); })
	.on('loaded.jstree', function(e, data) {
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
					$('body').append('<iframe id="test_iframe" src="http'+(params.encryption ? 's' : '') + '://' + params.web_url + '_shiftedit_test_preview.html?shiftedit=' + new Date().getTime() + '"></iframe>');

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
				load();
	
				$( "#dialog-site" ).dialogResize( "close" );
			};
			
			var status = '';
			var ajax;
			var check_status = function() {
				ajax = $.ajax({
					url: config.apiBaseUrl + 'sites?cmd=get_status&site=' + siteId,
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
						
						if (status === 'ready') {
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
					
					if (msg.substr(0, 6) === 'Error:') {
						prompt.alert({title:'Error', msg: msg});
					} else if (msg === 'waiting for server') {
						stopLoading = false;
						check_status();
					} else if (msg === 'ready') {
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

function edit(siteId, duplicate) {
	/*
	if (newSite && storage.get('premier') == 'false' && storage.get('edition') == 'Standard' && sites.length >= (1+1)) {
		return prompt.alert({title: 'Quota exceeded', msg:'Free edition is limited to 1 site. <a href="/premier" target="_blank">Go Premier</a>'});
	} else if (newSite && storage.get('premier') == 'false' && storage.get('edition') == 'Education' && sites.length >= (5+1)) {
		return prompt.alert({title: 'Quota exceeded', msg:'Education edition is limited to 5 sites. <a href="/premier" target="_blank">Go Premier</a>'});
	}
	*/

	var newSite = (!siteId);
	var prefs = preferences.get_prefs();
	var title = newSite ? 'New site' : 'Edit site';

	//create dialog BEWARE UGLY LONG STRING!
	$( "body" ).append('<div id="dialog-site" title="'+title+'">\
		<form id="siteSettings" autocomplete="off">\
			<input type="hidden" name="server_type" value="">\
			<input type="hidden" name="id" value="">\
			<input type="hidden" name="share" value="">\
			<div id="addContainer">\
				<div>\
					<p>\
						<span id="serverTypeRadio">\
							<input type="radio" name="serverTypeItem" value="FTP" id="radio1"><label for="radio1">FTP</label>\
							<input type="radio" name="serverTypeItem" value="SFTP" id="radio2"><label for="radio2">SFTP</label>\
							<input type="radio" name="serverTypeItem" value="Dropbox" id="radio3"><label for="radio3">Dropbox</label>\
							<input type="radio" name="serverTypeItem" value="GDrive" id="radio4"><label for="radio4">GDrive</label>\
							<input type="radio" name="serverTypeItem" value="AmazonS3" id="radio5"><label for="radio5">AmazonS3</label>\
							<input type="radio" name="serverTypeItem" value="WebDAV" id="radio6"><label for="radio6">WebDAV</label>\
						</span>\
					</p>\
					<p id="serverwand"><label>Enter connection details below or create a new site in <a href="https://manage.serverwand.com/" target="_blank">ServerWand</a></label></p>\
					<p><label>' + lang.name + ':</label></p>\
					<p>\
						<input type="text" name="name" value="" placeholder="my awesome website" class="text ui-widget-content ui-corner-all" required>\
					</p>\
					<div id="host_container">\
						<p><label>' + lang.host + ':</label></p>\
						<p>\
							<input type="text" id="domain" name="domain" value="" class="text ui-widget-content ui-corner-all">\
							<span id="portContainer">\
								<label>&nbsp;</label>\
								<input type="number" name="port" value="" placeholder="Port" min="1" max="65535" class="text ui-widget-content ui-corner-all">\
							</span>\
						</p>\
					</div>\
					<div id="encryption_container">\
						<p><label>Encryption:</label></p>\
						<p>\
							<select name="encryption" class="ui-widget ui-state-default ui-corner-all">\
								<option value="0">Autodetect</option>\
								<option value="1">Explicit FTP over TLS</option>\
								<option value="-1">Plain FTP (insecure)</option>\
							</select>\
						</p>\
					</div>\
					<div id="authentication_container">\
						<p><label>' + lang.authentication + ':</label></p>\
						<p">\
							<span id="authenticationRadio">\
								<input type="radio" name="logon_type" value="" id="logon_password" checked><label for="logon_password">Password</label>\
								<input type="radio" name="logon_type" value="key" id="logon_key"><label for="logon_key">Public Key</label>\
							</span>\
						</p>\
					</div>\
					<p><label>' + lang.username + ':</label></p>\
					<p id="ftp_user_container">\
						<input type="text" id="ftp_user" name="ftp_user" placeholder="server username" value="" class="text ui-widget-content ui-corner-all">\
					</p>\
					<p><label>' + lang.password + ':</label></p>\
					<p id="pass_container">\
						<input type="password" id="ftp_pass" name="ftp_pass" placeholder="server password" value="" class="showPassword text ui-widget-content ui-corner-all" autocomplete="new-password" required>\
					</p>\
					<div id="ssh_key_container">\
						<p><label>' + lang.yourSSHKey + ':</label></p>\
						<p>\
							<textarea id="sshKey" rows="4" class="text ui-widget-content ui-corner-all" readonly>'+storage.get('public_key')+'</textarea>\
							<label>Save the SSH key in: ~/.ssh/authorized_keys</label>\
						</p>\
					</div>\
					<p><label>' + lang.path + ':</label></p>\
					<div id="dir_container" class="hbox my-1">\
						<input type="hidden" name="dir_id" value="">\
						<div class="custom-show-password-container text ui-widget-content ui-corner-all">\
							<input type="text" name="dir" placeholder="public folder" value="" class="text ui-widget-content ui-corner-all">\
							<button type="button" id="chooseFolder" class="ui-widget-content"><i class="fas fa-folder-open"></i></button>\
						</div>\
					</div>\
					<p><label>' + lang.websiteURL + ':</label></p>\
					<div id="web_url" class="hbox my-1">\
						<!--<select name="encryption" class="ui-widget ui-state-default ui-corner-all">\
							<option value="1">https://</option>\
							<option value="0">http://</option>\
						</select>-->\
						<input type="text" name="web_url" value="" placeholder="www.mydomain.com" class="text ui-widget-content ui-corner-all">\
						<div id="turbo_mode_container" class="text ui-widget-content ui-corner-all">\
							<label title="' + lang.turboMode + '">\
								<input type="checkbox" name="turbo" value="1" class="text ui-widget-content ui-corner-all" disabled>\
								<i class="fas fa-sitemap"></i>\
							</label>\
						</div>\
					</div>\
					<div class="accordion my-1">\
						<h3>Advanced</h3>\
						<div>\
							<h4>' + lang.database + '</h4>\
							<div>\
								<p><label>PhpMyAdmin Url:</label></p>\
								<p>\
									<input type="text" name="db_phpmyadmin" value="" class="text ui-widget-content ui-corner-all">\
								</p>\
								<p><label>DB Username:</label></p>\
								<p>\
									<input type="text" name="db_username" value="" class="text ui-widget-content ui-corner-all">\
								</p>\
								<p><label>DB Password:</label></p>\
								<p>\
									<input type="password" id="db_password" name="db_password" value="" class="showPassword text ui-widget-content ui-corner-all" autocomplete="new-password">\
								</p>\
							</div>\
							<h4>Git</h4>\
							<a href="#" style="display: flex; text-decoration: none;" id="git_config">\
								<label style="cursor: pointer;">Config</label>\
								<div style="text-align: right; flex: 1;">\
									<i class="fas fa-caret-right"></i>\
								</div>\
							</a>\
							<h4>Misc</h4>\
							<p><label>' + lang.timeout + ':</label></p>\
							<p id="timeoutContainer">\
								<input type="number" name="timeout" value="" min="0" max="90" class="text ui-widget-content ui-corner-all">\
							</p>\
							<p><label>Wordpress completions:</label></p>\
							<p>\
								<input type="checkbox" name="ac_wordpress" value="1" class="text ui-widget-content ui-corner-all">\
							</p>\
							<p><label>Bootstrap completions:</label></p>\
							<p>\
								<input type="checkbox" name="ac_bootstrap" value="1" class="text ui-widget-content ui-corner-all">\
							</p>\
							<p><label>Custom completions:</label></p>\
							<p>\
								<input type="text" name="ac_custom" value="" placeholder="https://domain.com/completions.json" class="text ui-widget-content ui-corner-all">\
							</p>\
							<p><label>Encoding:</label></p>\
							<p>\
								<select name="encoding" class="ui-widget ui-state-default ui-corner-all">\
									<option value=""></option>\
								</select>\
							</p>\
							<p><label>Revisions per file:</label></p>\
							<p>\
								<input type="number" name="revisions" value="" min="-1" max="50" class="text ui-widget-content ui-corner-all">\
							</p>\
							<div id="ftpcurl">\
								<p><label>FTP Curl:</label></p>\
								<p>\
									<input type="checkbox" name="ftpcurl" value="1" class="text ui-widget-content ui-corner-all" >\
									Alternative FTP implementation (experimental)\
								</p>\
							</div>\
							<div id="gdrivelimited">\
								<p><label>Limited access:</label></p>\
								<p>\
									<input type="checkbox" name="gdrivelimited" value="1" class="text ui-widget-content ui-corner-all" >\
									Limit access to only files created in ShiftEdit.\
								</p>\
							</div>\
							<div id="s3_public">\
								<p><label>Save files with public access:</label></p>\
								<p>\
									<input type="checkbox" name="s3_public" value="1" class="text ui-widget-content ui-corner-all" >\
								</p>\
							</div>\
							<div id="compression">\
								<p><label>Use compression:</label></p>\
								<p id="compression">\
									<input type="checkbox" name="compression" value="1" class="text ui-widget-content ui-corner-all" >\
								</p>\
							</div>\
							<p><labelCache expiration (s):</label></p>\
							<p id="max_age">\
								<input type="number" name="max_age" value="0" class="text ui-widget-content ui-corner-all" style="max-width:80px;" >\
							</p>\
						</div>\
					</div>\
				</div>\
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
	var settings = newSite ? defaults : getSettings(siteId);
	
	if(settings.port === "0") {
		delete settings.port;
	}

	if(duplicate === true) {
		settings.name = 'Copy of '+settings.name;
		settings.id = '';
		settings.server = '';
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
	
	if (settings.server_type === 'FTPCURL') {
		$('[name="ftpcurl"]').prop('checked', true);
	}
	
	// set cloud checkbox
	if (settings.server_type) {
		if( ['GDrive', 'GDriveLimited', 'Dropbox', 'AmazonS3'].indexOf(settings.server_type) !== -1 ){
			if( ['GDrive', 'GDriveLimited'].indexOf(settings.server_type) !== -1 ){
				$('[name=cloud][value=GDrive]:first').prop("checked", true);
			} else {
				$('[name=cloud][value=' + settings.server_type + ']:first').prop("checked", true);
			}
		}
		if( ['FTPCURL'].indexOf(settings.server_type) !== -1 ){
			$('[name=serverTypeItem][value=FTP]:first').prop("checked", true);
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
	
	$('#git_config').click(function() {
		git.configure();
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
	$( "#serverTypeRadio input[type='radio'], #cloudRadio input[type='radio'], #authenticationRadio input[type='radio']" ).checkboxradio({
		icon: false
	});
	
	//turbo button
	if (settings.web_url) {
		$('input[name=turbo]').removeAttr('disabled')
	}
	
	$( "#siteSettings input[name='turbo']" ).checkboxradio({
		icon: false
	});

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
	
	//$('#connect').button().click(connect);

	//trim values
	$('#siteSettings input[type=text]').blur(function(){
		$(this).val($(this).val().trim());
	});

	updateCategory();
	
	// validation
	$('#siteSettings input').on('change keyup input', function() {
		// toggle turbo mode
		if($('input[name=web_url]').val()) {
			$('input[name=turbo]').removeAttr('disabled').checkboxradio('refresh');
		} else {
			$('input[name=turbo]').attr('disabled', 'disabled').checkboxradio('refresh');
		}
		
		var required = {
			'FTP': [
				'name',
				'domain',
				'ftp_user'
			],
			'FTPCURL': [
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
		height: 660,
		modal: true,
		close: function( event, ui ) {
			$( this ).remove();
		},
		buttons: {
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
			ajaxUrl = 'https://' + ajaxUrl;
		}

		var prefs = preferences.get_prefs();
		var pass = prefs.useMasterPassword ? Aes.Ctr.decrypt(settings.ftp_pass, storage.get('masterPassword'), 256) : settings.ftp_pass;

		params = {
			user: settings.ftp_user,
			pass: util.sha1(pass)
		};

		// check if non-ssl blocked
		if(location.protocol === 'https:' && util.startsWith(ajaxUrl, 'http://') && !util.startsWith(ajaxUrl, 'http://localhost/') && ssl.is_blocked()) {
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


$('body').on('click', '.newTab .addSite', function(e) {
	edit();
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
exports.remove = remove;
exports.duplicate = duplicate;
exports.share = share;
exports.database = database;

});