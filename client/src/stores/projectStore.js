import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '../lib/api'
import { useEditorStore } from './editorStore'

export const useProjectStore = create(
    persist(
        (set, get) => ({
            projects: [],
            
            // Create a new project via API — returns a real MongoDB ObjectId
            createProject: async (prompt, folderId = null, templateId = null) => {
                try {
                    const data = await apiClient.createProject({ 
                        name: prompt.substring(0, 40),
                        folderId,
                        templateId
                    });
                    const dbProject = data.project;
                    
                    // If this was a template instantiation, load template files into the editor VFS
                    if (data.templateFiles && Object.keys(data.templateFiles).length > 0) {
                        const editorStore = useEditorStore.getState();
                        
                        // Convert { "path": "content" } to VFS format { "path": { content: "..." } }
                        const fileMap = {};
                        for (const [path, content] of Object.entries(data.templateFiles)) {
                            fileMap[path] = { content };
                        }
                        editorStore.setFiles(fileMap);
                        
                        // Open the first file tab
                        const firstFile = Object.keys(data.templateFiles)[0];
                        if (firstFile) {
                            editorStore.setActiveFile(firstFile);
                        }

                        // Set preview type based on track
                        const previewType = data.previewType || 'sandpack';
                        const htmlContent = previewType === 'srcdoc' ? data.templateFiles['index.html'] : null;
                        editorStore.setPreview(previewType, htmlContent);
                    }
                    
                    const newProject = {
                        id: dbProject._id,
                        name: dbProject.name,
                        initialPrompt: prompt,
                        time: 'Just now',
                        lastEdited: Date.now(),
                        isStarred: false,
                        isShared: false,
                        folderId: dbProject.folderId || null
                    };
                    
                    set((state) => ({
                        projects: [newProject, ...state.projects]
                    }));
                    
                    return newProject.id;
                } catch (err) {
                    console.error('[ProjectStore] Failed to create project via API:', err);
                    // Fallback: still create locally so the UI doesn't break
                    const fallbackId = Date.now().toString();
                    const newProject = {
                        id: fallbackId,
                        name: `App from: ${prompt.substring(0, 15)}...`,
                        initialPrompt: prompt,
                        time: 'Just now',
                        lastEdited: Date.now(),
                        isStarred: false,
                        isShared: false,
                        folderId: folderId || null
                    };
                    set((state) => ({
                        projects: [newProject, ...state.projects]
                    }));
                    return fallbackId;
                }
            },
            
            getProjectById: (id) => {
                return get().projects.find(p => p.id === id)
            },

            // Fetch all projects from DB
            fetchProjects: async () => {
                try {
                    const data = await apiClient.getProjects();
                    const projects = (data.projects || []).map(p => ({
                        id: p._id,
                        name: p.name,
                        time: new Date(p.createdAt).toLocaleDateString(),
                        lastEdited: new Date(p.updatedAt).getTime(),
                        isStarred: p.starred || false,
                        isShared: false,
                        folderId: p.folderId || null
                    }));
                    set({ projects });
                } catch (err) {
                    console.error('[ProjectStore] Failed to fetch projects:', err);
                }
            },

            renameProject: async (id, newName) => {
                // Optimistic UI update
                set((state) => ({
                    projects: state.projects.map(p => 
                        p.id === id ? { ...p, name: newName } : p
                    )
                }));
                // Persist via API
                try {
                    await apiClient.updateProject(id, { name: newName });
                } catch (err) {
                    console.error('[ProjectStore] Failed to rename project:', err);
                }
            },

            toggleStar: async (id) => {
                let currentStarState = false;
                // Optimistic UI update
                set((state) => ({
                    projects: state.projects.map(p => {
                        if (p.id === id) {
                            currentStarState = !p.isStarred;
                            return { ...p, isStarred: currentStarState };
                        }
                        return p;
                    })
                }));
                // Persist via API
                try {
                    await apiClient.updateProject(id, { starred: currentStarState });
                } catch (err) {
                    console.error('[ProjectStore] Failed to toggle star:', err);
                }
            },

            deleteProject: async (id) => {
                // Optimistic UI update
                set((state) => ({
                    projects: state.projects.filter(p => p.id !== id)
                }));
                // Persist via API
                try {
                    await apiClient.deleteProject(id);
                } catch (err) {
                    console.error('[ProjectStore] Failed to delete project:', err);
                }
            },

            moveToFolder: async (id, folderId) => {
                // Optimistic UI update
                set((state) => ({
                    projects: state.projects.map(p =>
                        p.id === id ? { ...p, folderId: folderId || null } : p
                    )
                }));
                // Persist via API
                try {
                    await apiClient.updateProject(id, { folderId: folderId || null });
                } catch (err) {
                    console.error('[ProjectStore] Failed to move project:', err);
                }
            },
        }),
        {
            name: 'project-storage',
        }
    )
)
