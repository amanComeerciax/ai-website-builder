const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

function syncFiles(fileMap, baseDir = process.cwd()) {
  let count = 0;
  for (const [filePath, content] of Object.entries(fileMap)) {
    // Guard: only write valid string content
    if (content === null || content === undefined) continue;
    
    let safeContent = content;
    if (typeof content !== 'string') {
      safeContent = JSON.stringify(content, null, 2);
    }

    // Determine absolute path
    const absolutePath = path.join(baseDir, filePath);
    
    // Ensure parent directories exist
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write file
    fs.writeFileSync(absolutePath, safeContent, 'utf8');
    count++;
  }
  return count;
}

function updateSingleFile(filePath, content, baseDir = process.cwd()) {
  // Guard: only write valid string content
  let safeContent = content;
  if (content === null || content === undefined) {
    console.log(chalk.gray(`[Skip] ${filePath} — empty content`));
    return;
  }
  if (typeof content !== 'string') {
    // AI sometimes returns objects/arrays for file trees — stringify them
    safeContent = JSON.stringify(content, null, 2);
  }

  const absolutePath = path.join(baseDir, filePath);
  const dir = path.dirname(absolutePath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(absolutePath, safeContent, 'utf8');
  console.log(chalk.green(`[Synced] ${filePath}`));
}

module.exports = { syncFiles, updateSingleFile };
