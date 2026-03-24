const mongoose = require("mongoose");

const versionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },
    name: {
      type: String,
      default: 'Version 1'
    },
    trigger: {
      type: String,
      enum: ['generation', 'manual', 'restore'],
      default: 'generation'
    },
    fileTree: {
      type: mongoose.Schema.Types.Mixed, // Map of path to content
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Version", versionSchema);
