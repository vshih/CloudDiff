
'use strict';


const FLASH_TIMEOUT = 2500;


// Show feedback.
function flash(msg) {
	$('#flash')
		.html(msg)
		.css({visibility: 'visible'})
		.delay(FLASH_TIMEOUT)
		.queue(function (n) {
			$(this).css({visibility: 'hidden'});
			n();
		});
}


function populateExamples() {
	let appVersion = navigator.appVersion;

	let eg;

	if (appVersion.indexOf('Mac') != -1) {
		eg = [
			`opendiff`,
			`/Applications/p4merge.app/Contents/Resources/launchp4merge`,
			`/Applications/MacVim.app/Contents/bin/mvim -d`,
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


// Read from storage.
function restoreOptions() {
	chrome.storage.local.get({cmd: '', ignoreExit: ''})
	.then(({ cmd, ignoreExit }) => {
		$('#cmd').val(cmd);
		$('#ignore-exit').prop('checked', ignoreExit === 'on');
	});

	chrome.storage.sync.get('accessToken')
	.then(({ accessToken }) => {
		if (accessToken) {
			$('#clear-dropbox-auth').prop('disabled', false);
		}
	});
}


function saveOptions() {
	chrome.storage.local.set({
		cmd: $('#cmd').val(),
		ignoreExit: $('#ignore-exit').is(':checked') ? 'on' : '',
	})
	.then(() => flash('Saved.'));
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

	chrome.runtime.sendMessage(ex_data, CloudDiff.exDiffResponseHandler);
}


function clearAuth() {
	$('#clear-dropbox-auth').prop('disabled', true);
	chrome.storage.sync.remove('accessToken').then(() => {
		if (chrome.runtime.lastError) {
			flash('Error: ' + chrome.runtime.lastError);
		} else {
			flash('Cleared.');
		}
	});
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

	// Clear-auth button.
	$('#clear-dropbox-auth').click(clearAuth);
}


$(() => {
	CloudDiff.setPlatform();
	populateExamples();
	restoreOptions();
	registerListeners();
});

