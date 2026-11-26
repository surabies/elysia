/**
 * Service: PBPK (Pasang Baru & Pemasangan Kembali)
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM & Mutasi Pelanggan)
 *
 * Mengelola pendaftaran sambungan langganan baru (PB), pemasangan kembali (PK),
 * serta mutasi golongan tarif secara akurat per periode tanpa data sample fiktif.
 */

import { eq, desc, sql, and, asc } from 'drizzle-orm';
import {
  db,
  pelanggan,
  golonganTarif,
  ruteCater,
  waterMeter,
  daftarCatat,
  caterBacaMeter,
  periodePenagihan,
  getActivePeriode,
  nextPeriode,
  sambungKembaliPelanggan,
} from '@cater/db';

export interface InputPasangBaruDTO {
  nolg: string;
  nama: string;
  alamat: string;
  tarifKode: string;
  ruteKode: string;
  noMeter: string;
  noTelp?: string;
  jmlPenghuni?: number;
  standAwal?: number;
  periode?: string;
  userId: string;
}

export interface InputPerubahanKategoriDTO {
  nolg: string;
  tarifKodeBaru: string;
  noMeterBaru?: string;
  periode?: string;
  nomorSk?: string;
  alasan?: string;
  userId: string;
}

export interface SimpanBacaanPbpkItem {
  nolg: string;
  standAwal: number;
  standAkhir: number;
}

export interface SimpanBacaanPbpkDTO {
  periode: string;
  items: SimpanBacaanPbpkItem[];
  userId?: string;
}

export class PbpkService {
  /**
   * Mengambil rekapitulasi data PBPK (Pasang Baru & Pemasangan Kembali) riil pada periode target.
   * Mendukung alur nyata PDAM:
   * - PBPK bulan Oktober dicatat petugas di bulan November (muncul di periode 202611).
   * - PBPK bulan November yang diinput di tgl 29 (mis. 3 PB + 1 PK) masuk ke antrean DPM bulan depan (N+1 = 202612)
   *   tanpa menghambat penutupan buku bulan berjalan (202611).
   */
  async getRekapPbpk(periodeStr: string) {
    const periodeDepan = nextPeriode(periodeStr);

    // Hanya sinkronkan otomatis pelanggan baru yang MEMANG sudah memiliki bacaan di periodeStr (c.id IS NOT NULL)
    // agar antrean PBPK untuk bulan depan (N+1) tidak ketarik mundur ke periode berjalan.
    const [periodeInfo] = await db
      .select({ status: periodePenagihan.status })
      .from(periodePenagihan)
      .where(eq(periodePenagihan.periode, periodeStr));

    if (periodeInfo && periodeInfo.status !== 'TERKUNCI') {
      await db.execute(sql`
        INSERT INTO daftar_catat (
          id, periode, nolg, rute_kode, petugas_id, urutan,
          stand_awal, pakai_lalu, sumber, status, selesai_at, catatan, created_at, updated_at
        )
        SELECT
          'dpm-' || ${periodeStr} || '-' || p.nolg,
          ${periodeStr},
          p.nolg,
          COALESCE(c.rute_kode, p.rute_kode),
          c.petugas_id,
          COALESCE(NULLIF(p.no_urut_rute, 0), 999),
          COALESCE(c.stml, 0),
          COALESCE(c.pakai_lalu, 0),
          'PBPK',
          'DICATAT',
          c.tgl_catat,
          'Terdeteksi dari laporan baca meter ' || c.sumber_catat,
          p.created_at,
          NOW()
        FROM pelanggan p
        INNER JOIN cater_baca_meter c ON c.nolg = p.nolg AND c.thbl = ${periodeStr}
        LEFT JOIN daftar_catat dc ON dc.nolg = p.nolg AND dc.periode = ${periodeStr}
        WHERE dc.id IS NULL
          AND p.status != 'DICABUT'
        ON CONFLICT (periode, nolg) DO NOTHING
      `);
    }

    const [
      totalPelangganRes,
      dpmProgressRes,
      daftarPasangBaruRaw,
      pasangKembaliCountRes,
      antreanDepanRes,
      masterTarif,
      masterRute,
    ] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(pelanggan)
        .where(sql`${pelanggan.status} != 'DICABUT'`),
      db
        .select({
          totalDpmAktif: sql<number>`count(case when ${daftarCatat.status} != 'DICABUT' then 1 end)::int`,
          sudahDilaporkan: sql<number>`count(case when ${daftarCatat.status} = 'DICATAT' then 1 end)::int`,
          belumDilaporkan: sql<number>`count(case when ${daftarCatat.status} = 'BELUM_DICATAT' then 1 end)::int`,
        })
        .from(daftarCatat)
        .where(eq(daftarCatat.periode, periodeStr)),
      db
        .select({
          nolg: pelanggan.nolg,
          nama: pelanggan.nama,
          alamat: pelanggan.alamat,
          tarifKode: pelanggan.tarifKode,
          ruteKode: daftarCatat.ruteKode,
          noMeter: pelanggan.noMeter,
          noTelp: pelanggan.noTelp,
          statusDpm: daftarCatat.status,
          dpmStandAwal: daftarCatat.standAwal,
          catatanDpm: daftarCatat.catatan,
          stml: caterBacaMeter.stml,
          stma: caterBacaMeter.stma,
          pakaiM3: caterBacaMeter.pakaiM3,
          sumberCatat: caterBacaMeter.sumberCatat,
          createdAt: daftarCatat.createdAt,
        })
        .from(daftarCatat)
        .innerJoin(pelanggan, eq(daftarCatat.nolg, pelanggan.nolg))
        .leftJoin(
          caterBacaMeter,
          and(
            eq(caterBacaMeter.nolg, daftarCatat.nolg),
            eq(caterBacaMeter.thbl, daftarCatat.periode)
          )
        )
        .where(
          and(
            eq(daftarCatat.periode, periodeStr),
            sql`(${daftarCatat.sumber} = 'PBPK' OR ${daftarCatat.catatan} ILIKE '%Sambung kembali%')`
          )
        )
        .orderBy(desc(daftarCatat.createdAt), asc(pelanggan.nolg)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(daftarCatat)
        .where(
          and(
            eq(daftarCatat.periode, periodeStr),
            sql`${daftarCatat.catatan} ILIKE '%Sambung kembali%'`
          )
        ),
      db
        .select({
          pbCount: sql<number>`count(case when ${daftarCatat.sumber} = 'PBPK' and coalesce(${daftarCatat.catatan}, '') not ilike '%Sambung kembali%' then 1 end)::int`,
          pkCount: sql<number>`count(case when ${daftarCatat.catatan} ilike '%Sambung kembali%' then 1 end)::int`,
        })
        .from(daftarCatat)
        .where(
          and(
            eq(daftarCatat.periode, periodeDepan),
            sql`(${daftarCatat.sumber} = 'PBPK' OR ${daftarCatat.catatan} ILIKE '%Sambung kembali%')`
          )
        ),
      db
        .select({
          kode: golonganTarif.kode,
          nama: golonganTarif.nama,
        })
        .from(golonganTarif)
        .orderBy(asc(golonganTarif.kode)),
      db
        .select({
          kode: ruteCater.kode,
          nama: ruteCater.seksiNama,
        })
        .from(ruteCater)
        .orderBy(asc(ruteCater.kode))
        .limit(200),
    ]);

    const daftarPasangBaru = daftarPasangBaruRaw.map((item) => {
      const isPk = Boolean(
        item.catatanDpm && item.catatanDpm.toLowerCase().includes('sambung kembali')
      );
      return {
        nolg: item.nolg,
        nama: item.nama,
        alamat: item.alamat,
        tarifKode: item.tarifKode,
        ruteKode: item.ruteKode,
        noMeter: item.noMeter,
        noTelp: item.noTelp,
        mutasian: (isPk ? 'PK' : 'PB') as 'PB' | 'PK',
        statusDpm: item.statusDpm,
        dpmStandAwal: item.dpmStandAwal !== null ? Number(item.dpmStandAwal) : 0,
        stml: item.stml !== null ? Number(item.stml) : null,
        stma: item.stma !== null ? Number(item.stma) : null,
        pakaiM3: item.pakaiM3 !== null ? Number(item.pakaiM3) : null,
        sumberCatat: item.sumberCatat,
        createdAt: item.createdAt ? item.createdAt.toISOString() : '',
      };
    });

    const totalPbMurni = daftarPasangBaru.filter((x) => x.mutasian === 'PB').length;
    const totalPkMurni = pasangKembaliCountRes[0]?.count ?? 0;

    return {
      periode: periodeStr,
      periodeDepan,
      ringkasan: {
        totalMasterPelanggan: totalPelangganRes[0]?.count ?? 0,
        totalPasangBaru: totalPbMurni,
        totalPerubahanKategori: totalPkMurni,
        totalDpmAktif: dpmProgressRes[0]?.totalDpmAktif ?? 0,
        sudahDilaporkanPetugas: dpmProgressRes[0]?.sudahDilaporkan ?? 0,
        belumDilaporkanPetugas: dpmProgressRes[0]?.belumDilaporkan ?? 0,
        antreanPbDepan: antreanDepanRes[0]?.pbCount ?? 0,
        antreanPkDepan: antreanDepanRes[0]?.pkCount ?? 0,
        statusIntegrasiDpm:
          daftarPasangBaru.length > 0 ? 'TERDAFTAR_DI_DPM' : 'BELUM_ADA_MUTASI',
      },
      daftarPasangBaru,
      masterTarif,
      masterRute: masterRute.map((r) => ({
        kode: r.kode,
        nama: r.nama ?? `Rute ${r.kode}`,
      })),
    };
  }

  /**
   * Pendaftaran / Pembaruan Sambungan Baru (Pasang Baru - PB)
   * Mendukung:
   * 1) Input PBPK akhir bulan (tgl 29) ke periode N+1 sebelum file CSV aplikasi eksternal keluar
   * 2) Melengkapi nomor meter / alamat pelanggan PB yang terdeteksi lebih dulu dari LapDataMeter
   */
  async inputPasangBaru(data: InputPasangBaruDTO) {
    const {
      nolg,
      nama,
      alamat,
      tarifKode,
      ruteKode,
      noMeter,
      noTelp,
      jmlPenghuni,
      standAwal,
      periode,
    } = data;

    const activePeriode = await getActivePeriode();
    const targetPeriode = periode || nextPeriode(activePeriode);

    const [existing] = await db
      .select({ nolg: pelanggan.nolg })
      .from(pelanggan)
      .where(eq(pelanggan.nolg, nolg));

    await db.transaction(async (tx) => {
      await tx
        .insert(waterMeter)
        .values({
          noMeter,
          merk: 'ITR',
          ukuran: '1/2',
          tglPasang: new Date(),
          umurTahun: 0,
          umurBulan: 0,
          kondisi: 'Normal',
        })
        .onConflictDoNothing({ target: waterMeter.noMeter });

      const kelurahanKode = ruteKode.length >= 3 ? ruteKode.slice(0, 3).toUpperCase() : null;

      if (!existing) {
        const [maxUrutan] = await tx
          .select({
            maxUrut: sql<number>`coalesce(max(${pelanggan.noUrutRute}), 0)::int`,
          })
          .from(pelanggan)
          .where(eq(pelanggan.ruteKode, ruteKode));

        const urutanBerikutnya = (maxUrutan?.maxUrut ?? 0) + 1;

        await tx.insert(pelanggan).values({
          nolg,
          nama,
          alamat,
          tarifKode,
          ruteKode,
          kelurahanKode,
          noUrutRute: urutanBerikutnya,
          noMeter,
          noMeterAsli: noMeter,
          ukuranMeter: '1/2',
          noTelp: noTelp ?? null,
          jmlPenghuni: jmlPenghuni ?? 4,
          status: 'PELANGGAN AKTIF',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        const [periodeRow] = await tx
          .select({ status: periodePenagihan.status })
          .from(periodePenagihan)
          .where(eq(periodePenagihan.periode, targetPeriode));

        if (!periodeRow || periodeRow.status !== 'TERKUNCI') {
          await tx
            .insert(daftarCatat)
            .values({
              id: `dpm-${targetPeriode}-${nolg}`,
              periode: targetPeriode,
              nolg,
              ruteKode,
              urutan: urutanBerikutnya,
              standAwal: String(standAwal ?? 0),
              pakaiLalu: '0',
              sumber: 'PBPK',
              status: 'BELUM_DICATAT',
              catatan: 'Pasang Baru (PB) terdaftar ke DPM',
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [daftarCatat.periode, daftarCatat.nolg],
              set: {
                ruteKode,
                standAwal: String(standAwal ?? 0),
                sumber: 'PBPK',
                updatedAt: new Date(),
              },
            });
        }
      } else {
        // Jika NOLG sudah ada (mis. melengkapi No. Meter / Alamat PB dari LapDataMeter atau pembaruan pra-CSV)
        await tx
          .update(pelanggan)
          .set({
            nama,
            alamat,
            tarifKode,
            ruteKode,
            kelurahanKode: kelurahanKode ?? undefined,
            noMeter,
            noMeterAsli: noMeter,
            noTelp: noTelp ?? undefined,
            status: 'PELANGGAN AKTIF',
            updatedAt: new Date(),
          })
          .where(eq(pelanggan.nolg, nolg));

        const [periodeRow] = await tx
          .select({ status: periodePenagihan.status })
          .from(periodePenagihan)
          .where(eq(periodePenagihan.periode, targetPeriode));

        if (!periodeRow || periodeRow.status !== 'TERKUNCI') {
          const [existingReading] = await tx
            .select({ id: caterBacaMeter.id })
            .from(caterBacaMeter)
            .where(
              and(
                eq(caterBacaMeter.thbl, targetPeriode),
                eq(caterBacaMeter.nolg, nolg)
              )
            );

          await tx
            .insert(daftarCatat)
            .values({
              id: `dpm-${targetPeriode}-${nolg}`,
              periode: targetPeriode,
              nolg,
              ruteKode,
              urutan: 999,
              standAwal: String(standAwal ?? 0),
              pakaiLalu: '0',
              sumber: 'PBPK',
              status: existingReading ? 'DICATAT' : 'BELUM_DICATAT',
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [daftarCatat.periode, daftarCatat.nolg],
              set: {
                ruteKode,
                sumber: 'PBPK',
                updatedAt: new Date(),
              },
            });
        }
      }
    });

    return {
      success: true,
      nolg,
      periode: targetPeriode,
      message: existing
        ? `Data pelanggan PBPK ${nolg} (${nama}) berhasil dilengkapi dengan No. Meter ${noMeter} pada DPM ${targetPeriode}.`
        : `Sambungan Baru (PB) ${nolg} - ${nama} berhasil didaftarkan ke Master Pelanggan & antrean DPM periode ${targetPeriode}.`,
    };
  }

  /**
   * Pemasangan Kembali (PK) / Perubahan Kategori Tarif Pelanggan
   */
  async inputPerubahanKategori(data: InputPerubahanKategoriDTO) {
    const { nolg, tarifKodeBaru, noMeterBaru, periode, alasan } = data;

    const [cust] = await db
      .select({
        nolg: pelanggan.nolg,
        nama: pelanggan.nama,
        status: pelanggan.status,
        tarifKodeLama: pelanggan.tarifKode,
      })
      .from(pelanggan)
      .where(eq(pelanggan.nolg, nolg));

    if (!cust) {
      throw new Error(`Pelanggan dengan nomor ${nolg} tidak ditemukan.`);
    }

    const activePeriode = await getActivePeriode();
    const targetPeriode = periode || nextPeriode(activePeriode);

    if (noMeterBaru?.trim()) {
      const cleanMeter = noMeterBaru.trim();
      await db
        .insert(waterMeter)
        .values({
          noMeter: cleanMeter,
          merk: 'ITR',
          ukuran: '1/2',
          tglPasang: new Date(),
          umurTahun: 0,
          umurBulan: 0,
          kondisi: 'Normal',
        })
        .onConflictDoNothing({ target: waterMeter.noMeter });

      await db
        .update(pelanggan)
        .set({ noMeter: cleanMeter, noMeterAsli: cleanMeter, updatedAt: new Date() })
        .where(eq(pelanggan.nolg, nolg));
    }

    // Jika pelanggan sebelumnya DICABUT / NON AKTIF, aktifkan kembali melalui mekanisme resmi Sambung Kembali (PK)
    if (cust.status === 'DICABUT' || cust.status.includes('NON AKTIF')) {
      const catatanPk = alasan?.trim()
        ? `Sambung kembali (PK): ${alasan.trim()}`
        : `Sambung kembali (PK) terdaftar untuk periode ${targetPeriode}`;
      const reaktivasi = await sambungKembaliPelanggan({
        nolg,
        periodeAktif: targetPeriode,
        catatan: catatanPk,
      });
      if (tarifKodeBaru && cust.tarifKodeLama !== tarifKodeBaru) {
        await db
          .update(pelanggan)
          .set({ tarifKode: tarifKodeBaru, updatedAt: new Date() })
          .where(eq(pelanggan.nolg, nolg));
      }
      return {
        success: true,
        nolg,
        periode: reaktivasi.periode,
        tarifKodeLama: cust.tarifKodeLama,
        tarifKodeBaru,
        message: `Pemasangan Kembali (PK) pelanggan ${nolg} (${cust.nama}) berhasil diaktifkan ke DPM periode ${reaktivasi.periode} dengan stand awal ${reaktivasi.standAwal} m³.`,
      };
    }

    if (cust.tarifKodeLama === tarifKodeBaru) {
      throw new Error(
        `Pelanggan ${nolg} sudah aktif dan sudah berada pada golongan tarif ${tarifKodeBaru}.`
      );
    }

    await db
      .update(pelanggan)
      .set({
        tarifKode: tarifKodeBaru,
        updatedAt: new Date(),
      })
      .where(eq(pelanggan.nolg, nolg));

    return {
      success: true,
      nolg,
      tarifKodeLama: cust.tarifKodeLama,
      tarifKodeBaru,
      message: `Golongan tarif pelanggan ${nolg} (${cust.nama}) berhasil diperbarui dari ${cust.tarifKodeLama} menjadi ${tarifKodeBaru}.`,
    };
  }

  /**
   * Mencatat / memperbarui angka Stand Awal, Stand Akhir, dan Pemakaian (m³) untuk pelanggan PBPK
   * yang telah diimpor / didaftarkan sehingga langsung tercatat di `cater_baca_meter` dan `daftar_catat = DICATAT`.
   */
  async simpanBacaanPbpk(data: SimpanBacaanPbpkDTO) {
    const { periode, items } = data;
    if (!items || items.length === 0) {
      throw new Error('Tidak ada data stand meter PBPK yang dikirim.');
    }

    const [periodeRow] = await db
      .select({ status: periodePenagihan.status })
      .from(periodePenagihan)
      .where(eq(periodePenagihan.periode, periode));

    if (periodeRow?.status === 'TERKUNCI') {
      throw new Error(
        `Periode ${periode} sudah terkunci. Angka stand PBPK tidak dapat diubah pada periode yang telah ditutup.`
      );
    }

    for (const item of items) {
      if (Number.isNaN(item.standAwal) || item.standAwal < 0) {
        throw new Error(`Stand awal pelanggan ${item.nolg} tidak valid.`);
      }
      if (Number.isNaN(item.standAkhir) || item.standAkhir < item.standAwal) {
        throw new Error(
          `Stand akhir (${item.standAkhir}) pada pelanggan ${item.nolg} tidak boleh lebih kecil dari stand awal (${item.standAwal}).`
        );
      }
    }

    let tersimpan = 0;

    await db.transaction(async (tx) => {
      for (const item of items) {
        const cleanNolg = item.nolg.trim();
        const [cust] = await tx
          .select({
            nolg: pelanggan.nolg,
            ruteKode: pelanggan.ruteKode,
            noUrutRute: pelanggan.noUrutRute,
            pencatatDefault: ruteCater.pencatatDefault,
          })
          .from(pelanggan)
          .leftJoin(ruteCater, eq(pelanggan.ruteKode, ruteCater.kode))
          .where(eq(pelanggan.nolg, cleanNolg));

        if (!cust) {
          throw new Error(`Pelanggan ${cleanNolg} tidak ditemukan di master pelanggan.`);
        }

        const pakaiM3 = Math.max(
          0,
          Number((item.standAkhir - item.standAwal).toFixed(2))
        );
        const now = new Date();

        // 1. Upsert bacaan meter ke cater_baca_meter (siap ditagih ke rekening DRD)
        await tx
          .insert(caterBacaMeter)
          .values({
            id: `cater-${periode}-${cleanNolg}`,
            thbl: periode,
            nolg: cleanNolg,
            ruteKode: cust.ruteKode,
            petugasId: cust.pencatatDefault ?? null,
            stml: String(item.standAwal),
            stma: String(item.standAkhir),
            pakaiM3: String(pakaiM3),
            pakaiTagih: String(pakaiM3),
            pakaiLalu: '0',
            tmss: '-',
            ketCatat: 'Normal',
            metodeCatat: 'OFFSITE',
            sumberCatat: 'PBPK_CLOSING',
            statusVerifikasi: 'APPROVED_FINAL',
            tglCatat: now,
            catatan: `Input Stand PBPK (${item.standAwal} -> ${item.standAkhir} = ${pakaiM3} m³)`,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [caterBacaMeter.thbl, caterBacaMeter.nolg],
            set: {
              stml: String(item.standAwal),
              stma: String(item.standAkhir),
              pakaiM3: String(pakaiM3),
              pakaiM3Revisi: null,
              pakaiTagih: String(pakaiM3),
              statusVerifikasi: 'APPROVED_FINAL',
              tglCatat: now,
              catatan: `Input Stand PBPK (${item.standAwal} -> ${item.standAkhir} = ${pakaiM3} m³)`,
              updatedAt: now,
            },
          });

        // 2. Pastikan daftar_catat berstatus DICATAT dengan sumber PBPK
        await tx
          .insert(daftarCatat)
          .values({
            id: `dpm-${periode}-${cleanNolg}`,
            periode,
            nolg: cleanNolg,
            ruteKode: cust.ruteKode,
            petugasId: cust.pencatatDefault ?? null,
            urutan: cust.noUrutRute && cust.noUrutRute > 0 ? cust.noUrutRute : 999,
            standAwal: String(item.standAwal),
            pakaiLalu: '0',
            sumber: 'PBPK',
            status: 'DICATAT',
            selesaiAt: now,
            catatan: `Stand PBPK tercatat (${pakaiM3} m³)`,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [daftarCatat.periode, daftarCatat.nolg],
            set: {
              standAwal: String(item.standAwal),
              status: 'DICATAT',
              selesaiAt: now,
              updatedAt: now,
            },
          });

        tersimpan++;
      }
    });

    return {
      success: true,
      tersimpan,
      periode,
      message: `Berhasil menyimpan angka stand & pemakaian untuk ${tersimpan} pelanggan PBPK pada periode ${periode} (siap masuk tagihan DRD).`,
    };
  }
}

export const pbpkService = new PbpkService();
