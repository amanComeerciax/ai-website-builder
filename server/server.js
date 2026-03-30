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
const User = require("./models/User")
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


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
// ── Stripe Webhook (MUST come BEFORE express.json()) ──
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`❌ Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata.userId;
        const planName = session.metadata.planName;

        console.log(`✅ Payment successful for user ${userId} (Plan: ${planName})`);
        
        if (userId) {
            try {
                await User.findOneAndUpdate(
                    { clerkId: userId }, 
                    { 
                        'subscription.tier': planName.toLowerCase(),
                        'subscription.status': 'active'
                    }
                );
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