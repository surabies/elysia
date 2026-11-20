import fs from 'fs';
import readline from 'readline';
import { eq, and, sql, inArray, desc } from 'drizzle-orm';
import { db } from '../client';
import {
  riwayatPemakaianHistoris,
  caterBacaMeter,
  daftarCatat,
  pelanggan,
  masterKondisiCatat,
} from '../schema';
import { getActivePeriode, resolveKondisiCatatWithPriority } from '../carry-forward';

export interface InfolangColumnMapping {
  /** Nama header kolom atau indeks 0-based untuk nomor pelanggan (nolg) */
  nolg: string | number;
  /** Nama header kolom atau indeks 0-based untuk periode THBL (YYYYMM) */
  periode: string | number;
  /** Nama header kolom atau indeks 0-based untuk stand awal */
  standAwal: string | number;
  /** Nama header kolom atau indeks 0-based untuk stand akhir */
  standAkhir: string | number;
  /** Nama header kolom atau indeks 0-based untuk pemakaian ditagih (m3) */
  pakai: string | number;
  /** Opsional: Nama header kolom atau indeks 0-based untuk kode kondisi catat */
  kodeKondisi?: string | number;
  /** Opsional: Nama header kolom atau indeks 0-based untuk nama kondisi catat */
  namaKondisi?: string | number;
  /** Delimiter CSV (default: ';') */
  delimiter?: string;
  /** Apakah baris pertama merupakan header (default: true) */
  hasHeader?: boolean;
}

export const DEFAULT_INFOLANG_COLUMN_MAPPING: InfolangColumnMapping = {
  nolg: 'nolg',
  periode: 'thbl',
  standAwal: 'stml',
  standAkhir: 'stma',
  pakai: 'pakai',
  kodeKondisi: 'tmss',
  namaKondisi: 'ketcatat',
  delimiter: ';',
  hasHeader: true,
};

export interface InfolangRawRow {
  nolg: string;
  periode: string;
  standAwal: number;
  standAkhir: number;
  pakai: number;
  kodeKondisi?: string | null;
  namaKondisi?: string | null;
}

export interface ImportRiwayatInfolangOptions {
  csvPath?: string;
  rows?: InfolangRawRow[];
  columnMapping?: Partial<InfolangColumnMapping>;
  /** Periode DPM berjalan yang akan dihitung ulang akumulasi_taksasi_m3-nya (default: periode aktif di DB) */
  targetPeriodeOpen?: string;
  sumber?: string;
}

export interface ImportRiwayatInfolangResult {
  totalRowsImported: number;
  uniquePelangganImported: number;
  targetPeriodeOpen: string;
  updatedDpmCount: number;
  verifiedByPhysicalReadingCount: number;
  stillNeedsVerificationCount: number;
}

function resolveColIndex(
  colSpec: string | number | undefined,
  headerCols: string[]
): number {
  if (colSpec === undefined) return -1;
  if (typeof colSpec === 'number') return colSpec;
  const target = colSpec.trim().toLowerCase().replace(/^["']|["']$/g, '');
  return headerCols.findIndex(
    (h) => h.trim().toLowerCase().replace(/^["']|["']$/g, '') === target
  );
}

function cleanCsvCell(val: string | undefined): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
}

/**
 * ETL Generik Riwayat Pemakaian 12 Bulan (`infolang`):
 * 1. Menerima file CSV export `infolang` dengan mapping kolom lewat konfigurasi (atau array objek terstruktur).
 * 2. Menyimpan riwayat bulanan ke tabel `riwayat_pemakaian_historis` secara idempoten.
 * 3. Menghitung ulang `akumulasi_taksasi_m3` pada DPM periode berjalan secara kumulatif mundur
 *    sejak pembacaan fisik terakhir (`stand_akhir > stand_awal`).
 * 4. Mengubah `akumulasi_perlu_verifikasi = false` apabila pembacaan fisik terakhir ditemukan di dalam jendela riwayat,
 *    atau tetap `true` apabila seluruh bulan di riwayat merupakan taksasi tanpa satu pun pembacaan fisik.
 */
export async function importRiwayatInfolang(
  options: ImportRiwayatInfolangOptions,
  database: typeof db = db
): Promise<ImportRiwayatInfolangResult> {
  const mapping: InfolangColumnMapping = {
    ...DEFAULT_INFOLANG_COLUMN_MAPPING,
    ...(options.columnMapping || {}),
  };
  const delimiter = mapping.delimiter || ';';
  const hasHeader = mapping.hasHeader !== false;
  const sumber = options.sumber || 'INFOLANG';

  const parsedRows: InfolangRawRow[] = [];

  if (options.rows && options.rows.length > 0) {
    parsedRows.push(...options.rows);
  } else if (options.csvPath) {
    if (!fs.existsSync(options.csvPath)) {
      throw new Error(`File riwayat infolang tidak ditemukan: ${options.csvPath}`);
    }
    const fileStream = fs.createReadStream(options.csvPath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let isFirstLine = true;
    let idxNolg = typeof mapping.nolg === 'number' ? mapping.nolg : -1;
    let idxPeriode = typeof mapping.periode === 'number' ? mapping.periode : -1;
    let idxStandAwal = typeof mapping.standAwal === 'number' ? mapping.standAwal : -1;
    let idxStandAkhir = typeof mapping.standAkhir === 'number' ? mapping.standAkhir : -1;
    let idxPakai = typeof mapping.pakai === 'number' ? mapping.pakai : -1;
    let idxKodeKondisi = typeof mapping.kodeKondisi === 'number' ? mapping.kodeKondisi : -1;
    let idxNamaKondisi = typeof mapping.namaKondisi === 'number' ? mapping.namaKondisi : -1;

    for await (const line of rl) {
      if (!line.trim()) continue;
      const cols = line.split(delimiter);

      if (isFirstLine && hasHeader) {
        isFirstLine = false;
        idxNolg = resolveColIndex(mapping.nolg, cols);
        idxPeriode = resolveColIndex(mapping.periode, cols);
        idxStandAwal = resolveColIndex(mapping.standAwal, cols);
        idxStandAkhir = resolveColIndex(mapping.standAkhir, cols);
        idxPakai = resolveColIndex(mapping.pakai, cols);
        idxKodeKondisi = resolveColIndex(mapping.kodeKondisi, cols);
        idxNamaKondisi = resolveColIndex(mapping.namaKondisi, cols);

        if (idxNolg < 0 || idxPeriode < 0 || idxStandAwal < 0 || idxStandAkhir < 0 || idxPakai < 0) {
          throw new Error(
            `Header CSV infolang tidak sesuai konfigurasi mapping kolom. Ditemukan header: [${cols.join(', ')}]`
          );
        }
        continue;
      }
      isFirstLine = false;

      const nolg = cleanCsvCell(cols[idxNolg]);
      const periode = cleanCsvCell(cols[idxPeriode]);
      if (!nolg || !periode || periode.length !== 6) continue;

      const standAwal = parseFloat(cleanCsvCell(cols[idxStandAwal]).replace(',', '.')) || 0;
      const standAkhir = parseFloat(cleanCsvCell(cols[idxStandAkhir]).replace(',', '.')) || 0;
      const pakai = parseFloat(cleanCsvCell(cols[idxPakai]).replace(',', '.')) || 0;
      const kodeKondisi = idxKodeKondisi >= 0 ? cleanCsvCell(cols[idxKodeKondisi]) : '-';
      const namaKondisi = idxNamaKondisi >= 0 ? cleanCsvCell(cols[idxNamaKondisi]) : 'Normal';

      parsedRows.push({
        nolg,
        periode,
        standAwal,
        standAkhir,
        pakai,
        kodeKondisi,
        namaKondisi,
      });
    }
  } else {
    throw new Error('Wajib menyertakan csvPath atau rows pada importRiwayatInfolang.');
  }

  const targetPeriodeOpen = options.targetPeriodeOpen || (await getActivePeriode(database));

  // Muat kamus kondisi catat & daftar pelanggan terdaftar
  const [kondisiRows, existingPelangganRows] = await Promise.all([
    database
      .select({
        kodeTmss: masterKondisiCatat.kodeTmss,
        nama: masterKondisiCatat.nama,
        modeHitung: masterKondisiCatat.modeHitung,
      })
      .from(masterKondisiCatat),
    database.select({ nolg: pelanggan.nolg }).from(pelanggan),
  ]);

  const validNolgSet = new Set(existingPelangganRows.map((p) => p.nolg));
  const filteredRows = parsedRows.filter((r) => validNolgSet.has(r.nolg));

  // Deduplikasi per (periode, nolg) bila file export memiliki duplikat baris
  const dedupMap = new Map<
    string,
    {
      id: string;
      nolg: string;
      periode: string;
      standAwal: string;
      standAkhir: string;
      pakaiM3: string;
      kodeKondisi: string;
      namaKondisi: string;
      isTaksasi: boolean;
      sumber: string;
    }
  >();

  for (const r of filteredRows) {
    const resolved = resolveKondisiCatatWithPriority(
      r.kodeKondisi,
      r.namaKondisi,
      kondisiRows
    );
    // Suatu bulan adalah taksasi apabila stand akhir sama dengan stand awal namun ada pemakaian > 0
    const isTaksasi = r.standAkhir === r.standAwal && r.pakai > 0;
    const key = `${r.periode}:${r.nolg}`;
    dedupMap.set(key, {
      id: `riw-${r.periode}-${r.nolg}`,
      nolg: r.nolg,
      periode: r.periode,
      standAwal: r.standAwal.toFixed(2),
      standAkhir: r.standAkhir.toFixed(2),
      pakaiM3: r.pakai.toFixed(2),
      kodeKondisi: resolved.kodeTmss,
      namaKondisi: resolved.ketCatat,
      isTaksasi,
      sumber,
    });
  }

  const upsertBatch = Array.from(dedupMap.values());
  const BATCH_SIZE = 500;

  for (let i = 0; i < upsertBatch.length; i += BATCH_SIZE) {
    const chunk = upsertBatch.slice(i, i + BATCH_SIZE);
    await database
      .insert(riwayatPemakaianHistoris)
      .values(chunk)
      .onConflictDoUpdate({
        target: [riwayatPemakaianHistoris.periode, riwayatPemakaianHistoris.nolg],
        set: {
          standAwal: sql`EXCLUDED.stand_awal`,
          standAkhir: sql`EXCLUDED.stand_akhir`,
          pakaiM3: sql`EXCLUDED.pakai_m3`,
          kodeKondisi: sql`EXCLUDED.kode_kondisi`,
          namaKondisi: sql`EXCLUDED.nama_kondisi`,
          isTaksasi: sql`EXCLUDED.is_taksasi`,
          sumber: sql`EXCLUDED.sumber`,
          updatedAt: new Date(),
        },
      });
  }

  // Hitung ulang akumulasi_taksasi_m3 untuk seluruh pelanggan yang terdampak di DPM targetPeriodeOpen
  const affectedNolgs = Array.from(new Set(upsertBatch.map((x) => x.nolg)));
  let updatedDpmCount = 0;
  let verifiedByPhysicalReadingCount = 0;
  let stillNeedsVerificationCount = 0;

  if (affectedNolgs.length > 0) {
    // Ambil gabungan riwayat dari riwayat_pemakaian_historis dan cater_baca_meter untuk periode < targetPeriodeOpen
    for (let i = 0; i < affectedNolgs.length; i += BATCH_SIZE) {
      const nolgChunk = affectedNolgs.slice(i, i + BATCH_SIZE);
      const [riwayatRows, caterRows] = await Promise.all([
        database
          .select({
            nolg: riwayatPemakaianHistoris.nolg,
            periode: riwayatPemakaianHistoris.periode,
            standAwal: riwayatPemakaianHistoris.standAwal,
            standAkhir: riwayatPemakaianHistoris.standAkhir,
            pakaiM3: riwayatPemakaianHistoris.pakaiM3,
          })
          .from(riwayatPemakaianHistoris)
          .where(
            and(
              inArray(riwayatPemakaianHistoris.nolg, nolgChunk),
              sql`${riwayatPemakaianHistoris.periode} < ${targetPeriodeOpen}`
            )
          ),
        database
          .select({
            nolg: caterBacaMeter.nolg,
            periode: caterBacaMeter.thbl,
            standAwal: caterBacaMeter.stml,
            standAkhir: sql<string>`COALESCE(${caterBacaMeter.stmaRevisi}, ${caterBacaMeter.stma})`,
            pakaiM3: sql<string>`COALESCE(${caterBacaMeter.pakaiTagih}, ${caterBacaMeter.pakaiM3Revisi}, ${caterBacaMeter.pakaiM3})`,
          })
          .from(caterBacaMeter)
          .where(
            and(
              inArray(caterBacaMeter.nolg, nolgChunk),
              sql`${caterBacaMeter.thbl} < ${targetPeriodeOpen}`
            )
          ),
      ]);

      // Gabungkan per nolg -> Map<periode, { standAwal, standAkhir, pakai }> (cater_baca_meter menang jika periode sama)
      const historyByNolg = new Map<
        string,
        Map<string, { standAwal: number; standAkhir: number; pakai: number }>
      >();

      for (const r of riwayatRows) {
        if (!historyByNolg.has(r.nolg)) historyByNolg.set(r.nolg, new Map());
        historyByNolg.get(r.nolg)!.set(r.periode, {
          standAwal: Number(r.standAwal ?? 0),
          standAkhir: Number(r.standAkhir ?? 0),
          pakai: Number(r.pakaiM3 ?? 0),
        });
      }

      for (const c of caterRows) {
        if (!historyByNolg.has(c.nolg)) historyByNolg.set(c.nolg, new Map());
        historyByNolg.get(c.nolg)!.set(c.periode, {
          standAwal: Number(c.standAwal ?? 0),
          standAkhir: Number(c.standAkhir ?? 0),
          pakai: Number(c.pakaiM3 ?? 0),
        });
      }

      // Telusuri mundur secara kronologis (periode DESC) sejak periode terakhir sebelum targetPeriodeOpen
      for (const [nolg, periodMap] of historyByNolg.entries()) {
        const sortedPeriods = Array.from(periodMap.entries()).sort((a, b) =>
          b[0].localeCompare(a[0])
        );

        let cumulativeTaksasi = 0;
        let foundPhysicalReading = false;

        for (const [, rec] of sortedPeriods) {
          if (rec.standAkhir === rec.standAwal && rec.pakai > 0) {
            cumulativeTaksasi += rec.pakai;
          } else {
            // Ditemukan pembacaan fisik (standAkhir > standAwal) atau pemakaian 0 (NOL / DICABUT)
            foundPhysicalReading = true;
            break;
          }
        }

        const perluVerifikasi = cumulativeTaksasi > 0 && !foundPhysicalReading;
        if (cumulativeTaksasi > 0) {
          if (foundPhysicalReading) {
            verifiedByPhysicalReadingCount++;
          } else {
            stillNeedsVerificationCount++;
          }
        }

        const updated = await database
          .update(daftarCatat)
          .set({
            akumulasiTaksasiM3: cumulativeTaksasi.toFixed(2),
            akumulasiPerluVerifikasi: perluVerifikasi,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(daftarCatat.periode, targetPeriodeOpen),
              eq(daftarCatat.nolg, nolg)
            )
          )
          .returning({ id: daftarCatat.id });

        if (updated.length > 0) {
          updatedDpmCount++;
        }
      }
    }
  }

  return {
    totalRowsImported: upsertBatch.length,
    uniquePelangganImported: affectedNolgs.length,
    targetPeriodeOpen,
    updatedDpmCount,
    verifiedByPhysicalReadingCount,
    stillNeedsVerificationCount,
  };
}
