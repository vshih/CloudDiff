
import { highlightSpecialChars, lineNumbers } from '@codemirror/view'

//import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
//import { javascript } from '@codemirror/lang-javascript'
//import { python } from '@codemirror/lang-python'


export const codeMirrorSetup = (() => [
	highlightSpecialChars(),
	lineNumbers(),
	//syntaxHighlighting(defaultHighlightStyle, {fallback: true}),
	//javascript(),
	//python(),
])();

export { EditorView } from '@codemirror/view'

