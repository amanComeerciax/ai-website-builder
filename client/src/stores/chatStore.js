import { create } from 'zustand'

export const useChatStore = create((set) => ({
    messages: [],
    isGenerating: false,
    generationStatus: null, // 'queued' | 'understanding' | 'planning' | 'generating' | 'assembling' | 'complete' | 'failed'

    // Add a message (user or assistant)
    addMessage: (message) =>
        set((state) => ({
            messages: [
                ...state.messages,
                {
                    id: Date.now().toString(),
                    timestamp: new Date().toISOString(),
                    ...message,
                },
            ],
        })),

    // Clear messages (new project)
    clearMessages: () => set({ messages: [] }),

    // Generation state
    setGenerating: (isGenerating) => set({ isGenerating }),
    setGenerationStatus: (generationStatus) => set({ generationStatus }),

    // Reset
    reset: () =>
        set({ messages: [], isGenerating: false, generationStatus: null }),
}))
