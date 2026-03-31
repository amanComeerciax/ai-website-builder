const express = require("express")
const router = express.Router()
const Folder = require("../models/Folder")
const Project = require("../models/Project")
const { verifyToken } = require("@clerk/express")

/**
 * Real Auth middleware — extracts the Clerk userId from the JWT Bearer token.
 */
const clerkAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No authorization token provided" });
    }
    try {
        const token = authHeader.split(' ')[1];
        const payload = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
        });
        const userId = payload.sub;
        if (!userId) return res.status(401).json({ error: "Invalid token" });
        req.auth = { userId };
        next();
    } catch (error) {
        console.error('[ClerkAuth/Folders] Token verification failed:', error.message);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

// ── GET /api/folders — List user's folders ──
router.get("/", clerkAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const folders = await Folder.find({ userId }).sort({ createdAt: -1 });
        res.json({ folders });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/folders — Create a new folder ──
router.post("/", clerkAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const { name, visibility } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: "Folder name is required" });
        }

        const folder = await Folder.create({
            userId,
            name,
            visibility: visibility || 'personal'
        });
        
        res.status(201).json({ folder });
    } catch (error) {
        next(error);
    }
});

// ── GET /api/folders/:id/projects — Get all projects inside a folder ──
router.get("/:id/projects", clerkAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        
        // Verify user owns the folder
        const folder = await Folder.findOne({ _id: req.params.id, userId });
        if (!folder) return res.status(404).json({ error: "Folder not found" });
        
        const projects = await Project.find({ folderId: folder._id, userId }).sort({ createdAt: -1 });
        res.json({ folder, projects });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/folders/:id — Delete a folder ──
router.delete("/:id", clerkAuth, async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const folder = await Folder.findOneAndDelete({ _id: req.params.id, userId });
        
        if (!folder) return res.status(404).json({ error: "Folder not found" });
        
        // Dissociate projects from this folder (don't delete projects)
        await Project.updateMany({ folderId: folder._id }, { $set: { folderId: null } });
        
        res.json({ message: "Folder deleted" });
    } catch (error) {
        next(error);
    }
});

module.exports = router
