define(['exports', './config', './editors', './tabs', './storage', './lang', './layout', "./modes", './util', './prompt', './loading', './tree', './keybindings', 'lzma/src/lzma_worker', 'dialogResize'], function (exports, config, editors, tabs, storage, lang, layout, modes, util, prompt, loading, tree, keybindings) {
lang = lang.lang;
modes = modes.modes;
var prefs = storage.get('prefs');
var openingFilesBatch = [];
var news = {};

var defaultPrefs = {};
defaultPrefs.skin = 'dark-hive';
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
defaultPrefs.autoTabs = true;
defaultPrefs.indentOnPaste = false;
defaultPrefs.linkTooltips = true;
defaultPrefs.wordWrap = false;
defaultPrefs.fullLineSelection = false;
defaultPrefs.highlightActiveLine = false;
defaultPrefs.showInvisibles = false;
defaultPrefs.lineNumbers = true;
defaultPrefs.customKeyBindings = JSON.stringify({});
defaultPrefs.keyBinding = 'default';
defaultPrefs.codeFolding = 'markbegin'; // manual, markbegin, markbeginend
defaultPrefs.scrollSpeed = 2;
defaultPrefs.printMargin = false;
defaultPrefs.statusBar = true;
defaultPrefs.hScroll = true;
defaultPrefs.printMarginColumn = 80;
defaultPrefs.codeTheme = 'tomorrow_night'; //default
defaultPrefs.customTheme = '';
defaultPrefs.autocomplete = true;
defaultPrefs.snippets = true;
defaultPrefs.colorPicker = true;
defaultPrefs.numberPicker = true;
defaultPrefs.emmet = false;
defaultPrefs.behaviours = true;
defaultPrefs.scrollPastEnd = true;
defaultPrefs.selectDollar = false;
defaultPrefs.sshPane = 'east';
defaultPrefs.syntaxErrors = true;
defaultPrefs.filePanelWidth = 250;
defaultPrefs.designModeWarning = true;
defaultPrefs.singleClickOpen = true;
defaultPrefs.promptOnExit = 'unsaved';
defaultPrefs.errorReporting = false;
defaultPrefs.homeTab = true;
defaultPrefs.local = false;
defaultPrefs.restoreTabs = true;
defaultPrefs.treeThemeVariant = 'small';
defaultPrefs.openBrowserTab = false;
defaultPrefs.stripWhitespace = false;
defaultPrefs.saveWithMinified = false;
defaultPrefs.compileCoffeeScript = false;
defaultPrefs.compileLESS = false;
defaultPrefs.autoSave = false;
defaultPrefs.maxFiles = 1000;
defaultPrefs.revisions = 10;
defaultPrefs.useMasterPassword = false;
defaultPrefs.masterPasswordHash = '';
defaultPrefs.fileExtensions = '';
defaultPrefs.fileAssocations = '';
defaultPrefs.standardToolbar = true;
defaultPrefs.fixmyjs = false;
defaultPrefs.jslint_disable = false;
defaultPrefs.csslint_disable = false;
defaultPrefs.coffeescriptlint_disable = false;
defaultPrefs.jslint_environment = 'browser';
defaultPrefs.fileColumns = true;
defaultPrefs.notes = '';
defaultPrefs.find = '{}';
defaultPrefs.skinUrl = '';
defaultPrefs.newFiles = ['html', 'js', 'css', 'php', 'json', 'xml', 'txt'];
defaultPrefs.newFilesOther = [];
defaultPrefs.showDefinitiions = true;
defaultPrefs.showSnippets = true;
defaultPrefs.showNotes = true;
defaultPrefs.showGit = true;
defaultPrefs.hideKeyboardNotice = false;
defaultPrefs.virtualKeyboardAddOn = true;
defaultPrefs.designMode = false;
defaultPrefs.hidePanel = false;
defaultPrefs.westSize = 300;

var skins = [{
	title: "Smoothness",
	name: "smoothness",
	icon: "theme_90_smoothness.png"
}, /*{ // menu issue
	title: "Base",
	name: "base",
	icon: "theme_90_base.png"
},*/ /*{ //ugly
	title: "Black Tie",
	name: "black-tie",
	icon: "theme_90_black_tie.png"
},*/ /*{ // tree highlight issue
	title: "Blitzer",
	name: "blitzer",
	icon: "theme_90_blitzer.png"
},*/ /*{ // menu issue
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
}, /*{ //ugly
	title: "Eggplant",
	name: "eggplant",
	icon: "theme_90_eggplant.png"
},*/ /*{ //menu issue
	title: "Excite Bike",
	name: "excite-bike",
	icon: "theme_90_excite_bike.png"
},*/ /*{ //tree header issues
	title: "Flick",
	name: "flick",
	icon: "theme_90_flick.png"
},*/
/*{ //menu issue
	title: "Hot Sneaks",
	name: "hot-sneaks",
	icon: "theme_90_hot_sneaks.png"
},*/ /*{ //ugly
	title: "Humanity",
	name: "humanity",
	icon: "theme_90_humanity.png"
},*/ /*{ //ugly
	title: "Le Frog",
	name: "le-frog",
	icon: "theme_90_le_frog.png"
}, */{
	title: "Mint Choc",
	name: "mint-choc",
	icon: "theme_90_mint_choco.png"
}, /*{ // menu issues
	title: "Overcast",
	name: "overcast",
	icon: "theme_90_overcast.png"
},*/ /*{ //ugly
	title: "Pepper Grinder",
	name: "pepper-grinder",
	icon: "theme_90_pepper_grinder.png"
},*/ /*{ //ugly
	title: "Redmond",
	name: "redmond",
	icon: "theme_90_windoze.png"
}, *//*{ //ugly
	title: "South Street",
	name: "south-street",
	icon: "theme_90_south_street.png"
}, *//*{ // menu issues
	title: "Start",
	name: "start",
	icon: "theme_90_start_menu.png"
},*/ /*{ // ugly
	title: "Sunny",
	name: "sunny",
	icon: "theme_90_sunny.png"
},*/ /* { //ugly
	title: "Swanky Purse",
	name: "swanky-purse",
	icon: "theme_90_swanky_purse.png"
},*/ /*{ //ugly
	title: "Trontastic",
	name: "trontastic",
	icon: "theme_90_trontastic.png"
},*/ {
	title: "UI Darkness",
	name: "ui-darkness",
	icon: "theme_90_ui_dark.png"
}/*, { //ugly
	title: "UI Lightness",
	name: "ui-lightness",
	icon: "theme_90_ui_light.png"
}*//*, { //ugly
	title: "Vader",
	name: "vader",
	icon: "theme_90_black_matte.png"
}*/];

var skinHTML = '';
skins.forEach(function(item){
	skinHTML += '<label>\
		<input type="radio" name="skin" value="'+item.name+'">\
		'+item.title+'\
	</label><br>';
});

skinHTML += '<label>\
		<input type="radio" name="skin" value="custom">Custom theme\
	</label><br>\
	<input name="skinUrl" id="skinUrl" class="text ui-widget-content ui-corner-all" placeholder="Themeroller url e.g http://jqueryui.com/themeroller/..">\
	<a href="http://jqueryui.com/themeroller/" target="_blank">Theme roller</a>\
	<br>';

var codeThemes = ['ambiance', 'chaos', 'chrome', 'clouds', 'clouds_midnight', 'cobalt', 'crimson_editor', 'dawn', 'dreamweaver', 'eclipse', 'idle_fingers', 'katzenmilch', 'kr_theme', 'kuroir', 'merbivore', 'merbivore_soft', 'mono_industrial', 'monokai', 'pastel_on_dark', 'solarized_dark', 'solarized_light', 'terminal', 'textmate', 'tomorrow', 'tomorrow_night', 'tomorrow_night_blue', 'tomorrow_night_bright', 'tomorrow_night_eighties', 'twilight', 'vibrant_ink', 'xcode'];

var themeHTML = '';
codeThemes.forEach(function(item){
	var label = item.replace(/_/g, ' ');
	label = label.charAt(0).toUpperCase() + label.slice(1);

	themeHTML += '<label>\
		<input type="radio" name="codeTheme" value="'+item+'">\
		'+ label +'\
	</label><br>';
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

var css_rules = [{"id":"known-properties","name":"Require use of known properties","desc":"Properties should be known (listed in CSS3 specification) or be a vendor-prefixed property.","browsers":"All"},{"id":"adjoining-classes","name":"Disallow adjoining classes","desc":"Don't use adjoining classes.","browsers":"IE6"},{"id":"order-alphabetical","name":"Alphabetical order","desc":"Assure properties are in alphabetical order","browsers":"All"},{"id":"box-sizing","name":"Disallow use of box-sizing","desc":"The box-sizing properties isn't supported in IE6 and IE7.","browsers":"IE6, IE7","tags":["Compatibility"]},{"id":"box-model","name":"Beware of broken box size","desc":"Don't use width or height when using padding or border.","browsers":"All"},{"id":"overqualified-elements","name":"Disallow overqualified elements","desc":"Don't use classes or IDs with elements (a.foo or a#foo).","browsers":"All"},{"id":"display-property-grouping","name":"Require properties appropriate for display","desc":"Certain properties shouldn't be used with certain display property values.","browsers":"All"},{"id":"bulletproof-font-face","name":"Use the bulletproof @font-face syntax","desc":"Use the bulletproof @font-face syntax to avoid 404's in old IE (http://www.fontspring.com/blog/the-new-bulletproof-font-face-syntax).","browsers":"All"},{"id":"compatible-vendor-prefixes","name":"Require compatible vendor prefixes","desc":"Include all compatible vendor prefixes to reach a wider range of users.","browsers":"All"},{"id":"regex-selectors","name":"Disallow selectors that look like regexs","desc":"Selectors that look like regular expressions are slow and should be avoided.","browsers":"All"},{"id":"errors","name":"Parsing Errors","desc":"This rule looks for recoverable syntax errors.","browsers":"All"},{"id":"duplicate-background-images","name":"Disallow duplicate background images","desc":"Every background-image should be unique. Use a common class for e.g. sprites.","browsers":"All"},{"id":"duplicate-properties","name":"Disallow duplicate properties","desc":"Duplicate properties must appear one after the other.","browsers":"All"},{"id":"empty-rules","name":"Disallow empty rules","desc":"Rules without any properties specified should be removed.","browsers":"All"},{"id":"selector-max-approaching","name":"Warn when approaching the 4095 selector limit for IE","desc":"Will warn when selector count is >= 3800 selectors.","browsers":"IE"},{"id":"gradients","name":"Require all gradient definitions","desc":"When using a vendor-prefixed gradient, make sure to use them all.","browsers":"All"},{"id":"fallback-colors","name":"Require fallback colors","desc":"For older browsers that don't support RGBA, HSL, or HSLA, provide a fallback color.","browsers":"IE6,IE7,IE8"},{"id":"floats","name":"Disallow too many floats","desc":"This rule tests if the float property is used too many times","browsers":"All"},{"id":"font-sizes","name":"Disallow too many font sizes","desc":"Checks the number of font-size declarations.","browsers":"All"},{"id":"font-faces","name":"Don't use too many web fonts","desc":"Too many different web fonts in the same stylesheet.","browsers":"All"},{"id":"shorthand","name":"Require shorthand properties","desc":"Use shorthand properties where possible.","browsers":"All"},{"id":"outline-none","name":"Disallow outline: none","desc":"Use of outline: none or outline: 0 should be limited to :focus rules.","browsers":"All","tags":["Accessibility"]},{"id":"important","name":"Disallow !important","desc":"Be careful when using !important declaration","browsers":"All"},{"id":"import","name":"Disallow @import","desc":"Don't use @import, use <link> instead.","browsers":"All"},{"id":"ids","name":"Disallow IDs in selectors","desc":"Selectors should not contain IDs.","browsers":"All"},{"id":"underscore-property-hack","name":"Disallow properties with an underscore prefix","desc":"Checks for the underscore property hack (targets IE6)","browsers":"All"},{"id":"rules-count","name":"Rules Count","desc":"Track how many rules there are.","browsers":"All"},{"id":"qualified-headings","name":"Disallow qualified headings","desc":"Headings should not be qualified (namespaced).","browsers":"All"},{"id":"selector-max","name":"Error when past the 4095 selector limit for IE","desc":"Will error when selector count is > 4095.","browsers":"IE"},{"id":"selector-newline","name":"Disallow new-line characters in selectors","desc":"New-line characters in selectors are usually a forgotten comma and not a descendant combinator.","browsers":"All"},{"id":"star-property-hack","name":"Disallow properties with a star prefix","desc":"Checks for the star property hack (targets IE6/7)","browsers":"All"},{"id":"text-indent","name":"Disallow negative text-indent","desc":"Checks for text indent less than -99px","browsers":"All"},{"id":"unique-headings","name":"Headings should only be defined once","desc":"Headings should be defined only once.","browsers":"All"},{"id":"universal-selector","name":"Disallow universal selector","desc":"The universal selector (*) is known to be slow.","browsers":"All"},{"id":"unqualified-attributes","name":"Disallow unqualified attribute selectors","desc":"Unqualified attribute selectors are known to be slow.","browsers":"All"},{"id":"vendor-prefix","name":"Require standard property with vendor prefix","desc":"When using a vendor-prefixed property, make sure to include the standard one.","browsers":"All"},{"id":"zero-units","name":"Disallow units for 0 values","desc":"You don't need to specify units when a value is 0.","browsers":"All"}];

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
	if (typeof item.value === 'boolean') {
		jslintHTML += '<label>\
		<input type="checkbox" name="jslint_'+item.name+'" value="1">\
		'+item.description+'\
	</label><br>';	
	} else {
		jslintHTML += '\
		<h4>' + item.description + '</h4>\
		<input type="number" name="jslint_'+item.name+'" value="'+item.value+'" class="ui-widget ui-state-default ui-corner-all">\
		<br>\
		<br>';
	}

	defaultPrefs['jslint_'+item.name] = item.value;
});

var csslintHTML = '';
css_rules.forEach(function (item) {
	csslintHTML += '<label>\
	<input type="checkbox" name="csslint_'+item.id+'" value="1">\
	'+item.desc+'\
</label><br>';
});

var coffeescriptlintHTML = '';
coffeelint_options.forEach(function (item) {
	coffeescriptlintHTML += '<label>\
	<input type="checkbox" name="coffeelint_'+item.name+'" value="1">\
	'+item.description+'\
</label><br>';

	defaultPrefs['coffeelint_'+item.name] = item.value;
});

if(!prefs)
	prefs = {};

// create hash using mater password hash
function createHash(password) {
	return util.sha1(storage.get('salt') + password);
}

function load() {
	return $.getJSON(config.apiBaseUrl+'prefs')
		.then(function (data) {
			console.log('loaded prefs');
			prefs = $.extend({}, defaultPrefs, data.prefs);

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
			storage.set('newAuthToken', data.newAuthToken);
			storage.set('avatar', data.avatar);
			storage.set('public_key', data.public_key);
			
			news = data.news;

			//load skin
			updateSkin(prefs.skin);
	
			//custom css
			if(prefs.customTheme) {
				updateCustomTheme(prefs.customTheme);
			}
			
			//prompt
			if(data.expired) {
				prompt.alert({title:'Your Subscription has Expired', msg:'Your account has reverted to Standard edition. Unlock all sites and features by upgrading to <a href="p/remier" target="_blank">Premier</a>.'});
				throw new Error('subscription expired');
			} else if(data.edition == 'Standard') {
				prompt.alert({title:'Free Trial Expired', msg:'Support ShiftEdit by <a href="/premier" target="_blank">picking a plan</a>.'});
				throw new Error('free trial expired');
			}
			
			keybindings.init();
			keybindings.updateKeyBindings();

			return prefs;
		});
}


// from https://github.com/jquery/download.jqueryui.com/blob/288f21fed429b5f843cdd8b412aceb549c7be4a9/lib/zparams.js
function unzip( zipped, callback ) {
	var data,
		intoDec = function( hex ) {
			var dec = parseInt( hex, 16 );
			if ( dec >= 128 ) {
					dec = dec - 256;
			}
			return dec;
		};

	// Split string into an array of hexes
	data = [];
	while( zipped.length ) {
		data.push( zipped.slice( -2 ) );
		zipped = zipped.slice( 0, -2 );
	}
	data = data.reverse();

	LZMA.decompress( $.map( data, intoDec ), function( unzipped ) {
		callback( JSON.parse( unzipped ) );
	});
}

function loadSkinUrl(url) {
	var style = $('<link type="text/css" rel="stylesheet" class="theme" href="'+url+'">').appendTo("head");

	style.on('load', function(){
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

		div = $('<div class="ui-state-default"></div>').appendTo('body');
		var defaultBackground = div.css('background-color');
		var defaultColor = div.css('color');
		var defaultBorderColor = div.css('border-color');
		div.remove();

		$('<style id="themeStyle">\
		body{\
			background-color: '+defaultBackground+' !important;\
		}\
		.jstree-default .jstree-clicked{\
			background: '+activeBackground+' !important;\
			color: '+activeColor+' !important;\
			border: 0 solid '+activeBorderColor+';\
		}\
		\
		.jstree-default .jstree-table-header-hovered{\
			background: '+hoverBackground+' !important;\
		}\
		.jstree-default .jstree-hovered{\
			background: '+hoverBackground+';\
			color: '+hoverColor+';\
			border: 0 solid '+hoverBorderColor+';\
			box-shadow: none;\
		}\
		.jstree-table-header-regular{\
			background-color: '+defaultBackground+' !important;\
			color: '+defaultColor+';\
		}\
		.jstree-table-separator{\
			border-color: '+hoverBackground+';\
		}\
		\
		.jstree-table-midwrapper a.jstree-hovered:before{\
			background: '+hoverBackground+' !important;\
		}\
		\
		.jstree-table-midwrapper a.jstree-clicked:before{\
			background: '+activeBackground+' !important;\
		}\
		.ui-draggable-handle {\
			background: '+hoverBackground+' !important;\
		}\
		.ui-tabs-panel .ui-widget-header {\
			background-color:  '+defaultBackground+' !important;\
		}\
		</style>').appendTo('head');

	});
}

function parsethemeUrl(url) {
	if (!url) {
		return;
	}
	
	var str = 'zThemeParams=';
	var pos = url.indexOf(str);
	var zThemeParams = url.substr(pos+str.length);
	
	unzip( zThemeParams, function( unzipped ) {
		var url = config.apiBaseUrl+'prefs?cmd=skin&' + $.param(unzipped);
		updateSkin('smoothness');
		loadSkinUrl(url);
	});
	
	return;
}

function updateSkin(name) {
	//remove old ones
	$( "link[href*=cmd\\=skin]" ).remove();
	$( ".theme" ).remove();
	$('#themeStyle').remove();
	
	if (name === 'custom') {
		parsethemeUrl(prefs.skinUrl);
	} else {
		var url;
		var currentStyle = [];
		var themepath = '//shiftedit.s3.amazonaws.com/css';
	
		//check skin is valid
		var found = false;
		skins.forEach(function(item) {
			if (item.name===name) {
				found = true;
				return;
			}
		});

		if(!found) {
			name = defaultPrefs.skin;
		}
	
		if (!url) {
			var urlPrefix = themepath + "/themes.1.12.1/";
			url = urlPrefix + name + "/jquery-ui.css";
			currentStyle = $('link[href^="' + urlPrefix + '"]').remove();
		}
		
		loadSkinUrl(url);
	}
}

function updateCustomTheme() {
	$('#customCss').remove();
	
	if (prefs.customTheme) {
		$( "body" ).append( '<style id="customCss">'+prefs.customTheme+'</style>');
	}
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

	if(name==='skin' || name=='skinUrl') {
		//skin
		updateSkin(value);
	} else if(name==='customTheme') {
		//custom css
		updateCustomTheme(value);
	} else if(name==='singleClickOpen'){
		tree.setSingleClickOpen(value);
	} else if (name==='treeThemeVariant') {
		$('#tree').jstree('set_theme_variant', value);
	} else if (name==='statusBar') {
		var myLayout = layout.get();
		if (value) {
			myLayout.show('south');
		} else {
			myLayout.hide('south');
		}
	} else {
		//apply change to open editors
		$('li[data-file]').each(function() {
			editors.applyPrefs(this);
		});
	
		if(typeof(prefs[name])==='object') {
			value = JSON.stringify(prefs[name]);
		}
		
		keybindings.updateKeyBindings();
	}

	$.ajax({
		url: config.apiBaseUrl+'prefs?cmd=save&name='+name,
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
	var pane;
	var paneName = 'east';
	var minWidth = 300;
	if (!$('.ui-layout-resizer-east').is(':visible')) {
		layout.get().close('west', false, true);
		paneName = 'center';
	}

	if(tab.length) {
		tabpanel = tab.closest('.ui-tabs');
		tabpanel.tabs("option", "active", tab.index());

		//get nearest panel
		pane = tab.closest('.ui-layout-pane');
		paneName = pane[0].className.match('ui-layout-pane-([a-z]*)')[1];

		//expand panel
		myLayout.open(paneName);
		if (paneName != 'center' && pane.outerWidth() < minWidth) {
			myLayout.sizePane(paneName, minWidth);
		}

		return;
	}
	
	var	tabpanel = $('.ui-layout-'+paneName);
	pane = tabpanel.closest('.ui-layout-pane');
	paneName = pane[0].className.match('ui-layout-pane-([a-z]*)')[1];

	//create tab
	tab = $(tabpanel).tabs('add', 'Preferences', '<div class="prefs">\
	<form id="prefsForm">\
	<h2>'+lang.general+'</h2>\
	<h4>'+lang.promptOnExit+'</h4>\
	<label>\
		<input type="radio" name="promptOnExit" value="unsaved">\
		'+lang.withUnsavedChanges+'\
	</label>\
	<br>\
	<label>\
		<input type="radio" name="promptOnExit" value="always">\
		'+lang.always+'\
	</label>\
	<br>\
	<br>\
	<h2>'+lang.themeText+'</h2>\
	<button type="button" class="editCustomTheme" name="editCustomTheme">'+lang.editCustomTheme+'</button><br>\
	<br>\
	<h4>'+lang.skin+'</h4>\
	'+skinHTML+'<br>\
	<h4>Code theme</h4>\
	'+themeHTML+'<br>\
	<br>\
	<br>\
	<h2>Files</h2>\
	<label>\
		<input type="checkbox" name="restoreTabs" value="1">\
		' + lang.restoreTabsOnStartupText + '\
	</label>\
	<br>\
	<label>\
		<input type="checkbox" name="singleClickOpen" value="1">\
		' + lang.singleClickOpen + '\
	</label>\
	<br>\
	<label>\
		<input type="checkbox" name="stripWhitespace" value="1">\
		' + lang.stripWhitespace + '\
	</label>\
	<br>\
	<label>\
		<input type="checkbox" name="saveWithMinified" value="1">\
		' + lang.minify + '\
	</label>\
	<br>\
	<label>\
		<input type="checkbox" name="compileLESS" value="1">\
		' + lang.compileLess + '\
	</label>\
	<br>\
	<label>\
		<input type="checkbox" name="compileCoffeeScript" value="1">\
		' + lang.compileCoffee + '\
	</label>\
	<br>\
	<label>\
		<input type="checkbox" name="autoSave" value="1">\
		' + lang.autoSave + '\
	</label>\
	<br>\
	<label>\
		<input type="checkbox" name="designMode" value="1">\
		Open in design mode\
	</label>\
	<br>\
	<br>\
	<h4>' + lang.treeTheme + '</h4>\
	<label>\
		<input type="radio" name="treeThemeVariant" value="small">\
		' + lang.small + '\
	</label>\
	<br>\
	<label>\
		<input type="radio" name="treeThemeVariant" value="default">\
		' + lang.medium + '\
	</label>\
	<br>\
	<label>\
		<input type="radio" name="treeThemeVariant" value="large">\
		' + lang.large + '\
	</label>\
	<br>\
	<br>\
	<h4>' + lang.defaultTemplate + '</h4>\
	<select id="defaultCode" class="ui-widget ui-state-default ui-corner-all"></select>\
	<button id="editDefaultCode" type="button">' + lang.editText + '</button>\
	<br>\
	<br>\
	<h4>' + lang.maxFiles + '</h4>\
	<input type="number" name="maxFiles" value="" class="ui-widget ui-state-default ui-corner-all">\
	</label><br>\
	<br>\
	<h4>' + lang.defaultEncoding + '</h4>\
	<select name="encoding" class="ui-widget ui-state-default ui-corner-all"></select>\
	\
	<br>\
	<br>\
	<h2>' + lang.editor + '</h2>\
	<label>\
		<input type="checkbox" name="autocomplete" value="1">\
		' + lang.autocomplete + '\
	</label>\
	<br>\
	<label>\
		<input type="checkbox" name="snippets" value="1">\
		' + lang.snippetsText + '\
	</label>\
	<br>\
	<label>\
		<input type="checkbox" name="indentOnPaste" value="1">\
		' + lang.indentOnPaste + '\
	</label>\
	<br>\
	<label>\
		<input type="checkbox" name="linkTooltips" value="1">\
		Link tooltips\
	</label>\
	<br>\
	<label>\
		<input type="checkbox" name="emmet" value="1">\
		Emmet (<a href="http://docs.emmet.io/abbreviations/syntax/" target="_blank">?</a>)\
	</label>\
	<br>\
	<label>\
		<input type="checkbox" name="behaviours" value="1">\
		' + lang.autoclose + '\
	</label>\
	<br>\
	<label>\
		<input type="checkbox" name="selectDollar" value="1">\
		' + lang.selectDollar + '\
	</label>\
	<br>\
	<label>\
		<input type="checkbox" name="scrollPastEnd" value="1">\
		' + lang.scrollPastEnd + '\
	</label>\
	<br>\
	<label>\
		<input type="checkbox" name="virtualKeyboardAddOn" value="1">\
		Virtual keyboard addon\
	</label>\
	<br>\
	<br>\
	<h4>' + lang.keyboardBindings +'</h4>\
	<label>\
		<input type="radio" name="keyBinding" value="default">\
		' + lang.default + '\
	</label>\
	<br>\
	<label>\
		<input type="radio" name="keyBinding" value="vim">\
		Vim\
	</label>\
	<br>\
	<label>\
		<input type="radio" name="keyBinding" value="emacs">\
		Emacs\
	</label>\
	<br>\
	<br>\
	<label>\
		<input type="checkbox" name="autoTabs" value="1">\
		' + lang.detectTabType + '\
	</label>\
	<br>\
	<label>\
		<input type="checkbox" name="softTabs" value="1">\
		' + lang.indentWithSpaces + '\
	</label>\
	<br>\
	<br>\
	<h4>' + lang.tabSizeText + '<h4>\
	<select name="tabSize" class="ui-widget ui-state-default ui-corner-all">\
		<option>2</option>\
		<option>3</option>\
		<option>4</option>\
		<option>8</option>\
	</select>\
	<br>\
	<br>\
	<h4>' + lang.lineBreak + '</h4>\
	<label>\
		<input type="radio" name="lineBreak" value="auto">\
		Auto\
	</label>\
	<br>\
	<label>\
		<input type="radio" name="lineBreak" value="unix">\
		Unix\
	</label>\
	<br>\
	<label>\
		<input type="radio" name="lineBreak" value="windows">\
		Windows\
	</label><br>\
	<br>\
	<h4>' + lang.fontSizeText + '</h4>\
	<input type="number" name="fontSize" value="" class="ui-widget ui-state-default ui-corner-all">\
	<br>\
	<br>\
	<h4>' + lang.printMarginColumn + '</h4>\
	<input type="number" name="printMarginColumn" value="" class="ui-widget ui-state-default ui-corner-all">\
	<br>\
	<br>\
	<h2>' + lang.ssh + '</h2>\
	<h4>' + lang.defaultPane +'</h4>\
	<label>\
		<input type="radio" name="sshPane" value="center">\
		' + lang.center +'\
	</label>\
	<br>\
	<label>\
		<input type="radio" name="sshPane" value="east">\
		' + lang.east +'\
	</label>\
	<br>\
	<br>\
	<h2>' + lang.security + '</h2>\
	<p>' + lang.masterPasswordInfoText + '</p>\
	<label>\
		<input type="checkbox" id="useMasterPassword" name="useMasterPassword" value="1">\
		' + lang.useMasterPasswordText + '\
	</label>\
	<p><button type="button" id="changeMasterPassword">' + lang.changeMasterPasswordText + '</button></p>\
	<br>\
	<div class="accordion">\
		<h4>' + lang.advanced + '</h4>\
		<div>\
			<h2>' + lang.lintChecking + '</h2>\
			<h4>Javascript</h4>\
			<label>\
				<input type="checkbox" name="jslint_disable" value="1">\
				' + lang.disableLintChecking + '\
			</label><br>\
			' + jslintHTML + '<br>\
			<h4>CSS</h4>\
			<label>\
				<input type="checkbox" name="csslint_disable" value="1">\
				' + lang.disableLintChecking + '\
			</label><br>\
			' + csslintHTML + '<br>\
			<h4>Coffeescript</h4>\
			<label>\
				<input type="checkbox" name="coffeescriptlint_disable" value="1">\
				Disable lint checking\
			</label><br>\
			' + coffeescriptlintHTML + '<br>\
			</form>\
		</div>\
	</div>');
	
	// accordion
	$( ".accordion" ).accordion({
		collapsible: true,
		active: false,
		heightStyle: "content"
	});

	tab.addClass('closable');
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
				if (val) {
					$("input[name=" + name + "][value=" + val + "]").prop('checked', true);
				}
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
	
	// edit default code
	$('#editDefaultCode').button().click(function() {
		var val = $('#defaultCode').val();
		var tab = editors.create('defaultCode.'+val, prefs.defaultCode[val], 0);
		tab.data('pref', 'defaultCode.'+val);
	});
	
	//checkboxradio
	pane.find('input[type=checkbox]').checkboxradio();
	pane.find('input[type=radio]').checkboxradio();

	// master password
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
			$('#currentMasterPassword').val('No password set');
			$('#currentMasterPassword').prop('type', 'text');
			$('#currentMasterPassword').prop('disabled', true);
		}

		//open dialog
		var dialog = $( "#dialog-changeMasterPasword" ).dialogResize({
			width: 400,
			height: 300,
			modal: true,
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

						loading.fetch(config.apiBaseUrl+'prefs?cmd=save_master_password', {
							action: 'saving master password',
							data: params,
							success: function(data) {
								storage.set('masterPassword', values.newMasterPassword);
								prefs.masterPasswordHash = data.masterPasswordHash;
								prefs.useMasterPassword = true;

								$('#useMasterPassword').prop('checked', true).checkboxradio('refresh');
								$('#changeMasterPassword').prop('disabled', false).button('refresh');
								$( "#dialog-changeMasterPasword" ).dialogResize( "close" );
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
		
		$('#forceRemovePassword').checkboxradio();

		$('#forceRemovePassword').click(function() {
			if ($(this).is(':checked')) {
				$('#currentMasterPassword').prop('disabled', true);
			} else {
				$('#currentMasterPassword').prop('disabled', false);
			}
		});

		//open dialog
		var dialog = $( "#dialog-removeMasterPasword" ).dialogResize({
			width: 480,
			height: 300,
			modal: true,
			buttons: {
				OK: function() {
					var values = util.serializeObject($('#removeMasterPasswordForm'));
					var error = '';
					//check password
					if (values.forceRemovePassword != 1) {
						if (createHash(createHash($('#currentMasterPassword').val())) != prefs.masterPasswordHash) {
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

						loading.fetch(config.apiBaseUrl+'prefs?cmd=save_master_password', {
							action: 'removing master password',
							data: params,
							success: function(data) {
								prefs.useMasterPassword = false;
								storage.set('masterPassword', '');
								prefs.masterPasswordHash = '';

								$('#useMasterPassword').prop('checked', false).checkboxradio('refresh');
								$('#changeMasterPassword').prop('disabled', true).button('refresh');
								$( "#dialog-removeMasterPasword" ).dialogResize( "close" );
								$( "#dialog-removeMasterPasword" ).remove();
							}
						});
					}
				}
			}
		});
	}

	// master password
	$('#changeMasterPassword').button().click(changeMasterPassword);

	if(!prefs.useMasterPassword){
		$('#changeMasterPassword').prop('disabled', true).button('refresh');
	}

	$('#useMasterPassword').click(function() {
		if(prefs.useMasterPassword) {
			removeMasterPassword();
		}else{
			changeMasterPassword();
		}

		return false;
	});

	$('.editCustomTheme').button().click(function(e){
		var tab = editors.create('customTheme.css', prefs.customTheme, 0);
		tab.data('pref', 'customTheme');
	});

	//expand panel
	myLayout.open(paneName);
	if(myLayout.panes.east.outerWidth() < minWidth) {
		myLayout.sizePane(paneName, minWidth);
	}
}

$('body').on('click', '.preferences', function(e){
	open();
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
exports.getKeyBinding = keybindings.getKeyBinding;
exports.openKeyBindings = keybindings.openKeyBindings;
exports.getNews = function() {
	return news;
};

});