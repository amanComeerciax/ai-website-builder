const axios = require('axios');
const chalk = require('chalk');
const ora = require('ora');
const { io } = require('socket.io-client');
const { syncFiles, updateSingleFile } = require('../utils/fileSync');
const { runLocalEnvironment } = require('../utils/runner');

async function pullProject(projectId, envUrl) {
  const spinner = ora(`Authenticating and establishing secure tunnel to project: ${projectId}`).start();

  try {
    // 1. Fetch initial state
    const response = await axios.get(`${envUrl}/api/projects/${projectId}/files`, {
      headers: { 'x-cli-token': 'stackforge-dev-cli' }
    });

    const fileMap = response.data.files;
    const userId = response.data.userId || null;
    
    spinner.succeed(`Secure handshake complete.`);
    console.log(chalk.gray(`\n⬇️  Synchronizing ${Object.keys(fileMap).length} files to disk...\n`));

    // 2. Write to disk
    syncFiles(fileMap, process.cwd());

    // 3. Connect to WebSocket for live updates
    console.log(chalk.gray(`📡 Booting live-sync WebSocket daemon on ${envUrl}`));
    
    const socket = io(envUrl);
    
    socket.on('connect', () => {
      // Authenticate to room
      socket.emit('join-project', projectId);
      
      // Register user ID so server can auto-switch us to new projects
      if (userId) {
        socket.emit('cli-register-user', userId);
        console.log(chalk.gray(`   Registered as user: ${userId}`));
      }
      
      console.log(chalk.bold.green(`\n🔌 WebSocket Tunnel Activated! HMR is enabled.\n`));
      console.log(chalk.gray(`   Watching project: ${projectId}`));
    });

    // Handle auto-room-switch when user starts a new generation in the browser
    socket.on('room-switch', ({ oldProjectId, newProjectId }) => {
      console.log(chalk.cyan(`\n🔄 Auto-switched to new project: ${newProjectId}`));
      console.log(chalk.gray(`   (Previous: ${oldProjectId})`));
      
      // Fetch and sync the new project's files
      axios.get(`${envUrl}/api/projects/${newProjectId}/files`, {
        headers: { 'x-cli-token': 'stackforge-dev-cli' }
      }).then(res => {
        if (res.data.files) {
          console.log(chalk.gray(`⬇️  Syncing ${Object.keys(res.data.files).length} files from new project...\n`));
          syncFiles(res.data.files, process.cwd());
        }
      }).catch(err => {
        console.log(chalk.yellow(`   Could not fetch new project files: ${err.message}`));
      });
    });

    // Listeners from AI worker updates
    socket.on('file-update', ({ path, content }) => {
      console.log(chalk.yellow(`\n[AI Sync] Incoming change for ${path}...`));
      updateSingleFile(path, content, process.cwd());
      // Next.js will automatically detect this and hot-reload.
    });

    socket.on('disconnect', () => {
      console.log(chalk.red(`[Network] WebSocket connection lost.`));
    });

    // 4. Start the environment (npm run dev)
    runLocalEnvironment(process.cwd(), socket);

  } catch (err) {
    spinner.fail(`Failed to sync project.`);
    if (err.response) {
      console.log(chalk.red(`Server Error: ${err.response.data.error || err.response.statusText}`));
    } else {
      console.log(chalk.red(err.message));
    }
    process.exit(1);
  }
}

module.exports = { pullProject };
