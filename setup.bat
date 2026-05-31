@echo off
echo ========================================
echo AM Comp - Setup Script
echo ========================================
echo.

echo [1/5] Removing old dependencies...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul

echo [2/5] Patching package.json...
node -e "const p=require('./package.json');p.name='am-comp';p.description='AM Comp - Open Source';delete p.dependencies['electron-updater'];require('fs').writeFileSync('package.json',JSON.stringify(p,null,2))"

echo [3/5] Installing dependencies...
npm install

echo [4/5] Patching frontend...
node patch-frontend.js

echo [5/5] Building application...
npm install -D electron-builder
npx electron-builder

echo.
echo ========================================
echo Build complete! Check the "dist" folder
echo ========================================