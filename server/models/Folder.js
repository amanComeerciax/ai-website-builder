const mongoose = require("mongoose");

const folderSchema = new mongoose.Schema(
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
    visibility: {
      type: String,
      enum: ['personal', 'workspace'],
      default: 'personal'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Folder", folderSchema);
