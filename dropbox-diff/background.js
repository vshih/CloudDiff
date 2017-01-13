
'use strict';

// Remember last request if configuration is still needed.
let LAST_REQUEST;


function init() {
	// Set up request listener.
	chrome.runtime.onMessage.addListener((request, sender, send_response) => {
		let cmd = localStorage.cmd;

		if (!cmd) {
			// Trigger the options page.
			LAST_REQUEST = {
				request: request,
				send_response: send_response
			};
			chrome.tabs.create({url: 'options.html'});
			return send_response('');
		}

		if (request.use_last && LAST_REQUEST) {
			request				= LAST_REQUEST.request;
			send_response	= LAST_REQUEST.send_response;

			LAST_REQUEST = null;
		}

		chrome.runtime.sendNativeMessage(
			'com.vicshih.dropboxdiff',
			{
				cmd: cmd,
				left: request.left,
				right: request.right
			},
			(response) => {
				console.log(response ? response : chrome.runtime.lastError);
				send_response('');
			}
		);

		// We must return true in order to send a response after the listener returns.
		return true;
	});
}

init();

