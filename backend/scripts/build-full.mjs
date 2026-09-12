import { execSync } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const frontend = join(root, 'frontend');
const backend = join(root, 'backend');
const publicDir = join(backend, 'public');

console.log('Installing frontend dependencies...');
execSync('npm install', { cwd: frontend, stdio: 'inherit' });

console.log('Building frontend (same-origin API)...');
execSync('npm run build', {
  cwd: frontend,
  stdio: 'inherit',
  env: { ...process.env, VITE_API_URL: '' },
});

console.log('Copying frontend build to backend/public...');
if (existsSync(publicDir)) rmSync(publicDir, { recursive: true });
cpSync(join(frontend, 'dist'), publicDir, { recursive: true });

console.log('Generating Prisma client...');
execSync('npx prisma generate', { cwd: backend, stdio: 'inherit' });

console.log('Building backend...');
execSync('npm run build', { cwd: backend, stdio: 'inherit' });

console.log('Full build complete.');
