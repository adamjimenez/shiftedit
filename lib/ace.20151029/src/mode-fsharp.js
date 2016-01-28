define('ace/mode/fsharp_highlight_rules', function (require, exports, module)
{
    "use strict";

    var oop = require("../lib/oop");
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

    var FSharpHighlightRules = function ()
    {
        var keywords =
            // actual keywords
            'abstract|and|as|assert|base|begin|class|default|delegate|do|done|downcast|downto|elif|else|end|exception|extern|false' +
            '|finally|for|fun|function|global|if|in|inherit|inline|interface|internal|lazy|let|let!|match|member|module|mutable|namespace' +
            '|new|not|null|of|open|or|override|private|public|rec|return|return!|select|static|struct|then|to|true|try|type|typeof|upcast|use' +
            '|use!|val|void|when|while|with|yield|yield!|__SOURCE_DIRECTORY__' +

            // OCaml keywords
            '|asr|land|lor|lsl|lsr|lxor|mod|sig' +

            // future keywords
            '|atomic|break|checked|component|const|constraint|constructor|continue|eager|event|external|fixed|functor|include|' +
            '|method|mixin|object|parallel|process|protected|pure|sealed|tailcall|trait|virtual|volatile';

        var builtinConstants = ("true|false");

        var builtinFunctions = (
            ''
        );

        var keywordMapper = this.createKeywordMapper({
            "variable.language": "this",
            "keyword": keywords,
            "constant.language": builtinConstants,
            "support.function": builtinFunctions
        }, "identifier");

        var decimalInteger = "(?:(?:[1-9]\\d*)|(?:0))";
        var octInteger = "(?:0[oO]?[0-7]+)";
        var hexInteger = "(?:0[xX][\\dA-Fa-f]+)";
        var binInteger = "(?:0[bB][01]+)";
        var integer = "(?:" + decimalInteger + "|" + octInteger + "|" + hexInteger + "|" + binInteger + ")";

        var exponent = "(?:[eE][+-]?\\d+)";
        var fraction = "(?:\\.\\d+)";
        var intPart = "(?:\\d+)";
        var pointFloat = "(?:(?:" + intPart + "?" + fraction + ")|(?:" + intPart + "\\.))";
        var exponentFloat = "(?:(?:" + pointFloat + "|" + intPart + ")" + exponent + ")";
        var floatNumber = "(?:" + exponentFloat + "|" + pointFloat + ")";

        this.$rules = {
            "start": [
                {
                    token: "comment",
                    regex: '\\(\\*.*?\\*\\)\\s*?$'
                },
                {
                    token: "comment",
                    regex: '\\(\\*.*',
                    next: "comment"
                },
                {
                    token: "string", // single line
                    regex: '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]'
                },
                {
                    token: "string", // single char
                    regex: "'.'"
                },
                {
                    token: "string", // " string
                    regex: '"',
                    next: "qstring"
                },
                {
                    token: "constant.numeric", // imaginary
                    regex: "(?:" + floatNumber + "|\\d+)[jJ]\\b"
                },
                {
                    token: "constant.numeric", // float
                    regex: floatNumber
                },
                {
                    token: "constant.numeric", // integer
                    regex: integer + "\\b"
                },
                {
                    token: keywordMapper,
                    regex: "[a-zA-Z_$][a-zA-Z0-9_$]*\\b"
                },
                {
                    token: "keyword.operator",
                    regex: "\\+\\.|\\-\\.|\\*\\.|\\/\\.|#|;;|\\+|\\-|\\*|\\*\\*\\/|\\/\\/|%|<<|>>|&|\\||\\^|~|<|>|<=|=>|==|!=|<>|<-|="
                },
                {
                    token: "paren.lparen",
                    regex: "[[({]"
                },
                {
                    token: "paren.rparen",
                    regex: "[\\])}]"
                },
                {
                    token: "text",
                    regex: "\\s+"
                }
            ],
            "comment": [
                {
                    token: "comment", // closing comment
                    regex: ".*?\\*\\)",
                    next: "start"
                },
                {
                    token: "comment", // comment spanning whole line
                    regex: ".+"
                }
            ],

            "qstring": [
                {
                    token: "string",
                    regex: '"',
                    next: "start"
                }, {
                    token: "string",
                    regex: '.+'
                }
            ]
        };
    };

    oop.inherits(FSharpHighlightRules, TextHighlightRules);

    exports.FSharpHighlightRules = FSharpHighlightRules;
});

define('ace/mode/fsharp', function (require, exports, module)
{
    "use strict";

    var oop = require("../lib/oop");
    var TextMode = require("./text").Mode;
    var Tokenizer = require("../tokenizer").Tokenizer;
    var FSharpHighlightRules = require("./fsharp_highlight_rules").FSharpHighlightRules;
    var Range = require("../range").Range;

    var Mode = function ()
    {
        this.HighlightRules = FSharpHighlightRules;
    };
    oop.inherits(Mode, TextMode);

    var indenter = /(?:[({[=:]|[-=]>|\b(?:else|try|with))\s*$/;

    (function ()
    {

        this.toggleCommentLines = function (state, doc, startRow, endRow)
        {
            var i, line;
            var outdent = true;
            var re = /^\s*\(\*(.*)\*\)/;

            for (i = startRow; i <= endRow; i++)
            {
                if (!re.test(doc.getLine(i)))
                {
                    outdent = false;
                    break;
                }
            }

            var range = new Range(0, 0, 0, 0);
            for (i = startRow; i <= endRow; i++)
            {
                line = doc.getLine(i);
                range.start.row = i;
                range.end.row = i;
                range.end.column = line.length;

                doc.replace(range, outdent ? line.match(re)[1] : "(*" + line + "*)");
            }
        };

        this.getNextLineIndent = function (state, line, tab)
        {
            var indent = this.$getIndent(line);
            var tokens = this.getTokenizer().getLineTokens(line, state).tokens;

            if (!(tokens.length && tokens[tokens.length - 1].type === 'comment') &&
                state === 'start' && indenter.test(line))
                indent += tab;
            return indent;
        };

        this.$id = "ace/mode/fsharp";
    }).call(Mode.prototype);

    exports.Mode = Mode;
});