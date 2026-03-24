const { getAuth, verifyToken, createClerkClient } = require('@clerk/express');

/**
 * Middleware: requireAuth
 * 
 * Enforces that the incoming request has a valid Clerk authentication session.
 * Uses a two-step approach:
 *   1. Try getAuth() from clerkMiddleware (works with cookies)
 *   2. Fallback: manually verify the Bearer JWT token using verifyToken()
 */
const requireAuth = async (req, res, next) => {
  try {
    // Step 1: Try clerkMiddleware's getAuth() — works when cookies are forwarded
    const auth = getAuth(req);
    
    if (auth && auth.userId) {
      req.user = { clerkId: auth.userId };
      req.auth = auth;
      console.log(`[Auth] ✅ Session auth: ${auth.userId}`);
      return next();
    }

    // Step 2: Fallback — manually verify the Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn(`[Auth] ❌ No valid auth: getAuth returned null, no Bearer token`);
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // Verify the JWT using Clerk's secret key
      const decoded = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      if (!decoded || !decoded.sub) {
        console.warn(`[Auth] ❌ Token verified but no sub claim`);
        return res.status(401).json({ error: "Unauthorized" });
      }

      // decoded.sub is the Clerk userId
      req.user = { clerkId: decoded.sub };
      req.auth = { 
        userId: decoded.sub, 
        sessionId: decoded.sid,
        sessionClaims: decoded 
      };
      console.log(`[Auth] ✅ JWT verified: ${decoded.sub}`);
      return next();
    } catch (verifyErr) {
      console.error(`[Auth] ❌ JWT verify failed:`, verifyErr.message);
      return res.status(401).json({ error: "Unauthorized" });
    }

  } catch (error) {
    console.error("[Auth] Middleware Error:", error.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = { requireAuth };
