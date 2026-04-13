const mongoose = require("mongoose");
const crypto = require("crypto");

const workspaceInvitationSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    invitedByUserId: {
      type: String,
      required: true
    },
    invitedByName: {
      type: String,
      default: ''
    },
    // For email-based invitations
    invitedEmail: {
      type: String,
      default: '',
      index: true
    },
    // For invite links (token-based)
    token: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    role: {
      type: String,
      enum: ['admin', 'editor', 'viewer'],
      default: 'editor'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending'
    },
    workspaceName: {
      type: String,
      default: ''
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Auto-generate token for invite links
workspaceInvitationSchema.methods.generateToken = function() {
  this.token = crypto.randomBytes(24).toString('hex');
  return this.token;
};

// Check if invitation is expired
workspaceInvitationSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

module.exports = mongoose.model("WorkspaceInvitation", workspaceInvitationSchema);
