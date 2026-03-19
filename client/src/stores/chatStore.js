import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '../lib/api'
import { useEditorStore } from './editorStore'

export const useChatStore = create(
    persist(
        (set, get) => ({
            activeProjectId: null,
            projectData: {}, // { [projectId]: { messages, ... } }
            
            messages: [],
            isGenerating: false,
            
            // Model selection: 'qwen' (local + fallback) or 'mistral' (direct cloud)
            selectedModel: 'qwen',
            
            // Generation states: 'idle' | 'thinking' | 'streaming_logs' | 'finished_thinking' | 'summary' | 'complete'
            generationPhase: 'idle', 
            
            // Array of { type: 'Thinking'|'Reading'|'Installing'|'Editing'|'Creating', file?: 'filename', message?: 'string' }
            generationLogs: [],
            generationSummary: '',
            generationTaskName: '',

            // Helper to automatically sync project-specific state to projectData
            _sync: (updater) => set((state) => {
                const updates = typeof updater === 'function' ? updater(state) : updater;
                const nextState = { ...state, ...updates };
                if (nextState.activeProjectId) {
                    const newProjectData = { ...nextState.projectData };
                    newProjectData[nextState.activeProjectId] = {
                        messages: nextState.messages,
                        generationLogs: nextState.generationLogs,
                        generationPhase: nextState.generationPhase,
                        generationSummary: nextState.generationSummary,
                        generationTaskName: nextState.generationTaskName
                    };
                    updates.projectData = newProjectData;
                }
                return updates;
            }),
            
            loadProject: async (projectId) => {
                // Step 1: Instantly restore from localStorage cache (fast UI)
                set((state) => {
                    const newProjectData = { ...state.projectData };
                    
                    if (state.activeProjectId && state.activeProjectId !== projectId) {
                        newProjectData[state.activeProjectId] = {
                            messages: state.messages,
                            generationLogs: state.generationLogs,
                            generationPhase: state.generationPhase,
                            generationSummary: state.generationSummary,
                            generationTaskName: state.generationTaskName
                        };
                    }

                    const data = newProjectData[projectId];

                    if (data) {
                        return {
                            activeProjectId: projectId,
                            projectData: newProjectData,
                            messages: data.messages || [],
                            generationLogs: data.generationLogs || [],
                            generationPhase: data.generationPhase || 'idle',
                            generationSummary: data.generationSummary || '',
                            generationTaskName: data.generationTaskName || '',
                            isGenerating: false
                        };
                    } else {
                        if (state.activeProjectId === projectId && state.messages.length > 0) {
                            return { projectData: newProjectData };
                        }
                        return {
                            activeProjectId: projectId,
                            projectData: newProjectData,
                            messages: [],
                            generationLogs: [],
                            generationPhase: 'idle',
                            generationSummary: '',
                            generationTaskName: '',
                            isGenerating: false
                        };
                    }
                });

                // Step 2: Hydrate from DB (skip for timestamp-based fallback IDs)
                if (projectId && projectId !== 'new' && projectId.length === 24) {
                    try {
                        const data = await apiClient.getWorkspace(projectId);
                        if (data && data.messages && data.messages.length > 0) {
                            const dbMessages = data.messages.map(m => ({
                                id: m._id,
                                role: m.role,
                                content: m.content,
                                reasoning: m.reasoning,
                                timestamp: m.createdAt,
                                status: m.status
                            }));
                            // Only override if DB has real data
                            set((state) => {
                                const newProjectData = { ...state.projectData };
                                newProjectData[projectId] = {
                                    ...newProjectData[projectId],
                                    messages: dbMessages
                                };
                                return {
                                    messages: dbMessages,
                                    projectData: newProjectData
                                };
                            });
                        }
                    } catch (err) {
                        console.warn('[ChatStore] DB hydration skipped:', err.message);
                    }
                }
            },
            
            // UI View States
            isIdeVisible: false,      // Whether the right panel is open at all
            isDetailsExpanded: false, // For the completion card details expansion
            activeView: 'preview',    // 'preview' | 'code' - which right panel is shown
            
            // Internal: EventSource reference for cleanup
            _eventSource: null,

            setIdeVisible: (visible) => set({ isIdeVisible: visible }),
            setActiveView: (view) => set({ activeView: view, isIdeVisible: true }),
            setSelectedModel: (model) => set({ selectedModel: model }),

            addMessage: (message) =>
                get()._sync((state) => ({
                    messages: [
                        ...state.messages,
                        {
                            id: Date.now().toString(),
                            timestamp: new Date().toISOString(),
                            ...message,
                        },
                    ],
                })),

            clearMessages: () => get()._sync({ messages: [] }),

            setGenerating: (isGenerating) => set({ isGenerating }), // transient
            setGenerationPhase: (phase) => get()._sync({ generationPhase: phase }),
            addGenerationLog: (log) => get()._sync((state) => ({ generationLogs: [...state.generationLogs, log] })),
            setGenerationSummary: (summary) => get()._sync({ generationSummary: summary }),
            setGenerationTaskName: (name) => get()._sync({ generationTaskName: name }),
            setDetailsExpanded: (expanded) => set({ isDetailsExpanded: expanded }), // ui state
            
            // ── Real AI Generation via Backend SSE ──
            startGeneration: async (promptText, projectId) => {
                const currentModel = get().selectedModel || 'qwen';
                // Reset UI state for new generation
                get()._sync({ 
                    isGenerating: true, 
                    generationPhase: 'thinking',
                    generationLogs: [],
                    generationSummary: '',
                    generationTaskName: 'Building ' + promptText.substring(0, 25) + '...',
                    isDetailsExpanded: true
                });
                // Show the right panel immediately
                set({ isIdeVisible: true, activeView: 'agent' });

                try {
                    // Pull the existing workspace files (if any) to provide contextual awareness for follow-ups like "fix the error"
                    const editorStoreFiles = useEditorStore.getState().files;
                    const existingFiles = Object.keys(editorStoreFiles).length > 0 ? editorStoreFiles : null;

                    // Step 1: POST the prompt to backend to get a jobId
                    const response = await apiClient.startGeneration(
                        projectId || 'local_project', 
                        promptText,
                        currentModel,
                        existingFiles
                    );
                    
                    const { jobId } = response;
                    if (!jobId) throw new Error('No jobId returned from server');

                    // Step 2: Open SSE connection to stream real-time events
                    const streamUrl = apiClient.getStreamUrl(jobId);
                    const eventSource = new EventSource(streamUrl);

                    // Store reference for cleanup (not persisted)
                    useChatStore.setState({ _eventSource: eventSource });

                    // Handle 'connected' event (initial handshake)
                    eventSource.addEventListener('connected', (e) => {
                        console.log('[ChatStore] SSE connected:', JSON.parse(e.data));
                    });

                    // Handle 'thinking' events from the AI worker
                    eventSource.addEventListener('thinking', (e) => {
                        const data = JSON.parse(e.data);
                        get()._sync({ generationPhase: 'thinking' });
                        console.log('[ChatStore] Thinking:', data.message);
                    });

                    // Handle 'log' events (file operations streamed one-by-one)
                    eventSource.addEventListener('log', (e) => {
                        const data = JSON.parse(e.data);
                        get()._sync(state => ({
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
                        
                        const editorStore = useEditorStore.getState();

                        // Inject generated files into the editorStore VFS
                        if (data.files) {
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

                        // Set preview type: 'srcdoc' for Track A HTML, 'sandpack' for Track B React
                        const previewType = data.previewType || 'sandpack';
                        const htmlContent = previewType === 'srcdoc' ? data.files?.['index.html'] : null;
                        editorStore.setPreview(previewType, htmlContent);

                        get()._sync({ 
                            generationPhase: 'complete',
                            generationSummary: data.summary || 'Generation complete.',
                            isGenerating: false,
                        });
                        // Auto-switch to preview so user sees the rendered app
                        set({ activeView: 'preview', isIdeVisible: true });
                        useChatStore.setState({ _eventSource: null });
                        
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
                        get()._sync({
                            generationPhase: 'complete',
                            generationSummary: errorMsg,
                            isGenerating: false,
                        });
                        useChatStore.setState({ _eventSource: null });
                        eventSource.close();
                    });

                    // Handle native EventSource connection errors
                    eventSource.onerror = () => {
                        if (eventSource.readyState === EventSource.CLOSED) {
                            get()._sync({
                                generationPhase: 'complete',
                                generationSummary: 'Connection lost. Please try again.',
                                isGenerating: false,
                            });
                            useChatStore.setState({ _eventSource: null });
                        }
                    };

                } catch (err) {
                    console.error('[ChatStore] Generation error:', err);
                    get()._sync({
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
                get()._sync({
                    isGenerating: false,
                    generationPhase: 'idle',
                });
                useChatStore.setState({ _eventSource: null });
            },

            reset: () =>
                get()._sync({ 
                    messages: [], 
                    isGenerating: false, 
                    generationPhase: 'idle',
                    generationLogs: [],
                    generationSummary: '',
                    generationTaskName: '',
                }),
        }),
        {
            name: 'stackforge-chat-storage',
            // Exclude transient properties from persistence
            partialize: (state) => Object.fromEntries(
                Object.entries(state).filter(([key]) => !['_eventSource', 'isGenerating'].includes(key))
            ),
        }
    )
)
