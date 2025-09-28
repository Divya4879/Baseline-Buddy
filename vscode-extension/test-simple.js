// Simple test to verify extension compilation
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing VS Code Extension Compilation...');

// Check if extension compiled
const extensionPath = path.join(__dirname, 'out', 'extension.js');
if (!fs.existsSync(extensionPath)) {
  console.error('❌ Extension not compiled');
  process.exit(1);
}

console.log('✅ Extension compiled successfully');

// Check extension size
const stats = fs.statSync(extensionPath);
console.log(`📦 Extension size: ${Math.round(stats.size / 1024)}KB`);

// Check if it contains key functionality
const extensionCode = fs.readFileSync(extensionPath, 'utf8');

const checks = [
  { name: 'Baseline data integration', pattern: /web-features/ },
  { name: 'Hover provider', pattern: /registerHoverProvider/ },
  { name: 'Diagnostic collection', pattern: /createDiagnosticCollection/ },
  { name: 'Command registration', pattern: /registerCommand/ },
  { name: 'Feature patterns', pattern: /display.*grid|display.*flex/ }
];

console.log('\n🔍 Extension functionality check:');
checks.forEach(check => {
  if (check.pattern.test(extensionCode)) {
    console.log(`✅ ${check.name}`);
  } else {
    console.log(`❌ ${check.name}`);
  }
});

// Check package.json
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

console.log('\n📋 Extension metadata:');
console.log(`  Name: ${packageJson.displayName}`);
console.log(`  Version: ${packageJson.version}`);
console.log(`  Publisher: ${packageJson.publisher}`);
console.log(`  Categories: ${packageJson.categories.join(', ')}`);

// Check activation events
console.log('\n🎯 Activation events:');
packageJson.activationEvents.forEach(event => {
  console.log(`  • ${event}`);
});

// Check commands
console.log('\n⚡ Commands:');
packageJson.contributes.commands.forEach(cmd => {
  console.log(`  • ${cmd.title} (${cmd.command})`);
});

console.log('\n🎉 VS Code Extension verification completed!');
console.log('\n💡 To test in VS Code:');
console.log('  1. Open this folder in VS Code');
console.log('  2. Press F5 to launch Extension Development Host');
console.log('  3. Open a CSS/JS file and hover over features');
console.log('  4. Use Ctrl+Shift+P and search "Baseline Buddy"');
