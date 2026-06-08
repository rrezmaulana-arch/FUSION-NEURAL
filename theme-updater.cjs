const fs = require('fs');
const path = require('path');

const DASHBOARDS_DIR = path.join(__dirname, 'frontend/src/pages/dashboards');

const REPLACEMENTS = [
  // Container Backgrounds & Borders
  { from: /bg-white rounded-([a-zA-Z0-9]+)\s+p-6\s+border\s+border-slate-100\s+shadow-sm/g, to: 'bg-white/[0.03] backdrop-blur-xl rounded-$1 p-6 border border-white/10 shadow-sm' },
  { from: /bg-white rounded-([a-zA-Z0-9]+)\s+border\s+border-slate-100/g, to: 'bg-white/[0.03] backdrop-blur-xl rounded-$1 border border-white/10' },
  { from: /bg-slate-50 rounded-([a-zA-Z0-9]+)/g, to: 'bg-white/[0.02] backdrop-blur-md rounded-$1' },
  { from: /bg-slate-50/g, to: 'bg-black/20' },
  { from: /border-slate-100/g, to: 'border-white/10' },
  { from: /border-slate-200/g, to: 'border-white/20' },

  // Text Colors
  { from: /text-slate-800/g, to: 'text-slate-100' },
  { from: /text-slate-700/g, to: 'text-slate-200' },
  { from: /text-slate-600/g, to: 'text-slate-300' },
  { from: /text-slate-500/g, to: 'text-slate-400' },

  // Tables
  { from: /bg-slate-50 border-b border-slate-200/g, to: 'bg-white/[0.02] border-b border-white/10' },
  { from: /border-b border-slate-100/g, to: 'border-b border-white/10' },
  { from: /hover:bg-slate-50/g, to: 'hover:bg-white/[0.02]' },

  // Forms & Inputs
  { from: /bg-white border border-slate-200/g, to: 'bg-black/20 border border-white/10' },
  { from: /focus:ring-([a-zA-Z]+)-300/g, to: 'focus:ring-$1-500/50' },
  
  // Specific Buttons
  { from: /bg-slate-100 hover:bg-slate-200/g, to: 'bg-white/5 hover:bg-white/10' },
  { from: /bg-slate-100 text-slate-600/g, to: 'bg-white/5 text-slate-300' },
  
  // Clean up any double replacements (just in case)
  { from: /text-slate-4000/g, to: 'text-slate-400' },
  
  // Header text - keep some contrast
  { from: /font-bold text-slate-400/g, to: 'font-bold text-slate-300' },
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
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(DASHBOARDS_DIR);
console.log('Done replacing theme classes!');
