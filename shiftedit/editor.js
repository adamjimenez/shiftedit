define(['jquery','ace','app/tabs'], function () {
    var tabs = require('app/tabs');

    function onChange(e) {
		tabs.setEdited(this, true);
    }

    function create(file, content, siteId) {
        //check if file already open
        var index = $(".ui-layout-center li[data-file='"+file+"'][data-siteId='"+siteId+"']").index();
        if(index!==-1){
            $(".ui-layout-center").tabs("option", "active", index);
            return;
        }

        //create tab
		tab = $(".ui-layout-center").tabs('add', file, '<div></div>');
		tab.data(file, file);
		tab.attr('data-file', file);

		if(siteId) {
		    tab.data('site', siteId);
		    tab.attr('data-site', siteId);
		}

		//load ace
		var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);
		var editor = ace.edit(panel.children('div')[0]);
		editor.setTheme("ace/theme/monokai");
		editor.getSession().setMode("ace/mode/php");
		editor.getSession().getDocument().setValue(content);

		editor.getSession().doc.on('change', jQuery.proxy(onChange, tab));

		//shortcuts
		//save
		editor.commands.addCommand({
			name: "save",
			bindKey: {
				win: "Ctrl-S",
				mac: "Command-S",
				sender: "editor"
			},
			exec: jQuery.proxy(function (editor, args, request) {
				return tabs.save(this);
			}, tab)
		});

		//move cursor to top
    	var startLine = 0;

    	editor.selection.setSelectionRange({
    		start: {
    			row: startLine,
    			column: 0
    		},
    		end: {
    			row: startLine,
    			column: 0
    		}
    	});

		editor.focus();
    }

    return {
        create: create
    };
});