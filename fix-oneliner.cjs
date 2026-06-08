/**
 * fix-oneliner.cjs
 * Fixes single-line TSX/TS files by adding proper line breaks
 * Uses bracket-aware splitting to preserve TypeScript generics
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function addSmartNewlines(content) {
  let result = '';
  let i = 0;
  const len = content.length;
  
  // Track nesting depths
  let parenDepth = 0;   // ()
  let bracketDepth = 0; // []
  let braceDepth = 0;   // {}
  let angleDepth = 0;   // <> - for generics detection
  let inString = false;
  let stringChar = '';
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;

  while (i < len) {
    const ch = content[i];
    const next = content[i + 1] || '';
    const prev = content[i - 1] || '';

    // Handle comments
    if (!inString && !inBlockComment && ch === '/' && next === '/') {
      inLineComment = true;
    }
    if (inLineComment && ch === '\n') {
      inLineComment = false;
    }
    if (!inString && !inLineComment && ch === '/' && next === '*') {
      inBlockComment = true;
    }
    if (inBlockComment && ch === '*' && next === '/') {
      result += ch + next;
      i += 2;
      inBlockComment = false;
      continue;
    }

    if (inLineComment || inBlockComment) {
      result += ch;
      i++;
      continue;
    }

    // Handle strings
    if (!inString && (ch === '"' || ch === "'" || ch === '`')) {
      inString = true;
      stringChar = ch;
      inTemplate = ch === '`';
      result += ch;
      i++;
      continue;
    }
    if (inString) {
      if (ch === '\\') {
        result += ch + next;
        i += 2;
        continue;
      }
      if (ch === stringChar && (!inTemplate || ch !== '`')) {
        inString = false;
        stringChar = '';
        inTemplate = false;
      }
      result += ch;
      i++;
      continue;
    }

    // Track brackets
    if (ch === '(') parenDepth++;
    if (ch === ')') parenDepth--;
    if (ch === '[') bracketDepth++;
    if (ch === ']') bracketDepth--;
    if (ch === '{') braceDepth++;
    if (ch === '}') { 
      braceDepth--;
      result += ch;
      i++;
      // Add newline after } if at reasonable nesting
      if (parenDepth === 0 && bracketDepth === 0) {
        const lookAhead = content.slice(i).trimStart();
        if (!lookAhead.startsWith('.') && !lookAhead.startsWith(',') && !lookAhead.startsWith(')') && !lookAhead.startsWith(']') && !lookAhead.startsWith(';')) {
          result += '\n';
        }
      }
      continue;
    }

    // Add newlines after semicolons at statement level
    if (ch === ';') {
      result += ch;
      i++;
      if (parenDepth === 0 && bracketDepth === 0) {
        result += '\n';
      }
      continue;
    }

    result += ch;
    i++;
  }

  // Clean up excessive blank lines
  return result.replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

// Find all single-line TSX files
function findSingleLineFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findSingleLineFiles(full));
    } else if ((entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) && !entry.name.endsWith('.d.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n').length;
      if (lines < 15 && content.length > 500) {
        results.push(full);
      }
    }
  }
  return results;
}

const targetDir = path.join(__dirname, 'frontend', 'src', 'pages', 'dashboards');
const files = findSingleLineFiles(targetDir);

console.log(`Found ${files.length} single-line files to fix:\n`);

let fixed = 0;
let failed = 0;

for (const file of files) {
  const relative = path.relative(path.join(__dirname, 'frontend'), file);
  const content = fs.readFileSync(file, 'utf8');
  const linesBefore = content.split('\n').length;
  
  try {
    const fixed_content = addSmartNewlines(content);
    const linesAfter = fixed_content.split('\n').length;
    
    // Backup original
    fs.writeFileSync(file + '.bak', content, 'utf8');
    // Write fixed
    fs.writeFileSync(file, fixed_content, 'utf8');
    
    console.log(`✅ ${path.basename(file)}: ${linesBefore} → ${linesAfter} lines`);
    fixed++;
  } catch (e) {
    console.error(`❌ ${path.basename(file)}: ${e.message}`);
    failed++;
  }
}

console.log(`\nDone: ${fixed} fixed, ${failed} failed`);

// Now run Prettier on fixed files
if (fixed > 0) {
  console.log('\nRunning Prettier...');
  const fileArgs = files
    .map(f => '"' + path.relative(path.join(__dirname, 'frontend'), f).replace(/\\/g, '/') + '"')
    .join(' ');
  
  try {
    const result = execSync(
      `npx prettier --write ${fileArgs}`,
      { cwd: path.join(__dirname, 'frontend'), encoding: 'utf8', stdio: 'pipe' }
    );
    console.log(result);
    console.log('Prettier done!');
  } catch (e) {
    console.log('Prettier output:', e.stdout || '');
    console.error('Prettier errors:', e.stderr || '');
  }
}
