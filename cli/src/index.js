#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { injectPolyfills } from '../../shared/polyfill-injector.js';
import { deploy } from '../../scripts/deploy.js';

// Import web-features to test integration
let webFeatures;
try {
  const webFeaturesModule = await import('web-features');
  webFeatures = webFeaturesModule.features || webFeaturesModule.default?.features || webFeaturesModule;
  console.log(chalk.green('✅ web-features loaded successfully'));
} catch (error) {
  console.error(chalk.red('❌ Failed to load web-features:'), error.message);
  process.exit(1);
}

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

// Test command to verify everything works
program
  .command('test')
  .description('🧪 Test Baseline Buddy functionality')
  .action(() => {
    console.log(chalk.blue('🧪 Testing Baseline Buddy...'));
    
    // Test web-features integration
    const featureCount = Object.keys(webFeatures.features || {}).length;
    console.log(chalk.green(`✅ Loaded ${featureCount} web features from Baseline data`));
    
    // Show a few example features
    const exampleFeatures = Object.entries(webFeatures.features || {}).slice(0, 3);
    console.log(chalk.blue('\n📋 Example features:'));
    
    exampleFeatures.forEach(([id, feature]) => {
      const status = feature.status?.baseline?.status || 'unknown';
      const icon = status === 'high' ? '✅' : status === 'low' ? '🟡' : '🔴';
      console.log(`${icon} ${feature.name} (${id})`);
    });
    
    console.log(chalk.green('\n🎉 Baseline Buddy is working correctly!'));
  });

// Initialize project command
program
  .command('init')
  .description('🏗️  Initialize a new project with Baseline-optimized templates')
  .argument('<project-name>', 'Name of the project to create')
  .option('-t, --template <type>', 'Template type (html, react, vue, next)', 'html')
  .action((projectName, options) => {
    import('./commands/init.js').then(({ initCommand }) => {
      initCommand(projectName, options);
    });
  });

// Check compatibility command
program
  .command('check')
  .description('🔍 Analyze project for Baseline compatibility')
  .argument('[path]', 'Project path to analyze', '.')
  .option('-o, --output <format>', 'Output format (json, html)', 'json')
  .option('-f, --file <path>', 'Save report to file')
  .option('-b, --baseline-level <level>', 'Target Baseline level', '2024')
  .action((projectPath, options) => {
    import('./commands/check.js').then(({ checkCommand }) => {
      checkCommand(projectPath, options);
    });
  });

// Polyfill injection command
program
  .command('polyfill')
  .description('💉 Inject polyfills into HTML files')
  .argument('<file>', 'HTML file to process')
  .option('-b, --browsers <browsers>', 'Target browsers (comma-separated)', 'ie 11')
  .action((file, options) => {
    import('fs').then(fs => {
      const browsers = options.browsers.split(',').map(b => b.trim());
      
      try {
        const content = fs.readFileSync(file, 'utf8');
        const enhanced = injectPolyfills(content, browsers);
        fs.writeFileSync(file, enhanced);
        console.log(chalk.green(`✅ Polyfills injected into ${file}`));
      } catch (error) {
        console.error(chalk.red('❌ Error:'), error.message);
      }
    });
  });

// Deploy command
program
  .command('deploy')
  .description('🚀 Deploy project to hosting platform')
  .argument('[target]', 'Deployment target (vercel, netlify, surge)', 'vercel')
  .argument('[dir]', 'Project directory', '.')
  .action((target, dir) => {
    try {
      deploy(target, dir);
    } catch (error) {
      console.error(chalk.red('❌ Deploy failed:'), error.message);
    }
  });

// Search features command (working example)
program
  .command('search')
  .description('🔎 Search Baseline features and compatibility info')
  .argument('<query>', 'Search query for features')
  .option('-l, --limit <number>', 'Limit number of results', '5')
  .action((query, options) => {
    console.log(chalk.blue(`🔎 Searching for: "${query}"`));
    console.log('━'.repeat(50));
    
    const limit = parseInt(options.limit) || 5;
    const features = Object.entries(webFeatures.features || {});
    
    const results = features.filter(([id, feature]) => 
      feature.name.toLowerCase().includes(query.toLowerCase()) ||
      id.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit);
    
    if (results.length === 0) {
      console.log(chalk.yellow('No features found matching your search.'));
      return;
    }
    
    console.log(chalk.green(`Found ${results.length} feature(s):\n`));
    
    results.forEach(([id, feature], index) => {
      const status = feature.status?.baseline?.status || false;
      const icon = status === 'high' ? '✅' : status === 'low' ? '🟡' : '🔴';
      
      console.log(`${index + 1}. ${icon} ${chalk.bold(feature.name)}`);
      console.log(`   ${chalk.gray('ID:')} ${id}`);
      
      if (status === 'high') {
        console.log(`   ${chalk.green('Status: Widely available (Baseline high)')}`);
      } else if (status === 'low') {
        console.log(`   ${chalk.yellow('Status: Newly available (Baseline low)')}`);
      } else {
        console.log(`   ${chalk.red('Status: Not yet Baseline')}`);
      }
      console.log();
    });
  });

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (err) {
  if (err.code === 'commander.help') {
    process.exit(0);
  }
  
  console.error(chalk.red('❌ Error:'), err.message);
  process.exit(1);
}
