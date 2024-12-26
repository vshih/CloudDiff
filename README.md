
# CloudDiff #

This is the source repository for CloudDiff (formerly DropboxDiff).

Compare versions of your Dropbox or pCloud text files in-browser or with your configured diff tool.

Provides two options for comparing different versions of your Dropbox or pCloud files:  1) an external diff tool, or 2) a side-by-side diff within your browser.  This can be TortoiseMerge, KDiff3, FileMerge, or any tool which can be triggered from the command line.

In the "Version history" or "Revisions" page of any file, a column is added which allows you to select two versions to compare.  Click the "Diff" button to trigger your configured diff tool, or the "Inline" button to view the difference in-browser.

Supports Windows, Mac, and Linux as far as I know, though I can't be sure every possible configuration is covered.

Please let me know if you run into any issues at https://blog.vicshih.com/2011/09/clouddiff-chrome-extension.html .


## Latest Release Notes: ##

2024-12-25 update (version 1.0.3.1) - Update to match latest Dropbox, pCloud sites. Allow custom Dropbox app key, since the extension is no longer supported in the Chrome Web Store.


## Installation ##

This extension is no longer available in the Chrome Web Store - it violates Dropbox's terms due to how it modifies their site -
therefore it must be installed as a unpacked extension.

In addition to this, a Dropbox App is required in order to access the Dropbox API.


### Install unpacked extension ###

First, clone this repo locally, or download the ZIP.

Follow the example in https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked.
Use the [/chrome-extension](https://github.com/vshih/CloudDiff/tree/master/chrome-extension) directory as the extension directory to load.

Once the extension is loaded, note the ID assigned to it, visible from the "Manage Extensions" page.  It should be `mclhnicmmbipgddnijniccihmbdlhogb`.
If for some reason it isn't, please get in contact with me.


### Create a Dropbox App ###

Browse to https://www.dropbox.com/developers/apps and click "Create app".

1. For "Choose an API", select "Scoped access".
2. For "Choose the type of access you need", select "Full Dropbox".
3. For "Name your app", enter "CloudDiff".  Or don't, I'm not your boss.
4. Note the "App key" generated; enter this in the extension's Options page as "Dropbox app key".
5. In the Settings > OAuth 2 section, add the Redirect URI `chrome-extension://mclhnicmmbipgddnijniccihmbdlhogb/dropbox/oauth-receiver.html`.
6. In the Permissions > Individual Scopes > Files and folders, check `files.content.read`.
7. Click Submit.

With that, you should be all set.


## Privacy Policy ##

https://github.com/vshih/CloudDiff/blob/master/privacy-policy.md


## Release History ##

2021-06-28 update (version 1.0.2.28) - Handle Dropbox failure earlier.  Button to clear Dropbox token.

2020-06-01 update (version 1.0.2.27) - Upgrade to jQuery 3.5.1, CodeMirror 5.54.0.  Handle OAuth token expiration.  Fix pCloud caching behavior.

2020-05-08 update (version 1.0.2.26) - (never approved) Use Dropbox API to circumvent CORB issue; use the chrome.storage API to store OAuth access token.

2018-02-01 update (version 1.0.2.25) - Rebrand as "CloudDiff."  pCloud support.  Switch from jsdifflib to CodeMirror for inline diff.

2017-04-18 update (version 1.0.2.23) - Update to match latest Dropbox format change.

2017-03-13 update (version 1.0.2.21-22) - Bug fix for diffing non-text files, and files larger than 4K; please get latest "CloudDiff Helper".

2017-01-26 update (version 1.0.2.20) - Implement "Ignore exit status" option.

2017-01-22 update (versions 1.0.2.17-19) - Update installation instructions for Mac/Linux; bug fixes.

2017-01-21 update (version 1.0.2.16) - Support "Load older versions".

2017-01-18 update (version 1.0.2.15) - External diff restored; requires a separate "CloudDiff Helper" installation.

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


## Extension IDs ##

- Production - `hlmlielnekakcdfpkbgcpnphenleogfp`
- Development - `mclhnicmmbipgddnijniccihmbdlhogb`


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

- [TODO.md](TODO.md)


## References ##

- https://codemirror.net
- https://github.com/google/diff-match-patch
- https://github.com/claviska/jquery-alertable
- https://stackoverflow.com/questions/9602022/chrome-extension-retrieving-gmails-original-message
- https://www.techtalkz.com/microsoft-office-word/172251-invoking-compare-merge-command-line.html
- https://daviddeley.com/autohotkey/parameters/parameters.htm#WIN
- https://ss64.com/nt/cmd.html
- https://ss64.com/nt/start.html
- https://www.iconarchive.com/show/aesthetica-2-icons-by-dryicons/search-icon.html

