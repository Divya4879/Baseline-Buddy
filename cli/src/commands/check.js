import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

// Feature detection patterns mapped to actual web-features IDs
const PATTERNS = {
  'grid': /display:\s*grid/gi,
  'flexbox': /display:\s*flex/gi,
  'custom-properties': /var\s*\(/gi,
  'has': /:has\s*\(/gi,
  'container-queries': /@container\s+/gi,
  'cascade-layers': /@layer\s+/gi,
  'arrow-functions': /=>\s*{?/gi,
  'template-literals': /`.*\${.*}.*`/gi,
  'optional-chaining': /\?\./gi,
  'destructuring': /\{.*\}\s*=/gi
};

export function checkCommand(projectPath = '.', options = {}) {
  const { output = 'json', file, baselineLevel = '2024' } = options;
  
  try {
    const absolutePath = path.resolve(projectPath);
    
    if (!fs.existsSync(absolutePath)) {
      console.error(chalk.red(`❌ Path does not exist: ${absolutePath}`));
      process.exit(1);
    }
    
    console.log(chalk.blue('🔍 Analyzing project...'));
    
    // Scan files
    const detectedFeatures = scanDirectory(absolutePath);
    
    // Analyze features with real web-features data
    analyzeFeatures(detectedFeatures, baselineLevel).then(analysis => {
      // Display results
      displaySummary(analysis);
      
      // Generate report
      const report = generateReport(analysis, output);
      
      if (file) {
        fs.writeFileSync(file, report);
        console.log(chalk.green(`📄 Report saved to: ${file}`));
      } else if (output === 'html') {
        const tempFile = path.join(process.cwd(), 'baseline-report.html');
        fs.writeFileSync(tempFile, report);
        console.log(chalk.green(`📄 HTML report: ${tempFile}`));
      } else if (output === 'json') {
        console.log('\n' + JSON.stringify(analysis, null, 2));
      }
    });
    
  } catch (error) {
    console.error(chalk.red(`❌ Analysis failed: ${error.message}`));
    process.exit(1);
  }
}

function scanDirectory(dirPath) {
  const detectedFeatures = new Set();
  const extensions = ['.html', '.css', '.js', '.ts', '.jsx', '.tsx'];
  
  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      for (const [featureId, pattern] of Object.entries(PATTERNS)) {
        if (pattern.test(content)) {
          detectedFeatures.add(featureId);
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      if (item.startsWith('.') || item === 'node_modules') continue;
      
      const itemPath = path.join(currentPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        walkDir(itemPath);
      } else if (extensions.includes(path.extname(item))) {
        scanFile(itemPath);
      }
    }
  }
  
  walkDir(dirPath);
  return Array.from(detectedFeatures);
}

async function analyzeFeatures(detectedFeatures, baselineLevel) {
  const results = [];
  let safe = 0, caution = 0, avoid = 0;
  
  // Import real web-features data
  const webFeaturesModule = await import('web-features');
  const webFeatures = webFeaturesModule.default || webFeaturesModule;
  const features = webFeatures.features || webFeatures;
  
  for (const featureId of detectedFeatures) {
    const feature = features[featureId];
    let status, message;
    
    if (feature?.status?.baseline === 'high') {
      status = 'safe';
      message = `✅ ${feature.name || featureId} is widely supported (Baseline high)`;
      safe++;
    } else if (feature?.status?.baseline === 'low') {
      status = 'caution';
      message = `⚠️ ${feature.name || featureId} is newly available (Baseline low)`;
      caution++;
    } else {
      status = 'avoid';
      message = `❌ ${feature?.name || featureId} is not yet Baseline`;
      avoid++;
    }
    
    results.push({ feature: featureId, status, message });
  }
  
  const total = results.length;
  const score = total > 0 ? Math.round((safe / total) * 100) : 100;
  
  return {
    features: results,
    summary: { safe, caution, avoid, total },
    score,
    recommendations: generateRecommendations(safe, caution, avoid)
  };
}

function generateRecommendations(safe, caution, avoid) {
  const recs = [];
  
  if (avoid > 0) recs.push(`Consider alternatives for ${avoid} non-Baseline features`);
  if (caution > 0) recs.push(`Add polyfills for ${caution} newly available features`);
  if (safe + caution > avoid) recs.push('Good job using mostly modern, safe features!');
  
  return recs;
}

function displaySummary(analysis) {
  const { summary, score } = analysis;
  
  console.log(chalk.bold('\n📊 Compatibility Summary'));
  console.log('━'.repeat(50));
  
  const scoreColor = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';
  console.log(`${chalk.bold('Baseline Score:')} ${chalk[scoreColor](`${score}%`)}`);
  
  console.log(`\n${chalk.green('✅ Safe:')} ${summary.safe}`);
  console.log(`${chalk.yellow('⚠️ Caution:')} ${summary.caution}`);
  console.log(`${chalk.red('❌ Avoid:')} ${summary.avoid}`);
  console.log(`${chalk.gray('📊 Total:')} ${summary.total}`);
  
  if (analysis.features.length > 0) {
    console.log(chalk.bold('\n🔍 Features Found:'));
    analysis.features.slice(0, 5).forEach(f => {
      console.log(`  ${f.message}`);
    });
    
    if (analysis.features.length > 5) {
      console.log(chalk.gray(`  ... and ${analysis.features.length - 5} more`));
    }
  }
  
  if (analysis.recommendations.length > 0) {
    console.log(chalk.bold('\n💡 Recommendations:'));
    analysis.recommendations.forEach(rec => console.log(`• ${rec}`));
  }
}

function generateReport(analysis, format) {
  if (format === 'html') {
    return `<!DOCTYPE html>
<html><head><title>Baseline Report</title>
<style>body{font-family:system-ui;padding:20px}.score{font-size:48px;color:${analysis.score >= 80 ? '#22c55e' : '#f59e0b'}}.feature{padding:10px;margin:5px 0;border-left:4px solid #ccc}</style>
</head><body>
<h1>🚀 Baseline Compatibility Report</h1>
<div class="score">${analysis.score}%</div>
<p>Baseline Score</p>
<h2>Summary</h2>
<p>✅ Safe: ${analysis.summary.safe} | ⚠️ Caution: ${analysis.summary.caution} | ❌ Avoid: ${analysis.summary.avoid}</p>
<h2>Features</h2>
${analysis.features.map(f => `<div class="feature">${f.message}</div>`).join('')}
</body></html>`;
  }
  
  return JSON.stringify(analysis, null, 2);
}
