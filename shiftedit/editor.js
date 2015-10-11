define(['jquery','ace'], function () {
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
		tab.data(siteId, siteId);

		//update dom
		tab.attr('data-file', file);
		tab.attr('data-siteId', siteId);

		//load ace
		var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);
		var editor = ace.edit(panel.children('div')[0]);
		editor.setTheme("ace/theme/monokai");
		editor.getSession().setMode("ace/mode/php");
		editor.getSession().getDocument().setValue(content);
    }

    return {
        create: create
    };
});