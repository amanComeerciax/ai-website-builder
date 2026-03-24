const { spawn } = require('child_process');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { createSecureTunnel } = require('./tunnel');

function runLocalEnvironment(baseDir = process.cwd(), socket = null) {
  const packageJsonPath = path.join(baseDir, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    console.log(chalk.yellow(`\n[Info] No package.json found. Assumed HTML/JS static environment.`));
    console.log(chalk.green(`\n✅ Ready! Open index.html in your browser to view your project.`));
    return;
  }

  console.log(chalk.cyan(`\n📦 Installing NPM dependencies (this might take a moment)...\n`));

  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  
  // Install stays inherited so the user sees progress
  const installProc = spawn(npmCmd, ['install'], { cwd: baseDir, stdio: 'inherit' });

  installProc.on('close', (code) => {
    if (code !== 0) {
      console.log(chalk.red(`\n❌ npm install failed with code ${code}`));
      return;
    }

    console.log(chalk.green(`\n✅ Install complete! Firing up Next.js DEV Server...\n`));

    // Dev server uses pipes to capture output for error reporting
    const devProc = spawn(npmCmd, ['run', 'dev'], { cwd: baseDir, stdio: ['ignore', 'pipe', 'pipe'] });
    let errorBuffer = '';
    let debounceTimer = null;

    // Helper: Flush error buffer to socket
    const flushError = () => {
      if (errorBuffer.trim() && socket) {
        console.log(chalk.red(`\n[Auto-Fix] Captured build error. Sending to StackForge AI...`));
        socket.emit('cli-error-report', { error: errorBuffer.trim() });
      }
      errorBuffer = '';
    };

    devProc.stdout.on('data', (data) => {
      const out = data.toString();
      process.stdout.write(out);

      // Detect Next.js errors
      if (out.includes('Error:') || out.includes('Failed to compile') || out.includes('Syntax error')) {
        errorBuffer += out;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(flushError, 2000); // 2s debounce to capture full stack trace
      }
    });

    devProc.stderr.on('data', (data) => {
      const errOut = data.toString();
      process.stderr.write(chalk.red(errOut));
      
      // Accumulate stderr
      errorBuffer += errOut;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(flushError, 2000);
    });

    devProc.on('close', (devCode) => {
      console.log(chalk.gray(`\nDev server stopped. (${devCode})\n`));
    });

    // Boot the secure tunnel! Wait 3s to ensure Next.js has grabbed port 3000
    setTimeout(() => {
      createSecureTunnel(3000, socket);
    }, 3000);
  });
}

module.exports = { runLocalEnvironment };
