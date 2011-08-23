

// ===== Globals


// Reference to revision table
var table = $('table.filebrowser');

// Column index constants
var C = {};


// ===== Functions


function size_to_bytes(s) {
	var r = /(\d+)( bytes|[KMGT]B)/.exec(s);

	if (!r.length) { return null }

	var bytes = r[1];

	switch (r[2]) {
		case 'KB': bytes *= 1024;									break;
		case 'MB': bytes *= 1024*1024;						break;
		case 'GB': bytes *= 1024*1024*1024;				break;
		case 'TB': bytes *= 1024*1024*1024*1024;	break;
	}

	return bytes;
}

function get_file_info(which) {
	var radio = table.find('input[name=diff_' + which + ']').filter(':checked');

	if (radio.length != 1) { return null }

	var row = radio.closest('tr');

	return {
		changed:	row.find('td:nth-child(' + (C.CHANGED + 1) + ')').text(),
		url:			row.find('td:nth-child(' + (C.PREVIEW + 1) + ') > a').attr('href'),
		size:			size_to_bytes(row.find('td:nth-child(' + (C.SIZE + 1) + ')').text())
	};
}

// Retrieve info of files to diff {is_valid, left, right}
function get_files_to_diff() {
	var left = get_file_info('l');
	var right = get_file_info('r');

	return {
		// Are they both selected, and different?
		is_valid: left && right && left.url != right.url,
		left: left,
		right: right
	};
}

// Handle diff selection changes -- update "enable" status of diff button
function diff_sel_changed() {
	(get_files_to_diff().is_valid ? $.fn.removeClass : $.fn.addClass).call($('#diff_button'), 'grayed');
}

// Diff button handler
function diff_onclick() {
	// Retrieve left and right previews
	var files = get_files_to_diff();

	if (!files.is_valid) { return }

	// It's legit
	chrome.extension.sendRequest(files, function(response) { if (response) alert('DropboxDiff error code ' + response) });
}


// ===== Main


(function() {

	var tbody = table.find('> tbody');

	// If there's only one revision, don't bother
	if (tbody.find('> tr:has(td > a)').length == 1) { return }

	var header = table.find('> thead > tr');

	C.CHANGED = header.find('> th:contains(Changed)')[0].cellIndex;

	// Insert Diff column header, after the Preview column
	var preview = header.find('> th:contains(Preview)');

	C.PREVIEW = preview[0].cellIndex + 1; // account for "Event" column having colSpan = 2

	preview.after('<th>Diff</th>');

	C.DIFF = C.PREVIEW + 1;
	C.SIZE = header.find('> th:contains(Size)')[0].cellIndex + 1;

	// Insert Diff column for each row
	tbody.find('> tr > td:nth-child(' + (C.PREVIEW + 1) + ')').after(
		'<td>' +
			'<input type="radio" name="diff_l" title="left side" />' +
			'<input type="radio" name="diff_r" title="right side" />' +
		'</td>'
	);

	// Add handlers
	tbody.find('> tr > td > input[type=radio]').click(diff_sel_changed);

	// Insert Diff button
	table.next('div').prepend(
		'<input id="diff_button" type="button" value="Diff" class="button grayed" />&nbsp;&nbsp;&nbsp;'
	);

	// Add handler
	$('#diff_button').click(diff_onclick);

})();

