const { Server } = require("socket.io");
const { classifyError } = require("../utils/errorClassifier.js");
const { fixFile } = require("../utils/autoFixer.js");
const Project = require("../models/Project.js");

let io = null;

function initWebSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // CLI can connect from anywhere
    }
  });

  io.on("connection", (socket) => {
    console.log(`[WebSocket] CLI Client connected: ${socket.id}`);

    // Room registration: a CLI client only listens for updates for its specific project
    socket.on("join-project", (projectId) => {
      socket.join(projectId);
      socket.projectId = projectId; // Store for later use
      console.log(`[WebSocket] Client ${socket.id} joined project room: ${projectId}`);
    });

    // Handle tunnel URL broadcasting back to the frontend
    socket.on("cli-tunnel-ready", ({ url }) => {
      const pId = socket.projectId;
      if (!pId) return;
      console.log(`[WebSocket] Tunneled project ${pId} available at: ${url}`);
      // Broadcast this URL to everyone in the room (specifically the web UI)
      io.to(pId).emit("tunnel-active", { url });
    });

    // Handle CLI build/runtime error reports
    socket.on("cli-error-report", async ({ error }) => {
      const pId = socket.projectId;
      if (!pId) return;
      console.log(`[WebSocket] 🚨 Received CLI error for project ${pId}:`, error.substring(0, 50) + '...');
      
      try {
        const project = await Project.findById(pId);
        if (!project) return;
        
        // 1. Classify the error using Groq
        const fixInstruction = await classifyError(error, project.files);
        if (!fixInstruction) return; // Not auto-fixable

        // 2. Perform the targeted fix using Mistral
        const fixedFile = await fixFile(fixInstruction.fileToFix, fixInstruction.instruction, project.files);
        
        // 3. Save the fix to the database
        project.files.set(fixedFile.path, fixedFile.content);
        await project.save();

        // 4. Push the fix back down the WebSocket tunnel to the CLI so it triggers HMR!
        broadcastFileUpdate(pId, fixedFile.path, fixedFile.content);
        console.log(`[WebSocket] ✅ Auto-fix complete! Deployed ${fixedFile.path} to CLI via tunnel.`);
      } catch (err) {
        console.error(`[WebSocket] Auto-fix pipeline failed: ${err.message}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Global broadcast function exposed to aiWorker/projectStore equivalents
function broadcastFileUpdate(projectId, path, content) {
  if (!io) return;
  // Only broadcast actual file content (strings), skip metadata objects
  if (typeof content !== 'string') {
    console.log(`[WebSocket] Skipping non-string broadcast for key: ${path}`);
    return;
  }
  io.to(projectId).emit("file-update", { path, content });
  console.log(`[WebSocket] Broadcasted change: ${path} to project: ${projectId}`);
}

module.exports = { initWebSocket, broadcastFileUpdate };
