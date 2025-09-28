import * as fs from 'fs';
import * as path from 'path';
import { CompatibilityResult } from './types';

export class FeatureDetector {
  private cssFeaturePatterns: Map<string, RegExp>;
  private jsFeaturePatterns: Map<string, RegExp>;

  constructor() {
    this.cssFeaturePatterns = new Map();
    this.jsFeaturePatterns = new Map();
    this.initializePatterns();
  }

  private initializePatterns() {
    // CSS Feature Detection Patterns
    this.cssFeaturePatterns.set('css-container-queries', /@container\s+/);
    this.cssFeaturePatterns.set('css-cascade-layers', /@layer\s+/);
    this.cssFeaturePatterns.set('css-has', /:has\s*\(/);
    this.cssFeaturePatterns.set('css-grid', /display:\s*grid/);
    this.cssFeaturePatterns.set('css-flexbox', /display:\s*flex/);
    this.cssFeaturePatterns.set('css-custom-properties', /var\s*\(/);
    this.cssFeaturePatterns.set('css-logical-properties', /(margin|padding|border)-(inline|block)-(start|end)/);
    this.cssFeaturePatterns.set('css-subgrid', /grid-template-(rows|columns):\s*subgrid/);
    this.cssFeaturePatterns.set('css-color-function', /color\s*\(/);
    this.cssFeaturePatterns.set('css-nesting', /&\s*[.#:]/);

    // JavaScript Feature Detection Patterns
    this.jsFeaturePatterns.set('es-modules', /import\s+.*from|export\s+/);
    this.jsFeaturePatterns.set('async-await', /async\s+function|await\s+/);
    this.jsFeaturePatterns.set('arrow-functions', /=>\s*{?/);
    this.jsFeaturePatterns.set('destructuring', /\{.*\}\s*=/);
    this.jsFeaturePatterns.set('template-literals', /`.*\${.*}.*`/);
    this.jsFeaturePatterns.set('optional-chaining', /\?\./);
    this.jsFeaturePatterns.set('nullish-coalescing', /\?\?/);
    this.jsFeaturePatterns.set('private-fields', /#[a-zA-Z]/);
    this.jsFeaturePatterns.set('top-level-await', /^await\s+/m);
    this.jsFeaturePatterns.set('web-components', /customElements\.define|class.*extends\s+HTMLElement/);
  }

  public detectFeaturesInFile(filePath: string): string[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const extension = path.extname(filePath).toLowerCase();
    const features: string[] = [];

    if (['.css', '.scss', '.sass', '.less'].includes(extension)) {
      features.push(...this.detectCSSFeatures(content));
    }

    if (['.js', '.ts', '.jsx', '.tsx', '.mjs'].includes(extension)) {
      features.push(...this.detectJSFeatures(content));
    }

    if (['.html', '.htm'].includes(extension)) {
      features.push(...this.detectHTMLFeatures(content));
    }

    return [...new Set(features)]; // Remove duplicates
  }

  private detectCSSFeatures(content: string): string[] {
    const features: string[] = [];
    
    for (const [featureId, pattern] of this.cssFeaturePatterns) {
      if (pattern.test(content)) {
        features.push(featureId);
      }
    }

    return features;
  }

  private detectJSFeatures(content: string): string[] {
    const features: string[] = [];
    
    for (const [featureId, pattern] of this.jsFeaturePatterns) {
      if (pattern.test(content)) {
        features.push(featureId);
      }
    }

    return features;
  }

  private detectHTMLFeatures(content: string): string[] {
    const features: string[] = [];
    
    // HTML-specific feature detection
    const htmlPatterns: Record<string, RegExp> = {
      'web-components': /<[a-z]+-[a-z-]+/,
      'dialog-element': /<dialog/,
      'details-element': /<details/,
      'picture-element': /<picture/,
      'input-types': /<input[^>]+type=["'](email|url|tel|date|time|color|range)["']/,
      'form-validation': /required|pattern=|minlength=|maxlength=/
    };

    for (const [featureId, pattern] of Object.entries(htmlPatterns)) {
      if (pattern.test(content)) {
        features.push(featureId);
      }
    }

    // Extract CSS and JS from HTML
    const cssMatches = content.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (cssMatches) {
      cssMatches.forEach(match => {
        const cssContent = match.replace(/<\/?style[^>]*>/gi, '');
        features.push(...this.detectCSSFeatures(cssContent));
      });
    }

    const jsMatches = content.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    if (jsMatches) {
      jsMatches.forEach(match => {
        const jsContent = match.replace(/<\/?script[^>]*>/gi, '');
        features.push(...this.detectJSFeatures(jsContent));
      });
    }

    return features;
  }

  public detectFeaturesInDirectory(dirPath: string, extensions: string[] = ['.html', '.css', '.js', '.ts', '.jsx', '.tsx']): Map<string, string[]> {
    const results = new Map<string, string[]>();
    
    const scanDirectory = (currentPath: string) => {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory() && !this.shouldSkipDirectory(item)) {
          scanDirectory(itemPath);
        } else if (stat.isFile() && extensions.includes(path.extname(item).toLowerCase())) {
          try {
            const features = this.detectFeaturesInFile(itemPath);
            if (features.length > 0) {
              results.set(itemPath, features);
            }
          } catch (error) {
            console.warn(`Warning: Could not analyze file ${itemPath}:`, error);
          }
        }
      }
    };

    scanDirectory(dirPath);
    return results;
  }

  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.vscode'];
    return skipDirs.includes(dirName) || dirName.startsWith('.');
  }

  public getFeatureLineNumbers(filePath: string, featureId: string): number[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const lineNumbers: number[] = [];
    
    const pattern = this.cssFeaturePatterns.get(featureId) || this.jsFeaturePatterns.get(featureId);
    if (!pattern) return lineNumbers;

    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        lineNumbers.push(index + 1);
      }
    });

    return lineNumbers;
  }
}
