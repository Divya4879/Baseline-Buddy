import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { CompatibilityChecker } from '@baseline-buddy/shared';

interface DeployOptions {
  platform: 'netlify' | 'vercel' | 'github-pages';
  skipCheck: boolean;
  buildCommand?: string;
  outputDir?: string;
}

export async function deployCommand(projectPath: string, options: DeployOptions) {
  const spinner = ora();
  
  try {
    const absolutePath = path.resolve(projectPath);
    
    if (!fs.existsSync(absolutePath)) {
      console.error(chalk.red(`❌ Path does not exist: ${absolutePath}`));
      process.exit(1);
    }
    
    console.log(chalk.blue(`🚀 Preparing to deploy to ${options.platform}...`));
    
    // Pre-deployment compatibility check
    if (!options.skipCheck) {
      await runPreDeploymentCheck(absolutePath, spinner);
    }
    
    // Platform-specific deployment
    switch (options.platform) {
      case 'netlify':
        await deployToNetlify(absolutePath, options, spinner);
        break;
      case 'vercel':
        await deployToVercel(absolutePath, options, spinner);
        break;
      case 'github-pages':
        await deployToGitHubPages(absolutePath, options, spinner);
        break;
      default:
        throw new Error(`Unsupported platform: ${options.platform}`);
    }
    
  } catch (error: any) {
    spinner.fail(`❌ Deployment failed: ${error.message}`);
    
    if (process.env.BASELINE_BUDDY_VERBOSE) {
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

async function runPreDeploymentCheck(projectPath: string, spinner: ora.Ora) {
  spinner.start('🔍 Running pre-deployment compatibility check...');
  
  const checker = new CompatibilityChecker();
  const analysis = await checker.checkProject(projectPath);
  
  const { summary, baselineScore } = analysis;
  
  if (baselineScore >= 80) {
    spinner.succeed(`✅ Compatibility check passed! Score: ${baselineScore}%`);
  } else if (baselineScore >= 60) {
    spinner.warn(`⚠️  Compatibility check: ${baselineScore}% (some features may need polyfills)`);
    
    const { proceed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'proceed',
      message: 'Continue with deployment?',
      default: true
    }]);
    
    if (!proceed) {
      console.log(chalk.yellow('Deployment cancelled. Run `baseline-buddy check` for details.'));
      process.exit(0);
    }
  } else {
    spinner.fail(`❌ Compatibility check failed: ${baselineScore}%`);
    
    console.log(chalk.red('\nIssues found:'));
    console.log(`• ${summary.avoid} features to avoid`);
    console.log(`• ${summary.caution} features needing attention`);
    
    const { forceDeployment } = await inquirer.prompt([{
      type: 'confirm',
      name: 'forceDeployment',
      message: 'Force deployment anyway? (not recommended)',
      default: false
    }]);
    
    if (!forceDeployment) {
      console.log(chalk.yellow('Deployment cancelled. Fix compatibility issues first.'));
      console.log(chalk.gray('Run `baseline-buddy check --output=html` for detailed report.'));
      process.exit(0);
    }
  }
}

async function deployToNetlify(projectPath: string, options: DeployOptions, spinner: ora.Ora) {
  spinner.start('🌐 Deploying to Netlify...');
  
  try {
    // Check if Netlify CLI is installed
    execSync('netlify --version', { stdio: 'ignore' });
  } catch {
    spinner.fail('❌ Netlify CLI not found. Install with: npm install -g netlify-cli');
    process.exit(1);
  }
  
  // Build if needed
  if (options.buildCommand) {
    spinner.text = '🔨 Building project...';
    execSync(options.buildCommand, { cwd: projectPath, stdio: 'inherit' });
  }
  
  // Deploy
  spinner.text = '🚀 Deploying to Netlify...';
  
  const deployCmd = options.outputDir 
    ? `netlify deploy --prod --dir=${options.outputDir}`
    : 'netlify deploy --prod';
    
  execSync(deployCmd, { cwd: projectPath, stdio: 'inherit' });
  
  spinner.succeed('✅ Successfully deployed to Netlify!');
  
  // Show post-deployment info
  console.log(chalk.green('\n🎉 Deployment Complete!'));
  console.log(chalk.gray('Your Baseline-validated site is now live.'));
  console.log(chalk.blue('💡 Tip: Set up continuous deployment for automatic updates.'));
}

async function deployToVercel(projectPath: string, options: DeployOptions, spinner: ora.Ora) {
  spinner.start('▲ Deploying to Vercel...');
  
  try {
    execSync('vercel --version', { stdio: 'ignore' });
  } catch {
    spinner.fail('❌ Vercel CLI not found. Install with: npm install -g vercel');
    process.exit(1);
  }
  
  // Deploy
  const deployCmd = 'vercel --prod';
  execSync(deployCmd, { cwd: projectPath, stdio: 'inherit' });
  
  spinner.succeed('✅ Successfully deployed to Vercel!');
  
  console.log(chalk.green('\n🎉 Deployment Complete!'));
  console.log(chalk.gray('Your Baseline-validated site is now live on Vercel.'));
}

async function deployToGitHubPages(projectPath: string, options: DeployOptions, spinner: ora.Ora) {
  spinner.start('📚 Deploying to GitHub Pages...');
  
  // Check if we're in a git repository
  try {
    execSync('git status', { cwd: projectPath, stdio: 'ignore' });
  } catch {
    spinner.fail('❌ Not a git repository. Initialize git first: git init');
    process.exit(1);
  }
  
  // Check if gh-pages package is available
  let useGhPages = false;
  try {
    require.resolve('gh-pages');
    useGhPages = true;
  } catch {
    // Try to install gh-pages
    spinner.text = '📦 Installing gh-pages...';
    try {
      execSync('npm install --save-dev gh-pages', { cwd: projectPath, stdio: 'ignore' });
      useGhPages = true;
    } catch {
      spinner.warn('⚠️  Could not install gh-pages. Using manual deployment.');
    }
  }
  
  if (useGhPages) {
    // Build if needed
    if (options.buildCommand) {
      spinner.text = '🔨 Building project...';
      execSync(options.buildCommand, { cwd: projectPath, stdio: 'inherit' });
    }
    
    // Deploy using gh-pages
    const deployDir = options.outputDir || 'dist';
    const deployCmd = `npx gh-pages -d ${deployDir}`;
    
    spinner.text = '🚀 Publishing to GitHub Pages...';
    execSync(deployCmd, { cwd: projectPath, stdio: 'inherit' });
    
    spinner.succeed('✅ Successfully deployed to GitHub Pages!');
  } else {
    // Manual deployment instructions
    spinner.info('📋 Manual GitHub Pages deployment:');
    console.log(chalk.yellow('\nManual deployment steps:'));
    console.log('1. Build your project (if needed)');
    console.log('2. Push your code to GitHub');
    console.log('3. Go to repository Settings > Pages');
    console.log('4. Select source branch and folder');
    console.log('5. Your site will be available at: https://username.github.io/repository');
  }
  
  console.log(chalk.green('\n🎉 GitHub Pages deployment initiated!'));
  console.log(chalk.gray('Your Baseline-validated site will be live shortly.'));
}

// Helper function to detect project type and suggest build commands
function detectBuildCommand(projectPath: string): string | undefined {
  const packageJsonPath = path.join(projectPath, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return undefined;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const scripts = packageJson.scripts || {};
    
    // Common build script names
    if (scripts.build) return 'npm run build';
    if (scripts['build:prod']) return 'npm run build:prod';
    if (scripts.dist) return 'npm run dist';
    
    return undefined;
  } catch {
    return undefined;
  }
}
