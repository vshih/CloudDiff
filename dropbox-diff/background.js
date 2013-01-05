
function init() {
	diff_plugin.debug = 1;

	// Set up request listener
	chrome.extension.onMessage.addListener(function (request, sender, send_response) {
		var cmd = localStorage.cmd;

		if (!cmd) {
			// Serialize request and pass on to the options page
			chrome.tabs.create({ url: 'options.html#' + JSON.stringify(request) });
			return send_response('');
		}


		if (request.test) {
			// Test run.  Generate a timestamp to make each test file unique
			function pad2(s) {
				s = s.toString();
				while (s.length < 2) { s = '0' + s }
				return s;
			}

			var now = new Date();
			var timestamp = pad2(now.getHours()) + pad2(now.getMinutes()) + pad2(now.getSeconds());

			var content =
				'Lorem ipsum dolor sit amet,\n' +
				'consectetur adipisicing elit,\n' +
				'sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n' +
				'(This line will be modified.)\n' +
				'Ut enim ad minim veniam,\n' +
				'quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n' +
				'(This line will be removed.)\n' +
				'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.\n' +
				'Excepteur sint occaecat cupidatat non proident,\n' +
				'sunt in culpa qui officia deserunt mollit anim id est laborum.\n';

			recv({
					left: {
						name: 'Left test file ' + timestamp + '.txt',
						text: content
					},
					right: {
						name: 'Right test file ' + timestamp + '.txt',
						text: content.
							replace(/\(This line will be modified\.\)\n/, '(This line was indeed modified.)\n').
							replace(/\(This line will be removed\.\)\n/, '') +
							'(This line was added.)\n'
					}
				},
				send_response
			);
		}
		else {
			if (!request.left || !request.right) { return }

			// Allocate a place to collect file contents
			var data = {
				left: {
					name: compute_file_name(request.left.url, request.left.changed)
				},
				right: {
					name: compute_file_name(request.right.url, request.right.changed)
				}
			};

			$.get(request.left.url, function(text) { data.left.text = text; recv(data, send_response) });
			$.get(request.right.url, function(text) { data.right.text = text; recv(data, send_response) });
		}

		// We must return true in order to send a response after the listener returns
		return true;
	});
}


function recv(data, send_response) {
	if (!('text' in data.left && 'text' in data.right)) { return }

	// Got both, kick it off!
	send_response(
		diff_plugin.diff(
			localStorage.cmd,
			data.left.name,
			data.left.text,
			data.right.name,
			data.right.text
		)
	);
}


function sanitize_dropbox_date(d) {
	return d.replace(/[\/:]/g, '.').replace(/ ([AP]M)/, '$1').replace(/^\s+|\s+$/g, '').replace(/\s+\(.+\)/, '').toLowerCase();
}


function compute_file_name(url, changed) {
	// Extract filename and revision ("sjid" parameter)
	var rev = url.substr(url.lastIndexOf('=') + 1);

	var basename = url.substr(url.lastIndexOf('/') + 1);
	basename = decodeURIComponent(basename.substr(0, basename.indexOf('?')));

	var dot = basename.lastIndexOf('.');
	var ext = dot == -1 ? '' : basename.substr(dot);
	var base = basename.substr(0, basename.length - ext.length);

	// Append revision to ensure uniqueness
	// Keep extension, in case diff tool can use it
	return sanitize_dropbox_date(changed) + ' ' + base + ' ' + rev + ext;
}

