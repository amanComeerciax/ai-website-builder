import { create } from 'zustand'
import { apiClient } from '../lib/api'
import { useEditorStore } from './editorStore'

export const useChatStore = create((set, get) => ({
    messages: [],
    isGenerating: false,
    
    // Generation states: 'idle' | 'thinking' | 'streaming_logs' | 'finished_thinking' | 'summary' | 'complete'
    generationPhase: 'idle', 
    
    // Array of { type: 'Thinking'|'Reading'|'Installing'|'Editing'|'Creating', file?: 'filename', message?: 'string' }
    generationLogs: [],
    generationSummary: '',
    generationTaskName: '',
    
    isIdeVisible: false,
    isDetailsExpanded: true,

    // Internal: EventSource reference for cleanup
    _eventSource: null,

    setIdeVisible: (visible) => set({ isIdeVisible: visible }),

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

    clearMessages: () => set({ messages: [] }),

    setGenerating: (isGenerating) => set({ isGenerating }),
    setGenerationPhase: (phase) => set({ generationPhase: phase }),
    addGenerationLog: (log) => set((state) => ({ generationLogs: [...state.generationLogs, log] })),
    setGenerationSummary: (summary) => set({ generationSummary: summary }),
    setGenerationTaskName: (name) => set({ generationTaskName: name }),
    setDetailsExpanded: (expanded) => set({ isDetailsExpanded: expanded }),
    
    // ── Real AI Generation via Backend SSE ──
    startGeneration: async (promptText, projectId) => {
        // Reset UI state for new generation
        set({ 
            isGenerating: true, 
            generationPhase: 'thinking',
            generationLogs: [],
            generationSummary: '',
            generationTaskName: 'Building ' + promptText.substring(0, 25) + '...',
            isDetailsExpanded: true
        });

        try {
            // Step 1: POST the prompt to backend to get a jobId
            const response = await apiClient.startGeneration(
                projectId || 'local_project', 
                promptText
            );
            
            const { jobId } = response;
            if (!jobId) throw new Error('No jobId returned from server');

            // Step 2: Open SSE connection to stream real-time events
            const streamUrl = apiClient.getStreamUrl(jobId);
            const eventSource = new EventSource(streamUrl);

            // Store reference for cleanup
            set({ _eventSource: eventSource });

            // Handle 'connected' event (initial handshake)
            eventSource.addEventListener('connected', (e) => {
                console.log('[ChatStore] SSE connected:', JSON.parse(e.data));
            });

            // Handle 'thinking' events from the AI worker
            eventSource.addEventListener('thinking', (e) => {
                const data = JSON.parse(e.data);
                set({ generationPhase: 'thinking' });
                console.log('[ChatStore] Thinking:', data.message);
            });

            // Handle 'log' events (file operations streamed one-by-one)
            eventSource.addEventListener('log', (e) => {
                const data = JSON.parse(e.data);
                set(state => ({
                    generationPhase: 'streaming_logs',
                    generationLogs: [...state.generationLogs, { 
                        type: data.type, 
                        file: data.file,
                        message: data.message 
                    }]
                }));
            });

            // Handle 'complete' event (job finished successfully)
            eventSource.addEventListener('complete', (e) => {
                let data;
                try {
                    data = JSON.parse(e.data);
                } catch {
                    data = { summary: 'Generation complete.' };
                }
                
                // Inject generated files into the editorStore VFS
                if (data.files) {
                    const editorStore = useEditorStore.getState();
                    // Convert { "path": "content" } to VFS format { "path": { content: "..." } }
                    const fileMap = {};
                    for (const [path, content] of Object.entries(data.files)) {
                        fileMap[path] = { content };
                    }
                    editorStore.setFiles(fileMap);
                    
                    // Open the first file tab
                    const firstFile = Object.keys(data.files)[0];
                    if (firstFile) {
                        editorStore.setActiveFile(firstFile);
                    }
                }

                set({ 
                    generationPhase: 'complete',
                    generationSummary: data.summary || 'Generation complete.',
                    isGenerating: false,
                    _eventSource: null
                });
                
                eventSource.close();
            });

            // Handle 'error' events from the worker
            eventSource.addEventListener('error', (e) => {
                let errorMsg = 'Generation failed. Please try again.';
                try {
                    const data = JSON.parse(e.data);
                    errorMsg = data.error || errorMsg;
                } catch {}
                
                console.error('[ChatStore] SSE error event:', errorMsg);
                set({
                    generationPhase: 'complete',
                    generationSummary: errorMsg,
                    isGenerating: false,
                    _eventSource: null
                });
                eventSource.close();
            });

            // Handle native EventSource connection errors
            eventSource.onerror = () => {
                if (eventSource.readyState === EventSource.CLOSED) {
                    set({
                        generationPhase: 'complete',
                        generationSummary: 'Connection lost. Please try again.',
                        isGenerating: false,
                        _eventSource: null
                    });
                }
            };

        } catch (err) {
            console.error('[ChatStore] Generation error:', err);
            set({
                generationPhase: 'complete',
                generationSummary: `Error: ${err.message}`,
                isGenerating: false
            });
        }
    },

    // Cancel an in-progress generation
    cancelGeneration: () => {
        const state = get();
        if (state._eventSource) {
            state._eventSource.close();
        }
        set({
            isGenerating: false,
            generationPhase: 'idle',
            _eventSource: null
        });
    },

    reset: () =>
        set({ 
            messages: [], 
            isGenerating: false, 
            generationPhase: 'idle',
            generationLogs: [],
            generationSummary: '',
            generationTaskName: '',
            _eventSource: null
        }),
}))
