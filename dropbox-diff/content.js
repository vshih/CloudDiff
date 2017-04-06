
'use strict';


// ===== Globals/bookmarks.


let $WINDOW;
let $BODY;

// Root node of the revisions-list markup.
let $REV_DIV;

// Reference for injecting page content.
let EMBEDDED_APP;

// Inline diff-viewer references/values.
let $INDIFF_VIEW;
let $FILE_PREVIEW_MODAL;
let $PREVIEW;

// Extracted revision information, keyed by sjid.
let REV_MAP = {};

// Cache for retrieved file text.
let TEXT_CACHE = {};


// ===== Functions - markup injection and extraction.


function initBookmarks() {
	$WINDOW				= $(window);
	$BODY					= $(document.body);
	EMBEDDED_APP	= $('#embedded-app')[0];
}


function addNewContentListener(root, targetSelector, callback) {
	let observer = new MutationObserver((mutations, observer) => {
		let $targets = $(targetSelector);

		if ($targets.length) {
			$targets.each(function () {
				callback.call(this, observer);
			});
			return;
		}
	});

	observer.observe(root, {
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
					<img class="sprite sprite_web s_web_control_close" alt="Close" src="${close_icon_src}"/>
				</a>
			</div>
		</div>
	`);
	$FILE_PREVIEW_MODAL = $('#file-preview-modal');
	$PREVIEW = $FILE_PREVIEW_MODAL.find('.preview');
	$INDIFF_VIEW = $FILE_PREVIEW_MODAL.find('#indiff-view');

	// Handle close, ESC.
	$FILE_PREVIEW_MODAL.find('.close').click(hideInlineDiff);
	$(document).keyup(ev => { if (ev.keyCode == 27) hideInlineDiff() });

	$WINDOW.resize(windowOnResize);


	$(EMBEDDED_APP)
		.on('click', '.diff-sel', (ev) => {
			// Prevent default preview pop-up for injected elements.
			ev.stopPropagation();
		})
		// Add diff-selection handlers.
		.on('click', '.diff-sel input[type="radio"]', refreshDiffButtons)
	;
}


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
		return window.alert('DropboxDiff failed to extract revision information.');
	}

	let revisions = JSON.parse(json);
	onNewRevisionsJson(revisions);
}


// Insert diff buttons and handlers.
function injectDiffButtons(observer) {
	observer.disconnect();

	$(this).prepend(`
		<div class="file-revisions-page__head__filename">
			<button id="exdiff" class="diff-button freshbutton-lightblue" disabled>Diff</button>
			<button id="indiff" class="diff-button freshbutton-lightblue" disabled>Inline</button>
		</div>
	`);

	// Diff button handlers.
	$('#indiff').click(() => { diffOnClick('in') });
	$('#exdiff').click(() => { diffOnClick('ex') });
}


function injectRadioButtons(observer) {
	// Start from the end and work backwards, for the appended case.
	$($(this).get().reverse()).each((i, element) => {
		let $element = $(element);

		if ($element.has('.diff-sel').length) { return false }

		$element.prepend(`
			<div class="file-revisions__row__col diff-sel">
				<input type="radio" name="diff-l" title="left side"/>
				<input type="radio" name="diff-r" title="right side"/>
			</div>
		`);
	});
}


// ===== Functions - file retrieval.


function getFileInfo(l_or_r) {
	let $radio = $REV_DIV.find(`input[name=diff-${l_or_r}]`).filter(':checked');

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

	return $.ajax(url, {dataType: 'text'})
		.then(text => {
			TEXT_CACHE[url] = text;
			return text;
		});
}


// ===== Functions - UI, event handling.


// Update "enable" status of diff buttons.
function refreshDiffButtons() {
	let left = $('[name="diff-l"]:checked');
	let right = $('[name="diff-r"]:checked');

	$('.diff-button').prop('disabled', !(left.length && right.length && left.parent()[0] != right.parent()[0]));
}


function diffOnClick(in_or_ex) {
	// Retrieve left and right previews.
	let files = getFileInfos();

	if (!files.is_valid) { return }


	// It's legit.
	let left_name = computeFileName(files.left.url, files.left.sjid, files.left.changed);
	let right_name = computeFileName(files.right.url, files.right.sjid, files.right.changed);

	// Retrieve text for both files from cache or AJAX.
	$.when(
		getFileText(files.left.url),
		getFileText(files.right.url)
	)
	.done((left_text, right_text) => {
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

			// Even though the interaction is non-modal (e.g. the user can browse to the page again and trigger another diff),
			// give at least some indication that we're doing something by changing the cursor to a spinner.
			$BODY.addClass('progress');
			let cleanup = () => {
				$BODY.removeClass('progress');
			};

			// Seems like this is more reliable now; try only once.
			let tries = 1;

			chrome.runtime.sendMessage(
				ex_data,
				createExDiffResponseHandler(ex_data, tries, cleanup)
			);
		}
	})
	.fail((xhr, status, err) => {
		$.alertable.alert(`
			<p>
				DropboxDiff failed with status "${status}", and error:
			</p>

			<blockquote>
				${JSON.stringify(err, null, 2)}
			</blockquote>

			<p>
				The JavaScript console of DropboxDiff's background page may have more information.
			</p>
			`,
			{html: true}
		);
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
	if ($INDIFF_VIEW.is(':visible')) {
		$INDIFF_VIEW.css({
			maxHeight: $WINDOW.height() - parseInt($PREVIEW.css('top').replace(/px/, ''))
		});
	}
}


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
	document.addEventListener('com.vicshih.dropboxdiff.new-revisions-json', customEvent => callback(customEvent.detail));
}


function onRevisionsMarkup(observer) {
	observer.disconnect();
	$REV_DIV = $(this);
	addNewContentListener(this, '.file-revisions__row_fake_wrapper_col', injectRadioButtons);
}


// ===== Main.


$(() => {
	initBookmarks();
	injectInlineDiffMarkup();
	addNewRevisionsAjaxListener(onNewRevisionsJson);
	injectScript('content-inject.js');

	addNewContentListener(EMBEDDED_APP, '.page-header__heading', injectDiffButtons);
	addNewContentListener(EMBEDDED_APP, '.file-revisions-page__content', onRevisionsMarkup);
	addNewContentListener(EMBEDDED_APP, 'script:contains("\"revisions\":")', initRevInfo);
});

