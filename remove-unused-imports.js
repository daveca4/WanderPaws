#!/usr/bin/env node

/**
 * This script removes unused imports from TypeScript/JavaScript files
 * Uses the 'eslint --fix' functionality but with a stricter configuration specifically for unused imports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create a temporary ESLint config with stricter rules for unused imports
const tempEslintConfig = {
  extends: [
    "next/core-web-vitals",
    "next/typescript"
  ],
  rules: {
    // Error on unused vars to ensure they get removed
    "@typescript-eslint/no-unused-vars": "error",
    // Disable other rules to focus only on unused imports
    "@typescript-eslint/no-explicit-any": "off",
    "react/no-unescaped-entities": "off",
    "@next/next/no-img-element": "off"
  }
};

console.log('Creating temporary ESLint config for unused imports cleanup...');
fs.writeFileSync('.eslintrc.unused-imports.json', JSON.stringify(tempEslintConfig, null, 2));

// Run ESLint with --fix option on the entire codebase using the temporary config
console.log('Removing unused imports...');
try {
  execSync('npx eslint --config .eslintrc.unused-imports.json --fix "src/**/*.{js,jsx,ts,tsx}"', { stdio: 'inherit' });
  console.log('Unused imports removed successfully.');
} catch (error) {
  console.error('Unused imports cleanup completed with some errors.');
}

// Clean up the temporary config
fs.unlinkSync('.eslintrc.unused-imports.json');

console.log('Finished removing unused imports.');
console.log('Note: Some imports might still need manual cleanup if the automatic fix could not resolve them.'); 