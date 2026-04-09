const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      unique: true,
      index: true
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'business'],
      default: 'free'
    }
  },
  { timestamps: true }
);

workspaceSchema.pre("save", function() {
  if (!this.slug && this.name) {
    const baseSlug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    this.slug = `${baseSlug}-${randomSuffix}`;
  }
});

module.exports = mongoose.model("Workspace", workspaceSchema);
