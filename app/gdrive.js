define(['./util'], function (util) {

var client_id = '471018772965.apps.googleusercontent.com';

var boundary = '-------314159265358979323846';
var delimiter = "\r\n--" + boundary + "\r\n";
var close_delim = "\r\n--" + boundary + "--";

var fullAccess = true;

function authorise(fn) {
	var SCOPES;
	if(fullAccess){
		SCOPES = 'https://www.googleapis.com/auth/drive';
	} else {
		SCOPES = 'https://www.googleapis.com/auth/drive.file';
	}
	
	var callback = function() {
		console.log('connected to gdrive');
		fn();
	};

	gapi.auth.authorize(
		{'client_id': client_id, 'scope': SCOPES, 'immediate': true},
		function handleAuthResult(authResult) {
			if (authResult && !authResult.error) {
				// Access token has been successfully retrieved, requests can be sent to the API.
				access_token = authResult.access_token;

				gapi.client.load('drive', 'v2', callback);
			} else {
				// No access token could be retrieved, show the button to start the authorization flow.
				console.log('no auth token');

				gapi.auth.authorize(
					{
						'client_id': client_id,
						'scope': SCOPES,
						'immediate': false
					},
					callback
				);
			}
		}
	);
}

function directFn(options) {
	var request;
	var callback;
	var metadata;
	var file;
	var mimeType;
	var base64Data;
	var multipartRequestBody;
	var parent;

	switch (options.cmd) {
		case 'file_exists':
			parent = (options.parent!='#') ? options.parent : 'root';

			request = gapi.client.drive.children.list({
				'folderId': parent,
				'q': "title = '" + options.title + "'"
			});

			request.execute(function(resp) {
				//console.log(resp);

				options.callback({
					success: true,
					file_exists: (resp.items > 0)
				});
			});
		break;

		case 'save':
			//get mime type
			mimeType = util.getMimetype(options.title);
			metadata = {
				'mimeType': mimeType
			};
			var url = 'https://www.googleapis.com/upload/drive/v2/files';
			var method = 'POST';

			if(!options.parent){
				url += '/'+options.file+'?uploadType=multipart';
				method = 'PUT';
			}else{
				metadata.title = options.title;
				parent = (options.parent!='#') ? options.parent : 'root';
				metadata.parents = [{id: parent}];
			}

			// Updating the metadata is optional and you can instead use the value from drive.files.get.
			//var base64Data = btoa(options.content);

			base64Data = util.base64EncArr(util.strToUTF8Arr(options.content));

			multipartRequestBody =
				delimiter +
				'Content-Type: application/json\r\n\r\n' +
				JSON.stringify(metadata) +
				delimiter +
				'Content-Type: ' + mimeType + '\r\n' +
				'Content-Transfer-Encoding: base64\r\n' +
				'\r\n' +
				base64Data +
				close_delim;

			$.ajax({
				url: url,
				params: {'uploadType': 'multipart', 'alt': 'json'},
				method: method,
				headers: {
					"Content-Type": 'multipart/mixed; boundary="' + boundary + '"',
					authorization: 'Bearer '+access_token
				},
				data: multipartRequestBody,
				processData: false,
				success: function (response, request) {
					console.log(response);

					var result = {success: true, file: response.id};
					options.callback(result);
				}
			});
		break;

		case 'open':
			console.log('opening: '+options.file);

			if(!access_token){
				authorise(function(){
					directFn(options);
				});
				return;
			}

			$.ajax({
				url: 'https://content.googleapis.com/drive/v2/files/' + options.file,
				method: 'GET',
				dataType: 'json',
				headers: {
					authorization: 'Bearer '+access_token
				},
				success: function (result) {
					var response = {success: false};

					if (result.downloadUrl) {
						var accessToken = gapi.auth.getToken().access_token;
						var xhr = new XMLHttpRequest();
						xhr.open('GET', result.downloadUrl);
						xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);

						xhr.onload = function() {
							var link = '';
							if (result.webContentLink) {
								link = result.webContentLink.replace('&export=download', '');
							}

							response = {
								success: true,
								content: xhr.responseText,
								file: result.id,
								title: result.title,
								link: link
							};

							console.log(result);
							console.log(response);
							options.callback(response);
						};
						xhr.onerror = function() {
							options.callback(response);
						};
						xhr.send();
					} else {
						options.callback(response);
					}
				}
			});

		break;
		case 'newfile':
			//console.log(options);

			title = options.title;
			mimeType = util.getMimetype(title);
			parent = (options.parent!='#') ? options.parent : 'root';

			metadata = {
				'title': title,
				'mimeType': mimeType,
				'parents': [{id: parent}]
			};

			base64Data = btoa('');
			multipartRequestBody =
			delimiter +
			'Content-Type: application/json\r\n\r\n' +
			JSON.stringify(metadata) +
			delimiter +
			'Content-Type: ' + mimeType + '\r\n' +
			'Content-Transfer-Encoding: base64\r\n' +
			'\r\n' +
			base64Data +
			close_delim;

			request = gapi.client.request({
			'path': '/upload/drive/v2/files',
			'method': 'POST',
			'params': {'uploadType': 'multipart'},
			'headers': {
			'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
			},
			'body': multipartRequestBody});

			callback = function(file) {
				console.log(file);

				if(options.callback)
					options.callback({
						success: true,
						file: file.id
					});
			};

			request.execute(callback);
		break;
		case 'delete':
			request = gapi.client.drive.files.delete({
				'fileId': options.file
			});
			request.execute(function(resp) {
				if (options.callback)
					options.callback({success:true});
			});
		break;
		case 'newdir':
			console.log(options.params);
			metadata = {
				'title': options.dir,
				'mimeType': 'application/vnd.google-apps.folder',
				'parents': [{id: options.parent}]
			};

			callback = function(file) {
				console.log(file);

				if (options.callback)
					options.callback({
						success: true,
						file: file.id
					});
			};

			gapi.client.drive.files.insert({'resource': metadata}).execute(callback);
		break;
		case 'rename':
			console.log(options);

			metadata = {
				'title': options.newname
			};

			if(options.parent){
				metadata.parents = [{id: options.parent}];
			}

			callback = function(file) {
				console.log(file);

				var o = {
					responseText: JSON.stringify({
						success: true,
						error: null
					})
				};

				if(options.callback)
					options.callback.call(tree, options, true, o);
			};

			request = gapi.client.request({
				'path': '/drive/v2/files/' + options.file,
				'method': 'PUT',
				'body': metadata
				});

			request.execute(function(resp){
				console.log(resp);

				var result;

				if(resp){
					result = {success: true};
				}else{
					result = {success: false, error: 'Rename failed'};
				}

				callback(result);
			});

			//gapi.client.drive.files.update({'resource': metadata}).execute(callback);

			return;
		case 'chmod':
			return false;
		case 'upload':
			//console.log(options);

			file = options.file;
			mimeType = util.getMimetype(file);

			metadata = {
				'title': file,
				'mimeType': mimeType,
				'parents': [{id: options.parent}]
			};

			base64Data = options.content;

			if( base64Data.substr(0, 5) == 'data:' ){
				var pos = base64Data.indexOf('base64');

				if( pos!==-1 ){
					base64Data = base64Data.substr(pos+7);
				}
			}

			multipartRequestBody =
			delimiter +
			'Content-Type: application/json\r\n\r\n' +
			JSON.stringify(metadata) +
			delimiter +
			'Content-Type: ' + mimeType + '\r\n' +
			'Content-Transfer-Encoding: base64\r\n' +
			'\r\n' +
			base64Data +
			close_delim;

			request = gapi.client.request({
			'path': '/upload/drive/v2/files',
			'method': 'POST',
			'params': {'uploadType': 'multipart'},
			'headers': {
			'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
			},
			'body': multipartRequestBody});

			callback = function(file) {
				console.log(file);

				var o = {
					responseText: JSON.stringify({
						success: true,
						error: null,
						file_id: file.id
					})
				};
				options.success.call(tree, options, true, o);
			};

			request.execute(callback);
		break;
		case 'download':
			console.log(options.params);

			callback = function(result){
				var o = {
					responseText: JSON.stringify({
						success: result.success,
						error: result.error
					})
				};

				if (options.callback)
					options.callback.call(tree, result.content, options, true, o);
			};

			open(options.file_id, callback);
		break;
		default:
			//console.error('unknown command: '+options.cmd);
			treeFn(options);
		break;
	}
}

function treeFn(options) {
	//remove root from path
	var dirPath = options.node.id;
	var path = dirPath;

	if(path==='#') {
		path = options.tree.data('dir_id') ? options.tree.data('dir_id') : 'root';
		text = options.tree.data('dir') ? options.tree.data('dir') : ' ';

		return options.callback.call(options.tree, {
			children: true,
			id: path,
			text: text,
			type: 'folder'
		});
	}

	var entries = [];
	var retrievePageOfFiles = function(request, result) {
		request.execute(function(resp) {
			entries = entries.concat(resp.items);
			var nextPageToken = resp.nextPageToken;

			if (nextPageToken) {
				request = gapi.client.drive.files.list({'pageToken': nextPageToken});
				retrievePageOfFiles(request, result);
			} else {
				var nodes = [];

				entries.forEach(function (entry, i) {
					if( !entry.title ){
						return;
					}

					var path = entry.title;

					if( dirPath ){
						path = dirPath+'/'+path;
					}

					//remove site id from start

					/*
					path = path.substr(1);
					var pos = path.indexOf('/');
					path = 'root'+path.substr(pos);*/

					//console.log(path);

					var date = new Date(entry.modifiedDate);
					var ext = util.fileExtension(entry.title);
					var isFolder = (entry.mimeType=='application/vnd.google-apps.folder');

					var link = '';
					if (entry.webContentLink) {
						link = entry.webContentLink.replace('&export=download', '');
					}

					var icon = isFolder ? '' : 'file file-'+ext;

					nodes.push({
						id: entry.id,
						text: entry.title,
						type: (isFolder) ? 'folder' : 'file',
						children: isFolder,
						disabled: false,
						icon: icon,
						data: {
							modified: date.getTime()/1000,
							size: entry.fileSize,
							link: link
						}
					});
				});

				//console.log(nodes);
/*
				nodes.sort(function(a, b){
					a = a.text.toLowerCase();
					b = b.text.toLowerCase();
					if(a < b) {
						return -1;
					} else if (a > b) {
						return 1;
					}
					return 0;
				});
*/
				options.callback.call(options.tree, nodes);
			}
		});
	};
	var initialRequest = gapi.client.drive.files.list({'q': "'"+path+"' in parents AND trashed = false", 'maxResults': 1000});
	retrievePageOfFiles(initialRequest, []);
}

function get_public(parentId) {

}

function set_public(parentId, setPublic, callback) {
	var body = {
		'value': 'anyone',
		'type': 'anyone',
		'role': 'reader'
	};
	var request = gapi.client.drive.permissions.insert({
		'fileId': parentId,
		'resource': body
	});
	request.execute(function(resp) {
		if(callback){
			callback();
		}
	});
}

treeFn.directCfg = {
	method: {
		getArgs: function(params, order, hash){
			return [params.path];
		}
	}
};

	return {
		directFn: directFn,
		authorise: authorise,
		setFullAccess: function(val) {
			fullAccess = val;
		}
	};
});