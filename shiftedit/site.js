define(["jquery-ui","app/prompt", "app/tree", "app/storage", "ui.combobox", "app/util", "app/ssl"], function () {
var prompt = require('app/prompt');
var tree = require('app/tree');
var storage = require('app/storage');
var lang = require('app/lang').lang;
var util = require('app/util');
var ssl = require('app/ssl');

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
                var options = getAjaxOptions('/api/files?site='+siteId);
                tree.setAjaxOptions(options);
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

function active() {
    return currentSite;
}

function getSettings(siteId) {
    if(!siteId) {
        siteId = currentSite;
    }

    site = false;
    sites.forEach(function(entry) {
        if(entry.id==siteId){
            site = entry;
            return;
        }
    });

    return site;
}

function getAjaxOptions(ajaxUrl) {
    var settings = getSettings();
    var params = {};

    if(settings.server_type == 'AJAX' || settings.turbo == 1) {
        if(settings.turbo){
        	if( settings.web_url ){
        		ajaxUrl = settings.web_url+'shiftedit-proxy.php?ModPagespeed=off';
        	}else{
        		prompt.alert(lang.errorText, 'Missing web URL');
        	}

    		//var prefs = shiftedit.app.get_prefs();

    		//fixme prompt for master password
    		//var pass = prefs.useMasterPassword ? Aes.Ctr.decrypt(settings.ftp_pass, shiftedit.app.storage.get('masterPassword'), 256) : settings.ftp_pass;

    		var pass = settings.ftp_pass;

    		params = {
    			user: settings.ftp_user,
    			pass: util.sha1(pass)
    		};
        }else{
        	ajaxUrl = settings.domain;

        	if( settings.encryption == '1' ){
        		ajaxUrl = 'https://'+ajaxUrl;
        	}else{
        		ajaxUrl = 'http://'+ajaxUrl;
        	}
        }

        if(util.startsWith(ajaxUrl, 'http://') && ssl.check_blocked()){
            prompt.alert('Proxy Blocked', 'Click Shield icon in address bar, then "Load Unsafe Script"');
        }
    }

    return {
        site: settings.id,
        url: ajaxUrl,
        params: params
    }
}

return {
    init: init,
    load: load,
    active: active,
    getSettings: getSettings,
    getAjaxOptions: getAjaxOptions
};

});