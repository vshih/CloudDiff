
'use strict';


// ===== Globals/bookmarks.

const REV_TABLE_SELECTOR = 'div.gridlist.revisions table tbody';

let DIFF;

// Cache for retrieved file text.
let TEXT_CACHE = {};


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
			<input type="radio" name="diff-left" title="left side"/>
			<input type="radio" name="diff-right" title="right side"/>
		</td>
	`);

	observer.takeRecords();
}


// ===== Interface implementation.

CloudDiff.getFileInfo = (left_or_right) => {
	let $row = $(REV_TABLE_SELECTOR).find(`input[name=diff-${left_or_right}]`).filter(':checked').closest('tr');
	if ($row.length != 1) { return null }

	let file = $row.find('.filename').text(),
		created = $row.find('td:last-child').text().trim(),
		revision = $row.find('.revid').text(),
		file_info = new CloudDiff.FileInfo(file, created, revision);

	// Override fileTextPromise().
	file_info.fileTextPromise = function () {
		let id = this.id;
		if (id in TEXT_CACHE) return $.Deferred().resolve(TEXT_CACHE[id]);

		// First get the file metadata.
		let meta_url = computeMetaUrl(computeFileid(), id, computeAuth());

		return $.getJSON(meta_url)
			.then(json => {
				if (json.hosts && json.hosts[0] && json.path) {
					// Retrieve the actual file.
					return $.ajax(`https://${json.hosts[0]}${json.path}`, {dataType: 'text'})
						.then(text => {
							TEXT_CACHE[id] = text;
							return text;
						});
				}
				else {
					CloudDiff.alert('Failed to retrieve/parse file information:', json);
				}
			});
	};

	return file_info;
};


// Private helper functions.

function computeFileid() {
	let match = document.location.hash.match(/fileid=(\d+)/);
	if (match) {
		return match[1];
	}
}

function computeAuth() {
	return Cookies.get('pcauth');
}

function computeMetaUrl(fileid, revid, auth) {
	let params = {
		fileid: fileid,
		forcedownload: 1,
		auth: Cookies.get('pcauth')
	};

	if (revid != 'Current') {
		params.revisionid = revid;
	}

	return 'https://api.pcloud.com/getfilelink?' + $.param(params);
}


// ===== Main.


$(() => {
	CloudDiff.setPlatform();

	let megawrap = $('.megawrap')[0];

	DIFF = new CloudDiff.Diff(megawrap);

	CloudDiff.addNewContentListener(megawrap, 'div.gridlist.revisions table thead', injectTableHeader);
	CloudDiff.addNewContentListener(megawrap, '.logo-place',												injectDiffButtons);
	CloudDiff.addNewContentListener(megawrap, REV_TABLE_SELECTOR,										onRevisionsMarkup);

	$(window).on('hashchange', () => {
		DIFF.hide();
	});
});

