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
    // We append ?cli=true to bypass standard auth for dev (or use a real token in production)
    // Actually, let's bypass mockUser by sending a dummy CLI header
    const response = await axios.get(`${envUrl}/api/projects/${projectId}/files`, {
      headers: { 'x-cli-token': 'stackforge-dev-cli' }
    });

    const fileMap = response.data.files;
    
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
      console.log(chalk.bold.green(`\n🔌 WebSocket Tunnel Activated! HMR is enabled.\n`));
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
