define(['app/editors','app/tabs'], function (editors, tabs) {
    return {
        restoreBatch: function(files, callback) {
            files.forEach(function(data) {
    			editors.create(data.file, data.content, data.site, data);
            });

            tabs.recordOpenFiles();

            if (callback) {
            	callback();
            }
        }
    };
});