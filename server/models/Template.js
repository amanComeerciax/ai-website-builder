const mongoose = require("mongoose");

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    // Auto-generated description of what this template is good for
    description: {
      type: String,
      default: 'General purpose website'
    },
    // Slug to satisfy pre-existing DB index
    slug: {
      type: String,
      unique: true,
      sparse: true
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
    // Whether the template is active/available for selection
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Index for fast lookups
templateSchema.index({ isActive: 1, name: 1 });

module.exports = mongoose.model("Template", templateSchema);
