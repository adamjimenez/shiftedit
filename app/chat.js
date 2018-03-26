define(['./tabs','./storage', './site', './util', './firebase', 'jquery-contextmenu', 'dialogResize'], function (tabs, storage, site, util, firebase) {

var groups = {};
var selectedGroup;
var chats = {};
var texts = {};
var scrolls = {};
var alertIcon = '<i class="fa fa-bell"></i>';
var username = storage.get('username');
var userId = storage.get('user');
var avatar = storage.get('avatar');
var alertSound;
var alertSoundURL = 'https://shiftedit.s3.amazonaws.com/assets/alert.wav';
var initialized = false;

function send(msg) {
	var groupRef = groups[group];

	if(msg===''){
		return;
	}

	//replace line numbers with links
	var tab = tabs.active();

	if( tab ){
		var siteId = tab.data('site');
		var file = tab.data('file');
		msg = msg.replace(/#(\d+)/g, '#'+siteId+'/'+file+":$1");
	}

	var message = {
		userId: userId,
		name: username,
		timestamp: firebase.timestamp(),
		message: msg,
		avatar: avatar
	};

	var ref = groupRef.push();
	var callback;
	ref.setWithPriority(message, firebase.timestamp(), callback);
}

function add() {
	if (!initialized)
		init();
	
	console.log('checking chat');
	var tab = $(this);

	var siteId = tab.attr('data-site');
	var file = tab.attr('data-file');

	var doc_name = siteId + '/' + file;
	doc_name = doc_name.split('.').join('_');

	var firebaseUrl;
	var chatName;
	if( tab.attr('shared') ){
		firebaseUrl = "https://shiftedit.firebaseio.com/public/"+doc_name+'/chat';
		chatName = basename(file);
	}else{
		firebaseUrl = "https://shiftedit.firebaseio.com/sites/"+siteId+'/chat';

		var settings = site.getSettings(siteId);
		chatName = settings.name;
	}

	if( !groups[firebaseUrl] ){
		console.log('adding chat');
		var li = $('<li data-url="' + firebaseUrl + '"><a href="#">' + chatName + '</a></li>').appendTo('#chat');
		
		var firebaseDatabase = firebase.get();
		var ref = firebaseDatabase.refFromURL(firebaseUrl);

		var recentRef = ref.limitToLast(20);
		groups[firebaseUrl] = ref;
		group = firebaseUrl;
		selectedGroup = group;
		select(group);
		chats[group]='';

		//delete older than 7 days
		var timestamp = new Date();
		timestamp = timestamp.setDate(timestamp.getDate()-7);
		ref.endAt(timestamp).on("child_added", function(snap) {
			console.log('delete old');
			snap.ref.remove();
		});

		recentRef.on('value', function(snapshot) {
			if(snapshot.val() === null) {
				console.log('no data');
			} else {
				//console.log(snapshot.val());
			}
		});

		recentRef.on('child_added', function(snapshot) {
			var message = snapshot.val();

			//remove entities
			message.message = String(message.message).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

			//insert line breaks
			message.message = message.message.replace(/\n/g, '<br />');

			function replaceFileLink(string, siteId, file, line){
				return '<a href="#'+site.getSettings(parseInt(siteId)).name+'/'+file+':'+line+'">'+file+':'+line+'</a>';
			}

			//insert hash links
			message.message = message.message.replace(/#([0-9]+)\/([^\s]+):([0-9]+)/g, replaceFileLink);

			// will display time in 10:30:23 format
			var time = util.date('M j, g:i A', message.timestamp/1000);

			var chatHtml = '';

			chatHtml += '<div class="chat"><table><tr>';
			if( message.avatar ){
				chatHtml += '<td><img src="'+message.avatar+'"></td>';
			}
			chatHtml += '<td>';
			chatHtml += '<p class="chatMessage">'+message.message+'</p>';
			chatHtml += '<p class="chatName">'+message.name+' • '+time+'</p>';
			chatHtml += '</td>';
			chatHtml += '</tr></table></div>';

			//write to chat
			if( selectedGroup === group  ){
				$('#messages').append(chatHtml);
			}

			chats[group] += chatHtml;

			//scroll to bottom
			var d = $('#messages');
			d.scrollTop(d.prop("scrollHeight"));

			// play notification sound
			if(
				message.userId !== userId &&
				$('#message').is(":focus")
			){
				if( !alertSound ){
					alertSound = new Audio(alertSoundURL);
				}
				alertSound.play();

				//add icon
				$('li[data-url="' + group + '"]').addClass('unread');
			}

			//open chat
			open();
		});
	}
}

function init() {
	$( "body" ).append('<div id="dialog-chat" title="Chat" style="display:none;">\
		<div class="chats">\
			<ul id="chat"></ul>\
		</div>\
		<div class="messagePanel">\
			<div id="messages"></div>\
			<textarea id="message" class="ui-widget ui-state-default ui-corner-all" disabled autofocus></textarea>\
		</div>\
	</div>');

	//open dialog
	var dialog = $( "#dialog-chat" ).dialogResize({
		width: 300,
		height: 400,
		position: { my: "right bottom", at: "right bottom", of: window }
	});

	close();

	//listener
	$('#chat').on('click', 'a', select);
	$('#message').keypress(function( event ) {
		if ( event.which == 13 ) {
			send($(this).val());
			$(this).val('');
			return false;
		}
	});

	$.contextMenu({
		selector: '#chat a',
		callback: function(key, opt){
			switch(key) {
				case 'delete':
					remove($(this).closest("li"));
				break;
			}
		},
		items: {
			"delete": {name: 'Delete'}
		}
	});
	
	initialized = true;
}

function open() {
	if (!initialized)
		init();
		
	$('#dialog-chat').dialogResize( "open" );
}

function close() {
	$('#dialog-chat').dialogResize( "close" );
}

function select() {
	var li = $(this).parent();
	li.parent().children().removeClass('ui-state-focus');
	li.addClass('ui-state-focus');
	li.removeClass('unread');

	selectedGroup = li.data('url');
	$('#messages').html(chats[group]);

	//scroll to bottom
	var d = $('#messages');
	d.scrollTop(d.prop("scrollHeight"));

	$('#message').prop('disabled', false);
	$('#message').focus();
	return false;
}

function remove(li) {
	var group = li.data('url');
	var groupRef = groups[group];
	li.remove();

	//delete messages
	var timestamp = new Date();
	timestamp = timestamp.setDate(timestamp.getDate());
	groupRef.endAt(timestamp).on("child_added", function(snap) {
		console.log('delete old');
		snap.ref.remove();
	});

	$('#messages').html('');
}

$('body').on('click', '#chatButton a', function(e){ open(); });
$('body').on('firebaseon', 'li', add);
	
//revisions dialog
return {};

});