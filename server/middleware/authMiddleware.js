const { requireAuth } = require("@clerk/express");

// Middleware to protect routes
const authMiddleware = requireAuth();

module.exports = authMiddleware;