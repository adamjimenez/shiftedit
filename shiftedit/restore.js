define(['app/editor','app/tabs'], function (editor,tabs) {
    return {
        restoreBatch: function(files) {
            files.forEach(function(data) {
    			editor.create(data.file, data.content, data.site, data);
            });

            tabs.recordOpenFiles();
        }
    };
});