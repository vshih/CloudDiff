
# README #

Compare versions of your Dropbox files in-browser or with your configured diff tool. Trigger from any "Version history" page.


## Current Version Release Notes: ##

2017-01-26 update (version 1.0.2.20) - Implement "Ignore exit status" option.

2017-01-22 update (versions 1.0.2.17-19) - Update installation instructions for Mac/Linux; bug fixes.

2017-01-21 update (version 1.0.2.16) - Support "Load older versions".


Provides two options for comparing different versions of your Dropbox files:  1) an external diff tool, or 2) a side-by-side diff within your browser.  This can be TortoiseMerge, KDiff3, FileMerge, or any tool which can be triggered from the command line.

From www.dropbox.com, in the "Version history" of any file, a column is added which allows you to select two versions to compare.  Click the "Diff" button to trigger your configured diff tool, or the "Inline" button to view the difference in-browser.

Supports Windows, Mac, and Linux as far as I know, though I can't be sure every possible configuration is covered.

Please let me know if you run into any issues at http://blog.vicshih.com/2011/09/dropboxdiff-chrome-extension.html .


## Release History ##

2017-01-18 update (version 1.0.2.15) - External diff restored; requires a separate "DropboxDiff Helper" installation.

2017-01-05 update (version 1.0.2.14) - Inline diff restored; external diff support coming soon.  Removed NPAPI requirement, since it is no longer supported.

2014-01-05 update (version 1.0.2.13) - Inline diff implemented.

2014-01-04 update (version 1.0.2.12) - Account for "sjid" parameter in any position.  Distinguish Diff button better.

2013-06-23 update (version 1.0.2.11) - Switch from background page to event page.

2013-01-05 update (version 1.0.2.10) - Fixed to support 64-bit linux.  Added a Test button to the options page.

2012-11-05 update (version 1.0.2.9) - Fix for Mac - upgraded to FireBreath 1.7 (774c948f5e).

2012-08-31 update (version 1.0.2.8) - Better content security policy settings, upgrade to jQuery 1.8.0.

2012-08-31 update (version 1.0.2.7) - Update to manifest version 2.

2012-06-24 update (version 1.0.2.6) - Handle site change (table header removed).

2011-09-12 update (version 1.0.2.4) - Added extension description. Added example cygwin command line for Windows.


# Development Notes #


## Event Sequences ##

### Inital page load - content script
1. Script tag containing initial "revisions" rendered
2. document.ready
    1. Parse "revisions" into REV\_MAP
3. React ready (via mutation observer)
    1. Revisions table rendered
    2. Radio buttons added
4. injectScript() called


### "Load older versions" clicked
1. ajaxSuccess fires, with new "revisions" data in response (dropbox.com page)
    1. Send "revisions" data to content script via custom event
    2. Content script adds info to REV\_MAP
2. React adds rows to revisions table
    1. Mutation observer fires
        1. Content script adds new radio buttons


### Diff clicked
1. Compute sjid from revisions table
2. Lookup file URLs from REV\_MAP via sjids
3. Trigger diff


## TODO ##
- Extension
  - Update screenshots
  - Options page
    - File extension-specific command configuration
  - Progress bars


## References ##

- https://github.com/cemerick/jsdifflib
- https://github.com/claviska/jquery-alertable
- http://stackoverflow.com/questions/9602022/chrome-extension-retrieving-gmails-original-message
- http://www.techtalkz.com/microsoft-office-word/172251-invoking-compare-merge-command-line.html
- http://daviddeley.com/autohotkey/parameters/parameters.htm#WIN
- http://ss64.com/nt/cmd.html
- http://ss64.com/nt/start.html
- http://www.iconarchive.com/show/aesthetica-2-icons-by-dryicons/search-icon.html

