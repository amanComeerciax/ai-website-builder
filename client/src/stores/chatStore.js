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
            generationTheme: '',
            generationSiteType: '',
            isConfigured: false,

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
                        generationTaskName: nextState.generationTaskName,
                        generationTheme: nextState.generationTheme,
                        generationSiteType: nextState.generationSiteType,
                        isConfigured: nextState.isConfigured
                    };
                    updates.projectData = newProjectData;
                }
                return updates;
            }),
            
            loadProject: async (projectId, token) => {
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
                            generationTheme: data.generationTheme || '',
                            generationSiteType: data.generationSiteType || '',
                            isConfigured: data.isConfigured || false,
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
                            generationTheme: '',
                            generationSiteType: '',
                            isConfigured: false,
                            isGenerating: false
                        };
                    }
                });

                // Step 2: Hydrate from DB (skip for timestamp-based fallback IDs)
                if (projectId && projectId !== 'new' && projectId.length === 24) {
                    try {
                        const data = await apiClient.getWorkspace(projectId, token);
                        if (data && data.project) {
                            set({ isConfigured: !!data.project.isConfigured });
                        }
                        if (data && data.messages && data.messages.length > 0) {
                            const dbMessages = data.messages.map(m => ({
                                id: m._id,
                                role: m.role,
                                content: m.content,
                                reasoning: m.reasoning,
                                timestamp: m.createdAt,
                                status: m.status,
                                files: m.files || null
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

                            // CRITICAL FIXED WORKSPACE HYDRATION
                            // Find the most recent AI generated codebase and inject it into the Editor Virtual File System
                            const lastMsgWithFiles = [...dbMessages].reverse().find(m => m.files && Object.keys(m.files).length > 0);
                            if (lastMsgWithFiles) {
                                const formattedFiles = {};
                                Object.entries(lastMsgWithFiles.files).forEach(([path, content]) => {
                                    formattedFiles[path] = { content: typeof content === 'string' ? content : (content.content || '') };
                                });
                                useEditorStore.getState().setFiles(formattedFiles);
                            } else {
                                // If the DB has no files (e.g. projects made before the DB fix), 
                                // FORCE wipe the virtual file system to prevent the currently active
                                // local storage cache (like FreshCart) from bleeding into old projects.
                                useEditorStore.getState().setFiles({});
                            }
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
            
            // Finalize configuration and start build
            completeProjectConfig: async (projectId, token, styleOptions) => {
                try {
                    // Update project configuration in DB
                    const config = { ...styleOptions, isConfigured: true };
                    await apiClient.updateProjectConfig(projectId, config, token);
                    
                    set({ isConfigured: true });
                    
                    // Add a system message to keep user informed
                    get().addMessage({ 
                        role: 'assistant', 
                        content: `Got it! I'm now building your website using the **${styleOptions.theme}** theme and **${styleOptions.websiteName || 'custom'}** branding.` 
                    });

                    // Start generation with the first user message as prompt
                    const firstUserMsg = get().messages.find(m => m.role === 'user');
                    const prompt = firstUserMsg ? firstUserMsg.content : 'Initial generation';
                    
                    await get().startGeneration(prompt, projectId, token, styleOptions);
                } catch (err) {
                    console.error('[ChatStore] completeProjectConfig failed:', err);
                }
            },
            
            // ── Real AI Generation via Backend SSE ──
            startGeneration: async (promptText, projectId, token, styleOptions = {}) => {
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
                        existingFiles,
                        styleOptions,
                        token
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
                            // BullMQ sometimes double-serializes: outer parse gives a string
                            if (typeof data === 'string') {
                                console.log('[ChatStore] Double-stringified SSE payload detected, parsing again...');
                                data = JSON.parse(data);
                            }
                        } catch (parseErr) {
                            console.error('[ChatStore] Failed to parse SSE complete data:', parseErr, 'raw:', e.data?.substring(0, 200));
                            data = { summary: 'Generation complete.' };
                        }
                        
                        console.log('[ChatStore] Complete event — files:', data.files ? Object.keys(data.files).length : 0);
                        
                        const editorStore = useEditorStore.getState();

                        // Component Kit pipeline: load all files (preview HTML + Next.js export)
                        const allFiles = { ...(data.files || {}), ...(data.exportFiles || {}) };
                        if (Object.keys(allFiles).length > 0) {
                            editorStore.loadGeneratedFiles(allFiles);
                        }

                        // Always srcdoc preview with Component Kit
                        let htmlContent = null;
                        if (data.files && data.files['index.html']) {
                            htmlContent = typeof data.files['index.html'] === 'string' 
                                ? data.files['index.html'] 
                                : data.files['index.html']?.content;
                        }
                        editorStore.setPreview('srcdoc', htmlContent);

                        get()._sync({ 
                            generationPhase: 'complete',
                            generationSummary: data.summary || 'Generation complete.',
                            generationTheme: data.themeUsed || '',
                            generationSiteType: data.siteType || '',
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
                    generationTheme: '',
                    generationSiteType: '',
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
