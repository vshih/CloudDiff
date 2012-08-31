function populate_examples() {
	var appVersion = navigator.appVersion;

	var eg;

	if (appVersion.indexOf('Mac') != -1) {
		eg = [
			'opendiff',
			'/usr/local/bin/mvim -d'
		];
	}
	else if (appVersion.indexOf('Linux') != -1) {
		eg = [
			'gvim -d',
			'kdiff3'
		];
	}
	else {
		eg = [
			'"%ProgramFiles%\\TortoiseSVN\\bin\\TortoiseMerge.exe"',
			'"%ProgramFiles%\\KDiff3\\kdiff3.exe"',
			'bash -c \'"$HOME/bin/tkdiff" $1 $2\''
		];
	}

	examples.innerHTML = '<li>' + eg.join('<li>');
}

function init() {
	populate_examples();
	restore_options();

	// Set up change handler
	var inputs = [
		cmd
	];

	for (var i in inputs) { inputs[i].onchange = onchange }
}

// Read from localStorage
function restore_options() {
	cmd.value = localStorage.cmd || '';
}

function onchange() {
	save_options();
}

function save_options() {
	localStorage.cmd = cmd.value;

	// Show feedback
	saved.className = 'show';
	setTimeout(function() { saved.className = '' }, 1200);
}

window.onload = init;

