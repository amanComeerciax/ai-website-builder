import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '../lib/api'

export const useProjectStore = create(
    persist(
        (set, get) => ({
            projects: [],
            
            // Create a new project via API — returns a real MongoDB ObjectId
            createProject: async (prompt) => {
                try {
                    const data = await apiClient.createProject({ 
                        name: prompt.substring(0, 40) 
                    });
                    const dbProject = data.project;
                    
                    const newProject = {
                        id: dbProject._id,
                        name: dbProject.name,
                        initialPrompt: prompt,
                        time: 'Just now',
                        lastEdited: Date.now(),
                        isStarred: false,
                        isShared: false
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
                        isShared: false
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
                        isStarred: false,
                        isShared: false
                    }));
                    set({ projects });
                } catch (err) {
                    console.error('[ProjectStore] Failed to fetch projects:', err);
                }
            },
        }),
        {
            name: 'project-storage',
        }
    )
)
