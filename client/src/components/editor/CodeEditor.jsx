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
    const { files, activeFile, openTabs, setActiveFile, closeTab, setFile } = useEditorStore()

    const content = activeFile ? (files[activeFile]?.content || '') : ''
    const language = getLanguage(activeFile)

    const handleEditorChange = (value) => {
        if (activeFile && value !== undefined) {
            setFile(activeFile, value)
        }
    }

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
