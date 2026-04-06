import { create } from 'zustand'
import { apiClient } from '../lib/api'

export const useProjectStore = create((set, get) => ({
    projects: [],
    
    // Create a new project via API — returns a real MongoDB ObjectId
    createProject: async (prompt, token, folderId = null) => {
        try {
            const data = await apiClient.createProject({ 
                name: prompt.substring(0, 40),
                prompt: prompt,
                folderId
            }, token);
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
                projects: [newProject, ...state.projects]
            }));
            
            return newProject.id;
        } catch (err) {
            console.error('[ProjectStore] Failed to create project via API:', err);
            return null; // Don't fallback to local-only, we need the DB record
        }
    },
    
    getProjectById: (id) => {
        return get().projects.find(p => p.id === id)
    },

    // Fetch all projects from DB
    fetchProjects: async (token) => {
        try {
            const data = await apiClient.getProjects(token);
            const projects = (data.projects || []).map(p => ({
                id: p._id,
                name: p.name,
                time: new Date(p.createdAt).toLocaleDateString(),
                lastEdited: new Date(p.updatedAt).getTime(),
                isStarred: p.isStarred || false,
                isShared: p.isShared || false,
                folderId: p.folderId || null
            }));
            set({ projects });
        } catch (err) {
            console.error('[ProjectStore] Failed to fetch projects:', err);
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
