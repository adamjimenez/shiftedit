define(["jstree","app/util","app/editor","app/prompt",'app/lang','app/tabs'], function () {
var util = require('app/util');
var editor = require('app/editor');
var lang = require('app/lang').lang;
var prompt = require('app/prompt');
var tabs = require('app/tabs');
var options = {};
var tree;
var confirmed = false;

function init() {
    tree = $('#tree')
    .jstree({
    	'core' : {
    	    /*
    		'data' : {
    			'url' : '',
    			'data' : function (node) {
    				return { 'id' : node.id };
    			}
    		},*/
            'data' : function (node, callback) {
                console.log(node);

                if(!options.url){
                    return false;
                }

        		$.ajax(options.url+'&cmd=list&path='+encodeURIComponent(node.id), {
        		    method: 'POST',
        		    dataType: 'json',
        		    data: options.params,
        		    success: function(data) {
                        callback.call(tree, data);
        		    }
        		});
            },
    		'check_callback' : function(o, n, p, i, m) {
    			if(m && m.dnd && m.pos !== 'i') { return false; }
    			if(o === "move_node" || o === "copy_node") {
    				if(this.get_node(n).parent === this.get_node(p).id) { return false; }
    			}

    			if(o === "delete_node") {
                	var t = this;

                	if (!confirmed){
                    	prompt.confirm({
                    	    title: 'Delete',
                    	    msg: 'Are you sure you want to delete the selected files?',
                    	    fn: function(btn) {
                    	        switch(btn){
                    	            case 'yes':
                    	                //console.log(o, n, p, i, m);
                    	                confirmed = true;
                    	                t.delete_node(n);
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
    		'force_text' : true,
    		'themes' : {
    			'responsive' : false,
    			'variant' : 'small',
    			'stripes' : true
    		}
    	},
    	'sort' : function(a, b) {
    		return this.get_type(a) === this.get_type(b) ? (this.get_text(a).toLowerCase() > this.get_text(b).toLowerCase() ? 1 : -1) : (this.get_type(a) >= this.get_type(b) ? 1 : -1);
    	},
    	'contextmenu' : {
    		'items' : function(node) {
    			//var tmp = $.jstree.defaults.contextmenu.items();

    			var tmp = {
                    "rename": {
                        "separator_before": false,
                        "separator_after": false,
                        "_disabled": false,
                        "label": "Rename",
    					"shortcut"			: 113,
    					"shortcut_label"	: 'F2',
    					"icon"				: "glyphicon glyphicon-leaf",
    					"action"			: function (data) {
    						var inst = $.jstree.reference(data.reference),
    							obj = inst.get_node(data.reference);
    						inst.edit(obj);
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
    					"action"			: function (data) {
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
                    "ccp": {
                        "separator_before": true,
                        "icon": false,
                        "separator_after": false,
                        "label": "Edit",
                        "action": false,
                        "submenu": {
                            "cut": {
                                "separator_before": false,
                                "separator_after": false,
                                "label": "Cut",
    							"action"			: function (data) {
    								var inst = $.jstree.reference(data.reference),
    									obj = inst.get_node(data.reference);
    								if(inst.is_selected(obj)) {
    									inst.cut(inst.get_top_selected());
    								}
    								else {
    									inst.cut(obj);
    								}
    							}
                            },
                            "copy": {
                                "separator_before": false,
                                "icon": false,
                                "separator_after": false,
                                "label": "Copy",
                                "shortcut": 67,
                                "shortcut_label": "C",
    							"action"			: function (data) {
    							    console.log('yooo');
    								var inst = $.jstree.reference(data.reference),
    									obj = inst.get_node(data.reference);
    								if(inst.is_selected(obj)) {
    									inst.copy(inst.get_top_selected());
    								}
    								else {
    									inst.copy(obj);
    								}
    							}
                            },
                            "paste": {
                                "separator_before": false,
                                "icon": false,
    							"_disabled"			: function (data) {
    								return !$.jstree.reference(data.reference).can_paste();
    							},
                                "separator_after": false,
                                "label": "Paste",
    							"action"			: function (data) {
    								var inst = $.jstree.reference(data.reference),
    									obj = inst.get_node(data.reference);
    								inst.paste(obj);
    							}
                            }
                        }
                    }
                };

    			console.log(tmp);

    			/*
    			delete tmp.create.action;
    			tmp.create.label = "New";
    			tmp.create.submenu = {
    				"create_folder" : {
    					"separator_after"	: true,
    					"label"				: "Folder",
    					"action"			: function (data) {
    						var inst = $.jstree.reference(data.reference),
    							obj = inst.get_node(data.reference);
    						inst.create_node(obj, { type : "default" }, "last", function (new_node) {
    							setTimeout(function () { inst.edit(new_node); },0);
    						});
    					}
    				},
    				"create_file" : {
    					"label"				: "File",
    					"action"			: function (data) {
    						var inst = $.jstree.reference(data.reference),
    							obj = inst.get_node(data.reference);
    						inst.create_node(obj, { type : "file" }, "last", function (new_node) {
    							setTimeout(function () { inst.edit(new_node); },0);
    						});
    					}
    				}
    			};
    			if(this.get_type(node) === "file") {
    				delete tmp.create;
    			}
    			*/

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
    	'plugins' : ['state','dnd','sort','types','contextmenu','unique']
    })
    .on('delete_node.jstree', function (e, data) {
        /*
    	$.get('?operation=delete_node', { 'id' : data.node.id })
    		.fail(function () {
    			data.instance.refresh();
    		});*/

		$.ajax(options.url+'&cmd=delete&file='+data.node.id, {
		    method: 'POST',
		    dataType: 'json',
		    data: options.params,
		    /*
		    data: options.params,
		    success: function(data) {
                callback.call(tree, data);
		    }
		    */
		})
		.fail(function () {
			data.instance.refresh();
		});
    })
    .on('create_node.jstree', function (e, data) {
    	$.get('?operation=create_node', { 'type' : data.node.type, 'id' : data.node.parent, 'text' : data.node.text })
    		.done(function (d) {
    			data.instance.set_id(data.node, d.id);
    		})
    		.fail(function () {
    			data.instance.refresh();
    		});
    })
    .on('rename_node.jstree', function (e, data) {
        //console.log(e);
        //console.log(data);

        var params = util.clone(options.params);
        params.oldname = data.old;
        params.newname = data.text;
        params.site = options.site;

		$.ajax(options.url+'&cmd=rename', {
		    method: 'POST',
		    dataType: 'json',
		    data: params
		})
		.done(function (d) {
		    if(!d.success){
		        prompt.alert('Error', d.error);
		    }else{
    		    data.instance.set_id(data.node, params.newname);
		        $('#tree').trigger('rename', params);
		    }
    	})
    	.fail(function () {
    		data.instance.refresh();
    	});

    	//$.get('/app/?cmd=rename_node', { 'id' : data.node.id, 'text' : data.text })

    })
    .on('move_node.jstree', function (e, data) {
    	$.get('?operation=move_node', { 'id' : data.node.id, 'parent' : data.parent })
    		.done(function (d) {
    			//data.instance.load_node(data.parent);
    			data.instance.refresh();
    		})
    		.fail(function () {
    			data.instance.refresh();
    		});
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
    }).on('keydown.jstree', '.jstree-anchor', function (e) {
        if($('.jstree-rename-input').length){
            return;
        }

        var reference = this;
        var instance = $.jstree.reference(this);
        var selected = instance.get_selected();
        var items = instance.settings.contextmenu.items(selected);
        for(var i in items){
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
    })
    .on('dblclick','a',function (e, data) {
        var reference = this;
        var instance = $.jstree.reference(this);
        var selected = instance.get_selected();
        var obj = instance.get_node(reference);

        if(obj.icon==="folder") {
            return;
        }

    	if(selected && selected.length) {
    	    var file = selected.join(':');
    	    tabs.open(file, options.site);
    	}
    })
    /*
    .on('changed.jstree', function (e, data) {
    	if(data && data.selected && data.selected.length) {
    	    var file = data.selected.join(':');
    	    tabs.open(file, options.site);
    	}
    	else {
    		$('#data .content').hide();
    		$('#data .default').html('Select a file from the tree.').show();
    	}
    })*/;

    //only select filename part on rename
    $(document).on("focus", '.jstree-rename-input', util.selectFilename);


    $('.drag')
        .on('mousedown', function (e) {
            console.log(1);
            return $.vakata.dnd.start(e, { 'jstree' : true, 'obj' : $(this), 'nodes' : [{ id : true, text: $(this).text() }] }, '<div id="jstree-dnd" class="jstree-default"><i class="jstree-icon jstree-er"></i>' + $(this).text() + '</div>');
        });
    $(document)
        .on('dnd_move.vakata', function (e, data) {
            var t = $(data.event.target);
            if(!t.closest('.jstree').length) {
                if(t.closest('.editor').length) {
                    var pos = $(data.helper).position();
                    data.helper.find('.jstree-icon').removeClass('jstree-er').addClass('jstree-ok');

                    editor = ace.edit(t.closest('.editor')[0]);
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
            console.log(3);
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

                    editor = ace.edit(t.closest('.editor')[0]);
        			editor.focus();

                    var panel = t.closest('.ui-tabs-panel')[0];
                    var id = $(panel).attr('id');
                    var tab = $('li[aria-controls='+id+']')[0];

                    var nodes = data.data.nodes;
            		if (nodes) {
            			var node;
            			var html = '';

            			for( i=0; i<nodes.length; i++ ){
            				node = nodes[i];

            				var from = $(tab).data('file');
            				//var to = tree.getPath(node);
            				var to = node;
            				var path = '';

            				if( from ){
            				//	path = relative(dirname(from), to);
            					path = '/'+to;
            				}else{
            					path = '/'+to;
            				}

            				switch( util.fileExtension(node.toLowerCase()) ){
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


}

function refresh() {
    tree.jstree(true).refresh();
}

function setAjaxOptions(siteOptions) {
    options = siteOptions;
    tree.jstree(true).settings.core.data.url = options.url;

    //tree.jstree('create_node', '#', {'id' : 'myId', 'text' : 'My Text'}, 'last');

    refresh();
}

return {
    init: init,
    setAjaxOptions: setAjaxOptions,
    refresh: refresh
};

});