import { useState } from 'react'
import { 
    Lightbulb, ChevronRight, ChevronDown, 
    RefreshCw, Package, FileEdit, FilePlus 
} from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import './DetailsPanel.css'

export default function DetailsPanel() {
    const { isGenerating, generationPhase, generationLogs } = useChatStore()
    const [isThoughtExpanded, setIsThoughtExpanded] = useState(false)
    const [expandedFiles, setExpandedFiles] = useState({})

    const toggleFile = (idx) => {
        setExpandedFiles(prev => ({ ...prev, [idx]: !prev[idx] }))
    }

    const getLogIcon = (type) => {
        switch (type) {
            case 'Reading': return <RefreshCw size={16} className="dp-gray" />
            case 'Installing': return <Package size={16} className="dp-blue" />
            case 'Editing': return <FileEdit size={16} className="dp-green" />
            case 'Creating': return <FilePlus size={16} className="dp-teal" />
            default: return null
        }
    }

    // Static mock diff for demonstration
    const mockDiff = `@@ -12,4 +12,6 @@
 import { useAuthStore } from './stores/authStore'
 
-export default function Header() {
-    const user = null
+export default function Header({ title }) {
+    const { user } = useAuthStore()
+    const [isOpen, setIsOpen] = useState(false)
`

    const renderDiffLine = (line, idx) => {
        if (line.startsWith('-')) {
            return (
                <div key={idx} className="dp-diff-line dp-diff-removed">
                    <span className="dp-line-num">{idx + 1}</span>
                    <span className="dp-line-content">&minus; {line.substring(1)}</span>
                </div>
            )
        }
        if (line.startsWith('+')) {
            return (
                <div key={idx} className="dp-diff-line dp-diff-added">
                    <span className="dp-line-num">{idx + 1}</span>
                    <span className="dp-line-content">+ {line.substring(1)}</span>
                </div>
            )
        }
        if (line.startsWith('@@')) {
            return (
                <div key={idx} className="dp-diff-line dp-diff-header">
                    <span className="dp-line-num"></span>
                    <span className="dp-line-content">{line}</span>
                </div>
            )
        }
        return (
            <div key={idx} className="dp-diff-line">
                <span className="dp-line-num">{idx + 1}</span>
                <span className="dp-line-content">  {line}</span>
            </div>
        )
    }

    return (
        <div className="details-panel">
            {/* Top Thought Section */}
            {(isGenerating || generationPhase !== 'idle') && (
                <div className="dp-top-section">
                    <div 
                        className="dp-thought-row" 
                        onClick={() => setIsThoughtExpanded(!isThoughtExpanded)}
                    >
                        <Lightbulb size={16} className="dp-gray" />
                        <span>Thought for 2s</span>
                        {isThoughtExpanded ? <ChevronDown size={14} className="dp-chevron" /> : <ChevronRight size={14} className="dp-chevron" />}
                    </div>

                    <div className={`dp-thought-box ${isThoughtExpanded ? 'expanded' : ''}`}>
                        I need to update the application routing and install the lucide-react icons based on the user's prompt. 
                        I will read App.jsx, add the import, modify Header.jsx to accept props, and create Button.jsx to finish the layout transition.
                    </div>
                </div>
            )}

            {/* File Operations List */}
            <div className="dp-files-list">
                {generationLogs.map((log, idx) => {
                    const isExpandable = log.type === 'Editing' || log.type === 'Creating'
                    const isExpanded = expandedFiles[idx]

                    return (
                        <div key={idx} className="dp-file-item">
                            {/* Row */}
                            <div 
                                className={`dp-file-row ${isExpandable ? 'clickable' : ''}`}
                                onClick={() => isExpandable && toggleFile(idx)}
                            >
                                <div className="dp-file-left">
                                    {getLogIcon(log.type)}
                                    <span className="dp-action-label">
                                        {log.type === 'Reading' ? 'Read' : 
                                         log.type === 'Installing' ? 'Installed' : 
                                         log.type === 'Editing' ? 'Edited' : 'Created'}
                                    </span>
                                    <span className="dp-file-badge">{log.file}</span>
                                </div>
                                {isExpandable && (
                                    isExpanded ? <ChevronDown size={14} className="dp-chevron" /> : <ChevronRight size={14} className="dp-chevron" />
                                )}
                            </div>

                            {/* Diff View */}
                            {isExpandable && isExpanded && (
                                <div className="dp-diff-container">
                                    <div className="dp-diff-code">
                                        {mockDiff.split('\n').map((line, i) => renderDiffLine(line, i))}
                                    </div>
                                    <div className="dp-diff-footer">
                                        <button className="dp-show-more-link">Show more</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
            
            {generationLogs.length === 0 && generationPhase === 'idle' && (
                <div className="dp-empty">
                    <span>No active generation</span>
                    <p>Submit a prompt to see AI file operations here.</p>
                </div>
            )}
        </div>
    )
}
