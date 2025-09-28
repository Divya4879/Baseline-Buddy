#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { checkCommand } from './commands/check';
import { deployCommand } from './commands/deploy';
import { searchCommand } from './commands/search';

const program = new Command();

program
  .name('baseline-buddy')
  .description('🚀 AI-powered developer companion for modern web features')
  .version('1.0.0');

// ASCII Art Banner
const banner = `
${chalk.cyan('╔══════════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold.yellow('🚀 BASELINE BUDDY')}                                        ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.gray('Your AI companion for modern web development')}              ${chalk.cyan('║')}
${chalk.cyan('╚══════════════════════════════════════════════════════════════╝')}
`;

program.addHelpText('beforeAll', banner);

// Initialize project command
program
  .command('init')
  .description('🏗️  Initialize a new project with Baseline-optimized templates')
  .argument('<project-name>', 'Name of the project to create')
  .option('-t, --template <type>', 'Template type (html, react, vue, next)', 'html')
  .option('-b, --baseline-level <level>', 'Baseline compatibility level (2023, 2024, latest)', '2024')
  .option('-d, --directory <path>', 'Target directory', '.')
  .option('--no-install', 'Skip npm install')
  .option('--git', 'Initialize git repository')
  .action(initCommand);

// Check compatibility command  
program
  .command('check')
  .description('🔍 Analyze project for Baseline compatibility')
  .argument('[path]', 'Project path to analyze', '.')
  .option('-o, --output <format>', 'Output format (json, html, markdown)', 'json')
  .option('-f, --file <path>', 'Save report to file')
  .option('-b, --baseline-level <level>', 'Target Baseline level (2023, 2024, latest)', '2024')
  .option('--exclude <features>', 'Comma-separated list of features to exclude')
  .option('--watch', 'Watch for file changes and re-analyze')
  .action(checkCommand);

// Deploy command
program
  .command('deploy')
  .description('🚀 Deploy project with compatibility validation')
  .argument('[path]', 'Project path to deploy', '.')
  .option('-p, --platform <platform>', 'Deployment platform (netlify, vercel, github-pages)', 'netlify')
  .option('--skip-check', 'Skip compatibility check before deployment')
  .option('--build-command <cmd>', 'Custom build command')
  .option('--output-dir <dir>', 'Build output directory')
  .action(deployCommand);

// Search features command
program
  .command('search')
  .description('🔎 Search Baseline features and compatibility info')
  .argument('<query>', 'Search query for features')
  .option('-s, --status <status>', 'Filter by status (high, low, false)')
  .option('-l, --limit <number>', 'Limit number of results', '10')
  .option('--detailed', 'Show detailed information')
  .action(searchCommand);

// Global options
program
  .option('--verbose', 'Enable verbose logging')
  .option('--config <path>', 'Path to configuration file')
  .option('--no-color', 'Disable colored output');

// Handle global options
program.hook('preAction', (thisCommand) => {
  const opts = thisCommand.opts();
  
  if (opts.noColor) {
    chalk.level = 0;
  }
  
  if (opts.verbose) {
    process.env.BASELINE_BUDDY_VERBOSE = 'true';
  }
});

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (err: any) {
  if (err.code === 'commander.help') {
    process.exit(0);
  }
  
  console.error(chalk.red('❌ Error:'), err.message);
  
  if (process.env.BASELINE_BUDDY_VERBOSE) {
    console.error(err.stack);
  }
  
  process.exit(1);
}

export default program;
