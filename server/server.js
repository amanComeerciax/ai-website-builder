const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
require("dotenv").config()

const { connectDB } = require("./config/db")
const { clerkMiddleware } = require("@clerk/express");
// Import routes
const projectRoutes = require("./routes/projectRoutes")
const generateRoutes = require("./routes/generate")
const healthRoutes = require("./routes/health")
const authRoutes = require("./routes/auth") // Subtask 1.5, 1.6 Auth Routes
const folderRoutes = require("./routes/folderRoutes")
const templateRoutes = require("./routes/templateRoutes")
const workspaceRoutes = require("./routes/workspaceRoutes")

const paymentRoutes = require("./routes/payment")

const invitationRoutes = require("./routes/invitationRoutes")
const memberRoutes = require("./routes/memberRoutes")

const mcpManager = require("./services/mcpManager")

// Initialize MCP Tools
mcpManager.init();


const app = express()
app.get('/ping', (req, res) => res.send('pong'))
const PORT = process.env.PORT || 5000

// ── Security Middleware ──
app.use(helmet())
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
}))

// ── Rate Limiting ──
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // generous limit for development — tighten for production
    message: { error: "Too many requests, please try again later." },
})
app.use("/api/", apiLimiter)

// ── Body Parsing ──
// CRITICAL: Stripe webhook must receive the raw body (Buffer) for signature verification.
// Mount it DIRECTLY here before express.json() parses anything.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('./models/User');

const PLAN_TO_TIER = { 'Basic': 'free', 'Team': 'pro', 'Agency': 'business' };

app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('❌ STRIPE_WEBHOOK_SECRET is not configured');
        return res.status(500).send('Webhook secret not configured');
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error(`❌ Webhook signature failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`✅ Webhook received: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { userId, planName } = session.metadata;
        const tier = PLAN_TO_TIER[planName] || 'pro';

        if (userId && userId !== 'anonymous') {
            try {
                const updated = await User.findOneAndUpdate(
                    { clerkId: userId },
                    { $set: { 'subscription.tier': tier, 'subscription.status': 'active', 'subscription.stripeCustomerId': session.customer } },
                    { upsert: true, returnDocument: 'after' }
                );
                console.log(`✅ User ${userId} upgraded to "${tier}"`);
            } catch (e) {
                console.error(`❌ DB update failed:`, e.message);
            }
        }
    }

    res.status(200).json({ received: true });
});

app.use(express.json({ limit: "10mb" }))

// ── Global Middleware ──
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        console.log(`[Request] ${req.method} ${req.path} | Auth: ${req.headers.authorization ? 'Bearer Present' : 'NONE'}`);
    }
    next();
});

console.log(`[Server] Clerk Secret Key present: ${!!process.env.CLERK_SECRET_KEY}`);
app.use(clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
    debug: true
}))

// ── Routes ──
app.use("/api/auth", authRoutes)
app.use("/api/projects", projectRoutes)
app.use("/api/generate", generateRoutes)
app.use("/api/folders", folderRoutes)
app.use("/api/templates", templateRoutes)
app.use("/api/workspaces", workspaceRoutes)

app.use("/api/payment", paymentRoutes)

app.use("/api/workspaces", memberRoutes)  // sub-routes: /:id/members, /:id/invitations
app.use("/api/invitations", invitationRoutes)
        
app.use("/api/health", healthRoutes)

// ── Global Error Handler ──
app.use((err, req, res, next) => {
    console.error("❌ Server Error:", err.message)
    res.status(err.status || 500).json({
        error: err.message || "Internal server error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    })
})

// ── Start Server ──
async function startServer() {
    try {
        await connectDB()
        
        // 🚀 Initialize AI Generation Worker in-process (Free Tier Optimization)
        // This allows running the API and Job Queue in a single Render Free Web Service.
        require("./workers/aiWorker")
        console.log("⚙️  AI Generation Worker initialized within API process.")

        app.listen(PORT, () => {
            console.log(`\n🚀 StackForge AI Server running on port ${PORT}`)
            console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}\n`)
        })
    } catch (error) {
        console.error("❌ ERROR: Server Startup Failed (Detailed):", error);
        process.exit(1);
    }
}

// Global Error Handler for JSON responses
app.use((err, req, res, next) => {
    console.error("💥 Global Backend Error:", err);
    res.status(500).json({ 
        error: "Internal Server Error", 
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
});


startServer()