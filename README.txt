
TODO:
	- Extension
		+ Options page
			+ Add example:
				+ bash -c '"$HOME/bin/tkdiff" $1 $2'
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

Current Version Release Notes:

2016-01-05 update (version 1.0.2.14) - Inline diff restored; external diff support coming soon.  Removed NPAPI requirement, since it is no longer supported.


Provides two options for comparing different versions of your Dropbox files:  1) a side-by-side diff within your browser, or 2) an external diff tool (to be restored soon).  This can be TortoiseMerge, kdiff3, FileMerge, or any tool which can be triggered from a command line.

In the "Previous versions" view of the Dropbox web interface of any file, a column is added which allows you to select two versions to compare.  Click the "Inline Diff" button to view the difference in-browser, or the Diff button to trigger your configured diff tool.

Supports Windows, Mac, and Linux as far as I know, though I can't be sure every possible configuration is covered.

Please let me know if you run into any issues at http://blog.vicshih.com/2011/09/dropboxdiff-chrome-extension.html .


Release History:

2014-01-05 update (version 1.0.2.13) - Inline diff implemented.

2014-01-04 update (version 1.0.2.12) - Account for "sjid" parameter in any position.  Distinguish Diff button better.

2013-06-23 update (version 1.0.2.11) - Switch from background page to event page.

2013-01-05 update (version 1.0.2.10) - Fixed to support 64-bit linux.  Added a Test button to the options page.

2012-11-05 update (version 1.0.2.9) - Fix for Mac - upgraded to FireBreath 1.7 (774c948f5e).

2012-08-31 update (version 1.0.2.8) - Better content security policy settings, upgrade to jQuery 1.8.0.

2012-08-31 update (version 1.0.2.7) - Update to manifest version 2.

2012-06-24 update (version 1.0.2.6) - Handle site change (table header removed).

2011-09-12 update (version 1.0.2.4) - Added extension description. Added example cygwin command line for Windows.

Votebox
=======
I've just written DropboxDiff, a Chrome extension to do just this. Requires Google Chrome and an installed diff tool.

Get it here:  https://chrome.google.com/webstore/detail/aefdkgcdokdiaoppobphjogcilaaakka

Comments can be left at http://blog.vicshih.com/2011/09/dropboxdiff-chrome-extension.html .


Forum
=====
I've just written <a href="https://chrome.google.com/webstore/detail/aefdkgcdokdiaoppobphjogcilaaakka">DropboxDiff</a>, a Chrome extension to do just this. Requires Google Chrome and an installed diff tool.

Comments can be left at <a href="http://blog.vicshih.com/2011/09/dropboxdiff-chrome-extension.html">http://blog.vicshih.com/2011/09/dropboxdiff-chrome-extension.html</a>.


Wiki
====
= DropboxDiff =

I've written [[https://chrome.google.com/webstore/detail/aefdkgcdokdiaoppobphjogcilaaakka|DropboxDiff]], a Google Chrome extension which triggers your custom diff tool to compare different versions of your text files on Dropbox.  Can be initiated from the "Previous versions" view of any one of your text files on the Dropbox website.

Please leave any comments at [[http://blog.vicshih.com/2011/09/dropboxdiff-chrome-extension.html|blog.vicshih.com]].


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

Updating FireBreath
===================
- https://groups.google.com/forum/?fromgroups=#!topic/firebreath-dev/-XIhxC9-aY4

References:
- http://www.firebreath.org/display/documentation/FireBreath+Home
- http://www.softagalleria.net/dirent.php
- http://www.techtalkz.com/microsoft-office-word/172251-invoking-compare-merge-command-line.html
- http://ss64.com/nt/cmd.html
- http://ss64.com/nt/start.html
- http://www.iconarchive.com/show/aesthetica-2-icons-by-dryicons/search-icon.html

