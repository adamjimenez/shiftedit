define(['./config', './loading', './util', './prefs', './prompt', './ssh', './storage', 'aes', './lang', 'dialogResize', 'showPassword'], function (config, loading, util, preferences, prompt, ssh, storage, Aes, lang) {

var selected;
var servers = [];
var settings = {};
var currentServer;
lang = lang.lang;

function load() {
	loading.fetch(config.apiBaseUrl+'servers', {
		action: 'getting servers',
		success: function(data) {
			$( "#serverList li" ).remove();
			
			servers = data.servers;
			$.each(servers, function( index, item ) {
				var li = $( '<li><a href="#"><strong>' + item.name + '</strong><br>' + item.domain + ' - ' + item.provider +'</a></li>' ).appendTo( "#serverList" )
				.attr('data-index', index);
				
				if (item.id===currentServer) {
					li.addClass('ui-state-active');
				}
			});
		}
	});
}

function getOptions() {
	var ajax;
	var provider = $("#providerRadio input[type='radio']:checked").val();
	
	$(window).off('authorized', getOptions);

	ajax = $.ajax({
		url: config.apiBaseUrl+'servers?cmd=options',
		method: 'POST',
		dataType: 'json',
		data: {
			'provider': provider
		}
	});
	

	if (!loading.start('Getting options', function(){
		console.log('abort getting options');
		ajax.abort();
	})) {
		return;
	}
	
	$( "#region" ).children('option').remove();
	$( "#region" ).append( '<option value="">Loading</option>' );
	$( "#image" ).children('option').remove();
	$( "#image" ).append( '<option value="">Loading</option>' );
	
	ajax.then(function (data) {
		loading.stop();
		
		var items;

		if(data.success) {
			if (data.require_auth) {
				$(window).on('authorized', getOptions);
				window.open('/account/services/'+provider.toLowerCase());
			} else {
				$( "#region" ).children('option').remove();
				$( "#region" ).append( '<option value=""></option>' );
				
				items = data.options.regions;
				items.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} ); 
				$.each(items, function( index, item ) {
					var selected = item.selected ? 'selected' : '';
					$( "#region" ).append( '<option value="'+item.value+'" '+selected+'>'+item.name+'</option>' );
				});
	
				$( "#image" ).children('option').remove();
				$( "#image" ).append( '<option value=""></option>' );
				
				items = data.options.images;
				items.sort(function(a,b) {return (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);} ); 
				$.each(items, function( index, item ) {
					var selected = item.selected ? 'selected' : '';
					$( "#image" ).append( '<option value="'+item.value+'" '+selected+'>'+item.name+'</option>' );
				});
			}
		}
	});
}

function edit(add) {
	var server = {};
	
	if (!add) {
		if (!selected) {
			return;
		}
		
		server = servers[selected.data('index')];
	}
	
	//add servers dialog
	$( "body" ).append('<div id="dialog-server" title="Add server">\
		<form id="serverSettings" autocomplete="off">\
			<input type="hidden" name="id" value="">\
			<p>\
				<label>Name:</label>\
				<input type="text" name="name" value="" placeholder="dev server" class="text ui-widget-content ui-corner-all" required>\
			</p>\
			<p>\
				<label for="platform">Platform:</label>\
				<span id="platformRadio">\
					<input type="radio" name="platform" value="apache" id="platformRadio1" checked>\
					<label for="platformRadio1">\
						Apache\
					</label>\
					<!--\
					<input type="radio" name="platform" value="docker" id="platformRadio2" checked>\
					<label for="platformRadio2">\
						Docker\
					</label>\
					-->\
				</span>\
			</p>\
			<p>\
				<label for="provider">Provider:</label>\
				<span id="providerRadio">\
					<input type="radio" name="provider" value="AWS" id="providerRadio1">\
					<label for="providerRadio1" title="Amazon Web Services">\
						<i class="fab fa-aws"></i>\
					</label>\
					<input type="radio" name="provider" value="DigitalOcean" id="providerRadio2">\
					<label for="providerRadio2" title="DigitalOcean">\
						<i class="fab fa-digital-ocean"></i>\
					</label>\
					<input type="radio" name="provider" value="Linode" id="providerRadio3">\
					<label for="providerRadio3" title="Linode">\
						<i class="fab fa-linode"></i>\
					</label>\
					<input type="radio" name="provider" value="Custom" id="providerRadio4">\
					<label for="providerRadio4" title="Custom Server">\
						<i class="fas fa-server"></i>\
					</label>\
				</span>\
			</p>\
			<div id="aws_help" style="display: none;">\
				<p style="display: block;">To connect to AWS you will need an <a href="https://shiftedit.net/docs/servers#amazon_web_services" target="_blank">Access key and password</a></p>\
			</div>\
			<p id="custom_container" style="display: none;">\
				Manually add a server, it should not contain any previous sites.<br>User will require sudo privileges.\
			</p>\
			<p id="ip_container" style="display: none;">\
				<label>IP address:</label>\
				<input type="text" name="domain" value="" placeholder="Server IPv4 address" class="text ui-widget-content ui-corner-all">\
			</p>\
			<p id="user_container" style="display: none;">\
				<label>Username:</label>\
				<input type="text" id="username" name="username" value="" placeholder="Server username" class="text ui-widget-content ui-corner-all">\
			</p>\
			<p class="pass_container" style="display: none;">\
				<label>Password:</label>\
				<input type="password" id="password" name="password" value="" placeholder="Secret Access Key" class="showPassword text ui-widget-content ui-corner-all" required disabled>\
			</p>\
			<p id="region_container" style="display: none;">\
				<label>Region:</label>\
				<span class="flex">\
					<select id="region" name="region" class="text ui-widget-content ui-corner-all" required></select>\
				</span>\
			</p>\
			<p id="image_container" style="display: none;">\
				<label>Image:</label>\
				<span class="flex">\
					<select id="image" name="image" class="text ui-widget-content ui-corner-all" required></select>\
				</span>\
			</p>\
			<p class="ssh_key_container" style="display: none;">\
				<label>Your SSH key:</label>\
				<textarea rows="4" class="text ui-widget-content ui-corner-all" readonly>'+storage.get('public_key')+'</textarea>\
				<label>Save the SSH key in: ~/.ssh/authorized_keys</label>\
			</p>\
			<p>Server charges may apply, consult your provider for details.</p>\
		</form>\
	</div>');
	
	//defeat chrome autofill
	setTimeout(function(){
		$('#password').removeAttr("disabled");
	}, 500);
	
	//toggle fields
	$("#providerRadio input[type='radio']").change(function() {
		var provider = this.value;
		
		$('#aws_help').hide();
		$('#user_container').hide();
		$('#serverSettings .pass_container').hide();
		$('#region_container').hide();
		$('#image_container').hide();
		$('#custom_container').hide();
		$('#ip_container').hide();
		$('#server_username_container').hide();
		$('#serverSettings .ssh_key_container').hide();
			
		if (provider==='AWS') {
			$('#aws_help').show();
			$('#user_container').show();
			$('#serverSettings .pass_container').show();
			$('#username').attr('placeholder', 'Access Key ID');
			//$('#password').attr('placeholder', 'Secret Access Key');
		} else if (provider==='DigitalOcean') {
			$('#region_container').show();
			$('#image_container').show();
			//$('#password').attr('placeholder', 'Token');
		} else if (provider==='Linode') {
			$('#region_container').show();
			$('#image_container').show();
		} else if (provider==='Custom') {
			$('#custom_container').show();
			$('#ip_container').show();
			$('#user_container').show();
			$('#serverSettings .ssh_key_container').show();
			$('#username').attr('placeholder', 'Server username');
		}
		
		if(provider==='DigitalOcean' || provider==='Linode') {
			getOptions();
		}
	});
	
	// password toggle
	$('.showPassword').showPassword();
	
	//set values
	var defaults = {};
	if (add) {
		settings = defaults;
	}

	for(var i in settings) {
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
	
	// toggle change event to show / hide fields
	$("#providerRadio input[type='radio']:checked").change();
	
	// checkbox widget
	$( "#platformRadio input[type='radio'], #providerRadio input[type='radio']" ).checkboxradio({
		icon: false
	});
	
	if (!add) {
		$( "#platformRadio input[type='radio'], #providerRadio input[type='radio']" ).checkboxradio( "disable" );
	}

	//open dialog
	var dialog = $( "#dialog-server" ).dialogResize({
		width: 620,
		height: 520,
		modal: true,
		close: function( event, ui ) {
			$( this ).remove();
		},
		buttons: {
			"Save": {
				text: "Save",
				id: "saveBtn",
				click: save,
				disabled: false
			}
		}
	});
}

function doRemove() {
	$(window).off('authorized', remove);
	
	if (!selected) {
		return;
	}
	
	var server = servers[selected.data('index')];
	
	loading.fetch(config.apiBaseUrl+'servers?cmd=delete&server='+currentServer, {
		action: 'Deleting server '+server.name,
		complete: function(data) {
			if (data.require_auth) {
				$(window).on('authorized', remove);
				window.open('/account/services/'+server.provider.toLowerCase());
			} else {
				load();
				
				//$('#editBtn').button('disable');
				$('#removeBtn').button('disable');
				$('#sshBtn').button('disable');
				$('#manageBtn').button('disable');
				$('#rebootBtn').button('disable');
				selected = null;
			}
		}
	});
}

function remove(undef, e, confirmed) {
	if (!selected) {
		return;
	}
	
	var server = servers[selected.data('index')];
	
	if(!confirmed) {
		var me = this;
		var msg = 'Any sites on this server will cease to work and this can not be undone';
		if (server.provider=='Custom') {
			msg = 'Are you sure?';
		}
		
		prompt.confirm({
			title: 'Delete server: '+server.name,
			msg: msg,
			fn: function(value) {
				switch(value) {
					case 'yes':
						doRemove();
						return;
					default:
						return false;
				}
			}
		});
		return;
	}
}

function manage() {
	if (!selected) {
		return;
	}
	
	var server = servers[selected.data('index')];
	
	window.open('http://' + server.ip + ':8080');
}

function reboot() {
	if (!selected) {
		return;
	}
	
	$(window).off('authorized', reboot);
	
	var server = servers[selected.data('index')];
	
	loading.fetch(config.apiBaseUrl+'servers?cmd=reboot&server='+currentServer, {
		action: 'Rebooting server '+server.name,
		success: function(data) {
			if (data.require_auth) {
				$(window).on('authorized', reboot);
				window.open('/account/services/'+server.provider.toLowerCase());
			}
		}
	});
}

function select(li) {
	selected = li;
	settings = servers[selected.data('index')];
	currentServer = settings.id;
	//$('#editBtn').button('enable');
	$('#removeBtn').button('enable');
	$('#sshBtn').button('enable');
	$('#manageBtn').button('enable');
	$('#rebootBtn').button('enable');
}

function open() {
	//servers dialog
	$( "body" ).append('<div id="dialog-servers" title="Servers">\
		<div class="vbox">\
			<div class="flex">\
				<ul id="serverList"></ul>\
			</div>\
		</div>\
	</div>');

	//open dialog
	var dialog = $( "#dialog-servers" ).dialogResize({
		width: 420,
		height: 300,
		modal: true,
		close: function( event, ui ) {
			$( this ).remove();
		},
		buttons: {
			"Add Server": function() {
				edit(true);
			},
			/*
			Edit: {
				text: "Edit",
				id: "editBtn",
				click: function() {
					edit();
				},
				disabled: true
			},
			*/
			Remove: {
				text: "Remove",
				id: "removeBtn",
				click: remove,
				disabled: true
			},
			SSH: {
				text: "SSH",
				id: "sshBtn",
				click: function() {
					var server = servers[selected.data('index')];
					
					var username = 'admin-user';
					if (server.provider === 'AWS') {
						username = 'ec2-user';
					}
					
					ssh.connect({
						domain: server.domain,
						username: username,
						port: 22
					});
					
					$( "#dialog-servers" ).dialogResize( "close" );
				},
				disabled: true
			},
			Reboot: {
				text: "Reboot",
				id: "rebootBtn",
				click: reboot,
				disabled: true
			}/*,
			Manage: {
				text: "Manage",
				id: "manageBtn",
				click: manage,
				disabled: true
			}*/
		}
	});

	$("#serverList").basicMenu({
		select: function (event, ui) {
			select(ui.item);
		}
	});
	
	load();
}

function save() {
	var params = util.serializeObject($('#serverSettings'));
	var serverId = $('#serverSettings [name=id]').val();
	var ajax;
	var wait = true;
	
	if (!loading.start('Saving server ' + params.name + ' (this may take a few minutes..)', function(){
		console.log('abort saving server');
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

		if (params.password) {
			params.password = Aes.Ctr.encrypt(params.password, storage.get('masterPassword'), 256);
		}
	}

	function doSave() {
		$(window).off('authorized', doSave);
		
		ajax = $.ajax({
			url: config.apiBaseUrl+'servers?cmd=save&server='+serverId,
			method: 'POST',
			dataType: 'json',
			data: params
		});
		
		ajax.then(function (data) {
			loading.stop();
	
			if(data.success) {
				if (data.require_auth) {
					$(window).on('authorized', doSave);
					window.open('/account/services/'+provider.toLowerCase());
				} else {
					var finish = function() {
						currentServer = serverId;
						load();
			
						$( "#dialog-server" ).dialogResize( "close" );
						$( "#dialog-server" ).remove();
					};
					
					serverId = data.server;
					if (!serverId) {
						console.log('no server id');
						return false;
					}
					
					$('#serverSettings [name=id]').val(serverId);
					
					var status = '';
					var ajax;
					var check_status = function() {
						ajax = $.ajax({
							url: config.apiBaseUrl+'servers?cmd=get_status&server='+serverId,
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
						
						loading.start(status, function() {
							console.log('abort server status');
							ajax.abort();
						}, true);
					};
					
					if (wait) {
						var source = new EventSource(config.apiBaseUrl+'servers?cmd=create&server='+serverId, {withCredentials: true});
						var abortFunction = function(){
							if( source ){
								source.close();
							}
						};
					
						var stopLoading = true;
						source.addEventListener('message', function(event) {
							//console.log(event.data);
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
			prompt.alert({title:lang.failedText, msg:'Error saving server'});
		});
	}
	
	doSave();
}

$('body').on('click', '#servers a, .newTab .server', function(e){
	open();
});

return {
	open: open,
	edit: edit
};

});