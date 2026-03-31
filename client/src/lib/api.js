const API_BASE = '/api'

/**
 * API Client with automatic Clerk JWT token injection.
 * 
 * Call `apiClient.setTokenGetter(getToken)` once after Clerk loads,
 * then every request automatically includes the Bearer token.
 */
class ApiClient {
    constructor() {
        this.baseUrl = API_BASE
        this._getToken = null // Clerk's getToken function, injected at app init
    }

    /**
     * Set the Clerk token getter function.
     * Must be called once when the app boots and Clerk is ready.
     * @param {Function} getTokenFn - Clerk's `getToken()` async function
     */
    setTokenGetter(getTokenFn) {
        this._getToken = getTokenFn
    }

    async request(endpoint, options = {}, tokenOverride) {
        const url = `${this.baseUrl}${endpoint}`
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        }

        // Auto-inject Clerk token: use override if provided, else get from Clerk
        let token = tokenOverride
        if (!token && this._getToken) {
            try {
                token = await this._getToken()
            } catch (e) {
                console.warn('[API] Could not get Clerk token:', e.message)
            }
        }

        if (token) config.headers.Authorization = `Bearer ${token}`

        try {
            const response = await fetch(url, config)
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || `Request failed with status ${response.status}`)
            }

            return data
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error.message)
            throw error
        }
    }

    // ── Projects ──
    getProjects(token) {
        return this.request('/projects', {}, token)
    }

    getProject(id, token) {
        return this.request(`/projects/${id}`, {}, token)
    }

    // Full workspace hydration: returns { project, messages }
    getWorkspace(id, token) {
        return this.request(`/projects/${id}`, {}, token)
    }

    createProject(data, token) {
        return this.request('/projects', {
            method: 'POST',
            body: JSON.stringify(data),
        }, token)
    }

    updateProject(id, data, token) {
        return this.request(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }, token)
    }

    deleteProject(id, token) {
        return this.request(`/projects/${id}`, {
            method: 'DELETE',
        }, token)
    }

    // ── Versions ──
    getProjectVersions(id, token) {
        return this.request(`/projects/${id}/versions`, {}, token)
    }

    restoreVersion(projectId, versionId, token) {
        return this.request(`/projects/${projectId}/versions/${versionId}/restore`, {
            method: 'POST',
        }, token)
    }

    // ── Messages ──
    createMessage(projectId, content, role, token) {
        return this.request(`/projects/${projectId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content, role }),
        }, token)
    }

    getMessageLogs(messageId, token) {
        return this.request(`/messages/${messageId}/logs`, {}, token)
    }

    // ── Generation ──
    startGeneration(projectId, prompt, model, existingFiles = null, token) {
        return this.request('/generate', {
            method: 'POST',
            body: JSON.stringify({ projectId, prompt, model: model || 'qwen', existingFiles }),
        }, token)
    }

    getGenerationStatus(jobId, token) {
        return this.request(`/generate/status/${jobId}`, {}, token)
    }

    // ── SSE Stream ──
    getStreamUrl(jobId) {
        return `${this.baseUrl}/generate/stream/${jobId}`
    }

    // ── Folders ──
    getFolders(token) {
        return this.request('/folders', {}, token)
    }

    getFolderProjects(folderId, token) {
        return this.request(`/folders/${folderId}/projects`, {}, token)
    }

    createFolder(data, token) {
        return this.request('/folders', {
            method: 'POST',
            body: JSON.stringify(data),
        }, token)
    }

    deleteFolder(id, token) {
        return this.request(`/folders/${id}`, {
            method: 'DELETE',
        }, token)
    }

    // ── Health ──
    healthCheck() {
        return this.request('/health')
    }
}

export const apiClient = new ApiClient()
