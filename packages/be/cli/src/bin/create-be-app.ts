#!/usr/bin/env node

import { program } from 'commander';
import { createApp } from '../commands/create-app.js';

const packageJson = require('../../package.json');

program
  .name('create-be-app')
  .description('Create a new Thrilled backend application')
  .version(packageJson.version)
  .argument('[name]', 'Application name')
  .option('-t, --template <template>', 'Template to use', 'express')
  .option('-d, --directory <directory>', 'Directory to create the app in')
  .option('--skip-install', 'Skip npm install')
  .option('--skip-git', 'Skip git initialization')
  .option('--typescript', 'Use TypeScript', true)
  .option('--javascript', 'Use JavaScript')
  .action(createApp);

program.parse();
