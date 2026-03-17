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
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required for syncing" });
    }

    const user = await User.findOneAndUpdate(
      { clerkId: req.user.clerkId },
      { email },
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
    const user = await User.findOne({ clerkId: req.user.clerkId });
    
    if (!user) {
      return res.status(404).json({ error: "User not found in database" });
    }

    // Safely extract tier (falling back to subscription object if legacy data)
    const tier = user.tier || user.subscription?.tier || 'free';

    return res.status(200).json({
      email: user.email,
      tier,
      usage: user.usage || { generationsThisMonth: 0 }
    });
  } catch (error) {
    console.error("Auth Fetch Error:", error);
    return res.status(500).json({ error: "Failed to fetch user data" });
  }
});

module.exports = router;
