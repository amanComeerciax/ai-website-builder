const API_BASE = '/api'

class ApiClient {
    constructor() {
        this.baseUrl = API_BASE
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        }

        // Will add Clerk token here after auth integration
        // const token = await getToken()
        // if (token) config.headers.Authorization = `Bearer ${token}`

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
    getProjects() {
        return this.request('/projects')
    }

    getProject(id) {
        return this.request(`/projects/${id}`)
    }

    createProject(data) {
        return this.request('/projects', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    updateProject(id, data) {
        return this.request(`/projects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        })
    }

    deleteProject(id) {
        return this.request(`/projects/${id}`, {
            method: 'DELETE',
        })
    }

    // ── Generation ──
    startGeneration(projectId, prompt) {
        return this.request('/generate', {
            method: 'POST',
            body: JSON.stringify({ projectId, prompt }),
        })
    }

    getGenerationStatus(jobId) {
        return this.request(`/generate/status/${jobId}`)
    }

    // ── Health ──
    healthCheck() {
        return this.request('/health')
    }
}

export const api = new ApiClient()
