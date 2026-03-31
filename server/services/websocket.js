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
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Room registration: a CLI client only listens for updates for its specific project
    socket.on("join-project", (projectId) => {
      socket.join(projectId);
      socket.projectId = projectId; // Store for later use
      console.log(`[WebSocket] Client ${socket.id} joined project room: ${projectId}`);
    });

    // CLI clients register their userId so the server can auto-switch rooms
    socket.on("cli-register-user", (userId) => {
      socket.userId = userId;
      socket.isCli = true;
      console.log(`[WebSocket] CLI client ${socket.id} registered for user: ${userId}`);
    });

    // Handle tunnel URL broadcasting back to the frontend
    socket.on("cli-tunnel-ready", ({ url }) => {
      const pId = socket.projectId;
      if (!pId) return;
      console.log(`[WebSocket] Tunneled project ${pId} available at: ${url}`);
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
        
        const fixInstruction = await classifyError(error, project.files);
        if (!fixInstruction) return;

        const fixedFile = await fixFile(fixInstruction.fileToFix, fixInstruction.instruction, project.files);
        
        project.files.set(fixedFile.path, fixedFile.content);
        await project.save();

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
  if (typeof content !== 'string') {
    console.log(`[WebSocket] Skipping non-string broadcast for key: ${path}`);
    return;
  }
  io.to(projectId).emit("file-update", { path, content });
  console.log(`[WebSocket] Broadcasted change: ${path} to project: ${projectId}`);
}

/**
 * Auto-switch all CLI clients for a given user to a new project room.
 * Called when a new generation starts — ensures the CLI receives updates.
 */
function notifyCliRoomSwitch(userId, newProjectId) {
  if (!io) return;
  const sockets = io.sockets.sockets;
  for (const [, socket] of sockets) {
    if (socket.isCli && socket.userId === userId && socket.projectId !== newProjectId) {
      const oldRoom = socket.projectId;
      if (oldRoom) socket.leave(oldRoom);
      socket.join(newProjectId);
      socket.projectId = newProjectId;
      socket.emit("room-switch", { oldProjectId: oldRoom, newProjectId });
      console.log(`[WebSocket] Auto-switched CLI ${socket.id} from ${oldRoom} → ${newProjectId}`);
    }
  }
}

module.exports = { initWebSocket, broadcastFileUpdate, notifyCliRoomSwitch };
