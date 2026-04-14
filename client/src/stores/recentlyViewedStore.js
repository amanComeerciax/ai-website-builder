import { create } from 'zustand'

const STORAGE_KEY = 'sf-recently-viewed'
const MAX_RECENT = 10

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

function saveToStorage(items) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {}
}

/**
 * Tracks recently viewed projects in localStorage.
 * Each entry: { projectId: string, viewedAt: number (timestamp) }
 */
export const useRecentlyViewedStore = create((set, get) => ({
    recentItems: loadFromStorage(),

    addRecentlyViewed: (projectId) => {
        if (!projectId || projectId === 'new') return

        const items = get().recentItems.filter(item => item.projectId !== projectId)
        items.unshift({ projectId, viewedAt: Date.now() })
        const trimmed = items.slice(0, MAX_RECENT)

        set({ recentItems: trimmed })
        saveToStorage(trimmed)
    },

    removeRecentlyViewed: (projectId) => {
        const items = get().recentItems.filter(item => item.projectId !== projectId)
        set({ recentItems: items })
        saveToStorage(items)
    },

    clearRecentlyViewed: () => {
        set({ recentItems: [] })
        saveToStorage([])
    },
}))
