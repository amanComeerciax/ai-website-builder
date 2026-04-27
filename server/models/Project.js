const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null,
      index: true
    },
    name: {
      type: String,
      default: 'Untitled Project'
    },
    status: {
      type: String,
      enum: ['idle', 'generating', 'done', 'failed'],
      default: 'idle'
    },
    activeVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Version',
      default: null
    },
    currentFileTree: {
      type: mongoose.Schema.Types.Mixed, // Map of path to file content
      default: {}
    },
    outputTrack: {
      type: String,
      enum: ['html', 'nextjs', 'component-kit'],
      default: 'html'
    },
    previewUrl: {
      type: String,
      default: null
    },
    publishedUrl: {
      type: String,
      default: null
    },
    netlifySiteId: {
      type: String,
      default: null
    },
    techStack: {
      type: String,
      default: 'react'
    },
    isStarred: {
      type: Boolean,
      default: false
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null
    },
    // 5-STEP PIPELINE CONFIG
    isConfigured: {
      type: Boolean,
      default: false
    },
    theme: { type: String, default: null },
    websiteName: { type: String, default: null },
    description: { type: String, default: null },
    logoUrl: { type: String, default: null },
    brandColors: { type: [String], default: [] },
    visibility: {
      type: String,
      enum: ['workspace', 'private', 'public'],
      default: 'workspace'
    },
    // Project-level collaborators (separate from workspace members)
    collaborators: [{
      userId: { type: String, required: true },
      email: { type: String, default: '' },
      name: { type: String, default: '' },
      avatar: { type: String, default: '' },
      role: { type: String, enum: ['editor', 'viewer'], default: 'editor' },
      joinedAt: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);