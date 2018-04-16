define(['./modes', 'md5'], function (modes, md5) {

modes = modes.modes;

function clone(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function fileExtension(filename) {
	if( filename.length === 0 ) return "";
	var dot = filename.lastIndexOf(".");
	if( dot == -1 ) return "";
	return filename.substr(dot+1, filename.length);
}

/* Array of bytes to base64 string decoding */

function b64ToUint6 (nChr) {
	return nChr > 64 && nChr < 91 ?
			nChr - 65
		: nChr > 96 && nChr < 123 ?
			nChr - 71
		: nChr > 47 && nChr < 58 ?
			nChr + 4
		: nChr === 43 ?
			62
		: nChr === 47 ?
			63
		:
			0;
}

function base64DecToArr (sBase64, nBlocksSize) {
	var
		sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, ""), nInLen = sB64Enc.length,
		nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2, taBytes = new Uint8Array(nOutLen);

	for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
		nMod4 = nInIdx & 3;
		nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 6 * (3 - nMod4);
		if (nMod4 === 3 || nInLen - nInIdx === 1) {
			for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
				taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
			}
			nUint24 = 0;
		}
	}

	return taBytes;
}

/* Base64 string to array encoding */

function uint6ToB64 (nUint6) {
	return nUint6 < 26 ?
			nUint6 + 65
		: nUint6 < 52 ?
			nUint6 + 71
		: nUint6 < 62 ?
			nUint6 - 4
		: nUint6 === 62 ?
			43
		: nUint6 === 63 ?
			47
		:
			65;
}

function base64EncArr (aBytes) {
	var nMod3 = 2, sB64Enc = "";

	for (var nLen = aBytes.length, nUint24 = 0, nIdx = 0; nIdx < nLen; nIdx++) {
		nMod3 = nIdx % 3;
		if (nIdx > 0 && (nIdx * 4 / 3) % 76 === 0) { sB64Enc += "\r\n"; }
		nUint24 |= aBytes[nIdx] << (16 >>> nMod3 & 24);
		if (nMod3 === 2 || aBytes.length - nIdx === 1) {
			sB64Enc += String.fromCharCode(uint6ToB64(nUint24 >>> 18 & 63), uint6ToB64(nUint24 >>> 12 & 63), uint6ToB64(nUint24 >>> 6 & 63), uint6ToB64(nUint24 & 63));
			nUint24 = 0;
		}
	}

	return sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) + (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==');
}

/* UTF-8 array to DOMString and vice versa */

function UTF8ArrToStr (aBytes) {
	var sView = "";

	for (var nPart, nLen = aBytes.length, nIdx = 0; nIdx < nLen; nIdx++) {
		nPart = aBytes[nIdx];
		sView += String.fromCharCode(
			nPart > 251 && nPart < 254 && nIdx + 5 < nLen ? /* six bytes */
				/* (nPart - 252 << 30) may be not so safe in ECMAScript! So...: */
				(nPart - 252) * 1073741824 + (aBytes[++nIdx] - 128 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
			: nPart > 247 && nPart < 252 && nIdx + 4 < nLen ? /* five bytes */
				(nPart - 248 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
			: nPart > 239 && nPart < 248 && nIdx + 3 < nLen ? /* four bytes */
				(nPart - 240 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
			: nPart > 223 && nPart < 240 && nIdx + 2 < nLen ? /* three bytes */
				(nPart - 224 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
			: nPart > 191 && nPart < 224 && nIdx + 1 < nLen ? /* two bytes */
				(nPart - 192 << 6) + aBytes[++nIdx] - 128
			: /* nPart < 127 ? */ /* one byte */
				nPart
		);
	}

	return sView;
}

function strToUTF8Arr (sDOMStr) {
	var aBytes, nChr, nStrLen = sDOMStr.length, nArrLen = 0;

	/* mapping... */

	for (var nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
		nChr = sDOMStr.charCodeAt(nMapIdx);
		nArrLen += nChr < 0x80 ? 1 : nChr < 0x800 ? 2 : nChr < 0x10000 ? 3 : nChr < 0x200000 ? 4 : nChr < 0x4000000 ? 5 : 6;
	}

	aBytes = new Uint8Array(nArrLen);

	/* transcription... */

	for (var nIdx = 0, nChrIdx = 0; nIdx < nArrLen; nChrIdx++) {
		nChr = sDOMStr.charCodeAt(nChrIdx);
		if (nChr < 128) {
			/* one byte */
			aBytes[nIdx++] = nChr;
		} else if (nChr < 0x800) {
			/* two bytes */
			aBytes[nIdx++] = 192 + (nChr >>> 6);
			aBytes[nIdx++] = 128 + (nChr & 63);
		} else if (nChr < 0x10000) {
			/* three bytes */
			aBytes[nIdx++] = 224 + (nChr >>> 12);
			aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
			aBytes[nIdx++] = 128 + (nChr & 63);
		} else if (nChr < 0x200000) {
			/* four bytes */
			aBytes[nIdx++] = 240 + (nChr >>> 18);
			aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
			aBytes[nIdx++] = 128 + (nChr & 63);
		} else if (nChr < 0x4000000) {
			/* five bytes */
			aBytes[nIdx++] = 248 + (nChr >>> 24);
			aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
			aBytes[nIdx++] = 128 + (nChr & 63);
		} else /* if (nChr <= 0x7fffffff) */ {
			/* six bytes */
			aBytes[nIdx++] = 252 + (nChr >>> 30);
			aBytes[nIdx++] = 128 + (nChr >>> 24 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
			aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
			aBytes[nIdx++] = 128 + (nChr & 63);
		}
	}

	return aBytes;
}

return {
	b64toBlob: function(b64Data, contentType, sliceSize) {
		contentType = contentType || '';
		sliceSize = sliceSize || 512;

		var byteCharacters = atob(b64Data);
		var byteArrays = [];

		for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
			var slice = byteCharacters.slice(offset, offset + sliceSize);

			var byteNumbers = new Array(slice.length);
			for (var i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			}

			var byteArray = new Uint8Array(byteNumbers);

			byteArrays.push(byteArray);
		}

		var blob = new Blob(byteArrays, {type: contentType});
		return blob;
	},
	basename: function(file) {
		var pos = file.lastIndexOf('/');
		return file.substring(pos+1,file.length);
	},
	clone: clone,
	copy: function(text) {
		var clipboard = $('<textarea id="clipboard"><textarea>').appendTo('body').val(text).focus().select();
	    document.execCommand("Copy");
	    clipboard.remove();
	},
	date: function(format, timestamp) {
		var that = this,
			jsdate,
			f,
			// Keep this here (works, but for code commented-out
			// below for file size reasons)
			//, tal= [],
			txt_words = ['Sun', 'Mon', 'Tues', 'Wednes', 'Thurs', 'Fri', 'Satur', 'January', 'February', 'March', 'April',
				'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
			],
			// trailing backslash -> (dropped)
			// a backslash followed by any character (including backslash) -> the character
			// empty string -> empty string
			formatChr = /\\?(.?)/gi,
			formatChrCb = function(t, s) {
				return f[t] ? f[t]() : s;
			};
		_pad = function(n, c) {
			n = String(n);
			while (n.length < c) {
				n = '0' + n;
			}
			return n;
		};
		f = {
			// Day
			d: function() { // Day of month w/leading 0; 01..31
				return _pad(f.j(), 2);
			},
			D: function() { // Shorthand day name; Mon...Sun
				return f.l()
					.slice(0, 3);
			},
			j: function() { // Day of month; 1..31
				return jsdate.getDate();
			},
			l: function() { // Full day name; Monday...Sunday
				return txt_words[f.w()] + 'day';
			},
			N: function() { // ISO-8601 day of week; 1[Mon]..7[Sun]
				return f.w() || 7;
			},
			S: function() { // Ordinal suffix for day of month; st, nd, rd, th
				var j = f.j(),
					i = j % 10;
				if (i <= 3 && parseInt((j % 100) / 10, 10) == 1) {
					i = 0;
				}
				return ['st', 'nd', 'rd'][i - 1] || 'th';
			},
			w: function() { // Day of week; 0[Sun]..6[Sat]
				return jsdate.getDay();
			},
			z: function() { // Day of year; 0..365
				var a = new Date(f.Y(), f.n() - 1, f.j()),
					b = new Date(f.Y(), 0, 1);
				return Math.round((a - b) / 864e5);
			},

			// Week
			W: function() { // ISO-8601 week number
				var a = new Date(f.Y(), f.n() - 1, f.j() - f.N() + 3),
					b = new Date(a.getFullYear(), 0, 4);
				return _pad(1 + Math.round((a - b) / 864e5 / 7), 2);
			},

			// Month
			F: function() { // Full month name; January...December
				return txt_words[6 + f.n()];
			},
			m: function() { // Month w/leading 0; 01...12
				return _pad(f.n(), 2);
			},
			M: function() { // Shorthand month name; Jan...Dec
				return f.F()
					.slice(0, 3);
			},
			n: function() { // Month; 1...12
				return jsdate.getMonth() + 1;
			},
			t: function() { // Days in month; 28...31
				return (new Date(f.Y(), f.n(), 0))
					.getDate();
			},

			// Year
			L: function() { // Is leap year?; 0 or 1
				var j = f.Y();
				return j % 4 === 0 & j % 100 !== 0 | j % 400 === 0;
			},
			o: function() { // ISO-8601 year
				var n = f.n(),
					W = f.W(),
					Y = f.Y();
				return Y + (n === 12 && W < 9 ? 1 : n === 1 && W > 9 ? -1 : 0);
			},
			Y: function() { // Full year; e.g. 1980...2010
				return jsdate.getFullYear();
			},
			y: function() { // Last two digits of year; 00...99
				return f.Y()
					.toString()
					.slice(-2);
			},

			// Time
			a: function() { // am or pm
				return jsdate.getHours() > 11 ? 'pm' : 'am';
			},
			A: function() { // AM or PM
				return f.a()
					.toUpperCase();
			},
			B: function() { // Swatch Internet time; 000..999
				var H = jsdate.getUTCHours() * 36e2,
					// Hours
					i = jsdate.getUTCMinutes() * 60,
					// Minutes
					s = jsdate.getUTCSeconds(); // Seconds
				return _pad(Math.floor((H + i + s + 36e2) / 86.4) % 1e3, 3);
			},
			g: function() { // 12-Hours; 1..12
				return f.G() % 12 || 12;
			},
			G: function() { // 24-Hours; 0..23
				return jsdate.getHours();
			},
			h: function() { // 12-Hours w/leading 0; 01..12
				return _pad(f.g(), 2);
			},
			H: function() { // 24-Hours w/leading 0; 00..23
				return _pad(f.G(), 2);
			},
			i: function() { // Minutes w/leading 0; 00..59
				return _pad(jsdate.getMinutes(), 2);
			},
			s: function() { // Seconds w/leading 0; 00..59
				return _pad(jsdate.getSeconds(), 2);
			},
			u: function() { // Microseconds; 000000-999000
				return _pad(jsdate.getMilliseconds() * 1000, 6);
			},

			// Timezone
			e: function() { // Timezone identifier; e.g. Atlantic/Azores, ...
				// The following works, but requires inclusion of the very large
				// timezone_abbreviations_list() function.
				/* return that.date_default_timezone_get();
				 */
				throw 'Not supported (see source code of date() for timezone on how to add support)';
			},
			I: function() { // DST observed?; 0 or 1
				// Compares Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC.
				// If they are not equal, then DST is observed.
				var a = new Date(f.Y(), 0),
					// Jan 1
					c = Date.UTC(f.Y(), 0),
					// Jan 1 UTC
					b = new Date(f.Y(), 6),
					// Jul 1
					d = Date.UTC(f.Y(), 6); // Jul 1 UTC
				return ((a - c) !== (b - d)) ? 1 : 0;
			},
			O: function() { // Difference to GMT in hour format; e.g. +0200
				var tzo = jsdate.getTimezoneOffset(),
					a = Math.abs(tzo);
				return (tzo > 0 ? '-' : '+') + _pad(Math.floor(a / 60) * 100 + a % 60, 4);
			},
			P: function() { // Difference to GMT w/colon; e.g. +02:00
				var O = f.O();
				return (O.substr(0, 3) + ':' + O.substr(3, 2));
			},
			T: function() { // Timezone abbreviation; e.g. EST, MDT, ...
				// The following works, but requires inclusion of the very
				// large timezone_abbreviations_list() function.
				/* var abbr = '', i = 0, os = 0, default = 0;
				if (!tal.length) {
					tal = that.timezone_abbreviations_list();
				}
				if (that.php_js && that.php_js.default_timezone) {
					default = that.php_js.default_timezone;
					for (abbr in tal) {
						for (i=0; i < tal[abbr].length; i++) {
							if (tal[abbr][i].timezone_id === default) {
								return abbr.toUpperCase();
							}
						}
					}
				}
				for (abbr in tal) {
					for (i = 0; i < tal[abbr].length; i++) {
						os = -jsdate.getTimezoneOffset() * 60;
						if (tal[abbr][i].offset === os) {
							return abbr.toUpperCase();
						}
					}
				}
				*/
				return 'UTC';
			},
			Z: function() { // Timezone offset in seconds (-43200...50400)
				return -jsdate.getTimezoneOffset() * 60;
			},

			// Full Date/Time
			c: function() { // ISO-8601 date.
				return 'Y-m-d\\TH:i:sP'.replace(formatChr, formatChrCb);
			},
			r: function() { // RFC 2822
				return 'D, d M Y H:i:s O'.replace(formatChr, formatChrCb);
			},
			U: function() { // Seconds since UNIX epoch
				return jsdate / 1000 | 0;
			}
		};
		this.date = function(format, timestamp) {
			that = this;
			jsdate = (timestamp === undefined ? new Date() : // Not provided
				(timestamp instanceof Date) ? new Date(timestamp) : // JS Date()
				new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
			);
			return format.replace(formatChr, formatChrCb);
		};
		return this.date(format, timestamp);
	},
	dirname: function(path) {
		if(path.indexOf('/')==-1) {
			return '';
		}

		return path.replace(/\\/g, '/').replace(/\/[^\/]*\/?$/, '');
	},
	escapeHTML: function(unsafe) {
		return unsafe
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	},
	hexToRgb: function(hex) {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	},
	makeMenuText: function(text, key, name) {
		key = key || '';
		name = name || '';

		return '<div class="'+name+' menu-item"><div class="label">' + text + '</div><div class="shortcut">' + key + '</div></div>';
	},
	fileExtension: fileExtension,
	getMimetype: function(file) {
		var ext = fileExtension(file);
		var mimeType = 'application/octet-stream';
		$.each(modes, function (key) {
			if (this[2].indexOf(ext) !== -1) {
				mimeType = this[3];
				return;
			}
		});

		return mimeType;
	},
	merge: function(obj1, obj2) {
		/*
		var obj3 = {};
		for (var attrname in obj1) {obj3[attrname] = obj1[attrname]; }
		for (var attrname in obj2) {obj3[attrname] = obj2[attrname]; }
		return obj3;*/

		var obj1b = clone(obj1);
		var obj2b = clone(obj2);

		return $.extend({}, obj1b, obj2b);
	},
	relative: function(from, to) {
		function trim(arr) {
			var start = 0;
			for (; start < arr.length; start++) {
				if (arr[start] !== '') break;
			}

			var end = arr.length - 1;
			for (; end >= 0; end--) {
				if (arr[end] !== '') break;
			}

			if (start > end) return [];
			return arr.slice(start, end - start + 1);
		}

		var fromParts = trim(from.split('/'));
		var toParts = trim(to.split('/'));

		var length = Math.min(fromParts.length, toParts.length);
		var samePartsLength = length;
		for (var i = 0; i < length; i++) {
			if (fromParts[i] !== toParts[i]) {
				samePartsLength = i;
				break;
			}
		}

		var outputParts = [];
		for (i = samePartsLength; i < fromParts.length; i++) {
			outputParts.push('..');
		}

		outputParts = outputParts.concat(toParts.slice(samePartsLength));
		return outputParts.join('/');
	},
	rgbToHex: function(r, g, b) {
		function componentToHex(c) {
			c = parseInt(c);

			if(isNaN(c))
				return '00';

			var hex = c.toString(16);
			return hex.length == 1 ? "0" + hex : hex;
		}

		return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
	},
	selectFilename: function() {
		var pos = this.value.lastIndexOf('.');

		if(pos!==-1) {
			this.setSelectionRange(0, pos);
		} else {
			this.select();
		}
	},
	serializeObject: function(form) {
		var paramObj = {};
		$.each($(form).serializeArray(), function(_, kv) {
			paramObj[kv.name] = kv.value;
		});
		return paramObj;
	},
	sha1: function(str) {
		// http://kevin.vanzonneveld.net
		// + original by: Webtoolkit.info (http://www.webtoolkit.info/)
		// + namespaced by: Michael White (http://getsprink.com)
		// + input by: Brett Zamir (http://brett-zamir.me)
		// + improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
		// - depends on: utf8_encode
		// * example 1: sha1('Kevin van Zonneveld');
		// * returns 1: '54916d2e62f65b3afa6e192e6a601cdbe5cb5897'

		var rotate_left = function (n,s) {
			var t4 = ( n<<s ) | (n>>>(32-s));
			return t4;
		};

		var cvt_hex = function (val) {
			var str="";
			var i;
			var v;

			for (i=7; i>=0; i--) {
				v = (val>>>(i*4))&0x0f;
				str += v.toString(16);
			}
			return str;
		};

		var blockstart;
		var i, j;
		var W = new Array(80);
		var H0 = 0x67452301;
		var H1 = 0xEFCDAB89;
		var H2 = 0x98BADCFE;
		var H3 = 0x10325476;
		var H4 = 0xC3D2E1F0;
		var A, B, C, D, E;
		var temp;

		str = this.utf8_encode(str);
		var str_len = str.length;

		var word_array = [];
		for (i=0; i<str_len-3; i+=4) {
			j = str.charCodeAt(i)<<24 | str.charCodeAt(i+1)<<16 |
			str.charCodeAt(i+2)<<8 | str.charCodeAt(i+3);
			word_array.push( j );
		}

		switch (str_len % 4) {
			case 0:
        i = 0x080000000;
			break;
			case 1:
				i = str.charCodeAt(str_len-1)<<24 | 0x0800000;
			break;
			case 2:
				i = str.charCodeAt(str_len-2)<<24 | str.charCodeAt(str_len-1)<<16 | 0x08000;
			break;
			case 3:
				i = str.charCodeAt(str_len-3)<<24 | str.charCodeAt(str_len-2)<<16 | str.charCodeAt(str_len-1)<<8 | 0x80;
			break;
		}

		word_array.push( i );

		while ((word_array.length % 16) != 14 ) {word_array.push( 0 );}

		word_array.push( str_len>>>29 );
		word_array.push( (str_len<<3)&0x0ffffffff );

		for ( blockstart=0; blockstart<word_array.length; blockstart+=16 ) {
			for (i=0; i<16; i++) {W[i] = word_array[blockstart+i];}
			for (i=16; i<=79; i++) {W[i] = rotate_left(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);}

			A = H0;
			B = H1;
			C = H2;
			D = H3;
			E = H4;

			for (i= 0; i<=19; i++) {
				temp = (rotate_left(A,5) + ((B&C) | (~B&D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
				E = D;
				D = C;
				C = rotate_left(B,30);
				B = A;
				A = temp;
			}

			for (i=20; i<=39; i++) {
				temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
				E = D;
				D = C;
				C = rotate_left(B,30);
				B = A;
				A = temp;
			}

			for (i=40; i<=59; i++) {
				temp = (rotate_left(A,5) + ((B&C) | (B&D) | (C&D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
				E = D;
				D = C;
				C = rotate_left(B,30);
				B = A;
				A = temp;
			}

			for (i=60; i<=79; i++) {
				temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
				E = D;
				D = C;
				C = rotate_left(B,30);
				B = A;
				A = temp;
			}

			H0 = (H0 + A) & 0x0ffffffff;
			H1 = (H1 + B) & 0x0ffffffff;
			H2 = (H2 + C) & 0x0ffffffff;
			H3 = (H3 + D) & 0x0ffffffff;
			H4 = (H4 + E) & 0x0ffffffff;
		}

		temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
		return temp.toLowerCase();
	},
	strToHex: function(str) {
		return '#' + md5(str).slice(0, 6);
	},
	startsWith: function(haystack, needle) {
		if(haystack)
			return needle === "" || haystack.indexOf(needle) === 0;
	},
	endsWith: function(haystack, needle) {
		if(haystack)
			return needle === "" || haystack.indexOf(needle) === (haystack.length - needle.length);
	},
	utf8_encode: function( argString ) {
		// http://kevin.vanzonneveld.net
		// + original by: Webtoolkit.info (http://www.webtoolkit.info/)
		// + improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
		// + improved by: sowberry
		// + tweaked by: Jack
		// + bugfixed by: Onno Marsman
		// + improved by: Yves Sucaet
		// + bugfixed by: Onno Marsman
		// + bugfixed by: Ulrich
		// * example 1: utf8_encode('Kevin van Zonneveld');
		// * returns 1: 'Kevin van Zonneveld'

		var string = (argString+''); // .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
		var utftext = "";
		var start, end;
		var stringl = 0;

		start = end = 0;
		stringl = string.length;
		for (var n = 0; n < stringl; n++) {
			var c1 = string.charCodeAt(n);
			var enc = null;

			if (c1 < 128) {
				end++;
			} else if (c1 > 127 && c1 < 2048) {
				enc = String.fromCharCode((c1 >> 6) | 192) + String.fromCharCode((c1 & 63) | 128);
			} else {
				enc = String.fromCharCode((c1 >> 12) | 224) + String.fromCharCode(((c1 >> 6) & 63) | 128) + String.fromCharCode((c1 & 63) | 128);
			}
			if (enc !== null) {
				if (end > start) {
					utftext += string.substring(start, end);
				}
				utftext += enc;
				start = end = n+1;
			}
		}

		if (end > start) {
			utftext += string.substring(start, string.length);
		}

		return utftext;
	},

	base64EncArr: base64EncArr,
	strToUTF8Arr: strToUTF8Arr
};

});