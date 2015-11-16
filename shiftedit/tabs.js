define(['app/editors', 'app/prefs', 'exports', "ui.tabs.overflowResize","app/tabs_contextmenu", "app/prompt", "app/lang", "app/site", "app/modes", "app/loading", 'app/util', 'app/recent', 'app/ssh', 'app/preview', 'app/diff', 'app/tree', 'coffee-script'], function (editors, preferences, exports) {
var tabs_contextmenu = require('app/tabs_contextmenu');
var prompt = require('app/prompt');
var site = require('app/site');
var loading = require('app/loading');
var util = require('app/util');
var lang = require('app/lang').lang;
var modes = require('app/modes').modes;
var recent = require('app/recent');
var tree = require('app/tree');
var closing = [];
var saving = [];
var opening = {};
var autoSaveTimer;
var CoffeeScript = require('coffee-script');

function active() {
    return $('.ui-layout-center .ui-tabs-active');
}

function next() {
    var tab = active().next('li:not(.button)');
    if(!tab.length) {
        tab = active().parent().children('li:not(.button):first');
    }

    $(".ui-layout-center").tabs("option", "active", tab.index());
}

function prev() {
    var tab = active().prev('li:not(.button)');
    if(!tab.length) {
        tab = active().parent().children('li:not(.button):last');
    }

    $(".ui-layout-center").tabs("option", "active", tab.index());
}

function getEditor(tab) {
    tab = $(tab);

    if (window.splits && window.splits[tab.attr('id')]) {
        return window.splits[tab.attr('id')].getEditor(0);
    }

    /*
    var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);

    if(panel.children('div.editor').length) {
        return ace.edit(panel.children('div.editor')[0]);
    }*/

    return false;
}

function open(file, siteId, callback) {
    if(!file)
        return quickOpen();

    opening[siteId+'|'+file] = 1;
    openFiles(callback);
}

function openFiles(callback) {
    if (!Object.keys(opening).length)
        return;

    var arr = Object.keys(opening)[0].split('|');
    var siteId = arr[0];
    var fileId = arr[1];
    var file = fileId;

    //check if file already open
    var index = $(".ui-layout-center li[data-file='"+file+"'][data-site='"+siteId+"']").index();
    if(index!==-1){
        $(".ui-layout-center").tabs("option", "active", index);
        delete opening[siteId+'|'+file];
        return;
    }

    var options = site.getAjaxOptions("/api/files?site="+siteId);

    var ajax;
	if (!loading.start('Opening ' + file, function(){
		console.log('abort opening files');
		ajax.abort();
		opening = {};
	})) {
		console.log('in queue');
		return;
	}

	function openCallback(data) {
	    var title = file;
	    if(data.title) {
	        title = data.title;
	    }

        var type = util.fileExtension(title);

        loading.stop();
	    //console.log(d);

	    if (!data.success) {
	        prompt.alert({title:lang.failedText, msg:'Error opening file' + ': ' + data.error});
            opening = {};
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
					editors.create(file, data.content, options.site, data);
					recent.add(file, options.site);

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

            delete opening[siteId+'|'+fileId];

            if (Object.keys(opening).length) {
                openFiles(callback);
            }else{
                recordOpenFiles();

                if (callback)
                    callback(tab);
            }
	    }
	}

	var directFn = site.getdirectFn();
	if(directFn) {
	    directFn({
	        cmd: 'open',
	        file: fileId,
	        callback: openCallback
	    });
	} else {
    	ajax = $.ajax(options.url+'&cmd=open&file=' + fileId, {
    	    method: 'POST',
    	    dataType: 'json',
    	    data: options.params,
            success: openCallback
    	}, 'json').fail(function() {
            loading.stop();
    		prompt.alert({title:lang.failedText, msg:'Error opening file'});
    		opening = {};
        });
	}
}

function save(tab, options) {
    //saving[tab.attr('id')] = tab;
    var found = false;
    saving.forEach(function(item) {
        if(item.id === tab.attr('id')){
            found = true;
            return;
        }
    });

    if(!found) {
        saving.push({
            id: tab.attr('id'),
            tab: tab
        });
        saveFiles(options);
    }
}

function saveFiles(options) {
    if (!saving.length)
        return;

    if (!options) {
        options = {};
    }

    var item = saving.shift();

    console.log('save');

    var content;
    var tab;
    var siteId;
    var title;
    var file;
    var mdate;
    if (item.tab) {
        tab = item.tab;
        siteId = tab.data("site");
        title = tab.data("title");
        var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);
        var editor = getEditor(tab);
        mdate = tab.data("mdate");

        if(!editor){
            console.error('editor instance not found');
            return false;
        }

        file = tab.data("file");
        content = editor.getValue();
    } else if (item.content) {
        siteId = item.site;
        title = item.title;
        content = item.content;
        mdate = -1;
    }

    //strip whitespace
    var prefs = preferences.get_prefs();
	if (prefs.stripWhitespace) {
		var lines = content.split("\n");
		content = '';
		for (var i in lines) {
			if (lines.hasOwnProperty(i)) {
				content += lines[i].replace(/\s+$/, "") + '\n';
			}
		}
	}

    if (tab) {
        //save pref
        if(tab.data('pref')){
            preferences.save(tab.data('pref'), content);
            setEdited(tab, false);
            return;
        }

        //save as if new file
        if(!tab.data("site") || !tab.data("file")) {
            saveAs(tab, options);
            return;
        }
    }

    var ajaxOptions = site.getAjaxOptions("/api/files?site="+siteId);

    var params = util.clone(ajaxOptions.params);
    params.content = content;

	//compile LESS
	var fileExtension = util.fileExtension(title);
	if( prefs.compileLESS && ['less', 'scss'].indexOf(fileExtension)!==-1 ){
		params.compile = true;
	}

    var minify = options.minify ? 1 : 0;
	if( prefs.saveWithMinified && ['css', 'js'].indexOf(fileExtension)!==-1 ){
		minify = 1;
	}

    var ajax;
	if (!loading.start('Saving ' + tab.data('title'), function(){
		console.log('abort saving files');
		ajax.abort();
	})) {
		console.log('in queued save');
		return;
	}

    var confirmed = tab.data('overwrite') ? tab.data('overwrite') : 0;

    function saveCallback(data) {
        loading.stop();
        //console.log(data);

        if (data.success) {
            //trigger event save
            //tab.parent('div').trigger('save', [tab]);

            if(data.changed && !confirmed ){
                prompt.confirm({
                    title: 'File changed',
                    msg: 'File has changed since last save.. save anyway?',
                    fn: function(value) {
                       switch(value) {
                            case 'yes':
                               tab.data('overwrite', 1);
                               saveFiles();
                            break;
                            case 'no':
                            case 'cancel':
                            break;
                       }
                    }
                });
            }else{
                if (tab) {
                    setEdited(tab, false);
                    tab.data('overwrite', 0);
                    tab.data('mdate', data.last_modified);
                    tab.trigger('save');

                    if (data.file) {
                        tab.attr('data-file', data.file);
                        tab.data('file', data.file);
                    }
                }

                //compile coffee
                if (prefs.compileCoffeeScript && util.fileExtension(title)==='coffee') {
                    var newTitle = tab.data('title');
                    var pos = newTitle.indexOf('.');
                    newTitle = newTitle.substr(0, pos) + '.js';
                    var parent = tree.getNode(tree.getNode(tab.data('file')).parent).id;
                    content = CoffeeScript.compile(content);
                    var node = tree.findChild(parent, newTitle);
                    var file;
                    if(node) {
                        file = node.text;
                    }

                    saving.push({
                        title: newTitle,
                        file: file,
                        parent: parent,
                        content: content
                    });
                }

                //continue with next save
                if (saving.length) {
                    saveFiles(options);
                }else if (options.callback) {
                    if (tab) {
                        tab.closest('.ui-tabs').trigger('save');
                    }
                    options.callback(tab);
                }
            }
        } else {
            prompt.alert({title:lang.failedText, msg:'Error saving file' + ': ' + data.error});
        }
    }

	var directFn = site.getdirectFn();
	if(directFn) {
	    directFn({
	        cmd: 'save',
	        file: file,
	        title: title,
            content: content,
	        callback: saveCallback,
	        mdate: mdate,
	        confirmed: confirmed,
	        minify: minify,
	        parent: options.parent
	    });
	} else {
    	ajax = $.ajax(ajaxOptions.url+"&cmd=save&file="+file+"&mdate="+mdate+"&confirmed="+confirmed+"&minify="+minify, {
    	    method: 'POST',
    	    dataType: 'json',
    	    data: params,
            content: content,
            success: saveCallback
        }).fail(function() {
            loading.stop();
    		prompt.alert({title:lang.failedText, msg:'Error saving file'});
        });
	}
}

function saveAs(tab, options) {
    if(!options){
        options = {};
    }

    console.log('save as');

    prompt.prompt({
		title: lang.saveChangesText,
		msg: 'Save as:',
		value: tab.attr('data-title'),
		buttons: 'YESNOCANCEL',
		fn: function (btn, file) {
        	function fileExistsCallback(data) {
                loading.stop();

    		    if (!data.success) {
    		        prompt.alert({title:lang.failedText, msg:'Error checking file: ' + data.error});
    	            opening = {};
    		    } else {
    		        if(data.file_exists) {
    		            prompt.confirm({
    		                title: 'Confirm',
    		                msg: '<strong>'+file+'</strong> exists, overwrite?',
    		                fn: function(btn) {
    		                    switch(btn) {
    		                        case 'yes':
    		                            doSaveAs(tab, file, options);
    		                        break;
    		                    }
    		                }
    		            });
    		        } else {
    		            doSaveAs(tab, file, options);
    		        }
                }
        	}

			if (btn == "ok") {
			    //check if filename exists
            	if (!loading.start('Check file exists', function(){
            		console.log('abort checking file site');
            		ajax.abort();
            	})) {
            		return;
            	}

                var site = require('app/site');
            	var siteId = site.active();

            	var directFn = site.getdirectFn();
            	if(directFn) {
            	    var node = tree.getNode(tab.attr('data-file'));
            	    //console.log(node);

            	    var parent = tree.getNode(node.parent);
            	    options.parent = parent.id;
            	    //console.log(parent);

            	    directFn({
            	        cmd: 'file_exists',
            	        parent: parent.id,
            	        title: file,
            	        callback: fileExistsCallback
            	    });
            	} else {
    			    $.ajax({
    			        url: '/api/files?cmd=file_exists&site='+siteId+'&file='+file,
    	                method: 'GET',
    	                dataType: 'json'
    			    })
                    .then(function (data) {
                        fileExistsCallback();
                    }).fail(function() {
                        loading.stop();
                		prompt.alert({title:lang.failedText, msg:'Error checking site'});
                    });
            	}
			} else if (btn == 'cancel') {
			    //focus editor
			    var editor = getEditor(tab);
			    editor.focus();
			}
		}
    });
}

function doSaveAs(tab, file, options) {
    setTitle(tab, file);
    tab.attr('data-file', '');

    var site = require('app/site');
	var siteId = site.active();

	if(!siteId) {
	    prompt.alert('Error', 'No site selected');
	    return false;
	}

	tab.data(site, siteId);
	tab.attr('data-site', siteId);

    //save
    save(tab, options);
}

function saveAll(tab) {
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
	    tab.children('.ui-tabs-anchor').contents().last().replaceWith('*'+tab.data('title'));
	    tab.trigger('change');

	    //autosave
	    if(tab.data("file") && tab.data("site")) {
    	    prefs = preferences.get_prefs();

            clearTimeout(autoSaveTimer);
    	    if (prefs.autoSave) {
    	        autoSaveTimer = setTimeout(function() {
    	            save(tab);
    	        }, 5000);
    	    }
	    }
	} else {
	    //change title
	    tab.children('.ui-tabs-anchor').contents().last().replaceWith(tab.data('title'));
	}
}

function setTitle(tab, title) {
	//tab.data('file', file);
	//tab.attr('data-file', file);
	tab.attr('data-title', title);
    tab.attr('title', title);
    tab.children('.ui-tabs-anchor').text(title);
}

function recordOpenFiles() {
	var files = [];

    $( "li[data-file][data-site]" ).each(function( index ) {
        var tab = $( this );

		files.push({
			site: tab.data('site'),
			file: tab.data('file')
		});
	});

	$.ajax({
		url: '/api/prefs?cmd=save_state',
		data: {
			files: JSON.stringify(files)
		},
		method: 'POST'
	});
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
        $(ui.tab).trigger('close');

        if($(ui.tab).attr('aria-selected')) {
            document.title = 'ShiftEdit';
        }
    }
}

function afterClose(e, ui) {
    if(closing.length) {
        closing.splice(0, 1);
        close(closing[0]);
    }else{
        recordOpenFiles();
        $(ui.tab).closest('.ui-tabs').trigger('close');
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

    tab.addClass('closable');

    var editors = require('app/editors');

    var panel = $(ui.panel);

    panel.append('\
			<div class="newTab">\
				<div class="column">\
					<h5>Create</h5>\
					<ul class="fileTypes"></ul>\
				</div>\
				<div class="column">\
					<h5>Recent</h5>\
					<ul class="recentFiles"></ul>\
				</div>\
				<div class="column">\
					<h5>Other</h5>\
					<ul class="other">\
					    <li><a href="#">New Site</a></li>\
						<li><a href="#" class="preview">Preview</a></li>\
						<li><a href="#" class="ssh">SSH</a></li>\
						<li><a href="#" class="diff">File Compare</a></li>\
					</ul>\
				</div>\
			</div>\
			<br style="clear: both">\
		');

    //new files
	var HTML = '';
	for (var i in modes) {
		if (modes.hasOwnProperty(i)) {
			HTML += '<li class="'+modes[i][0]+'"><a href="#" data-filetype="'+modes[i][2][0]+'" class="newfile file-' + modes[i][2][0] + '">' + modes[i][1] + '</a></li>';
		}
	}

	panel.find('ul.fileTypes').append(HTML);

	panel.find('a.newfile').click(function() {
	    var prefs = preferences.get_prefs();

		var content = '';
		if( prefs.defaultCode && prefs.defaultCode[this.dataset.filetype] ){
			content = prefs.defaultCode[this.dataset.filetype];
		}

		editors.create("untitled."+this.dataset.filetype, content);
		close(ui.tab);
	});

    //recent files
    var recentFiles = recent.getRecent();
	HTML = '';
	for (i in recentFiles) {
		if (recentFiles.hasOwnProperty(i)) {
			HTML += '<li><a href="#" title="'+recentFiles[i].file+'" data-file="'+recentFiles[i].file+'" data-site="'+recentFiles[i].site+'" class="openfile">' + recentFiles[i].file+ '</a></li>';
		}
	}

	panel.find('ul.recentFiles').append(HTML);

	panel.find('a.openfile').click(function() {
	    open($(this).data('file'), $(this).data('site'));
		close(ui.tab);
	});

    $(this).trigger("tabsactivate", [{newTab:ui.tab}]);
}

//event listener
function tabActivate( tab ) {
    var file = tab.data('file');
    var siteId = tab.data('site');
    var title = file ? file : 'ShiftEdit';
    document.title = title;

    //hash
    var hash = '#';
    if(siteId){
        settings = site.getSettings(siteId);
        hash += settings.name + '/';
    }

    hash += file ? tab.data('file') : 'newfile';

    if(hash!=window.location.hash){
        console.log('change hash');
        window.location.hash = hash;
    }

    var editor = getEditor(tab);
    if (editor)
        editor.focus();

    $(tab).trigger('activate');
}

function updateTabs(e, params) {
    var tab = $(".ui-layout-center li[data-file='"+params.oldname+"'][data-site='"+params.site+"']");
    if(tab.length){
        tab = $(tab);
        setTitle(tab, params.newname);
        tabActivate(tab);
		recordOpenFiles();
    }
}

function quickOpen() {
    //construct dialog
    $( "body" ).append('<div id="dialog-message" title="Quick open">\
  <form>\
    <fieldset>\
        <input type="text" name="input" id="quickOpenSearch" value="" class="text ui-widget-content ui-corner-all" autocomplete="off" autofocus><br>\
        <select id="quickOpenFile" size="10"></select>\
      <!-- Allow form submission with keyboard without duplicating the dialog button -->\
      <input type="submit" tabindex="-1" style="position:absolute; top:-1000px">\
    </fieldset>\
  </form>\
</div>');

    var size = $('#quickOpenFile').prop('size');

    //handle keyboard: up / down enter / input
    $( "#quickOpenSearch" ).keydown(function(e) {
        var next;

        switch(e.keyCode){
            case 38: //up
                $('#quickOpenFile option:selected').prev().prop('selected', true);
                return false;
            case 40: //down
                $('#quickOpenFile option:selected').next().prop('selected', true);
                return false;
            case 33: //page up
                next = $('#quickOpenFile option:selected').prevAll( ":eq("+size+")");

                if(!next.length) {
                    next = $('#quickOpenFile option:selected').prevAll().last();
                }

                next.prop('selected', true);
                return false;
            case 34: //page down
                next = $('#quickOpenFile option:selected').nextAll( ":eq("+size+")");

                if(!next.length) {
                    next = $('#quickOpenFile option:selected').nextAll().last();
                }

                next.prop('selected', true);
                return false;
            case 13: //enter
                pickSelected();
                return false;
        }
    });

    function pickSelected() {
        var val = $( "#quickOpenFile" ).val();

        if (val){
            $( "#dialog-message" ).dialog( "close" );
            $( "#dialog-message" ).remove();

            var pos = val.indexOf('/');
            siteId = val.substr(0, pos);
            file = val.substr(pos+1);
            open(file, siteId);
        }
    }

    function refresh() {
        var search = $( "#quickOpenSearch" ).val();
        var val = $( "#quickOpenFile" ).val();

        //populate with recent files
        recentFiles = recent.getRecent();
        var items = util.clone(recentFiles);

        for(var i in items) {
            if(items[i].file.indexOf(search)==-1) {
                delete items[i];
            }
        }

        //TODO add tree items

        //clear old options
        $('#quickOpenFile').children('option').remove();

        //create select items
        items.forEach(function(item){
            $('#quickOpenFile').append('<option value="'+item.site+'/'+item.file+'">'+item.domain+'/'+item.file+'</option>');
        });

        //select last item
        var selected = $('#quickOpenFile').val(val);

        //or first one
        if(!$('#quickOpenFile option:selected').length){
            $('#quickOpenFile').children(':first').prop('selected', true);
        }
    }

    $( "#quickOpenSearch" ).on('input', refresh);
    refresh();

    //select item click
    $('#quickOpenFile').click(pickSelected);

    //open dialog
    var dialog = $( "#dialog-message" ).dialog({
        modal: true,
        width: 400,
        height: 300
    });

    //make sure quick open is focused
    setTimeout(function(){ $('#quickOpenSearch').focus(); }, 100);

    //prevent form submit
    form = dialog.find( "form" ).on( "submit", function( event ) {
        event.preventDefault();
        options.fn('yes');
    });
}

function init() {
    tabs_contextmenu.init();

    // TABS - sortable
    $( ".ui-layout-west" ).tabs();
    var tabs = $( ".ui-layout-east, .ui-layout-center, .ui-layout-south" ).tabs({closable: true, addTab:true});

    //console.log(tabs);

    // initialize overflow
    $('.ui-layout-west, .ui-layout-east, .ui-layout-center, .ui-layout-south').tabs('overflowResize');
    $('.ui-layout-west, .ui-layout-east, .ui-layout-center, .ui-layout-south').on('tabsbeforeremove', checkEdited);
    $('.ui-layout-west, .ui-layout-east, .ui-layout-center, .ui-layout-south').on('tabsremove', afterClose);
    $('.ui-layout-west, .ui-layout-east, .ui-layout-center, .ui-layout-south').on('tabsadd', newTab);

    //remember scroll
    $( ".ui-layout-west, .ui-layout-east, .ui-layout-center, .ui-layout-south" ).on( "tabsbeforeactivate", function(e, ui){
        var oldPanel = $(ui.oldPanel);
        oldPanel.data('scrollTop', oldPanel.closest('.ui-layout-content').scrollTop());
    });

    //restore scroll
    $( ".ui-layout-west, .ui-layout-east, .ui-layout-center, .ui-layout-south" ).on( "tabsactivate", function(e, ui){
        var newPanel = $(ui.newPanel);
        newPanel.closest('.ui-layout-content').scrollTop(newPanel.data("scrollTop"));

        //set title etc
        tabActivate($(ui.newTab));
    });

    $( "#tree" ).on( "rename", updateTabs );
    //$(document).on("rename", "#tree", updateTabs);

    //connected sortable (http://stackoverflow.com/questions/13082404/multiple-jquery-ui-tabs-connected-sortables-not-working-as-expected)
    tabs.find( ".ui-tabs-nav" ).sortable({
        distance: 10,
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
            if (ui.item.parent().prop("tagName")!=='BODY') {
                ui.item.appendTo('body');
                ui.item.css('width', 'auto');
                ui.item.css('height', 'auto');
            }

            ui.helper.offset(ui.offset);
        }
    });
}

//listeners
$('body').on('click', 'a.openfile', function() {
    open($(this).data('file'), $(this).data('site'));
});

    exports.active = active;
    exports.getEditor = getEditor;
    exports.setEdited = setEdited;
    exports.save = save;
    exports.saveAs = saveAs;
    exports.saveAll = saveAll;
    exports.init = init;
    exports.close = close;
    exports.closeAll = closeAll;
    exports.closeTabsRight = closeTabsRight;
    exports.open = open;
    exports.recordOpenFiles = recordOpenFiles;
    exports.next = next;
    exports.prev = prev;
});