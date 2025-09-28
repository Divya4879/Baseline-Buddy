import chalk from 'chalk';
import { BaselineAnalyzer } from '@baseline-buddy/shared';

interface SearchOptions {
  status?: 'high' | 'low' | 'false';
  limit: string;
  detailed: boolean;
}

export async function searchCommand(query: string, options: SearchOptions) {
  try {
    const analyzer = new BaselineAnalyzer();
    const limit = parseInt(options.limit) || 10;
    
    console.log(chalk.blue(`🔎 Searching for: "${query}"`));
    console.log('━'.repeat(50));
    
    // Search features
    let results = analyzer.searchFeatures(query);
    
    // Filter by status if specified
    if (options.status) {
      results = results.filter(feature => {
        if (options.status === 'false') {
          return feature.baseline.status === false;
        }
        return feature.baseline.status === options.status;
      });
    }
    
    // Limit results
    results = results.slice(0, limit);
    
    if (results.length === 0) {
      console.log(chalk.yellow('No features found matching your search.'));
      console.log(chalk.gray('\n💡 Try a different search term or check spelling.'));
      return;
    }
    
    console.log(chalk.green(`Found ${results.length} feature(s):\n`));
    
    results.forEach((feature, index) => {
      displayFeature(feature, options.detailed, index + 1);
    });
    
    if (results.length === limit && analyzer.searchFeatures(query).length > limit) {
      console.log(chalk.gray(`\n... and more. Use --limit=${limit + 10} to see more results.`));
    }
    
    // Show search tips
    console.log(chalk.bold('\n💡 Search Tips:'));
    console.log('• Use --status=high to find widely supported features');
    console.log('• Use --status=low to find newly available features');
    console.log('• Use --status=false to find experimental features');
    console.log('• Use --detailed for more information');
    
  } catch (error: any) {
    console.error(chalk.red(`❌ Search failed: ${error.message}`));
    process.exit(1);
  }
}

function displayFeature(feature: any, detailed: boolean, index: number) {
  const statusIcon = getStatusIcon(feature.baseline.status);
  const statusColor = getStatusColor(feature.baseline.status);
  
  console.log(`${chalk.gray(`${index}.`)} ${statusIcon} ${chalk.bold(feature.name)}`);
  console.log(`   ${chalk.gray('ID:')} ${feature.id}`);
  
  if (feature.description) {
    console.log(`   ${chalk.gray('Description:')} ${feature.description}`);
  }
  
  // Baseline status
  if (feature.baseline.status === 'high') {
    console.log(`   ${chalk.green('Status: Widely available (Baseline high)')}`);
  } else if (feature.baseline.status === 'low') {
    console.log(`   ${chalk.yellow('Status: Newly available (Baseline low)')}`);
    if (feature.baseline.low_date) {
      console.log(`   ${chalk.gray('Available since:')} ${feature.baseline.low_date}`);
    }
  } else {
    console.log(`   ${chalk.red('Status: Not yet Baseline')}`);
  }
  
  if (detailed) {
    // Browser support
    if (feature.support && Object.keys(feature.support).length > 0) {
      console.log(`   ${chalk.gray('Browser Support:')}`);
      Object.entries(feature.support).forEach(([browser, version]) => {
        if (version) {
          console.log(`     ${getBrowserIcon(browser)} ${browser}: ${version}+`);
        }
      });
    }
    
    // Usage stats
    if (feature.usage_stats !== undefined) {
      const usageColor = feature.usage_stats >= 80 ? 'green' : feature.usage_stats >= 50 ? 'yellow' : 'red';
      console.log(`   ${chalk.gray('Usage:')} ${chalk[usageColor](`${feature.usage_stats.toFixed(1)}%`)}`);
    }
    
    // Can I Use link
    if (feature.caniuse) {
      console.log(`   ${chalk.gray('Can I Use:')} https://caniuse.com/${feature.caniuse}`);
    }
  }
  
  console.log(); // Empty line between features
}

function getStatusIcon(status: any): string {
  if (status === 'high') return '✅';
  if (status === 'low') return '🟡';
  return '🔴';
}

function getStatusColor(status: any): 'green' | 'yellow' | 'red' {
  if (status === 'high') return 'green';
  if (status === 'low') return 'yellow';
  return 'red';
}

function getBrowserIcon(browser: string): string {
  const icons: Record<string, string> = {
    chrome: '🟢',
    firefox: '🟠', 
    safari: '🔵',
    edge: '🟦',
    ie: '🟪'
  };
  return icons[browser.toLowerCase()] || '⚪';
}
