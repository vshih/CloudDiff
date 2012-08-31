function init() {
	//diff_plugin.debug = 1;

	// Set up request listener
	chrome.extension.onMessage.addListener(function(request, sender, send_response) {
		var cmd = localStorage.cmd;

		if (!cmd) {
			chrome.tabs.create({ url: 'options.html' });
			return send_response('');
		}

		if (!request.left || !request.right) { return }

		// Place to collect file contents
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

		// Must return true in order to send a response after the listener returns
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

function sanitize_date(d) {
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
	return sanitize_date(changed) + ' ' + base + ' ' + rev + ext;
}
