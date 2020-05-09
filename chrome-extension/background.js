
'use strict';


// Must match nativeMessagingHostName in bitbucket.org/vshih/clouddiff-helper/internal/install/install.go.
const NATIVE_MESSAGING_HOST_NAME = 'com.vicshih.clouddiff.helper';

// Remember last request if configuration is still needed.
let LAST_REQUEST;

let HANDLER = {
	diff(message, send_response) {
		// Special handling if resuming a previous request.
		const resume = message.resume;

		if (resume) {
			if (LAST_REQUEST) {
				message = LAST_REQUEST.message;
				send_response = LAST_REQUEST.send_response;
				LAST_REQUEST = null;
			} else {
				// Nothing to retry.
				send_response('OK');
				return;
			}
		}

		const cmd = localStorage.cmd;

		if (cmd || message.sender == 'options') {
			// Clear state in most cases.
			LAST_REQUEST = null;
		} else {
			// Save the current message and trigger the Options page.
			LAST_REQUEST = {message, send_response};
			chrome.tabs.create({url: 'options.html'});
			return true;
		}

		chrome.runtime.sendNativeMessage(
			NATIVE_MESSAGING_HOST_NAME,
			{
				cmd,
				left: message.left,
				right: message.right
			},
			(response) => {
				if (response) {
					console.log(response);

					if (response.ExitStatus == 0) {
						// Success.
						send_response('OK');
					}
					else {
						if (localStorage.ignoreExit) {
							console.log("Non-zero exit status ignored.");
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

		// Response is fired upon completion of sendNativeMessage; return `true` to signal asynchronous response.
		return true;
	}
};


function init() {
	// Set up message listener.
	chrome.runtime.onMessage.addListener((message, sender, send_response) => {
		HANDLER[message.type].call(HANDLER, message, send_response);
	});
}


init();

