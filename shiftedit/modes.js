define(['app/prefs'], function (preferences) {
	var modes = [
		//picks
		['html', 'HTML', ['html', 'htm', 'tpl', 'twig'], 'text/html'],
		['javascript', 'JavaScript', ['js', 'jade'], 'text/javascript'],
		['css', 'CSS', ['css'], 'text/css'],
		['php', 'PHP', ['php', 'php3', 'phtml', 'ctp', 'phpt'], 'application/x-httpd-php'],
		['svg', 'SVG', ['svg'], 'text/svg'],
		['xml', 'XML', ['xml'], 'text/xml'],
		['text', 'Plain Text', ['txt'], 'text/plain'],
		['json', 'JSON', ['json'], 'application/json'],
		['ruby', 'Ruby', ['rb'], 'text/x-ruby'],
		['html_ruby', 'HTML Ruby', ['erb'], 'text/x-ruby'],
		['coffee', 'CoffeeScript', ['coffee', 'cof'], 'text/coffeescript'],
		['python', 'Python', ['py'], 'application/x-python'],

		//the rest
		['apache_conf', 'Apache Conf', ['htaccess', 'htpasswd'], 'text/htaccess', ''],
		['aspx', 'ASPX', ['aspx', 'asp'], 'text/x-aspx'],
		['autohotkey', 'AutoHotkey', ['ahk'], 'text/autohotkey'],
		['c_cpp', 'C++', ['cpp', 'h'], 'text/x-c++src'],
		['clojure', 'Clojure', ['clojure'], 'text/x-clojure'],
		['coldfusion', 'ColdFusion', ['cfm', 'cfml', 'cfc'], 'text/cfml'],
		['csharp', 'C#', ['cs'], 'text/x-c#src'],
		['dart', 'Dart', ['dart'], 'text/x-dart'],
		['erlang', 'Erlang', ['erl'], 'text/x-erlang'],
		['fsharp', 'F#', ['fs'], 'text/x-f#src'],
		['golang', 'Go', ['go'], 'text/x-go'],
		['groovy', 'Groovy', ['groovy'], 'text/x-groovy'],
		['jade', 'Jade', ['jade'], 'text/x-jade'],
		['java', 'Java', ['java'], 'text/x-java'],
		['jsx', 'JSX', ['jsx'], 'text/x-jsx'],
		['julia', 'Julia', ['jl'], 'text/x-julia'],
		['latex', 'Latex', ['latex'], 'text/x-latex'],
		['less', 'LESS', ['less'], 'text/x-less'],
		['liquid', 'Liquid', ['liquid'], 'text/liquid'],
		['lsl', 'Linden Scripting Language', ['lsl'], 'text/lsl'],
		['lua', 'Lua', ['lua'], 'text/lua'],
		['markdown', 'MarkDown', ['markdown', 'mdown', 'md', 'mkd', 'mkdn'], 'text/x-markdown'],
		['ocaml', 'OCaml', ['ocaml', 'ml', 'mli'], 'text/ocaml'],
		['perl', 'Perl', ['pl'], 'text/x-perl'],
		['scala', 'Scala', ['scala'], 'text/scala'],
		['scss', 'SCSS', ['scss'], 'text/scss'],
		['sql', 'SQL', ['sql'], 'text/sql'],
		['sh', 'Shell', ['sh'], 'text/x-sh'],
		['tcl', 'TCL', ['tcl'], 'text/tcl'],
		['textile', 'Textile', ['textile'], 'text/textile'],
		['vbscript', 'VBScript', ['vbs'], 'text/vbscript'],
		['yaml', 'YAML', ['yaml', 'yml'], 'text/yaml']
	];

	return {
		modes: modes,
		find: function(ext) {
			//check default file associations
			var mode = 'text';
			prefs = preferences.get_prefs();

			if( prefs.fileAssociations && prefs.fileAssociations[ext] ){
				mode = prefs.fileAssociations[ext];
			}else{
				modes.forEach(function (item) {
					if (item[2].indexOf(ext) !== -1) {
						mode = item[0];
						return;
					}
				});
			}

			return mode;
		}
	};
});