define(function (require) {
var prompt = require('./prompt');
var tree = require('./tree');
var storage = require('./storage');

var sites = [];
var currentSite = storage.get('currentSite');

var combobox = $( "#sites" ).combobox({
    select: function (event, ui) {
        //connect to site
        open(ui.item.value);
    },
    change: function (event, ui) {
        //connect to site
        open(ui.item.value);
    },
    create: function( event, ui ) {
        load();
    }
});

$( "#refresh_site" ).button({
    icons: {
       primary: "ui-icon-refresh"
    },
    text: false
})
.click(function() {
    tree.refresh();
});

function open(siteId) {
    currentSite = null;

    return $.getJSON('/api/sites?site='+siteId)
        .then(function (data) {
            //console.log(data);

            if(data.success){
                currentSite = siteId;
                storage.set('currentSite', currentSite);

                //load file tree
                tree.open(siteId);
            }else{
                prompt.alert('Error', data.error);
            }
        });
}

function load() {
    return $.getJSON('/api/sites')
        .then(function (data) {
            sites = data.sites;

            $( "#sites" ).children('option').remove();

            $.each(sites, function( index, site ) {
                $( "#sites" ).append( '<option value="'+site.id+'">'+site.name+'</option>' );
            });

            if(currentSite){
                    $( "#sites" ).val(currentSite).change();

                    //$( "#sites" ).focus().val(currentSite);
                    //$( "#sites" ).combobox('close');
            }

            return sites;
        });
}

return {
    load: load
};

});