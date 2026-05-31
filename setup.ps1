# setup.ps1 - Run this in PowerShell as Administrator
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AM Comp - Windows Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Removing electron-updater from package.json..." -ForegroundColor Yellow
npm pkg delete dependencies.electron-updater

Write-Host "[2/5] Removing old dependencies..." -ForegroundColor Yellow
if (Test-Path node_modules) {
    Remove-Item -Recurse -Force node_modules
    Write-Host "  ✓ Removed node_modules"
}
if (Test-Path package-lock.json) {
    Remove-Item -Force package-lock.json
    Write-Host "  ✓ Removed package-lock.json"
}

Write-Host "[3/5] Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "[4/5] Installing electron-builder..." -ForegroundColor Yellow
npm install --save-dev electron-builder

Write-Host "[5/5] Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run 'node patch-frontend.js' to patch the frontend"
Write-Host "  2. Run 'npm run build' or 'npx electron-builder' to build the app"
Write-Host ""