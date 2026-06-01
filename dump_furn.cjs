const fs = require('fs');
const layout = JSON.parse(fs.readFileSync('frontend/public/assets/pixel-office/default-layout-1.json'));

const furns = layout.furniture;
let html = '<html><body style="font-family:monospace; font-size:12px;">\n';
furns.forEach((f, i) => {
  html += `<div>[ID: ${i}] ${f.type} at (${f.col}, ${f.row})</div>\n`;
});
html += '</body></html>';

fs.writeFileSync('frontend/public/assets/pixel-office/furniture-list.html', html);
console.log('Saved to furniture-list.html');
