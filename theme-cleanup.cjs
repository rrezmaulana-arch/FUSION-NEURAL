const fs = require('fs');
const path = require('path');

const DASHBOARDS_DIR = path.join(__dirname, 'frontend/src/pages/dashboards');

const REPLACEMENTS = [
  // Cleanup artifacts from regex
  { from: /border\s+border\s/g, to: 'border ' },
  { from: /border\s+rounded-/g, to: 'rounded-' },
  { from: /shadow-sm\s+border\s+/g, to: 'shadow-sm ' },
  { from: /text-slate-100\s+text-slate-200/g, to: 'text-slate-200' },
  { from: /text-slate-100\s+text-slate-100/g, to: 'text-slate-100' },
  { from: /text-slate-200\s+text-slate-200/g, to: 'text-slate-200' },
  { from: /bg-white\/\[0\.03\] backdrop-blur-xl\s+bg-white\/\[0\.03\]/g, to: 'bg-white/[0.03] backdrop-blur-xl' },
  { from: /bg-white\/\[0\.02\] backdrop-blur-md\s+bg-white\/\[0\.02\]/g, to: 'bg-white/[0.02] backdrop-blur-md' },
  { from: /\s\s+/g, to: ' ' }, // collapse multiple spaces
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const rule of REPLACEMENTS) {
        content = content.replace(rule.from, rule.to);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Cleaned up: ${fullPath}`);
      }
    }
  }
}

processDirectory(DASHBOARDS_DIR);
console.log('Cleanup complete!');
