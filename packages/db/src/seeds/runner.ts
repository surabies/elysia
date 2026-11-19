import { parseSeedOptions } from './config';
import { SEED_MODULES } from './modules';
import type { SeedOptions, SeedStepResult } from './types';

export async function runDatabaseSeed(customOptions?: Partial<SeedOptions>) {
  const cliOptions = parseSeedOptions();
  const options: SeedOptions = { ...cliOptions, ...customOptions };

  console.log('\n================================================================');
  console.log('       💧 SISTEM DATABASE SEEDER - PDAM CATER MONOREPO 💧       ');
  console.log('================================================================');
  console.log(`Konfigurasi & Mode:`);
  console.log(` - Mode:          ${options.quick ? '⚡ QUICK (Data Sample Terbatas)' : '🚀 FULL (Data Produksi Lengkap)'}`);
  console.log(` - Filter Modul:  ${options.only ? options.only.join(', ') : 'Semua (10 Modul Terkoordinasi)'}`);
  if (options.skip) console.log(` - Skip Modul:    ${options.skip.join(', ')}`);
  if (options.limit) console.log(` - Limit Pelanggan: ${options.limit.toLocaleString()} baris`);
  if (options.pipaLimit) console.log(` - Limit Pipa GIS:  ${options.pipaLimit.toLocaleString()} segmen`);
  console.log('----------------------------------------------------------------\n');

  const selectedModules = SEED_MODULES.filter((m) => {
    if (options.only && !options.only.includes(m.id)) {
      return false;
    }
    if (options.skip && options.skip.includes(m.id)) {
      return false;
    }
    return true;
  });

  const results: SeedStepResult[] = [];
  const overallStartTime = Date.now();

  for (let idx = 0; idx < selectedModules.length; idx++) {
    const mod = selectedModules[idx];
    const stepNumber = `[${idx + 1}/${selectedModules.length}]`;
    console.log(`${stepNumber} Menjalankan: ${mod.name}...`);
    console.log(`    ℹ️  ${mod.description}`);

    const startTime = Date.now();
    try {
      const res = await mod.run(options);
      const durationMs = Date.now() - startTime;
      console.log(`    ✓ ${res.message || 'Selesai'} (${(durationMs / 1000).toFixed(2)}s)\n`);

      results.push({
        id: mod.id,
        name: mod.name,
        success: true,
        count: res.count,
        message: res.message,
        durationMs,
      });
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      console.error(`    ❌ Gagal pada modul [${mod.id}]:`, err?.message || err);
      console.error(err);
      console.log('');

      results.push({
        id: mod.id,
        name: mod.name,
        success: false,
        durationMs,
        error: err,
      });

      // Abort execution on critical auth or schema errors
      if (mod.id === 'accounts' || mod.id === 'kondisi') {
        console.error(`\n🚨 Modul fundamental '${mod.name}' gagal. Menghentikan proses seeding untuk menjaga konsistensi database.`);
        break;
      }
    }
  }

  const totalDurationSec = ((Date.now() - overallStartTime) / 1000).toFixed(2);
  const totalSuccess = results.filter((r) => r.success).length;
  const totalFailed = results.filter((r) => !r.success).length;

  console.log('================================================================');
  console.log('                     RINGKASAN EKSEKUSI SEED                    ');
  console.log('================================================================');
  console.log(
    '| ID Modul         | Status     | Durasi   | Keterangan'
  );
  console.log(
    '|------------------|------------|----------|-----------------------------'
  );
  for (const r of results) {
    const statusStr = r.success ? '✅ SUKSES' : '❌ GAGAL';
    const durStr = `${(r.durationMs / 1000).toFixed(2)}s`.padEnd(8);
    const idStr = r.id.padEnd(16);
    const msg = r.message ? r.message.slice(0, 32) : r.error ? String(r.error).slice(0, 32) : '-';
    console.log(`| ${idStr} | ${statusStr.padEnd(10)} | ${durStr} | ${msg}`);
  }
  console.log('----------------------------------------------------------------');
  console.log(`Total: ${selectedModules.length} Modul | Sukses: ${totalSuccess} | Gagal: ${totalFailed} | Waktu: ${totalDurationSec} detik`);
  console.log('================================================================\n');

  if (totalFailed > 0) {
    console.error('⚠️ Seeding selesai dengan beberapa modul mengalami kegagalan. Periksa log di atas.');
    return { success: false, results, totalDurationSec };
  } else {
    console.log('🎉 SELURUH DATA AWAL BERHASIL DITATA & DISINKRONKAN KE DATABASE!');
    return { success: true, results, totalDurationSec };
  }
}

// Support direct run
if (import.meta.main) {
  runDatabaseSeed()
    .then((res) => {
      process.exit(res.success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal Seeder Error:', err);
      process.exit(1);
    });
}
