import { create } from 'zustand';
import { apiClient } from '../lib/api';

export const useInvitationStore = create((set, get) => ({
    inbox: [],
    inboxCount: 0,
    isLoading: false,

    fetchInbox: async (token) => {
        set({ isLoading: true });
        try {
            const data = await apiClient.getInbox(token);
            set({ 
                inbox: data.invitations || [], 
                inboxCount: data.count || 0,
                isLoading: false 
            });
        } catch (error) {
            console.error('[InvitationStore] Failed to fetch inbox:', error);
            set({ isLoading: false });
        }
    },

    acceptInvitation: async (id, token) => {
        try {
            const data = await apiClient.acceptInvitation(id, token);
            // Remove from inbox
            set(state => ({
                inbox: state.inbox.filter(inv => inv._id !== id),
                inboxCount: Math.max(0, state.inboxCount - 1)
            }));
            return data;
        } catch (error) {
            console.error('[InvitationStore] Failed to accept:', error);
            throw error;
        }
    },

    declineInvitation: async (id, token) => {
        try {
            await apiClient.declineInvitation(id, token);
            set(state => ({
                inbox: state.inbox.filter(inv => inv._id !== id),
                inboxCount: Math.max(0, state.inboxCount - 1)
            }));
        } catch (error) {
            console.error('[InvitationStore] Failed to decline:', error);
            throw error;
        }
    },

    removeFromInbox: (id) => set(state => ({
        inbox: state.inbox.filter(inv => inv._id !== id),
        inboxCount: Math.max(0, state.inboxCount - 1)
    })),

    clearInbox: () => set({ inbox: [], inboxCount: 0 })
}));
