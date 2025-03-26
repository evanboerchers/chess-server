#!/usr/bin/env zx

import 'dotenv/config'
import * as path from 'path'

// Explicitly load .env from the deployment directory
const envPath = path.resolve(__dirname, '.env');
require('dotenv').config({ path: envPath });

// Load environment variables
const {
  DEPLOY_HOST: host,
  DEPLOY_USER: username,
  DEPLOY_REMOTE_PATH: remotePath,
  DEPLOY_LOCAL_DEPLOYMENT_DIR: localDeploymentDir,
  DEPLOY_LOCAL_DIST_DIR: localDistDir
} = process.env;

// Validate required environment variables
const requiredVars = [
  'DEPLOY_HOST', 
  'DEPLOY_USER', 
  'DEPLOY_REMOTE_PATH', 
  'DEPLOY_LOCAL_DEPLOYMENT_DIR', 
  'DEPLOY_LOCAL_DIST_DIR'
];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(chalk.red(`Missing required environment variable: ${varName}`));
    process.exit(1);
  }
});

async function deployProject() {
  try {
    console.log(chalk.blue('Creating remote project directory...'));
    await $`ssh ${username}@${host} "mkdir -p ${remotePath}/dist/"`;

    console.log(chalk.blue('Syncing deployment files...'));
    await $`rsync -avz \
      ${localDeploymentDir}/Dockerfile \
      ${localDeploymentDir}/docker-compose.yml \
      ${username}@${host}:${remotePath}/`;

    console.log(chalk.green('Deployment files copied successfully.'));
    
    console.log(chalk.blue('Syncing dist files...'));
    await $`rsync -avz --delete \
      ${localDistDir}/ \
      ${username}@${host}:${remotePath}/dist/`;
    
    console.log(chalk.green('Dist files copied successfully.'));

    console.log(chalk.green('Syncing pakage.json'));

    await $`rsync -avz package.json ${username}@${host}:${remotePath}/`

    console.log(chalk.blue('Running deployment commands on remote server...'));
    await $`ssh ${username}@${host} << 'ENDSSH'
      cd ${remotePath}
      docker compose down
      docker compose up -d --build
      docker image prune -f
ENDSSH`;

    console.log(chalk.green('Deployment successful!'));
  } catch (error) {
    console.error(chalk.red('Deployment failed:'), error);
    process.exit(1);
  }
}

deployProject();
