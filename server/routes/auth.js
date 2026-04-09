const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Project = require('../models/Project');
const Folder = require('../models/Folder');

const router = express.Router();

/**
 * 1.5 POST /api/auth/sync
 * 
 * Invoked when Clerk creates a user or the user logs into the frontend.
 * Upserts the MongoDB user document using their clerkId.
 */
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const { email, name, avatar } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required for syncing" });
    }

    const user = await User.findOneAndUpdate(
      { clerkId: req.user.clerkId },
      { 
        email, 
        name: name || "", 
        avatar: avatar || "" 
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Auth Sync Error:", error);
    return res.status(500).json({ error: "Failed to sync user data" });
  }
});

/**
 * 1.6 GET /api/auth/me
 * 
 * Protected route for the frontend dashboard to fetch the usage meter
 * and subscription tier payload on application mount.
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    // Auto-create user if not found (handles first-time login without sync)
    let user = await User.findOne({ clerkId: req.user.clerkId });
    
    if (!user) {
      // Auto-create using Clerk session data
      const email = req.auth?.sessionClaims?.email || 
                    req.auth?.sessionClaims?.primary_email_address || 
                    `user_${req.user.clerkId}@clerk.dev`;
      
      user = await User.findOneAndUpdate(
        { clerkId: req.user.clerkId },
        { email, tier: 'free', usage: { generationsThisMonth: 0 } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`[Auth] Auto-created user: ${user.email} (${req.user.clerkId})`);
    }

    const tier = user.tier || user.subscription?.tier || 'free';

    // MULTI-WORKSPACE MIGRATION LOGIC
    let workspaces = await Workspace.find({ userId: req.user.clerkId }).sort({ createdAt: 1 });
    let defaultWorkspaceId = null;

    if (workspaces.length === 0) {
      // Auto-create default workspace
      const userName = user.name || user.email.split('@')[0];
      const defaultWorkspace = await Workspace.create({
        userId: req.user.clerkId,
        name: `${userName}'s StackForge`,
        plan: tier
      });
      workspaces = [defaultWorkspace];
      defaultWorkspaceId = defaultWorkspace._id;
      console.log(`[Auth] Auto-created default workspace for ${user.email}`);
    } else {
      defaultWorkspaceId = workspaces[0]._id;
    }

    // Migrate old projects/folders that have no workspaceId
    await Project.updateMany(
      { userId: req.user.clerkId, workspaceId: null },
      { $set: { workspaceId: defaultWorkspaceId } }
    );
    await Folder.updateMany(
      { userId: req.user.clerkId, workspaceId: null },
      { $set: { workspaceId: defaultWorkspaceId } }
    );

    // Determine active workspace: use lastActiveWorkspaceId if it's still valid, otherwise default
    let activeWorkspaceId = defaultWorkspaceId;
    if (user.lastActiveWorkspaceId) {
      const isValid = workspaces.some(w => w._id.toString() === user.lastActiveWorkspaceId.toString());
      if (isValid) {
        activeWorkspaceId = user.lastActiveWorkspaceId;
      } else {
        // Stale reference — reset to default
        user.lastActiveWorkspaceId = defaultWorkspaceId;
        await user.save();
      }
    }

    return res.status(200).json({
      email: user.email,
      name: user.name || "",
      avatar: user.avatar || "",
      tier,
      usage: user.usage || { generationsThisMonth: 0 },
      defaultWorkspaceId,
      activeWorkspaceId,
      workspaces: workspaces.map(w => ({ _id: w._id, name: w.name, plan: w.plan, createdAt: w.createdAt }))
    });
  } catch (error) {
    console.error("Auth Fetch Error:", error);
    return res.status(500).json({ error: "Failed to fetch user data" });
  }
});

// ── PUT /api/auth/active-workspace — Persist the last selected workspace ──
router.put('/active-workspace', requireAuth, async (req, res) => {
  try {
    const { workspaceId } = req.body;
    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }
    
    await User.findOneAndUpdate(
      { clerkId: req.user.clerkId },
      { $set: { lastActiveWorkspaceId: workspaceId } }
    );
    
    res.json({ success: true, activeWorkspaceId: workspaceId });
  } catch (error) {
    console.error("Set Active Workspace Error:", error);
    res.status(500).json({ error: "Failed to set active workspace" });
  }
});

module.exports = router;
