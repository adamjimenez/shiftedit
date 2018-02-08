define(['jquery'], function () {

	var final_transcript = '';
	var time = new Date().getTime();

	if (!('webkitSpeechRecognition' in window)) {
		console.log('Speech is not supported');
		return false;
	}else{
		var recognition = new webkitSpeechRecognition();
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.onstart = function () {
			recognizing = true;
			console.log('ready for speech');
		};
		recognition.onerror = function (event) {
			if (event.error == 'no-speech') {
				console.log('no speech');
				//ignore_onend = true;
			}
			if (event.error == 'audio-capture') {
				console.log('no microphone');
				//ignore_onend = true;
			}
			if (event.error == 'not-allowed') {
				if (event.timeStamp - start_timestamp < 100) {
				console.log('speech blocked');
				} else {
				console.log('speech denied');
				}
				//ignore_onend = true;
			}
			console.log('speech error: '+event.error);
		};
		recognition.onend = function () {
			recognizing = false;
			console.log('speech ended');

			/*
			if (ignore_onend) {
				return;
			}
			if (!final_transcript) {
				console.log('speech start')
				return;
			}
			*/
		};
		recognition.onresult = function (event) {
			var interim_transcript = '';
			if (typeof (event.results) == 'undefined') {
				recognition.onend = null;
				recognition.stop();
				console.log('speech upgrade required');
				return;
			}

			//console.log(event.results);
			/*
			for (var i = event.resultIndex; i < event.results.length; ++i) {
				if (event.results[i].isFinal) {
					final_transcript += event.results[i][0].transcript;
				} else {
					interim_transcript += event.results[i][0].transcript;
				}
			}*/

			var lastResult = event.results[event.results.length-1];

			interim_transcript = lastResult[0].transcript;

			//console.log('Final: '+final_transcript);
			console.log('Interim: '+interim_transcript);

			$('#speechField').val(interim_transcript+'..');

			if( !lastResult.isFinal ){
				return;
			}

			if( !interim_transcript ){
				return;
			}

			var new_time = new Date().getTime();

			//prevent repeat commands
			if( new_time - 2000 < time ){
				console.log('prevented repeat command: '+interim_transcript);
				return;
			}

			time = new_time;

			interim_transcript = interim_transcript.trim();

			var commands = [{
				text: 'notes',
				fn: function(){
					shiftedit.app.notes.open();
				}
			},{
				text: 'find',
				fn: function(){
					shiftedit.app.find.open();
				}
			},{
				text: 'snippets',
				fn: function(){
					shiftedit.app.snippets.open();
				}
			},{
				text: 'functions',
				fn: function(){
					shiftedit.app.functions.open();
				}
			},{
				text: 'save',
				fn: function(){
					shiftedit.app.tabs.save();
				}
			},{
				text: 'close',
				fn: function(){
					if( document.getElementById('shortcutsSheet') ){
						shiftedit.app.shortcuts.close();
					}else{
						shiftedit.app.tabs.close();
					}
				}
			},{
				text: 'new',
				fn: function(){
					shiftedit.app.tabs.newFile();
				}
			},{
				text: 'new css',
				fn: function(){
					shiftedit.app.tabs.newFile('css');
				}
			},{
				text: 'new html',
				fn: function(){
					shiftedit.app.tabs.newFile('html');
				}
			},{
				text: 'new php',
				fn: function(){
					shiftedit.app.tabs.newFile('php');
				}
			},{
				text: 'new javascript',
				fn: function(){
					shiftedit.app.tabs.newFile('js');
				}
			},{
				text: 'next',
				fn: function(){
					shiftedit.app.tabs.tabNext();
				}
			},{
				text: 'previous',
				fn: function(){
					shiftedit.app.tabs.tabPrev();
				}
			},{
				text: 'help',
				fn: function(){
					shiftedit.app.shortcuts.show();
				}
			},{
				text: 'strong',
				fn: function(){
					shiftedit.app.tabs.get_editor().strong();
				}
			},{
				text: 'break',
				fn: function(){
					shiftedit.app.tabs.get_editor().br();
				}
			},{
				text: 'select all',
				fn: function(){
					shiftedit.app.tabs.get_editor().selectAll();
				}
			},{
				text: /go\s*to line (\d+)/,
				fn: function(){
					console.log('line '+RegExp.$1);
					shiftedit.app.tabs.get_editor().gotoLine(RegExp.$1);
				}
			}];

			//check for commands
			var command_found = false;

			$.each(commands, function (command) {
				if(
					command.text == interim_transcript ||
					(
						typeof command.text == 'object' &&
						command.text.test(interim_transcript)
					)
				 ){
					command_found = true;
					command.fn();
					return;
				}
			});

			if( !command_found ){
				interim_transcript += '??';
			}

			$('#speechField').val(interim_transcript);
		};
	}

	if( $('#toggleSpeech') ){
		$('#toggleSpeech').click(function (button, pressed) {
			if( !recognition ){
				prompt.alert({title: lang.failedText, msg: 'Speech is not supported in your browser - try Chrome'});
				return false;
			}

			if( pressed ){
				//final_transcript = '';
				recognition.lang = 'en-GB';
				recognition.start();
				//ignore_onend = false;
				//final_span.innerHTML = '';
				//interim_span.innerHTML = '';
				//showInfo('info_allow');
				//showButtons('none');
				start_timestamp = event.timeStamp;
			}else{
				recognition.stop();
			}
		});
	}

});