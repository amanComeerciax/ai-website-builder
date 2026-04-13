const mongoose = require("mongoose");

const workspaceMemberSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    email: {
      type: String,
      default: ''
    },
    name: {
      type: String,
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'editor', 'viewer'],
      default: 'editor'
    },
    status: {
      type: String,
      enum: ['active', 'blocked'],
      default: 'active'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Compound index: one membership per user per workspace
workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("WorkspaceMember", workspaceMemberSchema);
