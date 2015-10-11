define(["jquery-ui","app/prompt", "app/tree", "app/storage", "ui.combobox"], function () {
var prompt = require('app/prompt');
var tree = require('app/tree');
var storage = require('app/storage');

var sites = [];
var currentSite = storage.get('currentSite');

var combobox;

function init() {
    combobox = $( "#sites" ).combobox({
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
}

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
            }

            return sites;
        });
}

return {
    init: init,
    load: load
};

});