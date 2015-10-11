define(function (require) {
    function alert(title, message){
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

    return {
        alert: alert
    };
});