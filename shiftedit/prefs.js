define(['exports', 'app/editors', 'app/tabs', 'jquery', 'app/storage', 'ace/mode/css/csslint', 'app/lang', 'app/layout', "app/modes", 'app/util', 'app/prompt', 'app/loading', 'app/tree'], function (exports, editors, tabs) {
var storage = require('app/storage');
var lang = require('app/lang').lang;
var modes = require('app/modes').modes;
var prefs = storage.get('prefs');
var layout = require('app/layout');
var util = require('app/util');
var prompt = require('app/prompt');
var loading = require('app/loading');
var tree = require('app/tree');
var openingFilesBatch = [];

var defaultPrefs = {};
defaultPrefs.skin = 'mint-choc';
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
defaultPrefs.codeTheme = 'twilight'; //default
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

var skins = [{
	title: "Dark Orange",
	name: "dark-orange",
	icon: "theme_90_smoothness.png"
}, { //tree issues
	title: "Smoothness",
	name: "smoothness",
	icon: "theme_90_smoothness.png"
},/* {
	title: "Black Tie",
	name: "black-tie",
	icon: "theme_90_black_tie.png"
}/*, { //tree issues
	title: "Blitzer",
	name: "blitzer",
	icon: "theme_90_blitzer.png"
}*//*, {
	title: "Cupertino",
	name: "cupertino",
	icon: "theme_90_cupertino.png"
},*/ {
	title: "Dark Hive",
	name: "dark-hive",
	icon: "theme_90_dark_hive.png"
}, {
	title: "Dot Luv",
	name: "dot-luv",
	icon: "theme_90_dot_luv.png"
}, {
	title: "Eggplant",
	name: "eggplant",
	icon: "theme_90_eggplant.png"
},/* {
	title: "Excite Bike",
	name: "excite-bike",
	icon: "theme_90_excite_bike.png"
}/*, { //tree issues
	title: "Flick",
	name: "flick",
	icon: "theme_90_flick.png"
}*/ {
	title: "Gray",
	name: "gray"
},/* {
	title: "Hot Sneaks",
	name: "hot-sneaks",
	icon: "theme_90_hot_sneaks.png"
}*/ {
	title: "Humanity",
	name: "humanity",
	icon: "theme_90_humanity.png"
}, {
	title: "Le Frog",
	name: "le-frog",
	icon: "theme_90_le_frog.png"
}, {
	title: "Mint Choc",
	name: "mint-choc",
	icon: "theme_90_mint_choco.png"
},/* {
	title: "Overcast",
	name: "overcast",
	icon: "theme_90_overcast.png"
}*/ {
	title: "Pepper Grinder",
	name: "pepper-grinder",
	icon: "theme_90_pepper_grinder.png"
}, {
	title: "Redmond",
	name: "redmond",
	icon: "theme_90_windoze.png"
}, {
	title: "South Street",
	name: "south-street",
	icon: "theme_90_south_street.png"
},/* {
	title: "Start",
	name: "start",
	icon: "theme_90_start_menu.png"
}*/ {
	title: "Sunny",
	name: "sunny",
	icon: "theme_90_sunny.png"
}, {
	title: "Swanky Purse",
	name: "swanky-purse",
	icon: "theme_90_swanky_purse.png"
}, {
	title: "Trontastic",
	name: "trontastic",
	icon: "theme_90_trontastic.png"
}, {
	title: "UI Darkness",
	name: "ui-darkness",
	icon: "theme_90_ui_dark.png"
}, {
	title: "UI Lightness",
	name: "ui-lightness",
	icon: "theme_90_ui_light.png"
}, {
	title: "Vader",
	name: "vader",
	icon: "theme_90_black_matte.png"
}];

var skinHTML = '';
skins.forEach(function(item){
    skinHTML += '<label>\
	    <input type="radio" name="skin" value="'+item.name+'">\
	    '+item.title+'\
	</label>';
});

var codeThemes = ['custom', 'ambiance', 'chaos', 'chrome', 'clouds', 'clouds_midnight', 'cobalt', 'crimson_editor', 'dawn', 'dreamweaver', 'eclipse', 'idle_fingers', 'katzenmilch', 'kr_theme', 'kuroir', 'merbivore', 'merbivore_soft', 'mono_industrial', 'monokai', 'pastel_on_dark', 'solarized_dark', 'solarized_light', 'terminal', 'textmate', 'tomorrow', 'tomorrow_night', 'tomorrow_night_blue', 'tomorrow_night_bright', 'tomorrow_night_eighties', 'twilight', 'vibrant_ink', 'xcode'];

var themeHTML = '';
codeThemes.forEach(function(item){
    var label = item.replace(/_/g, ' ');
    label = label.charAt(0).toUpperCase() + label.slice(1);

    if(item==='custom') {
        label += ' (<a class="editCustomTheme" href="#">Edit</a>)';
    }

    themeHTML += '<label>\
	    <input type="radio" name="codeTheme" value="'+item+'">\
	    '+ label +'\
	</label>';
});

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

// create hash using mater password hash
function createHash(password) {
	return util.sha1(storage.get('salt') + password);
}

function load() {
    return $.getJSON('/api/prefs')
        .then(function (data) {
            console.log('loaded prefs');
            prefs = $.extend(defaultPrefs, data.prefs);

            for(var i in prefs){
                if (prefs.hasOwnProperty(i)) {
                    try{
                        prefs[i] = JSON.parse(prefs[i]);
                    }catch(e) {
                    }
                }
            }

            openingFilesBatch = data.openingFilesBatch;
			storage.set('prefs', prefs);

			//storage.set('site', site);
			storage.set('username', data.username);
			storage.set('user', data.user);
			storage.set('hash', data.hash);
			storage.set('salt', data.salt);
			storage.set('masterPassword', data.masterPassword);
			storage.set('premier', data.premier);
			storage.set('edition', data.edition);
			storage.set('channel', data.channel);
			storage.set('authToken', data.authToken);
			storage.set('avatar', data.avatar);
			storage.set('public_key', data.public_key);

			//load skin
			if(prefs.skin) {
			    updateSkin(prefs.skin);
			}

            return prefs;
        });
}


function updateSkin(name){
    var url;
    var currentStyle = [];
	var themepath = '//shiftedit.s3.amazonaws.com/css';
	//themepath = 'css';

	//check skin is valid
	var found = false;
	skins.forEach(function(item) {
		if (item.name===name) {
			found = true;
			return;
		}
	});

	if(!found) {
		name = prefs.skin;
	}

    if (!url) {
        var urlPrefix = themepath + "/themes/";
        url = urlPrefix + name + "/jquery-ui.css";
        currentStyle = $('link[href^="' + urlPrefix + '"]').remove();
    }

    var style = $("<link/>")
    .attr("type","text/css")
    .attr("rel","stylesheet")
    .attr("href", url);

    style.appendTo("head");

    style.load(function(){
	    //set resizer color
	    var borderColor = $('.ui-widget-header').css('border-color');
		$('.ui-layout-resizer').css('background', borderColor);

	    //var activeColor = $('.ui-widget-header').css('border-color');
	    //var hoverColor = $('.ui-widget-header').css('border-color');

	    var div = $('<div class="ui-state-highlight"></div>').appendTo('body');
	    var activeBackground = div.css('background-color');
	    var activeColor = div.css('color');
	    var activeBorderColor = div.css('border-color');

	    div.remove();

	    div = $('<div class="ui-state-focus"></div>').appendTo('body');
	    var hoverBackground = div.css('background-color');
	    var hoverColor = div.css('color');
	    var hoverBorderColor = div.css('border-color');
	    div.remove();

        $('#themeStyle').remove();
        $('<style id="themeStyle">\
		.jstree-default .jstree-clicked{\
			background: '+activeBackground+' !important;\
			color: '+activeColor+' !important;\
			border: 0 solid '+activeBorderColor+';\
		}\
		\
		.jstree-default .jstree-hovered{\
			background: '+hoverBackground+';\
			color: '+hoverColor+';\
			border: 0 solid '+hoverBorderColor+';\
		}\
        </style>').appendTo('head');

    });

    /*
    $.cookie(settings.cookiename, data.name,
        { expires: settings.cookieexpires, path: settings.cookiepath }
    );*/
}

function save(name, value) {
    //nested array value
    parts = name.split('.');
    name = parts[0];

    if (parts[1]) {
        prefs[name][parts[1]] = value;
    } else {
        prefs[name] = value;
    }

    //skin
    if(name==='skin') {
        updateSkin(value);
    }

    if(name==='customTheme'){
		$('#ace-custom').remove();
    }

    if(name==='singleClickOpen'){
		tree.setSingleClickOpen(value);
    }

    //apply change to open editors
    $('li[data-file]').each(function() {
        editors.applyPrefs(this);
    });

    if(typeof(prefs[name])==='object') {
        value = JSON.stringify(prefs[name]);
    }

    $.ajax({
        url: '/api/prefs?cmd=save&name='+name,
	    method: 'POST',
	    dataType: 'json',
	    data: {value: value}
    })
    .then(function (data) {
        if(!data.success){
            prompt.alert({title:'Error', msg:data.error});
        } else {
        	storage.set('prefs', prefs);
        }
    }).fail(function() {
		prompt.alert({title:lang.failedText, msg:'Error saving preferences'});
    });
}

function open() {
    var myLayout = layout.get();

    //check if already open
    var tab = $('li[data-type=prefs]');

	var panel = 'east';
	var minWidth = 300;

    if(tab.length) {
        var tabpanel = tab.closest('.ui-tabs');
        tabpanel.tabs("option", "active", tab.index());

        //get nearest panel
        var pane = tab.closest('.ui-layout-pane');
        panel = pane[0].className.match('ui-layout-pane-([a-z]*)')[1];

        //expand panel
    	myLayout.open(panel);
        if (pane.outerWidth() < minWidth) {
			myLayout.sizePane(panel, minWidth);
        }

        return;
    }

    //expand east panel
    myLayout.open(panel);
    if(myLayout.panes.east.outerWidth() < minWidth) {
		myLayout.sizePane(panel, minWidth);
    }

    //create tab
	tab = $('.ui-layout-east').tabs('add', 'Preferences', '<div class="prefs">\
	<form id="prefsForm">\
	<h2>General</h2>\
	<label>Skin</label>\
	'+skinHTML+'<br>\
	<label>Code theme</label>\
	'+themeHTML+'<br>\
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
	    Default template<br>\
	    <select id="defaultCode" class="ui-widget ui-state-default ui-corner-all"></select>\
	    <button id="editDefaultCode" type="button">Edit</button>\
	</label>\
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
	    <select name="encoding" class="ui-widget ui-state-default ui-corner-all"></select>\
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
	    <select name="tabSize" class="ui-widget ui-state-default ui-corner-all">\
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
	    Font size<br>\
	    <input type="number" name="fontSize" value="" class="ui-widget ui-state-default ui-corner-all">\
	</label>\
	<label>\
	    Print margin column<br>\
	    <input type="number" name="printMarginColumn" value="" class="ui-widget ui-state-default ui-corner-all">\
	</label><br>\
	<label>\
	    <input type="checkbox" name="autocomplete" value="1">\
	    Autocomplete\
	</label>\
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
	    <input type="checkbox" id="useMasterPassword" name="useMasterPassword" value="1">\
	    Use a master password\
	</label>\
	<p><button type="button" id="changeMasterPassword">Change master password</button></p>\
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

	tab.attr('data-type', 'prefs');

    //encoding dropdown
    for(var i in charsets) {
        if (charsets.hasOwnProperty(i)) {
            $('#prefsForm select[name=encoding]').append( '<option value="'+i+'">'+charsets[i]+' ('+i+')</option>' );
        }
    }

    //modes dropdown
    for( i in modes) {
        if (modes.hasOwnProperty(i)) {
            $('#defaultCode').append( '<option value="'+modes[i][2][0]+'">'+modes[i][1]+'</option>' );
        }
    }
    $('#defaultCode').val('html');

    //form values
    //var values = $.extend(defaultPrefs, prefs);

    var inputs = $('#prefsForm input[name], #prefsForm select[name]');

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

        //save it
        prefs[name] = val;
        save(name, val);
    });

    //edit default code
    $('#editDefaultCode').button().click(function() {
        var val = $('#defaultCode').val();
    	var tab = editors.create('defaultCode.'+val, prefs.defaultCode[val], 0);
    	tab.data('pref', 'defaultCode.'+val);
    });

    function changeMasterPassword() {
        $( "body" ).append('<div id="dialog-changeMasterPasword" title="'+lang.changeMasterPasswordText+'">\
          <form id="masterPasswordForm">\
            <p>'+lang.masterPasswordInfoText+'</p>\
            <p><label for="currentMasterPassword">Current password</label> <input type="password" name="currentMasterPassword" id="currentMasterPassword"></p>\
            <p><label for="newMasterPassword">'+lang.enterNewPasswordText+'</label> <input type="password" name="newMasterPassword" id="newMasterPassword"></p>\
            <p><label for="confirmMasterPassword">'+lang.reenterPasswordText+'</label> <input type="password" name="confirmMasterPassword" id="confirmMasterPassword"></p>\
            <p>'+lang.masterPasswordRememberText+'</p>\
          </form>\
        </div>');

        if(!prefs.useMasterPassword){
            $('#currentMasterPassword').val('No password set').prop('disabled', true);
        }

        //open dialog
        var dialog = $( "#dialog-changeMasterPasword" ).dialog({
            modal: true,
            width: 500,
            close: function( event, ui ) {
                $( this ).remove();
            },
            buttons: {
                OK: function(){
                    var values = util.serializeObject($('#masterPasswordForm'));

					var error = '';
					//check password
					if (prefs.useMasterPassword) {
						if (createHash(createHash(values.currentMasterPassword)) != prefs.masterPasswordHash) {
							error += lang.currentPasswordIncorrectText + '<br>';
						}
					}
					//check password length
					if (values.newMasterPassword.length < 1) {
						error += lang.passwordMinLengthText + '<br>';
					}
					//check passwords match
					if (values.newMasterPassword != values.confirmMasterPassword) {
						error += lang.passwordNotMatchText + '<br>';
					}
					if (error) {
						prompt.alert({title: lang.errorText, msg:error});
					} else {
						//create hash
						var params = {};
						if (prefs.useMasterPassword) {
							params.masterPassword = createHash(values.currentMasterPassword);
							params.masterPasswordHash = createHash(params.masterPassword);
						}
						params.useMasterPassword = true;
						params.newMasterPassword = createHash(values.newMasterPassword);

						loading.fetch('/api/prefs?cmd=save_master_password', {
						    action: 'saving master password',
						    data: params,
						    success: function(data) {
								storage.set('masterPassword', values.newMasterPassword);
								prefs.masterPasswordHash = data.masterPasswordHash;
								prefs.useMasterPassword = true;

								$('#useMasterPassword').prop('checked', true);
								$('#changeMasterPassword').prop('disabled', false);
                                $( "#dialog-changeMasterPasword" ).dialog( "close" );
						    }
						});
					}
                }
            }
        });
    }

    function removeMasterPassword() {
        $( "body" ).append('<div id="dialog-removeMasterPasword" title="'+lang.removeMasterPasswordText+'">\
          <form id="removeMasterPasswordForm">\
            <p>'+lang.removedMasterPasswordText+'</p>\
            <p><label for="currentMasterPassword">Current password</label> <input type="password" name="currentMasterPassword" id="currentMasterPassword"></p>\
            <p><input type="checkbox" name="forceRemovePassword" id="forceRemovePassword" value="1"> <label for="forceRemovePassword">'+lang.forceRemoveMasterPasswordText+'</label></p>\
          </form>\
        </div>');

        $('#forceRemovePassword').click(function() {
            if ($(this).is(':checked')) {
                $('#currentMasterPassword').prop('disabled', true);
            } else {
                $('#currentMasterPassword').prop('disabled', false);
            }
        });

        //open dialog
        var dialog = $( "#dialog-removeMasterPasword" ).dialog({
            modal: true,
            width: 500,
            buttons: {
                OK: function() {
                    var values = util.serializeObject($('#removeMasterPasswordForm'));
					var error = '';
					//check password
					if (values.forceRemovePassword != 1) {
						if (createHash(createHash($('#currentMasterPassword'))) != prefs.masterPasswordHash) {
							error += lang.currentPasswordIncorrectText;
						}
					}

					if (error) {
						prompt.alert({title:lang.errorText, msg:error});
					} else {
						//create hash
						var params = {};
						params.masterPassword = createHash(values.currentMasterPassword);
						params.forceRemovePassword = values.forceRemovePassword;

						loading.fetch('/api/prefs?cmd=save_master_password', {
						    action: 'removing master password',
						    data: params,
						    success: function(data) {
								prefs.useMasterPassword = false;
								storage.set('masterPassword', '');
								prefs.masterPasswordHash = '';

								$('#useMasterPassword').prop('checked', false);
								$('#changeMasterPassword').prop('disabled', true);
                                $( "#dialog-removeMasterPasword" ).dialog( "close" );
                                $( "#dialog-removeMasterPasword" ).remove();
						    }
						});
					}
                }
            }
        });
    }

    //master password
    $('#changeMasterPassword').button().click(changeMasterPassword);

    if(!prefs.useMasterPassword){
        $('#changeMasterPassword').prop('disabled', true);
    }

    $('#useMasterPassword').click(function() {
        if(prefs.useMasterPassword) {
            removeMasterPassword();
        }else{
            changeMasterPassword();
        }

        return false;
    });
}

$('body').on('click', '#openPreferences a', function(e){
    open();
});

$('body').on('click', 'a.preferences', function(e){
    var tabpanel = $(this).closest('.ui-tabs');
    var id = $(this).closest('[role=tabpanel]').attr('id');
    var tab = $('[aria-controls='+id+']');
    tabs.close(tab);

    open();
});

$('body').on('click', '.editCustomTheme', function(e){
	var tab = editors.create('customTheme.css', prefs.customTheme, 0);
	tab.data('pref', 'customTheme');
});

exports.get_prefs = function() {
    return prefs;
};
exports.getOpeningFilesBatch = function() {
    return openingFilesBatch;
};
exports.load = load;
exports.save = save;
exports.open = open;
exports.jslint_options = jslint_options;
exports.csslint_options = csslint_options;
exports.createHash = createHash;
exports.charsets = charsets;

});



