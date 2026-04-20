const mongoose = require("mongoose");

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      default: 'General purpose website'
    },
    slug: {
      type: String,
      unique: true,
      sparse: true
    },
    // Multiple categories this template belongs to (e.g. ['saas', 'landing', 'coffee-shop'])
    categories: {
      type: [String],
      default: []
    },
    // User-facing fancy theme name (e.g. "Aurora", "Velocity")
    themeName: {
      type: String,
      default: ''
    },
    // User-facing short tagline (e.g. "Sleek & minimal")
    themeTagline: {
      type: String,
      default: ''
    },
    // Comma-separated keywords for AI matching
    keywords: {
      type: String,
      default: ''
    },
    // Full HTML content of the template
    htmlContent: {
      type: String,
      required: true
    },
    // Size in bytes (for quick reference)
    sizeBytes: {
      type: Number,
      default: 0
    },

    // ── Visibility Controls ──

    // Whether the template is soft-deleted / active at all
    isActive: {
      type: Boolean,
      default: true
    },
    // Controls Browse Templates gallery (admin curates — default false, admin must toggle on)
    isVisible: {
      type: Boolean,
      default: false
    },
    // Controls the Theme Picker during new project creation (available immediately after upload)
    isVisibleInThemes: {
      type: Boolean,
      default: true
    },

    // ── Community Submission ──

    // 'admin' = uploaded by admin | 'community' = submitted by a user
    source: {
      type: String,
      enum: ['admin', 'community'],
      default: 'admin'
    },
    // The user who submitted this template (for community templates)
    submittedBy: {
      clerkId: { type: String, default: null },
      name:    { type: String, default: null },
      email:   { type: String, default: null },
    },
    // Admin approval state for community submissions
    approvalStatus: {
      type: String,
      enum: ['approved', 'pending', 'rejected'],
      default: 'approved'   // admin uploads auto-approved; community = 'pending'
    },
  },
  { timestamps: true }
);

// Indexes for fast lookups
templateSchema.index({ isActive: 1, isVisible: 1 });
templateSchema.index({ isActive: 1, isVisibleInThemes: 1 });
templateSchema.index({ approvalStatus: 1, source: 1 });

module.exports = mongoose.model("Template", templateSchema);
