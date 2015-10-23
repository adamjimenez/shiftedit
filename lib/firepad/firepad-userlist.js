var FirepadUserList = (function() {
	function FirepadUserList(ref, userId, displayName, editor) {
		if(!(this instanceof FirepadUserList)) {
			return new FirepadUserList(ref, userId, displayName, editor);
		}
		this.timeouts = {};
		this.ref_ = ref;
		this.userId_ = userId;
		this.firebaseCallbacks_ = [];
		this.users = {};
		var self = this;
		//this.displayName_ = 'Guest ' + Math.floor(Math.random() * 1000);
		this.displayName_ = displayName;
		this.editor = editor;
		this.firebaseOn_(ref.root().child('.info/connected'), 'value', function(s) {
			if(s.val() === true && self.displayName_) {
				var nameRef = ref.child(self.userId_).child('name');
				nameRef.onDisconnect().remove();
				nameRef.set(self.displayName_);
			}
		});
		this.makeUserEntriesForOthers_()
	}

	// This is the primary "constructor" for symmetry with Firepad.
	FirepadUserList.fromDiv = FirepadUserList;

	FirepadUserList.prototype.dispose = function() {
		this.removeFirebaseCallbacks_();
	};

	FirepadUserList.prototype.makeUserEntriesForOthers_ = function() {
		var self = this;

		function updateChild(userSnapshot, prevChildName) {
			var userId = userSnapshot.name();
			//		console.log('changed '+userId);
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
				//console.log('remove ' + userId);

				//FIXME remove button
				//var button = Ext.getCmp('button_' + userId);
				//Ext.getCmp('toolbar').remove(button);
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
			}
			if(userId !== self.userId_ && !$('#button_' + userId).length) {
			    //FIXME add button
			    /*
				Ext.getCmp('toolbar').insert(
				5, {
					text: name,
					id: 'button_' + userId,
					userId: userId,
					handler: Ext.bind(function(button) {
						var editor = tabs.get_editor();

						if( tabs.get_editor().firepad.editorAdapter_.otherCursors ){
							var range = tabs.get_editor().firepad.editorAdapter_.otherCursors[button.userId];
							editor.editor.renderer.scrollToLine(range.start.row, true, true);
						}
						editor.focus();
					}),
					style: {
						backgroundColor: color
					}
				});
				*/
			}

			//cursor label
			var cursor = userSnapshot.child('cursor').val();
			if (cursor != null && userId!==self.userId_ ) {
				var start = cursor.position;
				var end = cursor.selectionEnd;
				//console.log(name + ' '+ color +' moved selection to (' + start + ', ' + end + ')');
				var pos = self.editor.posFromIndex(end);

				pos = self.editor.charCoords(pos.row, pos.column, true);

				if (document.getElementById('label_'+userId)) {
					el = document.getElementById('label_'+userId);
				} else {
					el = document.createElement('span');
					el.id = 'label_'+userId;
					el.style.position = 'absolute';
					el.style.fontSize = '10px';
					el.style.color = '#000';
					el.style.opacity = 0.8;
					el.innerHTML = name;
					el.style.backgroundColor = color;
					el.style.padding = '1px';
					el.style.borderRadius = '1px';
				}

				var container = self.editor.getContainer().parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode; //super hack to display label above first line

				el.style.top = pos.pageY - 14 + container.offsetTop + "px";
				el.style.left = pos.pageX + "px";

				container.parentNode.appendChild(el);

				//disappear after a few seconds
				//FIXME what does this do?
				/*
				clearTimeout(self.timeouts[userId]);
				self.timeouts[userId] = setTimeout(
					function(){
						Ext.get(el).fadeOut({
							opacity: 0, //can be any value between 0 and 1 (e.g. .5)
							easing: 'easeOut',
							duration: 500,
							remove: true
						});
					}
				, 2000);
				*/
			}
		}
		this.firebaseOn_(this.ref_, 'child_added', updateChild);
		this.firebaseOn_(this.ref_, 'child_changed', updateChild);
		this.firebaseOn_(this.ref_, 'child_moved', updateChild);
		this.firebaseOn_(this.ref_, 'child_removed', function(removedSnapshot) {
			//this never gets fired?
			var userId = removedSnapshot.name();
			console.log('remove ' + userId);

			//FIXME remove button
			/*
			var button = Ext.getCmp('button_' + userId);
			Ext.getCmp('toolbar').remove(button);
			*/

			delete self.users[userId];
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