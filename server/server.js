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


const app = express()
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
app.use(express.json({ limit: "10mb" }))

// Clerk middleware
app.use(clerkMiddleware());

// ── Routes ──
app.use("/api/projects", projectRoutes)
app.use("/api/generate", generateRoutes)
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