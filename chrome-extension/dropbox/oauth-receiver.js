
'strict';


window.addEventListener('load', () => {
	const params = new URLSearchParams(location.hash.substr(1)),
		access_token = params.get('access_token'),
		state = params.get('state'),
		message = {
			accessToken: access_token
		};

	if (state) {
		message.context = {
			value: JSON.parse(state),
			forceChange: new Date(),
		}
	}

	chrome.storage.sync.set(message, () => { window.close() });
});

