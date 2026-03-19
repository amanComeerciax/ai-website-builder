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
const paymentRoutes = require("./routes/payment")


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
   max: 100,
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

// JSON parser for all other routes (MUST come AFTER the webhook handler above)
app.use(express.json({ limit: "10mb" }))

// Clerk middleware intentionally removed from global scope to prevent hanging
// on public routes like /health and /generate.

// ── Routes ──
app.use("/api/auth", authRoutes)
app.use("/api/projects", projectRoutes)
app.use("/api/generate", generateRoutes)
app.use("/api/health", healthRoutes)
app.use("/api/payment", paymentRoutes)

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
      app.listen(PORT, () => {
         console.log(`\n🚀 StackForge AI Server running on port ${PORT}`)
         console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}\n`)
      })
   } catch (error) {
      console.error("Failed to start server:", error.message)
      process.exit(1)
   }
}

startServer()