define(["ui.tabs.paging","app/tabs_contextmenu", "app/prompt", "app/lang", "app/site", "app/modes"], function () {
var tabs_contextmenu = require('app/tabs_contextmenu');
var prompt = require('app/prompt');
var lang = require('app/lang').lang;
var modes = require('app/modes').modes;

function save(tab, callback) {
    tab = $(tab);

    console.log('save');

    var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);
    var editor = ace.edit(panel.children('div')[0]);

    if(!editor){
        console.error('editor instance not found');
        return false;
    }

    var content = editor.getValue();

    if(!tab.data("site") || !tab.data("file")) {
        saveAs(tab, callback);
    }

    $.post("/api/files?cmd=save&site="+tab.data("site")+"&file="+tab.data("file"), {
        content: content,
    }, function(data){
        //console.log(data);

        if (data.success) {
            //trigger event save
            //tab.parent('div').trigger('save', [tab]);

            setEdited(tab, false);

            if (callback) {
                callback(tab);
            }
        } else {
            prompt.alert(lang.failedText, 'Error saving file' + ': ' + data.error);
        }
    }, 'json').fail(function() {
		prompt.alert(lang.failedText, 'Error saving file');
    });
}

function saveAs(tab, callback) {
    console.log('save as');

    prompt.prompt({
		title: lang.saveChangesText,
		msg: 'Save as: '+$(ui.tab).data('file'),
		buttons: 'YESNOCANCEL',
		fn: function (btn, value) {
			if (btn == "ok") {
			    //TODO check if filename exists

            	tab.data(file, value);
            	tab.attr('data-file', file);

                var site = require('app/site');
            	var siteId = site.active();

            	if(!siteId) {
            	    prompt.alert('Error', 'No site selected');
            	    return false;
            	}

            	tab.data(site, siteId);
            	tab.attr('data-site', siteId);

			    //save
			    saveAs(tab, callback);
			} else if (btn == 'cancel') {
			    //focus editor
			}
		}
    });

    /*
    if (callback) {
        callback(tab);
    }
    */
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
				    save(ui.tab, function(tab) {
				        var index = $(tab).index();
				        $(tabpanel).tabs('remove', index);
				    });
				} else if (btn == 'no') {
				    //remove
				    setEdited(ui.tab, false);
				    close(ui.tab);
				} else if (btn == 'cancel') {
				    //focus editor
				}
			}
        });
        return false;
    }
}

function close (tab) {
    var tabpanel = $(tab).closest(".ui-tabs");
    var index = $(tab).index();
    $(tabpanel).tabs('remove', index);
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

return {
    setEdited: setEdited,
    save: save,
    saveAs: saveAs,
    init: init
};

});