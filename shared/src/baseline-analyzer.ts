import { features } from 'web-features';
import { BaselineFeature, CompatibilityResult, ProjectAnalysis } from './types';

export class BaselineAnalyzer {
  private features: Map<string, BaselineFeature>;

  constructor() {
    this.features = new Map();
    this.loadFeatures();
  }

  private loadFeatures() {
    // Load and process web-features data
    Object.entries(features).forEach(([id, feature]) => {
      this.features.set(id, {
        id,
        name: feature.name,
        description: feature.description || '',
        baseline: feature.status?.baseline || { status: false },
        support: feature.status?.support || {},
        caniuse: feature.caniuse,
        usage_stats: this.calculateUsageStats(feature.status?.support || {})
      });
    });
  }

  private calculateUsageStats(support: any): number {
    // Simple heuristic: if supported in major browsers, higher usage
    const majorBrowsers = ['chrome', 'firefox', 'safari', 'edge'];
    const supportedCount = majorBrowsers.filter(browser => support[browser]).length;
    return (supportedCount / majorBrowsers.length) * 100;
  }

  public getFeature(featureId: string): BaselineFeature | undefined {
    return this.features.get(featureId);
  }

  public checkFeatureCompatibility(featureId: string, targetLevel: '2023' | '2024' | 'latest' = '2024'): CompatibilityResult {
    const feature = this.getFeature(featureId);
    
    if (!feature) {
      return {
        feature: featureId,
        status: 'avoid',
        baseline: { status: false },
        message: `Unknown feature: ${featureId}`,
        suggestion: 'Verify the feature name or check if it\'s a newer feature not yet in Baseline data'
      };
    }

    return this.analyzeFeatureStatus(feature, targetLevel);
  }

  private analyzeFeatureStatus(feature: BaselineFeature, targetLevel: string): CompatibilityResult {
    const { baseline } = feature;
    
    if (baseline.status === 'high') {
      return {
        feature: feature.id,
        status: 'safe',
        baseline,
        message: `✅ ${feature.name} is widely supported (Baseline high)`,
        suggestion: 'Safe to use in production'
      };
    }
    
    if (baseline.status === 'low') {
      const lowDate = baseline.low_date ? new Date(baseline.low_date) : null;
      const targetDate = this.getTargetDate(targetLevel);
      
      if (lowDate && lowDate <= targetDate) {
        return {
          feature: feature.id,
          status: 'safe',
          baseline,
          message: `✅ ${feature.name} reached Baseline low on ${baseline.low_date}`,
          suggestion: 'Safe to use with modern browser targets'
        };
      }
      
      return {
        feature: feature.id,
        status: 'caution',
        baseline,
        message: `⚠️ ${feature.name} is newly available (Baseline low)`,
        suggestion: 'Consider polyfills or feature detection for broader support'
      };
    }
    
    return {
      feature: feature.id,
      status: 'avoid',
      baseline,
      message: `❌ ${feature.name} is not yet Baseline`,
      suggestion: 'Use with caution, consider alternatives or polyfills',
      polyfill: this.suggestPolyfill(feature.id)
    };
  }

  private getTargetDate(level: string): Date {
    const dates = {
      '2023': new Date('2023-01-01'),
      '2024': new Date('2024-01-01'),
      'latest': new Date()
    };
    return dates[level as keyof typeof dates] || dates['2024'];
  }

  private suggestPolyfill(featureId: string): string | undefined {
    const polyfills: Record<string, string> = {
      'css-container-queries': '@container polyfill',
      'css-cascade-layers': 'CSS @layer polyfill',
      'css-has': ':has() polyfill',
      'web-components': 'webcomponents.js'
    };
    
    return polyfills[featureId];
  }

  public analyzeProject(features: string[]): ProjectAnalysis {
    const results = features.map(feature => this.checkFeatureCompatibility(feature));
    
    const summary = results.reduce((acc, result) => {
      acc[result.status]++;
      acc.total++;
      return acc;
    }, { safe: 0, caution: 0, avoid: 0, total: 0 });

    const baselineScore = Math.round((summary.safe / summary.total) * 100);
    
    const recommendations = this.generateRecommendations(results);

    return {
      projectPath: '',
      features: results,
      summary,
      recommendations,
      baselineScore
    };
  }

  private generateRecommendations(results: CompatibilityResult[]): string[] {
    const recommendations: string[] = [];
    
    const avoidFeatures = results.filter(r => r.status === 'avoid');
    const cautionFeatures = results.filter(r => r.status === 'caution');
    
    if (avoidFeatures.length > 0) {
      recommendations.push(`Consider alternatives for ${avoidFeatures.length} non-Baseline features`);
    }
    
    if (cautionFeatures.length > 0) {
      recommendations.push(`Add polyfills or feature detection for ${cautionFeatures.length} newly available features`);
    }
    
    if (results.length > 0) {
      const score = Math.round((results.filter(r => r.status === 'safe').length / results.length) * 100);
      if (score >= 80) {
        recommendations.push('🎉 Great job! Your project uses mostly Baseline-safe features');
      } else if (score >= 60) {
        recommendations.push('👍 Good progress! Consider updating a few more features for better compatibility');
      } else {
        recommendations.push('⚠️ Consider using more Baseline-safe alternatives for better browser support');
      }
    }
    
    return recommendations;
  }

  public getAllFeatures(): BaselineFeature[] {
    return Array.from(this.features.values());
  }

  public searchFeatures(query: string): BaselineFeature[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllFeatures().filter(feature => 
      feature.name.toLowerCase().includes(lowercaseQuery) ||
      feature.description.toLowerCase().includes(lowercaseQuery) ||
      feature.id.toLowerCase().includes(lowercaseQuery)
    );
  }
}
