const express = require("express")
const router = express.Router()
const Project = require("../models/Project")
const Message = require("../models/Message")
const Version = require("../models/Version")
const WorkspaceMember = require("../models/WorkspaceMember")
const Workspace = require("../models/Workspace")
const { generateProjectName } = require('../utils/nameGenerator.js');

const { requireAuth } = require('../middleware/requireAuth');

// Helper: check if user can access a project (owner or workspace member)
async function getProjectWithAccess(projectId, userId) {
    // First try direct ownership
    let project = await Project.findOne({ _id: projectId, userId });
    if (project) return { project, role: 'owner', isCreator: true };

    // Otherwise check if user is a workspace member for this project
    project = await Project.findById(projectId);
    if (!project || !project.workspaceId) return null;

    const member = await WorkspaceMember.findOne({ 
        workspaceId: project.workspaceId, 
        userId, 
        status: 'active' 
    });
    if (!member) return null;

    return { project, role: member.role, isCreator: false };
}

// ── GET /api/projects — List user's projects ──
router.get("/", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const workspaceId = req.query.workspaceId;
        
        if (workspaceId) {
            // Check if user is a member of this workspace
            const member = await WorkspaceMember.findOne({ workspaceId, userId, status: 'active' });
            if (member) {
                // Return ALL projects in this workspace (not just user's own)
                const projects = await Project.find({ workspaceId }).sort({ updatedAt: -1 });
                return res.json({ projects, memberRole: member.role });
            }
        }

        // Fallback: return only user's own projects
        const query = { userId };
        if (workspaceId) {
            query.workspaceId = workspaceId;
        }

        const projects = await Project.find(query).sort({ updatedAt: -1 });
        res.json({ projects, memberRole: 'owner' });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/projects — Create a new workspace ──
router.post("/", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { name, folderId, workspaceId, templateId, prompt: userPrompt } = req.body;
        
        let projectName = name;
        if (!projectName && userPrompt) {
            projectName = await generateProjectName(userPrompt);
        } else if (!projectName) {
            projectName = 'Untitled Project';
        }

        let currentFileTree = {};
        let theme = null;

        // If a templateId is provided, render the template preview HTML
        if (templateId) {
            try {
                const fs = require('fs/promises');
                const path = require('path');
                const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

                // templateId format: "category/filename" e.g. "saas/modern-startup"
                const [category, templateName] = templateId.split('/');
                const jsonPath = path.join(TEMPLATES_DIR, category, `${templateName}.json`);

                // Strategy 1: Check if a pre-built raw HTML file exists (highest quality)
                const nameNoHyphens = templateName.replace(/-/g, '');
                const rawHtmlPaths = [
                    path.join(TEMPLATES_DIR, category, `${templateName}.html`),
                    path.join(TEMPLATES_DIR, category, `${nameNoHyphens}.html`),
                    path.join(TEMPLATES_DIR, 'raw', `${templateName}.html`),
                    path.join(TEMPLATES_DIR, 'raw', `${nameNoHyphens}.html`),
                ];

                let previewHtml = null;

                for (const htmlPath of rawHtmlPaths) {
                    try {
                        previewHtml = await fs.readFile(htmlPath, 'utf-8');
                        console.log(`[ProjectCreate] ✅ Loaded raw HTML preview from: ${htmlPath}`);
                        break;
                    } catch {}
                }

                // Strategy 2: Render from JSON using the component-kit html-renderer
                if (!previewHtml) {
                    try {
                        const jsonContent = await fs.readFile(jsonPath, 'utf-8');
                        const templateData = JSON.parse(jsonContent);
                        const { renderToHTML } = require('../component-kit/html-renderer.js');
                        const { getTheme } = require('../config/themeRegistry.js');
                        const themeConfig = getTheme('modern-dark');
                        previewHtml = renderToHTML(templateData, themeConfig);
                        console.log(`[ProjectCreate] ✅ Rendered HTML from JSON template: ${jsonPath} (${previewHtml.length} chars)`);
                    } catch (renderErr) {
                        console.warn(`[ProjectCreate] ⚠️ Failed to render template ${templateId}:`, renderErr.message);
                    }
                }

                if (previewHtml) {
                    currentFileTree = { 'index.html': previewHtml };
                    theme = 'modern-dark';
                }
            } catch (tplErr) {
                console.warn(`[ProjectCreate] Template loading failed for "${templateId}":`, tplErr.message);
            }
        }

        // Apply workspace default visibility setting if workspace exists
        let visibility = 'workspace'; // fallback default
        if (workspaceId) {
            try {
                const ws = await Workspace.findById(workspaceId).lean();
                if (ws?.privacySettings?.defaultProjectVisibility) {
                    visibility = ws.privacySettings.defaultProjectVisibility;
                }
            } catch (e) {
                console.warn('[ProjectCreate] Could not read workspace privacy settings:', e.message);
            }
        }

        const project = await Project.create({
            userId,
            workspaceId: workspaceId || null,
            name: projectName,
            status: currentFileTree['index.html'] ? 'done' : 'idle',
            folderId: folderId || null,
            currentFileTree,
            theme,
            visibility,
            outputTrack: currentFileTree['index.html'] ? 'html' : 'html'
        });

        console.log(`[ProjectCreate] Created project ${project._id} (visibility: ${visibility})${templateId ? ` (from template: ${templateId})` : ''}`);
        res.status(201).json({ project });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/projects/:id/preview-html — Lightweight: return just index.html for hover previews ──
router.get("/:id/preview-html", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const access = await getProjectWithAccess(req.params.id, userId);
        if (!access) {
            return res.status(404).json({ error: "Project not found" });
        }
        const html = access.project.currentFileTree?.['index.html'] || null;
        res.json({ html, name: access.project.name });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/projects/:id — Get full workspace context (HYDRATION) ──
router.get("/:id", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId
        const access = await getProjectWithAccess(req.params.id, userId);
        if (!access) {
            return res.status(404).json({ error: "Project not found" })
        }
        
        // Hydrate all messages for this project
        const messages = await Message.find({ projectId: access.project._id }).sort('createdAt');
        
        res.json({ project: access.project, messages, memberRole: access.role })
    } catch (error) {
        next(error)
    }
});

// ── POST /api/projects/:id/deploy — Deploy project to Cloudflare R2 ──
router.post("/:id/deploy", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const access = await getProjectWithAccess(req.params.id, userId);
        
        if (!access) {
            return res.status(404).json({ error: "Project not found" });
        }
        // Viewers cannot deploy
        if (access.role === 'viewer') {
            return res.status(403).json({ error: "You don't have permission to deploy this project" });
        }

        // ENFORCE: whoCanPublish — check workspace setting
        const project = access.project;
        if (project.workspaceId) {
            const ws = await Workspace.findById(project.workspaceId).lean();
            const whoCanPublish = ws?.privacySettings?.whoCanPublish || 'editors';
            if (whoCanPublish === 'owners' && !['owner'].includes(access.role)) {
                return res.status(403).json({ error: "Publishing is restricted to workspace owners only" });
            }
        }

        if (!project.currentFileTree || Object.keys(project.currentFileTree).length === 0) {
            return res.status(400).json({ error: "Project has no files to deploy yet." });
        }

        const { deployProject } = require('../services/deployService');
        
        // deployProject returns the Netlify siteId and publicUrl
        const { siteId, publicUrl } = await deployProject(project.netlifySiteId, project.currentFileTree);
        
        project.netlifySiteId = siteId;
        project.publishedUrl = publicUrl;
        await project.save();

        res.json({ success: true, publishedUrl: publicUrl });
    } catch (error) {
        console.error("[ProjectRoute] Deploy error:", error.message);
        res.status(500).json({ error: "Failed to deploy project: " + error.message });
    }
});

// ── PUT /api/projects/:id — Rename or update workspace ──
router.put("/:id", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId
        const access = await getProjectWithAccess(req.params.id, userId);
        if (!access) return res.status(404).json({ error: "Project not found" });
        // Only owner, admin, editor can update
        if (access.role === 'viewer') {
            return res.status(403).json({ error: "Viewers cannot update projects" });
        }

        const { name, previewUrl, netlifySiteId, activeVersionId, folderId } = req.body
        
        const updateData = { name, previewUrl, netlifySiteId, activeVersionId }
        if (folderId !== undefined) {
            updateData.folderId = folderId
        }
 
        const project = await Project.findOneAndUpdate(
            { _id: req.params.id },
            { $set: updateData },
            { new: true, runValidators: true }
        )

        if (!project) return res.status(404).json({ error: "Project not found" })
        res.json({ project })
    } catch (error) {
        next(error)
    }
})

// ── PATCH /api/projects/:id/config — Update style configuration ──
router.patch("/:id/config", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId
        const { theme, websiteName, description, logoUrl, brandColors, isConfigured } = req.body

        const access = await getProjectWithAccess(req.params.id, userId);
        if (!access) return res.status(404).json({ error: "Project not found" });
        if (access.role === 'viewer') return res.status(403).json({ error: "Viewers cannot config projects" });

        const project = await Project.findOneAndUpdate(
            { _id: req.params.id },
            { 
                $set: { 
                    theme, 
                    websiteName, 
                    description, 
                    logoUrl, 
                    brandColors, 
                    isConfigured 
                } 
            },
            { new: true, runValidators: true }
        )

        if (!project) return res.status(404).json({ error: "Project not found" })
        res.json({ project })
    } catch (error) {
        next(error)
    }
})

// ── PUT /api/projects/:id/star — Toggle star status ──
router.put("/:id/star", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const access = await getProjectWithAccess(req.params.id, userId);
        
        if (!access) return res.status(404).json({ error: "Project not found" });

        const project = access.project;
        project.isStarred = !project.isStarred;
        await project.save();
        
        res.json({ project });
    } catch (error) {
        next(error);
    }
})

// ── POST /api/projects/:id/unpublish — Take down the live site ──
router.post("/:id/unpublish", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const access = await getProjectWithAccess(req.params.id, userId);
        if (!access) return res.status(404).json({ error: "Project not found" });
        if (access.role !== 'owner' && access.role !== 'admin') {
            return res.status(403).json({ error: "Only admins or owners can unpublish projects" });
        }
        const project = access.project;

        if (!project.publishedUrl) {
            return res.status(400).json({ error: "Project is not published" });
        }

        project.publishedUrl = null;
        project.netlifySiteId = null;
        await project.save();

        res.json({ success: true, message: "Project unpublished successfully" });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/projects/:id/remix — Duplicate the project ──
router.post("/:id/remix", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const access = await getProjectWithAccess(req.params.id, userId);
        if (!access) return res.status(404).json({ error: "Project not found" });
        const original = access.project;;

        const remixed = await Project.create({
            userId,
            workspaceId: original.workspaceId,
            name: `${original.name} (copy)`,
            status: original.status,
            folderId: original.folderId || null,
            currentFileTree: original.currentFileTree || {},
            theme: original.theme,
            outputTrack: original.outputTrack,
            techStack: original.techStack,
            websiteName: original.websiteName,
            description: original.description,
            logoUrl: original.logoUrl,
            brandColors: original.brandColors,
            isConfigured: original.isConfigured
        });

        console.log(`[ProjectRemix] Remixed ${original._id} → ${remixed._id}`);
        res.status(201).json({ project: remixed });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/projects/:id — Delete workspace ──
router.delete("/:id", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId
        const access = await getProjectWithAccess(req.params.id, userId);
        if (!access) return res.status(404).json({ error: "Project not found" });
        // Only owner and admin can delete
        if (!['owner', 'admin'].includes(access.role)) {
            return res.status(403).json({ error: "Only owners and admins can delete projects" });
        }

        await Project.findByIdAndDelete(req.params.id);
        
        // Cascade delete messages
        await Message.deleteMany({ projectId: req.params.id });
        
        res.json({ message: "Project deleted" })
    } catch (error) {
        next(error)
    }
})

// ── POST /api/projects/:id/messages — Add a message to a workspace ──
router.post("/:id/messages", requireAuth, async (req, res, next) => {
    try {
        const { content, role } = req.body;
        if (!content || !role) {
            return res.status(400).json({ error: "content and role are required" });
        }
        const message = await Message.create({
            projectId: req.params.id,
            role,
            content,
            status: 'done'
        });
        res.status(201).json({ message });
    } catch (error) {
        next(error);
    }
});
// ── GET /api/projects/:id/versions — Get history of project versions ──
router.get("/:id/versions", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const access = await getProjectWithAccess(req.params.id, userId);
        
        if (!access) return res.status(404).json({ error: "Project not found" });
        const project = access.project;
        
        // Exclude the heavy fileTree field for the list view
        const versions = await Version.find({ projectId: project._id })
            .select('-fileTree')
            .sort({ createdAt: -1 });
            
        res.json({ versions, activeVersionId: project.activeVersionId });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/projects/:id/versions/:versionId/restore — Restore a specific version ──
router.post("/:id/versions/:versionId/restore", requireAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const access = await getProjectWithAccess(req.params.id, userId);
        
        if (!access) return res.status(404).json({ error: "Project not found" });
        if (access.role === 'viewer') return res.status(403).json({ error: "Viewers cannot restore versions" });
        const project = access.project;
        
        const version = await Version.findOne({ _id: req.params.versionId, projectId: project._id });
        if (!version) return res.status(404).json({ error: "Version not found" });
        
        project.currentFileTree = version.fileTree;
        project.activeVersionId = version._id;
        await project.save();
        
        res.json({ message: "Restored successfully", project });
    } catch (error) {
        next(error);
    }
});

module.exports = router
