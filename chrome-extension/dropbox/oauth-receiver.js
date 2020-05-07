
'strict';

window.addEventListener('load', () => {
	let params = new URLSearchParams(window.location.hash.substr(1));
	let access_token = params.get('access_token');
	chrome.storage.sync.set({accessToken: access_token}, function () {
		window.close();
	});
});

