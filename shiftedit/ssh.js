define(['app/config', 'app/tabs', 'app/prompt', 'app/lang', 'app/loading', 'app/site', 'app/prefs', 'app/layout', 'app/storage', 'xterm.js/src/xterm', 'jquery'], function (config, tabs, prompt, lang, loading, site, preferences, layout, storage, Terminal) {

lang = lang.lang;

function Tab(shellArgs, index, cwd) {
	var self = this;
	var cols = Terminal.geometry[0];
	var rows = Terminal.geometry[1];

	Terminal.call(this, {
		cursorBlink: true,
		screenKeys: true
	});

	this.index = index;
	this.id = '';
	this.socket = tty.socket;
	this.element = document.getElementById('sshContainer'+this.index);
	this.process = '';
	this.open(this.element);

	this.socket.emit('create', cols, rows, shellArgs, function(err, data) {
		//refresh panel
		//ssh.session.resize();

		if (err) return self._destroy();

		//self.pty = data.pty;
		self.id = data.id;
		tty.terms[self.id] = self;
		tty.cwd[self.id] = cwd;
		return;
	});
}

if( typeof Terminal !== 'undefined' ){
	var EventEmitter = Terminal.EventEmitter;
	var inherits = Terminal.inherits;
	var tty = new EventEmitter();
	
	tty.open = function() {
		tty.socket = io.connect('https://ssh.shiftedit.net', {
			resource: 'socket.io',
			query: "token="+storage.get('authToken')
		});

		tty.terms = {};
		tty.logged_in = {};
		tty.cwd = {};

		tty.socket.on('connect', function() {
			console.log('connect');
			tty.reset();
			tty.emit('connect');
		});

		tty.socket.on('data', function(id, data) {
			if (tty.logged_in[id]!==true && data.trim().substr(-1)==='$') {
				console.log('logged in');
				if (tty.cwd[id]) {
					tty.socket.emit('data', id, "cd "+tty.cwd[id]+"\n");
				}
				tty.logged_in[id] = true;
			}
			
			if (!tty.terms[id]) return;
			tty.terms[id].write(data);
		});

		tty.socket.on('kill', function(id) {
			//prompt.alert({title:'Disconnected', msg: 'The connection has closed.'});

			console.log('ssh killed');

			if (!tty.terms[id]) return;

			var el = tty.terms[id].element;
			var tabId = $(el).closest('[role=tabpanel]').attr('id');
			var tab = $('[aria-controls='+tabId+']');
			tab.attr('title', tab.attr('title')+' - disconnected');

			var session = tab.data('session');
			if(session)
				session.destroy();

			//session = null;

			console.log('tty destroyed');

			if (tty.terms[id])
				tty.terms[id].destroy();
		});

		// XXX Clean this up.
		tty.socket.on('sync', function(terms) {
			console.log('sync...');
			//console.log(terms);

			tty.reset();

			var emit = tty.socket.emit;
			tty.socket.emit = function() {};

			Object.keys(terms).forEach(function(key) {
				var data = terms[key];
				var win = new Window();
				var tab = win.tabs[0];

				delete tty.terms[tab.id];
				tab.pty = data.pty;
				tab.id = data.id;
				tty.terms[data.id] = tab;
				win.resize(data.cols, data.rows);
				tab.setProcessName(data.process);
				tty.emit('open tab', tab);
				tab.emit('open');
			});

			tty.socket.emit = emit;
		});

		tty.emit('load');
		tty.emit('open');
	};

	tty.reset = function() {
		tty.terms = {};
		tty.emit('reset');
	};

	inherits(Tab, Terminal);

	// We could just hook in `tab.on('data', ...)`
	// in the constructor, but this is faster.
	Tab.prototype.handler = function(data) {
		this.socket.emit('data', this.id, data);
	};

	// We could just hook in `tab.on('title', ...)`
	// in the constructor, but this is faster.
	Tab.prototype.handleTitle = function(title) {
		if (!title) return;
		//console.log('ssh title '+title);

		$('[data-ssh='+this.index+']').attr('title', title);

		title = sanitize(title);
		this.title = title;

		if (Terminal.focus === this) {
			document.title = title;
			// if (h1) h1.innerHTML = title;
		}
	};

	Tab.prototype._write = Tab.prototype.write;

	Tab.prototype.write = function(data) {
		//if (this.window.focused !== this) this.button.style.color = 'red';
		return this._write(data);
	};

	Tab.prototype._focus = Tab.prototype.focus;

	Tab.prototype.focus = function() {
		if (Terminal.focus === this) return;
		this._focus();
	};

	Tab.prototype._resize = Tab.prototype.resize;

	Tab.prototype.resize = function(cols, rows) {
		var term = tty.terms[this.id];

		if(!$('[data-ssh='+this.index+']').length){
			return;
		}

		this.socket.emit('resize', this.id, cols, rows);
		this._resize(cols, rows);
		this.emit('resize', cols, rows);
	};

	Tab.prototype.doResize = function(){
		var term = tty.terms[this.id];
		var charEl = $('<span>M</span>').appendTo($(this.element));
		var charWidth = Math.ceil(charEl.width());
		var charHeight = Math.ceil(charEl.height());
		charEl.remove();
		
		// console.log('resize '+charWidth+'x'+charHeight);
		
		cols = Math.floor($(this.element).parent().outerWidth() / charWidth)-1;
		rows = Math.floor($(this.element).parent().outerHeight() / charHeight)-1;

		console.log('resize '+cols+'x'+rows);

		this.resize(cols, rows);
	};

	Tab.prototype.__destroy = Tab.prototype.destroy;

	Tab.prototype._destroy = function() {
		if (this.destroyed) return;
		this.destroyed = true;

		if (this.element.parentNode) {
			this.element.parentNode.removeChild(this.element);
		}

		if (tty.terms[this.id]) delete tty.terms[this.id];

		this.__destroy();
	};

	Tab.prototype.destroy = function() {
		if (this.destroyed) return;
		this.socket.emit('kill', this.id);
		this._destroy();
		this.emit('close');
	};
}

function sanitize(text) {
	if (!text) return '';
	return (text + '').replace(/[&<>]/g, '');
}

var index = 0;

if( typeof Terminal !== 'undefined' ){
	cols = Terminal.geometry[0];
	rows = Terminal.geometry[1];
}

initialised = false;
session = null;

function create(tabpanel){
	if( !initialised && typeof Terminal !== 'undefined' ){
		tty.open();
		initialised = true;
	}

	if( typeof Terminal === 'undefined' ){
		prompt.alert({title:lang.errorText, msg:'Can\'t connect to terminal server, try a refresh'});
		return;
	}

	index++;

	//create tab
	tab = $(tabpanel).tabs('add', 'SSH', '<div id="sshContainer'+index+'" class="sshContainer" style="width:100%;height:100%;"></div>');
	tab.addClass('closable');

	tab.attr('data-ssh', index);
	tab.attr('title', 'Secure Shell');

	return tab;
}

function new_session(tab, host, username, port, cwd){
	var shellArgs = '-p '+port+' '+username+'@'+host;
	var session = new Tab(shellArgs, index, cwd);
	session.focus();
	tab.data('session', session);
	tab.on('beforeClose', function() {
		console.log('close session');
		session.destroy();
	});
	
	setTimeout(function() {
		$('#sshContainer'+index+' .terminal').focus();
		session.doResize();
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

			if(val){
				$( "#sshName" ).append( '<option value="'+val+'">'+val+'</option>' );
				$( "#sshName" ).val(val).change();
			}

			return profiles;
		});
}

function select(item) {
	$('#ssh [name=username]').val($(item).data('username'));
	$('#ssh [name=host]').val($(item).data('host'));
	if ($(item).data('port')){
		$('#ssh [name=port]').val($(item).data('port'));
	}
}

function open(tabpanel){
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
	var dialog = $( "#dialog-ssh" ).dialog({
		modal: true,
		width: 400,
		height: 300,
		close: function( event, ui ) {
			$( this ).remove();
		},
		buttons: {
			OK: function() {
				var name = $('#sshName').combobox('val');
				var username = $('#ssh [name=username]').val();
				var host = $('#ssh [name=host]').val();
				var port = $('#ssh [name=port]').val();

				if( !name ){
					$('#sshName').focus();
					return;
				}

				if( !username ){
					$('#ssh [name=username]').focus();
					return;
				}

				if( !host ){
					$('#ssh [name=host]').focus();
					return;
				}

				if( !port ){
					$('#ssh [name=port]').focus();
					return;
				}

				//save connection
				loading.fetch(config.apiBaseUrl+'ssh?cmd=save&name='+name+'&username='+username+'&host='+host+'&port='+port, {
					action: 'Saving ssh profile'
				});

				//prefs.sshProfile = name;
				//preferences.save();

				//tty.open(username+'@'+host);
				new_session(tab, host, username, port);

				$( this ).dialog( "close" );
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
	
	console.log('domain: '+options.domain);
	console.log('username: '+username);
	console.log('port: '+options.port);
	new_session(tab, options.domain, username, options.port, cwd);
	
	var minWidth = 300;
	var myLayout = layout.get();
	myLayout.open(paneName);
	if(myLayout.panes[paneName].outerWidth() < minWidth) {
		myLayout.sizePane(paneName, minWidth);
	}
}

$('body').on('click','.newTab .ssh', function(){
	var tabpanel = $(this).closest('.ui-tabs');
	open(tabpanel);

	var id = $(this).closest('[role=tabpanel]').attr('id');
	var tab = $('[aria-controls='+id+']');
	tabs.close(tab);
});

/*
$('body').on('click', '#sshSite a', function(e){
	connect();
});
*/

return {
	connect: connect
};

});