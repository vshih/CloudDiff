
'use strict';

// jQuery alias.
(($) => {


// ===== Globals/bookmarks.


let $WINDOW;
let $BODY;

// Root node of the revisions-list markup.
let $REV_DIV;

// Reference for injecting page content.
let $PAGE_CONTENT;

// Inline diff-viewer references/values.
let $INDIFF_VIEW;
let $FILE_PREVIEW_MODAL;

let PREVIEW_TOP_PX;

// Extracted revision information, keyed by sjid.
let REV_MAP;

// Cache for retrieved file text.
let TEXT_CACHE = {};


// ===== Functions - markup injection and extraction.


function initBookmarks() {
	$WINDOW				= $(window);
	$BODY					= $(document.body);
	$PAGE_CONTENT	= $('#page-content');
}


// Register a callback to fire when React is done mounting.
// There's probably a proper way to do this using onComponentDidMount() but I don't know it.
function registerReactReadyListener(target, callback) {
	let observer = new MutationObserver(mutations => {
		// A single event seems like enough for the whole DOM to be complete.

		callback();

		observer.disconnect();
	});

	observer.observe(target, {
		childList: true,
		subtree: true
	});
}


function injectInlineDiffMarkup() {
	// Add inline-diff overlay.  This markup was lifted from an older version of Dropbox's photo-preview page.
	let close_icon_src = chrome.extension.getURL('icon_spacer-vflN3BYt2.gif');

	$BODY.append(`
		<div id="file-preview-modal" style="display: none">
			<div class="modal-preview-content">
				<div class="preview">
					<table class="preview-container-parent"><tbody>
						<tr>
							<td class="preview-container" style="cursor: default">
								<div class="preview-content">
									<div class="content-item">
										<div id="indiff-view"></div>
									</div>
								</div>
							</td>
						</tr>
					</tbody></table>
				</div>
			</div>
			<div class="header" style="cursor: default">
				<a href="#" class="close lightbox-not-important">
					<img class="sprite sprite_web s_web_control_close" alt="Close"
						src="${close_icon_src}">
				</a>
			</div>
		</div>
	`);
	$FILE_PREVIEW_MODAL = $('#file-preview-modal');
	PREVIEW_TOP_PX = parseInt($FILE_PREVIEW_MODAL.find('.preview').css('top').replace(/px/, ''));
	$INDIFF_VIEW = $('#indiff-view');

	// Handle close, ESC.
	$FILE_PREVIEW_MODAL.find('.close').click(hideInlineDiff);
	$(document).keyup((ev) => { if (ev.keyCode == 27) hideInlineDiff() });

	$WINDOW.resize(windowOnResize);


	$PAGE_CONTENT
		.on('click', '.diff-sel', (ev) => {
			// Prevent default preview pop-up for injected elements.
			ev.stopPropagation();
		})
		// Add diff-selection handlers.
		.on('click', '.diff-sel input[type="radio"]', refreshDiffButtons)
	;
}


// Revision info is stored as a JSON object within a script tag.
// TODO Not sure what needs to happen when the user clicks "Load older versions".
function extractRevInfo() {
	// Assumptions:
	//	- JSON is not minified.
	//	- "revisions" array contains no "]" embedded characters.
	let re = /"revisions": (\[[^\]]+\])/;

	let json = null;

	$.each(document.scripts, (i, script) => {
		let match = script.innerText.match(re);

		if (match) {
			json = match[1];
			return false;
		}
	});

	if (!json) {
		return alert('DropboxDiff failed to extract revision information.');
	}

	let revisions = JSON.parse(json);

	REV_MAP = {};

	// Example direct_blockserver_link value:
	//	https://www.dropbox.com/pri/get/{path}/{file}.{ext}?_subject_uid=1252292&w=AAA...
	revisions.forEach(r => {
		REV_MAP[r.id] = r.preview_info.direct_blockserver_link;
	});
}


function initBookmarksMounted() {
	$REV_DIV = $('.file-revisions-page__content');
}


// Insert diff buttons and handlers.
function injectDiffButtons() {
	$('#inner-page-header').prepend(`
		<div style="display: inline-block; margin-left: 189px">
			<button id="exdiff" class="diff-button freshbutton-lightblue" disabled>Diff</button>
			<button id="indiff" class="diff-button freshbutton-lightblue" disabled>Inline</button>
		</div>
	`);

	// Diff button handlers.
	$('#indiff').click(() => { diffOnClick('in') });
	$('#exdiff').click(() => { diffOnClick('ex') });
}

function injectRadioButtons() {
	$REV_DIV.find('.file-revisions__row_fake_wrapper_col').prepend(`
		<div class="file-revisions__row__col diff-sel" style="text-align: center; width: 65px">
			<input type="radio" name="diff-l" title="left side"/>
			<input type="radio" name="diff-r" title="right side"/>
		</div>
	`);
}


// ===== Functions - file retrieval.


function getFileInfo(l_or_r) {
	let $radio = $REV_DIV.find('input[name=diff-' + l_or_r + ']').filter(':checked');

	if ($radio.length != 1) { return null }

	let $row = $radio.closest('li');
	let sjid = $row.data('identity').split('_')[1];

	return {
		sjid:			sjid,
		url:			REV_MAP[sjid],
		// Strip whitespace and dot.
		changed:	$row.find('.file-revisions__text--time').text().trim().substr(2)
	};
}


// Retrieve info of files to diff:  {is_valid, left, right}.
function getFileInfos() {
	let left = getFileInfo('l');
	let right = getFileInfo('r');

	return {
		// Are they both selected, and different?
		is_valid: left && right && left.url != right.url,
		left: left,
		right: right
	};
}


function sanitizeDropboxDate(d) {
	return d.replace(/[\/:]/g, '.').replace(/ ([AP]M)/, '$1').replace(/^\s+|\s+$/g, '').replace(/\s+\(.+\)/, '').toLowerCase();
}


function computeFileName(url, sjid, changed) {
	// Extract filename from URL.
	let basename = url.substr(url.lastIndexOf('/') + 1);
	basename = decodeURIComponent(basename.substr(0, basename.indexOf('?')));

	let dot = basename.lastIndexOf('.');
	let ext = dot == -1 ? '' : basename.substr(dot);
	let base = basename.substr(0, basename.length - ext.length);

	// Append revision to ensure uniqueness.
	// Keep extension, in case diff tool can use it.
	return sanitizeDropboxDate(changed) + ` ${base} ${sjid}${ext}`;
}


function getFileText(url) {
	if (url in TEXT_CACHE) return $.Deferred().resolve(TEXT_CACHE[url]);

	return $.get(url).then(text => {
		TEXT_CACHE[url] = text;
		return text;
	});
}


// ===== Functions - UI, event handling.


// Update "enable" status of diff buttons.
function refreshDiffButtons() {
	let left = $('[name="diff-l"]:checked');
	let right = $('[name="diff-r"]:checked');

	$('.diff-button').prop('disabled', !(left.length && right.length && left.parent().get(0) != right.parent().get(0)));
}


function diffOnClick(in_or_ex) {
	// Retrieve left and right previews.
	let files = getFileInfos();

	if (!files.is_valid) { return }


	// It's legit.
	let left_name = computeFileName(files.left.url, files.left.sjid, files.left.changed);
	let right_name = computeFileName(files.right.url, files.right.sjid, files.right.changed);

	// Retrieve text for both files from cache or ajax.
	$.when(
		getFileText(files.left.url),
		getFileText(files.right.url)
	).done((left_text, right_text) => {
		if (in_or_ex == 'in') {
			let left_lines = difflib.stringAsLines(left_text);
			let right_lines = difflib.stringAsLines(right_text);

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

			showInlineDiff();
		}
		else {
			// External diff.
			let ex_data = {
				left: {
					name: left_name,
					text: left_text
				},
				right: {
					name: right_name,
					text: right_text
				}
			};

			$BODY.addClass('progress');
			let cleanup = () => { $BODY.removeClass('progress') };

			let tries = 3;

			let callback = (response) => {
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
							setTimeout(() => { chrome.runtime.sendMessage(ex_data, callback) }, 500);
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


function showInlineDiff() {
	$FILE_PREVIEW_MODAL.show();
	$('html').css({overflowY: 'hidden'});
	$WINDOW.resize();	// trigger diff modal height adjustment.
}

function hideInlineDiff() {
	$FILE_PREVIEW_MODAL.hide();
	$('html').css({overflowY: ''});
}


// Dynamically calculate diff-modal viewport (simulate "max-height: 100%").
function windowOnResize() {
	if ($INDIFF_VIEW.is(':visible')) $INDIFF_VIEW.css({maxHeight: $WINDOW.height() - PREVIEW_TOP_PX});
}


// ===== Main.


// Stuff that can be initialized on document.ready.
$(() => {
	initBookmarks();

	registerReactReadyListener($PAGE_CONTENT[0], onReactReady);
	injectInlineDiffMarkup();
	extractRevInfo();
});


// Stuff that must be performed after React components are loaded.
function onReactReady() {
	initBookmarksMounted();

	injectDiffButtons();
	injectRadioButtons();
}


})(jQuery);

