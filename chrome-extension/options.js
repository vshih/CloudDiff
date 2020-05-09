
'use strict';


const FLASH_TIMEOUT = 1800;


function populateExamples() {
	let appVersion = navigator.appVersion;

	let eg;

	if (appVersion.indexOf('Mac') != -1) {
		eg = [
			`opendiff`,
			`/Applications/p4merge.app/Contents/Resources/launchp4merge`,
			`/usr/local/bin/mvim -d`,
			`open https://diffy.org$(git diff $1 $2 | curl -is https://diffy.org/new -F 'udiff=<-' | awk -F' to ' '/^Found/ {col = 2; print $col}')`,
			`git diff $1 $2 | /usr/local/bin/node /usr/local/bin/diff2html -i stdin`,
		];
	}
	else if (appVersion.indexOf('Linux') != -1) {
		eg = [
			`gvim -d`,
			`kdiff3`,
		];
	}
	else {
		// Windows.
		eg = [
			`"C:\\Program Files\\kdiff3\\kdiff3.exe"`,
			`"C:\\Program Files\\Devart\\Code Compare\\CodeCompare.exe" /W`,
			`"C:\\Program Files\\TortoiseSVN\\bin\\TortoiseMerge.exe"`,
			`bash -c '"$HOME/bin/tkdiff" $1 $2'`,
			`git diff $1 $2 | diff2html -i stdin`,
		];
	}

	examples.innerHTML = eg.map(e => `<li><code>${e}</code>`).join('');
}


// Read from localStorage.
function restoreOptions() {
	$('#cmd').val(localStorage.cmd || '');
	$('#ignore-exit').prop('checked', localStorage.ignoreExit === 'on');
}


function saveOptions() {
	localStorage.cmd = $('#cmd').val();
	localStorage.ignoreExit = $('#ignore-exit').is(':checked') ? 'on' : '';

	// Show feedback.
	$('#saved')
		.css({visibility: 'visible'})
		.delay(FLASH_TIMEOUT)
		.queue(function (n) {
			$(this).css({visibility: 'hidden'});
			n();
		});

	if (localStorage.cmd) {
		// If there is a queued request, resume it.
		chrome.runtime.sendMessage({sender: 'options', type: 'diff', resume: true});
	}
}


function selectCodeBlockOnClick() {
	let selection = window.getSelection();
	if (selection.rangeCount > 0) { selection.removeAllRanges() }

	let range = document.createRange();
	range.selectNode(this);
	selection.addRange(range);
}


// Test run.
function testConfig() {
	// Ignore if no command is configured yet.
	if (window.cmd.value.replace(/\s+/g, '').length === 0) { return }


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
		sender: 'options',
		type: 'diff',
		left: {
			name: `Left test file ${timestamp}.txt`,
			text: content_left
		},
		right: {
			name: `Right test file ${timestamp}.txt`,
			text: content_right
		}
	};

	chrome.extension.sendMessage(ex_data, CloudDiff.exDiffResponseHandler);
}


function registerListeners() {
	// Links to blog.
	$('#blog-link').click(function () {
		$(this).next().find('a').get(0).click();
	});

	// For code blocks, select all block text on click.
	$(document.body).on('click', 'code', selectCodeBlockOnClick);

	// Set up change handlers.
	$('#cmd, #ignore-exit').change(saveOptions);

	// Test button.
	$('#config-test').click(testConfig);
}


$(() => {
	CloudDiff.setPlatform();
	populateExamples();
	restoreOptions();
	registerListeners();
});

