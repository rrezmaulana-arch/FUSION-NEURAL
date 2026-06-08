const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function fixLineComments(content) {
  // Common JS/TS keywords that might follow a squashed comment
  const keywords = ['const ', 'let ', 'var ', 'return ', 'if ', 'else ', 'try ', 'catch ', 'for ', 'while ', 'switch ', 'console\\.', 'export ', 'import ', 'getDocs', 'setDoc', 'updateDoc', 'deleteDoc', 'await ', 'function ', 'set\\[', '\\[', '\\{', '\\}'];
  
  const regexStr = '\\/\\/\\s*(.*?)\\s*(?= ' + keywords.join('| ') + '|\\b' + keywords.join('|\\b') + ')';
  const regex = new RegExp(regexStr, 'g');
  
  // Specifically we know the files were flattened with spaces.
  // We match `// <some text>` and replace it with `/* <some text> */\n`
  // The tricky part is knowing where the comment ends.
  // We assume the comment ends when we see a common keyword like `const`, `return`, `if`, etc. preceded by a space.
  
  let fixed = content.replace(/\/\/\s*(.*?)\s+(?=const |let |return |if |else |try |catch |for |while |switch |console\.|export |import |getDocs|setDoc|updateDoc|deleteDoc|await |function )/g, '/* $1 */\n');
  
  // Also fix `// ... }` or `// ... {` if they were squashed
  fixed = fixed.replace(/\/\/\s*(.*?)\s+(?=\}|\{|\[|\]|\()/g, '/* $1 */\n');

  return fixed;
}

const dir = path.join(__dirname, 'frontend', 'src', 'pages', 'dashboards');

function processDir(d) {
  const entries = fs.readdirSync(d, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(d, entry.name);
    if (entry.isDirectory()) {
      processDir(full);
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      let content = fs.readFileSync(full, 'utf8');
      
      // Only process files that have very few lines (squashed)
      if (content.split('\n').length < 15) {
        console.log(`Fixing comments in ${entry.name}...`);
        const fixed = fixLineComments(content);
        fs.writeFileSync(full, fixed, 'utf8');
        
        try {
          execSync(`npx prettier --write "${full}"`, { cwd: path.join(__dirname, 'frontend'), stdio: 'pipe' });
          console.log(`✅ ${entry.name} formatted successfully!`);
        } catch (e) {
          console.error(`❌ ${entry.name} failed formatting:`, e.stderr ? e.stderr.toString() : e.message);
        }
      }
    }
  }
}

processDir(dir);
