// Script to find and replace all mock data imports
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Files we've already deleted
const deletedMockFiles = [
  'mockData.ts',
  'mockUsers.ts',
  'mockMessages.ts', 
  'mockAssessments.ts',
  'mockSubscriptions.ts'
];

// Directory to search in
const rootDir = './src';

// Function to recursively get all .ts, .tsx files
function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      getFiles(filePath, fileList);
    } else if (
      (file.endsWith('.ts') || file.endsWith('.tsx')) && 
      !file.endsWith('.d.ts') && 
      !deletedMockFiles.includes(file)
    ) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Get all TypeScript files
const allFiles = getFiles(rootDir);
console.log(`Found ${allFiles.length} TypeScript files to process`);

// Count of files that were fixed
let fixedFiles = 0;

// Regular expressions for different types of mock data imports
const importPatterns = [
  // Match: import { something } from '@/lib/mockData';
  /import\s+\{[^}]*\}\s+from\s+['"]@\/lib\/(mockData|mockUsers|mockMessages|mockAssessments|mockSubscriptions)['"];?/g,
  
  // Match: import something from '@/lib/mockData';
  /import\s+[^{}\s]+\s+from\s+['"]@\/lib\/(mockData|mockUsers|mockMessages|mockAssessments|mockSubscriptions)['"];?/g,
  
  // Match: import * as something from '@/lib/mockData';
  /import\s+\*\s+as\s+[^\s]+\s+from\s+['"]@\/lib\/(mockData|mockUsers|mockMessages|mockAssessments|mockSubscriptions)['"];?/g,
];

// Process each file
allFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let hasChanged = false;
  
  // Check for and remove each import pattern
  importPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, '// Removed mock data import');
      hasChanged = true;
    }
  });
  
  // Save the file if changes were made
  if (hasChanged) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixedFiles++;
    console.log(`Fixed imports in: ${filePath}`);
  }
});

console.log(`\nCompleted! Fixed ${fixedFiles} files with mock data imports.`); 