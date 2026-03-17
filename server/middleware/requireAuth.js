const User = require('../models/User');

/**
 * Middleware: requireAuth
 * 
 * Enforces that the incoming request has a valid Clerk authentication session.
 * Since `clerkMiddleware()` is run globally in `server.js`, `req.auth` will 
 * automatically contain the decoded JWT payload including `userId` if valid.
 */
const requireAuth = (req, res, next) => {
  try {
    // Check if the Clerk middleware successfully parsed a session
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Attach user payload as specified in 1.4 architecture plan
    req.user = { 
      clerkId: req.auth.userId 
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = { requireAuth };
