
'use strict';

function populateExamples() {
	let appVersion = navigator.appVersion;

	let eg;

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
			`bash -c '"$HOME/bin/tkdiff" $1 $2'`
		];
	}

	examples.innerHTML = '<li>' + eg.join('<li>');
}


// Read from localStorage.
function restoreOptions() {
	window.cmd.value = localStorage.cmd || '';
}


function saveOptions() {
	localStorage.cmd = window.cmd.value;

	// Show feedback.
	saved.className = 'show';
	setTimeout(() => { saved.className = '' }, 1200);

	// If there is a queued request, use that.
	chrome.runtime.sendMessage({use_last: true});
}


// Test run.
function testConfig() {
	// Ignore if no command is configured yet.
	if (window.cmd.value.replace(/\s+/g, '').length === 0) return;


	// Generate a timestamp to make each test file unique.
	function pad2(s) {
		s = s.toString();
		while (s.length < 2) { s = '0' + s }
		return s;
	}

	let now = new Date();
	let timestamp = pad2(now.getHours()) + pad2(now.getMinutes()) + pad2(now.getSeconds());

	let content =
`Lorem ipsum dolor sit amet,
consectetur adipisicing elit,
sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
(This line will be modified.)
Ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
(This line will be removed.)
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
Excepteur sint occaecat cupidatat non proident,
sunt in culpa qui officia deserunt mollit anim id est laborum.
`;

	chrome.extension.sendMessage(
		{
			left: {
				name: 'Left test file ' + timestamp + '.txt',
				text: content
			},
			right: {
				name: 'Right test file ' + timestamp + '.txt',
				text: content
					.replace(/\(This line will be modified\.\)\n/, '(This line was indeed modified.)\n')
					.replace(/\(This line will be removed\.\)\n/, '') +
					'(This line was added.)\n'
			}
		},
		diffResponseHandler
	);
}


function diffResponseHandler(response) {
	if (response) {
		alert(
			'DropboxDiff failed with\n\n' +
			response + '\n\n' +
			'The javascript console of DropboxDiff\'s "background.html" page may have more information.'
		);
	}
}


function init() {
	populateExamples();
	restoreOptions();

	// Set up change handler.
	let inputs = [ window.cmd ];

	for (let i in inputs) { inputs[i].onchange = saveOptions }

	// Test button.
	document.getElementById('config-test').onclick = testConfig;
}


window.onload = init;

