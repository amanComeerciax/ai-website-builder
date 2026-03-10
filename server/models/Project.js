const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true
    },
    businessName: {
      type: String,
      required: true
    },
    businessType: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    services: {
      type: [String],
      default: []
    },
    themeColor: {
      type: String,
      default: "blue"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);