const mongoose = require("mongoose")

const userSchema = new mongoose.Schema(
    {
        clerkId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            default: "",
        },
        avatar: {
            type: String,
            default: "",
        },
        // Subscription tier
        subscription: {
            tier: {
                type: String,
                enum: ["free", "pro", "business"],
                default: "free",
            },
            stripeCustomerId: String,
            stripeSubscriptionId: String,
            currentPeriodEnd: Date,
            status: {
                type: String,
                enum: ["active", "canceled", "past_due", "inactive"],
                default: "active",
            },
        },
        // Usage tracking
        usage: {
            projectCount: { type: Number, default: 0 },
            generationsThisMonth: { type: Number, default: 0 },
            generationsResetAt: { type: Date, default: Date.now },
        },
        // Workspace - persists which workspace the user last used
        lastActiveWorkspaceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Workspace',
            default: null
        },
    },
    {
        timestamps: true,
    }
)

// Reset monthly generation count
userSchema.methods.checkAndResetGenerations = function () {
    const now = new Date()
    const resetDate = new Date(this.usage.generationsResetAt)

    // If more than 30 days since last reset
    if (now - resetDate > 30 * 24 * 60 * 60 * 1000) {
        this.usage.generationsThisMonth = 0
        this.usage.generationsResetAt = now
    }
}

// Get tier limits
userSchema.methods.getTierLimits = function () {
    const limits = {
        free: { maxProjects: 1, maxGenerations: 3, model: "haiku" },
        pro: { maxProjects: 10, maxGenerations: 50, model: "sonnet" },
        business: { maxProjects: Infinity, maxGenerations: Infinity, model: "sonnet" },
    }
    return limits[this.subscription.tier] || limits.free
}

module.exports = mongoose.model("User", userSchema)
