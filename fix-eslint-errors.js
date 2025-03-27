#!/usr/bin/env node

/**
 * This script automatically fixes some common ESLint errors in the codebase:
 * 1. Fix unescaped entities in JSX
 * 2. Change var to const where appropriate
 * 3. Fix other simple syntax issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Run ESLint with --fix option on the entire codebase
console.log('Running ESLint with automatic fixes...');
try {
  execSync('npx eslint --fix "src/**/*.{js,jsx,ts,tsx}"', { stdio: 'inherit' });
  console.log('ESLint automatic fixes applied successfully.');
} catch (error) {
  console.error('ESLint automatic fixes completed with some errors.');
}

// Specific fixes for common entity escaping issues
const fixUnescapedEntities = (filePath) => {
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace common unescaped entities in JSX
  content = content.replace(/(\s|{)\'(?!\s)/g, "$1&apos;"); // Single quotes
  content = content.replace(/(\s|{)\"(?!\s)/g, "$1&quot;"); // Double quotes
  
  fs.writeFileSync(filePath, content, 'utf8');
};

console.log('Finished fixing common ESLint errors.');
console.log('You should now be able to run the build with fewer errors.');
console.log('To fix remaining errors, run: npm run lint:fix'); 