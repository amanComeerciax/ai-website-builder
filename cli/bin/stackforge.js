#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const { pullProject } = require('../src/commands/pull');

program
  .version('1.0.0')
  .description('StackForge AI Local Sync CLI');

program
  .command('pull <projectId>')
  .description('Sync a StackForge project direct to your local machine')
  .option('-e, --env <url>', 'Override backend URL (for dev)', 'http://localhost:5000')
  .action((projectId, options) => {
    console.log(chalk.blue(`\n🚀 StackForge CLI: Initiating secure tunnel to project ${projectId}...\n`));
    pullProject(projectId, options.env);
  });

program.parse(process.argv);
