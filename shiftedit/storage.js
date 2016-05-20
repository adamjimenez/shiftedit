define(function (require) {
	return {
		set: function(key, val){
			return localStorage[key] = JSON.stringify(val);
		},
		get: function(key){
			if(localStorage[key]) {
				try{
					return JSON.parse(localStorage[key]);
				} catch(e) {
					return localStorage[key];
				}
			}
		}
	};
});