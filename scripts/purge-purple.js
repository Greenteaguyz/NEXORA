const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function getAllFiles(dir, exts, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllFiles(filePath, exts, fileList);
    } else if (exts.includes(path.extname(file))) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const replacements = [
  // RGBA Purple to Steam Cyan / Navy / Light Blue
  { from: /rgba\(\s*124\s*,\s*58\s*,\s*237\s*,/g, to: 'rgba(102, 192, 244,' },
  { from: /rgba\(\s*139\s*,\s*92\s*,\s*246\s*,/g, to: 'rgba(102, 192, 244,' },
  { from: /rgba\(\s*167\s*,\s*139\s*,\s*250\s*,/g, to: 'rgba(102, 192, 244,' },
  { from: /rgba\(\s*109\s*,\s*40\s*,\s*217\s*,/g, to: 'rgba(0, 120, 212,' },

  // Hex Purple to Steam Cyan / Lime Green / Steam Navy
  { from: /#7C3AED/g, to: '#75B022' },
  { from: /#7c3aed/g, to: '#75b022' },
  { from: /#8B5CF6/g, to: '#66C0F4' },
  { from: /#8b5cf6/g, to: '#66c0f4' },
  { from: /#A78BFA/g, to: '#66C0F4' },
  { from: /#a78bfa/g, to: '#66c0f4' },
  { from: /#6D28D9/g, to: '#0078D4' },
  { from: /#6d28d9/g, to: '#0078d4' },
  { from: /#C4B5FD/g, to: '#C7D5E0' },
  { from: /#c4b5fd/g, to: '#c7d5e0' },
  { from: /#4C1D95/g, to: '#558B2F' },
  { from: /#4c1d95/g, to: '#558b2f' },
  { from: /#5B21B6/g, to: '#005A9E' },
  { from: /#5b21b6/g, to: '#005a9e' },
  { from: /#3B0764/g, to: '#1B2838' },
  { from: /#3b0764/g, to: '#1b2838' }
];

const targetFiles = getAllFiles(srcDir, ['.css', '.html', '.ts', '.svg']);
let totalModified = 0;

for (const filePath of targetFiles) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  for (const { from, to } of replacements) {
    content = content.replace(from, to);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[PURGED PURPLE] -> ${path.relative(srcDir, filePath)}`);
    totalModified++;
  }
}

console.log(`\nPURGE COMPLETE: ${totalModified} files updated to Steam Design Tokens.`);
