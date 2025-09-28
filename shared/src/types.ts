export interface BaselineFeature {
  id: string;
  name: string;
  description: string;
  baseline: {
    status: 'high' | 'low' | false;
    low_date?: string;
    high_date?: string;
  };
  support: {
    chrome?: string;
    firefox?: string;
    safari?: string;
    edge?: string;
  };
  caniuse?: string;
  usage_stats?: number;
}

export interface CompatibilityResult {
  feature: string;
  status: 'safe' | 'caution' | 'avoid';
  baseline: BaselineFeature['baseline'];
  message: string;
  suggestion?: string;
  polyfill?: string;
  line?: number;
  column?: number;
}

export interface ProjectAnalysis {
  projectPath: string;
  features: CompatibilityResult[];
  summary: {
    safe: number;
    caution: number;
    avoid: number;
    total: number;
  };
  recommendations: string[];
  baselineScore: number; // 0-100
}

export interface TemplateConfig {
  name: string;
  description: string;
  type: 'html' | 'react' | 'vue' | 'next' | 'vanilla';
  baselineLevel: '2023' | '2024' | 'latest';
  features: string[];
  files: TemplateFile[];
}

export interface TemplateFile {
  path: string;
  content: string;
  type: 'text' | 'binary';
}

export interface DeploymentConfig {
  platform: 'netlify' | 'vercel' | 'github-pages' | 'aws-s3';
  buildCommand?: string;
  outputDir?: string;
  environmentVars?: Record<string, string>;
}

export interface BaselineBuddyConfig {
  targetBrowsers: string;
  baselineLevel: '2023' | '2024' | 'latest';
  excludeFeatures: string[];
  customRules: CustomRule[];
  deployment?: DeploymentConfig;
}

export interface CustomRule {
  feature: string;
  action: 'allow' | 'warn' | 'error';
  message?: string;
}
