define(['app/tabs','app/storage', 'app/site', 'app/util', 'jquery.contextMenu'], function (tabs, storage, site, util) {

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

	//todo
	var message = {
		userId: userId,
		name: username,
		timestamp: Firebase.ServerValue.TIMESTAMP,
		message: msg,
		avatar: avatar
	};

	var ref = groupRef.push();
	var callback;
	ref.setWithPriority(message, Firebase.ServerValue.TIMESTAMP, callback);
}

function add() {
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
		var li = $('<li data-url="' + firebaseUrl + '"><a href="#">' + chatName + '</a></li>').appendTo('#chat');

		var ref = new Firebase(firebaseUrl);

		var recentRef = ref.limitToLast(20);
		groups[firebaseUrl] = ref;
		group = firebaseUrl;
		selectedGroup = group;
		chats[group]='';

		//delete older than 7 days
		var timestamp = new Date();
		timestamp = timestamp.setDate(timestamp.getDate()-7);
		ref.endAt(timestamp).on("child_added", function(snap) {
			console.log('delete old');
			snap.ref().remove();
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

			//insert hash links
			message.message = message.message.replace(/#([^\s]+)/g, '<a href="#'+"$1"+'">'+"$1"+'</a>');

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
            <ul id="chat" size="20"></ul>\
        </div>\
        <div class="messagePanel">\
            <div id="messages"></div>\
            <textarea id="message" disabled autofocus></textarea>\
        </div>\
    </div>');

	var width = 300;
	var height = 400;
	var x = window.innerWidth - width;
	var y = window.innerHeight - height;

    //open dialog
    var dialog = $( "#dialog-chat" ).dialog({
        width: width,
        height: height,
        position: { my: "right bottom", at: "right bottom", of: window }
    });

    close();

    //listener
    $('body').on('click', '#chatButton a', function(e){ open(); });
    $('body').on('firebaseon', 'li', add);
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
}

function open() {
	$('#dialog-chat').dialog( "open" );
}

function close() {
	$('#dialog-chat').dialog( "close" );
}

function select() {
    var li = $(this).parent();
    li.parent().children().removeClass('selected');
    li.addClass('selected');
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
		snap.ref().remove();
	});

	$('#messages').html('');
}


//revisions dialog
init();

return {
};

});