
# TODO

1. Allow escaping "$1", "$2" in command
1. Top bar
    1. CodeMirror-option checkboxes
    1. Prev/next buttons
    1. ~~File info~~
    1. ~~Close box~~
1. Modes
    1. Mode-specific options?
    1. ~~Only right-pane working~~
1. Themes?
    1. Loadable?
1. pCloud
    1. ~~Fix external diff parameters~~
    1. ~~Move diff buttons to top nav bar~~
1. ~~Fix jsdifflib layout~~
1. ~~Different diff engine - https://stackoverflow.com/questions/3053587/javascript-based-diff-utility~~
    1. ~~CodeMirror~~
        1. ~~Syntax highlighting~~
    1. ~~http://cacycle.altervista.org/wikEd-diff-tool.html~~
    1. ~~Mergely~~
    1. ~~http://qiao.github.io/difflib.js/~~
    1. ~~http://prettydiff.com/~~
1. ~~Debug diffy.org~~
    1. ~~bash -c 'cygstart https://diffy.org$(diff $1 $2 | curl -is https://diffy.org/new -F "udiff=<-" | bash -c "grep ^Location:" | bash -c "cut -d\" \" -f2")'~~

