// packages/db/src/scripts/seed-aturan-only.ts
// Menjalankan seeder master aturan anomali & pemetaan TMSS (tanpa backfill)
import { seedAturanAnomali } from '../seeds/modules/10-anomali';

async function main() {
  console.log('Menjalankan seed master aturan anomali SSOT...');
  const res = await seedAturanAnomali.run({});
  console.log('Hasil seeder aturan:', res);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed Aturan Error:', err);
  process.exit(1);
});
