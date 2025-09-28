# Contributing to Baseline Buddy

Thank you for your interest in contributing to Baseline Buddy! This guide will help you get started.

## 🚀 Quick Start

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/baseline-buddy.git
   cd baseline-buddy
   ```

2. **Install Dependencies**
   ```bash
   npm install
   npm run install:workspaces
   ```

3. **Development Setup**
   ```bash
   # Test CLI
   node cli/src/index.js test
   
   # Build VS Code extension
   cd vscode-extension && npm run compile
   ```

## 🏗️ Project Structure

```
baseline-buddy/
├── cli/                    # Node.js CLI tool
│   ├── src/               # Source code
│   ├── bin/               # Executable scripts
│   └── templates/         # Project templates
├── vscode-extension/       # VS Code extension
│   ├── src/               # Extension source
│   └── media/             # Icons and assets
├── web-dashboard/          # React dashboard (future)
├── shared/                 # Shared utilities
│   ├── src/               # Shared source code
│   └── types/             # TypeScript definitions
└── templates/              # Project templates
    ├── html/              # HTML templates
    ├── react/             # React templates
    └── vue/               # Vue templates
```

## 🛠️ Development Workflow

### CLI Development
```bash
cd cli
npm run dev -- test                    # Test CLI
npm run dev -- search "grid"           # Test search
npm run dev -- init test-project       # Test project creation
```

### VS Code Extension Development
```bash
cd vscode-extension
npm run compile                        # Compile TypeScript
npm run watch                          # Watch for changes
# Press F5 in VS Code to launch Extension Development Host
```

### Web Dashboard Development (Future)
```bash
cd web-dashboard
npm run dev                            # Start development server
```

## 🧪 Testing

### CLI Testing
```bash
cd cli
npm test                               # Run unit tests
npm run test:integration               # Run integration tests
```

### Extension Testing
```bash
cd vscode-extension
npm test                               # Run extension tests
```

## 📝 Code Style

We use ESLint and Prettier for consistent code formatting:

```bash
npm run lint                           # Check linting
npm run format                         # Format code
```

### Commit Convention
We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build process or auxiliary tool changes

Examples:
```
feat(cli): add deployment command for Netlify
fix(extension): resolve hover provider memory leak
docs: update installation instructions
```

## 🎯 Areas for Contribution

### High Priority
- [ ] Complete CLI template implementations (React, Vue, Next.js)
- [ ] Enhanced feature detection patterns
- [ ] VS Code extension polyfill suggestions
- [ ] Web dashboard implementation
- [ ] Comprehensive test coverage

### Medium Priority
- [ ] Additional deployment platforms (AWS S3, Firebase)
- [ ] Custom rule configuration
- [ ] Integration with popular build tools
- [ ] Performance optimizations
- [ ] Accessibility improvements

### Low Priority
- [ ] Additional IDE extensions (WebStorm, Sublime)
- [ ] Mobile app for compatibility checking
- [ ] Browser extension for real-time analysis
- [ ] Integration with design tools

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment**: OS, Node.js version, VS Code version
2. **Steps to reproduce**: Clear, numbered steps
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Screenshots/logs**: If applicable

Use our [bug report template](.github/ISSUE_TEMPLATE/bug_report.md).

## 💡 Feature Requests

For feature requests, please:

1. Check existing issues first
2. Describe the problem you're solving
3. Explain your proposed solution
4. Consider implementation complexity
5. Think about backward compatibility

Use our [feature request template](.github/ISSUE_TEMPLATE/feature_request.md).

## 🔧 Technical Guidelines

### Adding New Features
1. **Feature Detection**: Add patterns to `shared/src/feature-detector.ts`
2. **Baseline Integration**: Update `shared/src/baseline-analyzer.ts`
3. **CLI Commands**: Add to `cli/src/commands/`
4. **VS Code Integration**: Update `vscode-extension/src/extension.ts`
5. **Documentation**: Update README and relevant docs

### Code Quality
- Write TypeScript with strict mode enabled
- Add JSDoc comments for public APIs
- Include unit tests for new functionality
- Follow existing patterns and conventions
- Ensure accessibility compliance

### Performance Considerations
- Minimize file system operations
- Cache Baseline data appropriately
- Use efficient algorithms for feature detection
- Avoid blocking the main thread in VS Code extension

## 📚 Resources

- [Baseline Documentation](https://web.dev/baseline)
- [web-features npm package](https://www.npmjs.com/package/web-features)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Commander.js Documentation](https://github.com/tj/commander.js)

## 🤝 Community

- **Discussions**: Use GitHub Discussions for questions and ideas
- **Discord**: Join our community server (link coming soon)
- **Twitter**: Follow [@BaselineBuddy](https://twitter.com/BaselineBuddy) for updates

## 📄 License

By contributing to Baseline Buddy, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for helping make modern web features accessible to everyone!** 🚀
