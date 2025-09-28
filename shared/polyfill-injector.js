const POLYFILLS = {
  'Promise': 'https://cdn.jsdelivr.net/npm/es6-promise@4/dist/es6-promise.auto.min.js',
  'fetch': 'https://cdn.jsdelivr.net/npm/whatwg-fetch@3.6.2/dist/fetch.umd.js',
  'IntersectionObserver': 'https://cdn.jsdelivr.net/npm/intersection-observer@0.12.0/intersection-observer.js',
  'Array.from': 'https://cdn.jsdelivr.net/npm/core-js@3/features/array/from.js'
};

function injectPolyfills(htmlContent, targetBrowsers = ['ie 11']) {
  const needed = detectNeededPolyfills(htmlContent, targetBrowsers);
  const scripts = needed.map(name => 
    `<script src="${POLYFILLS[name]}" crossorigin></script>`
  ).join('\n  ');
  
  return htmlContent.replace(
    '</head>',
    `  ${scripts}\n</head>`
  );
}

function detectNeededPolyfills(content, browsers) {
  const needed = [];
  if (content.includes('fetch(') && browsers.includes('ie 11')) needed.push('fetch');
  if (content.includes('Promise') && browsers.includes('ie 11')) needed.push('Promise');
  if (content.includes('IntersectionObserver') && browsers.includes('ie 11')) needed.push('IntersectionObserver');
  return needed;
}

module.exports = { injectPolyfills };
