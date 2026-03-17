import { useState } from 'react'
import { ChevronRight, ChevronDown, FileCode, FileText, FileJson, File as FileIcon, Folder, FolderOpen } from 'lucide-react'
import { useEditorStore } from '../../stores/editorStore'
import './FileTree.css'

// Map file extensions to icons
const getFileIcon = (filename) => {
    const ext = filename.split('.').pop()
    switch (ext) {
        case 'jsx': case 'tsx': case 'js': case 'ts':
            return <FileCode size={14} className="ft-icon ft-icon-js" />
        case 'css': case 'scss':
            return <FileCode size={14} className="ft-icon ft-icon-css" />
        case 'html':
            return <FileCode size={14} className="ft-icon ft-icon-html" />
        case 'json':
            return <FileJson size={14} className="ft-icon ft-icon-json" />
        case 'md':
            return <FileText size={14} className="ft-icon ft-icon-md" />
        default:
            return <FileIcon size={14} className="ft-icon" />
    }
}

// Build nested tree from flat paths
const buildTree = (files) => {
    const tree = {}
    Object.keys(files).sort().forEach((path) => {
        const parts = path.split('/')
        let current = tree
        parts.forEach((part, i) => {
            if (i === parts.length - 1) {
                // File
                current[part] = { __isFile: true, __path: path }
            } else {
                // Directory
                if (!current[part]) current[part] = {}
                current = current[part]
            }
        })
    })
    return tree
}

function TreeNode({ name, node, depth = 0 }) {
    const { activeFile, setActiveFile } = useEditorStore()
    const [isOpen, setIsOpen] = useState(true)

    if (node.__isFile) {
        const isActive = activeFile === node.__path
        return (
            <div
                className={`ft-file ${isActive ? 'ft-file-active' : ''}`}
                style={{ paddingLeft: `${12 + depth * 16}px` }}
                onClick={() => setActiveFile(node.__path)}
            >
                {getFileIcon(name)}
                <span>{name}</span>
            </div>
        )
    }

    // Directory
    const entries = Object.entries(node).filter(([k]) => !k.startsWith('__'))
    return (
        <div className="ft-dir">
            <div
                className="ft-dir-header"
                style={{ paddingLeft: `${12 + depth * 16}px` }}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen
                    ? <ChevronDown size={12} className="ft-chevron" />
                    : <ChevronRight size={12} className="ft-chevron" />
                }
                {isOpen
                    ? <FolderOpen size={14} className="ft-folder-icon" />
                    : <Folder size={14} className="ft-folder-icon" />
                }
                <span>{name}</span>
            </div>
            {isOpen && (
                <div className="ft-dir-children">
                    {entries.map(([childName, childNode]) => (
                        <TreeNode key={childName} name={childName} node={childNode} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default function FileTree() {
    const { files } = useEditorStore()
    const tree = buildTree(files)

    return (
        <div className="file-tree">
            <div className="ft-header">Files</div>
            <div className="ft-content">
                {Object.entries(tree).map(([name, node]) => (
                    <TreeNode key={name} name={name} node={node} depth={0} />
                ))}
            </div>
        </div>
    )
}
