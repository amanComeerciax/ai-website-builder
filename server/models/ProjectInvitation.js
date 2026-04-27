const mongoose = require("mongoose");
const crypto = require("crypto");

const projectInvitationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null
    },
    invitedByUserId: {
      type: String,
      required: true
    },
    invitedByName: {
      type: String,
      default: ''
    },
    projectName: {
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
      enum: ['editor', 'viewer'],
      default: 'editor'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending'
    },
    // Track who accepted (for link-based invites)
    acceptedByUserId: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Auto-generate token for invite links
projectInvitationSchema.methods.generateToken = function() {
  this.token = crypto.randomBytes(24).toString('hex');
  return this.token;
};

// Check if invitation is expired
projectInvitationSchema.methods.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// TTL index — MongoDB auto-deletes docs when expiresAt passes
projectInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("ProjectInvitation", projectInvitationSchema);
