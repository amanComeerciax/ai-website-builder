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
      type: mongoose.Schema.Types.Mixed, // Map of path to R2Key string
      default: {}
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
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Folder',
      default: null
    },
    starred: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);