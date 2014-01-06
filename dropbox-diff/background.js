
// Remember last request if configuration is still needed.
var LAST_REQUEST;

function init() {
	diff_plugin.debug = 1;

	// Set up request listener.
	chrome.runtime.onMessage.addListener(function (request, sender, send_response) {
		var cmd = localStorage.cmd;

		if (!cmd) {
			// Trigger the options page.
			LAST_REQUEST = {request: request, send_response: send_response};
			chrome.tabs.create({url: 'options.html'});
			return send_response('');
		}

		if (request.use_last && LAST_REQUEST) {
			request				= LAST_REQUEST.request;
			send_response = LAST_REQUEST.send_response;
			LAST_REQUEST = null;
		}

		send_response(
			diff_plugin.diff(
				localStorage.cmd,
				request.left.name,
				request.left.text,
				request.right.name,
				request.right.text
			)
		);

		// We must return true in order to send a response after the listener returns.
		return true;
	});
}

