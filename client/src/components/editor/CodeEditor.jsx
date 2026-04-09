import { useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { X } from 'lucide-react'
import { useEditorStore } from '../../stores/editorStore'
import './CodeEditor.css'

// Map file extension → Monaco language
const getLanguage = (filename) => {
    if (!filename) return 'plaintext'
    const ext = filename.split('.').pop()
    const map = {
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        css: 'css',
        scss: 'scss',
        html: 'html',
        json: 'json',
        md: 'markdown',
        py: 'python',
        xml: 'xml',
        svg: 'xml',
    }
    return map[ext] || 'plaintext'
}

export default function CodeEditor() {
    const { files, activeFile, openTabs, setActiveFile, closeTab, setFile, codeHighlightSearch } = useEditorStore()
    const editorRef = useRef(null)

    const content = activeFile ? (files[activeFile]?.content || '') : ''
    const language = getLanguage(activeFile)

    const handleEditorChange = (value) => {
        if (activeFile && value !== undefined) {
            setFile(activeFile, value)
        }
    }

    const handleEditorDidMount = (editor) => {
        editorRef.current = editor
    }

    // When codeHighlightSearch changes, find and highlight the matching text
    useEffect(() => {
        if (!codeHighlightSearch || !editorRef.current) return
        
        const editor = editorRef.current
        const model = editor.getModel()
        if (!model) return

        // Search for the opening tag in the code
        const searchStr = codeHighlightSearch
        const matches = model.findMatches(searchStr, false, false, true, null, true)
        
        if (matches.length > 0) {
            const match = matches[0]
            // Reveal and highlight the match
            editor.revealLineInCenter(match.range.startLineNumber)
            editor.setSelection(match.range)
            editor.focus()
        }

        // Clear after use
        useEditorStore.setState({ codeHighlightSearch: null })
    }, [codeHighlightSearch])

    return (
        <div className="code-editor">
            {/* Tab Bar */}
            <div className="ce-tabs">
                {openTabs.map((tab) => (
                    <div
                        key={tab}
                        className={`ce-tab ${tab === activeFile ? 'ce-tab-active' : ''}`}
                        onClick={() => setActiveFile(tab)}
                    >
                        <span className="ce-tab-name">{tab.split('/').pop()}</span>
                        <button
                            className="ce-tab-close"
                            onClick={(e) => { e.stopPropagation(); closeTab(tab) }}
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Monaco Editor */}
            <div className="ce-editor-wrapper">
                {activeFile ? (
                    <Editor
                        height="100%"
                        language={language}
                        value={content}
                        onChange={handleEditorChange}
                        onMount={handleEditorDidMount}
                        theme="vs-dark"
                        options={{
                            fontSize: 13,
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            padding: { top: 12 },
                            lineNumbers: 'on',
                            renderLineHighlight: 'line',
                            smoothScrolling: true,
                            cursorBlinking: 'smooth',
                            tabSize: 2,
                            wordWrap: 'on',
                            automaticLayout: true,
                            bracketPairColorization: { enabled: true },
                        }}
                    />
                ) : (
                    <div className="ce-empty">
                        <p>Select a file to start editing</p>
                    </div>
                )}
            </div>
        </div>
    )
}
