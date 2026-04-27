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

    // ── Workspaces ──
    getWorkspaces(token) {
        return this.request('/workspaces', {}, token)
    }

    createWorkspace(data, token) {
        return this.request('/workspaces', {
            method: 'POST',
            body: JSON.stringify(data),
        }, token)
    }

    deleteWorkspace(id, token) {
        return this.request(`/workspaces/${id}`, {
            method: 'DELETE',
        }, token)
    }

    setActiveWorkspace(workspaceId, token) {
        return this.request('/auth/active-workspace', {
            method: 'PUT',
            body: JSON.stringify({ workspaceId }),
        }, token)
    }

    // ── Projects ──
    getProjects(token, workspaceId = null) {
        const url = workspaceId ? `/projects?workspaceId=${workspaceId}` : '/projects';
        return this.request(url, {}, token)
    }

    getProject(id, token, inviteToken = null) {
        const url = inviteToken ? `/projects/${id}?inviteToken=${inviteToken}` : `/projects/${id}`;
        return this.request(url, {}, token)
    }

    // Full workspace hydration: returns { project, messages }
    getWorkspace(id, token, inviteToken = null) {
        const url = inviteToken ? `/projects/${id}?inviteToken=${inviteToken}` : `/projects/${id}`;
        return this.request(url, {}, token)
    }

    // Lightweight: just returns { html, name } for hover previews
    getProjectPreviewHtml(id, token) {
        return this.request(`/projects/${id}/preview-html`, {}, token)
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

    unpublishProject(id, token) {
        return this.request(`/projects/${id}/unpublish`, {
            method: 'POST',
        }, token)
    }

    remixProject(id, token) {
        return this.request(`/projects/${id}/remix`, {
            method: 'POST',
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

    deleteVersion(projectId, versionId, token) {
        return this.request(`/projects/${projectId}/versions/${versionId}`, {
            method: 'DELETE',
        }, token)
    }

    // ── Folders ──
    getFolders(token, workspaceId = null) {
        const url = workspaceId ? `/folders?workspaceId=${workspaceId}` : '/folders';
        return this.request(url, {}, token)
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
                model: model || 'mistral', 
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

    // ── Invitations ──
    sendInvitation(data, token) {
        return this.request('/invitations', {
            method: 'POST',
            body: JSON.stringify(data),
        }, token)
    }

    getInbox(token) {
        return this.request('/invitations/inbox', {}, token)
    }

    acceptInvitation(id, token) {
        return this.request(`/invitations/${id}/accept`, {
            method: 'PUT',
        }, token)
    }

    declineInvitation(id, token) {
        return this.request(`/invitations/${id}/decline`, {
            method: 'PUT',
        }, token)
    }

    generateInviteLink(data, token) {
        return this.request('/invitations/link', {
            method: 'POST',
            body: JSON.stringify(data),
        }, token)
    }

    joinViaLink(linkToken, authToken) {
        return this.request(`/invitations/join/${linkToken}`, {
            method: 'POST',
        }, authToken)
    }

    // ── Project Invitations ──
    getProjectCollaborators(projectId, token) {
        return this.request(`/projects/${projectId}/invitations`, {}, token)
    }

    sendProjectInvitation(projectId, data, token) {
        return this.request(`/projects/${projectId}/invitations`, {
            method: 'POST',
            body: JSON.stringify(data),
        }, token)
    }

    generateProjectInviteLink(projectId, data, token) {
        return this.request(`/projects/${projectId}/invitations/link`, {
            method: 'POST',
            body: JSON.stringify(data),
        }, token)
    }

    revokeProjectInvitation(projectId, invitationId, token) {
        return this.request(`/projects/${projectId}/invitations/${invitationId}`, {
            method: 'DELETE',
        }, token)
    }

    updateProjectInvitationRole(projectId, invitationId, role, token) {
        return this.request(`/projects/${projectId}/invitations/${invitationId}`, {
            method: 'PUT',
            body: JSON.stringify({ role })
        }, token)
    }

    getProjectInviteInfo(linkToken) {
        return this.request(`/projects/invite/${linkToken}`, {})
    }

    acceptProjectInvite(linkToken, token) {
        return this.request(`/projects/invite/${linkToken}/accept`, {
            method: 'POST',
        }, token)
    }

    declineProjectInvite(linkToken, token) {
        return this.request(`/projects/invite/${linkToken}/decline`, {
            method: 'POST',
        }, token)
    }

    // Get projects shared with the current user (project-level collaborator)
    getSharedProjects(token) {
        return this.request(`/projects/shared-with-me`, {}, token)
    }

    // Remove a collaborator from a project
    removeProjectCollaborator(projectId, collaboratorUserId, token) {
        return this.request(`/projects/${projectId}/collaborators/${collaboratorUserId}`, {
            method: 'DELETE',
        }, token)
    }

    // Update collaborator role
    updateProjectCollaboratorRole(projectId, collaboratorUserId, role, token) {
        return this.request(`/projects/${projectId}/collaborators/${collaboratorUserId}`, {
            method: 'PUT',
            body: JSON.stringify({ role })
        }, token)
    }

    // Get ALL project collaborators for a workspace (for settings People page)
    getWorkspaceProjectCollaborators(workspaceId, token) {
        return this.request(`/workspaces/${workspaceId}/project-collaborators`, {}, token)
    }
    // ── Members ──
    getWorkspaceMembers(workspaceId, token) {
        return this.request(`/workspaces/${workspaceId}/members`, {}, token)
    }

    updateMemberRole(workspaceId, memberId, role, token) {
        return this.request(`/workspaces/${workspaceId}/members/${memberId}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role }),
        }, token)
    }

    removeMember(workspaceId, memberId, token) {
        return this.request(`/workspaces/${workspaceId}/members/${memberId}`, {
            method: 'DELETE',
        }, token)
    }

    blockMember(workspaceId, memberId, token) {
        return this.request(`/workspaces/${workspaceId}/members/${memberId}/block`, {
            method: 'PUT',
        }, token)
    }

    getWorkspaceInvitations(workspaceId, token) {
        return this.request(`/workspaces/${workspaceId}/invitations`, {}, token)
    }

    updateWorkspace(id, data, token) {
        return this.request(`/workspaces/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }, token)
    }

    uploadWorkspaceAvatar(id, avatar, token) {
        return this.request(`/workspaces/${id}/avatar`, {
            method: 'POST',
            body: JSON.stringify({ avatar }),
        }, token)
    }

    // ── Workspace Privacy Settings ──
    getWorkspacePrivacy(workspaceId, token) {
        return this.request(`/workspaces/${workspaceId}/privacy`, {}, token)
    }

    updateWorkspacePrivacy(workspaceId, settings, token) {
        return this.request(`/workspaces/${workspaceId}/privacy`, {
            method: 'PUT',
            body: JSON.stringify(settings),
        }, token)
    }

    // ── Health ──
    healthCheck() {
        return this.request('/health')
    }
}

export const apiClient = new ApiClient()
