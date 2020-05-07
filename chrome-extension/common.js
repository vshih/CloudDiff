
'use strict';


//
// Note that in addition to being a content script, this file is also included in options.html,
//

let CloudDiff = {};


// ===== Static methods.


CloudDiff.setPlatform = () => {
	document.body.className += ' clouddiff-' + navigator.platform.replace(/ /g, '_');
};


CloudDiff.alert = (s, obj) => {
	let message = `<p>${s}</p>`;
	if (obj) {
		// May be a plugin failure; display it.
		if (typeof obj === 'object') {
			obj = JSON.stringify(obj, null, 2);
		}

		message += `<blockquote>${obj}</blockquote>`;
	}

	$.alertable.alert(message, {html: true});
};


CloudDiff.createExDiffResponseHandler = (ex_data, tries, callback) => {
	let handler = (response) => {
		switch (response) {
		case '':
			// Success.
			break;

		case null:
		case undefined:
			// Probably the event page was inactive; try again after a short delay.  Note that this is a workaround for
			// what seems like a Chrome bug.
			--tries;
			if (tries > 0) {
				window.setTimeout(() => { chrome.runtime.sendMessage(ex_data, handler) }, 500);
				break;
			}
			// else fall through.

		default:
			let context_message = document.location.protocol != 'chrome-extension:' ? '; see the CloudDiff Options page for instructions on how to install the CloudDiff Helper' : '';

			CloudDiff.alert(`
				CloudDiff failed with the message below${context_message}.
				The JavaScript console of CloudDiff's background page may have more information.`, response);
			break;
		}

		if (callback) {
			callback();
		}
	};

	return handler;
};


CloudDiff.addNewContentListener = (root, targetSelector, callback) => {
	let $root = $(root);

	let $targets = $root.find(targetSelector);
	if ($targets.length) {
		// Skip the observer and call the handler immediately.
		let observer = {disconnect: () => {}, takeRecords: () => {}};
		$targets.each(function () {
			callback.call(this, observer);
		});
		return;
	}

	let observer = new MutationObserver((mutations, observer) => {
		let $targets = $root.find(targetSelector);

		if ($targets.length) {
			console.log(targetSelector, 'found');
			$targets.each(function () {
				callback.call(this, observer);
			});
			return;
		} else {
			console.log(targetSelector, 'not found');
		}
	});

	observer.observe(root, {
		childList: true,
		subtree: true
	});
};


// ===== Class definitions.


CloudDiff.Diff = class {

	constructor(click_listener_root) {
		// Inline-diff overlay.
		$(document.body)
			.append(`
				<div id="clouddiff-dialog">
					<div class="clouddiff-head">
						<h2> {left-label} </h2>
						<h2> {right-label} </h2>
						<i class="clouddiff-close">&times;</i>
					</div>
					<div class="clouddiff-content"></div>
				</div>
			`);
		this.$dialog = $('#clouddiff-dialog');
		this.$content = this.$dialog.find('.clouddiff-content');

		// Handle close, ESC.
		this.$dialog.find('.clouddiff-close').click(() => this.hide());
		$(document).keyup(ev => { if (ev.keyCode == 27) this.hide() });

		$(click_listener_root)
			// Add diff-selector handlers.
			.on('click', '.clouddiff-selectors input[type="radio"]', this.refreshDiffButtons)
		;
	}

	show(left_label, right_label) {
		// Disable any scrolling.
		let $html = $('html');
		// Save existing overflowY value.
		this.prev_overflow = $html.css('overflowY');
		$html.css({overflowY: 'hidden'});

		// Set headers.
		this.$dialog.find('.clouddiff-head h2')
			.eq(0).html(left_label).end()
			.eq(1).html(right_label);

		this.$dialog.show();
	}

	hide() {
		this.$dialog.hide();
		$('html').css({overflowY: this.prev_overflow});
	}

	// Update "enable" status of diff buttons.
	refreshDiffButtons() {
		let $left = $('[name="diff-left"]:checked');
		let $right = $('[name="diff-right"]:checked');

		let is_disabled = !(
			$left.length &&
			$right.length &&
			$left.closest('.clouddiff-selectors')[0] != $right.closest('.clouddiff-selectors')[0]
		);
		$('.clouddiff-button').prop('disabled', is_disabled);
	}

	async diffOnClick(source_element) {
		// Retrieve left and right previews.
		let files = await this.getFileInfos(source_element, null);

		if (!(files && files.is_valid)) { return }


		// It's legit.
		// Retrieve text for both files from cache or AJAX.
		let left_text, right_text;
		try {
			// Assign promises to variables before awaiting to spawn in parallel.
			let left_fetch = files.left.fetchFileText();
			let right_fetch = files.right.fetchFileText();
			left_text = await left_fetch;
			right_text = await right_fetch;
		}
		catch (err) {
			return CloudDiff.alert(`CloudDiff failed with the following error
				(the JavaScript console of CloudDiff's background page may have more information):`, err);
		}

		if (source_element.id === 'clouddiff-indiff') {
			this.$content.empty();
			// The wrapping element must be visible during .MergeView construction.
			this.show(
				files.left.label,
				files.right.label
			);
			let mv = CodeMirror.MergeView(this.$content[0], {
				// Potential options for configurability.
				// TODO scroll to first diff
				//connect: 'align' | '',
				//collapseIdentical: true | false | integer,
				//lineWrapping: bool,
				lineNumbers: true,

				value: right_text,
				origLeft: left_text,
				revertButtons: false
			});
		}
		else {
			// External diff.
			let ex_data = {
				type: 'diff',
				left: {
					name: files.left.uniqueName,
					text: left_text
				},
				right: {
					name: files.right.uniqueName,
					text: right_text
				}
			};

			// Even though the interaction is non-modal (e.g. the user can browse to the page again and trigger another diff),
			// give at least some indication that we're doing something by changing the cursor to a spinner.
			let $body = $(document.body).addClass('clouddiff-progress');
			let cleanup = () => {
				$body.removeClass('clouddiff-progress');
			};

			// Seems like this is more reliable now; try only once.
			let tries = 1;

			chrome.runtime.sendMessage(
				ex_data,
				CloudDiff.createExDiffResponseHandler(ex_data, tries, cleanup)
			);
		}
	}

	// Retrieve info of files to diff.
	//
	// Parameters:
	//  source_element - the HTML element which triggered the call
	//  args - any arguments which should get passed to implementations' getFileInfo() invocation
	// Returns:
	//  Promise({left: <CloudDiff.FileInfo>, right: <CloudDiff.FileInfo>, is_valid: <Boolean>})
	async getFileInfos(source_element, args) {
		let left = this.getFileInfo('left', args);
		let right = this.getFileInfo('right', args);

		return {
			left,
			right,
			// Are they both selected, and different?
			is_valid: (left && right && left.id != right.id)
		};
	}

	// Implementations should override this function.
	//
	// Parameters:
	//	left_or_right - "left" | "right"
	// Returns:
	//	Promise(<CloudDiff.FileInfo>)
	//
	getFileInfo(left_or_right, args) {
		throw 'CloudDiff.getFileInfo() not implemented';
	}

};


CloudDiff.FileInfo = class {

	constructor(name, modified, id, fetch_file_text_method, extra) {
		this.name						= name;
		this.modified				= modified;
		this.id							= id;
		this.fetchFileText	= fetch_file_text_method || (async () => {throw 'CloudDiff.FileInfo.fetchFileText() not implemented'});
		this.extra					= extra;
	}

	get label() { return `${this.name} - ${this.modified}` }

	// Augment this.name so that it is descriptive of the revision as well as unique.
	get uniqueName() {
		let dot = this.name.lastIndexOf('.');
		let ext = dot == -1 ? '' : this.name.substr(dot);
		let base = this.name.substr(0, this.name.length - ext.length);

		// Append `id` to ensure uniqueness.
		// Keep extension, in case diff tool can use it.
		return `${base}.${this.modified}.${this.id}${ext}`
			// Sanitize any characters not allowed by file-systems.
			.replace(/[\/\?<>\\:\*\|"^]/g, '_')
			.trim();
	}

};

