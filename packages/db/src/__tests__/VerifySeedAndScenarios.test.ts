import fs from 'fs';
import path from 'path';
import { describe, test, expect } from 'bun:test';
import {
  db,
  tarifBlok,
  biayaTetap,
  golonganTarif,
  nextPeriode,
  prevPeriode,
  getActivePeriode,
  getLastClosedPeriode,
  carryForwardPeriode,
  resolveKondisiCatatWithPriority,
  importRiwayatInfolang,
} from '../index';
import { importProgresCater } from '../etl/import-progres-cater';
import {
  hitungRincianHargaAir,
  hitungTotalTagihan,
  tentukanBlok,
  hitungPemakaianDanRekonsiliasiTaksasi,
  type HargaBlok,
} from '../../../../apps/web/src/server/domain/tagihan/tagihan.engine';
import { sql } from 'drizzle-orm';

/**
 * Daftar pengecualian data sumber yang diketahui (disimpan sebagai data di file tes,
 * BUKAN sebagai kondisi khusus di engine tagihan):
 * - 00008001503: Pelanggan golongan 2B (3.000 m3) di CSV Oktober ditagih dengan tarif khusus
 *   kesepakatan (Rp 10.391.250), berbeda dari tarif umum golongan 2B (Rp 38.046.000).
 */
const KNOWN_BILLING_EXCEPTIONS: ReadonlyMap<string, string> = new Map([
  [
    '00008001503',
    'Tarif khusus hasil kesepakatan di aplikasi lama (3.000 m3 ditagih Rp 10.391.250 pada CSV Oktober, bukan tarif blok umum golongan 2B)',
  ],
]);

describe('Verifikasi Rekonsiliasi, Replay Tagihan Oktober, & 5 Skenario Siklus Periode (Read-Only)', () => {
  test('1. Fungsi transisi periode lintas tahun (nextPeriode & prevPeriode) bebas hardcode', () => {
    expect(nextPeriode('202512')).toBe('202601');
    expect(prevPeriode('202601')).toBe('202512');
    expect(nextPeriode('202610')).toBe('202611');
    expect(nextPeriode('202611')).toBe('202612');
    expect(nextPeriode('202612')).toBe('202701');
    expect(prevPeriode('202701')).toBe('202612');
  });

  test('2. Rekonsiliasi Master, Referensi, Akun (tanpa demo@example.com), & 0 FK Yatim', async () => {
    const [row] = await db.execute(sql`
      SELECT
        (SELECT count(*)::int FROM pelanggan) AS total_pelanggan,
        (SELECT count(*)::int FROM pelanggan WHERE no_meter IS NOT NULL) AS pelanggan_dengan_meter,
        (SELECT count(*)::int FROM pelanggan WHERE no_meter IS NULL) AS pelanggan_tanpa_meter,
        (SELECT count(*)::int FROM water_meter) AS total_water_meter,
        (SELECT count(*)::int FROM rute_cater) AS total_rute,
        (SELECT count(*)::int FROM "user" WHERE email = 'demo@example.com') AS demo_account_count,
        (SELECT count(*)::int FROM pelanggan WHERE ukuran_meter IS NULL OR trim(ukuran_meter) = '' OR ukuran_meter NOT IN (SELECT ukuran_meter FROM biaya_tetap WHERE jenis = 'BEA_BEBAN')) AS ukuran_meter_invalid,
        (SELECT count(*)::int FROM pelanggan WHERE no_urut_rute IS NULL OR no_urut_rute <= 0) AS tanpa_urutan_rute,
        (SELECT count(*)::int FROM pelanggan p LEFT JOIN rute_cater r ON p.rute_kode = r.kode WHERE p.rute_kode IS NULL OR r.kode IS NULL) AS fk_yatim_rute,
        (SELECT count(*)::int FROM pelanggan p LEFT JOIN golongan_tarif g ON p.tarif_kode = g.kode WHERE p.tarif_kode IS NULL OR g.kode IS NULL) AS fk_yatim_tarif,
        (SELECT count(*)::int FROM pelanggan p LEFT JOIN kelurahan k ON p.kelurahan_kode = k.kode WHERE p.kelurahan_kode IS NULL OR k.kode IS NULL) AS fk_yatim_kelurahan,
        (SELECT count(*)::int FROM pelanggan p LEFT JOIN water_meter m ON p.no_meter = m.no_meter WHERE p.no_meter IS NOT NULL AND m.no_meter IS NULL) AS fk_yatim_meter,
        (SELECT count(*)::int FROM daftar_catat d LEFT JOIN pelanggan p ON d.nolg = p.nolg WHERE p.nolg IS NULL) AS fk_yatim_dpm,
        (SELECT count(*)::int FROM cater_baca_meter c LEFT JOIN pelanggan p ON c.nolg = p.nolg WHERE p.nolg IS NULL) AS fk_yatim_cater,
        (SELECT count(*)::int FROM rekening_drd r LEFT JOIN pelanggan p ON r.nolg = p.nolg WHERE p.nolg IS NULL) AS fk_yatim_drd
    `);
    const r = row as any;
    expect(r.total_pelanggan).toBe(22524);
    expect(r.pelanggan_dengan_meter).toBe(21838);
    expect(r.pelanggan_tanpa_meter).toBe(686);
    expect(r.total_water_meter).toBe(21838);
    expect(r.total_rute).toBe(125);
    expect(r.demo_account_count).toBe(0);
    expect(r.ukuran_meter_invalid).toBe(0);
    expect(r.tanpa_urutan_rute).toBe(0);
    expect(r.fk_yatim_rute).toBe(0);
    expect(r.fk_yatim_tarif).toBe(0);
    expect(r.fk_yatim_kelurahan).toBe(0);
    expect(r.fk_yatim_meter).toBe(0);
    expect(r.fk_yatim_dpm).toBe(0);
    expect(r.fk_yatim_cater).toBe(0);
    expect(r.fk_yatim_drd).toBe(0);
  });

  test('3. Opening State: Periode Closed (TERKUNCI) & Periode Open (BERJALAN) dengan Carry-Forward 100%', async () => {
    const active = await getActivePeriode();
    const closed = await getLastClosedPeriode();
    expect(active).toBe(nextPeriode(closed));

    const [row] = await db.execute(sql`
      SELECT
        (SELECT count(*)::int FROM cater_baca_meter WHERE thbl = ${closed} AND status_verifikasi = 'LOCKED_BILLING') AS cater_locked_closed,
        (SELECT sum(pakai_m3::numeric)::int FROM rekening_drd WHERE thbl = ${closed}) AS total_m3_closed,
        (SELECT sum(total_tagihan::numeric)::bigint::text FROM rekening_drd WHERE thbl = ${closed}) AS total_tagihan_closed,
        (SELECT count(*)::int FROM daftar_catat WHERE periode = ${active} AND status = 'BELUM_DICATAT') AS dpm_open,
        (SELECT count(*)::int FROM cater_baca_meter WHERE thbl = ${active}) AS cater_open,
        (SELECT count(*)::int FROM rekening_drd WHERE thbl = ${active}) AS drd_open,
        (
          SELECT count(*)::int
          FROM daftar_catat d_open
          JOIN cater_baca_meter c_closed ON c_closed.nolg = d_open.nolg AND c_closed.thbl = ${closed}
          WHERE d_open.periode = ${active}
            AND d_open.stand_awal::numeric != c_closed.stma::numeric
        ) AS stand_awal_mismatch
    `);
    const r = row as any;
    expect(r.cater_locked_closed).toBe(22524);
    expect(r.total_m3_closed).toBe(330209);
    expect(r.total_tagihan_closed).toBe('2983083540');
    expect(r.dpm_open).toBe(22495);
    expect(r.cater_open).toBe(0);
    expect(r.drd_open).toBe(0);
    expect(r.stand_awal_mismatch).toBe(0);
  });

  test('4. Replay Tagihan Oktober: 22.523 dari 22.524 pelanggan cocok 100% (1 pengecualian terdokumentasi di KNOWN_BILLING_EXCEPTIONS)', async () => {
    const csvPath = path.resolve(__dirname, '../../data/raw/ProgresCater-PW5.csv');
    const csvText = fs.readFileSync(csvPath, 'utf8');
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);

    const [semuaBlok, semuaBiaya, semuaGolongan] = await Promise.all([
      db.select().from(tarifBlok),
      db.select().from(biayaTetap),
      db.select().from(golonganTarif),
    ]);

    const blokPerTarif = new Map<string, HargaBlok[]>();
    for (const b of semuaBlok) {
      const list = blokPerTarif.get(b.tarifKode) ?? [];
      list.push({
        blok: b.blok,
        batasAwalM3: b.batasAwalM3,
        batasAkhirM3: b.batasAkhirM3,
        hargaPerM3: Number(b.hargaPerM3),
      });
      blokPerTarif.set(b.tarifKode, list);
    }

    const golonganMap = new Map<string, { beaAdmin: number; airKotor: number; lainLain: number }>();
    for (const g of semuaGolongan) {
      golonganMap.set(g.kode, {
        beaAdmin: Number(g.beaAdmin),
        airKotor: Number(g.airKotor),
        lainLain: Number(g.lainLain ?? 0),
      });
    }

    const beaBebanPerUkuran = new Map<string, number>();
    for (const b of semuaBiaya) {
      if (b.jenis === 'BEA_BEBAN' && b.ukuranMeter) {
        beaBebanPerUkuran.set(b.ukuranMeter.trim(), Number(b.nominal));
      }
    }

    let exactMatchCount = 0;
    let knownExceptionCount = 0;
    const unexpectedMismatches: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const c = lines[i].split(';');
      if (c.length < 50) continue;
      const nolg = c[1]?.trim();
      const trp = c[5]?.trim();
      const pakaiDrd = Number(c[12]?.trim() || 0);
      const blokCsv = Number(c[13]?.trim() || 1);
      const hargaAirCsv = Number(c[14]?.trim() || 0);
      const beaBebanCsv = Number(c[15]?.trim() || 0);
      const beaAdminCsv = Number(c[16]?.trim() || 0);
      const airKotorCsv = Number(c[17]?.trim() || 0);
      const lainLainCsv = Number(c[18]?.trim() || 0);
      const totalCsv = Number(c[19]?.trim() || 0);
      const ukmeter = c[49]?.trim() || '1/2';

      const tarifList = blokPerTarif.get(trp) ?? [];
      const gol = golonganMap.get(trp)!;
      const beaBebanCalc = beaBebanPerUkuran.get(ukmeter)!;
      const { total: hargaAirCalc } = hitungRincianHargaAir(pakaiDrd, tarifList);
      const blokCalc = tentukanBlok(pakaiDrd);
      const totalCalc = hitungTotalTagihan({
        jmlHargaAir: hargaAirCalc,
        beaBeban: beaBebanCalc,
        beaAdmin: gol.beaAdmin,
        airKotor: gol.airKotor,
        lainLain: gol.lainLain,
      });

      const isMatch =
        blokCalc === blokCsv &&
        hargaAirCalc === hargaAirCsv &&
        beaBebanCalc === beaBebanCsv &&
        gol.beaAdmin === beaAdminCsv &&
        gol.airKotor === airKotorCsv &&
        gol.lainLain === lainLainCsv &&
        totalCalc === totalCsv;

      if (isMatch) {
        exactMatchCount++;
      } else if (KNOWN_BILLING_EXCEPTIONS.has(nolg)) {
        knownExceptionCount++;
      } else {
        unexpectedMismatches.push({
          nolg,
          trp,
          ukmeter,
          pakaiDrd,
          hargaAirCsv,
          hargaAirCalc,
          totalCsv,
          totalCalc,
        });
      }
    }

    expect(unexpectedMismatches).toEqual([]);
    expect(knownExceptionCount).toBe(1);
    expect(exactMatchCount).toBe(22523);
  });

  test('5. Simulasi 5 Skenario Bisnis & Periode Sintetis (202512 -> 202601) dalam Transaksi Rollback (Read-Only)', async () => {
    let rolledBack = false;
    try {
      await db.transaction(async (tx) => {
        // Skenario 1: Sambung kembali pelanggan DICABUT (00404800111, stma = 172)
        await tx.execute(sql`
          UPDATE pelanggan SET status = 'PELANGGAN AKTIF' WHERE nolg = '00404800111'
        `);
        await tx.execute(sql`
          INSERT INTO daftar_catat (id, periode, nolg, rute_kode, urutan, stand_awal, pakai_lalu, sumber, status)
          SELECT 'dpm-202611-00404800111', '202611', '00404800111', 'KC202', 1, stma, pakai_tagih, 'MANUAL', 'BELUM_DICATAT'
          FROM cater_baca_meter WHERE thbl = '202610' AND nolg = '00404800111'
        `);
        const [reconnected] = await tx.execute(sql`
          SELECT stand_awal::numeric::int AS st_awal FROM daftar_catat WHERE periode = '202611' AND nolg = '00404800111'
        `);
        expect((reconnected as any).st_awal).toBe(172);

        // Skenario 2: Pelanggan Baru PBPK
        await tx.execute(sql`
          INSERT INTO pelanggan (nolg, nama, alamat, status, tarif_kode, kelurahan_kode, rute_kode, no_urut_rute, ukuran_meter)
          VALUES ('99999999999', 'UJI PBPK', 'JL. UJI', 'PELANGGAN AKTIF', '2A3', 'TC2', 'TC211', 999, '1/2')
        `);
        await tx.execute(sql`
          INSERT INTO daftar_catat (id, periode, nolg, rute_kode, urutan, stand_awal, pakai_lalu, sumber, status)
          VALUES ('dpm-202611-99999999999', '202611', '99999999999', 'TC211', 999, 0, 0, 'PBPK', 'BELUM_DICATAT')
        `);
        const [newCustDpm] = await tx.execute(sql`
          SELECT stand_awal::numeric::int AS st_awal, sumber FROM daftar_catat WHERE periode = '202611' AND nolg = '99999999999'
        `);
        expect((newCustDpm as any).st_awal).toBe(0);
        expect((newCustDpm as any).sumber).toBe('PBPK');

        // Skenario 3: Ganti Meter (Stand Reset) untuk pelanggan tanpa water_meter awal
        await tx.execute(sql`
          INSERT INTO water_meter (no_meter, merk, ukuran, kondisi) VALUES ('MTR-TEST-RESET', 'ITR', '1/2', 'Normal')
        `);
        await tx.execute(sql`
          UPDATE pelanggan SET no_meter = 'MTR-TEST-RESET' WHERE nolg = '00009004822'
        `);
        await tx.execute(sql`
          INSERT INTO cater_baca_meter (id, thbl, nolg, rute_kode, stml, stma, pakai_m3, pakai_tagih, tmss, ket_catat, status_verifikasi)
          VALUES ('cater-202611-00009004822', '202611', '00009004822', 'TC211', 550, 7, 17, 17, '4', 'MB', 'LOCKED_BILLING')
        `);
        const [gwmReading] = await tx.execute(sql`
          SELECT stma::numeric::int AS st_akhir, pakai_tagih::numeric::int AS pakai FROM cater_baca_meter WHERE id = 'cater-202611-00009004822'
        `);
        expect((gwmReading as any).st_akhir).toBe(7);
        expect((gwmReading as any).pakai).toBe(17);

        // Skenario 4 & 5: Uji Periode Sintetis Lintas Tahun 202512 (TERKUNCI) -> 202601 (BERJALAN)
        await tx.execute(sql`
          INSERT INTO periode_penagihan (periode, status, jumlah_sl, total_m3, total_tagihan)
          VALUES ('202512', 'TERKUNCI', 1, 25, 100000)
        `);
        await tx.execute(sql`
          INSERT INTO cater_baca_meter (id, thbl, nolg, rute_kode, stml, stma, pakai_m3, pakai_tagih, tmss, ket_catat, status_verifikasi)
          VALUES ('cater-202512-99999999999', '202512', '99999999999', 'TC211', 100, 125, 25, 25, ' ', 'Normal', 'LOCKED_BILLING')
        `);
        const nextPeriodFrom202512 = nextPeriode('202512');
        expect(nextPeriodFrom202512).toBe('202601');

        const [syntheticCarry] = await tx.execute(sql`
          SELECT COALESCE(stma_revisi, stma)::numeric::int AS carry_stand_awal
          FROM cater_baca_meter
          WHERE thbl = '202512' AND nolg = '99999999999'
        `);
        expect((syntheticCarry as any).carry_stand_awal).toBe(125);

        throw new Error('ROLLBACK_INTENTIONAL_READ_ONLY');
      });
    } catch (e: any) {
      if (e.message === 'ROLLBACK_INTENTIONAL_READ_ONLY') {
        rolledBack = true;
      } else {
        throw e;
      }
    }
    expect(rolledBack).toBe(true);
  });

  test('6. Aturan Taksasi (mode_hitung & pemakaian_minimum_m3) serta 3 Contoh Angka Rekonsiliasi Akumulasi Taksasi', () => {
    // Contoh (a): Taksasi bulan lalu = 5 m3, selisih fisik bulan ini = 7 m3 (mis. stml=100, stma=107)
    // Prinsip wajib: Total ditagih sepanjang rentang (5 + 2 = 7 m3) == pemakaian fisik riil (7 m3).
    // Jika netto (2 m3) dipaksa naik ke minimum 5 m3, maka total ditagih = 5 + 5 = 10 != 7 (melanggar prinsip!).
    const contohA = hitungPemakaianDanRekonsiliasiTaksasi({
      stml: 100,
      stma: 107,
      modeHitung: 'SELISIH_FISIK',
      pakaiLalu: 5,
      pemakaianMinimumM3: 5,
      akumulasiTaksasiM3: 5,
    });
    expect(contohA.selisihFisikM3).toBe(7);
    expect(contohA.pakaiTagihM3).toBe(2);
    expect(5 + contohA.pakaiTagihM3).toBe(contohA.selisihFisikM3); // 5 + 2 == 7 (Invarian terjaga!)
    expect(contohA.akumulasiTaksasiBerikutnya).toBe(0); // Reset ke 0 setelah bacaan fisik
    expect(contohA.isAnomaliKreditTaksasi).toBe(false);

    // Contoh (b): Taksasi bulan lalu = 27 m3, selisih fisik bulan ini = 54 m3 (stml=3909, stma=3963)
    // Prinsip wajib: Total ditagih (27 + 27 = 54 m3) == pemakaian fisik riil (54 m3), dan tagihan bulan ini (27 m3) tetap di Blok 3 (tidak masuk Blok 4!).
    const contohB = hitungPemakaianDanRekonsiliasiTaksasi({
      stml: 3909,
      stma: 3963,
      modeHitung: 'SELISIH_FISIK',
      pakaiLalu: 27,
      pemakaianMinimumM3: 5,
      akumulasiTaksasiM3: 27,
    });
    expect(contohB.selisihFisikM3).toBe(54);
    expect(contohB.pakaiTagihM3).toBe(27);
    expect(27 + contohB.pakaiTagihM3).toBe(contohB.selisihFisikM3); // 27 + 27 == 54 (Invarian terjaga!)
    expect(tentukanBlok(contohB.pakaiTagihM3)).toBe(3); // Blok 3, tidak masuk Blok 4!
    expect(contohB.akumulasiTaksasiBerikutnya).toBe(0);
    expect(contohB.isAnomaliKreditTaksasi).toBe(false);

    // Contoh (c): Taksasi bulan lalu = 27 m3, selisih fisik bulan ini = 20 m3 (kredit > selisih fisik -> negatif -7 m3)
    // Aturan wajib: Hasil negatif ditandai sebagai ANOMALY untuk koreksi manual, tidak dipotong/direset otomatis!
    const contohC = hitungPemakaianDanRekonsiliasiTaksasi({
      stml: 1000,
      stma: 1020,
      modeHitung: 'SELISIH_FISIK',
      pakaiLalu: 27,
      pemakaianMinimumM3: 5,
      akumulasiTaksasiM3: 27,
    });
    expect(contohC.selisihFisikM3).toBe(20);
    expect(contohC.pakaiTagihM3).toBe(-7);
    expect(contohC.isAnomaliKreditTaksasi).toBe(true);
    expect(contohC.alasanTaksir).toBe('ANOMALI_KREDIT_TAKSASI');
    expect(contohC.akumulasiTaksasiBerikutnya).toBe(27); // Belum di-reset sebelum koreksi manual

    // Uji tambahan: Akumulasi kumulatif 2 bulan taksasi berturut-turut (DK bulan 1 = 15 m3, DK bulan 2 = 15 m3 -> akumulasi = 30 m3)
    const taksasiBulan1 = hitungPemakaianDanRekonsiliasiTaksasi({
      stml: 500,
      stma: 500,
      modeHitung: 'TAKSASI_HISTORI',
      pakaiLalu: 15,
      pemakaianMinimumM3: 5,
      akumulasiTaksasiM3: 0,
    });
    expect(taksasiBulan1.pakaiTagihM3).toBe(15);
    expect(taksasiBulan1.akumulasiTaksasiBerikutnya).toBe(15);

    const taksasiBulan2 = hitungPemakaianDanRekonsiliasiTaksasi({
      stml: 500,
      stma: 500,
      modeHitung: 'TAKSASI_HISTORI',
      pakaiLalu: taksasiBulan1.pakaiTagihM3,
      pemakaianMinimumM3: 5,
      akumulasiTaksasiM3: taksasiBulan1.akumulasiTaksasiBerikutnya,
    });
    expect(taksasiBulan2.pakaiTagihM3).toBe(15);
    expect(taksasiBulan2.akumulasiTaksasiBerikutnya).toBe(30); // Kumulatif 15 + 15 = 30 m3!

    // Uji tambahan: Mode METER_BARU (4 | MB - Pergantian Meter Baru)
    // Kasus 1: stml meter lama = 1452, stma meter baru = 3 (mulai dari 0, belum ada standAngkat) -> fisik = 3 m3, tagih minimum = 5 m3, tidak negatif!
    const mbMinimum = hitungPemakaianDanRekonsiliasiTaksasi({
      stml: 1452,
      stma: 3,
      modeHitung: 'METER_BARU',
      pakaiLalu: 12,
      pemakaianMinimumM3: 5,
      akumulasiTaksasiM3: 12,
    });
    expect(mbMinimum.selisihFisikM3).toBe(3);
    expect(mbMinimum.pakaiTagihM3).toBe(5);
    expect(mbMinimum.akumulasiTaksasiBerikutnya).toBe(0);
    expect(mbMinimum.isAnomaliKreditTaksasi).toBe(false);

    // Kasus 2: stml meter lama = 1417, stma meter baru = 14 -> fisik = 14 m3, tagih = 14 m3!
    const mbNormal = hitungPemakaianDanRekonsiliasiTaksasi({
      stml: 1417,
      stma: 14,
      modeHitung: 'METER_BARU',
      pakaiLalu: 5,
      pemakaianMinimumM3: 5,
    });
    expect(mbNormal.selisihFisikM3).toBe(14);
    expect(mbNormal.pakaiTagihM3).toBe(14);
    expect(mbNormal.alasanTaksir).toBe('METER_BARU_RESET');
  });

  test('7. Regresi Permanen M | KELEBIHAN (KREDIT_TAKSASI) Multi-Bulan, Normal STAND_TETAP, & Prioritas Mismatch Kondisi', () => {
    // Skenario Wajib: Stand sistem terbayar 1000, stand fisik awal 900 (kredit akumulasi_taksasi_m3 = 100)
    // -> Bulan 1 fisik 920 (selisih fisik 20, kredit sisa 80)
    // -> Bulan 2 fisik 1010 (selisih fisik 90, kredit 80 habis, tagih 10 m3)

    // Langkah 1a: Saat Bulan 1 (stml=900, stma=920, kredit=100) masuk pertama kali sebagai Normal (SELISIH_FISIK),
    // sistem wajib mendeteksi kredit (100) > selisih fisik (20) dan menandai ANOMALY (ANOMALI_KREDIT_TAKSASI).
    const bulan1AwalNormal = hitungPemakaianDanRekonsiliasiTaksasi({
      stml: 900,
      stma: 920,
      modeHitung: 'SELISIH_FISIK',
      pakaiLalu: 25,
      pemakaianMinimumM3: 5,
      akumulasiTaksasiM3: 100,
    });
    expect(bulan1AwalNormal.selisihFisikM3).toBe(20);
    expect(bulan1AwalNormal.isAnomaliKreditTaksasi).toBe(true);
    expect(bulan1AwalNormal.alasanTaksir).toBe('ANOMALI_KREDIT_TAKSASI');

    // Langkah 1b: Verifikator menetapkan kondisi M | KELEBIHAN (modeHitung = 'KREDIT_TAKSASI').
    // - Stand fisik 920 disimpan apa adanya (stmaEfektif = 920).
    // - Kredit 100 dikurangi selisih fisik 20 -> sisa kredit dibawa ke bulan berikutnya = 80 m3.
    // - Tagihan bulan berjalan mengikuti konfigurasi tagihanSaatKelebihan ('MINIMUM' = 5 m3 atau 'NOL' = 0 m3).
    const bulan1KelebihanMin = hitungPemakaianDanRekonsiliasiTaksasi({
      stml: 900,
      stma: 920,
      modeHitung: 'KREDIT_TAKSASI',
      pakaiLalu: 25,
      pemakaianMinimumM3: 5,
      akumulasiTaksasiM3: 100,
      tagihanSaatKelebihan: 'MINIMUM',
    });
    expect(bulan1KelebihanMin.stmaEfektif).toBe(920);
    expect(bulan1KelebihanMin.selisihFisikM3).toBe(20);
    expect(bulan1KelebihanMin.akumulasiTaksasiDikurangkan).toBe(20);
    expect(bulan1KelebihanMin.akumulasiTaksasiBerikutnya).toBe(80);
    expect(bulan1KelebihanMin.pakaiTagihM3).toBe(5);
    expect(bulan1KelebihanMin.isAnomaliKreditTaksasi).toBe(false);
    expect(bulan1KelebihanMin.alasanTaksir).toBe('KREDIT_TAKSASI_KELEBIHAN');

    const bulan1KelebihanNol = hitungPemakaianDanRekonsiliasiTaksasi({
      stml: 900,
      stma: 920,
      modeHitung: 'KREDIT_TAKSASI',
      pakaiLalu: 25,
      pemakaianMinimumM3: 5,
      akumulasiTaksasiM3: 100,
      tagihanSaatKelebihan: 'NOL',
    });
    expect(bulan1KelebihanNol.pakaiTagihM3).toBe(0);
    expect(bulan1KelebihanNol.akumulasiTaksasiBerikutnya).toBe(80);

    // Langkah 2: Bulan 2 -> Carry-forward membawa stml = 920 dan sisa kredit = 80 (stand sistem terbayar tetap 920 + 80 = 1000).
    // Saat terbaca fisik 1010 (selisih fisik = 1010 - 920 = 90 m3):
    // Sisa kredit 80 m3 habis terserap (akumulasiTaksasiBerikutnya = 0) dan tagihan = 90 - 80 = 10 m3!
    const bulan2KreditHabis = hitungPemakaianDanRekonsiliasiTaksasi({
      stml: bulan1KelebihanMin.stmaEfektif, // 920
      stma: 1010,
      modeHitung: 'SELISIH_FISIK',
      pakaiLalu: bulan1KelebihanMin.pakaiTagihM3,
      pemakaianMinimumM3: 5,
      akumulasiTaksasiM3: bulan1KelebihanMin.akumulasiTaksasiBerikutnya, // 80
    });
    expect(bulan2KreditHabis.selisihFisikM3).toBe(90);
    expect(bulan2KreditHabis.akumulasiTaksasiDikurangkan).toBe(80);
    expect(bulan2KreditHabis.akumulasiTaksasiBerikutnya).toBe(0);
    expect(bulan2KreditHabis.pakaiTagihM3).toBe(10);
    expect(bulan2KreditHabis.isAnomaliKreditTaksasi).toBe(false);
    expect(bulan2KreditHabis.alasanTaksir).toBe('REKONSILIASI_TAKSASI_LALU');

    // Uji Normal dengan stma == stml -> tetap SELISIH_FISIK (dikenai minimum), namun ditandai isStandTetap = true (STAND_TETAP)
    const normalStandTetap = hitungPemakaianDanRekonsiliasiTaksasi({
      stml: 350,
      stma: 350,
      modeHitung: 'SELISIH_FISIK',
      pakaiLalu: 14,
      pemakaianMinimumM3: 5,
      akumulasiTaksasiM3: 0,
    });
    expect(normalStandTetap.selisihFisikM3).toBe(0);
    expect(normalStandTetap.pakaiTagihM3).toBe(5);
    expect(normalStandTetap.isStandTetap).toBe(true);
    expect(normalStandTetap.alasanTaksir).toBe('STAND_TETAP');

    // Uji Prioritas Mismatch Kd_kel vs Nm_Kel: selalu utamakan kondisi non-Normal dan catat auditNote
    const sampleKondisi = [
      { kodeTmss: '-', nama: 'Normal', modeHitung: 'SELISIH_FISIK' },
      { kodeTmss: 'Z', nama: 'STAND-KONSUMEN', modeHitung: 'TAKSASI_HISTORI' },
      { kodeTmss: '6', nama: 'BMK/BMB', modeHitung: 'TAKSASI_HISTORI' },
    ];
    const mismatch1 = resolveKondisiCatatWithPriority('-', 'STAND-KONSUMEN', sampleKondisi);
    expect(mismatch1.isMismatch).toBe(true);
    expect(mismatch1.kodeTmss).toBe('Z');
    expect(mismatch1.ketCatat).toBe('STAND-KONSUMEN');
    expect(mismatch1.modeHitung).toBe('TAKSASI_HISTORI');
    expect(mismatch1.auditNote).toContain('[AUDIT_KONDISI]');

    const mismatch2 = resolveKondisiCatatWithPriority('6', 'Normal', sampleKondisi);
    expect(mismatch2.isMismatch).toBe(true);
    expect(mismatch2.kodeTmss).toBe('6');
    expect(mismatch2.ketCatat).toBe('BMK/BMB');
    expect(mismatch2.modeHitung).toBe('TAKSASI_HISTORI');
    expect(mismatch2.auditNote).toContain('[AUDIT_KONDISI]');
  });

  test('8. Simulasi Jalur Produksi (202610 Seeded -> Infolang 12-Bulan & Import ProgresCater Closing 202611 -> 202612 Open) Tanpa Double-Count (Rollback)', async () => {
    // 1. Verifikasi state awal DPM 202611: semua 8.733 pelanggan dengan akumulasi_taksasi_m3 > 0 memiliki akumulasi_perlu_verifikasi = true
    const [initialFlagRow] = await db.execute(sql`
      SELECT
        count(*) FILTER (WHERE akumulasi_taksasi_m3::numeric > 0)::int AS total_akumulasi_positif,
        count(*) FILTER (WHERE akumulasi_taksasi_m3::numeric > 0 AND akumulasi_perlu_verifikasi = true)::int AS total_perlu_verifikasi
      FROM daftar_catat
      WHERE periode = '202611'
    `);
    expect((initialFlagRow as any).total_akumulasi_positif).toBe(8733);
    expect((initialFlagRow as any).total_perlu_verifikasi).toBe(8733);

    // 2. Uji ETL Riwayat Infolang & Jalur Import ProgresCater 202611 -> 202612 di dalam transaksi rollback
    const tmpCsvPath = path.resolve(__dirname, '../../data/exports/.tmp-test-progrescater-202611.csv');
    let rolledBack = false;

    try {
      await db.transaction(async (tx) => {
        // Ambil 2 pelanggan di DPM 202611 yang punya akumulasi_taksasi_m3 > 0 dari Oktober (202610)
        const sampleTaxedRows = await tx.execute(sql`
          SELECT d.nolg, d.stand_awal::numeric AS stand_awal, d.pakai_lalu::numeric AS pakai_lalu, d.akumulasi_taksasi_m3::numeric AS akum_11
          FROM daftar_catat d
          WHERE d.periode = '202611' AND d.akumulasi_taksasi_m3::numeric > 0
          ORDER BY d.nolg ASC
          LIMIT 2
        `);
        const custA = (sampleTaxedRows as any[])[0];
        const custB = (sampleTaxedRows as any[])[1];
        const akumA_fromOct = Number(custA.akum_11);
        const akumB_fromOct = Number(custB.akum_11);

        // (A) Uji ETL importRiwayatInfolang untuk custA:
        // Misal di infolang:
        // - 202607: Baca fisik (stand 10 -> 25, pakai 15)
        // - 202608: Taksasi DK (stand 25 -> 25, pakai 15)
        // - 202609: Taksasi DK (stand 25 -> 25, pakai 15)
        // Ditambah Oktober (202610) di cater_baca_meter yang sudah punya taksasi = akumA_fromOct:
        // Maka akumulasi_taksasi_m3 di DPM 202611 untuk custA harus menjadi 15 + 15 + akumA_fromOct,
        // dan akumulasi_perlu_verifikasi berubah menjadi FALSE karena ditemukan bacaan fisik di 202607!
        const infolangRes = await importRiwayatInfolang(
          {
            targetPeriodeOpen: '202611',
            rows: [
              {
                nolg: custA.nolg,
                periode: '202607',
                standAwal: 10,
                standAkhir: 25,
                pakai: 15,
                kodeKondisi: '-',
                namaKondisi: 'Normal',
              },
              {
                nolg: custA.nolg,
                periode: '202608',
                standAwal: 25,
                standAkhir: 25,
                pakai: 15,
                kodeKondisi: '2',
                namaKondisi: 'DK',
              },
              {
                nolg: custA.nolg,
                periode: '202609',
                standAwal: 25,
                standAkhir: 25,
                pakai: 15,
                kodeKondisi: '2',
                namaKondisi: 'DK',
              },
            ],
          },
          tx as any
        );
        expect(infolangRes.updatedDpmCount).toBe(1);
        expect(infolangRes.verifiedByPhysicalReadingCount).toBe(1);

        const [dpmAAfterInfolang] = await tx.execute(sql`
          SELECT akumulasi_taksasi_m3::numeric AS akum, akumulasi_perlu_verifikasi AS perlu_verif
          FROM daftar_catat
          WHERE periode = '202611' AND nolg = ${custA.nolg}
        `);
        const expectedAkumA_202611 = 15 + 15 + akumA_fromOct;
        expect(Number((dpmAAfterInfolang as any).akum)).toBe(expectedAkumA_202611);
        expect((dpmAAfterInfolang as any).perlu_verif).toBe(false);

        // (B) Uji Jalur Produksi: Import ProgresCater Closing 202611 di atas DB yang sama -> membuka 202612!
        // Ambil baris asli custA dan custB dari ProgresCater-PW5.csv, lalu ubah ke thbl=202611:
        // - custA di 202611 kembali ditaksir (stma == stml, pakai_drd = 10 m3, kondisi '2' / 'DK')
        // - custB di 202611 terbaca fisik (stma = stml + 20, pakai_drd = 20 m3, kondisi ' ' / 'Normal')
        const octCsvPath = path.resolve(__dirname, '../../data/raw/ProgresCater-PW5.csv');
        const octLines = fs.readFileSync(octCsvPath, 'utf8').split(/\r?\n/);
        const headerLine = octLines[0];
        const lineA = octLines.find((l) => l.startsWith(`202610;${custA.nolg};`))!;
        const lineB = octLines.find((l) => l.startsWith(`202610;${custB.nolg};`))!;

        const colsA = lineA.split(';');
        colsA[0] = '202611';
        colsA[8] = '2';
        colsA[9] = 'DK';
        colsA[10] = String(custA.stand_awal);
        colsA[11] = String(custA.stand_awal); // stma == stml (ditaksir lagi di 202611)
        colsA[12] = '10'; // pakai_drd 202611 = 10 m3

        const colsB = lineB.split(';');
        colsB[0] = '202611';
        colsB[8] = ' ';
        colsB[9] = 'Normal';
        colsB[10] = String(custB.stand_awal);
        colsB[11] = String(Number(custB.stand_awal) + 20); // stma > stml (terbaca fisik di 202611)
        colsB[12] = '20';

        fs.writeFileSync(
          tmpCsvPath,
          [headerLine, colsA.join(';'), colsB.join(';')].join('\n') + '\n',
          'utf8'
        );

        // Jalankan importProgresCater untuk file closing 202611 (Run #1)
        await importProgresCater(
          { csvPath: tmpCsvPath, exportAuditCsv: false },
          tx as any
        );

        // Periksa bagaimana akumulasi_taksasi_m3 di 202611 dan 202612 diperlakukan:
        // 1. daftar_catat(202611).akumulasi_taksasi_m3 TIDAK ditimpa menjadi 0 (tetap menyimpan kredit yang masuk ke 202611)
        const [dpmA_202611_after] = await tx.execute(sql`
          SELECT akumulasi_taksasi_m3::numeric AS akum FROM daftar_catat WHERE periode = '202611' AND nolg = ${custA.nolg}
        `);
        expect(Number((dpmA_202611_after as any).akum)).toBe(expectedAkumA_202611);

        // 2. Di DPM 202612 yang baru terbuka:
        //    - custA (ditaksir lagi 10 m3 di 202611) -> akumulasi_taksasi_m3(202612) = expectedAkumA_202611 + 10 (dijumlahkan kumulatif!)
        //    - custB (terbaca fisik di 202611) -> akumulasi_taksasi_m3(202612) = 0 (di-reset ke 0!) dan akumulasi_perlu_verifikasi = false
        const [dpmA_202612_run1] = await tx.execute(sql`
          SELECT akumulasi_taksasi_m3::numeric AS akum, akumulasi_perlu_verifikasi AS perlu_verif
          FROM daftar_catat WHERE periode = '202612' AND nolg = ${custA.nolg}
        `);
        const [dpmB_202612_run1] = await tx.execute(sql`
          SELECT akumulasi_taksasi_m3::numeric AS akum, akumulasi_perlu_verifikasi AS perlu_verif, stand_awal::numeric AS st_awal
          FROM daftar_catat WHERE periode = '202612' AND nolg = ${custB.nolg}
        `);
        expect(Number((dpmA_202612_run1 as any).akum)).toBe(expectedAkumA_202611 + 10);
        expect((dpmA_202612_run1 as any).perlu_verif).toBe(false);
        expect(Number((dpmB_202612_run1 as any).akum)).toBe(0);
        expect((dpmB_202612_run1 as any).perlu_verif).toBe(false);
        expect(Number((dpmB_202612_run1 as any).st_awal)).toBe(Number(custB.stand_awal) + 20);

        // 3. Uji Idempotensi (Run #2): Jalankan carryForwardPeriode('202611', '202612') sekali lagi
        //    untuk membuktikan akumulasi_taksasi_m3 TIDAK PERNAH TERHITUNG DUA KALI (no double-counting)!
        await carryForwardPeriode(
          { periodeLalu: '202611', periodeBaru: '202612' },
          tx as any
        );
        const [dpmA_202612_run2] = await tx.execute(sql`
          SELECT akumulasi_taksasi_m3::numeric AS akum FROM daftar_catat WHERE periode = '202612' AND nolg = ${custA.nolg}
        `);
        expect(Number((dpmA_202612_run2 as any).akum)).toBe(expectedAkumA_202611 + 10);

        throw new Error('ROLLBACK_GO_LIVE_PATH_TEST');
      });
    } catch (e: any) {
      if (e.message === 'ROLLBACK_GO_LIVE_PATH_TEST') {
        rolledBack = true;
      } else {
        throw e;
      }
    } finally {
      if (fs.existsSync(tmpCsvPath)) {
        fs.unlinkSync(tmpCsvPath);
      }
    }
    expect(rolledBack).toBe(true);
  });
});
