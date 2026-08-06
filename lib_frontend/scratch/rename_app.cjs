const fs = require('fs');
const path = require('path');

const directoryPath = 'c:/Users/princ/OneDrive/Desktop/library/College-Library/lib_frontend';

const replacements = [
  { regex: /BCOE-lib/g, replacement: 'Smart Library' },
  { regex: /BCOE<span/g, replacement: 'Smart <span' },
  { regex: /<span className="bg-gradient-[^"]*">-lib<\/span>/g, replacement: '<span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Library</span>' }, // for cases where it's split
];

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Manual specific replacements for the split names like BCOE<span>-lib</span>
  content = content.replace(/BCOE<span className="bg-gradient-[^"]*">-lib<\/span>/g, 
    'Smart <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Library</span>');
    
  // For the staff admin one with different gradient
  content = content.replace(/BCOE<span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">-lib<\/span>/g, 
    'Smart <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">Library</span>');

  // General replacements
  content = content.replace(/BCOE-lib/g, 'Smart Library');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('dist') && !fullPath.includes('.git')) {
        walkDir(fullPath);
      }
    } else {
      if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.html')) {
        replaceInFile(fullPath);
      }
    }
  }
}

walkDir(directoryPath);
