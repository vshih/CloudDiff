
# TODO

- Jump to first diff in inline diff
- Make "nativeMessaging" permission optional
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

