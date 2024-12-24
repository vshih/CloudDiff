
# TODO

- Upgrade and annotate Dropbox-SDK version (currently https://github.com/dropbox/dropbox-sdk-js/releases/tag/v4.0.30)
    - Update auth to implement PKCE and downgrade from implicit grant
        - https://developers.dropbox.com/oauth-guide
        - https://github.com/dropbox/dropbox-sdk-js/blob/main/examples/javascript/pkce-browser/index.html
- Upgrade jQuery
- Make "nativeMessaging" permission optional
- Jump to first diff in inline diff
- Options page
    - File extension-specific command configuration
- Progress bars
- Top bar
    - CodeMirror-option checkboxes
    - Prev/next buttons
    - ~~File info~~
    - ~~Close box~~
- Modes
    - Mode-specific options?
    - ~~Only right-pane working~~
- Themes?
    - Loadable?
- Helper
    - Allow escaping "$1", "$2" in command
    - Ask for confirmation before uninstalling
    - Document `EXTENSION_ID` environment variable input
    - Add status option which shows `EXTENSION_ID`, working directory location, etc.


## Done

- ~~Redirect clouddiff.vicshih.com over HTTPS~~
    - [x] ~~Back to nearlyfreespeech.net? - $3.65/yr~~
    - ~~Namecheap.com shared hosting - $18.96-$22.56/yr~~
    - ~~https://go.vicshih.com/3xiVh3Y ?~~
- ~~Button to clear auth~~
- ~~Simplify busy pointer~~
- ~~Handle Dropbox OAuth token expiration~~
- ~~Fix busy-cursor~~
- ~~pCloud~~
    - ~~Fix external diff parameters~~
    - ~~Move diff buttons to top nav bar~~
- ~~Fix jsdifflib layout~~
- ~~Different diff engine - https://stackoverflow.com/questions/3053587/javascript-based-diff-utility~~
    - ~~CodeMirror~~
        - ~~Syntax highlighting~~
    - ~~http://cacycle.altervista.org/wikEd-diff-tool.html~~
    - ~~Mergely~~
    - ~~http://qiao.github.io/difflib.js/~~
    - ~~http://prettydiff.com/~~
- ~~Debug diffy.org~~
    - ~~bash -c 'cygstart https://diffy.org$(diff $1 $2 | curl -is https://diffy.org/new -F "udiff=<-" | bash -c "grep ^Location:" | bash -c "cut -d\" \" -f2")'~~

