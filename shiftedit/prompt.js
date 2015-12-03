define(['app/util'], function (util) {
    function alert(options) {
        $( "#dialog-message" ).remove();

        $( "body" ).append('<div id="dialog-message" title="'+options.title+'">\
  <p>\
    '+options.msg+'\
  </p>\
</div>');

        $( "#dialog-message" ).dialog({
            modal: true,
            close: function( event, ui ) {
                $( this ).remove();
            },
            buttons: {
                Ok: function() {
                    $( "#dialog-message" ).remove();
                }
            },
            width: options.width,
            height: options.height
        });
    }

    function confirm(options) {
        $( "#dialog-confirm" ).remove();

        $( "body" ).append('<div id="dialog-confirm" title="'+options.title+'">\
  <p>\
    <span class="ui-icon ui-icon-circle-check" style="float:left; margin:0 7px 50px 0;"></span>\
    '+options.msg+'\
  </p>\
</div>');

        $( "#dialog-confirm" ).dialog({
            modal: true,
            close: function( event, ui ) {
                $( this ).remove();
            },
            buttons: {
                Yes: function() {
                    $( this ).dialog( "close" );
                    options.fn('yes');
                },
                No: function() {
                    $( this ).dialog( "close" );
                    options.fn('no');
                },
                Cancel: function() {
                    $( this ).dialog( "close" );
                    options.fn('cancel');
                }
            }
        });
    }

    function prompt(options) {
        var defaults = {
            title: '',
            msg: '',
            value: ''
        };

        options = $.extend({}, defaults, options);

        //create dialog markup
        var inputType = options.password ? 'password' : 'text';

        $( "body" ).append('<div id="dialog-prompt" title="'+options.title+'">\
  <form>\
      <label for="name">'+options.msg+'</label>\
      <input type="'+inputType+'" name="input" id="input" value="'+options.value+'" class="text ui-widget-content ui-corner-all" required>\
 \
      <!-- Allow form submission with keyboard without duplicating the dialog button -->\
      <input type="submit" tabindex="-1" style="position:absolute; top:-1000px">\
  </form>\
</div>');

        //select filename before dot
        $('#input').focus(util.selectFilename);

        //handle buttons/ submit
        function ok() {
            var value = $('#input').val();
            $( this ).dialog( "close" );

            options.fn('ok', value);
        }
        $( "#dialog-prompt" ).submit(ok);

        //open dialog
        var dialog = $( "#dialog-prompt" ).dialog({
            modal: true,
            close: function( event, ui ) {
                $( this ).remove();
            },
            buttons: {
                OK: ok,
                Cancel: function() {
                    $( this ).dialog( "close" );
                    options.fn('cancel');
                }
            }
        });

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