define(["./editors"], function (editors) {

if (window.addEventListener) { //not supported by IE
	window.addEventListener("dragenter", function () {
		document.body.setAttribute("dragenter", true);
	}, false);
	window.addEventListener("dragleave", function () {
		document.body.removeAttribute("dragenter");
	}, false);
	window.addEventListener("dragover", function (e) {
		e.preventDefault();
	}, false);
	window.addEventListener("drop", function (e) {
		console.log(e);
		var dt = e.dataTransfer;
		var files = dt.files;
		e.preventDefault();
		if (files.length === 0) {
			//handleData(dt);
			return;
		}
		var reader = {};
		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			var imageType = /image.*/;
			var videoType = /video.*/;
			var audioType = /audio/;
			var textType = /text.*/;

			/*
			var file_extension = file_ext(basename(file.name));
			if (file_extension, file_extensions.indexOf(file_extension) == -1) {
				continue;
			}
			*/

			reader[i] = new FileReader();
			reader[i].onloadend = function (file, i) {
				return function () {
					editors.create(file.name, reader[i].result);
				};
			}(file, i);
			reader[i].readAsText(file);
		}
	}, false);
}

return {
};

});