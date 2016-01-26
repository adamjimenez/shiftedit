define(['app/tabs'], function (tabs) {
function create() {
    var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);
    var editor = tabs.getEditor(tab);

	tab.data('design-ready', true);

	var ta = $('<textarea></textarea>').appendTo(panel.find('.design'));
	ta[0].value = editor.getValue();
	var designId = ta.uniqueId().attr('id');

	tinymce.init({
		mode : "exact",
		selector : '#'+designId,
		relative_urls : true,
		remove_script_host : false,
		//convert_urls : false,
		plugins: [
			"advlist autolink lists link image charmap print preview anchor",
			"searchreplace visualblocks code fullscreen",
			"insertdatetime media table contextmenu paste fullpage textcolor colorpicker"
		],
		toolbar: "undo redo styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image forecolor backcolor",
	    protect: [
	        /<\?[\s\S]*\?>/g // Protect php code
	    ],
		// General options
		// Theme options
		theme_advanced_toolbar_location : "top",
		theme_advanced_toolbar_align : "left",
		theme_advanced_statusbar_location : "bottom",
		theme_advanced_resizing : false,
		paste_data_images: true,

		init_instance_callback: function (inst) {
			inst.on('change', function(e){
				var code = inst.getContent();
				var regexp = /<body[^>]*>([\s\S]*)<\/body>/gi;
				var match = regexp.exec(code);
				code = match[1];

				//preserve outter html
				oldCode = editor.getValue();

				var startCode = '';
				var endCode = '';
				var bodyStartPos = oldCode.indexOf('<body');
				if (bodyStartPos !== -1) {
					var pos = oldCode.indexOf('>', bodyStartPos);
					startCode = oldCode.substr(0, pos + 1);
					startCode = startCode;
				}

				var bodyEndPos = oldCode.indexOf('</body>');
				if (bodyEndPos !== -1) {
					endCode = oldCode.substr(bodyEndPos);
					endCode = endCode;
				}

				code = startCode + code + endCode;

				editor.selectAll();
				editor.insert(code);

				tabs.setEdited(tab, true);
			});

			//add save shortcut
			inst.addShortcut('ctrl+s','Save', function(){
				tabs.save(tab);
			}, this);
		},

		file_browser_callback :  function(field_name, url, type, win) {
			var site = require('app/site');
			var siteId = site.active();
			var ajaxOptions = site.getAjaxOptions('/api/files?site='+siteId);
			var settings = site.getSettings();

		    $( "body" ).append('<div id="dialog-choose-image" title="Choose image">\
			<div id="imageTree"></div>\
			</div>');

		    var imageTree = $('#imageTree').jstree({
		    	'core' : {
		            'data' : function (node, callback) {
		                if( ['GDrive', 'GDriveLimited'].indexOf(settings.server_type) !== -1 ){
		                    gdrive.directFn({node: node, callback: callback, tree: $('#imageTree')});
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

		            		$.ajax(ajaxOptions.url+'&cmd=list&path='+encodeURIComponent(node.id), {
		            		    method: 'POST',
		            		    dataType: 'json',
		            		    data: ajaxOptions.params,
		            		    success: function(data) {
		            		        //console.log(data);
		                            callback.call(imageTree, data.files);
		            		    }
		            		});
		                }
		            }
		    	},
		    	'types' : {
		    		'default' : { 'icon' : 'folder' },
		    		'file' : { 'valid_children' : [], 'icon' : 'file' }
		    	},
		    	'sort' : function(a, b) {
		    		return this.get_type(a) === this.get_type(b) ? (this.get_text(a).toLowerCase() > this.get_text(b).toLowerCase() ? 1 : -1) : (this.get_type(a) >= this.get_type(b) ? 1 : -1);
		    	},
		    	'plugins' : [
		    	    'sort','types'
		    	]
		    }).on('refresh.jstree', function(e, data){
		    	//expand root node
				var inst = $.jstree.reference($('#imageTree'));
		    	var rootNode = $('#imageTree').jstree(true).get_node('#').children[0];
		    	inst.open_node(rootNode);
		    });

		    imageTree.jstree(true).refresh();

		    $( "#dialog-choose-image" ).dialog({
		        modal: true,
		        minHeight: 200,
		        buttons: {
		            OK: function() {
		                var reference = imageTree;
		                var instance = $.jstree.reference(imageTree);
		                var selected = instance.get_selected();
		                var node = instance.get_node(selected);

						if(node){
							var parent;
							if (node.type != 'default') {
								var path = '';
								var to = node.id;
								/*
								//relative path
								var from = shiftedit.app.tabs.openFiles[tabs.getActiveTab().id];
								var path = relative(dirname(from), to);
								*/

								if( settings.web_url ){
									path = settings.web_url;
								}else{
									path = 	'//'+settings.domain;
								}

								if( path.substr(-1, 1)!=='/' ){
									path += '/';
								}

								path += to;

								win.document.getElementById(field_name).value = path;
				                $( this ).dialog( "close" );
				                $( "#dialog-choose-image" ).remove();
							}
						}
		            },
		            Cancel: function() {
		                $( this ).dialog( "close" );
		                $( "#dialog-choose-image" ).remove();
		            }
		        }
		    });


		}
	});
}

    return {
    	create: create
    };
});