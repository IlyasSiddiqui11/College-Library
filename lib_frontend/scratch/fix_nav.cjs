const fs = require('fs');
const path = require('path');

const pagesDir = 'c:/Users/princ/OneDrive/Desktop/library/College-Library/lib_frontend/src/pages';
const filesToProcess = [
  'BorrowHistory.jsx',
  'StaffDashboard.jsx',
  'StaffProfile.jsx',
  'StudentCatalog.jsx',
  'StudentDashboard.jsx',
  'StudentFines.jsx',
  'StudentProfile.jsx'
];

filesToProcess.forEach(fileName => {
  const filePath = path.join(pagesDir, fileName);
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex to match the entire <nav ...> ... </nav> block
  const navRegex = /<nav\s+className="fixed bottom-4[\s\S]*?<\/nav>/;
  
  if (navRegex.test(content)) {
    content = content.replace(navRegex, '<BottomNav />');
    
    // Add import statement at the top if it doesn't exist
    if (!content.includes('BottomNav')) {
      const importStatement = `import BottomNav from '../components/BottomNav.jsx';\n`;
      // Find the last import line
      const importRegex = /import .* from '.*';?\n/g;
      let lastMatch;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        lastMatch = match;
      }
      
      if (lastMatch) {
        const insertIndex = lastMatch.index + lastMatch[0].length;
        content = content.slice(0, insertIndex) + importStatement + content.slice(insertIndex);
      } else {
        content = importStatement + content;
      }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Processed ${fileName}`);
  } else {
    console.log(`No nav found in ${fileName}`);
  }
});
