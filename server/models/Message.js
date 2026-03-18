const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    reasoning: {
      type: String,
      default: ''
    },
    versionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Version',
      default: null
    },
    filesChanged: [{
      path: String,
      action: { type: String, enum: ['create', 'edit', 'delete'] }
    }],
    suggestedActions: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['pending', 'done', 'failed'],
      default: 'done'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
