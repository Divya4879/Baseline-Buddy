"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const web_features_1 = require("web-features");
// Feature detection patterns
const CSS_PATTERNS = new Map([
    ['css-grid', /display:\s*grid/gi],
    ['css-flexbox', /display:\s*flex/gi],
    ['css-custom-properties', /var\s*\(/gi],
    ['css-has', /:has\s*\(/gi],
    ['css-container-queries', /@container\s+/gi],
    ['css-cascade-layers', /@layer\s+/gi],
]);
const JS_PATTERNS = new Map([
    ['arrow-functions', /=>\s*{?/gi],
    ['template-literals', /`.*\${.*}.*`/gi],
    ['destructuring', /\{.*\}\s*=/gi],
    ['optional-chaining', /\?\./gi],
    ['nullish-coalescing', /\?\?/gi],
]);
function activate(context) {
    console.log('🚀 Baseline Buddy extension is now active!');
    // Register hover provider for CSS and JavaScript files
    const cssHoverProvider = vscode.languages.registerHoverProvider(['css', 'scss', 'sass', 'less'], new BaselineHoverProvider('css'));
    const jsHoverProvider = vscode.languages.registerHoverProvider(['javascript', 'typescript', 'javascriptreact', 'typescriptreact'], new BaselineHoverProvider('js'));
    // Register diagnostic provider for real-time warnings
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('baseline-buddy');
    const diagnosticProvider = new BaselineDiagnosticProvider(diagnosticCollection);
    // Watch for document changes
    const documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
        diagnosticProvider.updateDiagnostics(event.document);
    });
    const documentOpenListener = vscode.workspace.onDidOpenTextDocument((document) => {
        diagnosticProvider.updateDiagnostics(document);
    });
    // Register commands
    const checkCompatibilityCommand = vscode.commands.registerCommand('baseline-buddy.checkCompatibility', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            checkDocumentCompatibility(editor.document);
        }
        else {
            vscode.window.showInformationMessage('No active editor found');
        }
    });
    const generateReportCommand = vscode.commands.registerCommand('baseline-buddy.generateReport', () => {
        generateCompatibilityReport();
    });
    // Add to subscriptions
    context.subscriptions.push(cssHoverProvider, jsHoverProvider, diagnosticCollection, documentChangeListener, documentOpenListener, checkCompatibilityCommand, generateReportCommand);
    // Show welcome message
    vscode.window.showInformationMessage('🚀 Baseline Buddy is ready! Hover over CSS/JS features for compatibility info.', 'Learn More').then(selection => {
        if (selection === 'Learn More') {
            vscode.env.openExternal(vscode.Uri.parse('https://web.dev/baseline'));
        }
    });
}
class BaselineHoverProvider {
    constructor(language) {
        this.language = language;
    }
    provideHover(document, position, token) {
        const line = document.lineAt(position);
        const text = line.text;
        const patterns = this.language === 'css' ? CSS_PATTERNS : JS_PATTERNS;
        for (const [featureId, pattern] of patterns) {
            if (pattern.test(text)) {
                const feature = web_features_1.features[featureId];
                if (feature) {
                    return this.createHover(feature, featureId);
                }
            }
        }
        return null;
    }
    createHover(feature, featureId) {
        const baseline = feature.status?.baseline;
        let statusText = '';
        let statusIcon = '';
        if (baseline?.status === 'high') {
            statusIcon = '✅';
            statusText = 'Widely available (Baseline high)';
        }
        else if (baseline?.status === 'low') {
            statusIcon = '🟡';
            statusText = `Newly available (Baseline low since ${baseline.low_date || 'unknown'})`;
        }
        else {
            statusIcon = '🔴';
            statusText = 'Not yet Baseline - use with caution';
        }
        const markdown = new vscode.MarkdownString();
        markdown.isTrusted = true;
        markdown.appendMarkdown(`### ${statusIcon} ${feature.name}\n\n`);
        markdown.appendMarkdown(`**Status:** ${statusText}\n\n`);
        if (feature.description) {
            markdown.appendMarkdown(`${feature.description}\n\n`);
        }
        // Browser support
        if (feature.status?.support) {
            markdown.appendMarkdown(`**Browser Support:**\n`);
            Object.entries(feature.status.support).forEach(([browser, version]) => {
                if (version) {
                    const browserIcon = this.getBrowserIcon(browser);
                    markdown.appendMarkdown(`- ${browserIcon} ${browser}: ${version}+\n`);
                }
            });
            markdown.appendMarkdown('\n');
        }
        // Recommendations
        if (baseline?.status === false) {
            markdown.appendMarkdown(`**💡 Recommendation:** Consider using a polyfill or alternative approach for broader browser support.\n\n`);
        }
        else if (baseline?.status === 'low') {
            markdown.appendMarkdown(`**💡 Recommendation:** Safe to use with modern browser targets. Consider feature detection for older browsers.\n\n`);
        }
        else {
            markdown.appendMarkdown(`**💡 Recommendation:** Safe to use in production!\n\n`);
        }
        markdown.appendMarkdown(`[Learn more about Baseline](https://web.dev/baseline) | [View on Can I Use](https://caniuse.com/${feature.caniuse || featureId})`);
        return new vscode.Hover(markdown);
    }
    getBrowserIcon(browser) {
        const icons = {
            chrome: '🟢',
            firefox: '🟠',
            safari: '🔵',
            edge: '🟦'
        };
        return icons[browser.toLowerCase()] || '⚪';
    }
}
class BaselineDiagnosticProvider {
    constructor(diagnosticCollection) {
        this.diagnosticCollection = diagnosticCollection;
    }
    updateDiagnostics(document) {
        if (!this.isWebFile(document)) {
            return;
        }
        const diagnostics = [];
        const text = document.getText();
        const lines = text.split('\n');
        const patterns = document.languageId.includes('css') ? CSS_PATTERNS : JS_PATTERNS;
        lines.forEach((line, lineIndex) => {
            for (const [featureId, pattern] of patterns) {
                const matches = Array.from(line.matchAll(pattern));
                matches.forEach(match => {
                    const feature = web_features_1.features[featureId];
                    if (feature && feature.status?.baseline?.status === false) {
                        const startPos = new vscode.Position(lineIndex, match.index || 0);
                        const endPos = new vscode.Position(lineIndex, (match.index || 0) + match[0].length);
                        const range = new vscode.Range(startPos, endPos);
                        const diagnostic = new vscode.Diagnostic(range, `${feature.name} is not yet Baseline - consider alternatives or polyfills`, vscode.DiagnosticSeverity.Warning);
                        diagnostic.source = 'Baseline Buddy';
                        diagnostic.code = featureId;
                        diagnostics.push(diagnostic);
                    }
                });
            }
        });
        this.diagnosticCollection.set(document.uri, diagnostics);
    }
    isWebFile(document) {
        const webLanguages = ['css', 'scss', 'sass', 'less', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'html'];
        return webLanguages.includes(document.languageId);
    }
}
function checkDocumentCompatibility(document) {
    const text = document.getText();
    const detectedFeatures = [];
    // Detect features in the document
    const allPatterns = new Map([...CSS_PATTERNS, ...JS_PATTERNS]);
    for (const [featureId, pattern] of allPatterns) {
        if (pattern.test(text)) {
            detectedFeatures.push(featureId);
        }
    }
    if (detectedFeatures.length === 0) {
        vscode.window.showInformationMessage('No Baseline features detected in this document.');
        return;
    }
    // Analyze features
    let safeCount = 0;
    let cautionCount = 0;
    let avoidCount = 0;
    detectedFeatures.forEach(featureId => {
        const feature = web_features_1.features[featureId];
        if (feature) {
            const status = feature.status?.baseline?.status;
            if (status === 'high')
                safeCount++;
            else if (status === 'low')
                cautionCount++;
            else
                avoidCount++;
        }
    });
    const total = detectedFeatures.length;
    const score = Math.round((safeCount / total) * 100);
    vscode.window.showInformationMessage(`Baseline Score: ${score}% (${safeCount} safe, ${cautionCount} caution, ${avoidCount} avoid)`, 'View Details').then(selection => {
        if (selection === 'View Details') {
            showDetailedReport(detectedFeatures);
        }
    });
}
function showDetailedReport(features) {
    const panel = vscode.window.createWebviewPanel('baselineReport', 'Baseline Compatibility Report', vscode.ViewColumn.One, { enableScripts: true });
    panel.webview.html = generateReportHTML(features);
}
function generateReportHTML(detectedFeatures) {
    let featuresHTML = '';
    detectedFeatures.forEach(featureId => {
        const feature = web_features_1.features[featureId];
        if (feature) {
            const status = feature.status?.baseline?.status;
            const statusIcon = status === 'high' ? '✅' : status === 'low' ? '🟡' : '🔴';
            const statusText = status === 'high' ? 'Safe' : status === 'low' ? 'Caution' : 'Avoid';
            const statusColor = status === 'high' ? '#22c55e' : status === 'low' ? '#f59e0b' : '#ef4444';
            featuresHTML += `
        <div style="border-left: 4px solid ${statusColor}; padding: 15px; margin: 10px 0; background: ${statusColor}10;">
          <h3>${statusIcon} ${feature.name}</h3>
          <p><strong>Status:</strong> ${statusText}</p>
          <p>${feature.description || 'No description available'}</p>
        </div>
      `;
        }
    });
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Baseline Compatibility Report</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
            h1 { color: #3b82f6; }
            .summary { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <h1>🚀 Baseline Compatibility Report</h1>
        <div class="summary">
            <p>Found ${detectedFeatures.length} features in your document.</p>
        </div>
        ${featuresHTML}
        <p><em>Generated by Baseline Buddy - Making modern web features accessible</em></p>
    </body>
    </html>
  `;
}
function generateCompatibilityReport() {
    vscode.window.showInformationMessage('Generating workspace compatibility report...', 'Generate').then(selection => {
        if (selection === 'Generate') {
            vscode.window.showInformationMessage('Full workspace analysis coming soon! Use the CLI: baseline-buddy check');
        }
    });
}
function deactivate() {
    console.log('👋 Baseline Buddy extension deactivated');
}
//# sourceMappingURL=extension.js.map