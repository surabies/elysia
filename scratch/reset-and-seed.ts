import { execSync } from 'child_process';
import path from 'path';

process.env.ALLOW_RESET_DB = 'neondb';
process.env.FORCE_CLEAN_OPEN_READINGS = 'true';
process.env.ALLOW_SEED_DB = 'neondb';
process.env.FORCE_SEED_OVER_OPEN_READINGS = 'true';

const dbDir = path.resolve(__dirname, '../packages/db');

console.log('====================================================');
console.log('1. MENJALANKAN BERSIHKAN DATABASE (CLEAN DATA)...');
console.log('====================================================');
execSync('bun run src/clean.ts', {
  cwd: dbDir,
  stdio: 'inherit',
  env: process.env,
});

console.log('\n====================================================');
console.log('2. MENJALANKAN SEEDING MASTER & PERIODE AWAL (SEED)...');
console.log('====================================================');
execSync('bun run src/seed.ts', {
  cwd: dbDir,
  stdio: 'inherit',
  env: process.env,
});

console.log('\n====================================================');
console.log('3. MENYINKRONKAN AKUN PENGGUNA (SEED ACCOUNTS)...');
console.log('====================================================');
execSync('bun run src/seed-accounts.ts', {
  cwd: dbDir,
  stdio: 'inherit',
  env: process.env,
});

console.log('\n====================================================');
console.log('RESET DAN SEED ULANG SELESAI!');
console.log('====================================================');
