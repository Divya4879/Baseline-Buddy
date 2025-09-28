import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { ensureDirectoryExists, isValidProjectName, copyTemplate } from '@baseline-buddy/shared';

interface InitOptions {
  template: string;
  baselineLevel: '2023' | '2024' | 'latest';
  directory: string;
  install: boolean;
  git: boolean;
}

export async function initCommand(projectName: string, options: InitOptions) {
  const spinner = ora();
  
  try {
    // Validate project name
    if (!isValidProjectName(projectName)) {
      console.error(chalk.red('❌ Invalid project name. Use only letters, numbers, hyphens, and underscores.'));
      process.exit(1);
    }

    const projectPath = path.resolve(options.directory, projectName);
    
    // Check if directory already exists
    if (fs.existsSync(projectPath)) {
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: `Directory ${projectName} already exists. Overwrite?`,
        default: false
      }]);
      
      if (!overwrite) {
        console.log(chalk.yellow('⚠️  Operation cancelled.'));
        process.exit(0);
      }
    }

    spinner.start(`🏗️  Creating project ${chalk.cyan(projectName)}...`);
    
    // Create project directory
    ensureDirectoryExists(projectPath);
    
    // Get template configuration
    const templateConfig = getTemplateConfig(options.template, options.baselineLevel);
    
    spinner.text = `📋 Setting up ${templateConfig.name} template...`;
    
    // Copy template files
    await createProjectFromTemplate(projectPath, templateConfig, {
      projectName,
      baselineLevel: options.baselineLevel
    });
    
    spinner.succeed(`✅ Project ${chalk.cyan(projectName)} created successfully!`);
    
    // Initialize git if requested
    if (options.git) {
      spinner.start('🔧 Initializing git repository...');
      try {
        execSync('git init', { cwd: projectPath, stdio: 'ignore' });
        execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
        execSync('git commit -m "Initial commit with Baseline Buddy"', { cwd: projectPath, stdio: 'ignore' });
        spinner.succeed('✅ Git repository initialized');
      } catch (error) {
        spinner.warn('⚠️  Git initialization failed (git not installed?)');
      }
    }
    
    // Install dependencies if requested
    if (options.install && templateConfig.type !== 'html') {
      spinner.start('📦 Installing dependencies...');
      try {
        execSync('npm install', { cwd: projectPath, stdio: 'ignore' });
        spinner.succeed('✅ Dependencies installed');
      } catch (error) {
        spinner.warn('⚠️  Dependency installation failed. Run npm install manually.');
      }
    }
    
    // Show next steps
    console.log(chalk.green('\n🎉 Your Baseline-optimized project is ready!'));
    console.log(chalk.gray('\nNext steps:'));
    console.log(chalk.cyan(`  cd ${projectName}`));
    
    if (!options.install && templateConfig.type !== 'html') {
      console.log(chalk.cyan('  npm install'));
    }
    
    if (templateConfig.type === 'html') {
      console.log(chalk.cyan('  baseline-buddy check'));
      console.log(chalk.cyan('  # Open index.html in your browser'));
    } else {
      console.log(chalk.cyan('  npm run dev'));
    }
    
    console.log(chalk.cyan('  baseline-buddy check  # Analyze compatibility'));
    console.log(chalk.gray('\n💡 Tip: Install the Baseline Buddy VS Code extension for real-time compatibility hints!'));
    
  } catch (error: any) {
    spinner.fail(`❌ Failed to create project: ${error.message}`);
    process.exit(1);
  }
}

function getTemplateConfig(template: string, baselineLevel: string) {
  const templates = {
    html: {
      name: 'Modern HTML/CSS/JS',
      type: 'html' as const,
      description: 'Clean HTML5 template with modern CSS and vanilla JavaScript',
      features: ['css-grid', 'css-flexbox', 'css-custom-properties', 'es-modules']
    },
    react: {
      name: 'React with Baseline',
      type: 'react' as const,
      description: 'React application with Baseline-safe modern features',
      features: ['es-modules', 'jsx', 'css-grid', 'css-custom-properties']
    },
    vue: {
      name: 'Vue.js with Baseline',
      type: 'vue' as const,
      description: 'Vue.js application optimized for Baseline compatibility',
      features: ['es-modules', 'css-grid', 'css-custom-properties', 'vue-sfc']
    },
    next: {
      name: 'Next.js with Baseline',
      type: 'next' as const,
      description: 'Next.js application with server-side rendering and Baseline features',
      features: ['es-modules', 'jsx', 'css-modules', 'css-grid']
    }
  };
  
  const config = templates[template as keyof typeof templates];
  if (!config) {
    throw new Error(`Unknown template: ${template}. Available: ${Object.keys(templates).join(', ')}`);
  }
  
  return {
    ...config,
    baselineLevel
  };
}

async function createProjectFromTemplate(
  projectPath: string, 
  templateConfig: any, 
  variables: Record<string, string>
) {
  const templatesDir = path.join(__dirname, '../../templates', templateConfig.type);
  
  // For now, create basic templates inline
  // In a real implementation, these would be separate template files
  
  switch (templateConfig.type) {
    case 'html':
      await createHTMLTemplate(projectPath, variables);
      break;
    case 'react':
      await createReactTemplate(projectPath, variables);
      break;
    case 'vue':
      await createVueTemplate(projectPath, variables);
      break;
    case 'next':
      await createNextTemplate(projectPath, variables);
      break;
  }
}

async function createHTMLTemplate(projectPath: string, variables: Record<string, string>) {
  // Create package.json for HTML project
  const packageJson = {
    name: variables.projectName,
    version: '1.0.0',
    description: `Modern web project created with Baseline Buddy`,
    scripts: {
      dev: 'python -m http.server 8000 || python3 -m http.server 8000',
      check: 'baseline-buddy check',
      deploy: 'baseline-buddy deploy'
    },
    keywords: ['baseline', 'modern-web', 'html5'],
    author: '',
    license: 'MIT'
  };
  
  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Create index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${variables.projectName}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header class="header">
        <h1>🚀 ${variables.projectName}</h1>
        <p>Built with Baseline Buddy - Modern web features, safely delivered</p>
    </header>
    
    <main class="main">
        <section class="hero">
            <h2>Welcome to Modern Web Development</h2>
            <p>This project uses Baseline-safe modern web features:</p>
            
            <div class="features-grid">
                <div class="feature-card">
                    <h3>CSS Grid</h3>
                    <p>✅ Baseline since 2020</p>
                </div>
                <div class="feature-card">
                    <h3>CSS Flexbox</h3>
                    <p>✅ Baseline since 2015</p>
                </div>
                <div class="feature-card">
                    <h3>CSS Custom Properties</h3>
                    <p>✅ Baseline since 2020</p>
                </div>
                <div class="feature-card">
                    <h3>ES Modules</h3>
                    <p>✅ Baseline since 2020</p>
                </div>
            </div>
        </section>
        
        <section class="cta">
            <button class="cta-button" onclick="showMessage()">
                Try Modern JavaScript
            </button>
            <div id="message" class="message hidden">
                <p>🎉 This uses modern JavaScript features safely!</p>
            </div>
        </section>
    </main>
    
    <footer class="footer">
        <p>Generated by <strong>Baseline Buddy</strong> - Making modern web features accessible</p>
    </footer>
    
    <script src="script.js"></script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(projectPath, 'index.html'), indexHtml);
  
  // Create styles.css
  const stylesCss = `/* Modern CSS with Baseline-safe features */
:root {
  --primary-color: #3b82f6;
  --secondary-color: #1e40af;
  --success-color: #22c55e;
  --background-color: #f8fafc;
  --text-color: #1f2937;
  --border-radius: 8px;
  --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: var(--text-color);
  background-color: var(--background-color);
}

.header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 2rem;
  text-align: center;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.hero {
  text-align: center;
  margin-bottom: 3rem;
}

.hero h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.feature-card {
  background: white;
  padding: 1.5rem;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  transition: transform 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-2px);
}

.feature-card h3 {
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.feature-card p {
  color: var(--success-color);
  font-weight: 600;
}

.cta {
  text-align: center;
  margin: 3rem 0;
}

.cta-button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.cta-button:hover {
  background: var(--secondary-color);
}

.message {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--success-color);
  color: white;
  border-radius: var(--border-radius);
  transition: opacity 0.3s ease;
}

.message.hidden {
  display: none;
}

.footer {
  background: var(--text-color);
  color: white;
  text-align: center;
  padding: 2rem;
  margin-top: 3rem;
}

/* Responsive design using modern CSS */
@media (max-width: 768px) {
  .header h1 {
    font-size: 2rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .main {
    padding: 1rem;
  }
}`;
  
  fs.writeFileSync(path.join(projectPath, 'styles.css'), stylesCss);
  
  // Create script.js
  const scriptJs = `// Modern JavaScript with Baseline-safe features

// Using const/let (ES2015 - Baseline since 2020)
const messageElement = document.getElementById('message');

// Arrow function (ES2015 - Baseline since 2020)  
const showMessage = () => {
  messageElement.classList.remove('hidden');
  
  // Template literals (ES2015 - Baseline since 2020)
  console.log(\`Message shown at \${new Date().toLocaleTimeString()}\`);
  
  // Hide message after 3 seconds
  setTimeout(() => {
    messageElement.classList.add('hidden');
  }, 3000);
};

// Modern event handling
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 ${variables.projectName} loaded with modern JavaScript!');
  
  // Feature detection example
  if ('CSS' in window && CSS.supports) {
    const supportsGrid = CSS.supports('display', 'grid');
    const supportsCustomProps = CSS.supports('--custom', 'property');
    
    console.log('CSS Grid support:', supportsGrid);
    console.log('CSS Custom Properties support:', supportsCustomProps);
  }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { showMessage };
}`;
  
  fs.writeFileSync(path.join(projectPath, 'script.js'), scriptJs);
  
  // Create README.md
  const readme = `# ${variables.projectName}

A modern web project created with **Baseline Buddy** - ensuring you use web features that are safe and widely supported.

## 🚀 Features

This project uses the following Baseline-safe modern web features:

- ✅ **CSS Grid** - Layout system (Baseline since 2020)
- ✅ **CSS Flexbox** - Flexible layouts (Baseline since 2015)  
- ✅ **CSS Custom Properties** - CSS variables (Baseline since 2020)
- ✅ **ES Modules** - Modern JavaScript modules (Baseline since 2020)
- ✅ **Arrow Functions** - Concise function syntax (Baseline since 2020)
- ✅ **Template Literals** - String interpolation (Baseline since 2020)

## 🛠️ Development

### Start Development Server
\`\`\`bash
npm run dev
# Opens http://localhost:8000
\`\`\`

### Check Compatibility
\`\`\`bash
npm run check
# Analyzes your code for Baseline compatibility
\`\`\`

### Deploy
\`\`\`bash
npm run deploy
# Deploys with compatibility validation
\`\`\`

## 📊 Baseline Compatibility

This project targets **Baseline ${variables.baselineLevel}** compatibility level, ensuring your code works reliably across modern browsers.

Run \`baseline-buddy check\` anytime to verify your project's compatibility status.

## 🎯 Next Steps

1. **Install VS Code Extension**: Get real-time compatibility hints while coding
2. **Customize**: Modify the code while staying within Baseline-safe features  
3. **Deploy**: Use \`baseline-buddy deploy\` for validated deployments
4. **Learn**: Explore more Baseline features at [web.dev/baseline](https://web.dev/baseline)

---

*Generated by Baseline Buddy - Making modern web features accessible to everyone*
`;
  
  fs.writeFileSync(path.join(projectPath, 'README.md'), readme);
}

async function createReactTemplate(projectPath: string, variables: Record<string, string>) {
  // This would create a React template - simplified for demo
  const packageJson = {
    name: variables.projectName,
    version: '1.0.0',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      check: 'baseline-buddy check'
    },
    dependencies: {
      react: '^18.0.0',
      'react-dom': '^18.0.0'
    },
    devDependencies: {
      '@vitejs/plugin-react': '^4.0.0',
      vite: '^4.0.0'
    }
  };
  
  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // Create basic React files...
  // (Implementation would continue with full React template)
}

async function createVueTemplate(projectPath: string, variables: Record<string, string>) {
  // Vue template implementation
}

async function createNextTemplate(projectPath: string, variables: Record<string, string>) {
  // Next.js template implementation
}
