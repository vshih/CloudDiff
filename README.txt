
TODO:
	- Extension
		+ Options page
			- File extension-specific command configuration
		- Progress bars
		+ Screenshots

		+ Icons
		+ Minimum browser version
		+ Rename files being diffed

	- NPAPI
		- Documentation
		- Dialog confirming initial command execution
		+ Mac universal binary?
		+ Linux
		+ Spawn/fork process rather than using system()
		+ Diff command environment variable substitution?
		+ Version tracking
		+ Makefile (cmake?) (no)
		+ Rename plugin
		+ Compute extension ID using chrome.extension.getURL()
		+ Debug mode
		+ Delete beacon file

	+ Source control

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
Dropbox, diff, compare, comparison, version, versioning

Detailed description
--------------------
Opens your custom "diff" tool to compare file versions on Dropbox.  This can be TortoiseMerge, kdiff3, FileMerge, or any tool which can be triggered from a command line.

In the "Previous versions" view of the Dropbox web interface of any file, a column is added which allows you to select two versions to compare.  Click the Diff button, and your configured diff tool will open, once the versions have been downloaded.

Supports Windows, Mac, and Linux as far as I know, though I can't be sure every possible configuration is covered.  Please let me know if you run into any issues.

Documentation
=============
Sandbox resolution:
+ Beacon
	+ On plugin startup
		+ Write a beacon file in the Chrome sandbox
		+ Pass beacon name to the NPAPI plugin
		+ Plugin searches known sandbox directory for directory beacon
	+ Change to beacon file directory before executing diff

NPAPI implementation plugin
- Dialog to confirm, the first time
- Store current cmd line securely


Building
========
Mac
	xcodebuild -configuration MinSizeRel

Windows
	vcbuild -configuration MinSizeRel

Linux
	make

leveldb - change CC line to: CC = g++ -arch x86_64 for optimized builds on mac
lipo libleveldb-* -create -output libleveldb.a

References:
- http://www.firebreath.org/display/documentation/FireBreath+Home
- http://www.softagalleria.net/dirent.php
- http://www.techtalkz.com/microsoft-office-word/172251-invoking-compare-merge-command-line.html
- http://ss64.com/nt/cmd.html
- http://ss64.com/nt/start.html
- http://www.iconarchive.com/show/aesthetica-2-icons-by-dryicons/search-icon.html

