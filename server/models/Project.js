const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
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
      type: Map,
      of: String, // Map of path to R2Key string
      default: new Map()
    },
    previewUrl: {
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
    // 5-STEP PIPELINE CONFIG
    isConfigured: {
      type: Boolean,
      default: false
    },
    theme: { type: String, default: null },
    websiteName: { type: String, default: null },
    description: { type: String, default: null },
    logoUrl: { type: String, default: null },
    brandColors: { type: [String], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);