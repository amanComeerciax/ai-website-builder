const mongoose = require("mongoose");

const generationLogSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
      index: true
    },
    action: {
      type: String,
      enum: ['thinking', 'reading', 'installing', 'editing', 'creating'],
      required: true
    },
    target: {
      type: String
    },
    detail: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }
);

module.exports = mongoose.model("GenerationLog", generationLogSchema);
