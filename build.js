import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// For electron-builder (install first: npm install -D electron-builder)
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

packageJson.build = {
  appId: 'com.amcomp.app',
  productName: 'AM Comp',
  copyright: 'Open Source',
  directories: {
    output: 'dist'
  },
  files: [
    'main.js',
    'preload.js',
    'dist/web/**/*',
    'node_modules/**/*'
  ],
  win: {
    target: ['nsis'],
    icon: 'dist/web/favicon.ico'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true
  }
};

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('✓ Updated package.json with build config');

// Build command
console.log('\nBuilding application...');
execSync('npx electron-builder', { stdio: 'inherit' });