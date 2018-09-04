define(['./config', './prefs', './tabs', './util', './prompt', './loading', './shortcuts', './lang', 'jstree', 'dialogResize'], function (config, preferences, tabs, util, prompt, loading, shortcuts, lang) {
lang = lang.lang;
var confirmed = false;
var inst;

function findChild(parent, name) {
	for( i=0; i<parent.children.length; i++ ){
		var node = inst.get_node(parent.children[i]);

		if(node.text==name) {
			return node;
		}
	}
	return false;
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

function refresh() {
	tree.jstree(true).refresh();
}

function edit(node) {
	//snippet dialog
	$( "body" ).append('<div id="dialog-snippet" title="Edit snippet">\
	  <form id="snippetForm">\
		<input type="hidden" name="id">\
		<p>\
			<label>Name</label>\
			<input type="text" name="name" required class="text ui-widget-content ui-corner-all">\
		</p>\
		<p>\
			<label>Insert type</label>\
			<span id="wrapRadio">\
				<input type="radio" id="radio1" name="wrap" value="1" checked><label for="radio1">Wrap selection</label>\
				<input type="radio" id="radio2" name="wrap" value="0"><label for="radio2">Insert block</label>\
			</span>\
		</p>\
		<span>Insert before</span>\
		<p>\
			<textarea name="snippet1"class="flex text ui-widget-content ui-corner-all"></textarea>\
		</p>\
		<div id="snippet2Container">\
			<span>Insert after</span>\
			<p>\
				<textarea name="snippet2" class="flex ui-widget-content ui-corner-all"></textarea>\
			</p>\
		</div>\
		<p>\
			<label>Shortcut, ctrl + shift + &nbsp;</label>\
			<select name="shortcut" class="text ui-widget-content ui-corner-all">\
				<option value=""></option>\
				<option value="96">0</option>\
				<option value="49">1</option>\
				<option value="50">2</option>\
				<option value="51">3</option>\
				<option value="52">4</option>\
				<option value="53">5</option>\
				<option value="54">6</option>\
				<option value="55">7</option>\
				<option value="56">8</option>\
				<option value="57">9</option>\
			</select>\
		</p>\
	  </form>\
	</div>');

	function toggleWrap() {
		var wrap = $('input[name=wrap]:checked').val();

		if(wrap==1) {
			$('#snippet2Container').show();
		} else {
			$('#snippet2Container').hide();
		}
	}

	//set values
	if(node && node.data) {
		node.data.name = node.text;
		node.data.id = node.id;
		for(var i in node.data) {
			if (node.data.hasOwnProperty(i)) {
				var field = $('[name='+i+']');
				switch(field.attr('type')){
					case 'radio':
						if (node.data[i])
							$("input[name="+i+"][value=" + node.data[i] + "]").prop('checked', true);
					break;
					default:
						field.val(node.data[i]);
					break;
				}
			}
		}
	}

	$( "#wrapRadio" ).buttonset();

	//toggle fields
	$('#wrapRadio label').click(function(){
		$(this).prev().prop('checked', true).val(); //make sure radio is checked
		toggleWrap();
	});

	toggleWrap();

	//open dialog
	var dialog = $( "#dialog-snippet" ).dialogResize({
		width: 500,
		height: 520,
		modal: true,
		close: function( event, ui ) {
			$( this ).remove();
		},
		buttons: {
			Save: function() {
				var params = util.serializeObject($('#snippetForm'));

				//save and create node
				loading.fetch(config.apiBaseUrl+'snippets?cmd=edit', {
					action: 'Saving snippet',
					data: params,
					success: function(data) {
						refresh();
						shortcuts.load();
					}
				});

				$( "#dialog-snippet" ).dialogResize( "close" );
				$( "#dialog-snippet" ).remove();
			}
		}
	});
	
	//select input text
	$('#snippetForm input[name=name]').select();
}

function init() {
	var prefs = preferences.get_prefs();
	
	tree = $('#snippets')
	.jstree({
		'core' : {
			'data' : function (node, callback) {
				//console.log(node);

				if(node.id==='#') {
					return callback.call(tree, {
						children: true,
						id: '#root',
						text: 'Snippets',
						type: 'folder'
					});
				}

				var path = '';
				if(node.id!=='#root')
					path = node.id;

				$.ajax(config.apiBaseUrl+'snippets?cmd=list&path='+encodeURIComponent(path), {
					method: 'POST',
					dataType: 'json',
					//data: options.params,
					success: function(data) {
						callback.call(tree, data.snippets);
					}
				});
			},
			'check_callback' : function(o, n, p, i, m) {
				var t = this;

				if(m && m.dnd && m.pos !== 'i') { return false; }
				if(o === "move_node" || o === "copy_node") {
					if(this.get_node(n).parent === this.get_node(p).id) { return false; }
				}

				if(o === "delete_node") {
					if (!confirmed){
						prompt.confirm({
							title: 'Delete',
							msg: 'Are you sure you want to delete the selected snippet?',
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
				}

				return true;
			},
			'themes': {
				'responsive': false,
				'variant': prefs.treeThemeVariant,
				'dots': false
			}
		},
		'sort' : function(a, b) {
			return this.get_type(a) === this.get_type(b) ? (this.get_text(a).toLowerCase() > this.get_text(b).toLowerCase() ? 1 : -1) : (this.get_type(a) >= this.get_type(b) ? 1 : -1);
		},
		'contextmenu' : {
			'items' : function(node) {
				//var tmp = $.jstree.defaults.contextmenu.items();
				//console.log(node)
				var tmp = {
					"newSnippet": {
						"label": lang.newSnippetText,
						"icon" : "glyphicon glyphicon-leaf",
						"action" : function (data) {
							var inst = $.jstree.reference(data.reference),
								node = inst.get_node(data.reference);
					   		var parent = node.type == 'default' ? node : inst.get_node(node.parent);
					   		
							var newName = findAvailableName(parent, 'New snippet');
							inst.create_node(parent, { type: "file", text: newName, data: {} }, "last", function (new_node) {
					   			inst.open_node(parent);
							});
						},
						_disabled: node.type !== 'default'
					},
					"newFolder": {
						"label": lang.newFolderText,
						"icon" : "glyphicon glyphicon-leaf",
						"action" : function (data) {
							var inst = $.jstree.reference(data.reference),
								node = inst.get_node(data.reference);
					   		var parent = node.type == 'default' ? node : inst.get_node(node.parent);
					   		
							var newName = findAvailableName(parent, 'New folder');
							inst.create_node(parent, { type : "default", text: newName }, "last", function (new_node) {
					   			inst.open_node(parent);
								setTimeout(function () { 
									inst.edit(new_node); 
								}, 0);
							});
						},
						_disabled: node.type !== 'default'
					},
					"edit": {
						"label": lang.editText,
						"icon" : "glyphicon glyphicon-leaf",
						"action" : function (data) {
							var inst = $.jstree.reference(data.reference),
								node = inst.get_node(data.reference);
							edit(node);
						},
						_disabled: node.type !== 'file'
					},
					"rename": {
						"label": lang.renameText,
						"icon" : "glyphicon glyphicon-leaf",
						"action" : function (data) {
							var inst = $.jstree.reference(data.reference),
								node = inst.get_node(data.reference);
							inst.edit(node);
						}
					},
					"delete": {
						"label": lang.deleteText,
						"icon" : "glyphicon glyphicon-leaf",
						"action" : function (data) {
							var inst = $.jstree.reference(data.reference),
								obj = inst.get_node(data.reference);
							if(inst.is_selected(obj)) {
								inst.delete_node(inst.get_selected());
							} else {
								inst.delete_node(obj);
							}
						}
					},
					"reload": {
						"label" : "Reload",
						action: refresh
					}
				};

				return tmp;
			}
		},
		'types' : {
			'default' : { 'icon' : 'fas fa-folder' },
			'file' : { 'icon' : 'fas fa-file' }
		},
		'unique' : {
			'duplicate' : function (name, counter) {
				return name + ' ' + counter;
			}
		},
		'plugins' : [
			'state','dnd','sort','types','contextmenu','unique'
		]
	})
	.on('open_node.jstree', function (e, data) { data.instance.set_icon(data.node, "fas fa-folder-open"); })
	.on('close_node.jstree', function (e, data) { data.instance.set_icon(data.node, "fas fa-folder"); })
	.on('delete_node.jstree', function (e, data) {
		/*
		$.get('?operation=delete_node', { 'id' : data.node.id })
			.fail(function () {
				data.instance.refresh();
			});*/

		$.ajax(config.apiBaseUrl+'snippets?cmd=delete&id='+data.node.id, {
			dataType: 'json',
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
		parent = '';
		
		if(data.node.parent!=='#root')
			parent = data.node.parent;
		
		$.get(config.apiBaseUrl+'snippets?cmd=new', { 
			'type' : data.node.type, 
			'parent' : parent, 
			'text' : data.node.text 
		})
		.done(function (d) {
			if (d.id) {
				data.instance.set_id(data.node, d.id);
				
				inst.deselect_all();
				inst.select_node(data.node);
				
				if (data.node.type=='file') {
					edit(data.node);
				}
			}
		})
		.fail(function () {
			data.instance.refresh();
		});
	})
	.on('rename_node.jstree', function (e, data) {
		var params = {};
		params.id = data.node.id;
		params.name = data.text;

		$.ajax(config.apiBaseUrl+'snippets?cmd=rename', {
			method: 'POST',
			dataType: 'json',
			data: params
		})
		.done(function (d) {
			if(!d.success){
				prompt.alert({title:'Error', msg:d.error});
			}else{
				data.instance.set_text(data.node, params.name);
			}
		})
		.fail(function () {
			data.instance.refresh();
		});

		//$.get('/app/?cmd=rename_node', { 'id' : data.node.id, 'text' : data.text })

	})
	.on('move_node.jstree', function (e, data) {
		prompt.confirm({
			title: 'Move',
			msg: 'Are you sure you want to move the selected snippets?',
			fn: function(btn) {
				switch(btn){
					case 'yes':
						doMove();
					break;
					default:
						data.instance.refresh();
					break;
				}
			}
		});

		function doMove() {
			function moveCallback() {
				data.instance.refresh();
			}

			var params = {};
			params.parent = '';
			
			if(data.parent!=='#root')
				params.parent = data.parent;

			params.id = data.node.id;

			$.ajax(config.apiBaseUrl+'snippets?cmd=move', {
				method: 'GET',
				dataType: 'json',
				data: params
			})
			.done(moveCallback)
			.fail(function () {
				data.instance.refresh();
			});
		}
	})
	.on('dblclick','a',function (e, data) {
		var inst = $.jstree.reference(this);
		var node = inst.get_node(this);
		var editor = tabs.getEditor(tabs.active());
		var item = node.data;

		if (item && editor) {
			if(parseInt(item.wrap)) {
				editor.commands.exec('wrapSelection', editor, [item.snippet1, item.snippet2]);
			} else {
				editor.insert(item.snippet1);
			}
		}
	});
	
	inst = $.jstree.reference($('#snippets'));
}

	return {
		init: init
	};
});