const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('[CivicAid] Building frontend for production deployment...');

const frontendDir = path.join(__dirname, '..', 'frontend');
const rootDist = path.join(__dirname, '..', 'dist');
const frontendDist = path.join(frontendDir, 'dist');

// 1. Install frontend dependencies
console.log('[CivicAid] Installing frontend packages in frontend/...');
execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });

// 2. Build Vite React bundle
console.log('[CivicAid] Compiling Vite production bundle...');
execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

// 3. Mirror dist to root so Render finds it regardless of Publish Directory setting
if (fs.existsSync(frontendDist)) {
  console.log('[CivicAid] Copying dist bundle to root ./dist for universal Render compatibility...');
  if (fs.existsSync(rootDist)) {
    fs.rmSync(rootDist, { recursive: true, force: true });
  }
  fs.cpSync(frontendDist, rootDist, { recursive: true });
  console.log('[CivicAid] Frontend build complete! Dist available at ./dist and ./frontend/dist');
} else {
  console.error('[CivicAid] Error: frontend/dist was not generated!');
  process.exit(1);
}
