
'use strict';


const FLASH_TIMEOUT = 1800;


function setPlatform() {
	document.body.className += ' ' + navigator.platform.replace(/ /g, '_');
}


function populateExamples() {
	let appVersion = navigator.appVersion;

	let eg;

	if (appVersion.indexOf('Mac') != -1) {
		eg = [
			`opendiff`,
			`/Applications/p4merge.app/Contents/Resources/launchp4merge`,
			`/usr/local/bin/mvim -d`,
		];
	}
	else if (appVersion.indexOf('Linux') != -1) {
		eg = [
			`gvim -d`,
			`kdiff3`,
		];
	}
	else {
		eg = [
			`"C:\\Program Files (x86)\\KDiff3\\kdiff3.exe"`,
			`"C:\\Program Files\\Devart\\Code Compare\\CodeCompare.exe" /W`,
			`"C:\\Program Files\\TortoiseSVN\\bin\\TortoiseMerge.exe"`,
			`bash -c '"$HOME/bin/tkdiff" $1 $2'`,
		];
	}

	examples.innerHTML = eg.map(e => `<li><code>${e}</code>`).join('');
}


// Read from localStorage.
function restoreOptions() {
	window.cmd.value = localStorage.cmd || '';
	window['ignore-exit'].checked = localStorage.ignoreExit;
}


function saveOptions() {
	localStorage.cmd = window.cmd.value;
	localStorage.ignoreExit = window['ignore-exit'].checked ? 'on' : '';

	// Show feedback.
	window.saved.className = 'show';
	setTimeout(() => { window.saved.className = '' }, FLASH_TIMEOUT);

	// If there is a queued request, use that.
	chrome.runtime.sendMessage({use_last: true});
}


// For code blocks, select all block text on click.
function selectCodeBlockOnClick(event) {
	let target = event.target;
	if (target.tagName == 'CODE') {
		let selection = window.getSelection();
		if (selection.rangeCount > 0) { selection.removeAllRanges(); }

		let range = document.createRange();
		range.selectNode(target);
		selection.addRange(range);
	}
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

	let content_left =
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
	let content_right = content_left
		.replace(/\(This line will be modified\.\)\n/, '(This line was indeed modified.)\n')
		.replace(/\(This line will be removed\.\)\n/, '') +
		'(This line was added.)\n';

	let ex_data = {
		left: {
			name: `Left test file ${timestamp}.txt`,
			text: content_left
		},
		right: {
			name: `Right test file ${timestamp}.txt`,
			text: content_right
		}
	};
	let tries = 1;

	chrome.extension.sendMessage(
		ex_data,
		createExDiffResponseHandler(ex_data, tries)
	);
}


function registerListeners() {
	document.body.addEventListener('click', selectCodeBlockOnClick);

	// Set up change handlers.
	window.cmd.onchange = window['ignore-exit'].onchange = saveOptions;

	// Test button.
	document.getElementById('config-test').onclick = testConfig;
}


function init() {
	setPlatform();
	populateExamples();
	restoreOptions();
	registerListeners();
}


window.onload = init;

