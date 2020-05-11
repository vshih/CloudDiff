
'strict';

window.addEventListener('load', () => {
	const params = new URLSearchParams(location.hash.substr(1));
	const access_token = params.get('access_token');
	chrome.storage.sync.set({accessToken: access_token}, function () {
		window.close();
	});
});

