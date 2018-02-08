define(['./config', './tabs', './prompt', './lang', './loading', './site', './prefs', './layout', './storage', 'xterm', 'xterm/dist/addons/fit/fit', 'aes', 'dialogResize'], function (config, tabs, prompt, lang, loading, site, preferences, layout, storage, Terminal) {

var fit = require('xterm/dist/addons/fit/fit');
Terminal.applyAddon(fit);

var Aes = require('aes');
lang = lang.lang;

var socket;
var terms = {};
var initialised = false;

init = function() {
	socket = io.connect('https://ssh.shiftedit.net', {
		resource: 'socket.io',
		query: "token="+storage.get('authToken')
	});

	socket.on('connect', function() {
		console.log('connect');
	});

	socket.on('data', function(id, data) {
		//console.log(data);
		var tab = $('li[data-ssh="'+id+'"]');
		var session = tab.data('session');

		if (session.logged_in!==true && data.trim().substr(-('password:'.length))==='password:') {
			console.log('enter password');
			
			if (session.password) {
				var pass = session.password;
				if (storage.get('masterPassword')) {
					pass = Aes.Ctr.decrypt(pass, storage.get('masterPassword'), 256);
				}
				socket.emit('data', id, pass+"\n");
				console.log('sent password');
			}
		}
		
		if (session.logged_in!==true && data.trim().substr(-1)==='$') {
			console.log('logged in');
			if (session.cwd) {
				socket.emit('data', id, "cd "+session.cwd+"\n");
			}
			session.logged_in = true;
		}
		
		if (!terms[id]) return;
		terms[id].write(data);
	});

	socket.on('kill', function(id) {
		console.log('ssh disconnected');

		if (!terms[id]) return;
		var el = terms[id].element;
		var tabId = $(el).closest('[role=tabpanel]').attr('id');
		var tab = $('[aria-controls='+tabId+']');
		var session = tab.data('session');
		
		if (!session) {
			return;
		}
		
		tab.attr('title', tab.attr('title')+' - disconnected');
		
		$( "body" ).append('<div id="dialog-ssh-disconnected" class="ui-front" title="SSH disconnected">\
			Session has disconnected\
		</div>');
	
		//open dialog
		var dialog = $( "#dialog-ssh-disconnected" ).dialogResize({
			width: 420,
			height: 300,
			modal: true,
			close: function( event, ui ) {
				$( this ).remove();
			},
			buttons: {
				Reconnect: function() {
					$( this ).dialogResize( "close" );
					destroy(session);
					new_session(tab, session.host, session.username, session.port, session.password, session.cwd);
				},
				"Choose connection": function() {
					$( this ).dialogResize( "close" );
					var tabpanel = $(tab).closest('.ui-tabs');
					open(tabpanel);
				}
			}
		});
	});
};

var doResize = function(session) {
	if (!session) {
		return;
	}
	
	var term = terms[session.id];
	
	if (!term) {
		return;
	}
	
	cols = Math.floor($(term.element).parent().innerWidth() / term.charMeasure.width)-2;
	rows = Math.floor($(term.element).parent().innerHeight() / term.charMeasure.height)-2;

	console.log('resize '+cols+'x'+rows);

	socket.emit('resize', session.id, cols, rows);
	terms[session.id].fit();
};

var destroy = function(session) {
	socket.emit('kill', session.id);
	terms[session.id].destroy();
};

function create(tabpanel) {
	if( !initialised && typeof Terminal !== 'undefined' ) {
		init();
		initialised = true;
	}

	if( typeof Terminal === 'undefined' ) {
		prompt.alert({title:lang.errorText, msg:'Can\'t connect to terminal server, try a refresh'});
		return;
	}

	//create tab
	tab = $(tabpanel).tabs('add', 'SSH', '<div class="sshContainer" style="width:100%;height:100%;"></div>');
	tab.addClass('closable');
	tab.attr('title', 'Secure Shell');

	return tab;
}

function new_session(tab, host, username, port, password, cwd) {
	if (!host) {
		console.log('no ssh host');
		return false;
	}
	
	if (!parseInt(port)) {
		port = 22;
	}
	
	var session = {
		id: null,
		host: host,
		username: username,
		port: port,
		password: password,
		cwd: cwd
	};
	tab.data('session', session);

	var tabpanel = $(tab).closest(".ui-tabs");
	var panel = tabpanel.tabs('getPanelForTab', tab);
	var element = panel.find('.sshContainer').get(0);
	
	var term = new Terminal({
		cursorBlink: true,
		screenKeys: true
	});
	
	term.on('data', function(data) {
		socket.emit('data', session.id, data);
	});
	
	term.on('title', function(title) {
		if (!title) return;

		var tab = $('[data-ssh="'+session.id+'"]');
		tab.attr('title', title);
		tab.children('.ui-tabs-anchor').contents().last().replaceWith(title);

		title = (title + '').replace(/[&<>]/g, '');
		session.title = title;
	});
	
	term.open(element, true);
	
	var shellArgs = '-p '+port+' '+username+'@'+host;
	socket.emit('create', 80, 40, shellArgs, function(err, data) {
		//refresh panel
		doResize(term);

		if (err) {
			console.log(err);
			return false;
		}

		tab.attr('data-ssh', data.id);
		session.id = data.id;
		terms[data.id] = term;
		term.focus();
		return;
	});
	
	tab.on('beforeClose', function() {
		console.log('close session');
		
		// prevent reconnect dialog
		session.closing = true;
		destroy(session);
	});
	
	setTimeout(function() {
		doResize(session);
	}, 1000);
}

function loadProfiles(val) {
	return $.getJSON(config.apiBaseUrl+'ssh')
		.then(function (data) {
			var profiles = data.profiles;

			$( "#sshName" ).children('option').remove();

			$.each(profiles, function( index, item ) {
				$( "#sshName" ).append( '<option value="' + item.name + '" data-host="' + item.host + '" data-username="' + item.username + '" data-port="' + item.port + '">'+item.name+'</option>' );
			});

			if(val) {
				$( "#sshName" ).append( '<option value="'+val+'">'+val+'</option>' );
				$( "#sshName" ).val(val).change();
			}

			return profiles;
		});
}

function select(item) {
	$('#ssh [name=username]').val($(item).data('username'));
	$('#ssh [name=host]').val($(item).data('host'));
	if ($(item).data('port')) {
		$('#ssh [name=port]').val($(item).data('port'));
	}
}

function open(tabpanel) {
	var tab = create(tabpanel);

	//import site dialog
	$( "body" ).append('<div id="dialog-ssh" class="ui-front" title="SSH connection">\
		<form id="ssh">\
		<p>\
			<label>Profile:</label>\
			<select id="sshName" name="sshName"></select>\
			<button type="button" class="delete">X</button>\
		</p>\
		<p>\
			<label>Username:</label>\
			<input type="text" name="username" class="ui-widget ui-state-default ui-corner-all">\
		</p>\
		<p>\
			<label>Host:</label>\
			<input type="text" name="host" class="ui-widget ui-state-default ui-corner-all">\
		</p>\
		<p>\
			<label>Port:</label>\
			<input type="number" name="port" value="22" class="ui-widget ui-state-default ui-corner-all">\
		</p>\
		</form>\
	</div>');

	//profile combo
	var sshcombo = $( "#sshName" ).combobox({
		select: function (event, ui) {
			select(ui.item);
		},
		change: function (event, ui) {
			select(ui.item);
		}
	});
	loadProfiles();

	$('#ssh .delete').button()
	.click(function() {
		var name = $('#sshName').val();

		if(!name)
			return;

		$('#ssh [name=username]').val('');
		$('#ssh [name=host]').val('');
		$('#ssh [name=port]').val('');

		loading.fetch(config.apiBaseUrl+'ssh?cmd=delete&name='+name, {
			action: 'Deleting ssh profile',
			success: function(data) {
				$( "#sshName" ).combobox('val');
				loadProfiles();
			}
		});
	});

	//open dialog
	var dialog = $( "#dialog-ssh" ).dialogResize({
		width: 420,
		height: 300,
		modal: true,
		close: function( event, ui ) {
			$( this ).remove();
		},
		buttons: {
			OK: function() {
				var name = $('#sshName').combobox('val');
				var username = $('#ssh [name=username]').val();
				var host = $('#ssh [name=host]').val();
				var port = $('#ssh [name=port]').val();

				if( !name ) {
					$('#sshName').focus();
					return;
				}

				if( !username ) {
					$('#ssh [name=username]').focus();
					return;
				}

				if( !host ) {
					$('#ssh [name=host]').focus();
					return;
				}

				if( !port ) {
					$('#ssh [name=port]').focus();
					return;
				}

				//save connection
				loading.fetch(config.apiBaseUrl+'ssh?cmd=save&name='+name+'&username='+username+'&host='+host+'&port='+port, {
					action: 'Saving ssh profile'
				});

				//prefs.sshProfile = name;
				//preferences.save();

				new_session(tab, host, username, port);

				$( this ).dialogResize( "close" );
			}
		}
	});
}

function connect(options) {
	cwd = options.path;
	
	var prefs = preferences.get_prefs();
	var paneName = prefs.sshPane;
	var tabpanel = $('.ui-layout-'+paneName);
	var tab = create(tabpanel);
	if (!options.domain) {
		var settings = site.getSettings(site.active());
		options.domain = settings.domain;
		options.username = settings.ftp_user;
		options.port = settings.port;
	}
	
	var username = options.username;
	switch (options.server_type) {
		case 'AWS':
			username = 'ec2-user';
		break;
		case 'Linode':
			username = 'admin-user';
		break;
	}
	
	var minWidth = 300;
	var myLayout = layout.get();
	myLayout.open(paneName);
	if(myLayout.panes[paneName].outerWidth() < minWidth) {
		myLayout.sizePane(paneName, minWidth);
	}
	
	new_session(tab, options.domain, username, options.port, options.password, cwd);
}

$('body').on('click','.newTab .ssh', function() {
	var tabpanel = $(this).closest('.ui-tabs');
	open(tabpanel);

	var id = $(this).closest('[role=tabpanel]').attr('id');
	var tab = $('[aria-controls='+id+']');
	tabs.close(tab);
});

// clean up closed tabs
$('.ui-layout-west, .ui-layout-east, .ui-layout-center, .ui-layout-south').on('tabsbeforeremove', function(e, ui) {
	var id = $(this).data('ssh');
	
	if (!id) {
		return;
	}

	if (!terms[id]) return;

	var el = terms[id].element;
	var tabId = $(ui.tab).attr('id');
	var tab = $('[aria-controls='+tabId+']');
	var session = tab.data('session');
	
	if(session)
		destroy(session);

	console.log('session destroyed');

	if (terms[id]) {
		terms[id].destroy();
	}
});

// handle resize
var timer;
function handle_resize() {
	clearTimeout(timer);
	timer = setTimeout(function() {
		console.log('ssh resize');
		$('.ui-tabs-active[data-ssh]').each(function() {
			var session = tab.data('session');
			doResize(session);
		});
	}, 250);
}

$(window).on('resize activate', handle_resize);

return {
	connect: connect
};

});