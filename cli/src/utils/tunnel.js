const localtunnel = require('localtunnel');
const chalk = require('chalk');

/**
 * Boot a secure localtunnel to expose the Next.js dev server.
 * 
 * @param {number} port - Local port to expose
 * @param {object} socket - Socket.io client to send the URL back to backend
 * @returns {Promise<Function>} A cleanup function to close the tunnel
 */
async function createSecureTunnel(port = 3000, socket = null) {
  try {
    const tunnel = await localtunnel({ port });

    console.log(chalk.cyan(`\n🌐 External Tunnel Active: ${chalk.underline.bold(tunnel.url)}`));
    console.log(chalk.gray(`   (Your local preview is now accessible from the web)`));

    if (socket) {
      // Broadcast the tunnel URL back to the AI backend so the web UI iframe can load it
      socket.emit('cli-tunnel-ready', { url: tunnel.url });
    }

    tunnel.on('close', () => {
      console.log(chalk.red('\nTunnel closed.'));
    });

    return () => tunnel.close();
  } catch (err) {
    console.error(chalk.red(`Failed to start localtunnel: ${err.message}`));
    return null;
  }
}

module.exports = { createSecureTunnel };
