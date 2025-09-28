import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { CompatibilityChecker } from '@baseline-buddy/shared';

interface CheckOptions {
  output: 'json' | 'html' | 'markdown';
  file?: string;
  baselineLevel: '2023' | '2024' | 'latest';
  exclude?: string;
  watch: boolean;
}

export async function checkCommand(projectPath: string, options: CheckOptions) {
  const spinner = ora();
  
  try {
    const absolutePath = path.resolve(projectPath);
    
    if (!fs.existsSync(absolutePath)) {
      console.error(chalk.red(`❌ Path does not exist: ${absolutePath}`));
      process.exit(1);
    }
    
    const excludeFeatures = options.exclude ? options.exclude.split(',').map(f => f.trim()) : [];
    
    if (options.watch) {
      await watchMode(absolutePath, options, excludeFeatures);
      return;
    }
    
    await runSingleCheck(absolutePath, options, excludeFeatures, spinner);
    
  } catch (error: any) {
    spinner.fail(`❌ Analysis failed: ${error.message}`);
    
    if (process.env.BASELINE_BUDDY_VERBOSE) {
      console.error(error.stack);
    }
    
    process.exit(1);
  }
}

async function runSingleCheck(
  projectPath: string, 
  options: CheckOptions, 
  excludeFeatures: string[],
  spinner: ora.Ora
) {
  spinner.start(`🔍 Analyzing project for Baseline compatibility...`);
  
  const checker = new CompatibilityChecker();
  
  const analysis = await checker.checkProject(projectPath, {
    baselineLevel: options.baselineLevel,
    excludeFeatures
  });
  
  spinner.succeed(`✅ Analysis complete! Found ${analysis.features.length} features`);
  
  // Display summary
  displaySummary(analysis);
  
  // Generate and save report
  const report = checker.generateReport(analysis, options.output);
  
  if (options.file) {
    fs.writeFileSync(options.file, report);
    console.log(chalk.green(`📄 Report saved to: ${options.file}`));
  } else if (options.output === 'json') {
    console.log('\n' + report);
  } else {
    // For HTML/Markdown, save to temp file and show path
    const tempFile = path.join(process.cwd(), `baseline-report.${options.output}`);
    fs.writeFileSync(tempFile, report);
    console.log(chalk.green(`📄 Report generated: ${tempFile}`));
    
    if (options.output === 'html') {
      console.log(chalk.gray('💡 Open the HTML file in your browser to view the interactive report'));
    }
  }
}

function displaySummary(analysis: any) {
  const { summary, baselineScore, recommendations } = analysis;
  
  console.log(chalk.bold('\n📊 Compatibility Summary'));
  console.log('━'.repeat(50));
  
  // Score with color coding
  const scoreColor = baselineScore >= 80 ? 'green' : baselineScore >= 60 ? 'yellow' : 'red';
  console.log(`${chalk.bold('Overall Score:')} ${chalk[scoreColor](`${baselineScore}%`)}`);
  
  // Feature breakdown
  console.log(`\n${chalk.green('✅ Safe:')} ${summary.safe} features`);
  console.log(`${chalk.yellow('⚠️  Caution:')} ${summary.caution} features`);
  console.log(`${chalk.red('❌ Avoid:')} ${summary.avoid} features`);
  console.log(`${chalk.gray('📊 Total:')} ${summary.total} features`);
  
  // Top issues
  if (analysis.features.length > 0) {
    console.log(chalk.bold('\n🔍 Feature Details'));
    console.log('━'.repeat(50));
    
    const sortedFeatures = analysis.features.sort((a: any, b: any) => {
      const order = { avoid: 0, caution: 1, safe: 2 };
      return order[a.status] - order[b.status];
    });
    
    sortedFeatures.slice(0, 5).forEach((feature: any) => {
      const icon = feature.status === 'safe' ? '✅' : feature.status === 'caution' ? '⚠️' : '❌';
      const color = feature.status === 'safe' ? 'green' : feature.status === 'caution' ? 'yellow' : 'red';
      
      console.log(`${icon} ${chalk[color](feature.feature)}`);
      console.log(`   ${chalk.gray(feature.message)}`);
      
      if (feature.suggestion) {
        console.log(`   ${chalk.blue('💡 ' + feature.suggestion)}`);
      }
      console.log();
    });
    
    if (sortedFeatures.length > 5) {
      console.log(chalk.gray(`   ... and ${sortedFeatures.length - 5} more features`));
    }
  }
  
  // Recommendations
  if (recommendations.length > 0) {
    console.log(chalk.bold('\n💡 Recommendations'));
    console.log('━'.repeat(50));
    recommendations.forEach((rec: string) => {
      console.log(`• ${rec}`);
    });
  }
  
  // Next steps
  console.log(chalk.bold('\n🚀 Next Steps'));
  console.log('━'.repeat(50));
  console.log('• Install the Baseline Buddy VS Code extension for real-time hints');
  console.log('• Run with --output=html for a detailed interactive report');
  console.log('• Use baseline-buddy deploy to validate before deployment');
  
  if (baselineScore < 80) {
    console.log('• Consider updating features marked as "avoid" or "caution"');
  }
}

async function watchMode(
  projectPath: string, 
  options: CheckOptions, 
  excludeFeatures: string[]
) {
  console.log(chalk.blue('👀 Watching for changes...'));
  console.log(chalk.gray('Press Ctrl+C to stop'));
  
  const chokidar = require('chokidar');
  const debounce = require('lodash.debounce');
  
  const runCheck = debounce(async () => {
    console.clear();
    console.log(chalk.blue(`🔄 Files changed, re-analyzing... ${new Date().toLocaleTimeString()}`));
    
    const spinner = ora();
    await runSingleCheck(projectPath, options, excludeFeatures, spinner);
    
    console.log(chalk.blue('\n👀 Watching for changes...'));
  }, 1000);
  
  const watcher = chokidar.watch(projectPath, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    ignoreInitial: true,
    persistent: true
  });
  
  watcher
    .on('change', runCheck)
    .on('add', runCheck)
    .on('unlink', runCheck);
  
  // Initial check
  const spinner = ora();
  await runSingleCheck(projectPath, options, excludeFeatures, spinner);
  console.log(chalk.blue('\n👀 Watching for changes...'));
  
  // Keep process alive
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n👋 Stopping watch mode...'));
    watcher.close();
    process.exit(0);
  });
}
