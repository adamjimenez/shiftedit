define(['app/editors','app/tabs'], function (editors, tabs) {
    return {
        restoreBatch: function(files, callback) {
            files.forEach(function(data) {
                if (tabs.isOpen(data.file, data.site)) {
                    return;
                }
                
    			editors.create(data.file, data.content, data.site, data);
            });

            tabs.recordOpenFiles();

            if (callback) {
            	callback();
            }
        }
    };
});