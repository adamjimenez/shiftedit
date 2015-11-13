define(['jquery'], function () {

var timer;

function doResize() {
    console.log('resize');
    //active file tabs
    $('.ui-tabs-active[data-file]').each(function() {
        window.splits[$(this).attr('id')].resize(true);
    });
}

function resize() {
    clearTimeout(timer);
    timer = setTimeout(doResize, 250);
}

function init() {
    $(window).on('resize activate', resize);
    $('.ui-layout-pane').on('layoutpaneonresize', resize);
}

return {
    init: init,
    resize: resize
};

});