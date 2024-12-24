
'use strict';


// Must match nativeMessagingHostName in bitbucket.org/vshih/clouddiff-helper/internal/install/install.go.
const NATIVE_MESSAGING_HOST_NAME = 'com.vicshih.clouddiff.helper';

const HANDLER = {
	diff(options, message, send_response) {
		const { cmd, ignoreExit } = options;

		if (!cmd && message.sender != 'options') {
			// Trigger the Options page.
			chrome.tabs.create({url: 'options.html'});
			return send_response('OK');
		}

		chrome.runtime.sendNativeMessage(
			NATIVE_MESSAGING_HOST_NAME,
			{
				cmd,
				left: message.left,
				right: message.right
			},
			response => {
				if (response) {
					console.log(response);

					if (response.ExitStatus == 0) {
						// Success.
						send_response('OK');
					}
					else {
						if (ignoreExit) {
							console.log(`Non-zero (${response.ExitStatus}) exit status; ignored.`);
							send_response('OK');
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
	}
};


function init() {
	// Set up message listener.
	chrome.runtime.onMessage.addListener((message, sender, send_response) => {
		chrome.storage.local.get(['cmd', 'ignoreExit']).then(options => {
			return HANDLER[message.type](options, message, send_response);
		});

		// Indicate asynchronous response.
		return true;
	});
}


init();

