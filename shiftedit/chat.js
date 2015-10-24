define(['app/tabs','app/storage', 'app/site', 'app/util'], function (tabs, storage, site, util) {

var groups = {};
var selectedGroup;
var chats = {};
var texts = {};
var scrolls = {};
var alertIcon = '<i class="fa fa-bell"></i>';

var username = storage.get('username');
var userId = storage.get('user');
var avatar = storage.get('avatar');

var alertSound = '';
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

	//console.log(firebaseUrl);

	if( !groups[firebaseUrl] ){
		var li = $('<li data-url="' + firebaseUrl + '"><a href="#">' + chatName + '</a></li>').appendTo('#chat');

		var ref = new Firebase(firebaseUrl);

		var recentRef = ref.limit(20);
		groups[firebaseUrl] = ref;
		group = firebaseUrl;
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

			//console.log(group);
			//console.log(snapshot.name());

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
			if (!$('#dialog-chat').length) {
				open();
			}
		});
	}
}

function open() {
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


	return;

	new Ext.Window({
		id: 'chatWin',
		title: 'Chat',
		width: width,
		minWidth: 200,
		height: height,
		minHeight: 200,
		x: x,
		y: y,
		closable: true,
		closeAction: 'close',
		plain: true,
		constrain: true,
        layout: {
            type: 'border'
        },
        items: [{
			id: 'chatGrid',
			name: 'chatGrid',
			xtype: 'grid',
			store: chatStore,
            region: 'west',
            width: 80,
            split: true,
			hideHeaders: true,
			forceFit: true,
			height: 'auto',

			columns: [{
				text: "alert",
				dataIndex: 'alert',
				sortable: false,
				width: 16
			},{
				text: "name",
				dataIndex: 'name',
				sortable: false
			}],
			viewConfig:{
				markDirty:false
			},
			listeners: {
				cellkeydown: {
					fn: function(cell, td, cellIndex, record, tr, rowIndex, e, eOpts){
						console.log('delete chat');

						var groupRef = groups[group];
						//groupRef.remove();
						//$('#chatGrid').getStore().remove(record);


						//delete messages
						var timestamp = new Date();
						timestamp = timestamp.setDate(timestamp.getDate());
						groupRef.endAt(timestamp).on("child_added", function(snap) {
							console.log('delete old');
							snap.ref().remove();
						});

						document.getElementById('chatMessages-innerCt').innerHTML = '';

						$('#chatWin').close();
					},
					scope: this
				}
			}
        }, {
            region: 'center',
            xtype: 'panel',
			layout: 'border',
            items: [{
				id: 'chatMessages',
            	region: 'center',
				html: 'Open a shared file to start chat',
				anchor: '0 0',  // anchor width and height,
				overflowY: 'auto',
				bodyStyle: 'font-size: 11px; padding: 2px;'
			},{
            	region: 'south',
				xtype: 'textarea',
				style: 'margin:0',
				hideLabel: true,
				id: 'chatText',
				name: 'chatText',
            	split: true,
				anchor: '0 0',  // anchor width and height
				emptyText: 'Send a message'
			}]
        }]
	});

	$('#chatText').on('render', function(){
		var map = new Ext.util.KeyMap({
			target: $('#chatText').el,
			binding: [{
				key: Ext.EventObject.ENTER,
				shift: false,
				ctrl: false,
				handler: function (obj, e) {
					e.stopEvent();
					send();
				}
			}, {
				scope: this,
				key: Ext.EventObject.ENTER,
				shift: false,
				ctrl: true,
				handler: function (obj, e) {
					if (e.getTarget().type != 'button') {
						e.stopEvent();
						e.getTarget().value = e.getTarget().value + '\n';
					}
				}
			}]
		});
	});

	$('#chatGrid').getSelectionModel().on('selectionchange', function (sm, rowIdx, r) {
	    var d;

		//revertButton.disable();
		var selections = sm.getSelection();

		//save input and scroll
		if( $('#chatMessages').body ){
			d = $('#chatMessages').body.dom;
			scrolls[group] = d.scrollTop;
		}

		if( $('#chatText') ){
			texts[group] = $('#chatText').getValue();
		}

		if(!selections[0]){
			group = null;
			return;
		}

		group = selections[0].data.firebaseUrl;

		//update messages
		document.getElementById('chatMessages-innerCt').innerHTML = chats[group];

		//restore input and scroll
		$('#chatText').setValue('');
		if( texts[group] ){
			$('#chatText').setValue(texts[group]);
		}
		if( typeof scrolls[group] !== 'undefined' ){
			d.scrollTop = scrolls[group];
		}

		//remove chat icon
		$('li[data-url="' + group + '"]').removeClass('unread');
	});

	$('#chatWin').on('render', function(){
		$('#chatGrid').getSelectionModel().select(0);
	});
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


//revisions dialog
$( "body" ).append('<div id="dialog-chat" title="Chat" style="display:none;">\
    <div class="chats">\
        <ul id="chat" size="20"></ul>\
    </div>\
    <div class="messagePanel">\
        <div id="messages"></div>\
        <textarea id="message" disabled autofocus></textarea>\
    </div>\
</div>');

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

return {
};

});