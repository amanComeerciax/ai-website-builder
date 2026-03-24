const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    content: { type: String, default: "" },
    isFolder: { type: Boolean, default: false }
  },
  { _id: false }
);

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    description: {
      type: String,
      required: true
    },
    coverImage: {
      type: String,
      default: "https://placehold.co/600x400/2899d2/white?text=Template"
    },
    track: {
      type: String,
      enum: ['html', 'nextjs'],
      required: true
    },
    features: {
      type: [String],
      default: []
    },
    files: [fileSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Template", templateSchema);
