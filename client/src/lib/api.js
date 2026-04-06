const API_BASE = '/api'

class ApiClient {
    constructor() {
        this.baseUrl = API_BASE
    }

    async request(endpoint, options = {}, token) {
        const url = `${this.baseUrl}${endpoint}`
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        }

        // Will add Clerk token here after auth integration
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

    updateProjectConfig(id, config, token) {
        return this.request(`/projects/${id}/config`, {
            method: 'PATCH',
            body: JSON.stringify(config),
        }, token)
    }

    deleteProject(id, token) {
        return this.request(`/projects/${id}`, {
            method: 'DELETE',
        }, token)
    }

    toggleStar(id, token) {
        return this.request(`/projects/${id}/star`, {
            method: 'PUT',
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

    // ── Versions ──
    getProjectVersions(projectId, token) {
        return this.request(`/projects/${projectId}/versions`, {}, token)
    }

    restoreVersion(projectId, versionId, token) {
        return this.request(`/projects/${projectId}/versions/${versionId}/restore`, {
            method: 'POST',
        }, token)
    }

    // ── Folders ──
    getFolders(token) {
        return this.request('/folders', {}, token)
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

    // ── Generation ──
    startGeneration(projectId, prompt, model, existingFiles = null, styleOptions = {}, token, images = [], fileContents = []) {
        return this.request('/generate', {
            method: 'POST',
            body: JSON.stringify({ 
                projectId, 
                prompt, 
                model: model || 'qwen', 
                existingFiles,
                images,
                fileContents,
                ...styleOptions
            }),
        }, token)
    }

    getGenerationStatus(jobId, token) {
        return this.request(`/generate/status/${jobId}`, {}, token)
    }

    // ── SSE Stream ──
    getStreamUrl(jobId) {
        return `${this.baseUrl}/generate/stream/${jobId}`
    }

    // ── Health ──
    healthCheck() {
        return this.request('/health')
    }
}

export const apiClient = new ApiClient()
