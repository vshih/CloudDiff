
'use strict';


// ===== Globals/bookmarks.

const REV_TABLE_SELECTOR = 'div.gridlist.revisions table tbody';

let DIFF;

// Cache for retrieved file text.
let ID_TEXT_MAP = {};


// ===== Functions - markup injection.


// Insert diff buttons and handlers.
function injectDiffButtons(observer) {
	let $header = $(this);

	if (!$header.next().is('.clouddiff-buttons')) {
		$header.after(`
			<div class="clouddiff-buttons">
				<button id="clouddiff-exdiff" class="clouddiff-button" disabled>Diff</button>
				<button id="clouddiff-indiff" class="clouddiff-button" disabled>Inline</button>
			</div>
		`);

		// Diff button handlers.
		$('#clouddiff-exdiff').click(function () { DIFF.diffOnClick(this) });
		$('#clouddiff-indiff').click(function () { DIFF.diffOnClick(this) });
	}

	observer.takeRecords();
}


function injectTableHeader(observer) {
	let $thead = $(this);

	if (!$thead.find('.clouddiff-th').length) {
		$thead.find('tr').prepend(`
			<th class="clouddiff-th">CloudDiff</th>
		`);
	}

	observer.takeRecords();
}


function onRevisionsMarkup(observer) {
	$(this).find('tr.gridline:not(:has(.clouddiff-selectors))').prepend(`
		<td class="clouddiff-selectors">
			<label>
				<input type="radio" name="diff-left" title="left side"/>
			</label>
			<label>
				<input type="radio" name="diff-right" title="right side"/>
			</label>
		</td>
	`);

	observer.takeRecords();
}


// ===== Interface implementation.

async function fetchFileText() {
	const id = this.id;
	const {fileid, auth} = this.extra;

	if (!(id in ID_TEXT_MAP)) {
		ID_TEXT_MAP[id] = await $.get(computeFileUrl(fileid, id, auth));
	}
	return ID_TEXT_MAP[id];
}

class DiffPCloud extends CloudDiff.Diff {
	getFileInfo(left_or_right, args) {
		const $row = $(REV_TABLE_SELECTOR).find(`input[name=diff-${left_or_right}]`).filter(':checked').closest('tr');
		if ($row.length != 1) { return null }

		const auth = computeAuth(),
			fileid = computeFileid(),
			file = $row.find('.filename').text(),
			created = $row.find('td:last-child').text().trim(),
			revision = $row.find('.revid').text(),
			extra = {
				fileid,
				auth,
			};
		return new CloudDiff.FileInfo(file, created, revision, fetchFileText, extra);
	}
}


// Private helper functions.

function computeFileid() {
	let match = document.location.hash.match(/fileid=(\d+)/);
	return match ? match[1] : null;
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

	let megawrap = $('.megawrap')[0];

	DIFF = new DiffPCloud(megawrap);

	CloudDiff.addNewContentListener(megawrap, 'div.gridlist.revisions table thead', injectTableHeader);
	CloudDiff.addNewContentListener(megawrap, '.logo-place',												injectDiffButtons);
	CloudDiff.addNewContentListener(megawrap, REV_TABLE_SELECTOR,										onRevisionsMarkup);

	$(window).on('hashchange', () => {
		DIFF.hide();
	});
});

