
'use strict';


// ===== Globals/bookmarks.

let DIFF;

// Root node of the revisions-list markup.
let $REV_DIV;

// Extracted revision information, keyed by sjid.
let REV_MAP = {};

// Cache for retrieved file text.
let TEXT_CACHE = {};


// ===== Functions - markup injection and extraction.


// Revision info is stored as a JSON object within a script tag.
function initRevInfo(observer) {
	observer.disconnect();

	// Assumptions:
	//	- JSON is not minified.
	//	- "revisions" array contains no "]" embedded characters.
	const find_revs_re = /"revisions": (\[[^\]]+\])/;

	let json = null;

	// The "revisions" object is usually close to the end; search in reverse order.
	let match = this.innerText.match(find_revs_re);

	if (match) {
		json = match[1];
	}

	if (!json) {
		return CloudDiff.alert('CloudDiff failed to extract revision information.');
	}

	let revisions = JSON.parse(json);
	onNewRevisionsJson(revisions);
}


// Insert diff buttons and handlers.
function injectDiffButtons(observer) {
	observer.disconnect();

	$(this).prepend(`
		<div class="file-revisions-page__head__filename clouddiff-buttons">
			<button id="clouddiff-exdiff" class="clouddiff-button freshbutton-lightblue" disabled>Diff</button>
			<button id="clouddiff-indiff" class="clouddiff-button freshbutton-lightblue" disabled>Inline</button>
		</div>
	`);

	// Diff button handlers.
	$('#clouddiff-indiff').click(function () { DIFF.diffOnClick(this) });
	$('#clouddiff-exdiff').click(function () { DIFF.diffOnClick(this) });
}


function injectRadioButtons(observer) {
	// Start from the end and work backwards, for the appended case.
	$($(this).get().reverse()).each((i, element) => {
		let $element = $(element);

		if ($element.has('.clouddiff-selectors').length) { return false }

		$element.prepend(`
			<div class="file-revisions__row__col clouddiff-selectors">
				<input type="radio" name="diff-left" title="left side"/>
				<input type="radio" name="diff-right" title="right side"/>
			</div>
		`);
	});
}


// ===== Interface implementation.

CloudDiff.getFileInfo = (left_or_right) => {
	let $row = $REV_DIV.find(`input[name=diff-${left_or_right}]`).filter(':checked').closest('li');
	if ($row.length != 1) { return null }

	let sjid			= $row.data('identity').split('_')[1];
	let url				= REV_MAP[sjid];
	let name			= extractFileName(url);
	let modified	= $row.find('.file-revisions__text--time').text().trim();

	let file_info = new CloudDiff.FileInfo(name, modified, sjid, {url: url});

	file_info.fileTextPromise = function () {
		let url = this.extra.url;
		if (url in TEXT_CACHE) return $.Deferred().resolve(TEXT_CACHE[url]);

		return $.ajax(url, {dataType: 'text'})
			.then(text => {
				TEXT_CACHE[url] = text;
				return text;
			});
	};

	return file_info;
}


// Helper functions.

function extractFileName(url) {
	// Extract filename from URL.
	let basename = url.substr(url.lastIndexOf('/') + 1);
	return decodeURIComponent(basename.substr(0, basename.indexOf('?')));
}


// ===== Functions - UI, event handling.


// From http://stackoverflow.com/questions/9515704/building-a-chrome-extension-inject-code-in-a-page-using-a-content-script/9517879#9517879, method 1.
function injectScript(script) {
	let scriptElement = document.createElement('script');
	scriptElement.src = chrome.extension.getURL(script);
	scriptElement.onload = function () {
		this.remove();
	};
	(document.head || document.documentElement).appendChild(scriptElement);
}


function onNewRevisionsJson(revisions) {
	// Example direct_blockserver_link values:
	//	//dl-web.dropbox.com/get/{path}/{file}.{ext}?_subject_uid=1252292&revision_id=AsKy...&w=AAD...
	revisions.forEach(revision => {
		REV_MAP[revision.id] = revision.preview_info.direct_blockserver_link;
	});
}


function addNewRevisionsAjaxListener(callback) {
	document.addEventListener('com.vicshih.clouddiff.new-revisions-json', customEvent => callback(customEvent.detail));
}


function onRevisionsMarkup(observer) {
	observer.disconnect();
	$REV_DIV = $(this);
	CloudDiff.addNewContentListener(this, '.file-revisions__row_fake_wrapper_col', injectRadioButtons);
}


// ===== Main.


$(() => {
	CloudDiff.setPlatform();

	let embedded_app = $('#embedded-app')[0];

	DIFF = new CloudDiff.Diff(embedded_app);

	addNewRevisionsAjaxListener(onNewRevisionsJson);
	injectScript('dropbox/content-inject.js');

	CloudDiff.addNewContentListener(embedded_app, '.page-header__heading',							injectDiffButtons);
	CloudDiff.addNewContentListener(embedded_app, '.file-revisions-page__content',			onRevisionsMarkup);
	CloudDiff.addNewContentListener(embedded_app, 'script:contains("\"revisions\":")',	initRevInfo);

	$(embedded_app)
		.on('click', '.clouddiff-selectors', (ev) => {
			// Prevent default preview pop-up for injected elements.
			ev.stopPropagation();
		});
});

