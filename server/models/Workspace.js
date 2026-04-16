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
    },
    avatar: {
      type: String,
      default: ''
    },
    handle: {
      type: String,
      default: '',
      unique: true,
      sparse: true
    },
    // ── Per-workspace privacy & security settings ──
    privacySettings: {
      defaultProjectVisibility: {
        type: String,
        enum: ['workspace', 'private', 'public'],
        default: 'workspace'
      },
      defaultWebsiteAccess: {
        type: String,
        enum: ['anyone', 'workspace'],
        default: 'anyone'
      },
      restrictInvitations: {
        type: Boolean,
        default: false
      },
      allowEditorsTransfer: {
        type: Boolean,
        default: false
      },
      inviteLinksEnabled: {
        type: Boolean,
        default: true
      },
      whoCanPublish: {
        type: String,
        enum: ['editors', 'owners'],
        default: 'editors'
      },
      allowPreviewSharing: {
        type: Boolean,
        default: true
      },
      crossProjectSharing: {
        type: Boolean,
        default: true
      }
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
