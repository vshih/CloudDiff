
'use strict';

// ===== Globals/bookmarks.

const APP_KEY = 'j9zuibfjn4j82u4';

let DIFF;

// Root node of the revisions-list markup.
let $REV_DIV;

// Store these values once computed for the current page.
let FILENAME;
let FQ_PATH;

// Map sjid's (the identifiers in markup) to ts's (timestamp).
// Computed from JavaScript script tag in DOM.
let SJID_TS_MAP = {};

// Map ts's to revision IDs.
// Computed from filesListRevisions API results.
let TS_REV_MAP;

// Map revision to cached file text.
let REV_TEXT_MAP = {};

// Queue the element which triggered a diff, if necessary.
let LAST_SOURCE_ELEMENT;


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
				<label>
					<input type="radio" name="diff-left" title="left side"/>
				</label>
				<label>
					<input type="radio" name="diff-right" title="right side"/>
				</label>
			</div>
		`);
	});
}


function accessTokenChanged(changes, namespace) {
	if (namespace == 'sync' && changes.accessToken && LAST_SOURCE_ELEMENT) {
		DIFF.diffOnClick(LAST_SOURCE_ELEMENT);
	}
}


function getAccessToken() {
	return new Promise(function (resolve, reject) {
		chrome.storage.sync.get('accessToken', function (result) {
			resolve(result.accessToken);
		});
	});
}


// ===== Interface implementation.

async function fetchFileText() {
	const {dbx, rev} = this.extra;

	if (!(rev in REV_TEXT_MAP)) {
		// Download file.
		let file_meta = await dbx.filesDownload({path: `rev:${rev}`});
		REV_TEXT_MAP[rev] = await file_meta.fileBlob.text();
	}
	return REV_TEXT_MAP[rev];
}

class DiffDropbox extends CloudDiff.Diff {
	async getFileInfos(source_element, args) {
		const access_token = await getAccessToken();

		if (access_token) {
			LAST_SOURCE_ELEMENT = null;
		} else {
			LAST_SOURCE_ELEMENT = source_element;

			// Trigger OAuth flow.
			let dbx = new Dropbox.Dropbox({clientId: APP_KEY, fetch: window.fetch}),
				receiver_path = chrome.runtime.getURL('dropbox/oauth-receiver.html'),
				auth_url = dbx.getAuthenticationUrl(receiver_path);
			window.open(auth_url, '_blank');
			return null;
		}

		// Retrieve revisions for the current file.
		let dbx = new Dropbox.Dropbox({accessToken: access_token, fetch: window.fetch});
		if (!TS_REV_MAP) {
			TS_REV_MAP = {};

			const revisions = await dbx.filesListRevisions({path: FQ_PATH, mode: {'.tag': 'path'}, limit: 100});
			revisions.entries.forEach(entry => {
				TS_REV_MAP[new Date(entry.server_modified).getTime()] = entry.rev;
			});
		}

		return super.getFileInfos(source_element, {dbx});
	}

	getFileInfo(left_or_right, {dbx}) {
		const $row = $REV_DIV.find(`input[name=diff-${left_or_right}]`).filter(':checked').closest('li');
		if ($row.length != 1) { return null }

		const sjid = $row.data('identity').split('_')[1],
			ts = SJID_TS_MAP[sjid];
		if (!(ts in TS_REV_MAP)) { throw `Revision ${ts} not found for "${FQ_PATH}"` }

		const rev = TS_REV_MAP[ts],
			modified = $row.find('.file-revisions__text--time').text().trim(),
			extra = {
				dbx,
				rev
			};
		return new CloudDiff.FileInfo(FILENAME, modified, sjid, fetchFileText, extra);
	}
}


// ===== Functions - UI, event handling.


// From https://stackoverflow.com/a/9517879/97439, method 1.
function injectScript(script) {
	let scriptElement = document.createElement('script');
	scriptElement.src = chrome.extension.getURL(script);
	scriptElement.onload = function () {
		this.remove();
	};
	(document.head || document.documentElement).appendChild(scriptElement);
}


function onNewRevisionsJson(revisions) {
	revisions.forEach(revision => {
		SJID_TS_MAP[revision.preview_info.sjid] = revision.ts;

		if (!FILENAME) {
			// Assume all revisions have the same value.
			FILENAME = revision.preview_info.filename;
			FQ_PATH = revision.preview_info.fq_path;
		}
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

	DIFF = new DiffDropbox(embedded_app);

	addNewRevisionsAjaxListener(onNewRevisionsJson);
	injectScript('dropbox/content-inject.js');

	CloudDiff.addNewContentListener(document.body, '.page-header__heading',							injectDiffButtons);
	CloudDiff.addNewContentListener(document.body, '.file-revisions-page__content',			onRevisionsMarkup);
	CloudDiff.addNewContentListener(document.body, 'script:contains(\'"revisions":\')',	initRevInfo);

	// Listen for OAuth token in storage.
	chrome.storage.onChanged.addListener(accessTokenChanged);

	$(embedded_app)
		.on('click', '.clouddiff-selectors', (ev) => {
			// Prevent default preview pop-up for injected elements.
			ev.stopPropagation();
		})
});

