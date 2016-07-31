
'use strict';

var App = {
	init: function () {
		var win = nw.Window.get();

		$('#dropbox').on('load', function () {
			if (this.contentWindow.location.pathname.indexOf('/history/') === 0) {
				var $dropbox = $(this).contents();
				App.attach($dropbox);
				//win.showDevTools();
			}
		});

		win.maximize();
	},

	attach: function ($dropbox) {
		$dropbox.find('.file-revisions-page__content .file-revisions__row_fake_wrapper_col').each(function () {
			$(this).prepend(`
				<div class="file-revisions__row__col" style="width: 50px">
					<input type="radio" onclick="return false"/>
					<input type="radio" onclick="return false"/>
				</div>
			`);
		});
	}
};


App.init();



//exec('mintty');

	/*
$('#dropbox').load(function () {
var child_process = require('child_process');
var exec = child_process.exec;
	let $dropbox = $(this).contents();
	$dropbox.find('#dropbox-logo').hide(); //.css('border', '1px solid red');
});
	*/

