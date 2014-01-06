
// ===== Globals


// Column index constants, after diff column added; 0-base indexed.
var C = {
	PREVIEW: 1,
	DIFF: 2,
	CHANGED: 5
};

// Reference to revision table.
var $REV_TABLE = $('table.filebrowser');

// Inline diff-viewer references.
var $INDIFF_VIEW;
var PREVIEW_TOP;

// Retrieved file text cache.
var TEXT_CACHE = {};


// ===== Functions


function get_file_info(l_or_r) {
	var radio = $REV_TABLE.find('input[name=diff_' + l_or_r + ']').filter(':checked');

	if (radio.length != 1) { return null }

	var row = radio.closest('tr');

	return {
		url:			row.find('td:nth-child(' + (C.PREVIEW + 1) + ') > a').attr('href'),
		changed:	row.find('td:nth-child(' + (C.CHANGED + 1) + ')').text()
	};
}


// Retrieve info of files to diff:  {is_valid, left, right}.
function get_file_infos() {
	var left = get_file_info('l');
	var right = get_file_info('r');

	return {
		// Are they both selected, and different?
		is_valid: left && right && left.url != right.url,
		left: left,
		right: right
	};
}


// Update "enable" status of diff buttons.
function refresh_diff_button() {
	(get_file_infos().is_valid ? $.fn.removeClass : $.fn.addClass).call($('.diff_button'), 'grayed');
}


// Handle diff selection changes.
function diff_sel_changed(ev) {
	// Store row content for display on other pages.
	// Uncheck the restore button first, and check the targeted button.
	var name = 'name="' + ev.target.name + '"';

	localStorage[ev.target.name] = $(ev.target).closest('tr').html()
		.replace('checked="checked"', '').replace(name, name + ' checked="checked"');

	// Store current path name for validation.
	localStorage.pathname = document.location.pathname;

	refresh_diff_button();
}


// Diff button handlers.
function indiff_onclick() { diff_onclick('in') }
function exdiff_onclick() { diff_onclick('ex') }

function diff_onclick(in_or_ex) {
	// Retrieve left and right previews.
	var files = get_file_infos();

	if (!files.is_valid) { return }


	// It's legit.
	var left_name = compute_file_name(files.left.url, files.left.changed);
	var right_name = compute_file_name(files.right.url, files.right.changed);

	// Retrieve text for both files from cache or ajax.
	$.when(
		get_file_text(files.left.url),
		get_file_text(files.right.url)
	).done(function (left_text, right_text) {
		if (in_or_ex == 'in') {
			var left_lines = difflib.stringAsLines(left_text);
			var right_lines = difflib.stringAsLines(right_text);

			$INDIFF_VIEW
				.empty()
				.append(
					diffview.buildView({
						baseTextLines: left_lines,
						newTextLines: right_lines,
						opcodes: new difflib.SequenceMatcher(left_lines, right_lines).get_opcodes(),
						baseTextName: left_name,
						newTextName: right_name,
						contextSize: null,
						viewType: 0		// side-to-side diff.
					})
				);

			show_indiff();
		}
		else {
			// External diff.
			var ex_data = {
				left: {
					name: left_name,
					text: left_text
				},
				right: {
					name: right_name,
					text: right_text
				}
			};

			var body = $(document.body).addClass('progress');
			var cleanup = function () { body.removeClass('progress') };

			var tries = 3;

			var callback = function (response) {
				switch (response) {
					case '':
						// Success.
						cleanup();
						break;

					case null:
					case undefined:
						// Probably the event page was inactive; try again after a short delay.  Note that this is a workaround for
						// what seems like a Chrome bug.
						--tries;
						if (tries) {
							setTimeout(function () { chrome.runtime.sendMessage(ex_data, callback) }, 500);
							break;
						}
						// else fall through.

					default:
						// Maybe a plugin failure; display it.
						alert(
							'DropboxDiff failed with\n\n' +
							response + '\n\n' +
							'The JavaScript console of DropboxDiff\'s "background.html" page may have more information.'
						);
						cleanup();
						break;
				}
			};

			chrome.runtime.sendMessage(ex_data, callback);
		}
	});
}


function show_indiff() {
	$('#file-preview-modal').show();
	$('html').css({overflowY: 'hidden'});
	$(window).resize();	// trigger diff modal height adjustment.
}

function hide_indiff() {
	$('#file-preview-modal').hide();
	$('html').css({overflowY: ''});
}


// Dynamically calculate diff-modal viewport (simulate "max-height: 100%").
function window_onresize() {
	if ($INDIFF_VIEW.is(':visible')) $INDIFF_VIEW.css({maxHeight: $(window).height() - PREVIEW_TOP});
}


function insert_row(tbodies, l_or_r) {
	var content = localStorage[l_or_r];

	if (!content) { return }

	var sjid = extract_sjid(content);

	var rows = tbodies[1].rows;
	var row_count = rows.length - 1; // account for empty row.

	var hi_sjid = extract_sjid(rows[0].innerHTML);
	var lo_sjid = extract_sjid(rows[row_count - 1].innerHTML);

	var dest;

	if (sjid > hi_sjid) {
		dest = $(tbodies[0]);
	}
	else if (sjid < lo_sjid) {
		dest = $(tbodies[2]);
	}
	else {
		// The revision is on this page; clear it from storage.
		delete localStorage[l_or_r];
		return;
	}

	content = $('<tr/>', {'class': 'tr-added'}).append(content);

	// Insertion sort.
	dest.find('> tr').each(function (i, tr) {
		var row_sjid = extract_sjid(tr.innerHTML);

		if (sjid > row_sjid) {
			$(tr).before(content);
			content = null;
			return false;
		}
	});

	if (content) { dest.append(content) }
}


// Extract revision from HTML content or URLs.
function extract_sjid(html) {
	return /(\?|&(amp;)?)sjid=([0-9]+)/.exec(html)[3];
}


function sanitize_dropbox_date(d) {
	return d.replace(/[\/:]/g, '.').replace(/ ([AP]M)/, '$1').replace(/^\s+|\s+$/g, '').replace(/\s+\(.+\)/, '').toLowerCase();
}


function compute_file_name(url, changed) {
	// Extract filename and revision ("sjid" parameter).
	var rev = extract_sjid(url);

	var basename = url.substr(url.lastIndexOf('/') + 1);
	basename = decodeURIComponent(basename.substr(0, basename.indexOf('?')));

	var dot = basename.lastIndexOf('.');
	var ext = dot == -1 ? '' : basename.substr(dot);
	var base = basename.substr(0, basename.length - ext.length);

	// Append revision to ensure uniqueness.
	// Keep extension, in case diff tool can use it.
	return sanitize_dropbox_date(changed) + ' ' + base + ' ' + rev + ext;
}


function get_file_text(url) {
	if (url in TEXT_CACHE) return $.Deferred().resolve(TEXT_CACHE[url]);

	return $.get(url).then(function (text) {
		TEXT_CACHE[url] = text;
		return text;
	});
}


// ===== Main


(function ($) {

	var tbody = $REV_TABLE.find('> tbody');

	// Insert diff column for each row.
	tbody.find('> tr > td:nth-child(' + (C.PREVIEW + 1) + ')').after(
		'<td>' +
			'<div class="diff_sel">' +
				'<input type="radio" name="diff_l" title="left side"/>' +
				'<input type="radio" name="diff_r" title="right side"/>' +
			'</div>' +
		'</td>'
	);

	// Add before- and after- tbodies.
	tbody.before($('<tbody/>')).after($('<tbody/>'));

	var tbodies = $REV_TABLE.find('> tbody');

	// Check if stored row content matches current page.
	if (localStorage.pathname == document.location.pathname) {
		insert_row(tbodies, 'diff_l');
		insert_row(tbodies, 'diff_r');

		// Add margin rows, if necessary.
		$([tbodies[0], tbodies[2]]).filter(':parent').append($('<tr><td colspan="8">&nbsp;</td></tr>'));
	}

	// Add handlers.
	tbodies.find('.diff_sel > input').click(diff_sel_changed);

	// Insert diff buttons and handlers.
	$REV_TABLE.next('div').prepend(
		'<input id="indiff_button" type="button" value="Inline" class="diff_button freshbutton-lightblue grayed"/>' +
		'<input id="exdiff_button" type="button" value="Diff" class="diff_button freshbutton-lightblue grayed"/>'
	);

	$('#indiff_button').click(indiff_onclick);
	$('#exdiff_button').click(exdiff_onclick);

	// Add inline-diff overlay.  This was lifted from Dropbox's photo-preview page.
	$(document.body).append(
		'<div id="file-preview-modal" style="display: none">' +
			'<div class="modal-preview-content">' +
				'<div class="preview">' +
					'<table class="preview-container-parent"><tbody>' +
						'<tr>' +
							'<td class="preview-container" style="cursor: default">' +
								'<div class="preview-content">' +
									'<div class="content-item">' +
										'<div id="indiff-view"></div>' +
									'</div>' +
								'</div>' +
							'</td>' +
						'</tr>' +
					'</tbody></table>' +
				'</div>' +
			'</div>' +
			'<div class="header" style="cursor: default">' +
				'<a href="#" class="close lightbox-not-important">' +
					'<img src="https://dt8kf6553cww8.cloudfront.net/static/images/icons/icon_spacer-vflN3BYt2.gif" class="sprite sprite_web s_web_lightbox_close">' +
				'</a>' +
			'</div>' +
		'</div>'
	);
	$INDIFF_VIEW = $('#indiff-view');
	PREVIEW_TOP = $('#file-preview-modal .preview').css('top').replace(/px/, '');

	// Handle close, ESC.
	$('#file-preview-modal .close').click(hide_indiff);
	$(document).keyup(function (ev) { if (ev.keyCode == 27) hide_indiff() });

	$(window).resize(window_onresize);

	refresh_diff_button();

})(jQuery);

