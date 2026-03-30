const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const User = require('../models/User');

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
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
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
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
      console.log(`[Auth] Auto-created user: ${user.email} (${req.user.clerkId})`);
    }

    const tier = user.tier || user.subscription?.tier || 'free';

    return res.status(200).json({
      email: user.email,
      name: user.name || "",
      avatar: user.avatar || "",
      tier,
      usage: user.usage || { generationsThisMonth: 0 }
    });
  } catch (error) {
    console.error("Auth Fetch Error:", error);
    return res.status(500).json({ error: "Failed to fetch user data" });
  }
});

module.exports = router;
