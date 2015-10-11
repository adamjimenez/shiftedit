define(["ui.tabs.paging","app/tabs_contextmenu", "app/prompt", "app/site", "app/lang"], function () {
var tabs_contextmenu = require('app/tabs_contextmenu');
var prompt = require('app/prompt');
var site = require('app/site');
var lang = require('app/lang').lang;

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
				    var index = $(ui.tab).index();
				    setEdited(ui.tab, false);
				    $(tabpanel).tabs('remove', index);
				} else if (btn == 'cancel') {
				    //focus editor
				}
			}
        });
        return false;
    }
}

// TABS - sortable
$( ".ui-layout-west" ).tabs();
var tabs = $( ".ui-layout-east, .ui-layout-center, .ui-layout-south" ).tabs({closable: true, addTab:true});

//console.log(tabs);

// initialize paging
$('.ui-layout-west, .ui-layout-east, .ui-layout-center, .ui-layout-south').tabs('paging', {nextButton: '&gt;', prevButton: '&lt;' });

$('.ui-layout-west, .ui-layout-east, .ui-layout-center, .ui-layout-south').on('tabsbeforeremove', checkEdited);

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
    setEdited: setEdited,
    save: save,
    saveAs: saveAs
};

});