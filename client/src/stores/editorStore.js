import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Demo files to render when no project is loaded yet
const DEMO_FILES = {
    'App.jsx': {
        content: `import React from 'react';

export default function App() {
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#0a0a0a', 
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ 
        fontSize: '3rem', 
        background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        Welcome to StackForge
      </h1>
      <p style={{ color: '#888', marginTop: '1rem' }}>Built with StackForge AI ⚡</p>
      <button 
        onClick={() => alert('Ready to build!')}
        style={{
          marginTop: '2rem',
          padding: '12px 32px',
          background: '#3b82f6',
          border: 'none',
          borderRadius: '8px',
          color: 'white',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        Get Started
      </button>
    </div>
  );
}`,
    },
}

export const useEditorStore = create(
    persist(
        (set, get) => ({
            // ── File System ──
            files: { ...DEMO_FILES },

            // ── Active State ──
            activeFile: 'App.jsx',
            openTabs: ['App.jsx'],

            // ── Preview State ──
            isPreviewReady: true,
            previewError: null,

            // ── Actions: File Management ──
            setFile: (path, content) =>
                set((state) => ({
                    files: { ...state.files, [path]: { content } },
                })),

            deleteFile: (path) =>
                set((state) => {
                    const newFiles = { ...state.files }
                    delete newFiles[path]
                    const newTabs = state.openTabs.filter((t) => t !== path)
                    return {
                        files: newFiles,
                        openTabs: newTabs,
                        activeFile: state.activeFile === path ? (newTabs[0] || null) : state.activeFile,
                    }
                }),

            setFiles: (fileMap) => set({ files: fileMap }),

            getFileContent: (path) => get().files[path]?.content || '',

            // ── Actions: Tab Management ──
            setActiveFile: (path) =>
                set((state) => ({
                    activeFile: path,
                    openTabs: state.openTabs.includes(path)
                        ? state.openTabs
                        : [...state.openTabs, path],
                })),

            closeTab: (path) =>
                set((state) => {
                    const newTabs = state.openTabs.filter((t) => t !== path)
                    return {
                        openTabs: newTabs,
                        activeFile:
                            state.activeFile === path
                                ? newTabs[newTabs.length - 1] || null
                                : state.activeFile,
                    }
                }),

            // ── Actions: Preview ──
            setPreviewReady: (ready) => set({ isPreviewReady: ready }),
            setPreviewError: (error) => set({ previewError: error }),

            // ── Actions: Bulk Load (from AI generation) ──
            loadGeneratedFiles: (generatedFiles) =>
                set((state) => {
                    const fileMap = {}
                    const tabs = []
                    
                    // Input can be { path: content } or { path: { content } }
                    // Handle Object.entries from AI worker payload: { "files": { "path": "content" } }
                    if (!Array.isArray(generatedFiles)) {
                        Object.entries(generatedFiles).forEach(([path, content]) => {
                            const cleanContent = typeof content === 'string' ? content : (content.content || '');
                            fileMap[path] = { content: cleanContent }
                            tabs.push(path)
                        })
                    } else {
                        generatedFiles.forEach((f) => {
                            fileMap[f.path] = { content: f.content }
                            tabs.push(f.path)
                        })
                    }

                    return {
                        files: fileMap,
                        openTabs: tabs.length > 0 ? [tabs[0]] : [],
                        activeFile: tabs[0] || null,
                        isPreviewReady: true,
                        previewError: null,
                    }
                }),

            // ── Reset ──
            reset: () =>
                set({
                    files: { ...DEMO_FILES },
                    activeFile: 'App.jsx',
                    openTabs: ['App.jsx'],
                    isPreviewReady: true,
                    previewError: null,
                }),
        }),
        {
            name: 'stackforge-vfs-storage', // Persistence Key
        }
    )
)

