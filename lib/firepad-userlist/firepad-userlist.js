var FirepadUserList = (function() {
	function FirepadUserList(ref, userId, displayName, editor) {
		if(!(this instanceof FirepadUserList)) {
			return new FirepadUserList(ref, userId, displayName, editor);
		}
		this.timeouts = {};
		this.ref_ = ref;
		this.userId_ = parseInt(userId);
		this.firebaseCallbacks_ = [];
		this.users = {};
		var self = this;
		//this.displayName_ = 'Guest ' + Math.floor(Math.random() * 1000);
		this.displayName_ = displayName;
		this.editor = editor;
		this.firebaseOn_(ref.root.child('.info/connected'), 'value', function(s) {
			if(s.val() === true && self.displayName_) {
				var nameRef = ref.child(self.userId_).child('name');
				nameRef.onDisconnect().remove();
				nameRef.set(self.displayName_);
			}
		});
		this.makeUserEntriesForOthers_();
	}

	// This is the primary "constructor" for symmetry with Firepad.
	FirepadUserList.fromDiv = FirepadUserList;

	FirepadUserList.prototype.dispose = function() {
		this.removeFirebaseCallbacks_();
	};

	FirepadUserList.prototype.makeUserEntriesForOthers_ = function() {
		var self = this;

		function updateChild(userSnapshot, prevChildName) {
			var userId = JSON.parse(userSnapshot.key);

			console.log('changed '+userId);
			//		console.log(userSnapshot);
			//console.log(userSnapshot.child('name').val());

			var name = userSnapshot.child('name').val();

			if(typeof name !== 'string') {
				return;
			}
			name = name.substring(0, 20);
			var color = userSnapshot.child('color').val();
			if(typeof color !== 'string') {
				//color = "#ffb"
				console.log('remove ' + userId);

				$('#button_' + userId).remove();
				delete self.users[userId];

				//remove label
				var label = document.getElementById('label_'+userId);
				if (label) {
					label.parentNode.removeChild(label);
				}

				return;
			}
			/*
		  if (typeof color !== 'string' || !color.match(/^#[a-fA-F0-9]{3,6}$/)) {
			color = "#ffb"
		  }
		  */
			self.users[userId] = {
				color: color,
				name: name
			};

			if(userId !== self.userId_ && !$('#button_' + userId).length) {
			    //add user button
			    $('#chatButton').before('<li id="button_'+ userId +'"><a class="user" href="#" data-user="'+ userId +'">'+ name +'</a></li>')
			    .prev().css('background', color);

			    //rebuild menubar
			    $('#menubar').menubar('destroy');
			    $('#menubar').menubar();
			    
			    $('#chatButton').removeClass('ui-state-disabled');
			}

			//cursor label
			var cursor = userSnapshot.child('cursor').val();
			if (cursor !== null && userId!==self.userId_ ) {
				var start = cursor.position;
				var end = cursor.selectionEnd;
				var pos = self.editor.getSession().getDocument().indexToPosition(end);

				pos = self.editor.renderer.textToScreenCoordinates(pos.row, pos.column);
				var offset = $(self.editor.container).offset();
				pos.pageX -= offset.left;
				pos.pageY -= offset.top;

				if (document.getElementById('label_'+userId)) {
					el = document.getElementById('label_'+userId);
				} else {
					el = document.createElement('span');
					el.id = 'label_'+userId;
					el.innerHTML = name;
					el.className = 'other_cursor';
				}

				el.style.top = pos.pageY - 14 + "px";
				el.style.left = pos.pageX + "px";
				el.style.backgroundColor = color;

				$(self.editor.container).closest('.editor').append(el);
				//fade after a few seconds
				clearTimeout(self.timeouts[userId]);
				self.timeouts[userId] = setTimeout(
					function(){
						$(el).fadeOut(500, function() { $(this).remove(); });
					}, 2000);
			}
		}
		this.firebaseOn_(this.ref_, 'child_added', updateChild);
		this.firebaseOn_(this.ref_, 'child_changed', updateChild);
		this.firebaseOn_(this.ref_, 'child_moved', updateChild);
		this.firebaseOn_(this.ref_, 'child_removed', function(removedSnapshot) {
			var userId = JSON.parse(removedSnapshot.key);
			console.log('remove ' + userId);

			//FIXME remove button
			$('#button_' + userId).remove();

			delete self.users[userId];
			
			if (!self.users.length) {
				$('#chatButton').addClass('ui-state-disabled');
			}
		});
	};

	FirepadUserList.prototype.firebaseOn_ = function(ref, eventType, callback, context) {
		this.firebaseCallbacks_.push({
			ref: ref,
			eventType: eventType,
			callback: callback,
			context: context
		});
		ref.on(eventType, callback, context);
		return callback;
	};

	FirepadUserList.prototype.firebaseOff_ = function(ref, eventType, callback, context) {
		ref.off(eventType, callback, context);
		for(var i = 0; i < this.firebaseCallbacks_.length; i++) {
			var l = this.firebaseCallbacks_[i];
			if(l.ref === ref && l.eventType === eventType && l.callback === callback && l.context === context) {
				this.firebaseCallbacks_.splice(i, 1);
				break;
			}
		}
	};

	FirepadUserList.prototype.removeFirebaseCallbacks_ = function() {
		for(var i = 0; i < this.firebaseCallbacks_.length; i++) {
			var l = this.firebaseCallbacks_[i];
			l.ref.off(l.eventType, l.callback, l.context);
		}
		this.firebaseCallbacks_ = [];
	};
	return FirepadUserList;
})();