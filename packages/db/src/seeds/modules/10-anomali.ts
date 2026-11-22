import { db } from '../../client';
import {
  aturanAnomali,
  aturanKondisiMeterMap,
  aturanAnomaliVersi,
  masterKondisiCatat,
  caterBacaMeter,
} from '../../schema';
import { inArray, sql, eq } from 'drizzle-orm';
import type { SeedModule, SeedOptions, SeedModuleResult } from '../types';
import {
  evaluasiAnomaliBaris,
  type ReadingInput,
} from '../../../../../apps/web/src/server/domain/cater/anomali-evaluator';

export const DEFAULT_ATURAN_ANOMALI = [
  // 1. Meter Mundur: stma < stml (stand fisik)
  {
    id: 'aturan-meter-mundur',
    kode: 'ANOM_METER_MUNDUR',
    nama: 'Meter Mundur / Stand Terbalik',
    tipeAturan: 'METER_MUNDUR',
    arah: 'TURUN',
    acuanPembanding: 'STAND_AWAL',
    periodeHistorisJml: 3,
    dihitungSebagaiAnomali: true,
    ringTingkat: 3,
    tingkatKeparahan: 'KRITIS',
    badgeTone: 'problem',
    urutan: 1,
    syaratKondisiLalu: 'ANY',
    kecualikanJikaBerlanjut: false,
    deskripsi:
      'Stand meter akhir lebih kecil dari stand awal (indikasi meter mundur, rollover 9999->0000, atau meter terbalik).',
  },
  // 2. Lonjakan Absolut: pakaiM3 > 75 m³
  {
    id: 'aturan-lonjakan-m3',
    kode: 'ANOM_LONJAKAN_M3',
    nama: 'Lonjakan Ekstrim (>75 m³)',
    tipeAturan: 'LONJAKAN_ABSOLUT',
    arah: 'NAIK',
    acuanPembanding: 'PAKAI_LALU',
    periodeHistorisJml: 3,
    minM3: '75',
    dihitungSebagaiAnomali: true,
    ringTingkat: 3,
    tingkatKeparahan: 'KRITIS',
    badgeTone: 'problem',
    urutan: 2,
    syaratKondisiLalu: 'ANY',
    kecualikanJikaBerlanjut: false,
    deskripsi: 'Volume pemakaian air di atas 75 m³ dalam satu periode.',
  },
  // 3. Lonjakan Relatif: Kenaikan ≥ 100% dan selisih fisik ≥ 30 m³
  {
    id: 'aturan-lonjakan-persen',
    kode: 'ANOM_LONJAKAN_PERSEN',
    nama: 'Lonjakan Tajam (≥100% & Selisih ≥30 m³)',
    tipeAturan: 'LONJAKAN_RELATIF',
    arah: 'NAIK',
    acuanPembanding: 'PAKAI_LALU',
    periodeHistorisJml: 3,
    syaratPakaiLaluMinM3: '1',
    selisihMinM3: '30',
    minPersen: '100',
    dihitungSebagaiAnomali: true,
    ringTingkat: 3,
    tingkatKeparahan: 'KRITIS',
    badgeTone: 'problem',
    urutan: 3,
    syaratKondisiLalu: 'ANY',
    kecualikanJikaBerlanjut: false,
    deskripsi:
      'Pemakaian meningkat 2x lipat (≥100%) dengan kenaikan fisik minimal 30 m³ dari acuan.',
  },
  // 4. Perubahan Mendadak: ANOM_TIDAK_ADA_AIR_MENDADAK
  {
    id: 'aturan-tidak-ada-air-mendadak',
    kode: 'ANOM_TIDAK_ADA_AIR_MENDADAK',
    nama: 'Tidak Ada Air Mendadak (Lalu ≥10 m³ & Normal)',
    tipeAturan: 'KONDISI_MENDADAK',
    arah: 'TURUN',
    acuanPembanding: 'PAKAI_LALU',
    periodeHistorisJml: 3,
    syaratPakaiLaluMinM3: '10',
    minM3: '0',
    maxM3: '0',
    syaratKondisiLalu: 'BASELINE_NORMAL',
    kecualikanJikaBerlanjut: false,
    dihitungSebagaiAnomali: true,
    ringTingkat: 2,
    tingkatKeparahan: 'TINGGI',
    badgeTone: 'warning',
    urutan: 4,
    aktif: true,
    deskripsi:
      'Kondisi kendala air dengan pemakaian 0 m³ mendadak dari riwayat normal minimal 10 m³.',
  },
  // 5. Kondisi Berkepanjangan: ANOM_TIDAK_ADA_AIR_BERKEPANJANGAN
  {
    id: 'aturan-tidak-ada-air-berkepanjangan',
    kode: 'ANOM_TIDAK_ADA_AIR_BERKEPANJANGAN',
    nama: 'Tidak Ada Air Berkepanjangan (≥3 Periode)',
    tipeAturan: 'KONDISI_BERKEPANJANGAN',
    arah: 'TURUN',
    acuanPembanding: 'PAKAI_LALU',
    periodeHistorisJml: 3,
    syaratPeriodeBerturut: 3,
    minM3: '0',
    maxM3: '0',
    syaratKondisiLalu: 'SAMA',
    kecualikanJikaBerlanjut: false,
    dihitungSebagaiAnomali: true,
    ringTingkat: 2,
    tingkatKeparahan: 'SEDANG',
    badgeTone: 'warning',
    urutan: 5,
    aktif: true,
    deskripsi:
      'Kondisi tidak ada air tercatat secara berturut-turut selama minimal 3 periode penagihan.',
  },
  // 6. Deviasi Ekstrim (> 80%): Ring 3 (Manager)
  {
    id: 'aturan-deviasi-ring3',
    kode: 'ANOM_DEVIASI_RING3',
    nama: 'Deviasi Ekstrim (>80%)',
    tipeAturan: 'DEVIASI',
    arah: 'KEDUANYA',
    acuanPembanding: 'PAKAI_LALU',
    periodeHistorisJml: 3,
    syaratPakaiLaluMinM3: '5',
    minPersen: '80',
    dihitungSebagaiAnomali: true,
    ringTingkat: 3,
    tingkatKeparahan: 'KRITIS',
    badgeTone: 'problem',
    urutan: 6,
    syaratKondisiLalu: 'ANY',
    kecualikanJikaBerlanjut: false,
    aktif: true,
    deskripsi: 'Penyimpangan pemakaian lebih dari 80% dibanding pemakaian acuan.',
  },
  // 7. Deviasi Moderat (50% s.d. 80%): Ring 2 (Supervisor)
  {
    id: 'aturan-deviasi-ring2',
    kode: 'ANOM_DEVIASI_RING2',
    nama: 'Deviasi Moderat (50% s.d. 80%)',
    tipeAturan: 'DEVIASI',
    arah: 'KEDUANYA',
    acuanPembanding: 'PAKAI_LALU',
    periodeHistorisJml: 3,
    syaratPakaiLaluMinM3: '5',
    minPersen: '50',
    maxPersen: '80',
    dihitungSebagaiAnomali: true,
    ringTingkat: 2,
    tingkatKeparahan: 'TINGGI',
    badgeTone: 'warning',
    urutan: 7,
    syaratKondisiLalu: 'ANY',
    kecualikanJikaBerlanjut: false,
    aktif: true,
    deskripsi: 'Penyimpangan pemakaian moderat antara 50% hingga 80% dibanding acuan.',
  },
  // 8. Penurunan Drastis (≥ 50%): Ring 2 (Supervisor)
  {
    id: 'aturan-penurunan-persen',
    kode: 'ANOM_PENURUNAN_PERSEN',
    nama: 'Penurunan Drastis (≥50% & Lalu ≥10 m³)',
    tipeAturan: 'PENURUNAN_RELATIF',
    arah: 'TURUN',
    acuanPembanding: 'PAKAI_LALU',
    periodeHistorisJml: 3,
    syaratPakaiLaluMinM3: '10',
    minPersen: '50',
    dihitungSebagaiAnomali: true,
    ringTingkat: 2,
    tingkatKeparahan: 'TINGGI',
    badgeTone: 'warning',
    urutan: 8,
    syaratKondisiLalu: 'ANY',
    kecualikanJikaBerlanjut: false,
    aktif: true,
    deskripsi:
      'Pemakaian anjlok lebih dari 50% pada pelanggan dengan riwayat pemakaian normal minimal 10 m³.',
  },
  // 9. Pemakaian Nol: pakaiM3 = 0 (Dengan Pengecualian Bersyarat jika Berlanjut)
  {
    id: 'aturan-pemakaian-nol',
    kode: 'ANOM_PEMAKAIAN_NOL',
    nama: 'Stand 0 m³ (Nihil / Macet)',
    tipeAturan: 'PEMAKAIAN_NOL',
    arah: 'TURUN',
    acuanPembanding: 'PAKAI_LALU',
    periodeHistorisJml: 3,
    minM3: '0',
    maxM3: '0',
    syaratKondisiLalu: 'ANY',
    kecualikanJikaBerlanjut: true, // Dikecualikan jika kondisi berlanjut dari periode sebelumnya
    kecualikanJikaPakaiLaluDibawah: '10', // Dikecualikan jika pemakaian lalu < 10 m3
    dihitungSebagaiAnomali: true,
    ringTingkat: 1,
    tingkatKeparahan: 'SEDANG',
    badgeTone: 'warning',
    urutan: 9,
    aktif: true,
    deskripsi: 'Angka stand meter tidak bergerak sama sekali (0 m³) di luar kondisi berlanjut.',
  },
  // 10. Kerusakan Fisik Meter: ANOM_KERUSAKAN_METER (Dihitung Sebagai Anomali)
  {
    id: 'aturan-kerusakan-meter',
    kode: 'ANOM_KERUSAKAN_METER',
    nama: 'Kerusakan Fisik & Pelanggaran Meter',
    tipeAturan: 'KONDISI_FISIK',
    arah: 'KEDUANYA',
    acuanPembanding: 'PAKAI_LALU',
    periodeHistorisJml: 3,
    syaratKondisiLalu: 'ANY',
    kecualikanJikaBerlanjut: false,
    dihitungSebagaiAnomali: true,
    ringTingkat: 2,
    tingkatKeparahan: 'TINGGI',
    badgeTone: 'problem',
    urutan: 10,
    deskripsi:
      'Meter rusak fisik, mati ada air, terbakar, buram, pecah, dicabut, atau los meter.',
  },
  // 11. Kendala Akses Lapangan: WARN_KENDALA_AKSES (Peringatan, Bukan Anomali)
  {
    id: 'aturan-kendala-akses',
    kode: 'WARN_KENDALA_AKSES',
    nama: 'Peringatan Kendala Akses & Teknis Lapangan',
    tipeAturan: 'KONDISI_FISIK',
    arah: 'KEDUANYA',
    acuanPembanding: 'PAKAI_LALU',
    periodeHistorisJml: 3,
    syaratKondisiLalu: 'ANY',
    kecualikanJikaBerlanjut: false,
    dihitungSebagaiAnomali: false, // HANYA PERINGATAN (Tidak dihitung sebagai anomali KPI)
    ringTingkat: 1,
    tingkatKeparahan: 'PERINGATAN',
    badgeTone: 'neutral',
    urutan: 11,
    deskripsi:
      'Kendala akses pencatatan: rumah kosong, stand tempel, DK, terhalang, ada anjing, tidak ada air.',
  },
  // 12. Deviasi Ringan (30% s.d. 50%): WARN_DEVIASI_RING1 (Peringatan Staf Ring 1)
  {
    id: 'aturan-deviasi-ring1',
    kode: 'WARN_DEVIASI_RING1',
    nama: 'Peringatan Deviasi Ringan (30% s.d. 50%)',
    tipeAturan: 'DEVIASI',
    arah: 'KEDUANYA',
    acuanPembanding: 'PAKAI_LALU',
    periodeHistorisJml: 3,
    syaratPakaiLaluMinM3: '5',
    minPersen: '30',
    maxPersen: '50',
    syaratKondisiLalu: 'ANY',
    kecualikanJikaBerlanjut: false,
    dihitungSebagaiAnomali: false, // HANYA PERINGATAN
    ringTingkat: 1,
    tingkatKeparahan: 'PERINGATAN',
    badgeTone: 'neutral',
    urutan: 12,
    deskripsi: 'Penyimpangan wajar 30% s.d. 50% yang menjadi fokus perhatian verifikator staf.',
  },
];

export const seedAturanAnomali: SeedModule = {
  id: '10-anomali',
  name: 'aturan-anomali',
  description: 'Master aturan anomali terpusat & pemetaan kondisi catat awal',

  async run(options: SeedOptions = {}): Promise<SeedModuleResult> {
    console.log('Seeding Master Aturan Anomali SSOT...');

    // 1. Simpan Snapshot Versi 1 (Idempoten)
    await db
      .insert(aturanAnomaliVersi)
      .values({
        versi: 1,
        snapshot: DEFAULT_ATURAN_ANOMALI,
        alasan: 'Inisialisasi baseline aturan anomali SSOT v1',
        diterbitkanOleh: 'SYSTEM_SEED',
      })
      .onConflictDoNothing({ target: aturanAnomaliVersi.versi });

    // 2. Simpan Aturan Default (Idempoten via ON CONFLICT kode DO NOTHING)
    for (const rule of DEFAULT_ATURAN_ANOMALI) {
      await db
        .insert(aturanAnomali)
        .values({
          id: rule.id,
          kode: rule.kode,
          nama: rule.nama,
          tipeAturan: rule.tipeAturan,
          arah: rule.arah,
          acuanPembanding: rule.acuanPembanding,
          periodeHistorisJml: rule.periodeHistorisJml,
          syaratPakaiLaluMinM3: rule.syaratPakaiLaluMinM3,
          selisihMinM3: rule.selisihMinM3,
          minM3: rule.minM3,
          maxM3: rule.maxM3,
          minPersen: rule.minPersen,
          maxPersen: rule.maxPersen,
          dihitungSebagaiAnomali: rule.dihitungSebagaiAnomali,
          ringTingkat: rule.ringTingkat,
          tingkatKeparahan: rule.tingkatKeparahan,
          badgeTone: rule.badgeTone,
          urutan: rule.urutan,
          syaratKondisiLalu: rule.syaratKondisiLalu,
          syaratPeriodeBerturut: rule.syaratPeriodeBerturut,
          kecualikanJikaBerlanjut: rule.kecualikanJikaBerlanjut,
          kecualikanJikaPakaiLaluDibawah: rule.kecualikanJikaPakaiLaluDibawah,
          aktif: true,
          deskripsi: rule.deskripsi,
        })
        .onConflictDoNothing({ target: aturanAnomali.kode });
    }

    // 3. Pemetaan TMSS Dinamis Berdasarkan Data master_kondisi_catat
    // a. KERUSAKAN_FISIK & PELANGGARAN -> ANOM_KERUSAKAN_METER
    const kondisiKerusakan = await db
      .select({ kodeTmss: masterKondisiCatat.kodeTmss })
      .from(masterKondisiCatat)
      .where(
        inArray(masterKondisiCatat.kategori, ['KERUSAKAN_FISIK', 'PELANGGARAN'])
      );

    for (const item of kondisiKerusakan) {
      await db
        .insert(aturanKondisiMeterMap)
        .values({
          id: `map-${item.kodeTmss}-kerusakan`,
          kodeTmss: item.kodeTmss,
          aturanAnomaliId: 'aturan-kerusakan-meter',
          isBaselineNormal: false,
          isPeriodeTidakAktif: true,
          aktif: true,
          keterangan: 'Pemetaan dinamis dari kategori master KERUSAKAN_FISIK / PELANGGARAN',
        })
        .onConflictDoNothing();
    }

    // b. KENDALA_AKSES & KENDALA_TEKNIS -> WARN_KENDALA_AKSES
    const kondisiKendala = await db
      .select({ kodeTmss: masterKondisiCatat.kodeTmss, kategori: masterKondisiCatat.kategori })
      .from(masterKondisiCatat)
      .where(
        inArray(masterKondisiCatat.kategori, ['KENDALA_AKSES', 'KENDALA_TEKNIS'])
      );

    for (const item of kondisiKendala) {
      await db
        .insert(aturanKondisiMeterMap)
        .values({
          id: `map-${item.kodeTmss}-kendala`,
          kodeTmss: item.kodeTmss,
          aturanAnomaliId: 'aturan-kendala-akses',
          // H dan R bukan kendala teknis tapi di kategori KENDALA_AKSES atau TERBACA
          isBaselineNormal: false, // Tidak dianggap baseline normal
          isPeriodeTidakAktif: item.kategori === 'KENDALA_TEKNIS', // Periode tidak aktif untuk kendala teknis air
          aktif: true,
          keterangan: `Pemetaan dinamis dari kategori master ${item.kategori}`,
        })
        .onConflictDoNothing();
    }

    // c. TMSS 8 (KENDALA_TEKNIS / Tidak Ada Air): Petakan juga ke aturan mendadak & berkepanjangan
    const tmssTeknis = await db
      .select({ kodeTmss: masterKondisiCatat.kodeTmss })
      .from(masterKondisiCatat)
      .where(inArray(masterKondisiCatat.kategori, ['KENDALA_TEKNIS']));

    for (const item of tmssTeknis) {
      // Petakan ke ANOM_TIDAK_ADA_AIR_MENDADAK
      await db
        .insert(aturanKondisiMeterMap)
        .values({
          id: `map-${item.kodeTmss}-mendadak`,
          kodeTmss: item.kodeTmss,
          aturanAnomaliId: 'aturan-tidak-ada-air-mendadak',
          isBaselineNormal: false,
          isPeriodeTidakAktif: true,
          aktif: true,
          keterangan: 'Pemetaan kondisi air mendadak tidak mengalir',
        })
        .onConflictDoNothing();

      // Petakan ke ANOM_TIDAK_ADA_AIR_BERKEPANJANGAN
      await db
        .insert(aturanKondisiMeterMap)
        .values({
          id: `map-${item.kodeTmss}-berkepanjangan`,
          kodeTmss: item.kodeTmss,
          aturanAnomaliId: 'aturan-tidak-ada-air-berkepanjangan',
          isBaselineNormal: false,
          isPeriodeTidakAktif: true,
          aktif: true,
          keterangan: 'Pemetaan kondisi air tidak mengalir berkepanjangan',
        })
        .onConflictDoNothing();
    }

    // d. Baseline Normal untuk Kategori TERBACA (Kecuali H dan R)
    // Ambil semua yang berkategori TERBACA
    const kondisiTerbaca = await db
      .select({ kodeTmss: masterKondisiCatat.kodeTmss })
      .from(masterKondisiCatat)
      .where(inArray(masterKondisiCatat.kategori, ['TERBACA']));

    for (const item of kondisiTerbaca) {
      // Di data: H (TIDAK DIPAKAI) dikecualikan dari baseline normal (isBaselineNormal = false)
      // Kode lainnya seperti '-', ' ', '0', '4', 'K', 'M', 'P', 'U', 'Z' bernilai true
      const isNormal = item.kodeTmss !== 'H';
      // Kita simpan mapping default baseline ke aturan deviasi ring 1 (atau dummy id map)
      await db
        .insert(aturanKondisiMeterMap)
        .values({
          id: `map-${item.kodeTmss || 'EMPTY'}-baseline`,
          kodeTmss: item.kodeTmss,
          aturanAnomaliId: 'aturan-deviasi-ring1',
          isBaselineNormal: isNormal,
          isPeriodeTidakAktif: false,
          aktif: true,
          keterangan: isNormal ? 'Kondisi terbaca normal untuk baseline' : 'Kondisi terbaca non-aktif (tarif minimum)',
        })
        .onConflictDoNothing();
    }

    console.log('Master Aturan Anomali SSOT v1 seeded successfully.');
    return {
      count: DEFAULT_ATURAN_ANOMALI.length,
      message: 'Master Aturan Anomali SSOT v1 seeded successfully',
    };
  },
};

export async function backfillEvaluasiAnomali(database = db) {
  console.log('Memulai evaluasi SSOT anomali untuk seluruh cater_baca_meter...');
  const startTime = Date.now();

  const rulesDb = await database.select().from(aturanAnomali).orderBy(aturanAnomali.urutan);
  const mapDb = await database
    .select({
      kodeTmss: aturanKondisiMeterMap.kodeTmss,
      aturanAnomaliId: aturanKondisiMeterMap.aturanAnomaliId,
      aturanKode: aturanAnomali.kode,
      isBaselineNormal: aturanKondisiMeterMap.isBaselineNormal,
      isPeriodeTidakAktif: aturanKondisiMeterMap.isPeriodeTidakAktif,
      aktif: aturanKondisiMeterMap.aktif,
    })
    .from(aturanKondisiMeterMap)
    .innerJoin(aturanAnomali, eq(aturanKondisiMeterMap.aturanAnomaliId, aturanAnomali.id))
    .where(eq(aturanKondisiMeterMap.aktif, true));

  const [latestVersi] = await database
    .select({ versi: sql<number>`COALESCE(MAX(${aturanAnomaliVersi.versi}), 1)` })
    .from(aturanAnomaliVersi);
  const activeVersi = Number(latestVersi?.versi || 1);

  const rows = await database.execute(sql`
    SELECT 
      c.id,
      c.thbl,
      c.nolg,
      c.tmss,
      c.stml,
      c.stma,
      c.pakai_m3,
      c.pakai_lalu,
      prev.tmss as prev_tmss,
      prev.pakai_m3 as prev_pakai_m3
    FROM cater_baca_meter c
    LEFT JOIN cater_baca_meter prev ON prev.nolg = c.nolg 
      AND prev.thbl = to_char(to_date(c.thbl, 'YYYYMM') - interval '1 month', 'YYYYMM')
    ORDER BY c.thbl ASC, c.nolg ASC
  `);

  const updates: Array<{
    id: string;
    is_anomali: boolean;
    kode_anomali_utama: string | null;
    kode_anomali_list: string[];
    aturan_versi: number;
  }> = [];

  for (const r of rows as any[]) {
    const input: ReadingInput = {
      stml: Number(r.stml),
      stma: Number(r.stma),
      pakaiM3: Number(r.pakai_m3),
      pakaiLalu: r.pakai_lalu !== null ? Number(r.pakai_lalu) : null,
      kodeTmss: r.tmss,
      prevKondisiTmss: r.prev_tmss,
      prevPakaiM3: r.prev_pakai_m3 !== null ? Number(r.prev_pakai_m3) : null,
    };

    const res = evaluasiAnomaliBaris(input, rulesDb as any, mapDb as any, activeVersi);
    updates.push({
      id: r.id,
      is_anomali: res.isAnomali,
      kode_anomali_utama: res.kodeUtama,
      kode_anomali_list: res.kodeList,
      aturan_versi: activeVersi,
    });
  }

  const chunkSize = 2000;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    const valuesSql = chunk
      .map(
        (u) =>
          `('${u.id}'::text, ${u.is_anomali}::boolean, ${
            u.kode_anomali_utama ? `'${u.kode_anomali_utama}'` : 'NULL'
          }::varchar, ARRAY[${u.kode_anomali_list
            .map((k) => `'${k}'`)
            .join(',')}]::text[], ${u.aturan_versi}::integer)`
      )
      .join(',\n');

    await database.execute(sql.raw(`
      UPDATE cater_baca_meter AS c
      SET 
        is_anomali = v.is_anomali,
        kode_anomali_utama = v.kode_anomali_utama,
        kode_anomali_list = v.kode_anomali_list,
        aturan_versi = v.aturan_versi
      FROM (VALUES ${valuesSql}) AS v(id, is_anomali, kode_anomali_utama, kode_anomali_list, aturan_versi)
      WHERE c.id = v.id;
    `));
  }

  const duration = Date.now() - startTime;
  console.log(`Evaluasi SSOT anomali selesai untuk ${updates.length} baris dalam ${duration} ms.`);
}
