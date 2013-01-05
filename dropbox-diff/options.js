
function populate_examples() {
	var appVersion = navigator.appVersion;

	var eg;

	if (appVersion.indexOf('Mac') != -1) {
		eg = [
			'opendiff',
			'/usr/local/bin/mvim -d'
		];
	}
	else if (appVersion.indexOf('Linux') != -1) {
		eg = [
			'gvim -d',
			'kdiff3'
		];
	}
	else {
		eg = [
			'"C:\\Program Files\\TortoiseSVN\\bin\\TortoiseMerge.exe"',
			'"C:\\Program Files (x86)\\KDiff3\\kdiff3.exe"',
			'bash -c \'"$HOME/bin/tkdiff" $1 $2\''
		];
	}

	examples.innerHTML = '<li>' + eg.join('<li>');
}


// Read from localStorage
function restore_options() {
	cmd.value = localStorage.cmd || '';
}


function save_options() {
	localStorage.cmd = cmd.value;

	// Show feedback
	saved.className = 'show';
	setTimeout(function () { saved.className = '' }, 1200);

	// If query string contains a queued request, dispatch it
	if (location.hash) {
		var request = JSON.parse(location.hash.substr(1));
		location.hash = '';

		chrome.extension.sendMessage(request, diff_response_handler);
	}
}


function test_config() {
	// Ignore if no command is configured yet
	if (document.getElementById('cmd').value.replace(/\s+/g, '').length === 0) return;

	chrome.extension.sendMessage({test: true}, diff_response_handler);
}


function diff_response_handler(response) {
	if (response) {
		alert(
			'DropboxDiff failed with\n\n' +
			response + '\n\n' +
			'The javascript console of DropboxDiff\'s "background.html" page may have more information.'
		);
	}
}


function init() {
	populate_examples();
	restore_options();

	// Set up change handler
	var inputs = [ cmd ];

	for (var i in inputs) { inputs[i].onchange = save_options }

	// Test button
	document.getElementById('config-test').onclick = test_config;
}


window.onload = init;

