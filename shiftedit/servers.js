define(['app/config', 'app/loading', 'app/util', 'app/prefs', 'app/prompt', 'app/ssh', 'app/storage', 'aes', 'app/lang', 'jquery'], function (config, loading, util, preferences, prompt, ssh, storage) {

var selected;
var servers = [];
var settings = {};
var currentServer;
var lang = require('app/lang').lang;
var Aes = require('aes');

function load() {
	loading.fetch(config.apiBaseUrl+'servers', {
		action: 'getting servers',
		success: function(data) {
			$( "#serverList li" ).remove();
			
			servers = data.servers;
			$.each(servers, function( index, item ) {
				var li = $( '<li><a href="#">' + item.name + '</a></li>' ).appendTo( "#serverList" )
				.attr('data-index', index);
				
				if (item.id===currentServer) {
					li.addClass('ui-state-active');
				}
			});
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
	$( "body" ).append('<div id="dialog-server" title="Server">\
		<form id="serverSettings" autocomplete="off">\
			<input type="hidden" name="id" value="">\
			<p>Create a development server, refer to the &nbsp; <a href="https://shiftedit.net/docs/servers" target="_blank">instructions</a>.</p>\
			<p>\
				<label for="name">Name:</label>\
				<input type="text" name="name" value="" class="text ui-widget-content ui-corner-all" required>\
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
					<label for="providerRadio1">\
						<img alt="Amazon Web Services" src="https://shiftedit.s3.amazonaws.com/images/logos/aws.svg" height="32">\
					</label>\
					<input type="radio" name="provider" value="DigitalOcean" id="providerRadio2">\
					<label for="providerRadio2">\
						<img alt="Digital Ocean" src="https://shiftedit.s3.amazonaws.com/images/logos/digitalocean.svg" height="32">\
					</label>\
					<input type="radio" name="provider" value="Linode" id="providerRadio3">\
					<label for="providerRadio3">\
						<img alt="Linode" src="https://shiftedit.s3.amazonaws.com/images/logos/linode.svg" height="32">\
					</label>\
				</span>\
			</p>\
			<p id="server_user_container" style="display: none;">\
				<label for="name">Username:</label>\
				<input type="text" id="username" name="username" value="" class="text ui-widget-content ui-corner-all">\
			</p>\
			<p id="server_pass_container" style="display: none;">\
				<label for="name">Password:</label>\
				<input type="password" id="password" name="password" value="" placeholder="api key" class="text ui-widget-content ui-corner-all" required disabled>\
				<button type="button" class="showPassword">Show</button>\
				<button type="button" class="generatePassword">Generate</button>\
			</p>\
		</form>\
	</div>');
	
	//defeat chrome autofill
	setTimeout(function(){
		$('#password').removeAttr("disabled");
	}, 500);
	
	//toggle fields
	$("#providerRadio input[type='radio']").change(function() {
		if (this.value==='AWS') {
			$('#server_user_container').show();
			$('#server_pass_container').show();
			$('#username').attr('placeholder', 'Access Key ID');
			$('#password').attr('placeholder', 'Secret Access Key');
			$('.generatePassword').hide();
		} else if (this.value==='DigitalOcean') {
			$('#server_user_container').hide();
			$('#server_pass_container').hide();
			$('.generatePassword').hide();
			//$('#password').attr('placeholder', 'Token');
		} else if (this.value==='Linode') {
			$('#server_user_container').hide();
			$('#server_pass_container').show();
			$('#password').attr('placeholder', 'Api Key');
			$('.generatePassword').show();
		} else {
			$('#server_user_container').hide();
			$('#server_pass_container').hide();
			$('.generatePassword').hide();
		}
	});
	
	$( ".showPassword" ).button().click(function() {
		var input = ($( this ).prev());
		if(input.attr('type')==='text') {
			input.attr('type', 'password');
		}else{
			input.attr('type', 'text');
		}
	});
	
	$( ".generatePassword" ).button().click(function() {
		switch($("#providerRadio input[type='radio']:checked").val()) {
			case 'Linode':
				window.open('https://manager.linode.com/profile/api');
			break;
		}
	});
	
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
	var dialog = $( "#dialog-server" ).dialog({
		modal: true,
		close: function( event, ui ) {
			$( this ).remove();
		},
		width: 560,
		height: 380,
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

function remove(undef, e, confirmed) {
	if (!selected) {
		return;
	}
	
	var server = servers[selected.data('index')];
	
	if(!confirmed) {
		var me = this;
		prompt.confirm({
			title: 'Delete server',
			msg: 'Are you sure?',
			fn: function(value) {
				switch(value) {
					case 'yes':
						remove(undef, e, true);
						return;
					default:
						return false;
				}
			}
		});
		return;
	}

	loading.fetch(config.apiBaseUrl+'servers?cmd=delete&server='+currentServer, {
		action: 'Deleting server '+server.name,
		success: function(data) {
			load();
			
			$('#editBtn').button('disable');
			$('#removeBtn').button('disable');
			$('#sshBtn').button('disable');
			$('#manageBtn').button('disable');
			$('#rebootBtn').button('disable');
			selected = null;
		}
	});
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
	
	var server = servers[selected.data('index')];
	
	loading.fetch(config.apiBaseUrl+'servers?cmd=reboot&server='+currentServer, {
		action: 'Rebooting server '+server.name,
		success: function(data) {
			//load();
		}
	});
}

function select(li) {
	selected = li;
	settings = servers[selected.data('index')];
	currentServer = settings.id;
	$('#editBtn').button('enable');
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
	var dialog = $( "#dialog-servers" ).dialog({
		modal: true,
		close: function( event, ui ) {
			$( this ).remove();
		},
		width: 420,
		height: 300,
		buttons: {
			"Add Server": function() {
				edit(true);
			},
			Edit: {
				text: "Edit",
				id: "editBtn",
				click: function() {
					edit();
				},
				disabled: true
			},
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
					
					$( "#dialog-servers" ).dialog( "close" );
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
				switch(params.provider) {
					case 'DigitalOcean':
						window.open('/account/services/digitalocean');
					break;
					default:
						console.error('invalid provider' + params.provider);
					break;
				}
			} else {
				var finish = function() {
					currentServer = serverId;
					load();
		
					$( "#dialog-server" ).dialog( "close" );
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
					}).then(function (data) {
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
						console.log('abort server status');
						console.log(ajax);
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

$('body').on('click', '#servers a, .newTab .server', function(e){
	open();
});

return {
	open: open
};

});