define(function (require) {

return {
    basename: function(file)
    {
    	var pos = file.lastIndexOf('/');
    	return file.substring(pos+1,file.length);
    },
    clone: function(obj) {
        return JSON.parse(JSON.stringify(obj));
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