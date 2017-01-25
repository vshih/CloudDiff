
// This script is needed because:
// 1. The download-URLs of versions loaded upon clicking "Load older versions" are only available
//    (as far as I can tell, anyway) via AJAX response.
// 2. Hooking into AJAX responses requires being in the page context.

'use strict';


// Closure to isolate variable scope.
// For sure DOM is ready and React has loaded at this point,
// but since jQuery is loaded async, it's not guaranteed to be available.
(() => {


const FILE_REV_RE = /^\/file_revisions\?/;


function onLoadOlderVersions(url, responseText) {
	if (FILE_REV_RE.test(url)) {
		let revisions;

		try {
			revisions = JSON.parse(responseText).revisions;
		}
		catch (e) {
			// Quit.
			return;
		}

		document.dispatchEvent(new CustomEvent('com.vicshih.dropboxdiff.new-revisions-json', {detail: revisions}));
	}
}


// Listen on AJAX responses in order to handle "Load older versions".
// From http://stackoverflow.com/questions/13765031/scrape-eavesdrop-ajax-data-using-javascript/13768794#13768794
function addAjaxSuccessListener(listener) {
	let XHR = XMLHttpRequest.prototype;
	// Remember references to original methods.
	let open = XHR.open;
	let send = XHR.send;

	// Overwrite original methods; collect data.
	XHR.open = function (method, url) {
		this._url = url;

		// Pass through to original method.
		return open.apply(this, arguments);
	};

	// Implement "ajaxSuccess" functionality.
	XHR.send = function (post_data) {
		this.addEventListener('load', function () {
			if (this.status == 200) {
				listener(this._url, this.responseText);
			} // Fail silently.
		});

		// Pass through to original method.
		return send.apply(this, arguments);
	};
}


// ===== Main.


addAjaxSuccessListener(onLoadOlderVersions);


})();

