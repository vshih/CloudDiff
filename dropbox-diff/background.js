
'use strict';

// Must match nativeMessagingHostName in bitbucket.org/vshih/dropboxdiff-helper/internal/install/install.go.
const NATIVE_MESSAGING_HOST_NAME = 'com.vicshih.dropboxdiff.helper';

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
			NATIVE_MESSAGING_HOST_NAME,
			{
				cmd: cmd,
				left: request.left,
				right: request.right
			},
			(response) => {
				if (response) {
					console.log(response);

					if (response.ExitStatus == 0) {
						// Success.
						send_response('');
					}
					else {
						if (localStorage.ignoreExit) {
							console.log("Non-zero exit status ignored.");
							send_response('');
						}
						else {
							send_response(response.Output);
						}
					}
				}
				else {
					console.log(chrome.runtime.lastError);
					send_response(chrome.runtime.lastError.message);
				}
			}
		);

		// We must return true in order to send a response after the listener returns.
		return true;
	});
}

init();

