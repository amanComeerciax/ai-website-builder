import { create } from 'zustand';

export const useUIStore = create((set) => ({
    isSidebarCollapsed: false,
    toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    
    isWorkspaceDropdownOpen: false,
    setWorkspaceDropdownOpen: (isOpen) => set({ isWorkspaceDropdownOpen: isOpen }),
    toggleWorkspaceDropdown: () => set((state) => ({ isWorkspaceDropdownOpen: !state.isWorkspaceDropdownOpen })),
    
    isCreateFolderOpen: false,
    setCreateFolderOpen: (isOpen) => set({ isCreateFolderOpen: isOpen }),
    
    isCreateWorkspaceOpen: false,
    setCreateWorkspaceOpen: (isOpen) => set({ isCreateWorkspaceOpen: isOpen }),

    isInviteModalOpen: false,
    setInviteModalOpen: (isOpen) => set({ isInviteModalOpen: isOpen }),

    isInboxOpen: false,
    setInboxOpen: (isOpen) => set({ isInboxOpen: isOpen }),

    isInviteLinkModalOpen: false,
    setInviteLinkModalOpen: (isOpen) => set({ isInviteLinkModalOpen: isOpen }),
}));
