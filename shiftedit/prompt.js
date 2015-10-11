define(function (require) {
    function alert(title, message) {
        $( "body" ).append('<div id="dialog-message" title="'+title+'">\
  <p>\
    <span class="ui-icon ui-icon-circle-check" style="float:left; margin:0 7px 50px 0;"></span>\
    '+message+'\
  </p>\
</div>');

        $( "#dialog-message" ).dialog({
            modal: true,
            buttons: {
                Ok: function() {
                    $( this ).dialog( "close" );
                    $( "#dialog-message" ).remove();
                }
            }
        });
    }

    function confirm(options) {
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
                    options.fn('yes');
                    $( this ).dialog( "close" );
                    $( "#dialog-message" ).remove();
                },
                No: function() {
                    options.fn('no');
                    $( this ).dialog( "close" );
                    $( "#dialog-message" ).remove();
                },
                Cancel: function() {
                    options.fn('cancel');
                    $( this ).dialog( "close" );
                    $( "#dialog-message" ).remove();
                }
            }
        });
    }

    function prompt(options) {
        $( "body" ).append('<div id="dialog-message" title="'+options.title+'">\
  <form>\
    <fieldset>\
      <label for="name">'+options.msg+'</label>\
      <input type="text" name="input" id="input" value="'+options.value+'" class="text ui-widget-content ui-corner-all" required>\
 \
      <!-- Allow form submission with keyboard without duplicating the dialog button -->\
      <input type="submit" tabindex="-1" style="position:absolute; top:-1000px">\
    </fieldset>\
  </form>\
</div>');

        $( "#dialog-message" ).dialog({
            modal: true,
            buttons: {
                OK: function() {
                    value = $('#input').val();
                    options.fn('ok', value);
                    $( this ).dialog( "close" );
                    $( "#dialog-message" ).remove();
                },
                Cancel: function() {
                    options.fn('cancel');
                    $( this ).dialog( "close" );
                    $( "#dialog-message" ).remove();
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