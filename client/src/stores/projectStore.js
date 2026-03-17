import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useProjectStore = create(
    persist(
        (set, get) => ({
            projects: [],
            
            // Create a new project when user submits a prompt
            createProject: (prompt) => {
                const newProject = {
                    id: Date.now().toString(),
                    name: `App from: ${prompt.substring(0, 15)}...`,
                    initialPrompt: prompt,
                    time: 'Just now',
                    lastEdited: Date.now(),
                    isStarred: false,
                    isShared: false
                }
                
                set((state) => ({
                    projects: [newProject, ...state.projects]
                }))
                
                return newProject.id
            },
            
            getProjectById: (id) => {
                return get().projects.find(p => p.id === id)
            },

            // Other actions could include delete, rename, etc.
        }),
        {
            name: 'project-storage', // saves to localStorage
        }
    )
)
