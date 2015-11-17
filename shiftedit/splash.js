define(['jquery-ui'], function () {
    $( "#progressbar" ).progressbar({
        value: false
    });

    return {
        update: function(str) {
            $('#splash .status').text(str);
        },
        close: function() {
            $('#splash').fadeOut(300, function() { $(this).remove(); });
        }
    };
});