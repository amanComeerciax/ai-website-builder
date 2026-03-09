import { create } from 'zustand'

export const useProjectStore = create((set, get) => ({
    projects: [],
    currentProject: null,
    isLoading: false,
    error: null,

    // Set all projects
    setProjects: (projects) => set({ projects }),

    // Set current project
    setCurrentProject: (project) => set({ currentProject: project }),

    // Add a new project to the list
    addProject: (project) =>
        set((state) => ({ projects: [project, ...state.projects] })),

    // Update a project in the list
    updateProject: (projectId, updates) =>
        set((state) => ({
            projects: state.projects.map((p) =>
                p._id === projectId ? { ...p, ...updates } : p
            ),
            currentProject:
                state.currentProject?._id === projectId
                    ? { ...state.currentProject, ...updates }
                    : state.currentProject,
        })),

    // Remove a project
    removeProject: (projectId) =>
        set((state) => ({
            projects: state.projects.filter((p) => p._id !== projectId),
            currentProject:
                state.currentProject?._id === projectId ? null : state.currentProject,
        })),

    // Loading/error state
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
}))
