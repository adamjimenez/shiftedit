({
    mainConfigFile: '../app/app.js',
	baseUrl: "../",
	name: 'app/app',
    out: "../../build/shiftedit.js",
    //optimize: 'uglify2',
    optimize: 'none',
    wrapShim: 'true',
    excludeShallow: [
        "emmet",
        "diff",
        "markdown-it",
        "lzma",
        "diff2html",
        "diff2html-ui",
        "uglify-js/lib/utils",
        "uglify-js/lib/ast",
        "uglify-js/lib/parse",
        "uglify-js/lib/transform",
        "uglify-js/lib/scope",
        "uglify-js/lib/output",
        "uglify-js/lib/compress",
    ]
})