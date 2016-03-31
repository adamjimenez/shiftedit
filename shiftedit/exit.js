define(['app/lang', 'app/prefs'], function (lang, preferences) {
lang = lang.lang;

window.onbeforeunload = function () {
	var prefs = preferences.get_prefs();

	if ($('li[data-edited=1]').length) {
		return lang.unsavedChangesText;
	} else if (prefs.promptOnExit == 'always') {
		return 'Exit?';
	} else {
		return;
	}
};

window.onunload = function () {
	//clear hash so tabs can be restored
	location.hash = '';
	location.reload();
};

    return {
    };
});