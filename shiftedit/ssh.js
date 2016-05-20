define(['app/tabs', 'app/prompt', 'app/lang', 'app/loading', 'app/site', 'app/storage', 'jquery'], function (tabs, prompt, lang, loading, site, storage) {
	lang = lang.lang;
/**
 * Tab
 */

if( typeof Terminal !== 'undefined' ){
	var EventEmitter = Terminal.EventEmitter
		, inherits = Terminal.inherits
		, on = Terminal.on
		, off = Terminal.off
		, cancel = Terminal.cancel;

	/**
	 * tty
	 */

	var tty = new EventEmitter();

	/**
	 * Shared
	 */

	tty.socket;
	tty.terms;
	tty.elements;

	/**
	 * Open
	 */

	tty.open = function() {
		tty.socket = io.connect('https://ssh.shiftedit.net', {
			resource: 'socket.io',
			query: "token="+storage.get('authToken')
		});

		tty.terms = {};

		tty.socket.on('connect', function() {
			tty.reset();
			tty.emit('connect');
		});

		tty.socket.on('data', function(id, data) {
			if (!tty.terms[id]) return;
			tty.terms[id].write(data);
		});

		tty.socket.on('kill', function(id) {
				prompt.alert({title:'Disconnected', msg: 'The connection has closed.'});

			console.log('ssh killed');

			//var title = $('#ssh').title;
			//$('[data-ssh='+this.index+']').attr('title', title+=' - disconnected');

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
			console.log('Attempting to sync...');
			//console.log(terms);

			tty.reset();

			var emit = tty.socket.emit;
			tty.socket.emit = function() {};

			Object.keys(terms).forEach(function(key) {
				var data = terms[key]
				, win = new Window()
				, tab = win.tabs[0];

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

	/**
	 * Reset
	 */

	tty.reset = function() {
		tty.terms = {};

		tty.emit('reset');
	};

	function Tab(address, index) {
		var self = this;

		var cols = Terminal.geometry[0];
		var rows = Terminal.geometry[1];

		Terminal.call(this, {
			cols: cols,
			rows: rows,
			screenKeys: true
		});

		this.index = index;
		this.id = '';
		this.socket = tty.socket;
		this.element = document.getElementById('sshContainer'+this.index);
		this.process = '';
		this.open(this.element);
		this.hookKeys();

		var shellArgs = address;

		this.socket.emit('create', cols, rows, shellArgs, function(err, data) {
			//refresh panel
			//ssh.session.resize();

			if (err) return self._destroy();

			console.log(self)

			//self.pty = data.pty;
			self.id = data.id;
			tty.terms[self.id] = self;
			return;
			self.setProcessName(data.process);
			self.emit('open');
		});
	}

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

		cols = Math.floor($(this.element).parent().width() / 7);
		rows = Math.floor($(this.element).parent().height() / 13);

		console.log('resize '+cols+'x'+rows);

		this.resize(cols, rows);
	}

	Tab.prototype.__destroy = Tab.prototype.destroy;

	Tab.prototype._destroy = function() {
		if (this.destroyed) return;
		this.destroyed = true;

		//var win = this.window;

		//this.button.parentNode.removeChild(this.button);
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

	Tab.prototype.hookKeys = function() {
		var self = this;

		this.on('request paste', function(key) {
			this.socket.emit('request paste', function(err, text) {
				if (err) return;
				self.send(text);
			});
		});
	};

	Tab.prototype._ignoreNext = function() {
		// Don't send the next key.
		var handler = this.handler;
		this.handler = function() {
			this.handler = handler;
		};
		var showCursor = this.showCursor;
		this.showCursor = function() {
			this.showCursor = showCursor;
		};
	};

	/**
	 * Program-specific Features
	 */

	Tab.scrollable = {
		irssi: true,
		man: true,
		less: true,
		htop: true,
		top: true,
		w3m: true,
		lynx: true,
		mocp: true
	};

	Tab.prototype._bindMouse = Tab.prototype.bindMouse;

	Tab.prototype.bindMouse = function() {
		if (!Terminal.programFeatures) return this._bindMouse();

		var self = this;

		var wheelEvent = 'onmousewheel' in window
		? 'mousewheel'
		: 'DOMMouseScroll';

		on(self.element, wheelEvent, function(ev) {
			if (self.mouseEvents) return;
			if (!Tab.scrollable[self.process]) return;

			if ((ev.type === 'mousewheel' && ev.wheelDeltaY > 0)
			|| (ev.type === 'DOMMouseScroll' && ev.detail < 0)) {
				// page up
				self.keyDown({keyCode: 33});
			} else {
				// page down
				self.keyDown({keyCode: 34});
			}

			return cancel(ev);
		});

		return this._bindMouse();
	};

	Tab.prototype.pollProcessName = function(func) {
		var self = this;
		this.socket.emit('process', this.id, function(err, name) {
			if (err) return func && func(err);
			self.setProcessName(name);
			return func && func(null, name);
		});
	};

	Tab.prototype.setProcessName = function(name) {
		name = sanitize(name);

		if (this.process !== name) {
			this.emit('process', name);
		}

		this.process = name;
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

	tab.attr('data-ssh', index);
	tab.attr('title', 'Secure Shell');

	return tab;
}

function new_session(tab, host, username, port){
	var session = new Tab('-p '+port+' '+username+'@'+host, index);
	session.focus();
	session.doResize();

	tab.data('session', session);
}

function loadProfiles(val) {
	return $.getJSON('/api/ssh')
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

		loading.fetch('/api/ssh?cmd=delete&name='+name, {
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
				loading.fetch('/api/ssh?cmd=save&name='+name+'&username='+username+'&host='+host+'&port='+port, {
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

	$('body').on('click','.newTab .ssh', function(){
		var tabpanel = $(this).closest('.ui-tabs');
		open(tabpanel);

		var id = $(this).closest('[role=tabpanel]').attr('id');
		var tab = $('[aria-controls='+id+']');
		tabs.close(tab);
	});

	$('body').on('click', '#sshSite a', function(e){
		var tabpanel = $('.ui-layout-center');
		var tab = create(tabpanel);
		var settings = site.getSettings(site.active());
		new_session(tab, settings.domain, settings.ftp_user, settings.port);
	});


	return {
	};
});