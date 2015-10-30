define(['app/util','app/dictionary/php','app/dictionary/wordpress','ace/ace'], function (util, php, wordpress) {

	var html_tags = ['!doctype','a','abbr','acronym','address','applet','area','article','aside','audio','b','base','basefont','bdo','bgsound','big','blink','blockquote','body','br','button','canvas','caption','center','cite','code','col','colgroup','command','comment','datalist','dd','del','dfn','dir','div','dl','dt','em','embed','fieldset','figcaption','figure','font','footer','form','frame','frameset','h1','h2','h3','h4','h5','h6','head','header','hgroup','hr','html','i','iframe','ilayer','img','input','ins','isindex','kbd','keygen','label','layer','legend','li','link','listing','map','mark','marquee','menu','meta','meter','multicol','nav','nextid','nobr','noembed','noframes','nolayer','noscript','object','ol','optgroup','option','output','p','param','plaintext','pre','progress','q','rb','rbc','rp','rt','rtc','ruby','s','samp','script','section','select','small','source','spacer','span','strike','strong','style','sub','summary','sup','table','tbody','td','textarea','tfoot','th','thead','time','tr','tt','u','ul','var','wbr','video','wbr','xml','xmp'];

	function commonAttributes(obj) {
		var result = {};
		var n;
		// if you pass custom attributes, add them first so they show up first
		if (obj){
			for (n in obj){
			    if( obj.hasOwnProperty(n) ){
				    result[n] = obj[n];
			    }
			}
		}
		// second, add the common attributes
		var common = {"id": 2, "class": 2, "style": 2, "title": 2 };
		for (n in common) {
		    if( common.hasOwnProperty(n) ){
			    result[n] = 2;
		    }
		}
			// return the function that results the results
		return function() {
			// did you know that you can dynamically check for some arbitrary condition,
			// and return 0 in order for this resultset NOT to show up?
			return result;
		}();
	}

	phpDictionary = php.functions;

	wordpressFunctions = wordpress.functions;

	var jqueryDictionary = {
		"add": "(selector)"
	};

	var jsDictionary = {
		"Global": {
			'Infinity': 2,
			'NaN': 2,
			'undefined': 2,
			'decodeURI': '(uri)',
			'decodeURIComponent': '(uri)',
			'encodeURI': '(uri)',
			'encodeURIComponent': '(uri)',
			'escape': '(string)',
			'eval': '(string)',
			'isFinite': '(value)',
			'isNaN': '(value)',
			'Number': '(object)',
			'parseFloat': '(string)',
			'parseInt': '(string, radix)',
			'String': '(object)',
		},
		"Array": {
			'length': 2,
			'concat': '(array2, array3, ..., arrayX)',
			'indexOf': '(item, start)',
			'join': '(separator)',
			'lastIndexOf': '(item, start)',
			'pop': '()',
			'push': '(item1, item2, ..., itemX)',
			'reverse': '()',
			'shift': '()',
			'slice': '(start, end)',
			'sort': '(sortfunction)',
			'splice': '(index, howmany, item1, ....., itemX)',
			'toString': '(item1, item2, ..., itemX)',
			'unshift': '()',
			'valueOf': '()',
		},
		"Number": {
			'toExponential': '(x)',
			'toFixed': '(x)',
			'toPrecision': '(x)',
			'toString': '(radix)',
			'valueOf': '()',
		},
		"String": {
			'length': 2,
			'charAt': '(index)',
			'charCodeAt': '(index)',
			'concat': '(string1, string2, ..., stringX)',
			'fromCharCode': '(n1, n2, ..., nX)',
			'indexOf': '(searchvalue, start)',
			'lastIndexOf': '(searchvalue, start)',
			'localeCompare': '(compareString)',
			'match': '(regexp)',
			'replace': '(searchvalue, newvalue)',
			'search': '(searchvalue)',
			'slice': '(start, end)',
			'split': '(separator, limit)',
			'substr': '(start, length)',
			'substring': '(start, end)',
			'toLocaleLowerCase': '()',
			'toLocaleUpperCase': '()',
			'toLowerCase': '()',
			'toString': '()',
			'toUpperCase': '()',
			'trim': '()',
			'valueOf': '()'
		},
		"Math":	{
			'round($0)': 2,
			'random($0)': 2,
			'max($0)': 2,
			'min($0)': 2,
			'abs($0)': 2,
			'acos($0)': 2,
			'asin($0)': 2,
			'atan2($0)': 2,
			'ceil($0)': 2,
			'cos($0)': 2,
			'exp($0)': 2,
			'floor($0)': 2,
			'log($0)': 2,
			'pow($0)': 2,
			'sin($0)': 2,
			'sqrt($0)': 2,
			'tan($0)': 2,
			'E': 2,
			'LN2': 2,
			'LN10': 2,
			'LOG2E': 2,
			'LOG10E': 2,
			'PI': 2,
			'SQRT1_2': 2,
			'SQRT2': 2
		},
		"console":	{
			'log($0)': 2,
			'error($0)': 2,
			'trace($0)': 2,
			'warn($0)': 2
		},
		"document":	{
			'anchors': 2,
			'applets': 2,
			'body': 2,
			'cookie': 2,
			'documentMode': 2,
			'domain': 2,
			'forms': 2,
			'images': 2,
			'lastModified': 2,
			'links': 2,
			'readyState': 2,
			'referrer': 2,
			'title': 2,
			'URL': 2,
			'close($0)': 2,
			'getElementById($0)': 2,
			'getElementsByName($0)': 2,
			'getElementsByClassName($0)': 2,
			'getElementsByTagName($0)': 2,
			'open($0)': 2,
			'write($0)': 2,
			'writeln($0)': 2
		},
		"history":	{
			'length': 2,
			'back($0)': 2,
			'forward($0)': 2,
			'go($0)': 2
		},
		"JSON":	{
			'parse($0)': 2,
			'stringify($0)': 2
		},
		"location":	{
			'hash': 2,
			'host': 2,
			'hostname': 2,
			'href': 2,
			'pathname': 2,
			'port': 2,
			'protocol': 2,
			'search': 2,
			'assign($0)': 2,
			'reload($0)': 2,
			'replace($0)': 2
		},
		"navigator": {
			'appCodeName': 2,
			'appName': 2,
			'appVersion': 2,
			'cookieEnabled': 2,
			'onLine': 2,
			'platform': 2,
			'userAgent': 2,
			'javaEnabled($0)': 2,
			'taintEnabled($0)': 2,
		},
		"RegEzp": {
			'compile': 2,
			'exec': 2,
			'test': 2
		},
		"screen": {
			'availHeight': 2,
			'availWidth': 2,
			'colorDepth': 2,
			'height': 2,
			'pixelDepth': 2,
			'width': 2
		},
		"window": {
			'closed': 2,
			'defaultStatus': 2,
			'document': 2,
			'frames': 2,
			'history': 2,
			'innerHeight': 2,
			'innerWidth': 2,
			'length': 2,
			'location': 2,
			'name': 2,
			'navigator': 2,
			'opener': 2,
			'outerHeight': 2,
			'outerWidth': 2,
			'pageXOffset': 2,
			'pageYOffset': 2,
			'parent': 2,
			'screen': 2,
			'screenLeft': 2,
			'screenTop': 2,
			'screenX': 2,
			'screenY': 2,
			'self': 2,
			'status': 2,
			'top': 2,
			'alert($0)': 2,
			'blur($0)': 2,
			'clearInterval($0)': 2,
			'clearTimeout($0)': 2,
			'close($0)': 2,
			'confirm($0)': 2,
			'createPopup($0)': 2,
			'focus($0)': 2,
			'moveBy($0)': 2,
			'moveTo($0)': 2,
			'open($0)': 2,
			'print($0)': 2,
			'prompt($0)': 2,
			'resizeBy($0)': 2,
			'resizeTo($0)': 2,
			'scroll($0)': 2,
			'scrollBy($0)': 2,
			'scrollTo($0)': 2,
			'setInterval($0)': 2,
			'setTimeout($0)': 2
		}
	};

    var cssDictionary =
    {
      "background": {"#$0": 2},
      "background-color": {"#$0": 2, "transparent": 2, "fixed": 2},
      "background-image": {"url('/$0')": 2},
      "background-repeat": {"repeat": 2, "repeat-x": 2, "repeat-y": 2, "no-repeat": 2, "inherit": 2},
      "background-position": {"bottom":2, "center":2, "left":2, "right":2, "top":2, "inherit":2,},
      "background-attachment": {"scroll": 2, "fixed": 2},
      "background-size": {"cover": 2, "contain": 2},
      "background-clip": {"border-box": 2, "padding-box": 2, "content-box": 2},
      "background-origin": {"border-box": 2, "padding-box": 2, "content-box": 2},
      "border": {"solid $0": 2, "dashed $0": 2, "dotted $0": 2, "#$0": 2},
      "border-top": 1,
      "border-right": 1,
      "border-bottom": 1,
      "border-left": 1,
      "border-color": {"#$0": 2},
      "border-width": 1,
      "border-style": {"solid":2, "dashed":2, "dotted":2, "double":2, "groove":2, "hidden":2, "inherit":2, "inset":2, "none":2, "outset":2, "ridged":2,},
      "border-spacing": 1,
      "border-collapse": {"collapse": 2, "separate": 2},
      "bottom": {"px": 2, "em": 2, "%": 2},
      "clear": {"left": 2, "right": 2, "both": 2, "none": 2},
      "clip": 1,
      "color": {"#$0": 2, "rgb(#$00,0,0)": 2},
      "content": 1,
      "cursor": {"default": 2, "pointer": 2, "move": 2, "text": 2, "wait": 2, "help": 2, "progress": 2, "n-resize": 2, "ne-resize": 2, "e-resize": 2, "se-resize": 2, "s-resize": 2, "sw-resize": 2, "w-resize": 2, "nw-resize": 2},
      "display": {"none": 2, "block": 2, "inline": 2, "inline-block": 2, "table-cell": 2},
      "empty-cells": {"show": 2, "hide": 2},
      "float": {"left": 2, "right": 2, "none": 2},
      "font-family": {"Arial":2,"Comic Sans MS":2,"Consolas":2,"Courier New":2,"Courier":2,"Georgia":2,"Monospace":2,"Sans-Serif":2, "Segoe UI":2,"Tahoma":2,"Times New Roman":2,"Trebuchet MS":2,"Verdana": 2},
      "font-size": {"px": 2, "em": 2, "%": 2},
      "font-weight": {"bold": 2, "normal": 2},
      "font-style": {"italic": 2, "normal": 2},
      "font-variant": {"normal": 2, "small-caps": 2},
      "font": 1,
      "height": {"px": 2, "em": 2, "%": 2},
      "left": {"px": 2, "em": 2, "%": 2},
      "letter-spacing": {"normal": 2},
      "line-height": {"normal": 2},
      "list-style": 1,
      "list-style-image": 1,
      "list-style-position": 1,
      "list-style-type": {"none": 2, "disc": 2, "circle": 2, "square": 2, "decimal": 2, "decimal-leading-zero": 2, "lower-roman": 2, "upper-roman": 2, "lower-greek": 2, "lower-latin": 2, "upper-latin": 2, "georgian": 2, "lower-alpha": 2, "upper-alpha": 2},
      "margin": {"px": 2, "em": 2, "%": 2},
      "margin-right": {"px": 2, "em": 2, "%": 2},
      "margin-left": {"px": 2, "em": 2, "%": 2},
      "margin-top": {"px": 2, "em": 2, "%": 2},
      "margin-bottom": {"px": 2, "em": 2, "%": 2},
      "max-height": {"px": 2, "em": 2, "%": 2},
      "max-width": {"px": 2, "em": 2, "%": 2},
      "min-height": {"px": 2, "em": 2, "%": 2},
      "min-width": {"px": 2, "em": 2, "%": 2},
      "outline": 1,
      "outline-color": 1,
      "outline-style": 1,
      "outline-width": 1,
      "overflow": {"hidden": 2, "visible": 2, "auto": 2, "scroll": 2},
      "overflow-x": {"hidden": 2, "visible": 2, "auto": 2, "scroll": 2},
      "overflow-y": {"hidden": 2, "visible": 2, "auto": 2, "scroll": 2},
      "padding": {"px": 2, "em": 2, "%": 2},
      "padding-top": {"px": 2, "em": 2, "%": 2},
      "padding-right": {"px": 2, "em": 2, "%": 2},
      "padding-bottom": {"px": 2, "em": 2, "%": 2},
      "padding-left": {"px": 2, "em": 2, "%": 2},
      "page-break-after": {"auto": 2, "always": 2, "avoid": 2, "left": 2, "right": 2},
      "page-break-before": {"auto": 2, "always": 2, "avoid": 2, "left": 2, "right": 2},
      "page-break-inside": 1,
      "position": {"absolute": 2, "relative": 2, "fixed": 2, "static": 2},
      "right": {"px": 2, "em": 2, "%": 2},
      "table-layout": {"fixed": 2, "auto": 2},
      "text-decoration": {"none": 2, "underline": 2, "line-through": 2, "blink": 2},
      "text-align": {"left": 2, "right": 2, "center": 2, "justify": 2},
      "text-indent": 1,
      "text-transform": {"capitalize": 2, "uppercase": 2, "lowercase": 2, "none": 2},
      "top": {"px": 2, "em": 2, "%": 2},
      "vertical-align": {"top": 2, "bottom": 2},
      "visibility": {"hidden": 2, "visible": 2},
      "white-space": {"nowrap": 2, "normal": 2, "pre": 2, "pre-line": 2, "pre-wrap": 2},
      "width": {"px": 2, "em": 2, "%": 2},
      "word-spacing": {"normal": 2},
      "z-index": 1,

      // opacity
      "opacity": 1,
      "filter": {"alpha(opacity=$0100)": 2},

      "text-shadow": {"$02px 2px 2px #777": 2},
      "text-overflow": {"ellipsis-word": 2, "clip": 2, "ellipsis": 2},

      // border radius
      "border-radius": 1,
      "-moz-border-radius": 1,
      "-moz-border-radius-topright": 1,
      "-moz-border-radius-bottomright": 1,
      "-moz-border-radius-topleft": 1,
      "-moz-border-radius-bottomleft": 1,
      "-webkit-border-radius": 1,
      "-webkit-border-top-right-radius": 1,
      "-webkit-border-top-left-radius": 1,
      "-webkit-border-bottom-right-radius": 1,
      "-webkit-border-bottom-left-radius": 1,

      // dropshadows
      "-moz-box-shadow": 1,
      "-webkit-box-shadow": 1,

      // transformations
      "transform": {"rotate($00deg)": 2, "skew($00deg)": 2},
      "-moz-transform": {"rotate($00deg)": 2, "skew($00deg)": 2},
      "-webkit-transform": {"rotate($00deg)": 2, "skew($00deg)": 2 }
    };

	var cssPseudoClasses = {
      "link": 1,
      "visited": 1,
      "active": 1,
      "hover": 1,
      "focus": 1,
      "first-letter": 1,
      "first-line": 1,
      "first-child": 1,
      "before": 1,
      "after": 1,
      "last-child": 1
	};

    // tags = 1, attributes = 2, values = 3
    var xmlDictionary =
    {
      // tags should return 1
      "html": 1,
      "head": 1,
		"meta": {
			"name": {"description": 1, "keywords": 1},
			"content": {"text/html; charset=UTF-8": 1},
			"http-equiv": {"content-type": 1 }
		},
		"link": {
			"type": {"text/css": 1, "image/png": 1, "image/jpeg": 1, "image/gif": 1},
			"rel": {"stylesheet": 1, "icon": 1},
			"href": 2,
			"media": {"all": 1, "screen": 1, "print": 1 }
		},
		"style": {
			"type": {"text/css": 1},
			"media": {"all": 1, "screen": 1, "print": 1 }
		},
		"title": 1,
		"option": {
		"value": 2,
		"selected": {"selected": 1 }
	},
	"optgroup": {
		"label": 2
	},

      // but if they have some attributes to suggest, they don't need to return 1
      // and simply return an object with those attributes, returning 2
      "script": {
        // however, this attribute wants to return values, so again it returns an
        // object, containing values that are marked as 1
        "type": {"text/javascript": 1},
        "src": 2
      },
      // body returns all common attributes, but shows "onload" as first suggestion
      "body": {
        "onload": 2
	},
      "a": {
		"name": 2,
        "href": 2,
        "target": {"_blank": 1, "top": 1},
        "rel": {"nofollow": 1, "alternate": 1, "author": 1, "bookmark": 1, "help": 1, "license": 1, "next": 1, "noreferrer": 1, "prefetch": 1, "prev": 1, "search": 1, "tag": 1 }
      },
      "img": {
        "src": 2,
        "alt": 2,
        "width": 2,
        "height": 2
      },
      "form": {
        "method": {"get": 1, "post": 1},
        "action": 2,
        "enctype": {"multipart/form-data": 1, "application/x-www-form-urlencoded": 1},
        "onsubmit": 2,
        "target": {"_blank": 1, "top": 1 }
      },
      "input": {
        "type": {
			"text": 1,
			"password": 1,
			"hidden": 1,
			"checkbox": 1,
			"submit": 1,
			"radio": 1,
			"file": 1,
			"button": 1,
			"reset": 1,
			"image": 1 ,
			"color": 1,
			"date": 1,
			"datetime": 1,
			"datetime-local": 1,
			"email": 1,
			"month": 1,
			"number": 1,
			"range": 1,
			"search": 1,
			"tel": 1,
			"time": 1,
			"url": 1,
			"week": 1
		},
        "name": 2,
        "value": 2,
        "placeholder": 2,
        "checked": {"checked": 1},
        "maxlength": 2,
        "multiple": {"multiple": 1},
        "disabled": {"disabled": 1},
        "readonly": {"readonly": 1},
        "size": 2,
        "step": 2,
        "onchange": 2,
        "onfocus": 2,
        "onblur": 2,
        "autocomplete": {"on": 1, "off": 1},
        "autofocus": {"autofocus": 1},
        "form": 2,
        "formaction": 2,
        "formenctype":  {"application/x-www-form-urlencoded": 1, "multipart/form-data": 1, "text/plain": 1},
        "formmethod":  {"get": 1, "post": 1},
        "formnovalidate":  {"formnovalidate": 1},
        "formtarget":  {"_blank": 1, "_self": 1, "_parent": 1, "_top": 1},
        "height": 2,
        "list": 2,
        "max": 2,
        "min": 2,
        "pattern": 2,
        "required": {"required": 1},
        "width": 2
      },
      "select": {
        "name": 2,
        "size": 2,
        "multiple": {"multiple": 1},
        "disabled": {"disabled": 1},
        "readonly": {"readonly": 1},
        "onchange": 2
      },
      "label": {
        "for": 2
      },
      "textarea": {
        "name": 2, "cols": 2, "rows": 2,
        "placeholder": 2,
        "wrap": {"on": 1, "off": 1, "hard": 1, "soft": 1},
        "disabled": {"disabled": 1},
        "readonly": {"readonly": 1},
        "autofocus": {"autofocus": 1},
        "form": 2,
        "maxlength": 2,
        "required": {"required": 1},
      },
      "button": {
        "onclick": 2,
        "type": {"button": 1, "submit": 1},
		 "title": 2
      },
      "keygen": {
        "onclick": 2,
        "challenge": {"challenge": 1},
        "disabled": {"disabled": 1},
        "keytype": {"rsa": 1, "dsa": 1, "ec": 1},
		 "name": 2
      },
      "table": {
        "border": {"0": 1},
        "cellpadding": {"0": 1},
        "cellspacing": {"0": 1},
        "width": 2, "height": 2,
        "summary": 2
      },
      "th": {
        "colspan": 2,
        "rowspan": 2,
        "width": 2,
        "height": 2,
        "valign": {"top": 1, "bottom": 1, "baseline": 1, "middle": 1 }
      },
      "td": {
        "colspan": 2,
        "rowspan": 2,
        "width": 2,
        "height": 2,
        "valign": {"top": 1, "bottom": 1, "baseline": 1, "middle": 1 }
      },
      "iframe": {
        "src": 2,
        "frameborder": {"0": 1},
		"allowfullscreen": {"true": 1, "false": 1},
		"sandbox": {"allow-same-origin": 1, "allow-top-navigation": 1, "allow-forms": 1, "allow-scripts": 1},
		"seamless": {"seamless": 1},
        "srcdoc": 2,
      },
      "audio": {
        "src": 2,
        "autoplay": {"autoplay": 1},
		"controls": {"controls": 1},
		"loop": {"loop": 1},
		"muted": {"muted": 1},
		"preload": {"auto": 1, "metadata": 1, "none": 1 }
      },
      "video": {
        "src": 2,
        "autoplay": {"autoplay": 1},
		"controls": {"controls": 1},
		"width": 2,
		"height": 2,
		"loop": {"loop": 1},
		"muted": {"muted": 1},
		"poster": 2,
		"preload": {"auto": 1, "metadata": 1, "none": 1}
      }
    };

	var entityDictionary = {
		'&Aacute;':1,
		'&aacute;':1,
		'&Acirc;':1,
		'&acirc;':1,
		'&acute;':1,
		'&AElig;':1,
		'&aelig;':1,
		'&Agrave;':1,
		'&agrave;':1,
		'&alefsym;':1,
		'&Alpha;':1,
		'&alpha;':1,
		'&amp;':1,
		'&and;':1,
		'&ang;':1,
		'&Aring;':1,
		'&aring;':1,
		'&asymp;':1,
		'&Atilde;':1,
		'&atilde;':1,
		'&Auml;':1,
		'&auml;':1,
		'&bdquo;':1,
		'&Beta;':1,
		'&beta;':1,
		'&brvbar;':1,
		'&bull;':1,
		'&cap;':1,
		'&Ccedil;':1,
		'&ccedil;':1,
		'&cedil;':1,
		'&cent;':1,
		'&Chi;':1,
		'&chi;':1,
		'&circ;':1,
		'&clubs;':1,
		'&cong;':1,
		'&copy;':1,
		'&crarr;':1,
		'&cup;':1,
		'&curren;':1,
		'&Dagger;':1,
		'&dagger;':1,
		'&dArr;':1,
		'&darr;':1,
		'&deg;':1,
		'&Delta;':1,
		'&delta;':1,
		'&diams;':1,
		'&divide;':1,
		'&Eacute;':1,
		'&eacute;':1,
		'&Ecirc;':1,
		'&ecirc;':1,
		'&Egrave;':1,
		'&egrave;':1,
		'&empty;':1,
		'&emsp;':1,
		'&ensp;':1,
		'&Epsilon;':1,
		'&epsilon;':1,
		'&equiv;':1,
		'&Eta;':1,
		'&eta;':1,
		'&ETH;':1,
		'&eth;':1,
		'&Euml;':1,
		'&euml;':1,
		'&euro;':1,
		'&exist;':1,
		'&fnof;':1,
		'&forall;':1,
		'&frac12;':1,
		'&frac14;':1,
		'&frac34;':1,
		'&frasl;':1,
		'&Gamma;':1,
		'&gamma;':1,
		'&ge;':1,
		'&gt;':1,
		'&hArr;':1,
		'&harr;':1,
		'&hearts;':1,
		'&hellip;':1,
		'&Iacute;':1,
		'&iacute;':1,
		'&Icirc;':1,
		'&icirc;':1,
		'&iexcl;':1,
		'&Igrave;':1,
		'&igrave;':1,
		'&image;':1,
		'&infin;':1,
		'&int;':1,
		'&Iota;':1,
		'&iota;':1,
		'&iquest;':1,
		'&isin;':1,
		'&Iuml;':1,
		'&iuml;':1,
		'&Kappa;':1,
		'&kappa;':1,
		'&Lambda;':1,
		'&lambda;':1,
		'&lang;':1,
		'&laquo;':1,
		'&lArr;':1,
		'&larr;':1,
		'&lceil;':1,
		'&ldquo;':1,
		'&le;':1,
		'&lfloor;':1,
		'&lowast;':1,
		'&loz;':1,
		'&lrm;':1,
		'&lsaquo;':1,
		'&lsquo;':1,
		'&lt;':1,
		'&macr;':1,
		'&mdash;':1,
		'&micro;':1,
		'&middot;':1,
		'&minus;':1,
		'&Mu;':1,
		'&mu;':1,
		'&nabla;':1,
		'&nbsp;':1,
		'&ndash;':1,
		'&ne;':1,
		'&ni;':1,
		'&not;':1,
		'&notin;':1,
		'&nsub;':1,
		'&Ntilde;':1,
		'&ntilde;':1,
		'&Nu;':1,
		'&nu;':1,
		'&Oacute;':1,
		'&oacute;':1,
		'&Ocirc;':1,
		'&ocirc;':1,
		'&OElig;':1,
		'&oelig;':1,
		'&Ograve;':1,
		'&ograve;':1,
		'&oline;':1,
		'&Omega;':1,
		'&omega;':1,
		'&Omicron;':1,
		'&omicron;':1,
		'&oplus;':1,
		'&or;':1,
		'&ordf;':1,
		'&ordm;':1,
		'&Oslash;':1,
		'&oslash;':1,
		'&Otilde;':1,
		'&otilde;':1,
		'&otimes;':1,
		'&Ouml;':1,
		'&ouml;':1,
		'&para;':1,
		'&part;':1,
		'&permil;':1,
		'&perp;':1,
		'&Phi;':1,
		'&phi;':1,
		'&Pi;':1,
		'&pi;':1,
		'&piv;':1,
		'&plusmn;':1,
		'&pound;':1,
		'&Prime;':1,
		'&prime;':1,
		'&prod;':1,
		'&prop;':1,
		'&Psi;':1,
		'&psi;':1,
		'&quot;':1,
		'&radic;':1,
		'&rang;':1,
		'&raquo;':1,
		'&rArr;':1,
		'&rarr;':1,
		'&rceil;':1,
		'&rdquo;':1,
		'&real;':1,
		'&reg;':1,
		'&rfloor;':1,
		'&Rho;':1,
		'&rho;':1,
		'&rlm;':1,
		'&rsaquo;':1,
		'&rsquo;':1,
		'&sbquo;':1,
		'&Scaron;':1,
		'&scaron;':1,
		'&sdot;':1,
		'&sect;':1,
		'&shy;':1,
		'&Sigma;':1,
		'&sigma;':1,
		'&sigmaf;':1,
		'&sim;':1,
		'&spades;':1,
		'&sub;':1,
		'&sube;':1,
		'&sum;':1,
		'&sup;':1,
		'&sup1;':1,
		'&sup2;':1,
		'&sup3;':1,
		'&supe;':1,
		'&szlig;':1,
		'&Tau;':1,
		'&tau;':1,
		'&there4;':1,
		'&Theta;':1,
		'&theta;':1,
		'&thetasym;':1,
		'&thinsp;':1,
		'&THORN;':1,
		'&thorn;':1,
		'&tilde;':1,
		'&times;':1,
		'&trade;':1,
		'&Uacute;':1,
		'&uacute;':1,
		'&uArr;':1,
		'&uarr;':1,
		'&Ucirc;':1,
		'&ucirc;':1,
		'&Ugrave;':1,
		'&ugrave;':1,
		'&uml;':1,
		'&upsih;':1,
		'&Upsilon;':1,
		'&upsilon;':1,
		'&Uuml;':1,
		'&uuml;':1,
		'&weierp;':1,
		'&Xi;':1,
		'&xi;':1,
		'&Yacute;':1,
		'&yacute;':1,
		'&yen;':1,
		'&Yuml;':1,
		'&yuml;':1,
		'&Zeta;':1,
		'&zeta;':1,
		'&zwj;':1,
		'&zwnj;':1
	};

	var phpVarDictionary = {
		'$_COOKIE': {
			type: 'php_array'
		},
		'$_ENV': {
			type: 'php_array'
		},
		'$_FILES': {
			type: 'php_array'
		},
		'$_GET': {
			type: 'php_array'
		},
		'$_POST': {
			type: 'php_array'
		},
		'$_REQUEST': {
			type: 'php_array'
		},
		'$_SERVER': {
			type: 'php_array',
			value: {
				"DOCUMENT_ROOT":  2,
				"GATEWAY_INTERFACE":  2,
				"HTTP_ACCEPT":  2,
				"HTTP_ACCEPT_CHARSET":  2,
				"HTTP_ACCEPT_ENCODING":  2 ,
				"HTTP_ACCEPT_LANGUAGE":  2,
				"HTTP_CONNECTION":  2,
				"HTTP_HOST":  2,
				"HTTP_REFERER":  2,
				"HTTP_USER_AGENT":  2,
				"PATH_TRANSLATED":  2,
				"PHP_SELF":  2,
				"QUERY_STRING":  2,
				"REMOTE_ADDR":  2,
				"REMOTE_PORT":  2,
				"REQUEST_METHOD":  2,
				"REQUEST_URI":  2,
				"SCRIPT_FILENAME":  2,
				"SCRIPT_NAME":  2,
				"SERVER_ADMIN":  2,
				"SERVER_NAME":  2,
				"SERVER_PORT":  2,
				"SERVER_PROTOCOL":  2,
				"SERVER_SIGNATURE":  2,
				"SERVER_SOFTWARE":  2
			}
		},
		'$_SESSION': {
			type: 'php_array'
		},
		'$GLOBALS': {
			type: 'php_array'
		},
	};

    for (var i = 0; i < html_tags.length; i++){
		xmlDictionary[html_tags[i]] = commonAttributes(xmlDictionary[html_tags[i]]);
	}

	html_tags = html_tags;

	run = function(editor, session, pos, prefix, callback){
        var panel = $(editor.container).closest("[role=tabpanel]");
        var tab = $("[role=tab][aria-controls="+panel.attr('id')+"]");
	    var definitionRanges = window.shiftedit.defs[tab.attr('id')].definitionRanges;

	    forced = (prefix!=='');

		var subject, args, i, func;
		var items = {};
		var container = editor.container;
		var line = session.getLine(pos.row).substr(0, pos.column);
		var wordpress = false;
		var siteDefinitions = {};
		var className = '';
		var functions = {};

		//get token state - this gives us more context than just token info
		var prevRow = pos.row > 0 ? pos.row-1 : 0;
		var state = session.getState(prevRow, pos.column);
		var mode = session.getMode();
		var tokenizer = mode.getTokenizer();
		var data = tokenizer.getLineTokens(line, state, pos.row);

		//get first state if more than one
		var tokenState = typeof data.state == 'object' ? data.state[0] : data.state;

		//get context
		var lang = session.$modeId.replace('ace/mode/', '');
		lang = (tokenState.match(/(php|js|css)\-/i) || ['', lang])[1].toLowerCase();

		//combine definitions
		var php_functions = {};
		var js_functions = {};
		var css_classes = {};
		var dom_ids = {};
		var php_vars = {};
		var php_classes = {};
        var defs = window.shiftedit.defs;

		for (var id in defs) {
		    if( defs.hasOwnProperty(id) ){
    			if( defs[id].definitions.php ){
    				php_functions = util.merge(php_functions, defs[id].definitions.php.functions);
    				php_vars = util.merge(php_vars, defs[id].definitions.php.variables);
    				php_classes = util.merge(php_classes, defs[id].definitions.php.classes);
    			}
    			if( defs[id].definitions.js ){
    				js_functions = util.merge(js_functions, defs[id].definitions.js.functions);
    			}
    			if( defs[id].definitions.css ){
    				css_classes = util.merge(css_classes, defs[id].definitions.css.classes);
    				dom_ids = util.merge(dom_ids, defs[id].definitions.css.ids);
    			}
		    }
		}

		//custom definitions
		/*
		if( siteDefinitions.php && siteDefinitions.php.variables ){
			php_vars = util.merge(php_vars, siteDefinitions.php.variables);
		}

		if( siteDefinitions.php && siteDefinitions.php.classes ){
			php_classes = util.merge(php_classes, siteDefinitions.php.classes);
		}
		*/

		//console.log('State: '+tokenState);
		//console.log('Context: '+context);

		//calculate the container offset for function arguments
		var obj = container;
		var curleft = 0;
		var curtop = 0;
		if (container.offsetParent) {
			do {
				curleft += obj.offsetLeft;
				curtop += obj.offsetTop;
			} while (obj = obj.offsetParent);
		}

		//get token
		var TokenIterator = require("ace/token_iterator").TokenIterator;
		var iterator = new TokenIterator(session, pos.row, pos.column);
		var token = iterator.getCurrentToken();

		//console.log(token);

		var type;
		if( token ){
			type = token.type;
		}

		//get tag name
		var tagName = '';
		console.log(lang);
		if( lang === 'html' || lang === 'php' ){
			while (token) {
				if( token.type.indexOf('tag-name') !== -1 ){
					tagName = token.value;
					break;
				}

				token = iterator.stepBackward();
			}

			if(tagName){
				console.log('Tag: '+tagName);
			}
		}

		//function arguments
		if ( lang == 'php' || lang == 'js' || lang == 'javascript' ) {
			if( lang == 'php' ){
				functions = util.merge(phpDictionary, php_functions);

				if( wordpress ){
					functions = util.merge(functions, wordpressFunctions);
				}

				if( siteDefinitions.php && siteDefinitions.php.functions ){
					functions = util.merge(functions, siteDefinitions.php.functions);
				}
			}else{
				functions = util.merge(js_functions, jsDictionary.String);
				functions = util.merge(functions, jsDictionary.Array);
				functions = util.merge(functions, jsDictionary.Number);
				functions = util.merge(functions, jsDictionary.Global);
			}

			//get function
			var level = 1;
			var commas = 0;
			func = '';
			var num = 0;
			var variable = '';
			var def;

            iterator = new TokenIterator(session, pos.row, pos.column);
            token = iterator.getCurrentToken();
			while (token) {
				//skip ->
				if( func && token.type == 'keyword.operator' ){
				//class
				}else if( func && token.type == 'variable' ){
					variable = token.value;

					if( typeof php_vars[variable] == 'object' ){
						className = php_vars[variable].value;
					}

					break;
				}else if( func ){
					break;
				}else if(
					level<=0 &&
					(
						token.type.substr(0, 'support.function'.length) == 'support.function' ||
						token.type == 'identifier' ||
						token.type == 'variable.language' ||
						token.type == 'keyword'
					)
				){
					//skip if not in this function
					if( token.type == 'keyword' ){
						break;
					}else{
						func = token.value;
					}
				}else if( token.type == 'paren.lparen' ){
					num = token.value.split("(").length - 1;
					num += token.value.split("[").length - 1;
					level -= num;
				}else if( token.type == 'paren.rparen' ){
					num = token.value.split(")").length - 1;
					num += token.value.split("]").length - 1;
					level += num;
				}else if(
					level==1 &&
					(
						( token.type == 'text' && token.value.indexOf(',')!==-1 ) ||
						( token.type == 'punctuation.operator' && token.value == ',' )
					)
				){ //count commas
					commas++;
				}

				token = iterator.stepBackward();
			}

			console.log('Function: '+func);

			//reset if outside of function
			if( level>0 ){
				func = '';
			}

			if( func ){
				if( lang == 'php' ){
					subject = 'php_function';
				}else{
					subject = 'js_function';
				}

    			if( className && php_classes[className] && php_classes[className].functions[func] ){
    				def = php_classes[className].functions[func];
    			}else{
                    if( functions[func] ){
    				    def = typeof functions[func] === 'object' ? functions[func][0] : func+' '+functions[func];
    			    }
                }
			}

			if( def ){
				console.log('Def: '+ def);

				var count = 0;
				for( i=0; i<def.length; i++ ){
					if( ['(',','].indexOf(def.charAt(i))!==-1 ){
						if( count == commas ){
							break;
						}
						count++;
					}
				}

				var arg_start = i;
				var suffix = def.slice(arg_start+1, def.length);

				if( /([,\)])/.exec(suffix) ){
					var arg_end = /([,\)])/.exec(suffix).index+1;

					def = def.substr(0,arg_start)+'<strong>'+def.substr(arg_start,arg_end)+'</strong>'+def.substr(arg_start+arg_end,def.length);

					//position of last bracket comma
					var ac_col = line.lastIndexOf(',') > line.lastIndexOf('(') ? line.lastIndexOf(',') : line.lastIndexOf('(');
					var coords = editor.renderer.textToScreenCoordinates(pos.row, ac_col);

					//draw function details
					if( document.getElementById('args') ){
						args = document.getElementById('args');
					}else{
						args = document.createElement('div');
						args.id = 'args';
					}

					//position code assist
					args.style.top = coords.pageY - curtop - 20 + "px";
					args.style.left = coords.pageX - curleft + "px";
					args.innerHTML = def;
					container.appendChild(args);
				}
			}
		}else if (document.getElementById('args')) {
			args = document.getElementById('args');
			args.parentNode.removeChild(args);
		}

		//css
		if( lang === 'css' && (tokenState === 'css-start' || tokenState === 'start') ){
			// .class
			if( /(\..*)$/i.test(line) ){
				subject = 'css_class';
				items = css_classes;
			// pseudo
			}else if( /(:.*)$/i.test(line) ){
				subject = 'css_pseudo_class';
				items = cssPseudoClasses;
			// id
			}else if( /(#.*)$/i.test(line) ){
				subject = 'css_id';
				items = dom_ids;
			}
		}else if( lang === 'css' || /style="([^"]*)$/.test(line) ){
			//css attribute value
			if( /:[^;]+$/.test( line ) ){
				subject = 'css_attribute_value';

				/([\w\-]+):[^:]*$/.test(line);
				var CSSAttribute = RegExp.$1;
				if(cssDictionary[CSSAttribute]){
				    items = cssDictionary[CSSAttribute];
				}
			}else{
				subject = 'css_attribute_name';
				items = cssDictionary;
			}
		//html entity
		}else if ( /&[A-z]*$/i.test(line) ) {
			subject = 'html_entity';
			items = entityDictionary;
		//js function dom
		} else if ( subject === 'js_function' && func == 'getElementById' && type == 'string' ) {
			subject = 'css_id';
			items = dom_ids;
		//jquery
		} else if ( /\$\([^)]+\).(\w*)$/i.test(line) ) {
			subject = 'jquery';
			items = jqueryDictionary;
		//jquery selectors
		}else if(lang === 'js' && type == 'string'){
			// .class
			if (/(\..*)$/i.test(line)) {
				subject = 'js_class';
				items = css_classes;
			}
			// id
			if (/(#.*)$/i.test(line)) {
				subject = 'css_id';
				items = dom_ids;
			}
		//js property
		} else if ( /([A-z]*)\.([A-z]*)$/i.test(line) ) {
			subject = 'js_property';

			if( jsDictionary[RegExp.$1] ){
				items = jsDictionary[RegExp.$1];
			}else{
				items = util.merge(jsDictionary.String, jsDictionary.Array);
				items = util.merge(items, jsDictionary.Number);
			}
		//php array key
		}else if( lang === 'php' && /(\$[\w]*)\[["']([^'"]*)$/i.test(line) ){
			subject = 'php_array_key';
			attribute = RegExp.$1;

			vars = util.merge(phpVarDictionary, php_vars);

			if( vars[attribute] && typeof vars[attribute].value == 'object' ){
				items = util.clone(vars[attribute].value);
			}
		//php var
		}else if( lang === 'php' && /(\$[\w]*)$/i.test(line) ){
			subject = 'php_var';
			items = util.merge(phpVarDictionary, php_vars);
		//php class
		}else if( lang === 'php' && /new\s+(\w*)$/i.test(line) ){
			subject = 'php_class';
			items = php_classes;
		//php class property
		}else if( lang === 'php' && /(\$[\w]*)->([\w]*)$/i.test(line) ){
			subject = 'php_class_property';
			var property = RegExp.$1;

			if( property == '$this' ){
				var Range = require("ace/range").Range;

				$.each(definitionRanges.php.classes, function (name, range) {
					if(!range.end){
						return;
					}

					range = new Range(range.start.row, range.start.column, range.end.row, range.end.column);

					if( range.contains(pos.row, pos.column) ){
						className = name;
						return;
					}
				});
			}else if( typeof php_vars[property] == 'object' ){
				className = php_vars[property].value;
			}

			if( className && php_classes[className] ){
				items = php_classes[className].functions;
			}
		//attribute value
		}else if( util.startsWith(type, 'string.attribute-value') && /([\w]+)="([^"]+\s)?([^"]*)$/i.test(line) ){
			subject = 'html_attribute_value';
			attribute = RegExp.$1;

			//classes
			if( xmlDictionary.hasOwnProperty(tagName) ){
				xmlDictionary[tagName].class = css_classes;
				xmlDictionary[tagName].id = dom_ids;

				if( xmlDictionary[tagName].hasOwnProperty(attribute) ){
					items = xmlDictionary[tagName][attribute];
				}
			}
		// attribute name
		}else if( tokenState === 'tag_stuff' && /\s([\w]*)$/i.test(line)){
			subject = 'html_attribute_name';
			items = xmlDictionary[tagName];
		// tag
		}else if( /<(\w*)$/i.test( line ) ){
			subject = 'html_tag';
			items = xmlDictionary;
		}else if( forced && lang == 'php' && type !== 'comment' ){
			subject = 'php_function';
			functions = util.merge(phpDictionary, php_functions);

			if( wordpress ){
				functions = util.merge(functions, wordpressFunctions);
			}

			if( siteDefinitions.php && siteDefinitions.php.functions ){
				functions = util.merge(functions, siteDefinitions.php.functions);
			}

			items = functions;

			for (i in items) {
		        if( items[i] ){
			        items[i][1] = "<h4>" + items[i][0] + "</h4>" + items[i][1];
			        items[i][0] = i + '($0)';
		        }
			}
		}else if( forced && (lang == 'js' || lang == 'javascript') ){
			subject = 'js_function';
			functions = util.merge(jsDictionary.Global, js_functions);

			if( siteDefinitions.js && siteDefinitions.js.functions ){
				functions = util.merge(functions, siteDefinitions.js.functions);
			}

			items = functions;
		}

		if( forced ){
			//subject = 'snippets';
            /*
			var getDeepAllLeafNodes = function(node,onlyLeaf){
				var allNodes = [];
				if(!value(node, false)){
					return [];
				}

				if (node.isLeaf()) {
					return node;
				} else {
					node.eachChild(
						function(Mynode){
							allNodes = allNodes.concat(getDeepAllLeafNodes(Mynode));
						}
					);
				}
				return allNodes;
			};

			//snippets
			var nodes;
			if( $('#snippetTree') ){
			    nodes = getDeepAllLeafNodes($('#snippetTree').getStore().getRootNode(), true);
			}

			$.each(nodes, function (item) {
				items[item.data.text] = [item.raw.snippet1+'$0'+item.raw.snippet2, '', 'snippets'];
			});
			*/
		}

		if( subject ){
			console.log('Subject: '+subject);
		}

		//create autocomplete options
		var options = [];
		var caption;
		var value;
		var snippet;
		var doc = '';
		var meta = '';

		for (i in items) {
		    if( items[i] ){
    			caption = i;
    			value = i;
    			snippet = null;

    			if(typeof items[i] === 'object' && items[i][0]){
    				snippet = items[i][0];
    			}

    			if(subject==='html_entity'){
    				value = value.substr(1);
    			}

    			if( value.indexOf('$0')!==-1 ){
    			    snippet = value;
    			    caption = value.replace('$0', '');
    			}

    			// if function add braces
    			if( typeof items[i] == 'string' && items[i].indexOf('(') !==-1 ){
    				snippet = value + '($0)';
    			}

    			switch(subject){
    				case 'html_attribute_name':
    					snippet = value + '="$0"';
    				break;
    				case 'css_attribute_name':
    					snippet = value + ': ';
    				break;
    			}

    			doc = '';
    			if(typeof items[i] === 'object' && items[i][1]){
    				doc = items[i][1];
    			}

    			meta = subject;
    			if(typeof items[i] === 'object' && items[i][2]){
    				meta = items[i][2];
    			}

    			options.push({
    				caption: caption,
                    snippet: snippet,
                    value: value,
    				meta: meta,
    				doc: doc
    			});
		    }
		}

		return options;
	};


    return {
        run: run
    };
});