const fs = require('fs');
const path = require('path');
const pagesDir = path.join(process.cwd(), 'src/pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/border-white\/20\/20(\/50|\/60)?/g, 'border-white/20');
  content = content.replace(/glass-panel\/50/g, 'glass-panel');
  content = content.replace(/hover:glass-panel/g, 'hover:bg-white/10');
  content = content.replace(/hover:border-white\/20/g, 'hover:border-white/30');
  content = content.replace(/shadow-xl shadow-slate-200\/50/g, 'shadow-xl shadow-black/20');
  
  // Update inputs
  content = content.replace(/glass-panel([^"]*)outline-none focus:border-blue-600/g, 'glass-input$1outline-none focus:border-indigo-500');
  
  // Dashboard background class
  content = content.replace(/bg-transparent text-white/g, 'text-white');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Cleaned', file);
});
