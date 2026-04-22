const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAdmin } = require('../middleware/requireAuth');

/**
 * GET /api/admin/users
 * Returns a list of all users. Admin only.
 */
router.get('/users', requireAdmin, async (req, res, next) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 }).lean();
        res.json({ users });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/admin/users/:clerkId/role
 * Updates the role of a user. Admin only.
 */
router.put('/users/:clerkId/role', requireAdmin, async (req, res, next) => {
    try {
        const { clerkId } = req.params;
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Prevent self-demotion to ensure at least one admin exists
        if (req.user.clerkId === clerkId && role !== 'admin') {
            return res.status(400).json({ error: 'You cannot demote yourself' });
        }

        const user = await User.findOneAndUpdate(
            { clerkId },
            { role },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
