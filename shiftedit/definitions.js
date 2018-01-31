define(['app/tabs','app/util', 'jquery','ace/ace'], function (tabs,util) {
var TokenIterator = require("ace/token_iterator").TokenIterator;

	//gets defined classes / variables etc
	function getDefinitions() {
		var tab = this;
		var editor = tabs.getEditor(tab);
		if(!editor)
			return;

		var token;
		var session;
		var iterator;
		var mode = editor.getSession().$modeId.substr(9);
		var i;
		var definitions = {};
		var definitionRanges = {};
		var definitionLibs = {};
		var prevToken = null;
		var pos;
		var prevPos;
		var func = false;
		var name;
		var className = '';
		var inClass = '';
		var classDepth = 0;
		var args = '';
		var variable = '';
		var inSquare = false;
		var attribute_name = '';
		var attribute_value = '';
		var index = 0;
		var inClassProperty = false;
		var classDef = false;
		var value = '';
		var context = mode === 'php' ? 'html' : mode;
		if( context == 'javascript' ){
			context = 'js';
		}
		
		try {
			session = editor.getSession();
			iterator = new TokenIterator(session, 0, 0);
			token = iterator.getCurrentToken();
		} catch(err) {
			return false;
		}

		while (token!==null) {
			//console.log(token);
			if( !token ){
				token = iterator.stepForward();
				continue;
			}

			//change syntax
			//php
			if( token.type == 'support.php_tag' && token.value != '?>' ){
				context = 'php';
			}
			else if( token.type == 'support.php_tag' && token.value == '?>' ){
				context = 'html';
			}
			//css
			else if( util.startsWith(token.type, 'meta.tag.style.tag-name') && context != 'css' ){
				context = 'css';
			}
			else if( util.startsWith(token.type, 'meta.tag.style.tag-name') && context == 'css' ){
				context = 'html';
			}
			//js
			else if( util.startsWith(token.type, 'meta.tag.script.tag-name') && context != 'js' ){
				context = 'js';
			}
			else if( util.startsWith(token.type, 'meta.tag.script.tag-name') && context == 'js' ){
				context = 'html';
			}

			if( !definitions[context] && context!=='html' ){
				definitions[context] = {
					classes: {},
					functions: {},
					variables: {},
					ids: {}
				};

				if( !definitionRanges[context] ){
					definitionRanges[context] = util.clone(definitions[context]);
				}
			}else if( context=='html' && !definitions.css ){
				definitions.css = {
					functions: {},
					variables: {},
					ids: {},
					classes: {}
				};

				if( !definitionRanges.css ){
					definitionRanges.css = util.clone(definitions.css);
				}
			}

			//html info
			if( token.type == 'entity.other.attribute-name.xml' && context == 'html' ){
				attribute_name = token.value;
				attribute_value = '';
			}

			if( token.type == 'string.attribute-value.xml' && context == 'html' ){
				attribute_value = token.value;
			}

			//php functions
			//console.log(token);
			if(
				(token.type == 'keyword' || token.type == 'storage.type') &&
				(token.value == 'function' || token.value == 'def')
			){
				func = ' ';
			//get arguments
			}else if( func && token.type == 'paren.lparen' && token.value == '(' ){
				args = '(';
			}else if( func && token.type == 'paren.rparen' && token.value == ')' ){
				func = func.trim();

				if(func){
					if( inClass ){
						definitions[context].classes[inClass].functions[func] = args.trim()+')';
					}else{
						definitions[context].functions[func] = args.trim()+')';
					}
				}
				func = false;
				args = '';
			}else if( args ){
				args += token.value;
			}else if( func!==false ){
				func += token.value;
				func = func.trim();

				if(func){
					if( inClass ){
						if( definitionRanges[context] ){
							definitionRanges[context].classes[inClass].functions[func] = {
								start: {
									column: iterator.getCurrentTokenColumn(),
									row: iterator.getCurrentTokenRow()
								}
							};
						}
					}else{
						if( definitionRanges[context] ){
							definitionRanges[context].functions[func] = {
								start: {
									column: iterator.getCurrentTokenColumn(),
									row: iterator.getCurrentTokenRow()
								}
							};
						}
					}
				}
			}else{
				func = false;
			}
			
			//functions that aren't defined
			if (!func && token.type == 'paren.lparen' && token.value == '(' && prevToken && prevToken.type === 'identifier') {
				definitions[context].functions[prevToken.value] = '()';
				definitionRanges[context].functions[prevToken.value] = {
					start: prevPos
				};
			}
			
			if (!func && token.type == 'identifier' && definitions[context] && !definitions[context].functions[token.value]) {
				//check for wordpress
				if (token.value.match(/wp_(.*)/)) {
					definitionLibs.wordpress = true;
				}
			}

			//php classes
			if(
				(token.type == 'keyword') &&
				(token.value == 'class')
			){
				className = ' ';
			//get arguments
			}else if( className && token.type == 'text' ){
			}else if( className && token.type == 'identifier' ){
				name = token.value.trim();

				definitions[context].classes[name] = {
					functions: {}
				};
				definitionRanges[context].classes[name] = {
					functions: {},
					start: {
						column: iterator.getCurrentTokenColumn(),
						row: iterator.getCurrentTokenRow()
					}
				};
				inClass = token.value.trim();
			}else{
				className = '';
			}

			if( inClass && token.type == 'paren.lparen' && token.value.indexOf('{') !== -1 ){
				for(i = 0; i<token.value.length; i++){
					if( token.value.charAt(i)==='{' ){
						classDepth++;
					}
				}
			}else if( inClass && token.type == 'paren.rparen' && token.value.indexOf('}') !== -1 ){
				for(i = 0; i<token.value.length; i++){
					if( token.value.charAt(i)==='}' ){
						classDepth--;
					}
				}

				if( classDepth===0 ){
					definitionRanges[context].classes[inClass].end = {
						column: iterator.getCurrentTokenColumn(),
						row: iterator.getCurrentTokenRow()
					};

					inClass = '';
				}
			}

			//class properties
			if( inClass && token.type == 'variable' && token.value == '$this'  ){
				inClassProperty = true;
			}else if( inClassProperty && token.type == 'keyword.operator' && token.value == '->' ){
			}else if( inClassProperty && token.type == 'identifier' ){
				name = token.value.trim();

				if( !definitions[context].classes[inClass].functions[name] ){
					definitions[context].classes[inClass].functions[name] = 1;
					definitionRanges[context].classes[inClass].functions[name] = {
						start: {
							column: iterator.getCurrentTokenColumn(),
							row: iterator.getCurrentTokenRow()
						}
					};
				}
			}else{
				inClassProperty = false;
			}

			//css classes
			if( context == 'css' ){
				if( token.type == 'variable'  ){
					name = token.value.substr(1);
					definitions[context].classes[name] = 1;
					definitionRanges[context].classes[name] = {
						start: {
							column: iterator.getCurrentTokenColumn()+1,
							row: iterator.getCurrentTokenRow()
						}
					};
				}
			}

			//css ids
			if( context == 'css' ){
				if( token.type == 'keyword'  ){
					name = token.value.substr(1);
					definitions[context].ids[name] = 1;
					definitionRanges[context].ids[name] = {
						start: {
							column: iterator.getCurrentTokenColumn()+1,
							row: iterator.getCurrentTokenRow()
						}
					};
				}
			}

			//dom ids
			else if( context == 'html' && attribute_name == 'id' && attribute_value ){
				name = attribute_value.replace(/"/g, '');
				definitions.css.ids[name] = 1;
				definitionRanges.css.ids[name] = {
					start: {
						column: iterator.getCurrentTokenColumn()+1,
						row: iterator.getCurrentTokenRow()
					}
				};

				attribute_value = '';
			}

			//dom classes
			else if( context == 'html' && attribute_name == 'class' && attribute_value ){
				var classes = attribute_value.replace(/"/g, '').split(' ');
				for( i in classes ){
					if (classes.hasOwnProperty(i)) {
						name = classes[i];
						definitions.css.classes[name] = 1;
						definitionRanges.css.classes[name] = {
							start: {
								column: iterator.getCurrentTokenColumn()+1,
								row: iterator.getCurrentTokenRow()
							}
						};
						
						//check for bootstrap
						if (name.match(/col-[a-z]{2}-/)) {
							definitionLibs.bootstrap = true;
						}
					}
				}

				attribute_value = '';
			}

			//php vars
			else if( context == 'php' ){
				//console.log(token);

				if( token.type.substr(0, 'variable'.length) == 'variable' ){
					variable = token.value;
					if( !definitions[context].variables[variable] ){
						definitions[context].variables[variable] = 1;
						definitionRanges[context].variables[variable] = {
							start: {
								column: iterator.getCurrentTokenColumn(),
								row: iterator.getCurrentTokenRow()
							}
						};
					}
				}else if( variable && token.type == 'paren.lparen' && token.value == '[' ){
					inSquare = true;
				}else if( variable && token.type == 'paren.rparen' && token.value.indexOf(']') !== -1 ){
					variable = '';
					inSquare = false;
				//array value
				}else if( inSquare && variable && token.type == 'string' ){
					if( typeof definitions[context].variables[variable] != "object" ){
						definitions[context].variables[variable] = {
							type: 'php_array',
							value: {}
						};
					}

					value = token.value.replace(/['"]/g,"");

					if( value ){
						definitions[context].variables[variable].value[token.value.replace(/['"]/g,"")] = 2;
					}
				//class
				}else if( variable && token.type == 'text' ){
				}else if( variable && token.type == 'keyword.operator' ){
				}else if( variable && token.type == 'keyword' && token.value == 'new' ){
					classDef = true;
				}else if( variable && token.type == 'support.class' && token.value !== 'self' && classDef ){
					definitions[context].variables[variable] = {
						type: 'class',
						value: token.value
					};
				}else{
					variable = '';
					inSquare = false;
					classDef = false;
				}
			}


			prevToken = token;
			prevPos = pos;
			token = iterator.stepForward();
			if (token) {
				pos = {
					column: iterator.getCurrentTokenColumn(),
					row: iterator.getCurrentTokenRow()
				};
			}
		}

		window.shiftedit.defs[$(tab).attr('id')] = {
			'definitions': definitions,
			'definitionRanges': definitionRanges,
			'definitionLibs': definitionLibs
		};

		update(tab);
	}

	function goto(editor, column, row, length) {
		var start = {
			column: column,
			row: row
		};
		var end = {
			column: parseInt(column) + parseInt(length),
			row: row
		};

		editor.selection.setSelectionRange({
			start: start,
			end: end
		});

		editor.scrollToLine(start.row+1, true, true);
		editor.focus();
	}

	function gotoDeclaration(value) {
		var defs = _get();
		if (defs) {
			var editor = tabs.getEditor();
			definitionRanges = editor.definitionRanges;

			$.each(defs, function (key, val) {
				if (!key || !val) {
					return;
				}

				$.each(val, function (key2, val2) {
					if (Object.keys(val2).length) {
						$.each(val2, function (key3, val3) {
							var pos = definitionRanges[key][key2][key3];

							if( key3===value ){
								_goto(pos.start.column, pos.start.row, key3.length);
								return;
							}

							if( key2=='classes' && val3.functions ){
								$.each(val3.functions, function (key4, val4) {
									var pos = definitionRanges[key][key2][key3].functions[key4];

									if( key4===value ){
										_goto(pos.start.column, pos.start.row, key4.length);
										return;
									}
								});
							}
						});
					}
				});
			});
		}
	}

	function update(tab) {
		var tabId = $(tab).attr('id');
		var defs = window.shiftedit.defs[tabId].definitions;
		var HTML = '';

		if (defs) {
			definitionRanges = window.shiftedit.defs[tabId].definitionRanges;

			var innerHTML = '';
			$.each(defs, function (key, val) {
				if (!key || !val) {
					return;
				}

				innerHTML = '';

				$.each(val, function (key2, val2) {
					if (Object.keys(val2).length) {
						innerHTML += '<li>'+key2+'</li>';

						innerHTML += '<ul>';
						$.each(val2, function (key3, val3) {
							var pos = definitionRanges[key][key2][key3];
							innerHTML += '<li><a href="#" data-column="' + pos.start.column + '" data-row="' + pos.start.row + '" data-length="' + key3.length + '" title="' + util.escapeHTML(key3) + '">' + util.escapeHTML(key3) + '</a></li>';

							if( key2=='classes' && val3.functions ){
								innerHTML += '<ul>';
								$.each(val3.functions, function (key4, val4) {
									var pos = definitionRanges[key][key2][key3].functions[key4];
									innerHTML += '<li><a href="#" data-column="' + pos.start.column + '" data-row="' + pos.start.row + '" data-length="' + key3.length + '" title="' + util.escapeHTML(key4) + '">' + util.escapeHTML(key4) + '</a></li>';
								});
								innerHTML += '</ul>';
							}
						});
						innerHTML += '</ul>';
					}
				});

				if( innerHTML ){
					HTML += '<h2>'+key+'</h2>';
					HTML += '<ul>'+innerHTML+'</ul>';
				}
			});
		}

		if( !HTML ){
			HTML = '<p style="text-align:center; color:#ccc;">definitions will appear here</p>';
		}

		$('#tabs-definitions').html(HTML);

		var editor = tabs.getEditor(tab);
		$('#tabs-definitions a').click(function(){
			var column = $(this).data('column');
			var row = $(this).data('row');
			var length = $(this).data('length');
			goto(editor, column, row, length);
			return false;
		});
	}

	window.shiftedit.defs = {};
	$('#tabs-definitions').html('<p style="text-align:center; color:#ccc;">definitions will appear here</p>');

	//event listeners
	var timer;
	$('body').on('change', 'li[role=tab][data-file]', function() {
		var tab = this;
		clearTimeout(timer);
		timer = setTimeout(jQuery.proxy(getDefinitions, tab), 1000);
	});

	$('body').on('activate', 'li[role=tab][data-file]', function() {
		var tab = this;
		clearTimeout(timer);
		timer = setTimeout(jQuery.proxy(getDefinitions, tab), 1000);
	});

	return {
	};
});