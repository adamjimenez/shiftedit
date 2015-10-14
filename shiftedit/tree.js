define(["jstree","app/util","app/editor","app/prompt",'app/lang','app/tabs'], function () {
var util = require('app/util');
var editor = require('app/editor');
var lang = require('app/lang').lang;
var prompt = require('app/prompt');
var tabs = require('app/tabs');
var options = {};
var tree;

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

        		$.ajax(options.url+'&cmd=list', {
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
    			var tmp = $.jstree.defaults.contextmenu.items();
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
    	$.get('?operation=delete_node', { 'id' : data.node.id })
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
    	$.get('?operation=rename_node', { 'id' : data.node.id, 'text' : data.text })
    		.done(function (d) {
    			data.instance.set_id(data.node, d.id);
    		})
    		.fail(function () {
    			data.instance.refresh();
    		});
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
    })
    .on('changed.jstree', function (e, data) {
    	if(data && data.selected && data.selected.length) {
    	    var file = data.selected.join(':');
    	    tabs.open(file, options.site);
    	}
    	else {
    		$('#data .content').hide();
    		$('#data .default').html('Select a file from the tree.').show();
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