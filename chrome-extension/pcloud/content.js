
'use strict';


// ===== Globals/bookmarks.

const REV_TABLE_SELECTOR = '.listGridWindow';

let DIFF;

// Cache for retrieved file text.
let ID_TEXT_MAP = {};


// ===== Functions - markup injection.


// Insert diff buttons and handlers.
function injectDiffButtons(observer) {
	observer.disconnect();

	$(this).before(`
		<div class="clouddiff-buttons">
			<button id="clouddiff-exdiff" class="clouddiff-button" disabled>Diff</button>
			<button id="clouddiff-indiff" class="clouddiff-button" disabled>Inline</button>
		</div>
	`);

	// Diff button handlers.
	$('#clouddiff-exdiff').click(function () { DIFF.diffOnClick(this) });
	$('#clouddiff-indiff').click(function () { DIFF.diffOnClick(this) });
}


function injectTableHeader(observer) {
	let $thead = $(this);

	if (!$thead.find('.clouddiff-th').length) {
		$thead.prepend(`
			<div class="clouddiff-th"><span>CloudDiff</span></div>
		`);
	}

	observer.takeRecords();
}


function onRevisionsMarkup(observer) {
	$(this).find('.selectable:not(:has(.clouddiff-selectors))').prepend(`
		<div class="clouddiff-selectors">
			<label>
				<input type="radio" name="diff-left" title="left side"/>
			</label>
			<label>
				<input type="radio" name="diff-right" title="right side"/>
			</label>
		</div>
	`);

	const interceptorSentinel = 'clouddiff-click-interceptor',
		$revTable = $(REV_TABLE_SELECTOR);

	if (!$revTable.data(interceptorSentinel)) {
		$revTable
			.on('click', '.clouddiff-selectors', ev => {
				// Prevent row-selection when clicking injected elements.
				ev.stopPropagation();
				$('.megawrap').trigger('clouddiff:click');
			})
			.data(interceptorSentinel, true)
		;
	}

	observer.takeRecords();
}


// ===== Interface implementation.

async function fetchFileText() {
	const id = this.id;
	const {fileid, auth} = this.extra;

	if (!(id in ID_TEXT_MAP)) {
		const text = await $.get(computeFileUrl(fileid, id, auth));

		if (id == 'Current') {
			// Never cache the "Current" version of a file:
			// - Cache key namespace spans multiple files (I assume that revision IDs are unique across all files).
			// - The text of the given file might change between views.
			return text;
		}
		ID_TEXT_MAP[id] = text;
	}
	return ID_TEXT_MAP[id];
}

class DiffPCloud extends CloudDiff.Diff {
	getFileInfo(left_or_right, args) {
		const $row = $(REV_TABLE_SELECTOR).find(`input[name=diff-${left_or_right}]`).filter(':checked').closest('div.selectable');
		if ($row.length != 1) { return null }

		const auth = computeAuth(),
			fileid = computeFileid(),
			file = $row.find('.nameSub-col > span').text(),
			created = $row.find('.created-col > span').text().trim(),
			revision = $row.find('.revisionid-col > span').text(),
			extra = {
				fileid,
				auth,
			};
		return new CloudDiff.FileInfo(file, created, revision, fetchFileText, extra);
	}
}


// Private helper functions.

function computeFileid() {
	const params = new URLSearchParams(location.hash.substr(1));
	return params.get('fileid');
}

function computeAuth() {
	return Cookies.get('pcauth');
}

function computeFileUrl(fileid, revid, auth) {
	let params = {
		fileid,
		auth,
	};

	if (revid != 'Current') {
		params.revisionid = revid;
	}

	return 'https://api.pcloud.com/gettextfile?' + $.param(params);
}


// ===== Main.


$(() => {
	CloudDiff.setPlatform();

	const megawrap = $('.megawrap')[0];

	DIFF = new DiffPCloud(megawrap);

	CloudDiff.addNewContentListener(megawrap, '#uploadProgressSection', injectDiffButtons);
	CloudDiff.addNewContentListener(megawrap, '.headerWrapper', injectTableHeader);
	CloudDiff.addNewContentListener(megawrap, REV_TABLE_SELECTOR, onRevisionsMarkup);
});

