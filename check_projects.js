require("dotenv").config({ path: "client/.env" });
const mongoose = require("mongoose");
const Project = require("./server/models/Project");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/ai-website-builder");
  const projects = await Project.find().sort({ createdAt: -1 }).limit(10);
  console.log(projects.map(p => ({
    id: p._id,
    name: p.name,
    userId: p.userId,
    workspaceId: p.workspaceId,
    createdAt: p.createdAt
  })));
  process.exit();
}
run();
