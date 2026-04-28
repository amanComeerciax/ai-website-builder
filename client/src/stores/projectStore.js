import { create } from 'zustand'
import { apiClient } from '../lib/api'

export const useProjectStore = create((set, get) => ({
    projects: [],
    isLoading: false,
    isLoadingProjects: false,
    
    // Clear all projects (for workspace switching)
    clearProjects: () => set({ projects: [] }),
    
    // Create a new project via API — returns a real MongoDB ObjectId
    // templateId is optional — when provided, the backend pre-populates currentFileTree with the template HTML
    createProject: async (prompt, token, folderId = null, templateId = null, workspaceId = null) => {
        set({ isLoading: true });
        try {
            const payload = { 
                prompt: prompt,
                folderId,
                workspaceId
            };
            if (templateId) payload.templateId = templateId;

            const data = await apiClient.createProject(payload, token);
            const dbProject = data.project;
            
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
                projects: [newProject, ...state.projects],
                isLoading: false
            }));
            
            return newProject.id;
        } catch (err) {
            console.error('[ProjectStore] Failed to create project via API:', err);
            set({ isLoading: false });
            throw err;
        }
    },
    
    getProjectById: (id) => {
        return get().projects.find(p => p.id === id)
    },

    // Fetch all projects from DB
    fetchProjects: async (token, workspaceId = null) => {
        set({ isLoadingProjects: true });
        try {
            const [mainData, sharedData] = await Promise.all([
                apiClient.getProjects(token, workspaceId).catch(() => ({ projects: [] })),
                apiClient.getSharedProjects(token).catch(() => ({ projects: [] }))
            ]);

            const projectMap = new Map();

            // Process main projects
            (mainData.projects || []).forEach(p => {
                projectMap.set(p._id, {
                    id: p._id,
                    name: p.name,
                    time: new Date(p.createdAt).toLocaleDateString(),
                    lastEdited: new Date(p.updatedAt).getTime(),
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt,
                    isStarred: p.isStarred || false,
                    isShared: p.isShared || false,
                    folderId: p.folderId || null,
                    techStack: p.techStack || 'react',
                    status: p.status || 'idle',
                    publishedUrl: p.publishedUrl || null,
                    websiteName: p.websiteName || null,
                    description: p.description || null
                });
            });

            // Process shared projects
            (sharedData.projects || []).forEach(p => {
                if (!projectMap.has(p._id)) {
                    projectMap.set(p._id, {
                        id: p._id,
                        name: p.name,
                        time: new Date(p.createdAt).toLocaleDateString(),
                        lastEdited: new Date(p.updatedAt).getTime(),
                        createdAt: p.createdAt,
                        updatedAt: p.updatedAt,
                        isStarred: p.isStarred || false,
                        isShared: true, // Always true for shared-with-me list
                        folderId: p.folderId || null,
                        techStack: p.techStack || 'react',
                        status: p.status || 'idle',
                        publishedUrl: p.publishedUrl || null,
                        websiteName: p.websiteName || null,
                        description: p.description || null
                    });
                } else {
                    // If it already exists in the workspace, we still mark it as shared so it shows up in "Shared with me" filter
                    projectMap.get(p._id).isShared = true;
                }
            });

            set({ projects: Array.from(projectMap.values()), isLoadingProjects: false });
        } catch (err) {
            console.error('[ProjectStore] Failed to fetch projects:', err);
            set({ isLoadingProjects: false });
        }
    },

    // Update project style configuration
    updateProjectConfig: async (projectId, config, token) => {
        try {
            const data = await apiClient.updateProjectConfig(projectId, config, token);
            set((state) => ({
                projects: state.projects.map(p => 
                    p.id === projectId ? { ...p, ...data.project } : p
                )
            }));
            return data.project;
        } catch (err) {
            console.error('[ProjectStore] Failed to update project config:', err);
            throw err;
        }
    },

    // Delete project
    deleteProject: async (projectId, token) => {
        try {
            await apiClient.deleteProject(projectId, token);
            set((state) => ({
                projects: state.projects.filter(p => p.id !== projectId)
            }));
            return true;
        } catch (err) {
            console.error('[ProjectStore] Failed to delete project:', err);
            // Use window.toast if available or alert to surface the error
            if (window.toast) {
                window.toast.error("Failed to delete project: " + err.message);
            } else {
                alert("Failed to delete project: " + err.message);
            }
            return false;
        }
    },

    // Rename project
    renameProject: async (projectId, newName, token) => {
        // Optimistic update
        set((state) => ({
            projects: state.projects.map(p => 
                p.id === projectId ? { ...p, name: newName } : p
            )
        }));
        try {
            await apiClient.updateProject(projectId, { name: newName }, token);
            return true;
        } catch (err) {
            console.error('[ProjectStore] Failed to rename project:', err);
            return false;
        }
    },

    // Move to folder
    moveToFolder: async (projectId, folderId, token) => {
        // Optimistic update
        set((state) => ({
            projects: state.projects.map(p =>
                p.id === projectId ? { ...p, folderId: folderId || null } : p
            )
        }));
        try {
            await apiClient.updateProject(projectId, { folderId: folderId || null }, token);
            return true;
        } catch (err) {
            console.error('[ProjectStore] Failed to move project to folder:', err);
            return false;
        }
    },

    // Toggle star status
    toggleStar: async (projectId, token) => {
        // Optimistic UI update
        const previousProjects = get().projects;
        set((state) => ({
            projects: state.projects.map(p => 
                p.id === projectId ? { ...p, isStarred: !p.isStarred } : p
            )
        }));

        try {
            const data = await apiClient.toggleStar(projectId, token);
            // Ensure state matches server response just in case
            set((state) => ({
                projects: state.projects.map(p => 
                    p.id === projectId ? { ...p, isStarred: data.project.isStarred } : p
                )
            }));
            return data.project.isStarred;
        } catch (err) {
            console.error('[ProjectStore] Failed to toggle star:', err);
            // Revert on failure
            set({ projects: previousProjects });
            throw err;
        }
    }
}))
