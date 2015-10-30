define(function (require) {

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
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
    basename: function(file)
    {
    	var pos = file.lastIndexOf('/');
    	return file.substring(pos+1,file.length);
    },
    clone: clone,
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
          /*              return that.date_default_timezone_get();
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
          /*              var abbr = '', i = 0, os = 0, default = 0;
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
    	if( path.indexOf('/')==-1 ){
    		return '';
    	}

        return path.replace(/\\/g, '/').replace(/\/[^\/]*\/?$/, '');
    },
    hexToRgb: function(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },
    makeMenuText: function(text, key) {
		if( !key ){
			key ='';
		}

		return '<div style="display:inline-block; width:160px;">' + text + '</div><div style="display:inline-block; color: gray;">' + key + '</div>';
	},
	fileExtension: function(filename) {
    	if( filename.length === 0 ) return "";
    	var dot = filename.lastIndexOf(".");
    	if( dot == -1 ) return "";
    	return filename.substr(dot+1, filename.length);
    },
    merge: function(obj1, obj2){
		/*
		var obj3 = {};
		for (var attrname in obj1) {obj3[attrname] = obj1[attrname]; }
		for (var attrname in obj2) {obj3[attrname] = obj2[attrname]; }
		return obj3;*/

		var obj1b = clone(obj1);
		var obj2b = clone(obj2);

		return $.extend({}, obj1b, obj2b);
	},
    rgbToHex: function(r, g, b) {
        function componentToHex(c) {
        	c = parseInt(c);

        	if( isNaN(c) ){
        		return '00';
        	}

            var hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }

        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    },
    selectFilename: function(){
        var pos = this.value.lastIndexOf('.');

        if( pos!==-1 ){
            this.setSelectionRange(0, pos);
        }else{
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
    startsWith: function(haystack, needle) {
        if(haystack)
            return needle === "" || haystack.indexOf(needle) === 0;
    },
    sha1: function (str) {
        // http://kevin.vanzonneveld.net
        // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
        // + namespaced by: Michael White (http://getsprink.com)
        // +      input by: Brett Zamir (http://brett-zamir.me)
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // -    depends on: utf8_encode
        // *     example 1: sha1('Kevin van Zonneveld');
        // *     returns 1: '54916d2e62f65b3afa6e192e6a601cdbe5cb5897'

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
                i = str.charCodeAt(str_len-3)<<24 | str.charCodeAt(str_len-2)<<16 | str.charCodeAt(str_len-1)<<8    | 0x80;
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
    utf8_encode: function( argString ) {
        // http://kevin.vanzonneveld.net
        // +   original by: Webtoolkit.info (http://www.webtoolkit.info/)
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   improved by: sowberry
        // +    tweaked by: Jack
        // +   bugfixed by: Onno Marsman
        // +   improved by: Yves Sucaet
        // +   bugfixed by: Onno Marsman
        // +   bugfixed by: Ulrich
        // *     example 1: utf8_encode('Kevin van Zonneveld');
        // *     returns 1: 'Kevin van Zonneveld'

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
    }
};

});