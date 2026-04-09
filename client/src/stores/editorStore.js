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
            previewType: 'srcdoc',     // Always srcdoc with Component Kit
            htmlContent: null,         // raw HTML string for srcdoc mode

            // ── Active State ──
            activeFile: 'index.html',
            openTabs: ['index.html'],
            codeHighlightSearch: null,  // Search string from visual edit "View Code"

            _sync: (updater) => set((state) => {
                const updates = typeof updater === 'function' ? updater(state) : updater;
                const nextState = { ...state, ...updates };
                if (nextState.activeProjectId) {
                    const newProjectData = { ...nextState.projectData };
                    newProjectData[nextState.activeProjectId] = {
                        files: nextState.files,
                        activeFile: nextState.activeFile,
                        openTabs: nextState.openTabs,
                        previewType: nextState.previewType,
                        htmlContent: nextState.htmlContent
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
                        previewType: state.previewType,
                        htmlContent: state.htmlContent
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
                        previewType: data.previewType || 'srcdoc',
                        htmlContent: data.htmlContent || null,
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
                        activeFile: 'index.html',
                        openTabs: ['index.html'],
                        previewType: 'srcdoc',
                        htmlContent: null,
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
                    const fileMap = { ...state.files } // VERY IMPORTANT: Merge with existing files!
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

                    // Keep existing activeTab if we didn't generate a new one, else switch to the first newly generated file
                    const newOpenTabs = Array.from(new Set([...state.openTabs, ...tabs]))

                    return {
                        files: fileMap,
                        openTabs: newOpenTabs.length > 0 ? newOpenTabs : ['index.html'],
                        activeFile: tabs[0] || state.activeFile || 'index.html',
                        isPreviewReady: true,
                        previewError: null,
                    }
                }),

            // ── Reset ──
            reset: () =>
                get()._sync({
                    files: { ...EMPTY_FILES },
                    activeFile: 'index.html',
                    openTabs: ['index.html'],
                    previewType: 'srcdoc',
                    htmlContent: null,
                    isPreviewReady: true,
                    previewError: null,
                }),
        }),
        {
            name: 'stackforge-vfs-storage', // Persistence Key
            // INDUSTRY STANDARD: Do not save large codebases to LocalStorage (5MB limit)
            // Only save essential active flags. The files should be fetched from DB.
            partialize: (state) => ({
                activeProjectId: state.activeProjectId,
                activeFile: state.activeFile,
                openTabs: state.openTabs,
                previewType: state.previewType
            }),
        }
    )
)

