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
            buttons: {
                Ok: function() {
                    $( this ).dialog( "close" );
                    $( "#dialog-message" ).remove();
                }
            },
            width: options.width,
            height: options.height
        });
    }

    function confirm(options) {
        $( "#dialog-message" ).remove();

        $( "body" ).append('<div id="dialog-message" title="'+options.title+'">\
  <p>\
    <span class="ui-icon ui-icon-circle-check" style="float:left; margin:0 7px 50px 0;"></span>\
    '+options.msg+'\
  </p>\
</div>');

        $( "#dialog-message" ).dialog({
            modal: true,
            buttons: {
                Yes: function() {
                    $( this ).dialog( "close" );
                    $( "#dialog-message" ).remove();
                    options.fn('yes');
                },
                No: function() {
                    $( this ).dialog( "close" );
                    $( "#dialog-message" ).remove();
                    options.fn('no');
                },
                Cancel: function() {
                    $( this ).dialog( "close" );
                    $( "#dialog-message" ).remove();
                    options.fn('cancel');
                }
            }
        });
    }

    function prompt(options) {
        //remove any other dialog
        $( "#dialog-message" ).remove();

        //create dialog markup
        var inputType = options.password ? 'password' : 'text';

        $( "body" ).append('<div id="dialog-message" title="'+options.title+'">\
  <form>\
    <fieldset>\
      <label for="name">'+options.msg+'</label>\
      <input type="'+inputType+'" name="input" id="input" value="'+options.value+'" class="text ui-widget-content ui-corner-all" required>\
 \
      <!-- Allow form submission with keyboard without duplicating the dialog button -->\
      <input type="submit" tabindex="-1" style="position:absolute; top:-1000px">\
    </fieldset>\
  </form>\
</div>');

        //select filename before dot
        $('#input').focus(util.selectFilename);

        //handle buttons/ submit
        function ok() {
            var value = $('#input').val();
            $( this ).dialog( "close" );
            $( "#dialog-message" ).remove();

            options.fn('ok', value);
        }
        $( "#dialog-message" ).submit(ok);

        //open dialog
        $( "#dialog-message" ).dialog({
            modal: true,
            buttons: {
                OK: ok,
                Cancel: function() {
                    $( this ).dialog( "close" );
                    $( "#dialog-message" ).remove();

                    options.fn('cancel');
                }
            }
        });
    }

    return {
        alert: alert,
        confirm: confirm,
        prompt: prompt
    };
});