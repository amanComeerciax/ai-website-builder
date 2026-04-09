import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '../lib/api'

export const useFolderStore = create(
    persist(
        (set, get) => ({
            folders: [],
            isLoading: false,
            error: null,

            // Clear all folders (for workspace switching)
            clearFolders: () => set({ folders: [] }),

            // Fetch all folders from DB
            fetchFolders: async (token, workspaceId = null) => {
                set({ isLoading: true, error: null });
                try {
                    const data = await apiClient.getFolders(token, workspaceId);
                    const folders = (data.folders || []).map(f => ({
                        id: f._id,
                        name: f.name,
                        visibility: f.visibility,
                        createdAt: f.createdAt
                    }));
                    set({ folders, isLoading: false });
                } catch (err) {
                    console.error('[FolderStore] Failed to fetch folders:', err);
                    set({ error: err.message, isLoading: false });
                }
            },

            // Create a new folder
            createFolder: async (name, visibility, token, workspaceId = null) => {
                set({ isLoading: true, error: null });
                try {
                    const data = await apiClient.createFolder({ name, visibility, workspaceId }, token);
                    const newFolder = {
                        id: data.folder._id,
                        name: data.folder.name,
                        visibility: data.folder.visibility,
                        createdAt: data.folder.createdAt
                    };
                    
                    set((state) => ({
                        folders: [newFolder, ...state.folders],
                        isLoading: false
                    }));
                    
                    return newFolder;
                } catch (err) {
                    console.error('[FolderStore] Failed to create folder:', err);
                    set({ error: err.message, isLoading: false });
                    throw err;
                }
            },

            // Delete a folder
            deleteFolder: async (id, token) => {
                try {
                    await apiClient.deleteFolder(id, token);
                    set((state) => ({
                        folders: state.folders.filter(f => f.id !== id)
                    }));
                } catch (err) {
                    console.error('[FolderStore] Failed to delete folder:', err);
                    set({ error: err.message });
                }
            }
        }),
        {
            name: 'folder-storage',
        }
    )
)
