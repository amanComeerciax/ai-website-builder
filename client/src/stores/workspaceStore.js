import { create } from 'zustand';
import { apiClient } from '../lib/api';
import { useProjectStore } from './projectStore';
import { useFolderStore } from './folderStore';
import { useUIStore } from './uiStore';

export const useWorkspaceStore = create((set, get) => ({
    workspaces: [],
    activeWorkspaceId: null,
    isLoading: false,

    // Called initially by authStore once user data is fetched
    setActiveWorkspaceId: (id) => {
        set({ activeWorkspaceId: id });
    },

    fetchWorkspaces: async (token) => {
        set({ isLoading: true });
        try {
            const data = await apiClient.getWorkspaces(token);
            const workspaces = data.workspaces || [];
            set({ workspaces, isLoading: false });

            // Validate activeWorkspaceId against fetched workspaces just to be safe
            const currentId = get().activeWorkspaceId;
            if (currentId && workspaces.length > 0) {
                const exists = workspaces.some(w => w._id === currentId);
                if (!exists) {
                    console.warn('[WorkspaceStore] activeWorkspaceId is stale, resetting to first workspace');
                    set({ activeWorkspaceId: workspaces[0]._id });
                }
            } else if (!currentId && workspaces.length > 0) {
                set({ activeWorkspaceId: workspaces[0]._id });
            }

            return workspaces;
        } catch (error) {
            console.error('[WorkspaceStore] Failed to fetch workspaces:', error);
            set({ isLoading: false });
            return [];
        }
    },

    createWorkspace: async (name, token) => {
        try {
            const data = await apiClient.createWorkspace({ name }, token);
            set((state) => ({
                workspaces: [...state.workspaces, data.workspace]
            }));
            return data.workspace;
        } catch (error) {
            console.error('[WorkspaceStore] Failed to create workspace:', error);
            throw error;
        }
    },

    deleteWorkspace: async (id, token) => {
        try {
            await apiClient.deleteWorkspace(id, token);
            set((state) => ({
                workspaces: state.workspaces.filter(w => w._id !== id)
            }));
            return true;
        } catch (error) {
            console.error('[WorkspaceStore] Failed to delete workspace:', error);
            throw error;
        }
    },

    switchWorkspace: async (id, token) => {
        // Optimistically set the active workspace in UI
        set({ activeWorkspaceId: id });

        // Update active workspace in MongoDB (server side persistence)
        try {
            await apiClient.setActiveWorkspace(id, token);
        } catch (err) {
            console.error('[WorkspaceStore] Failed to sync active workspace switch to server:', err);
        }
        
        // Clear stale project/folder data immediately to prevent flashing data from previous workspace
        const projectStore = useProjectStore.getState();
        const folderStore = useFolderStore.getState();
        const uiStore = useUIStore.getState();
        
        projectStore.clearProjects && projectStore.clearProjects();
        folderStore.clearFolders && folderStore.clearFolders();
        uiStore.setHoveredProject(null);

        // Fetch the projects and folders for the new workspace
        await Promise.all([
            projectStore.fetchProjects(token, id),
            folderStore.fetchFolders ? folderStore.fetchFolders(token, id) : Promise.resolve()
        ]);
    }
}));
