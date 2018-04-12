define(['./util', 'jquery-ui-bundle', 'dialogResize'], function (util) {
	function alert(options) {
		var defaults = {
			title: '',
			msg: '',
			value: '',
			placeholder: '',
			width: 300,
			height: 'auto',
			modal: true,
			close: function( event, ui ) {
				$( this ).remove();
			},
			buttons: {
				Ok: function() {
					$( "#dialog-message" ).remove();
				}
			}
		};

		options = $.extend({}, defaults, options);
		
		$( "#dialog-message" ).remove();

		$( "body" ).append('<div id="dialog-message" title="'+options.title+'">\
	<p>\
		'+options.msg+'\
	</p>\
</div>');

		$( "#dialog-message" ).dialogResize(options);
	}

	function confirm(options) {
		var defaults = {
			modal: true,
			close: function( event, ui ) {
				$( this ).remove();
			},
			buttons: {
				Yes: function() {
					$( this ).dialogResize( "close" );
					options.fn('yes');
				},
				No: function() {
					$( this ).dialogResize( "close" );
					options.fn('no');
				},
				Cancel: function() {
					$( this ).dialogResize( "close" );
					options.fn('cancel');
				}
			}
		};

		options = $.extend({}, defaults, options);
		
		$( "#dialog-confirm" ).remove();

		$( "body" ).append('<div id="dialog-confirm" title="'+options.title+'">\
	<p>\
		<span class="ui-icon ui-icon-circle-check" style="float:left; margin:0 7px 50px 0;"></span>\
		'+options.msg+'\
	</p>\
</div>');

		$( "#dialog-confirm" ).dialogResize(options);
	}

	function prompt(options) {
		var defaults = {
			title: '',
			msg: '',
			value: '',
			placeholder: '',
			type: 'text',
			modal: true,
			close: function( event, ui ) {
				$( this ).remove();
			},
			buttons: {
				OK: ok,
				Cancel: function() {
					$( this ).dialogResize( "close" );
					options.fn('cancel');
				}
			}
		};
		
		if (!options.msg) {
			defaults.height = 120;
		}

		options = $.extend({}, defaults, options);

		//create dialog markup
		$( "body" ).append('<div id="dialog-prompt" title="'+options.title+'">\
	<form>\
		<div class="vbox">\
			<label for="name">'+options.msg+'</label>\
			<input type="'+options.type+'" name="input" id="input" value="'+options.value+'" placeholder="'+options.placeholder+'" class="flex text ui-widget-content ui-corner-all" required>\
		</div>\
		<!-- Allow form submission with keyboard without duplicating the dialog button -->\
		<input type="submit" tabindex="-1" style="position:absolute; top:-1000px">\
	</form>\
</div>');

		if (options.min) {
			$('#input').attr('min', options.min);
		}

		if (options.max) {
			$('#input').attr('max', options.max);
		}

		if (options.step) {
			$('#input').attr('step', options.step);
		}

		//select filename before dot
		$('#input').focus(util.selectFilename);

		//handle buttons/ submit
		function ok() {
			var value = $('#input').val();
			$( this ).dialogResize( "close" );

			options.fn('ok', value);
		}
		$( "#dialog-prompt" ).submit(ok);

		//open dialog
		var dialog = $( "#dialog-prompt" ).dialogResize(options);

		//ensure focus
		setTimeout(function(){ $('#input').focus(); }, 100);

		//prevent form submit
		form = dialog.find( "form" ).on( "submit", function( event ) {
			event.preventDefault();
			options.fn('yes');
		});
	}

	return {
		alert: alert,
		confirm: confirm,
		prompt: prompt
	};
});