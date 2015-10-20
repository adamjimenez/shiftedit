define(['app/editors','app/tabs'], function (editors,tabs) {
    return {
        restoreBatch: function(files) {
            files.forEach(function(data) {
    			editors.create(data.file, data.content, data.site, data);
            });

            tabs.recordOpenFiles();
        }
    };
});