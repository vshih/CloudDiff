

// ===== Globals


// Reference to revision table
var table = $('table.filebrowser');

// Column index constants; 0-base indexed
var C = {
	PREVIEW: 1,
	DIFF: 2,
	CHANGED: 4
};


var REV_RE = new RegExp('&(amp;)?sjid=([0-9]+)"');


// ===== Functions


function get_file_info(which) {
	var radio = table.find('input[name=diff_' + which + ']').filter(':checked');

	if (radio.length != 1) { return null }

	var row = radio.closest('tr');

	return {
		url:			row.find('td:nth-child(' + (C.PREVIEW + 1) + ') > a').attr('href'),
		changed:	row.find('td:nth-child(' + (C.CHANGED + 1) + ')').text()
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

function refresh_diff_button() {
	// Update "enable" status of diff button
	(get_files_to_diff().is_valid ? $.fn.removeClass : $.fn.addClass).call($('#diff_button'), 'grayed');
}

// Handle diff selection changes
function diff_sel_changed(ev) {
	// Store row content for display on other pages
	// Uncheck the restore button first, and check the targeted button
	var name = 'name="' + ev.target.name + '"';

	localStorage[ev.target.name] = $(ev.target).closest('tr').html().replace('checked="checked"', '').replace(name, name + ' checked="checked"');

	// Store current path name for validation
	localStorage.pathname = document.location.pathname;

	refresh_diff_button();
}

// Diff button handler
function diff_onclick() {
	// Retrieve left and right previews
	var files = get_files_to_diff();

	if (!files.is_valid) { return }

	// It's legit
	var body = $(document.body).addClass('progress');

	chrome.extension.sendRequest(files, function(response) {
		body.removeClass('progress');

		if (response) {
			alert(
				'DropboxDiff failed:\n\n' +
				response + '\n\n' +
				'The javascript console of DropboxDiff\'s background page may have more information.'
			);
		}
	});
}

function insert_row(tbodies, which) {
	var content = localStorage[which];

	if (!content) { return }

	var sjid = REV_RE.exec(content)[2];

	var rows = tbodies[1].rows;
	var row_count = rows.length - 1; // account for empty row

	var hi_sjid = REV_RE.exec(rows[0].innerHTML)[2];
	var lo_sjid = REV_RE.exec(rows[row_count - 1].innerHTML)[2];

	var dest;

	if (sjid > hi_sjid) {
		dest = $(tbodies[0]);
	}
	else if (sjid < lo_sjid) {
		dest = $(tbodies[2]);
	}
	else {
		// The revision is on this page; clear it from storage
		delete localStorage[which];
		return;
	}

	content = $('<tr/>', {style: 'background-color: #eee'}).append(content);

	// Insertion sort
	dest.find('> tr').each(function(i, tr) {
		var row_sjid = REV_RE.exec(tr.innerHTML)[2];

		if (sjid > row_sjid) {
			$(tr).before(content);
			content = null;
			return false;
		}
	});

	if (content) { dest.append(content) }
}


// ===== Main


(function($) {

	var tbody = table.find('> tbody');

	// If there's only one revision, don't bother modifying table
	if (tbody.find('> tr:has(td > a)').length == 1) { return }

	// Insert Diff column for each row
	tbody.find('> tr > td:nth-child(' + (C.PREVIEW + 1) + ')').after(
		'<td>' +
			'<input type="radio" name="diff_l" title="left side" />' +
			'<input type="radio" name="diff_r" title="right side" />' +
		'</td>'
	);

	// Add before and after tbodies
	tbody.before($('<tbody/>')).after($('<tbody/>'));

	var tbodies = table.find('> tbody');

	// Check if stored row content matches current page
	if (localStorage.pathname == document.location.pathname) {
		insert_row(tbodies, 'diff_l');
		insert_row(tbodies, 'diff_r');

		// Add margin rows, if necessary
		$([tbodies[0], tbodies[2]]).filter(':parent').append($('<tr><td colspan="8">&nbsp;</td></tr>'));
	}

	// Add handlers
	tbodies.find('> tr > td > input[type=radio][name^="diff_"]').click(diff_sel_changed);

	// Insert Diff button
	table.next('div').prepend(
		'<input id="diff_button" type="button" value="Diff" class="button grayed" />&nbsp;&nbsp;&nbsp;'
	);

	// Add handler
	$('#diff_button').click(diff_onclick);

	refresh_diff_button();

})(jQuery);

