import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if dist/web exists
const distPath = path.join(__dirname, 'dist', 'web');
if (!fs.existsSync(distPath)) {
    console.error('❌ dist/web folder not found!');
    console.error('Make sure you have the extracted app files in the correct location.');
    process.exit(1);
}

const indexPath = path.join(distPath, 'index.html');
const assetsPath = path.join(distPath, 'assets');

// Patch index.html
if (fs.existsSync(indexPath)) {
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    indexContent = indexContent.replace(/Dizi Print Studio/g, 'AM Comp');
    indexContent = indexContent.replace(/Dizi Studio/g, 'AM Comp');
    indexContent = indexContent.replace(/Dizi/g, 'AM');
    fs.writeFileSync(indexPath, indexContent);
    console.log('✓ Patched index.html');
} else {
    console.log('⚠ index.html not found, skipping');
}

// Patch JavaScript files
if (fs.existsSync(assetsPath)) {
    const jsFiles = fs.readdirSync(assetsPath).filter(f => f.endsWith('.js'));
    
    for (const jsFile of jsFiles) {
        const jsPath = path.join(assetsPath, jsFile);
        let content = fs.readFileSync(jsPath, 'utf8');
        let modified = false;
        
        // Replace branding text
        if (content.includes('Dizi')) {
            content = content.replace(/Dizi Print Studio/g, 'AM Comp');
            content = content.replace(/Dizi Studio/g, 'AM Comp');
            content = content.replace(/Dizi/g, 'AM');
            modified = true;
        }
        
        // Remove license check references
        if (content.includes('getMachineId') || content.includes('checkLicense')) {
            content = content.replace(/electronAPI\.getMachineId\(\)/g, 'Promise.resolve("AMCOMP-DESKTOP")');
            content = content.replace(/electronAPI\.checkLicense\(\)/g, 'Promise.resolve({valid:true})');
            modified = true;
        }
        
        // Remove update-related UI elements
        if (content.includes('update') || content.includes('Update')) {
            content = content.replace(/Update available/gi, '');
            content = content.replace(/update-ready/gi, '');
            content = content.replace(/Downloading update/gi, '');
            modified = true;
        }
        
        if (modified) {
            fs.writeFileSync(jsPath, content);
            console.log(✓ Patched );
        }
    }
} else {
    console.log('⚠ assets folder not found');
}

console.log('\n✅ Frontend patching complete!');
