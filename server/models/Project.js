const mongoose = require("mongoose")

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Project name is required"],
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        userId: {
            type: String, // Will be Clerk user ID
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ["draft", "queued", "understanding", "planning", "generating", "assembling", "complete", "failed"],
            default: "draft",
        },
        prompt: {
            type: String,
            required: [true, "Initial prompt is required"],
        },
        // Generated file tree (stored as JSON, actual files in R2)
        files: [
            {
                path: { type: String, required: true },
                content: { type: String },
                language: { type: String },
            },
        ],
        // AI pipeline metadata
        aiPlan: {
            siteType: String,
            pages: [String],
            features: [String],
            colorScheme: String,
            fileTree: [String],
        },
        // Deployment info
        deployment: {
            provider: { type: String, enum: ["netlify", "vercel", null], default: null },
            url: String,
            deployId: String,
            deployedAt: Date,
        },
        // Storage
        zipUrl: String, // Cloudflare R2 URL

        // Generation job tracking
        jobId: String,
        generationCount: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    }
)

// Index for efficient queries
projectSchema.index({ userId: 1, createdAt: -1 })

module.exports = mongoose.model("Project", projectSchema)
