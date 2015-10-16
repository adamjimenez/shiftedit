define(["jquery-ui","app/prompt", "app/tree", "app/storage", "ui.combobox", "app/util", "app/ssl", "app/loading"], function () {
var prompt = require('app/prompt');
var tree = require('app/tree');
var storage = require('app/storage');
var lang = require('app/lang').lang;
var util = require('app/util');
var ssl = require('app/ssl');
var loading = require('app/loading');

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

function open(siteId, password) {
    currentSite = null;

    var site = getSettings(siteId);

	if (!loading.start('Connecting to site '+site.name, function(){
		console.log('abort opening site');
		ajax.abort();
		opening = {};
	})) {
		console.log('in queue');
		return;
	}

    var ajax = $.ajax({
        url: '/api/sites?site='+siteId,
	    method: 'POST',
	    dataType: 'json',
	    data: {
	        password: password,
	        save_password: 1
	    }
    })
    .then(function (data) {
        loading.stop();
        //console.log(data);

        if(data.success){
            currentSite = siteId;
            storage.set('currentSite', currentSite);

            //load file tree
            var options = getAjaxOptions('/api/files?site='+siteId);
            tree.setAjaxOptions(options);
        }else{
            if (data.require_password) {
    			loading.stop();

        		password = site.ftp_pass;

        		/*
        		if (prefs.useMasterPassword) {
        			if (password) {
        				password = (Aes.Ctr.decrypt(password, shiftedit.app.storage.get('masterPassword'), 256));
        			}
        		}
        		*/

    			prompt.prompt({
    			    title: 'Require server password for '+site.name,
    			    msg: lang.passwordText,
    			    value: password,
    			    password: true,
    			    fn: function(btn, password) {
    			        switch(btn) {
    			            case 'ok':
                                /*
    							var prefs = prefs.get_prefs();
    							if (prefs.useMasterPassword) {
    								if (params.password) {
    									params.password = Aes.Ctr.encrypt(params.password, storage.get('masterPassword'), 256);
    								}
    							}
    							*/

    							open(siteId, password);
			                break;
    			        }
    			    }
    			});

                /*
				var formPassword;
				var passwordWin = new Ext.Window({
					id: 'passwordWin',
					title: 'Require server password for '+settings.name,
					layout: 'fit',
					width: 400,
					height: 150,
					minWidth: 400,
					minHeight: 150,
					closeAction: 'destroy',
					plain: true,
					modal: true,
					items: formPassword = new Ext.FormPanel({
						bodyStyle: 'padding:5px;border:0',
						items: [{
							xtype: 'textfield',
							inputType: 'password',
							fieldLabel: lang.passwordText,
							name: 'password',
							id: 'password',
							allowBlank: false,
							anchor: '98%',
							style: 'width:100%',
							value: password,
							listeners: {
								specialkey: function (field, e) {
									if (e.getKey() == e.ENTER) {
										var passwordButton = Ext.getCmp("passwordButton");
										passwordButton.handler.call(passwordButton, passwordButton.scope, Ext.EventObject);
									}
								}
							}
						}, {
							xtype: 'checkbox',
							inputType: 'checkbox',
							fieldLabel: lang.savePasswordText,
							name: 'save_password',
							id: 'save_password',
							value: 1,
							inputValue: 1,
							checked: settings.ftp_pass ? true : false
						}]
					}),
					buttons: [{
						id: 'passwordButton',
						text: 'OK',
						handler: function () {
							var params = formPassword.getForm().getValues();
							var settings = _this.get_settings();

							var prefs = shiftedit.app.get_prefs();
							if (prefs.useMasterPassword) {
								if (params.password) {
									params.password = Aes.Ctr.encrypt(params.password, shiftedit.app.storage.get('masterPassword'), 256);
								}
							}

							//settings.ftp_pass = params.password;

							Ext.getCmp('passwordWin').close();
							shiftedit.app.loading.start('Connecting');
							shiftedit.app.site.open(tree, sites.getValue(), params, request.params.file);
						}
					}, {
						text: lang.cancelText,
						handler: function () {
							openingFile = null;
							Ext.getCmp('passwordWin').close();
						}
					}]
				});
				*/
            }else{
                prompt.alert('Error', data.error);
            }
        }
    }).fail(function() {
        loading.stop();
		prompt.alert(lang.failedText, 'Error opening site');
    });

    return ajax;
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
    };
}

return {
    init: init,
    load: load,
    active: active,
    getSettings: getSettings,
    getAjaxOptions: getAjaxOptions
};

});