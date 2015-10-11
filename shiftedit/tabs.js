define(function (require) {
var tabs_contextmenu = require('./tabs_contextmenu');

// TABS - sortable
$( ".ui-layout-west" ).tabs();
var tabs = $( ".ui-layout-east, .ui-layout-center, .ui-layout-south" ).tabs({closable: true, addTab:true});

// initialize paging
$('.ui-layout-west, .ui-layout-east, .ui-layout-center, .ui-layout-south').tabs('paging', {nextButton: '&gt;', prevButton: '&lt;' });

//connected sortable (http://stackoverflow.com/questions/13082404/multiple-jquery-ui-tabs-connected-sortables-not-working-as-expected)
tabs.find( ".ui-tabs-nav" ).sortable({
    connectWith: '.ui-tabs-nav',
    receive: function (event, ui) {
        var receiver = $(this).parent(),
            sender = $(ui.sender[0]).parent(),
            tab = ui.item[0],
            tab$ = $(ui.item[0]),
        // Find the id of the associated panel
            panelId = tab$.attr( "aria-controls" ),
            insertBefore = document.elementFromPoint(event.pageX,event.pageY);

        tab$ = $(tab$.removeAttr($.makeArray(tab.attributes).
                      map(function(item){ return item.name;}).
                      join(' ')).remove());
        tab$.find('a').removeAttr('id tabindex role class');
        //console.log(insertBefore, tab);
        //console.log(insertBefore.parentElement == tab);
        if(insertBefore.parentElement == tab){
            insertBefore = document.elementFromPoint(event.pageX + insertBefore.offsetWidth, event.pageY);
            //console.log('ins', insertBefore);
        }
        //console.log($(insertBefore).closest('li[role="tab"]').get());
        insertBefore = $(insertBefore).closest('li[role="tab"]').get(0);
        //console.log(insertBefore);
        if(insertBefore)
            tab$.insertBefore(insertBefore);
        else
            $(this).append(tab$);

        $($( "#" + panelId ).remove()).appendTo(receiver);
        tabs.tabs('refresh');
    },

    //don't drag "add tab" button
    items: "li:not(.button)",
    //allow dragging out of panel Adam Jimenez
    sort: function(e, ui) {
        ui.item.appendTo(document.body);
    }
});

return {
};

});