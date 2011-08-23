
TODO:
	- Source control

	- Extension
		+ Options page
			- File extension-specific command configuration
		- Progress bars
		- Screenshots

		+ Icons
		+ Minimum browser version
		+ Rename files being diffed

	- NPAPI
		- Documentation
		- Mac universal binary?
		- Dialog confirming initial command execution
		+ Linux
		+ Spawn/fork process rather than using system()
		+ Diff command environment variable substitution?
		+ Version tracking
		+ Makefile (cmake?) (no)
		+ Rename plugin
		+ Compute extension ID using chrome.extension.getURL()
		+ Debug mode
		+ Delete beacon file

Info
====
DropboxDiff Plug-in
DropboxDiffPlugin
DDP
application/x-dropbox-diff-plugin
Plug-in to support DropboxDiff Chrome extension
Victor Shih
VictorShih
vicshih.com


Additional categories
dropbox, diff, compare, comparison

Detailed description
--------------------
Triggers your customized "diff" tool to compare files on Dropbox.

In the "Previous versions" view of the Dropbox web interface, a column is added which allows you to select which versions to compare.  Click the added "Diff" button, and your configured diff tool will open, once the versions have been downloaded.

Requires an installed comparison tool, such as TortoiseMerge, KDiff3, etc.

Documentation
=============
Sandbox resolution:
- Beacon
	- On plugin startup
		- Write a beacon file in the Chrome sandbox
		- Pass beacon name to the NPAPI plugin
		- Plugin searches known sandbox directory for directory beacon
	- Change to beacon file directory before executing diff

NPAPI implementation plugin
- Dialog to confirm, the first time
- Store current cmd line securely

References:
- http://www.firebreath.org/display/documentation/FireBreath+Home
- http://www.softagalleria.net/dirent.php
- http://www.techtalkz.com/microsoft-office-word/172251-invoking-compare-merge-command-line.html
- http://ss64.com/nt/cmd.html
- http://ss64.com/nt/start.html
- http://www.iconarchive.com/show/aesthetica-2-icons-by-dryicons/search-icon.html

