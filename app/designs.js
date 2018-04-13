define(['./util', './config', './tabs', './site', './prefs', 'exports', 'dialogResize'], function (util, config, tabs, site, preferences, exports) {
function create(tab) {
	var panel = $('.ui-layout-center').tabs('getPanelForTab', tab);
	var editor = tabs.getEditor(tab);

	tab.data('design-ready', true);
	
	var code = editor.getValue();
	var bodyStartPos = code.indexOf('<body');
	var bodyEndPos = code.indexOf('</body');
	if (bodyStartPos !== -1 && bodyEndPos !== -1) {
		code = code.substr(bodyStartPos, bodyEndPos-bodyStartPos);
	}

	var ta = $('<div class="tinymce"></div>').appendTo(panel.find('.design'));
	ta[0].value = code;
	var designId = ta.uniqueId().attr('id');
	
	var base_url = '';
	var relative_urls = true;
	var convert_urls = false;
	
	if (tab.data("site")) {
		relative_urls = false;
		convert_urls = true;
		
		var settings = site.getSettings(tab.data("site"));
		
		if (settings.web_url) {
			base_url = settings.web_url;
		
			if (settings.encryption == "1") {
				base_url = 'https://'+base_url;
			} else {
				base_url = 'http://'+base_url;
			}
			
			var dirname = util.dirname($(tab).data('file'));
			if (dirname) {
				base_url = base_url + dirname + '/';
			}
		}
	}

	tinymce.init({
		//mode : "exact",
		theme: 'inlite',
		mobile: { 
			theme: 'mobile',
			plugins: [ 'autosave', 'lists', 'autolink' ],
			toolbar: [ 'undo', 'bold', 'italic', 'styleselect' ]
		},
		selector : '#'+designId,
		relative_urls : relative_urls,
		convert_urls: convert_urls,
		document_base_url : base_url,
		remove_script_host : false,
		//body_class: 'mceForceColors',
		plugins: [
			"advlist autolink lists link image charmap print preview anchor",
			"searchreplace visualblocks code fullscreen fullpage",
			"insertdatetime media table contextmenu paste fullpage textcolor colorpicker"
		],
		//toolbar: "styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image forecolor backcolor",

		protect: [
			/<\?[\s\S]*\?>/g // Protect php code
		],
		//insert_toolbar: 'quickimage quicktable media codesample',
		insert_toolbar: '',
		selection_toolbar: 'bold italic strikethrough | quicklink h1 h2 h3 blockquote bullist | forecolor backcolor',
		inline: true,
		paste_data_images: true,

		init_instance_callback: function (inst) {
			inst.on('change undo redo keypress ExecCommand', function(e) {
				var code = inst.getContent();
				var regexp = /<body[^>]*>([\s\S]*)<\/body>/gi;
				var match = regexp.exec(code);
				
				if (match) {
					code = match[1];
				}

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
			
			inst.focus();
		},

		file_browser_callback :  function(field_name, url, type, win) {
			var siteId = site.active();
			var ajaxOptions = site.getAjaxOptions(config.apiBaseUrl+'files?site='+siteId);
			var settings = site.getSettings();
			var prefs = preferences.get_prefs();

			$( "body" ).append('<div id="dialog-choose-image" title="Choose image">\
			<div id="imageTree"></div>\
			</div>');

			var imageTree = $('#imageTree').jstree({
				'core' : {
					'data' : function (node, callback) {
						if( ['GDrive', 'GDriveLimited'].indexOf(settings.server_type) !== -1 ){
							gdrive.directFn({node: node, callback: callback, tree: $('#imageTree')});
						} else {
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

							$.ajax(ajaxOptions.url+'&cmd=get&path='+encodeURIComponent(node.id), {
								method: 'POST',
								dataType: 'json',
								data: params,
								xhrFields: {
									withCredentials: true
								},
								success: function(data) {
									//console.log(data);
									callback.call(imageTree, data.files);
								}
							});
						}
					},
					'force_text': true,
					'themes': {
						'responsive': false,
						'variant': prefs.treeThemeVariant,
						'dots': false
					}
				},
				'types' : {
					'default' : { 'icon' : 'fas fa-folder' },
					'file' : { 'icon' : 'fas fa-file' }
				},
				'sort' : function(a, b) {
					return this.get_type(a) === this.get_type(b) ? (this.get_text(a).toLowerCase() > this.get_text(b).toLowerCase() ? 1 : -1) : (this.get_type(a) >= this.get_type(b) ? 1 : -1);
				},
				'plugins' : [
					'sort', 'types'
				]
			})
			.on('open_node.jstree', function (e, data) { data.instance.set_icon(data.node, "fas fa-folder-open"); })
			.on('close_node.jstree', function (e, data) { data.instance.set_icon(data.node, "fas fa-folder"); })
			.on('refresh.jstree', function(e, data){
				//expand root node
				var inst = $.jstree.reference($('#imageTree'));
				var rootNode = $('#imageTree').jstree(true).get_node('#').children[0];
				inst.open_node(rootNode);
			});

			imageTree.jstree(true).refresh();

			$( "#dialog-choose-image" ).dialogResize({
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
									
									if (path.indexOf('://') ==-1) {
										if (parseInt(settings.encryption)) {
											path = 'https://'+path;
										} else {
											path = 'http://'+path;
										}
									}
								}else{
									path = 	'//'+settings.domain;
								}

								if( path.substr(-1, 1)!=='/' ){
									path += '/';
								}

								path += to;

								win.document.getElementById(field_name).value = path;
								$( this ).dialogResize( "close" );
								$( "#dialog-choose-image" ).remove();
							}
						}
					},
					Cancel: function() {
						$( this ).dialogResize( "close" );
						$( "#dialog-choose-image" ).remove();
					},
					close: function( event, ui ) {
						$( this ).remove();
					}
				}
			});


		}
	});
}

	exports.create = create;
});