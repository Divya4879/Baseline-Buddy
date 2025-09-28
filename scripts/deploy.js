#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const DEPLOY_TARGETS = {
  'vercel': (dir) => {
    try {
      execSync('vercel whoami', { stdio: 'pipe' });
    } catch {
      console.log('Please login first: vercel login');
      process.exit(1);
    }
    execSync(`vercel --prod --cwd ${dir}`, { stdio: 'inherit' });
  },
  'netlify': (dir) => {
    try {
      execSync('netlify status', { stdio: 'pipe' });
    } catch {
      console.log('Please login first: netlify login');
      process.exit(1);
    }
    execSync(`netlify deploy --prod --dir ${dir}`, { stdio: 'inherit' });
  },
  'surge': (dir) => execSync(`surge ${dir}`, { stdio: 'inherit' })
};

export function deploy(target = 'vercel', projectDir = '.') {
  console.log(`Deploying to ${target}...`);
  
  // Build if needed
  const packagePath = path.join(projectDir, 'package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath));
    if (pkg.scripts && pkg.scripts.build) {
      console.log('Building project...');
      execSync('npm run build', { cwd: projectDir, stdio: 'inherit' });
    }
  }
  
  // Deploy
  if (DEPLOY_TARGETS[target]) {
    DEPLOY_TARGETS[target](projectDir);
    console.log(`✅ Deployed to ${target}`);
  } else {
    console.error(`❌ Unknown target: ${target}`);
    process.exit(1);
  }
}
