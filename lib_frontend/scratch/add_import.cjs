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

  if (!content.includes("import BottomNav")) {
    const importStatement = "import BottomNav from '../components/BottomNav.jsx';\n";
    content = importStatement + content;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Added import to ${fileName}`);
  }
});
