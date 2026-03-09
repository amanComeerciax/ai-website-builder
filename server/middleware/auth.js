// Auth Middleware — Stub (Day 4)
// Will use Clerk SDK to validate JWT tokens

const requireAuth = (req, res, next) => {
    // TODO: Replace with Clerk requireAuth() middleware
    // For now, allow all requests with a demo user
    req.auth = {
        userId: req.headers["x-user-id"] || "demo-user",
    }
    next()
}

const optionalAuth = (req, res, next) => {
    req.auth = {
        userId: req.headers["x-user-id"] || null,
    }
    next()
}

module.exports = { requireAuth, optionalAuth }
