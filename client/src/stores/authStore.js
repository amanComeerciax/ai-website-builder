import { create } from 'zustand';
import { useWorkspaceStore } from './workspaceStore';

/**
 * 1.8 Zustand Auth Store
 * Handles fetching the exact MongoDB tier/usage mapping from the Node API
 * using the explicit Clerk JWT passed from the frontend components.
 */
export const useAuthStore = create((set) => ({
    userData: null,
    isLoading: false,
    error: null,

    fetchUserData: async (getToken) => {
        set({ isLoading: true, error: null });
        try {
            const token = await getToken();
            const res = await fetch('/api/auth/me', {
                method: 'GET',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch user data');

            set({ userData: data, isLoading: false });
            
            // Server always returns the accurate activeWorkspaceId based on the User model
            if (data.activeWorkspaceId) {
                useWorkspaceStore.getState().setActiveWorkspaceId(data.activeWorkspaceId);
            } else if (data.defaultWorkspaceId) {
                useWorkspaceStore.getState().setActiveWorkspaceId(data.defaultWorkspaceId);
            }
        } catch (error) {
            console.error('Failed to fetch user metadata from backend API', error);
            set({ error: error.message, isLoading: false });
        }
    },

    syncUser: async (getToken, payload) => {
        set({ isLoading: true, error: null });
        try {
            const token = await getToken();
            const res = await fetch('/api/auth/sync', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to sync user');

            set({ userData: data.user, isLoading: false });
        } catch (error) {
            console.error('Failed to sync user metadata', error);
            set({ error: error.message, isLoading: false });
        }
    }
}));
