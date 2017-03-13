
'use strict';


function createExDiffResponseHandler(ex_data, tries, callback) {
	let handler = (response) => {
		switch (response) {
		case '':
			// Success.
			break;

		case null:
		case undefined:
			// Probably the event page was inactive; try again after a short delay.  Note that this is a workaround for
			// what seems like a Chrome bug.
			--tries;
			if (tries > 0) {
				window.setTimeout(() => { chrome.runtime.sendMessage(ex_data, handler) }, 500);
				break;
			}
			// else fall through.

		default:
			// Maybe a plugin failure; display it.
			if (typeof response == 'object') {
				response = JSON.stringify(response);
			}

			let context_message = document.location.protocol != 'chrome-extension:' ? 'See the DropboxDiff Options page for instructions on how to install the DropboxDiff Helper.' : '';

			$.alertable.alert(`
				<p>
					DropboxDiff failed with the message:
				</p>

				<blockquote>
					${response}
				</blockquote>

				<p>
					${context_message}
				</p>
				<p>
					The JavaScript console of DropboxDiff's background page may have more information.
				</p>
				`,
				{html: true}
			);
			break;
		}

		if (callback) {
			callback();
		}
	};

	return handler;
}
