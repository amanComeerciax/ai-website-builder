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

function TreeNode({ name, node, depth = 0, onContextMenu }) {
    const { activeFile, setActiveFile } = useEditorStore()
    const [isOpen, setIsOpen] = useState(true)

    const handleRightClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onContextMenu) onContextMenu(e, node.__path || name, !!node.__isFile);
    }

    if (node.__isFile) {
        const isActive = activeFile === node.__path
        return (
            <div
                className={`ft-file ${isActive ? 'ft-file-active' : ''}`}
                style={{ paddingLeft: `${12 + depth * 16}px` }}
                onClick={() => setActiveFile(node.__path)}
                onContextMenu={handleRightClick}
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
                        <TreeNode 
                            key={childName} 
                            name={childName} 
                            node={childNode} 
                            depth={depth + 1} 
                            onContextMenu={onContextMenu} 
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default function FileTree() {
    const { files, renameFile, deleteFile } = useEditorStore()
    const tree = buildTree(files)
    
    // Context menu state
    const [contextMenu, setContextMenu] = useState(null)

    // Close context menu on outside click
    const closeMenu = () => setContextMenu(null)

    const handleContextMenu = (e, path, isFile) => {
        setContextMenu({
            x: e.pageX,
            y: e.pageY,
            path,
            isFile
        })
    }

    const onRename = () => {
        if (!contextMenu) return;
        const oldName = contextMenu.path.split('/').pop()
        const newName = window.prompt(`Rename ${oldName} to:`, oldName);
        if (newName && newName !== oldName) {
            const parts = contextMenu.path.split('/')
            parts[parts.length - 1] = newName
            renameFile(contextMenu.path, parts.join('/'))
        }
        closeMenu()
    }

    const onDelete = () => {
        if (!contextMenu) return;
        const isConfirmed = window.confirm(`Are you sure you want to delete ${contextMenu.path}?`)
        if (isConfirmed) {
            deleteFile(contextMenu.path)
            // Note: If it's a directory, this basic deleteFile won't recursively delete files.
            // Ideally, the AI handles directories, but for now we only support file deletion.
        }
        closeMenu()
    }

    return (
        <div className="file-tree" onClick={closeMenu}>
            <div className="ft-header">Files</div>
            <div className="ft-content">
                {Object.entries(tree).map(([name, node]) => (
                    <TreeNode 
                        key={name} 
                        name={name} 
                        node={node} 
                        depth={0} 
                        onContextMenu={handleContextMenu} 
                    />
                ))}
            </div>

            {/* Context Menu Overlay */}
            {contextMenu && (
                <div 
                    className="ft-context-menu"
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        zIndex: 1000,
                        background: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        padding: '4px',
                        minWidth: '140px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {contextMenu.isFile ? (
                        <>
                            <button className="ft-cm-btn" onClick={onRename}>Rename</button>
                            <button className="ft-cm-btn ft-cm-danger" onClick={onDelete}>Delete</button>
                        </>
                    ) : (
                        <div style={{ padding: '8px', fontSize: '12px', color: '#888' }}>Folder options disabled</div>
                    )}
                </div>
            )}
        </div>
    )
}
