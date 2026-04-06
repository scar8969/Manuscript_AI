#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const backendDir = resolve(root, 'backend');
const frontendDir = resolve(root, 'frontend');

const REQUIRED_ENV = [
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
  'DATABASE_URL',
  'OPENROUTER_API_KEY'
];

function checkEnv() {
  const envPath = resolve(backendDir, '.env');
  if (!existsSync(envPath)) {
    console.log('\n  No backend/.env found. Creating from template...');
    const template = readFileSync(resolve(backendDir, '.env.example'), 'utf-8');
    // In a real npx flow, this would be more sophisticated
    console.log('  Please fill in backend/.env with your values.');
    console.log('  Required variables:', REQUIRED_ENV.join(', '));
    process.exit(1);
  }

  const env = readFileSync(envPath, 'utf-8');
  const missing = REQUIRED_ENV.filter(v => {
    const match = env.match(new RegExp(`^${v}=(.+)$`, 'm'));
    return !match || match[1].trim() === '' || match[1].includes('your-');
  });

  if (missing.length > 0) {
    console.log('\n  Missing or unset environment variables in backend/.env:');
    missing.forEach(v => console.log(`    - ${v}`));
    console.log('\n  Generate secrets with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    process.exit(1);
  }
}

function runCommand(cmd, cwd, label) {
  console.log(`\n  [${label}] $ ${cmd}`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
  } catch (err) {
    console.error(`  [${label}] Failed`);
    process.exit(1);
  }
}

function runDev(args) {
  const mode = args[0] || 'full';

  if (mode === 'frontend') {
    const child = spawn('npm', ['run', 'dev'], {
      cwd: frontendDir,
      stdio: 'inherit',
      shell: true
    });
    child.on('exit', process.exit);
  } else if (mode === 'backend') {
    const child = spawn('npm', ['run', 'dev'], {
      cwd: backendDir,
      stdio: 'inherit',
      shell: true
    });
    child.on('exit', process.exit);
  } else {
    // Run both
    const frontend = spawn('npm', ['run', 'dev'], {
      cwd: frontendDir,
      stdio: 'inherit',
      shell: true
    });
    const backend = spawn('npm', ['run', 'dev'], {
      cwd: backendDir,
      stdio: 'inherit',
      shell: true
    });
    frontend.on('exit', () => backend.kill());
    backend.on('exit', () => frontend.kill());
  }
}

// Main
const command = process.argv[2] || 'dev';

switch (command) {
  case 'dev':
    checkEnv();
    console.log('\n  Manuscript AI - Starting development servers...\n');
    runDev(process.argv.slice(3));
    break;

  case 'setup':
    console.log('\n  Manuscript AI - Setup\n');
    runCommand('npm install', root, 'root');
    runCommand('npm install', frontendDir, 'frontend');
    runCommand('npm install', backendDir, 'backend');
    runCommand('npx prisma generate', backendDir, 'prisma generate');
    console.log('\n  Setup complete! Run "manuscript-ai dev" to start.\n');
    break;

  case 'migrate':
    runCommand('npx prisma migrate deploy', backendDir, 'db migrate');
    break;

  case 'build':
    runCommand('npm run build', frontendDir, 'build frontend');
    break;

  default:
    console.log(`
  Manuscript AI - AI-powered LaTeX Resume Editor

  Usage:
    manuscript-ai dev [frontend|backend]  Start development servers
    manuscript-ai setup                  Install all dependencies
    manuscript-ai migrate                Run database migrations
    manuscript-ai build                  Build frontend for production
`);
    process.exit(0);
}
