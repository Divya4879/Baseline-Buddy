# 🚀 Baseline Buddy

**AI-powered developer companion that integrates Baseline data to accelerate modern web feature adoption**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-blue)](https://marketplace.visualstudio.com/items?itemName=baseline-buddy.baseline-buddy)

## 🎯 Problem Statement

New web developers face a critical challenge: **they don't know which modern web features are safe to use**. This uncertainty creates a productivity tax where developers either:
- Stick to outdated practices (missing out on modern capabilities)
- Use cutting-edge features that break in production
- Spend hours researching compatibility across multiple sources

## 💡 Solution

Baseline Buddy is a comprehensive developer tooling suite that integrates [Baseline](https://web.dev/baseline/) compatibility data directly into your development workflow, providing:

- **🛠️ Smart CLI scaffolding** with Baseline-optimized templates
- **⚡ Real-time VS Code compatibility warnings** as you type
- **📊 Comprehensive compatibility reports** for your entire project
- **🚀 One-click deployment** with compatibility validation
- **🎓 Educational guidance** to learn modern web standards safely

## 🌟 Key Features

### CLI Tool (`baseline-buddy`)
```bash
# Scaffold projects with Baseline-safe defaults
baseline-buddy init website --template=modern-html
baseline-buddy init react --baseline-level=2024

# Analyze your project's compatibility
baseline-buddy check --output=html --target-browsers="last 2 versions"

# Deploy with confidence
baseline-buddy deploy --platform=netlify --validate-compatibility
```

### VS Code Extension
- **Real-time compatibility hints** while coding
- **Inline warnings** for unsupported features
- **Smart suggestions** for polyfills and alternatives
- **Baseline status indicators** in hover tooltips

## 🚀 Quick Start

### Installation
```bash
npm install -g baseline-buddy
code --install-extension baseline-buddy.baseline-buddy
```

### Create Your First Project
```bash
# Create a modern website with Baseline-safe features
baseline-buddy init my-website --template=modern-html

cd my-website
baseline-buddy check
```

## 🏗️ Architecture

```
baseline-buddy/
├── cli/                    # Node.js CLI tool
├── vscode-extension/       # VS Code extension
├── shared/                 # Shared utilities & types
├── templates/              # Project templates
└── docs/                   # Documentation
```

## 🎥 Demo

[Watch our 3-minute demo video](https://youtu.be/demo-link) showing:
- Project scaffolding with Baseline integration
- Real-time compatibility warnings in VS Code
- Compatibility report generation
- Safe deployment workflow

## 🏆 Hackathon Submission

This project was built for the **Baseline Tooling Hackathon** to demonstrate how Baseline data can be integrated into developer tools to accelerate modern web feature adoption.

### Key Innovation Points:
1. **Beginner-focused approach** - Most tools target experts, we help newcomers
2. **Multi-tool integration** - CLI + VS Code working together
3. **Educational component** - Teaching safe modern web practices
4. **Real-world workflow** - From scaffolding to deployment

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Baseline](https://web.dev/baseline/) team for the compatibility data
- [web-features](https://www.npmjs.com/package/web-features) npm package
- Google's Web Platform Dashboard

---

**Built with ❤️ for the web development community**
# Baseline-Buddy
