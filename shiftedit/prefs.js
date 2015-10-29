define(['jquery', 'app/storage', 'ace/mode/css/csslint', 'app/lang'], function () {
var storage = require('app/storage');
var lang = require('app/lang').lang;
var prefs = storage.get('prefs');
var openingFilesBatch = [];

var defaultPrefs = {};
defaultPrefs.defaultCode = JSON.stringify({
	html: "<!DOCTYPE HTML>\n\
<html>\n\
<head>\n\
<meta charset=\"utf-8\">\n\
<title>\n\
	Untitled Document\n\
</title>\n\
</head>\n\
<body>\n\
\n\
</body>\n\
</html>",
	php: "<?php\
\
?>",
	js: "// JavaScript Document\n\
\
",
	css: "@charset \"utf-8\";\n\
/* CSS Document */\
\
"
});
defaultPrefs.encoding = 'UTF-8';
defaultPrefs.imageEditor = 'pixlr';
defaultPrefs.unknownTarget = '_blank';
defaultPrefs.theme = 'DarkOrange'; //Grey
defaultPrefs.tabSize = 2;
defaultPrefs.lineBreak = 'auto'; //windows unix
defaultPrefs.font = "Courier New";
defaultPrefs.fontSize = 12;
defaultPrefs.softTabs = true;
defaultPrefs.indentOnPaste = false;
defaultPrefs.wordWrap = false;
defaultPrefs.fullLineSelection = false;
defaultPrefs.highlightActiveLine = false;
defaultPrefs.showInvisibles = false;
defaultPrefs.lineNumbers = true;
defaultPrefs.keyBinding = 'default';
defaultPrefs.codeFolding = 'manual';
defaultPrefs.scrollSpeed = 2;
defaultPrefs.printMargin = false;
defaultPrefs.hScroll = true;
defaultPrefs.printMarginColumn = 80;
defaultPrefs.codeTheme = 'tomorrow_night'; //default
defaultPrefs.autocomplete = true;
defaultPrefs.colorPicker = true;
defaultPrefs.numberPicker = true;
defaultPrefs.zen = true;
defaultPrefs.behaviours = true;
defaultPrefs.scrollPastEnd = true;
defaultPrefs.syntaxErrors = true;
defaultPrefs.filePanelWidth = 250;
defaultPrefs.designModeWarning = true;
defaultPrefs.singleClickOpen = false;
defaultPrefs.promptOnExit = 'unsaved';
defaultPrefs.errorReporting = false;
defaultPrefs.homeTab = true;
defaultPrefs.local = false;
defaultPrefs.restoreTabs = true;
defaultPrefs.openBrowserTab = false;
defaultPrefs.stripWhitespace = false;
defaultPrefs.saveWithMinified = false;
defaultPrefs.compileCoffeeScript = false;
defaultPrefs.compileLESS = false;
defaultPrefs.autoSave = false;
defaultPrefs.revisions = 10;
defaultPrefs.hideAds = false;
defaultPrefs.useMasterPassword = false;
defaultPrefs.masterPasswordHash = '';
defaultPrefs.fileExtensions = '';
defaultPrefs.fileAssocations = '';
defaultPrefs.standardToolbar = true;
defaultPrefs.fixmyjs = false;
defaultPrefs.jslint_environment = 'browser';
defaultPrefs.beautifier_old  = false;
defaultPrefs.beautifier_indent_scripts  = 'keep';
defaultPrefs.beautifier_open_brace = 'end-of-line';
defaultPrefs.beautifier_brace_style = 'collapse';
defaultPrefs.beautifier_preserve_newlines = true;
defaultPrefs.beautifier_keep_array_indentation = true;
defaultPrefs.beautifier_break_chained_methods = false;
defaultPrefs.beautifier_space_before_conditional = false;
defaultPrefs.fileColumns = true;
defaultPrefs.notes = '';
defaultPrefs.find = '{}';

var charsets = {
	"UTF-8":"Unicode",
	"ISO-8859-1":"Western",
	"Windows-1252":"Western",
	"UTF-16LE":"Unicode",
	"Windows-1256":"Arabic",
	"ISO-8859-6":"Arabic",
	"ISO-8859-4":"Baltic",
	"ISO-8859-13":"Baltic",
	"Windows-1257":"Baltic",
	"ISO-8859-14":"Celtic",
	"ISO-8859-2":"Central European",
	"Windows-1250":"Central European",
	"GBK":"Chinese Simplified",
	"Big5":"Chinese Traditional",
	"Big5-HKSCS":"Chinese Traditional",
	"ISO-8859-5":"Cyrillic",
	"Windows-1251":"Cyrillic",
	"KOI8-R":"Cyrillic",
	"KOI8-U":"Cyrillic",
	"ISO-8859-7":"Greek",
	"Windows-1253":"Greek",
	"Windows-1255":"Hebrew",
	"ISO-8859-8-1":"Hebrew",
	"ISO-8859-8":"Hebrew",
	"Shift_JIS":"Japanese",
	"EUC-JP":"Japanese",
	"ISO-2022-JP":"Japanese",
	"Korean":"Korean",
	"ISO-8859-10":"Nordic",
	"ISO-8859-16":"Romanian",
	"ISO-8859-3":"South European",
	"Thai":"Thai",
	"ISO-8859-9":"Turkish",
	"Windows-1258":"Vietnamese",
	"ISO-8859-15":"Western",
	"Macintosh":"Western"
};

var jslint_options = [{
	name: 'bitwise',
	description: 'Disallow bitwise operators',
	value: true,
	type: 'enforcing'
}, {
	name: 'camelcase',
	description: 'Camel Case',
	value: false,
	type: 'enforcing'
}, {
	name: 'curly',
	description: 'Require curly braces around <strong>all</strong> blocks',
	value: false,
	type: 'enforcing'
}, {
	name: 'eqeqeq',
	description: 'Require ===',
	value: true,
	type: 'enforcing'
}, {
	name: 'forin',
	description: 'Require for..in statements to be filtered',
	value: false,
	type: 'enforcing'
}, {
	name: 'immed',
	description: 'No immediate function invocations',
	value: false,
	type: 'enforcing'
}, {
	name: 'indent',
	description: 'Tab width',
	value: false,
	type: 'enforcing'
}, {
	name: 'latedef',
	description: 'No variable before it was defined',
	value: false,
	type: 'enforcing'
}, {
	name: 'newcap',
	description: 'Capitalize names of constructor functions',
	value: false,
	type: 'enforcing'
}, {
	name: 'noarg',
	description: 'No arguments.caller and arguments.callee.',
	value: false,
	type: 'enforcing'
}, {
	name: 'noempty',
	description: 'Warns when you have an empty block in your code.',
	value: false,
	type: 'enforcing'
}, {
	name: 'nonew',
	description: 'No new when invoking classes',
	value: false,
	type: 'enforcing'
}, {
	name: 'plusplus',
	description: 'No ++ or --',
	value: false,
	type: 'enforcing'
}, {
	name: 'quotmark',
	description: 'Consistent quotes',
	value: false,
	type: 'enforcing'
}, {
	name: 'regexp',
	description: 'No "." in regexp',
	value: false,
	type: 'enforcing'
}, {
	name: 'undef',
	description: 'Require variables to be declared before usage',
	value: false,
	type: 'enforcing'
}, {
	name: 'unused',
	description: 'No unused vars',
	value: false,
	type: 'enforcing'
}, {
	name: 'strict',
	description: 'When code is not in strict mode',
	value: false,
	type: 'enforcing'
}, {
	name: 'trailing',
	description: 'No trailing whitespace',
	value: false,
	type: 'enforcing'
}, {
	name: 'asi',
	description: 'Allow missing semicolons',
	value: false,
	type: 'relaxing'
}, {
	name: 'boss',
	description: 'Allow assignments in conditions',
	value: false,
	type: 'relaxing'
}, {
	name: 'debug',
	description: 'Allow debugger statements',
	value: false,
	type: 'relaxing'
}, {
	name: 'eqnull',
	description: 'Allow null comparisons',
	value: false,
	type: 'relaxing'
}, {
	name: 'es5',
	description: 'ES5',
	value: false,
	type: 'relaxing'
}, {
	name: 'esnext',
	description: 'ES.next',
	value: false,
	type: 'relaxing'
}, {
	name: 'evil',
	description: 'Allow eval',
	value: false,
	type: 'relaxing'
}, {
	name: 'expr',
	description: 'Allow expressions',
	value: false,
	type: 'relaxing'
}, {
	name: 'funcscope',
	description: 'Allow var defs in control structures',
	value: false,
	type: 'relaxing'
}, {
	name: 'globalstrict',
	description: 'Allow global strict mode',
	value: false,
	type: 'relaxing'
}, {
	name: 'iterator',
	description: 'Allow __iterator__',
	value: false,
	type: 'relaxing'
}, {
	name: 'lastsemic',
	description: 'Allow missing last semicolons',
	value: false,
	type: 'relaxing'
}, {
	name: 'laxbreak',
	description: 'Don\'t check line breaks',
	value: false,
	type: 'relaxing'
}, {
	name: 'laxcomma',
	description: 'Allow comma first',
	value: false,
	type: 'relaxing'
}, {
	name: 'loopfunc',
	description: 'Allow functions defined in a loop',
	value: false,
	type: 'relaxing'
}, {
	name: 'multistr',
	description: 'Allow multi-line strings',
	value: false,
	type: 'relaxing'
}, {
	name: 'onecase',
	description: 'Allow switch with one case',
	value: false,
	type: 'relaxing'
}, {
	name: 'proto',
	description: 'Allow __proto__',
	value: false,
	type: 'relaxing'
}, {
	name: 'regexdash',
	description: 'Allow unescaped - at the end of regexp',
	value: false,
	type: 'relaxing'
}, {
	name: 'scripturl',
	description: 'Allow javascript:..',
	value: false,
	type: 'relaxing'
}, {
	name: 'smarttabs',
	description: 'Allow SmartTabs',
	value: false,
	type: 'relaxing'
}, {
	name: 'shadow',
	description: 'Allow variable shadowing',
	value: false,
	type: 'relaxing'
}, {
	name: 'sub',
	description: 'Allow [] instead of dot notation',
	value: true,
	type: 'relaxing'
}, {
	name: 'supernew',
	description: 'Allow new function () { ... } and new Object',
	value: true,
	type: 'relaxing'
}, {
	name: 'validthis',
	description: 'Allow this in a non-constructor function',
	value: true,
	type: 'relaxing'
}, {
	name: 'browser',
	description: 'Browser',
	value: true,
	type: 'environment'
}, {
	name: 'couch',
	description: 'CouchDB',
	value: true,
	type: 'environment'
}, {
	name: 'devel',
	description: 'Development: console, alert, etc',
	value: true,
	type: 'environment'
}, {
	name: 'dojo',
	description: 'Dojo Toolkit',
	value: true,
	type: 'environment'
}, {
	name: 'jquery',
	description: 'jQuery',
	value: true,
	type: 'environment'
}, {
	name: 'mootools',
	description: 'MooTools',
	value: true,
	type: 'environment'
}, {
	name: 'node',
	description: 'Node.js',
	value: true,
	type: 'environment'
}, {
	name: 'nonstandard',
	description: 'Non-standard e.g. escape and unescape',
	value: true,
	type: 'environment'
}, {
	name: 'prototypejs',
	description: 'Prototype js',
	value: true,
	type: 'environment'
}, {
	name: 'rhino',
	description: 'Rhino',
	value: true,
	type: 'environment'
}, {
	name: 'worker',
	description: 'Web Workers',
	value: true,
	type: 'environment'
}, {
	name: 'wsh',
	description: 'Windows Script Host',
	value: true,
	type: 'environment'
}, {
	name: 'prototypejs',
	description: 'Prototype.js',
	value: true,
	type: 'environment'
}, {
	name: 'mootools',
	description: 'MooTools',
	value: true,
	type: 'environment'
}, {
	name: 'maxerr',
	description: 'maxerr',
	value: 1000
}];

/*
jslint_options.forEach(function (item) {
	defaultPrefs['jslint_' + item.name] = item.value;
});
*/

var CSSLint = require('ace/mode/css/csslint').CSSLint;
var css_rules = CSSLint.getRules();

var csslint_options = [];
css_rules.forEach(function (item) {
	csslint_options.push ({
		name: item.id,
		description: item.desc
	});
});

coffeelint_options = [{
	name: 'no_tabs',
	description: 'No tabs',
	value: true
}, {
	name: 'no_trailing_whitespace',
	description: 'No trailing whitespace',
	value: false
}, {
	name: 'camel_case_classes',
	description: 'Camel case classes',
	value: true
}, {
	name: 'indentation',
	description: 'Strict indentation',
	value: true
}, {
	name: 'no_implicit_braces',
	description: 'No implicit braces',
	value: true
}, {
	name: 'no_trailing_semicolons',
	description: 'No trailing semicolons',
	value: true
}, {
	name: 'no_plusplus',
	description: 'No plusplus',
	value: true
}, {
	name: 'no_throwing_strings',
	description: 'No throwing strings',
	value: true
}, {
	name: 'cyclomatic_complexity',
	description: 'Cyclomatic complexity',
	value: true
}];


var jslintHTML = '';
jslint_options.forEach(function (item) {
    jslintHTML += '<label>\
    <input type="checkbox" name="jslint_'+item.name+'" value="1">\
    '+item.description+'\
</label>';

    defaultPrefs['jslint_'+item.name] = item.value;
});

var csslintHTML = '';
css_rules.forEach(function (item) {
    csslintHTML += '<label>\
    <input type="checkbox" name="csslint_'+item.id+'" value="1">\
    '+item.desc+'\
</label>';
});

var coffeescriptlintHTML = '';
coffeelint_options.forEach(function (item) {
    coffeescriptlintHTML += '<label>\
    <input type="checkbox" name="coffeelint_'+item.name+'" value="1">\
    '+item.description+'\
</label>';

    defaultPrefs['coffeelint_'+item.name] = item.value;
});

if(!prefs)
    prefs = {};

function load() {
    return $.getJSON('/api/prefs')
        .done(function (data) {
            prefs = $.extend(defaultPrefs, data.prefs);

            openingFilesBatch = data.openingFilesBatch;
			storage.set('prefs', prefs);
            return prefs;
        });
}

function save(name, value) {
    $.ajax({
        url: '/api/prefs?cmd=save&name='+name,
	    method: 'POST',
	    dataType: 'json',
	    data: {value: value}
    })
    .then(function (data) {
        if(!data.success){
            prompt.alert({title:'Error', msg:data.error});
        }
    }).fail(function() {
		prompt.alert({title:lang.failedText, msg:'Error saving preferences'});
    });
}

function open() {
    //create tab
	var tab = $('.ui-layout-center').tabs('add', 'Preferences', '<div class="prefs">\
	<form id="prefsForm">\
	<h2>General</h2>\
	<label>Prompt on exit</label>\
	<label>\
	    <input type="radio" name="promptOnExit" value="unsaved">\
	    When there are unsaved changes\
	</label>\
	<label>\
	    <input type="radio" name="promptOnExit" value="always">\
	    Always\
	</label>\
	<h2>Files</h2>\
	<label>\
	    <input type="checkbox" name="restoreTabs" value="1">\
	    Restore tabs on startup\
	</label>\
	<label>\
	    <input type="checkbox" name="singleClickOpen" value="1">\
	    Single click to open files\
	</label>\
	<label>\
	    <input type="checkbox" name="stripWhitespace" value="1">\
	    Strip whitespace on save\
	</label>\
	<label>\
	    <input type="checkbox" name="saveWithMinified" value="1">\
	    Save with minified\
	</label>\
	<label>\
	    <input type="checkbox" name="compileLESS" value="1">\
	    Compile LESS/ SCSS on save\
	</label>\
	<label>\
	    <input type="checkbox" name="compileCoffeeScript" value="1">\
	    Compile CoffeeScript on save\
	</label>\
	<label>\
	    <input type="checkbox" name="autoSave" value="1">\
	    Autosave\
	</label><br>\
	<label>\
	    Default encoding<br>\
	    <select name="encoding"></select>\
	</label>\
	\
	<h2>Editor</h2>\
	<label>Key binding</label>\
	<label>\
	    <input type="radio" name="keyBinding" value="default">\
	    Default\
	</label>\
	<label>\
	    <input type="radio" name="keyBinding" value="vim">\
	    Vim\
	</label>\
	<label>\
	    <input type="radio" name="keyBinding" value="emacs">\
	    Emacs\
	</label><br>\
	<label>\
	    <input type="checkbox" name="softTabs" value="1">\
	    Indent with spaces\
	</label><br>\
	<label>\
	    Tab size<br>\
	    <select name="tabSize">\
	        <option>2</option>\
	        <option>3</option>\
	        <option>4</option>\
	        <option>8</option>\
	    </select>\
	</label><br>\
	<label>Line break</label>\
	<label>\
	    <input type="radio" name="lineBreak" value="auto">\
	    Auto\
	</label>\
	<label>\
	    <input type="radio" name="lineBreak" value="unix">\
	    Unix\
	</label>\
	<label>\
	    <input type="radio" name="lineBreak" value="windows">\
	    Windows\
	</label><br>\
	<label>\
	    Font size\
	    <input type="number" name="fontSize" value="">\
	</label>\
	<label>\
	    Print margin column\
	    <input type="number" name="printMarginColumn" value="">\
	</label><br>\
	<label>\
	    <input type="checkbox" name="indentOnPaste" value="1">\
	    Indent on paste\
	</label>\
	<label>\
	    <input type="checkbox" name="zen" value="1">\
	    Emmet (<a href="http://docs.emmet.io/abbreviations/syntax/" target="_blank">?</a>)\
	</label>\
	<label>\
	    <input type="checkbox" name="behaviours" value="1">\
	    Auto-close tags, brackets, quotes etc\
	</label>\
	<label>\
	    <input type="checkbox" name="scrollPastEnd" value="1">\
	    Scroll past end\
	</label>\
	<h2>Security</h2>\
	<p>A Master Password is used to protect your passwords.</p>\
	<label>\
	    <input type="checkbox" name="useMasterPassword" value="1">\
	    Use a master password\
	</label>\
	<p><button type="button">Change master password</button></p>\
	<h2>Lint Checking</h2>\
	<h3>Javascript</h3>\
	'+ jslintHTML +'<br>\
	<h3>CSS</h3>\
	'+ csslintHTML +'<br>\
	<h3>Coffeescript</h3>\
	'+ coffeescriptlintHTML +'<br>\
	<h2>Beautifier</h2>\
	<h3>HTML</h3>\
	<label>HTML &lt;style&gt;, &lt;script&gt; formatting</label>\
	<label>\
	    <input type="radio" name="beautifier_indent_scripts" value="keep">\
	    Keep indent level of the tag\
	</label>\
	<label>\
	    <input type="radio" name="beautifier_indent_scripts" value="normal">\
	    Add one indent level\
	</label>\
	<label>\
	    <input type="radio" name="beautifier_indent_scripts" value="separate">\
	    Separate indentation\
	</label><br>\
	<h3>CSS</h3>\
	<label>Open curly brace</label>\
	<label>\
	    <input type="radio" name="beautifier_open_brace" value="end-of-line">\
	    End of line\
	</label>\
	<label>\
	    <input type="radio" name="beautifier_open_brace" value="separate-line">\
	    Separate line\
	</label><br>\
	<h3>Javascript</h3>\
	<label>Brace style</label>\
	<label>\
	    <input type="radio" name="beautifier_brace_style" value="collapse">\
	    Braces with control statement\
	</label>\
	<label>\
	    <input type="radio" name="beautifier_brace_style" value="expand">\
	    Braces on own line\
	</label>\
	<label>\
	    <input type="radio" name="beautifier_brace_style" value="end-expand">\
	    End braces on own line\
	</label><br>\
	<label>\
	    <input type="checkbox" name="beautifier_preserve_newlines" value="1">\
	    Preserve empty lines\
	</label>\
	<label>\
	    <input type="checkbox" name="beautifier_keep_array_indentation" value="1">\
	    Keep array indentation\
	</label>\
	<label>\
	    <input type="checkbox" name="beautifier_break_chained_methods" value="1">\
	    Break lines on chained methods\
	</label>\
	<label>\
	    <input type="checkbox" name="beautifier_space_before_conditional" value="1">\
	    Spaces before conditional: "if(x)" / "if (x)"\
	</label>\
	</form>\
	</div>');

    //encoding dropdown
    for(var i in charsets) {
        if (charsets.hasOwnProperty(i)) {
            $('#prefsForm select[name=encoding]').append( '<option value="'+i+'">'+charsets[i]+' ('+i+')</option>' );
        }
    }

    //form values
    //var values = $.extend(defaultPrefs, prefs);

    var inputs = $('#prefsForm input, #prefsForm select');

    inputs.each(function() {
        var name = $(this).prop('name');
        var val = prefs[name];

        switch($(this).prop('type')) {
            case 'checkbox':
                $(this).prop('checked', val);
            break;
            case 'radio':
                $("input[name=" + name + "][value=" + val + "]").prop('checked', true);
            break;
            default:
                $(this).val(prefs[$(this).prop('name')]);
            break;
        }
    });

    inputs.change(function() {
        var name = $(this).prop('name');
        var val;

        switch($(this).prop('type')) {
            case 'checkbox':
                val = $(this).is(':checked');
            break;
            default:
                val = $(this).val();
            break;
        }


        //apply change to open editors
        $('li[file]').each(function() {

        });

        //save it
        prefs[name] = val;
        save(name, val);
    });
}

$('body').on('click', '#openPreferences a', function(e){
    open();
});

return {
    get_prefs: function() {
        return prefs;
    },
    getOpeningFilesBatch: function() {
        return openingFilesBatch;
    },
    load: load,
    save: save,
    open: open
};

});