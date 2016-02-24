define(['resumable', "jstreegrid","app/util","app/editors","app/prompt",'app/lang','app/tabs','app/loading', 'app/site'], function (Resumable) {
var util = require('app/util');
var editor = require('app/editors');
var lang = require('app/lang').lang;
var prompt = require('app/prompt');
var tabs = require('app/tabs');
var loading = require('app/loading');
var site = require('app/site');
var ajaxOptions = {};
var tree;
var confirmed = false;
var r;
var uploadStarted = false;
var clipboard = {files:[], site: null};
var queue = [];
var reference;
var inst;
var treeFn;
var singleClickOpen = false;
var renameTimer;
var image_extensions = ['jpg', 'jpeg', 'png', 'gif', 'pxd'];

function findChild(parent, name) {
	for( i=0; i<parent.children.length; i++ ){
	    var node = inst.get_node(parent.children[i]);

	    if(node.text==name) {
	        return node;
	    }
	}
	return false;
}

function cut(nodes) {
    copy(nodes, true);
}

function copy(nodes, cut) {
	clipboard.cut = cut ? true : false;
	clipboard.files = util.clone(nodes);
	clipboard.site = site.active();
	console.log('nodes copied');
}

function findAvailableName(d, text) {
    //if src and dest folder are the same then rename
	var i = 0;
	var newName = text;
	while(findChild(d, newName)!==false) {
		i++;
		var pos = text.indexOf('.');
		var copyStr = ' ('+i+')';

		if(pos == -1) {
			newName = text + copyStr;
		}else{
			newName = text.substr(0, pos) + copyStr + text.substr(pos, text.length-pos);
		}
	}

	return newName;
}

function paste(node) {
	if (clipboard.files.length === 0) {
		return;
	}

	//get nearest folder
	var d = node.type == 'default' ? node : inst.get_node(node.parent);

	//get list of files and paste them
	buildQueue(clipboard.files, d);
}

function duplicate(nodes) {
	if(!nodes || nodes.length === 0) {
		return false;
	}

	clipboard.site = site.active();

    //no dest as we copy to the same folder
	clipboard.dest = null;

	//get list of files and copy them
	buildQueue(nodes);
}

function buildQueue(nodes, d) {
    var node;
	if(nodes.length) {
		node = nodes.shift();
	} else {
		//console.log(queue); return;
		_processQueue(queue);
		return;
	}

	var parent = d ? d : inst.get_node(node.parent);
	var dest = parent.id;
	if (dest.substr(0,1)==='#') {
		dest = '';
	}

	var path = node.id;
	var newName = node.text;

    if(node.text == newName) {
    	newName = findAvailableName(parent, newName);
	}

	var newPath = newName;
	if (dest) {
		newPath = dest+'/'+newPath;
	}

	queue.push({
		path: path,
		dest: dest+'/'+newName,
		isDir: (node.type!=='file')
	});

	if (node.type=='file') {
		buildQueue(nodes, d);
	}else{
		//get file list
    	var url = ajaxOptions.url;
    	if(url.indexOf('?')==-1) {
    		url+='?';
    	} else {
    		url+='&';
    	}
    	url += 'cmd=list&site='+clipboard.site+'&path='+encodeURIComponent(path);

    	var params = util.clone(ajaxOptions.params);
    	params.path = path;
    	params.site = clipboard.site;

		loading.fetch(url, {
			data: params,
			success: function (data) {
				for( i=0; i<data.files.length; i++ ){
					console.log(data.files[i]);

					var destPath = newPath + data.files[i].id.substr(path.length);
					if (dest) {
						dest = dest +'/' + destPath;
					}

					queue.push({
						path: data.files[i].id,
						dest: destPath,
						isDir: data.files[i].isDir
					});
				}

				console.log(queue);

				buildQueue(nodes, d);
			}
		});
	}
}

function _processQueue(queue) {
	if (queue.length) {
		var item = queue.shift();

    	var url = ajaxOptions.url;
    	if(url.indexOf('?')==-1) {
    		url+='?';
    	}else{
    		url+='&';
    	}
    	url += 'cmd=paste';

    	var params = util.clone(ajaxOptions.params);
    	params.dest = item.dest;
    	params.path = item.path;
    	params.isDir = item.isDir;
    	params.site = item.site;
    	params.cut = item.cut;

		loading.fetch(url, {
			action: 'Putting '+item.dest,
			data: params,
			success: function (result, request) {
				_processQueue(queue);
			}
		});
	} else {
		if(clipboard.dest) {
			tree.jstree(true).refresh_node(clipboard.dest);
		}else{
			refresh();
		}

		loading.stop();
	}
}

//given a path will select the file
function select(path) {
	var inst = $.jstree.reference($('#tree'));
    var node;
    var dirPath = '';
    var parts = (path).split('/');
    var i = 0;

    function expandPath() {
        for (; i<parts.length; ) {
            if(dirPath)
                dirPath += '/';

            dirPath += parts[i];
            node = inst.get_node(dirPath);

            if(node){
                i++;
                if(!node.state.opened){
                    return inst.open_node(node, expandPath, false);
                }
            }else{
                //can't find it
                return false;
            }
        }

        //found it
        inst.deselect_all();
        inst.select_node(node);
    }

    expandPath();
}

function newFolder(data) {
	var inst = $.jstree.reference(data.reference),
		obj = inst.get_node(data.reference);
		var parent = obj.type == 'default' ? obj : inst.get_node(obj.parent);
		var newName = findAvailableName(parent, 'New folder');

	inst.create_node(parent, { type : "default", text: newName, data: {} }, "last", function (new_node) {
		setTimeout(function () {
	        inst.deselect_all();
	        inst.select_node(new_node);
			inst.edit(new_node);
		}, 0);
	});
}

function newFile(data) {
	var inst = $.jstree.reference(data.reference),
		obj = inst.get_node(data.reference);
	var parent = obj.type == 'default' ? obj : inst.get_node(obj.parent);

    var extension = data.item.extension;
    var prefix = data.item.name ? data.item.name : 'untitled';
    var newName = prefix + '.' + extension;

	var i = 0;
	while( parent.children.indexOf(newName) !== -1 ){
		i++;
		newName = prefix + i + '.' + extension;
	}

	newName = findAvailableName(parent, newName);

	inst.create_node(parent, { type : "file", text: newName, data: {} }, "last", function (new_node) {
		setTimeout(function () {
	        inst.deselect_all();
	        inst.select_node(new_node);
			inst.edit(new_node);
		}, 0);
	});
}

function extract(data) {
    var node = getSelected()[0];
	var file = node.id;

	if(!file){
	    return false;
	}

	//remote extract
	var abortFunction = function(){
		if( source ){
			source.close();
		}
	};

	var url = ajaxOptions.url;
	if( url.indexOf('?')==-1 ){
		url+='?';
	}else{
		url+='&';
	}
	url += 'cmd=extract&site='+ajaxOptions.site+'&file='+encodeURIComponent(file);

	loading.start('Extracting ' + file, abortFunction);
	var source = new EventSource(url, {withCredentials: true});

	var count = 0;
	var total = 0;

	source.addEventListener('message', function(event) {
		var data = JSON.parse(event.data);

		if( count === 0 ){
			total = data.msg;
		}else{
			loading.stop(false);
			loading.start('Extracting ' + data.msg+' ['+count+'/'+total+']', abortFunction);
		}

		count ++;
	}, false);

	source.addEventListener('error', function(event) {
		if (event.eventPhase == 2) { //EventSource.CLOSED
			if( source ){
				source.close();
			}

			loading.stop();
			refresh();
		}
	}, false);

}

function downloadZip(data) {
	var inst = $.jstree.reference(data.reference);

	//send compress request
	var abortFunction = function(){
		if( source ){
			source.close();
		}
	};
	loading.start('Compressing zip', abortFunction);

	var url = ajaxOptions.url;
	if( url.indexOf('?')==-1 ){
		url+='?';
	}else{
		url+='&';
	}
	url += 'cmd=compress&site='+ajaxOptions.site;

	var nodes = getSelected();
	var paths = [];
	for( i=0; i<nodes.length; i++ ){
		paths.push(nodes[i].id);
	}

	var params = util.clone(ajaxOptions.params);
	params.paths = paths;

	$.ajax(url, {
	    method: 'POST',
	    dataType: 'json',
	    data: params,
		xhrFields: {
			withCredentials: true
		},
	    success: function(data) {
			var source = new EventSource(url, {withCredentials: true});

			source.addEventListener('message', function(event) {
				var data = JSON.parse(event.data);

				if( data.msg === 'done' ){
					done = true;
					loading.stop(false);

					source.close();

					var evt = new Event('click');
		    		var a = document.createElement('a');
		    		a.download = 1;
					a.href = url+'&d=1';
		    		a.dispatchEvent(evt);
				}else{
					loading.stop(false);
					loading.start(data.msg, abortFunction);
				}
			}, false);

			source.addEventListener('error', function(event) {
				//console.log(event);
				if (event.eventPhase == 2) { //EventSource.CLOSED
					if( source ){
						source.close();
					}
				}
			}, false);
	    }
	});
}

function downloadFile(data) {
	var inst = $.jstree.reference(data.reference),
		node = inst.get_node(data.reference);

	var file = node.id;

    loading.fetch(ajaxOptions.url+'&cmd=download&file='+encodeURIComponent(file), {
        action: 'downloading file',
        success: function(data) {
            var blob = util.b64toBlob(data.content);
			var evt = new Event('click');
    		var a = document.createElement('a');
    		a.download = util.basename(file);
    		a.href = URL.createObjectURL(blob);
    		a.dispatchEvent(evt);
        }
    });
}

function upload() {
	var evt = new Event('click');

	var a = document.createElement('a');
    r.assignBrowse(a);
	a.href = '#';
	a.dispatchEvent(evt);
}

var uploadFolders = [];
var uploadFiles = [];

function processUploads() {
	var params;

	var node = getSelected()[0];
	var parent = getDir(node);
	var path = '';

	if(parent.id!=='#root')
		path = parent.id+'/';

    if (uploadFolders.length) {
        var folder = path + uploadFolders.shift();
        params = util.clone(ajaxOptions.params);

        //check exists
        loading.stop();
        loading.fetch(ajaxOptions.url+'&cmd=file_exists&file='+encodeURIComponent(folder), {
            action: 'Checking '+folder,
            data: params,
            success: function(data) {
                if(data.file_exists===false) {
        			var params = util.clone(ajaxOptions.params);
        			params.dir = folder;

                    loading.stop();
                    loading.fetch(ajaxOptions.url+'&cmd=newdir&path='+encodeURIComponent(folder), {
                    	data: params,
                        action: 'Uploading '+folder,
                        success: function(data) {
                            processUploads();
                        }
                    });
                }else{
                    processUploads();
                }
            }
        });
    } else if(uploadFiles.length) {
        var file = uploadFiles.shift();
		params = util.clone(ajaxOptions.params);
		params.file = path + file.path;
		params.content = file.content;

        loading.stop();
        loading.fetch(ajaxOptions.url+'&cmd=upload', {
            action: 'uploading '+file.path,
            data: params,
            success: function(data) {
                processUploads();
            }
        });
    } else {
        //done!
        loading.stop();
        refresh();
    }
}

function uploadFolder() {
	$('<input type="file" multiple directory webkitdirectory mozdirectory>').change(function(e) {
		//loading maask
		var node = getSelected();
		var parent = getDir(node);
		var path = parent.id;
		var files = e.target.files;

        for (var i = 0, f; f = files[i]; ++i) {
        	// if folder, check exists
        	var dir = util.dirname(f.webkitRelativePath);
        	var dirParts = dir.split('/');
        	var subfolder = '';
        	dirParts.forEach(function(part) {
        	    subfolder += part;

            	if(uploadFolders.indexOf(subfolder)==-1){
            	    uploadFolders.push(subfolder);
            	}

        	    subfolder += '/';
        	});

        	uploadFiles[i] = {path: f.webkitRelativePath};

			var reader = new FileReader();
			reader.onloadend = function (file, i) {
				return function () {
					uploadFiles[i].content = this.result;
				};
			}(f, i);

			if (f.type.match('text.*')) {
				reader.readAsText(f);
			} else {
				reader.readAsDataURL(f);
			}
        }

        processUploads();
	}).click();
}

function loadUploadUrls() {
    return $.getJSON('/api/uploadurls')
        .then(function (data) {
            var urls = data.urls;

            $( "#uploadUrl" ).children('option').remove();
            $.each(urls, function( index, item ) {
                $( "#uploadUrl" ).append( '<option value="' + item.value + '">'+item.label+'</option>' );
            });

            return urls;
        });
}

function checkExtract(option) {
    var val = option.value;
    var isZip = ['zip', 'bz2', 'tar', 'gz', 'ar'].indexOf(util.fileExtension(val)) !== -1;

	$('#uploadUrlForm [name=extract]').prop('disabled', !isZip);
}

function uploadByURl() {
    //dialog
    $( "body" ).append('<div id="dialog-uploadUrl" class="ui-front" title="Upload by url">\
      <form id="uploadUrlForm">\
        <fieldset>\
            <p>\
                <label>URL:</label>\
                <select id="uploadUrl" name="url"></select>\
                <button type="button" class="delete">X</button>\
            </p>\
            <p>\
                <label><input type="checkbox" name="extract" value="1" disabled> extract archive</label>\
            </p>\
        </fieldset>\
      </form>\
    </div>');

	$('#uploadUrlForm button').button();

    //profile combo
    var combo = $( "#uploadUrl" ).combobox({
        select: function (event, ui) {
            checkExtract(ui.item);
        },
        change: function (event, ui) {
            checkExtract(ui.item);
        }
    });
    loadUploadUrls();

    $('#uploadUrlForm .delete').click(function() {
        var url = combo.combobox('val');

        if(!url)
            return;

        loading.fetch('/api/uploadurls?cmd=delete', {
            action: 'Deleting upload url',
            data: {url: url},
            success: function(data) {
                combo.combobox('val', '');
                loadUploadUrls();
            }
        });
    });

    //open dialog
    var dialog = $( "#dialog-uploadUrl" ).dialog({
        modal: true,
        width: 550,
        height: 300,
        buttons: {
            OK: function() {
				var url = combo.combobox('val');

				if( !url ){
					combo.combobox('focus');
					return;
				}

                var extractFile = $('[name=extract]').prop('checked');
        		var node = getSelected();
        		var parent = getDir(node);
        		var path = parent.id;

                loading.fetch(ajaxOptions.url+'&cmd=uploadByURL', {
                    action: 'uploading '+url,
                    data: {
                        url: url,
                        path: path
                    },
                    success: function(data) {
                        //add node if it doesn't exist
                        var node = tree.jstree(true).get_node(data.file);
                        var parent = getDir(node);

                        if(!node) {
                            node = tree.jstree('create_node', parent, {'id' : path, 'text' : util.basename(data.file)}, 'last');
                        }

                        //select node
                        tree.jstree(true).deselect_all();
                        tree.jstree(true).select_node(node);

                        //extract?
                        if(extractFile) {
                            extract({reference: node});
                        }

        				//save url
        				/*
                        loading.fetch('/api/uploadurls', {
                            action: 'saving url '+url
                            data: {url: url},
                        });
                        */
                    },
                    context: this
                });

				$( this ).dialog( "close" );
            }
        }
    });
}

function open(data) {
	var inst = $.jstree.reference(data.reference);
    var selected = inst.get_selected();
    var node = inst.get_node(data.reference);

    if(node.icon==="folder") {
        return;
    }

	if(selected && selected.length) {
	    selected.forEach(function(file) {
	    	var file_extension = util.fileExtension(util.basename(file));
	    	if (image_extensions.indexOf(file_extension) != -1) {
	    		var settings = site.getSettings();
	    		var url = settings.web_url+file;
	    		
	    		window.open('http://apps.pixlr.com/editor/?referrer=ShiftEdit&image=' + encodeURIComponent(url + '?shiftedit=' + new Date().getTime()) + '&title=' + file + '&target=' + encodeURIComponent('https://shiftedit.net/api/files?cmd=save_image&site=' + site.active() + '&path=' + file) + '&redirect=false');
	    	} else {
	    	   	tabs.open(file, site.active());
	    	}
	    });
	}
}

function openTab(data) {
	var inst = $.jstree.reference(data.reference);
    var selected = inst.get_selected();
    var node = inst.get_node(data.reference);

    if(node.icon==="folder") {
        return;
    }

    var settings = site.getSettings(ajaxOptions.site);
	window.open('//' + location.host + location.pathname + '#' + settings.name + '/' + node.id);
}

function chmod(data) {
	var inst = $.jstree.reference(data.reference);
    var selected = inst.get_selected();
    var node = inst.get_node(data.reference);

    //dialog
    $( "body" ).append('<div id="dialog-chmod" class="ui-front" title="File permissions">\
      <form id="chmodForm">\
        <fieldset>\
            <legend>Owner</legend>\
            <p>\
                <input type="checkbox" name="owner-read" id="owner-read">\
                <label for="owner-read">Read</label>\
                <input type="checkbox" name="owner-write" id="owner-write">\
                <label for="owner-write">Write</label>\
                <input type="checkbox" name="owner-execute" id="owner-execute">\
                <label for="owner-execute">Execute</label>\
            </p>\
        </fieldset>\
        <fieldset>\
            <legend>Group</legend>\
            <p>\
                <input type="checkbox" name="group-read" id="group-read">\
                <label for="group-read">Read</label>\
                <input type="checkbox" name="group-write" id="group-write">\
                <label for="group-write">Write</label>\
                <input type="checkbox" name="group-execute" id="group-execute">\
                <label for="group-execute">Execute</label>\
            </p>\
        </fieldset>\
        <fieldset>\
            <legend>Public</legend>\
            <p>\
                <input type="checkbox" name="public-read" id="public-read">\
                <label for="public-read">Read</label>\
                <input type="checkbox" name="public-write" id="public-write">\
                <label for="public-write">Write</label>\
                <input type="checkbox" name="public-execute" id="public-execute">\
                <label for="public-execute">Execute</label>\
            </p>\
        </fieldset>\
        <p>\
            <label>Numeric value</label> <input type="number" id="chmod-value" name="chmod-value" max="777" min="0">\
        </p>\
      </form>\
    </div>');

    //$( "#chmodForm input[type=checkbox]" ).button();

    $('#chmod-value').on('keyup change', function() {
		var perms = $('#chmod-value').val();
		var owner = perms.substr(0, 1);
		var group = perms.substr(1, 1);
		var pub = perms.substr(2, 1);

        $('#owner-read').prop('checked', (owner >= 4 && owner <= 7));
        $('#owner-write').prop('checked', (owner == 2 || owner == 3 || owner == 6 || owner == 7));
        $('#owner-execute').prop('checked', (owner == 1 || owner == 3 || owner == 5 || owner == 7));
        $('#group-read').prop('checked', (group >= 4 && group <= 7));
        $('#group-write').prop('checked', (group == 2 || group == 3 || group == 6 || group == 7));
        $('#group-execute').prop('checked', (group == 1 || group == 3 || group == 5 || group == 7));
        $('#public-read').prop('checked', (pub >= 4 && pub <= 7));
        $('#public-write').prop('checked', (pub == 2 || pub == 3 || pub == 6 || pub == 7));
        $('#public-execute').prop('checked', (pub == 1 || pub == 3 || pub == 5 || pub == 7));
    });

    $( "#chmodForm input[type=checkbox]" ).on('click change', function(){
		var owner = 0, pub = 0, group = 0;

		if ($('#owner-read').prop('checked'))
			owner += 4;
		if ($('#owner-write').prop('checked'))
			owner += 2;
		if ($('#owner-execute').prop('checked'))
			owner += 1;

		if ($('#group-read').prop('checked'))
			group += 4;
		if ($('#group-write').prop('checked'))
			group += 2;
		if ($('#group-execute').prop('checked'))
			group += 1;

		if ($('#public-read').prop('checked'))
			pub += 4;
		if ($('#public-write').prop('checked'))
			pub += 2;
		if ($('#public-execute').prop('checked'))
			pub += 1;

		$('#chmod-value').val(owner + '' + group + '' + pub);
    });

    $('#chmod-value').val(node.data.perms).change();

    //open dialog
    var dialog = $( "#dialog-chmod" ).dialog({
        modal: true,
        width: 400,
        height: 380,
        buttons: {
            OK: function() {
                var node = getSelected()[0];
                var mode = $('#chmod-value').val();

                loading.fetch(ajaxOptions.url+'&cmd=chmod&file='+encodeURIComponent(node.id)+'&mode='+mode, {
                    action: 'chmod file',
                    success: function(data) {
                        node.data.perms = mode;
                        var el = inst.get_node(node, true);
                        el.trigger("change_node.jstree"); //FIXME supposed to update column

				        $( "#dialog-chmod" ).dialog( "close" );
                    }
                });
            }
        }
    });

}

function getSelected() {
    var reference = $('#tree');
    var inst = $.jstree.reference(reference);
    return inst.get_selected(true);
}

function getDir(node) {
    var reference = $('#tree');
    var inst = $.jstree.reference(reference);
    var parent = node.type == 'default' ? node : inst.get_node(node.parent);
    return parent;
}

function init() {
    var chunkedUploads = false;
    r = new Resumable({
        testChunks: false,
        query: {
            cmd: 'upload',
            chunked: 1
        },
        withCredentials: true
    });

    r.assignDrop($('#tree'));

    $('#tree').on('dragenter', 'a', function(e) {
        var inst = $.jstree.reference(this);
        inst.deselect_all();
        var node = inst.select_node(this);
    });

    $('#tree').on('dragleave', function(e) {
    });

    $('#tree').on('dragover', function(e) {
        e.preventDefault();
    });

    r.on('fileProgress', function(file){
		if (uploadStarted) {
		    //console.log(r.progress());
			var msg = 'Uploading '+file.fileName;
			var perc = parseInt(r.progress() * 100);

			loading.stop(false);

			if( perc == 100 ){
				loading.start(msg+' [deploying..]');
			}else{
				loading.start(msg+' ['+perc+'%]', function(){
				    r.cancel();
				});
			}
		}
	});

    r.on('complete', function(){
        uploadStarted = false;
		loading.stop();

		//clear upload queue so you can upload the same file
		r.cancel();

		//setUrl(url);
        refresh();
	});

    r.on('error', function(message, file){
		loading.stop();
		prompt.alert({title:file, msg:message});
	});

    r.on('fileAdded', function(file){
        uploadStarted = true;

        if( chunkedUploads ){
            r.opts.chunkSize = 1*1024*1024;
        }else{
            r.opts.chunkSize = 20*1024*1024;
        }

        r.opts.target = ajaxOptions.url+'&cmd=upload&chunked=1';
        r.opts.withCredentials = true;

        var node = getSelected()[0];
        var parent = getDir(node);

        var params = util.clone(ajaxOptions.params);

        params.path = '';
		if(node.id!=='#root')
			params.path = node.id;

		params.chunked = 1;

        r.opts.query = params;

        r.upload();
    });

    tree = $('#tree')
    .jstree({
    	'core': {
    	    /*
    		'data' : {
    			'url' : '',
    			'data' : function (node) {
    				return { 'id' : node.id };
    			}
    		},*/
            'data': function (node, callback) {
                if (treeFn) {
                    treeFn({node: node, callback: callback, tree:$('#tree')});
                }else{
                    if(!ajaxOptions.url){
                        return false;
                    }

		            if(node.id==='#') {
		            	return callback.call(tree, {
		            		children: true,
		            		id: '#root',
		            		text: ajaxOptions.dir,
		            		type: 'folder'
		            	});
		            }

					//backcompat old turbo mode
					var params = util.clone(ajaxOptions.params);
					params.path = '';
					if(node.id!=='#root')
						params.path = node.id;

            		$.ajax(ajaxOptions.url+'&cmd=get&path='+encodeURIComponent(params.path), {
            		    method: 'POST',
            		    dataType: 'json',
            		    data: params,
						xhrFields: {
							withCredentials: true
						},
            		    success: function(data) {
            		    	if(data.error) {
            		    		prompt.alert({title:'Error', msg:data.error});
            		    		return;
            		    	}

            		    	//backcompat old turbo mode
            		    	if(!data)
            		    		return;

            		    	if(!data.files) {
            		    		var files = [];
            		    		data.forEach(function(item){
            		    			files.push({
            		    				children: (!item.leaf),
            		    				data: {
            		    					perms: item.perms,
            		    					modified: item.modified,
            		    					size: item.size
            		    				},
            		    				icon: (item.leaf ? 'file '+item.iconCls : 'folder'),
            		    				id: item.id,
            		    				text: item.text,
            		    				type: (item.leaf ? 'file' : 'folder')
            		    			});
            		    		});
            		    		data.files = files;
            		    	}

                            callback.call(tree, data.files);
            		    }
            		});
                }
            },
    		'check_callback': function(o, n, p, i, m) {
            	var t = this;

    			if(m && m.dnd && m.pos !== 'i') { return false; }
    			if(o === "move_node" || o === "copy_node") {
    				if(this.get_node(n).parent === this.get_node(p).id) { return false; }
    			}

    			if(o === "delete_node") {
                	if (!confirmed){
                		var delMsg = 'the selected files';
                		queue = t.get_selected(true);
                		if(queue.length==1) {
                			delMsg = this.get_node(n).text;
                		}

                    	prompt.confirm({
                    	    title: 'Delete',
                    	    msg: 'Are you sure you want to delete '+delMsg+'?',
                    	    fn: function(btn) {
                    	        switch(btn){
                    	            case 'yes':
                    	                confirmed = true;

								    	function doDelete(node) {
									        if (treeFn) {
									            treeFn({cmd: 'delete', file: node.id, callback: callback});
									        }else{
								        		var source = new EventSource(ajaxOptions.url+'&cmd=delete&file='+encodeURIComponent(node.id), {withCredentials: true});
												var abortFunction = function(){
													if( source ){
														source.close();
													}
												};

												source.addEventListener('message', function(event) {
													var data = JSON.parse(event.data);
													loading.stop(false);
													loading.start(data.msg, abortFunction);

													var pos = data.msg.indexOf(' ');
													var action = data.msg.substr(0, pos);
													var file = data.msg.substr(pos+1, data.msg.length);

													if (action == 'delete' || action == 'rmdir') {
														var node = t.get_node(file);
														if (node) {
								    						confirmed = true;
															t.delete_node(node);
														}
													}
												}, false);

												source.addEventListener('error', function(event) {
													loading.stop(false);
													if (event.eventPhase == 2) { //EventSource.CLOSED
														if (source) {
															source.close();
														}

								    		    		callback();
									    				//t.delete_node(node);
													}
												}, false);

									        	/*
									    		$.ajax(ajaxOptions.url+'&cmd=delete&file='+encodeURIComponent(node.id), {
									    		    method: 'POST',
									    		    dataType: 'json',
									    		    data: ajaxOptions.params,
													xhrFields: {
														withCredentials: true
													},
									    		    success: function(r) {
									    		    	if(r.success) {
									    		    		callback();
									    		    	}
									    				t.delete_node(node);
									    		    }
									    		})
									    		.fail(function () {
								    				confirmed = false;
									    			prompt.alert({title:'Delete Failed', msg: 'Could not connect'});
									    			t.refresh();
									    		});
									    		*/
									        }
								    	}

								    	queue = t.get_selected(true);
								    	var node;
								    	var callback = function() {
								    		/*
							    			if(node)
							    				t.delete_node(node);
							    			*/

								    		if(queue.length) {
								    			confirmed = true;
										   		node = queue.shift();
										    	doDelete(node);
								    		} else {
								    			confirmed = false;
								    		}
								    	};
								    	callback();
                    	            break;
                    	        }
                    	    }
                    	});
        			    return false;
                	}else{
               	    	confirmed = false;
                	    return true;
                	}

    			    //return confirm("Are you sure you want to delete the selected files?");
    			}

    			return true;
    		},
    		'force_text': true,
    		'themes': {
    			'responsive': false,
    			'variant': 'small',
    			'stripes': true
    		}
    	},
    	'sort' : function(a, b) {
    		return this.get_type(a) === this.get_type(b) ? (this.get_text(a).toLowerCase() > this.get_text(b).toLowerCase() ? 1 : -1) : (this.get_type(a) >= this.get_type(b) ? 1 : -1);
    	},
    	'contextmenu' : {
    		'items' : function(node) {
    			//var tmp = $.jstree.defaults.contextmenu.items();

    			var tmp = {
    			    "create": {
                        "label": "New",
                        "submenu": {
							"create_folder": {
								"separator_after": true,
								"label": "Folder",
								"action": newFolder
							},
							"create_html": {
								"label": "HTML file",
								"action": newFile,
								"extension": 'html'
							},
							"create_php": {
								"label": "PHP file",
								"action": newFile,
								"extension": 'php'
							},
							"create_css": {
								"label": "CSS file",
								"action": newFile,
								"extension": 'css'
							},
							"create_js": {
								"label": "JS file",
								"action": newFile,
								"extension": 'js'
							},
							"create_json": {
								"label": "JSON file",
								"action": newFile,
								"extension": 'json'
							},
							"create_htaccess": {
								"label": "Htaccess file",
								"action": newFile,
								"extension": 'htaccess',
								"name": ''
							},
							"create_ruby": {
								"label": "Ruby file",
								"action": newFile,
								"extension": 'rb'
							},
							"create_python": {
								"label": "Python file",
								"action": newFile,
								"extension": 'py'
							},
							"create_perl": {
								"label": "Perl file",
								"action": newFile,
								"extension": 'pl'
							},
							"create_text": {
								"label": "Text file",
								"action": newFile,
								"extension": 'txt'
							},
							"create_xml": {
								"label": "XML file",
								"action": newFile,
								"extension": 'xml'
							}
						}
    			    },
    			    "open": {
                        "label": "Open",
                        "submenu": {
							"open" : {
								"label": "Open",
                                "shortcut": 13,
								action: open
							},
							"open_tab": {
								"label": "Open in new browser tab",
								action: openTab
							},
							"download": {
								"label": "Download",
								action: downloadFile
							},
                        }
    			    },
                    "ccp": {
                        "separator_before": true,
                        "icon": false,
                        "separator_after": true,
                        "label": "Edit",
                        "action": false,
                        "submenu": {
                            "cut": {
                                "separator_before": false,
                                "separator_after": false,
                                "label": "Cut",
    							"action": function (data) {
                                    var instance = $.jstree.reference(data.reference);
                                    cut(instance.get_selected(true));
    							}
                            },
                            "copy": {
                                "separator_before": false,
                                "icon": false,
                                "separator_after": false,
                                "label": "Copy",
                                "shortcut": 67,
                                "shortcut_label": "C",
    							"action": function (data) {
                                    var instance = $.jstree.reference(data.reference);
                                    copy(instance.get_selected(true));
    							}
                            },
                            "paste": {
                                "separator_before": false,
                                "icon": false,
    							"_disabled": function (data) {
    								//return !$.jstree.reference(data.reference).can_paste(true);
    								return (clipboard.files.length===0);
    							},
                                "separator_after": false,
                                "label": "Paste",
    							"action": function (data) {
                                    var instance = $.jstree.reference(data.reference);
                                    paste(inst.get_top_selected(true)[0]);
    							}
                            },
                            "rename": {
                                "separator_before": false,
                                "separator_after": false,
                                "_disabled": false,
                                "label": "Rename",
            					"shortcut": 113,
            					"shortcut_label": 'F2',
            					"icon": "glyphicon glyphicon-leaf",
            					"action": function (data) {
            						var inst = $.jstree.reference(data.reference),
            							node = inst.get_node(data.reference);

            						if(node.id==='#root')
            							return;

            						inst.edit(node);
            					}
                            },
                            "remove": {
                                "separator_before": false,
                                "icon": false,
                                "separator_after": false,
                                "_disabled": false,
                                "label": "Delete",
                                "shortcut": 46,
                                "shortcut_label": "Del",
            					"action": function (data) {
            						var inst = $.jstree.reference(data.reference),
            							obj = inst.get_node(data.reference);
            						if(inst.is_selected(obj)) {
            							inst.delete_node(inst.get_selected());
            						}
            						else {
            							inst.delete_node(obj);
            						}
            					}
                            },
                            "duplicate": {
                                "separator_before": false,
                                "icon": false,
                                "separator_after": false,
                                "label": "Duplicate",
    							"action": function (data) {
                                    var instance = $.jstree.reference(data.reference);
                                    duplicate(instance.get_selected(true));
    							}
                            }
                        }
                    },
                    "upload": {
                        "separator_before": true,
                        "icon": false,
                        "separator_after": true,
                        "label": "Upload",
                        "action": false,
                        "submenu": {
        					"upload" : {
        						"label": "File",
        						//icon: 'upload',
        						action: upload
        					},
        					"upload_folder": {
        						"label": "Folder",
        						action: uploadFolder
        					},
        					"upload_url": {
        						"label": "URL",
        						action: uploadByURl
        					}
                        }
                    },
					"extract": {
						"label": "Extract",
						"_disabled": function (data) {
							var inst = $.jstree.reference(data.reference),
								node = inst.get_node(data.reference);

							if( ['zip', 'bz2', 'tar', 'gz', 'ar'].indexOf(util.fileExtension(node.id)) !== -1 ){
							    return false;
							}else{
							    return true;
							}
						},
						action: extract
					},
					"downloadzip": {
						"label": "Download as zip",
						action: downloadZip
					},
					"reload": {
						"label": "Reload",
						action: function (data) {
                            var inst = $.jstree.reference(data.reference);
                            inst.refresh_node(inst.get_selected(true)[0]);
						}
					},
					"chmod": {
						"label": "Set permissions",
                        "separator_after": true,
                        action: chmod
					}
                };

    			return tmp;
    		}
    	},
    	'types' : {
    		'default' : { 'icon' : 'folder' },
    		'file' : { 'valid_children' : [], 'icon' : 'file' }
    	},
    	'unique' : {
    		'duplicate' : function (name, counter) {
    			return name + ' ' + counter;
    		}
    	},
        grid: {
        	isThemeroller: true,
            resizable: true,
            stateful: true,
            columns: [
                {
                	//width: 'auto',
                	header: "Name"
                },
                {
                    width: 100,
                    header: "Modified",
                    value: "modified",
                    format: function(v) {
        				if( v === '' ){
        					return '';
        				}

        				return new Date(v*1000).toLocaleString();
        			}
                },
                {
                    width: 50,
                    header: "Size",
                    value: "size",
                    format: function(size) {
        				if( size === '' ){
        					return '';
        				}

        				var si;
        				for( si = 0; size >= 1024; size /= 1024, si++ );

        				return ''+Math.round(size)+'BKMGT'.substr(si, 1);
        			}
                },
                {width: 90, header: "Permissions", value: "perms"}
            ]
        },
    	'plugins' : [
    	    /*'state',*/'dnd','sort','types','contextmenu','unique','search','grid'
    	]
    })
    .on('delete_node.jstree', function (e, data) {
    })
    .on('create_node.jstree', function (e, data) {
        var cmd = (data.node.type=='default') ? 'newdir' : 'newfile';
        if (treeFn) {
            var parent = inst.get_node(data.node.parent);
            treeFn({cmd: cmd, title: data.node.text, parent: parent.id, callback: function(response) {
                data.instance.set_id(data.node, response.file);
            }});
        }else{
        	var params = util.clone(ajaxOptions.params);

        	//backcompat turbo mode
        	var path = data.node.text;
			if(data.node.parent!=='#root') {
				path = data.node.parent + '/' + path;
			}

        	if(data.node.type=='default') {
        		params.dir = path;
        	} else {
        		params.file = path;
        	}
        	//end backcompat

        	var id = '';
        	if(data.node.parent!=='#root'){
        		id = data.node.parent;
        	}

        	$.ajax(ajaxOptions.url+'&cmd='+cmd+'&type='+data.node.type+'&path='+encodeURIComponent(path), {
    		    method: 'POST',
    		    dataType: 'json',
    		    data: params,
				xhrFields: {
					withCredentials: true
				}
        	})
    		.done(function (d) {
    			var id = d.id;

    			//backcompat turbo mode
    			if(!id) {
    				id = path;
    			}

    			data.instance.set_id(data.node, id);
    		})
    		.fail(function () {
    			data.instance.refresh();
    		});
        }
    })
    .on('rename_node.jstree', function (e, data) {
        if (treeFn) {
            treeFn({cmd: 'rename', file: data.node.id, newname: data.text});
        }else{
            var params = util.clone(ajaxOptions.params);
            params.oldname = data.node.id;
            params.newname = data.text;
            var dir = util.dirname(params.oldname);
            if (dir) {
            	params.newname = dir + '/' + params.newname;
            }

            if (params.newname === params.oldname) {
            	return;
            }

            //params.newname = util.dirname(params.oldname)+'/'+data.text;
            params.site = ajaxOptions.site;

    		$.ajax(ajaxOptions.url+'&cmd=rename', {
    		    method: 'POST',
    		    dataType: 'json',
    		    data: params,
				xhrFields: {
					withCredentials: true
				},
    		})
    		.done(function (d) {
    		    if(!d.success){
    		        prompt.alert({title:'Error', msg:d.error});
    		    }else{
        		    data.instance.set_id(data.node, params.newname);
    		        $('#tree').trigger('rename', params);
    		    }
        	})
        	.fail(function () {
        		data.instance.refresh();
        	});
        }

    	//$.get('/app/?cmd=rename_node', { 'id' : data.node.id, 'text' : data.text })

    })
    .on('move_node.jstree', function (e, data) {
    	prompt.confirm({
    	    title: 'Move',
    	    msg: 'Are you sure you want to move the selected files?',
    	    fn: function(btn) {
    	        switch(btn){
    	            case 'yes':
    	                doMove();
    	            break;
    	            default:
    	                refresh();
    	            break;
    	        }
    	    }
    	});

        function doMove() {
            function moveCallback() {
                //data.instance.load_node(data.parent);
    			data.instance.refresh();
            }

            var parent = inst.get_node(data.parent);
            if (treeFn) {
                treeFn({cmd: 'rename', file: data.node.id, newname: data.node.text, parent: parent.id, callback: moveCallback});
            }else{
                var params = util.clone(ajaxOptions.params);
                params.oldname = data.node.id;
		    	params.newname = util.basename(data.node.id);
				if(data.parent!=='#root') {
					params.newname = data.parent + '/' + params.newname;
				}

                params.site = ajaxOptions.site;

        		$.ajax(ajaxOptions.url+'&cmd=rename', {
        		    method: 'POST',
        		    dataType: 'json',
        		    data: params,
					xhrFields: {
						withCredentials: true
					}
        		})
        		.done(moveCallback)
        		.fail(function () {
        			data.instance.refresh();
        		});
            }
        }
    })
    .on('copy_node.jstree', function (e, data) {
    	$.get('?operation=copy_node', { 'id' : data.original.id, 'parent' : data.parent })
    		.done(function (d) {
    			//data.instance.load_node(data.parent);
    			data.instance.refresh();
    		})
    		.fail(function () {
    			data.instance.refresh();
    		});
    })
    .unbind('keydown.jstree')
    .on('keydown.jstree', '.jstree-anchor', function (e) {
        if($('.jstree-rename-input').length){
            return;
        }

		var size, o, i;
	    var keycode = e.keyCode;
        var reference = this;
        var inst = $.jstree.reference(this);


        switch(keycode) {
        	//escape
        	case 27:
	        	$('.filter').val('').hide();
				$('#tree').jstree(true).search('', true, true);
	        	$('#tree').focus();
        		return;
			case 38: // up
				e.preventDefault();
				o = inst.get_prev_dom(e.currentTarget);
				if(o && o.length) {
					if(!e.shiftKey) {
						inst.deselect_all();
					}
					inst.select_node(o.children('.jstree-anchor').focus());
				}
        		return;
			case 40: // down
				e.preventDefault();
				o = inst.get_next_dom(e.currentTarget);
				if(o && o.length) {
					if(!e.shiftKey) {
						inst.deselect_all();
					}
					inst.select_node(o.children('.jstree-anchor').focus());
				}
        		return;
			case 36: // home
				e.preventDefault();
				o = inst._firstChild(inst.get_container_ul()[0]);
				if(o) {
					if(!e.shiftKey) {
						inst.deselect_all();
					}
					inst.select_node($(o).children('.jstree-anchor').filter(':visible').focus());
				}
				return;
			case 35: // end
				e.preventDefault();
				if(!e.shiftKey) {
					inst.deselect_all();
				}
				inst.select_node(inst.element.find('.jstree-anchor').filter(':visible').last().focus());
				return;
			case 33: // page up
				e.preventDefault();
				size = Math.floor(inst.element.height() / $(e.currentTarget).height());

                o = $(e.currentTarget);
                for (i = 0; i<size; i++) {
                	if (inst.get_prev_dom(o).length) {
                		o = inst.get_prev_dom(o);
						if(e.shiftKey) {
							inst.select_node(o);
						}
                	}
                }

				if(o.children('.jstree-anchor').length) {
					if(!e.shiftKey) {
						inst.deselect_all();
					}
					inst.select_node(o.children('.jstree-anchor').focus());
				}
				return;
			case 34: // page down
				e.preventDefault();
				size = Math.floor(inst.element.height() / $(e.currentTarget).height());

                o = $(e.currentTarget);
                for (i = 0; i<size; i++) {
                	if (inst.get_next_dom(o).length) {
                		o = inst.get_next_dom(o);
						if(e.shiftKey) {
							inst.select_node(o);
						}
                	}
                }

				if(o.children('.jstree-anchor').length) {
					if(!e.shiftKey) {
						inst.deselect_all();
					}
					inst.select_node(o.children('.jstree-anchor').focus());
				}
				return;
        }

		//shortcuts
        var selected = inst.get_selected();
        var items = inst.settings.contextmenu.items(selected);
        for(i in items){
            if (items.hasOwnProperty(i)) {
                if(items[i].shortcut === e.which) {
                    items[i].action({reference:reference});
                }

                if(items[i].submenu){
                    var submenu_items = items[i].submenu;
                    for(var j in submenu_items){
                        if(submenu_items[j].shortcut === e.which) {
                            submenu_items[j].action({reference:reference});
                        }
                    }
                }
            }
        }

        //treefilter
	    var valid =
	        (keycode > 47 && keycode < 58)   || // number keys
	        keycode == 32                    || // spacebar
	        keycode == 8                     || // backspace
	        (keycode > 64 && keycode < 91)   || // letter keys
	        (keycode > 95 && keycode < 112)  || // numpad keys
	        (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
	        (keycode > 218 && keycode < 223);   // [\]' (in order)

	    if(valid) {
        	$('.filter').show();
	    	$('.filter').focus();
	    }
    })
    .on('mouseup','a',function (e, data) {
    	if (e.button!==0) {
    		return false;
    	}

    	var ref = this;

    	if ($(ref).hasClass('jstree-clicked')) {
    		clearTimeout(renameTimer);
    		renameTimer = setTimeout(function() {
    			if (ref) {
					var inst = $.jstree.reference(ref),
	            		node = inst.get_node(ref);

   						if(node.id==='#root')
  							return;

		            	inst.edit(node);
    			}
    		}, 1000);
    	}
    })
    .on('click','a',function (e, data) {
    	if (e.button!==0) {
    		return false;
    	}

    	var ref = this;

        if(singleClickOpen){
            open({
                reference: ref
            });
        }
    })
    .on('dblclick','a',function (e, data) {
    	clearTimeout(renameTimer);

        open({
            reference: this
        });
    }).on('refresh.jstree', function(e, data){
    	//expand root node
    	var rootNode = getNode('#').children[0];
    	inst.open_node(rootNode);
    }).on('open_node.jstree', function(e, data){
    	var path = data.node.id;

    	if (!treeFn) {
	    	$.ajax(ajaxOptions.url+'&cmd=save_path&expand=1&path='+encodeURIComponent(path), {
			    method: 'POST',
			    dataType: 'json',
				xhrFields: {
					withCredentials: true
				}
	    	});
    	}
    }).on('close_node.jstree', function(e, data){
    	var path = data.node.id;

		if (!treeFn) {
	    	$.ajax(ajaxOptions.url+'&cmd=save_path&expand=0&path='+encodeURIComponent(path), {
			    method: 'POST',
			    dataType: 'json',
				xhrFields: {
					withCredentials: true
				}
	    	});
		}
    })/*.on('hover_node.jstree', function(e, data){
    	inst.get_node(data.node, true).addClass('ui-state-hover');
    }).on('dehover_node.jstree', function(e, data){
    	inst.get_node(data.node, true).removeClass('ui-state-hover');
    }).on('select_node.jstree', function(e, data){
    	inst.get_node(data.node, true).addClass('ui-state-highlight');
    }).on('deselect_node.jstree', function(e, data){
    	inst.get_node(data.node, true).removeClass('ui-state-highlight');
    })*/
    /*
    .on('changed.jstree', function (e, data) {
    	if(data && data.selected && data.selected.length) {
    	    var file = data.selected.join(':');
    	    tabs.open(file, ajaxOptions.site);
    	}
    	else {
    		$('#data .content').hide();
    		$('#data .default').html('Select a file from the tree.').show();
    	}
    })*/;

    //treefilter
	var to = false;
	$('.filter').keyup(function (e) {
		if(to) {
			clearTimeout(to);
		}
		to = setTimeout(function () {
			var v = $('.filter').val();
			$('#tree').jstree(true).search(v, true, true);
		}, 250);
	});

	$('.filter').keydown(function (e) {
		var keycode = e.keyCode;
	    var valid =
	        (keycode > 47 && keycode < 58)   || // number keys
	        keycode == 32                    || // spacebar
	        keycode == 8                     || // backspace
	        (keycode > 64 && keycode < 91)   || // letter keys
	        (keycode > 95 && keycode < 112)  || // numpad keys
	        (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
	        (keycode > 218 && keycode < 223);   // [\]' (in order)

	    //$('#tree a.jstree-clicked').focus();

	    if(!valid) {
	    	e.namespace = 'jstree';
	    	e.target = $('#tree a.jstree-clicked')[0];
	    	$('#tree a.jstree-clicked').trigger(e);
	    	return false;
	    }
	});

    //only select filename part on rename
    $(document).on("focus", '.jstree-rename-input', function(){ setTimeout($.proxy( util.selectFilename, this), 10); });

    $('.drag')
        .on('mousedown', function (e) {
            return $.vakata.dnd.start(e, { 'jstree' : true, 'obj' : $(this), 'nodes' : [{ id : true, text: $(this).text() }] }, '<div id="jstree-dnd" class="jstree-default"><i class="jstree-icon jstree-er"></i>' + $(this).text() + '</div>');
        });
    $(document)
        .on('dnd_move.vakata', function (e, data) {
            var t = $(data.event.target);
            if(!t.closest('.jstree').length) {
                if(t.closest('.editor').length) {
                    var pos = $(data.helper).position();
                    data.helper.find('.jstree-icon').removeClass('jstree-er').addClass('jstree-ok');

                    var panel = t.closest('.ui-tabs-panel')[0];
                    var id = $(panel).attr('id');
                    var tab = $('li[aria-controls='+id+']')[0];
                    var editor = tabs.getEditor(tab);
        			editor.focus();

        			//move caret with mouse
        			var coords = editor.renderer.pixelToScreenCoordinates(pos.left, pos.top-10);

        			editor.moveCursorToPosition(coords); // buggy in ace
        			/*
        			editor.selection.setSelectionRange({
        				start: coords,
        				end: coords
        			});
        			*/
                }
                else {
                    data.helper.find('.jstree-icon').removeClass('jstree-ok').addClass('jstree-er');
                }
            }
        })
        .on('dnd_stop.vakata', function (e, data) {
            var t = $(data.event.target);
            if(!t.closest('.jstree').length) {
                if(t.closest('.editor').length) {
                    //$(data.element).clone().appendTo(t.closest('.drop'));
                    // node data:
                    /*
                    console.log(data);
                    if(data.data.jstree && data.data.origin) {
                        console.log(data.data.origin.get_node(data.element));
                    }
                    */

                    var panel = t.closest('.ui-tabs-panel')[0];
                    var id = $(panel).attr('id');
                    var tab = $('li[aria-controls='+id+']')[0];
                    var editor = tabs.getEditor(tab);
        			editor.focus();

                    var nodes = data.data.nodes;
            		if (nodes) {
            			var node;
            			var html = '';

            			for( i=0; i<nodes.length; i++ ){
            				node = nodes[i];
            				n = getNode(node);

            				var from = $(tab).data('file');
            				var to = node;
            				var path = '';

            				if( from ){
            					path = util.relative(util.dirname(from), to);
            				}else{
            					path = '/'+to;
            				}

            				if(n.data.link)
            					path = n.data.link;

            				switch( util.fileExtension(n.text) ){
            					case 'jpg':
            					case 'jpeg':
            					case 'gif':
            					case 'png':
            					case 'svg':
            						html+='<img src="'+path+'" />\n';
            					break;
            					case 'css':
            						html+='<link type="text/css" rel="stylesheet" href="'+path+'">\n';
            					break;
            					case 'js':
            						html+='<script type="text/javascript" src="'+path+'"></script>\n';
            					break;
            					default:
            						var pos = editor.getCursorPosition();
            						var state = editor.getSession().getState(pos.row, pos.column);

            						if( state.substring(0,3)==='php' ){
            							html+='require("'+path+'");\n';
            						}else{
            							html+='<a href="'+path+'">'+node+'</a>\n';
            						}
            					break;
            				}
            			}

			            editor.insert(html);
            		}
                }
            }
        });


    reference = $('#tree');
    inst = $.jstree.reference(reference);
}

function getNode(file){
    return tree.jstree(true).get_node(file);
}

function refresh() {
    tree.jstree(true).refresh();
}

function setAjaxOptions(siteOptions) {
    if(typeof siteOptions == 'function') {
        ajaxOptions = null;
        treeFn = siteOptions;
    } else {
        ajaxOptions = siteOptions;
        treeFn = null;
        tree.jstree(true).settings.core.data.url = ajaxOptions.url;
    }
    refresh();
}

function setSingleClickOpen(value) {
    singleClickOpen = value;
}

return {
    init: init,
    setAjaxOptions: setAjaxOptions,
    refresh: refresh,
    select: select,
    getNode: getNode,
    findChild: findChild,
    setSingleClickOpen: setSingleClickOpen
};

});



