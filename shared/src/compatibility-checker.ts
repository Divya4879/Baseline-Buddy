import { BaselineAnalyzer } from './baseline-analyzer';
import { FeatureDetector } from './feature-detector';
import { ProjectAnalysis, CompatibilityResult } from './types';

export class CompatibilityChecker {
  private analyzer: BaselineAnalyzer;
  private detector: FeatureDetector;

  constructor() {
    this.analyzer = new BaselineAnalyzer();
    this.detector = new FeatureDetector();
  }

  public async checkProject(projectPath: string, options: {
    baselineLevel?: '2023' | '2024' | 'latest';
    extensions?: string[];
    excludeFeatures?: string[];
  } = {}): Promise<ProjectAnalysis> {
    const {
      baselineLevel = '2024',
      extensions = ['.html', '.css', '.js', '.ts', '.jsx', '.tsx'],
      excludeFeatures = []
    } = options;

    // Detect features in the project
    const fileFeatures = this.detector.detectFeaturesInDirectory(projectPath, extensions);
    
    // Collect all unique features
    const allFeatures = new Set<string>();
    for (const features of fileFeatures.values()) {
      features.forEach(feature => {
        if (!excludeFeatures.includes(feature)) {
          allFeatures.add(feature);
        }
      });
    }

    // Analyze each feature
    const results: CompatibilityResult[] = [];
    for (const feature of allFeatures) {
      const result = this.analyzer.checkFeatureCompatibility(feature, baselineLevel);
      
      // Add file locations where this feature is used
      const locations: Array<{file: string, lines: number[]}> = [];
      for (const [filePath, features] of fileFeatures.entries()) {
        if (features.includes(feature)) {
          const lines = this.detector.getFeatureLineNumbers(filePath, feature);
          locations.push({ file: filePath, lines });
        }
      }
      
      results.push({
        ...result,
        locations
      } as any);
    }

    // Generate project analysis
    const analysis = this.analyzer.analyzeProject(Array.from(allFeatures));
    analysis.projectPath = projectPath;
    analysis.features = results;

    return analysis;
  }

  public checkSingleFeature(featureId: string, baselineLevel: '2023' | '2024' | 'latest' = '2024'): CompatibilityResult {
    return this.analyzer.checkFeatureCompatibility(featureId, baselineLevel);
  }

  public generateReport(analysis: ProjectAnalysis, format: 'json' | 'html' | 'markdown' = 'json'): string {
    switch (format) {
      case 'html':
        return this.generateHTMLReport(analysis);
      case 'markdown':
        return this.generateMarkdownReport(analysis);
      default:
        return JSON.stringify(analysis, null, 2);
    }
  }

  private generateHTMLReport(analysis: ProjectAnalysis): string {
    const { summary, baselineScore, features, recommendations } = analysis;
    
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'safe': return '#22c55e';
        case 'caution': return '#f59e0b';
        case 'avoid': return '#ef4444';
        default: return '#6b7280';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'safe': return '✅';
        case 'caution': return '⚠️';
        case 'avoid': return '❌';
        default: return '❓';
      }
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Baseline Buddy - Compatibility Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .score { font-size: 48px; font-weight: bold; color: ${baselineScore >= 80 ? '#22c55e' : baselineScore >= 60 ? '#f59e0b' : '#ef4444'}; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .summary-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .features { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .feature { padding: 15px; border-left: 4px solid; margin-bottom: 15px; border-radius: 0 8px 8px 0; }
        .recommendations { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .rec-item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .rec-item:last-child { border-bottom: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Baseline Buddy Compatibility Report</h1>
            <div class="score">${baselineScore}%</div>
            <p>Baseline Compatibility Score</p>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3 style="color: #22c55e;">✅ Safe</h3>
                <div style="font-size: 24px; font-weight: bold;">${summary.safe}</div>
            </div>
            <div class="summary-card">
                <h3 style="color: #f59e0b;">⚠️ Caution</h3>
                <div style="font-size: 24px; font-weight: bold;">${summary.caution}</div>
            </div>
            <div class="summary-card">
                <h3 style="color: #ef4444;">❌ Avoid</h3>
                <div style="font-size: 24px; font-weight: bold;">${summary.avoid}</div>
            </div>
            <div class="summary-card">
                <h3>📊 Total</h3>
                <div style="font-size: 24px; font-weight: bold;">${summary.total}</div>
            </div>
        </div>

        <div class="features">
            <h2>Feature Analysis</h2>
            ${features.map(feature => `
                <div class="feature" style="border-left-color: ${getStatusColor(feature.status)}; background: ${getStatusColor(feature.status)}10;">
                    <h3>${getStatusIcon(feature.status)} ${feature.feature}</h3>
                    <p>${feature.message}</p>
                    ${feature.suggestion ? `<p><strong>Suggestion:</strong> ${feature.suggestion}</p>` : ''}
                    ${feature.polyfill ? `<p><strong>Polyfill:</strong> ${feature.polyfill}</p>` : ''}
                </div>
            `).join('')}
        </div>

        <div class="recommendations">
            <h2>📋 Recommendations</h2>
            ${recommendations.map(rec => `<div class="rec-item">${rec}</div>`).join('')}
        </div>
    </div>
</body>
</html>`;
  }

  private generateMarkdownReport(analysis: ProjectAnalysis): string {
    const { summary, baselineScore, features, recommendations } = analysis;

    return `# 🚀 Baseline Buddy Compatibility Report

## Overall Score: ${baselineScore}%

### Summary
- ✅ **Safe**: ${summary.safe} features
- ⚠️ **Caution**: ${summary.caution} features  
- ❌ **Avoid**: ${summary.avoid} features
- 📊 **Total**: ${summary.total} features

## Feature Analysis

${features.map(feature => `
### ${feature.feature}
**Status**: ${feature.status === 'safe' ? '✅' : feature.status === 'caution' ? '⚠️' : '❌'} ${feature.status.toUpperCase()}

${feature.message}

${feature.suggestion ? `**Suggestion**: ${feature.suggestion}` : ''}
${feature.polyfill ? `**Polyfill**: ${feature.polyfill}` : ''}

---
`).join('')}

## 📋 Recommendations

${recommendations.map(rec => `- ${rec}`).join('\n')}

---
*Generated by Baseline Buddy - Making modern web features accessible to everyone*
`;
  }
}
