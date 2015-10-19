define(["jquery.menubar"], function () {
    var context;

    function build(el, menu){
        //var panel = $(el).closest("[role=tabpanel]");
        //var tab = $("[role=tab][aria-controls="+panel.attr('id')+"]");

        for(var i in menu) {
            if(menu[i]==='-') {
                el.append('<li>-</li>');
            }else{
                var tooltip = menu[i].tooltip ? menu[i].tooltip : '';

                var item = $('<li>\
                    <a href="#'+i+'" title="'+tooltip+'">'+menu[i].text+'</a>\
                </li>').appendTo(el);

                if(menu[i].disabled) {
                    item.addClass('ui-state-disabled');
                }

                if(menu[i].name) {
                    item.attr('data-name', menu[i].name);
                }

                if(menu[i].target) {
                    item.attr('data-target', menu[i].target);
                }

                if(menu[i].match) {
                    item.attr('data-match', menu[i].match);
                }

                if(menu[i].handler) {
                    item.children('a').click(jQuery.proxy(menu[i].handler, undefined, context));
                }

                if(menu[i].cls) {
                    item.addClass(menu[i].cls);
                }

                if(menu[i].group) {
                    item.children('a').prepend('<input type="radio">');
                }else if(typeof menu[i].checked === "boolean") {
                    item.children('a').prepend('<input type="checkbox">');
                }

                if(typeof menu[i].items === 'object'){
                    var submenu = $('<ul></ul').appendTo(item);
                    build(submenu, menu[i].items);
                }
            }
        }
    }

    function create(el, menu, contextEl){
        context = contextEl;

        build(el, menu);

        function select(event, ui) {
            console.log("Selected: " + ui.item.text());
        }
        $(el).menubar({
            autoExpand: true,
            menuIcon: true,
            buttons: false,
            //position: {
            //    within: $("#demo-frame").add(window).first()
            //},
            //select: select
        });
    }

    return {
        create: create
    };
});