define(['app/editor', 'exports', "ui.tabs.paging","app/tabs_contextmenu", "app/prompt", "app/lang", "app/site", "app/modes", "app/loading", 'app/util'], function (editor,exports) {
var tabs_contextmenu = require('app/tabs_contextmenu');
var prompt = require('app/prompt');
var site = require('app/site');
var loading = require('app/loading');
var util = require('app/util');
var lang = require('app/lang').lang;
var modes = require('app/modes').modes;
var closing = [];
var saving = {};
var opening = [];

function get_editor(tab) {
    tab = $(tab);
    var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);

    if(panel.children('div.editor').length) {
        return ace.edit(panel.children('div.editor')[0]);
    }

    return false;
}

function open(file, siteId) {
    var options = site.getAjaxOptions("/api/files?site="+siteId);
    var type = util.fileExtension(file);

    var ajax;
	if (!loading.start('Opening ' + file, function(){
		console.log('abort opening files');
		ajax.abort();
		opening = [];
	})) {
		opening = [];
		return;
	}

	ajax = $.ajax(options.url+'&cmd=open&file=' + file, {
	    method: 'POST',
	    dataType: 'json',
	    data: options.params,
        success: function (data) {
		    //console.log(d);

			if(data && typeof type !== 'undefined') {
			    if (!data.success) {
			        prompt.alert(lang.failedText, 'Error opening file' + ': ' + data.error);
			    } else {
    				$('#data .content').hide();
    				switch(type) {
    					case 'text':
    					case 'txt':
    					case 'md':
    					case 'htaccess':
    					case 'log':
    					case 'sql':
    					case 'php':
    					case 'js':
    					case 'json':
    					case 'css':
    					case 'html':
    						//console.log('load');
    						editor.create(file, data.content, options.site);

    						/*
    						var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);
    						var editor = ace.edit(panel.children('div')[0]);
    						editor.setTheme("ace/theme/monokai");
    						editor.getSession().setMode("ace/mode/php");
    						editor.getSession().getDocument().setValue(d.content);
    						*/
    					break;
    					case 'png':
    					case 'jpg':
    					case 'jpeg':
    					case 'bmp':
    					case 'gif':
    						//$('#data .image img').one('load', function () { $(this).css({'marginTop':'-' + $(this).height()/2 + 'px','marginLeft':'-' + $(this).width()/2 + 'px'}); }).attr('src',d.content);
    						//$('#data .image').show();
						break;
    					default:
    						//$('#data .default').html(d.content).show();
						break;
    				}
			    }
			}
		}
	}, 'json').fail(function() {
		prompt.alert(lang.failedText, 'Error opening file');
    })
    .always(function () {
        loading.stop();
    });
}

function save(tab, callback) {
    saving[tab.attr('id')] = tab;
    saveFiles(callback);
}

function saveFiles(callback) {
    if (!Object.keys(saving).length)
        return;

    var tab = saving[Object.keys(saving)[0]];

    console.log('save');

    var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);
    var editor = get_editor(tab);

    if(!editor){
        console.error('editor instance not found');
        return false;
    }

    var file = tab.data("file");
    var content = editor.getValue();

    if(!tab.data("site") || !tab.data("file")) {
        saveAs(tab, callback);
        return;
    }

    var options = site.getAjaxOptions("/api/files?site="+tab.data("site"));

    var params = options.params;
    params.content = content;

    var ajax;
	if (!loading.start('Saving ' + file, function(){
		console.log('abort saving files');
		ajax.abort();
		saving = {};
	})) {
        saving[tab.attr('id')] = tab;
		console.log('queued save: ' + file);
		return;
	}

	ajax = $.ajax(options.url+"&cmd=save&file="+file, {
	    method: 'POST',
	    dataType: 'json',
	    data: params,
        content: content,
        success: function(data) {
            loading.stop();
            //console.log(data);

            if (data.success) {
                //trigger event save
                //tab.parent('div').trigger('save', [tab]);

                setEdited(tab, false);

console.log(saving);
                //continue with next save
                delete saving[tab.attr('id')];

                if (Object.keys(saving).length) {
                    saveFiles(callback);
                }else if (callback) {
                    callback(tab);
                }
            } else {
                prompt.alert(lang.failedText, 'Error saving file' + ': ' + data.error);
                saving = {};
            }
        }
    }).fail(function() {
        loading.stop();
		prompt.alert(lang.failedText, 'Error saving file');
		saving = {};
    });
}

function saveAs(tab, callback) {
    console.log('save as');

    prompt.prompt({
		title: lang.saveChangesText,
		msg: 'Save as:',
		value: tab.attr('data-file'),
		buttons: 'YESNOCANCEL',
		fn: function (btn, file) {
			if (btn == "ok") {
			    //TODO check if filename exists

            	tab.data('file', file);
            	tab.attr('data-file', file);
	            tab.attr('title', file);

                var site = require('app/site');
            	var siteId = site.active();

            	if(!siteId) {
            	    prompt.alert('Error', 'No site selected');
            	    return false;
            	}

            	tab.data(site, siteId);
            	tab.attr('data-site', siteId);

			    //save
			    save(tab, callback);
			} else if (btn == 'cancel') {
			    //focus editor
			    var editor = get_editor(tab);
			    editor.focus();
			}
		}
    });

    /*
    if (callback) {
        callback(tab);
    }
    */
}

function saveAll(tab, callback) {
    var tabs = $(tab).parent().children('li:not(.button)');
    tabs.forEach(function(item){
        saving[tab.attr('id')] = tab;
    });
    saveFiles();
}

function setEdited(tab, edited) {
    var value = edited ? 1 : 0;

    tab = $(tab);
	tab.data("edited", value);
	tab.attr('data-edited', value);

	if(edited) {
	    //change title
	    tab.children('.ui-tabs-anchor').text(tab.data('file')+'*');
	} else {
	    //change title
	    tab.children('.ui-tabs-anchor').text(tab.data('file'));
	}
}

function checkEdited (e, ui) {
    var tabpanel = this;

    if($(ui.tab).data('edited')) {
        prompt.confirm({
			title: lang.saveChangesText,
			msg: 'Save changes to: '+$(ui.tab).data('file'),
			buttons: 'YESNOCANCEL',
			fn: function (btn) {
				if (btn == "yes") {
				    //save
				    save(ui.tab, close);
				} else if (btn == 'no') {
				    //remove
				    setEdited(ui.tab, false);
				    close(ui.tab);
				} else if (btn == 'cancel') {
				    //focus editor
				    closing = [];
				}
			}
        });
        return false;
    }else{
        if($(ui.tab).attr('aria-selected')) {
            document.title = 'ShiftEdit';
        }

	    if(closing.length) {
	        closing.splice(0, 1);
	        close(closing[0]);
	    }
    }
}

function close (tab) {
    var tabpanel = $(tab).closest(".ui-tabs");
    var index = $(tab).index();
    $(tabpanel).tabs('remove', index);
}

function closeAll (tab) {
    closing = $(tab).parent().children('li:not(.button)');
    close(closing[0]);
}

function closeTabsRight (tab) {
    closing = $(tab).nextAll('li:not(.button)');
    close(closing[0]);
}

function newTab (e, ui) {
    //show new tab page
    var tab = $(ui.tab);
    if(!tab.attr('data-newtab')){
        return;
    }

    var editor = require('app/editor');

    var panel = $(ui.panel);

    panel.append('\
			<div class="newTab">\
				<div class="column" style="display:block; width:25%; float:left;">\
					<h5>Create</h5>\
					<ul class="fileTypes"></ul>\
				</div>\
				<div class="column" style="display:block; width:25%; float:left; margin:10px;">\
					<h5>Recent</h5>\
					<ul class="recentFiles"></ul>\
				</div>\
				<div class="column" style="display:block; width:25%; float:left; margin:10px;">\
					<h5>Other</h5>\
					<ul class="other">\
					    <li><a href="#">New Site</a></li>\
						<li><a href="#" class="preview">Preview</a></li>\
						<li><a href="#" class="ssh">SSH</a></li>\
					</ul>\
				</div>\
			</div>\
		');

	var HTML = '';

	for (var i in modes) {
		if (modes.hasOwnProperty(i)) {
			HTML += '<li class="'+modes[i][0]+'">  <a href="#" data-filetype="'+modes[i][2][0]+'" class="newfile file-' + modes[i][2][0] + '">' + modes[i][1] + '</a></li>';
		}
	}

	panel.find('ul.fileTypes').append(HTML);

	panel.find('a.newfile').click(function(){
		editor.create("untitled."+this.dataset.filetype, '');
		close(ui.tab);
	});

    $(this).trigger("tabsactivate", [{newTab:ui.tab}]);
}

function tabActivate( tab ) {
    var file = tab.data('file');
    var title = file ? file : 'ShiftEdit';
    document.title = title;

    var editor = get_editor(tab);

    if (editor)
        editor.focus();
}

function init() {
    tabs_contextmenu.init();

    // TABS - sortable
    $( ".ui-layout-west" ).tabs();
    var tabs = $( ".ui-layout-east, .ui-layout-center, .ui-layout-south" ).tabs({closable: true, addTab:true});

    //console.log(tabs);

    // initialize paging
    $('.ui-layout-west, .ui-layout-east, .ui-layout-center, .ui-layout-south').tabs('paging', {nextButton: '&gt;', prevButton: '&lt;' });
    $('.ui-layout-west, .ui-layout-east, .ui-layout-center, .ui-layout-south').on('tabsbeforeremove', checkEdited);
    $('.ui-layout-west, .ui-layout-east, .ui-layout-center, .ui-layout-south').on('tabsadd', newTab);

    $( ".ui-layout-center" ).on( "tabsactivate", function(e, ui){ tabActivate($(ui.newTab)); } );

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
}

    exports.setEdited = setEdited;
    exports.save = save;
    exports.saveAs = saveAs;
    exports.saveAll = saveAll;
    exports.init = init;
    exports.close = close;
    exports.closeAll = closeAll;
    exports.closeTabsRight = closeTabsRight;
    exports.open = open;
});