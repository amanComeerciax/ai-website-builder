import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Empty default — no files until AI generates them.
// The right panel is hidden until generation completes, so no demo needed.
const EMPTY_FILES = {}

export const useEditorStore = create(
    persist(
        (set, get) => ({
            activeProjectId: null,
            projectData: {}, // { [projectId]: { files, activeFile, openTabs } }

            // ── File System ──
            files: { ...EMPTY_FILES },

            // ── Preview ──
            previewType: 'sandpack',   // 'srcdoc' (Track A HTML) | 'sandpack' (Track B Next.js)
            htmlContent: null,         // raw HTML string for srcdoc mode
            tunnelUrl: null,           // live URL from CLI tunnel

            // ── Active State ──
            activeFile: 'App.jsx',
            openTabs: ['App.jsx'],

            _sync: (updater) => set((state) => {
                const updates = typeof updater === 'function' ? updater(state) : updater;
                const nextState = { ...state, ...updates };
                if (nextState.activeProjectId) {
                    const newProjectData = { ...nextState.projectData };
                    newProjectData[nextState.activeProjectId] = {
                        files: nextState.files,
                        activeFile: nextState.activeFile,
                        openTabs: nextState.openTabs
                    };
                    updates.projectData = newProjectData;
                }
                return updates;
            }),

            loadProject: (projectId) => set((state) => {
                const newProjectData = { ...state.projectData };
                
                if (state.activeProjectId && state.activeProjectId !== projectId) {
                    newProjectData[state.activeProjectId] = {
                        files: state.files,
                        activeFile: state.activeFile,
                        openTabs: state.openTabs,
                    };
                }
                
                const data = newProjectData[projectId];

                if (data) {
                    return {
                        activeProjectId: projectId,
                        projectData: newProjectData,
                        files: data.files || { ...EMPTY_FILES },
                        activeFile: data.activeFile || 'App.jsx',
                        openTabs: data.openTabs || ['App.jsx'],
                        isPreviewReady: true,
                        previewError: null
                    };
                } else {
                    // Safety check for legacy states missing projectData during migration
                    if (state.activeProjectId === projectId && Object.keys(state.files).length > 1) {
                        return { projectData: newProjectData };
                    }
                    return {
                        activeProjectId: projectId,
                        projectData: newProjectData,
                        files: { ...EMPTY_FILES },
                        activeFile: 'App.jsx',
                        openTabs: ['App.jsx'],
                        isPreviewReady: true,
                        previewError: null
                    };
                }
            }),

            // ── Preview State ──
            isPreviewReady: true,
            previewError: null,

            // ── Actions: File Management ──
            setFile: (path, content) =>
                get()._sync((state) => ({
                    files: { ...state.files, [path]: { content } },
                })),

            deleteFile: (path) =>
                get()._sync((state) => {
                    const newFiles = { ...state.files }
                    delete newFiles[path]
                    const newTabs = state.openTabs.filter((t) => t !== path)
                    return {
                        files: newFiles,
                        openTabs: newTabs,
                        activeFile: state.activeFile === path ? (newTabs[0] || null) : state.activeFile,
                    }
                }),

            setFiles: (fileMap) => get()._sync({ files: fileMap }),

            // Set the preview mode + optional raw HTML (for Track A srcdoc)
            setPreview: (previewType, htmlContent = null) => get()._sync({ previewType, htmlContent }),

            setTunnelUrl: (url) => set({ tunnelUrl: url }),

            getFileContent: (path) => get().files[path]?.content || '',

            // ── Actions: Tab Management ──
            setActiveFile: (path) =>
                get()._sync((state) => ({
                    activeFile: path,
                    openTabs: state.openTabs.includes(path)
                        ? state.openTabs
                        : [...state.openTabs, path],
                })),

            closeTab: (path) =>
                get()._sync((state) => {
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
                get()._sync((state) => {
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
                get()._sync({
                    files: { ...EMPTY_FILES },
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

