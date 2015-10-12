define(function (require) {

return {
    makeMenuText: function(text, key) {
		if( !key ){
			key ='';
		}

		return '<div style="display:inline-block; width:160px;">' + text + '</div><div style="display:inline-block; color: gray;">' + key + '</div>';
	},
	fileExtension: function(filename)
    {
    	if( filename.length == 0 ) return "";
    	var dot = filename.lastIndexOf(".");
    	if( dot == -1 ) return "";
    	var extension = filename.substr(dot+1, filename.length);
    	return extension;
    }
};

});