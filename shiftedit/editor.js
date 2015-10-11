define(['jquery','ace'], function () {
    function create(tab, content) {
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