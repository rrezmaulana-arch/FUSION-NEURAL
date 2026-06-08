const fs = require('fs');
const path = require('path');

const DASHBOARDS_DIR = path.join(__dirname, 'frontend/src/pages/dashboards');

const REPLACEMENTS = [
  // General light mode containers
  { from: /className="([^"]*)bg-white\s+([^"]*)"/g, to: 'className="$1bg-white/[0.03] backdrop-blur-xl border-white/10 text-slate-100 $2"' },
  { from: /className="([^"]*)bg-slate-50\s+([^"]*)"/g, to: 'className="$1bg-white/[0.02] backdrop-blur-md border-white/10 text-slate-200 $2"' },
  
  // Clean up duplicate borders
  { from: /border-white\/10([^"]*)border-white\/20/g, to: 'border-white/10$1' },
  { from: /border-white\/10([^"]*)border-white\/10/g, to: 'border-white/10$1' },
  
  // Specific remaining borders
  { from: /border-slate-100/g, to: 'border-white/10' },
  { from: /border-slate-200/g, to: 'border-white/20' },
  { from: /border-purple-200/g, to: 'border-purple-500/20' },

  // Remaining light text colors
  { from: /text-slate-800/g, to: 'text-slate-100' },
  { from: /text-slate-700/g, to: 'text-slate-200' },
  { from: /text-slate-600/g, to: 'text-slate-300' },
  { from: /text-slate-500/g, to: 'text-slate-400' },
  
  // Form elements inside containers
  { from: /bg-white border/g, to: 'bg-black/20 border' },
  { from: /bg-white\/90/g, to: 'bg-white/10' }
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
console.log('Done replacing additional theme classes!');
