/**
 * Service: Mutasi Rute & Penggabungan Rute Pelanggan
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM Transaksional)
 */

import { eq, sql, inArray, desc, and } from 'drizzle-orm';
import {
  db,
  pelanggan,
  ruteCater,
  petugasCater,
  zonaDistribusi,
  mutasiRute,
  type MutasiRute,
} from '@cater/db';

export interface OpsiItem {
  value: string;
  label: string;
}

export interface PelangganRuteItem {
  urut: number;
  noPel: string;
  nama: string;
  alamat: string;
  golTarif: string;
  wilayah: string;
  rute: string;
  tglPasang: string;
}

export interface PosisiRute {
  wil: string;
  rute: string;
  urut: number;
}

export interface RiwayatMutasiItem {
  id: string;
  tglInput: string;
  noPel: string;
  nama: string;
  kodeWilayah: string;
  tglPasang: string;
  baru: PosisiRute;
  lama: PosisiRute;
  inputBy: string;
}

export interface MutasiPelangganInput {
  noPel: string;
  wilayahId: string;
  ruteKode: string;
  noUrut: number;
  zona?: string;
}

export interface PenggabunganRuteInput {
  noPelList: string[];
  ruteTujuan: string;
}

export class MutasiRuteService {
  /**
   * Mengambil daftar wilayah administratif / seksi rute
   */
  async getWilayahOpsi(): Promise<OpsiItem[]> {
    const list = await db
      .select({
        kode: ruteCater.seksiKode,
        nama: ruteCater.seksiNama,
      })
      .from(ruteCater)
      .where(sql`${ruteCater.seksiKode} IS NOT NULL`)
      .groupBy(ruteCater.seksiKode, ruteCater.seksiNama)
      .orderBy(ruteCater.seksiKode);

    if (list.length === 0) {
      return ['WP 1', 'WP 2', 'WP 3', 'WP 4', 'WP 5'].map((w) => ({ value: w, label: w }));
    }

    return list.map((item) => ({
      value: item.kode || 'UMUM',
      label: item.nama ? `${item.kode} · ${item.nama}` : (item.kode || 'Wilayah Umum'),
    }));
  }

  /**
   * Mengambil daftar zona distribusi teknis
   */
  async getZonaOpsi(): Promise<OpsiItem[]> {
    const list = await db
      .select({
        kode: zonaDistribusi.kode,
        nama: zonaDistribusi.nama,
      })
      .from(zonaDistribusi)
      .orderBy(zonaDistribusi.kode);

    if (list.length === 0) {
      return [1, 2, 3, 4].map((n) => ({ value: `Zona ${n}`, label: `Zona ${n}` }));
    }

    return list.map((z) => ({
      value: z.kode,
      label: z.nama ? `${z.kode} · ${z.nama}` : z.kode,
    }));
  }

  /**
   * Mengambil daftar petugas per wilayah
   */
  async getPetugasOpsi(wilayahId?: string): Promise<OpsiItem[]> {
    // Ambil petugas aktif
    const list = await db
      .select({
        id: petugasCater.id,
        nama: petugasCater.nama,
      })
      .from(petugasCater)
      .where(eq(petugasCater.aktif, true))
      .orderBy(petugasCater.nama);

    // Jika ada wilayahId dan rute terikat ke wilayah tersebut
    if (wilayahId && wilayahId !== 'ALL') {
      const routesInWil = await db
        .select({ pencatatDefault: ruteCater.pencatatDefault })
        .from(ruteCater)
        .where(
          and(
            eq(ruteCater.seksiKode, wilayahId),
            sql`${ruteCater.pencatatDefault} IS NOT NULL`
          )
        );

      const petugasIds = new Set(
        routesInWil.map((r) => r.pencatatDefault).filter(Boolean) as string[]
      );

      if (petugasIds.size > 0) {
        return list
          .filter((p) => petugasIds.has(p.id))
          .map((p) => ({ value: p.id, label: p.nama }));
      }
    }

    return list.map((p) => ({ value: p.id, label: p.nama }));
  }

  /**
   * Mengambil daftar rute milik petugas tertentu
   */
  async getRuteByPetugas(petugasId: string): Promise<OpsiItem[]> {
    const list = await db
      .select({
        kode: ruteCater.kode,
        seksiNama: ruteCater.seksiNama,
      })
      .from(ruteCater)
      .where(eq(ruteCater.pencatatDefault, petugasId))
      .orderBy(ruteCater.noUrut, ruteCater.kode);

    return list.map((r) => ({
      value: r.kode,
      label: r.seksiNama ? `${r.kode} · ${r.seksiNama}` : r.kode,
    }));
  }

  /**
   * Mengambil daftar rute tujuan transfer (selain rute tertentu)
   */
  async getRuteTujuan(kecuali?: string): Promise<OpsiItem[]> {
    const [routes, listPetugas] = await Promise.all([
      db.select().from(ruteCater).orderBy(ruteCater.kode),
      db.select({ id: petugasCater.id, nama: petugasCater.nama }).from(petugasCater),
    ]);

    const petMap = new Map(listPetugas.map((p) => [p.id, p.nama]));

    const filtered = kecuali ? routes.filter((r) => r.kode !== kecuali) : routes;

    return filtered.map((r) => {
      const petName = r.pencatatDefault ? petMap.get(r.pencatatDefault) ?? r.pencatatDefault : 'Belum Ditugaskan';
      return {
        value: r.kode,
        label: `${r.kode} · ${petName}`,
      };
    });
  }

  /**
   * Mengambil daftar pelanggan di suatu rute
   */
  async getPelangganByRute(ruteKode: string): Promise<PelangganRuteItem[]> {
    const [ruteInfo] = await db
      .select({
        kode: ruteCater.kode,
        seksiNama: ruteCater.seksiNama,
        seksiKode: ruteCater.seksiKode,
      })
      .from(ruteCater)
      .where(eq(ruteCater.kode, ruteKode));

    const wilLabel = ruteInfo?.seksiNama || ruteInfo?.seksiKode || 'Wilayah PDAM';

    const list = await db
      .select({
        nolg: pelanggan.nolg,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        tarifKode: pelanggan.tarifKode,
        ruteKode: pelanggan.ruteKode,
        noUrutRute: pelanggan.noUrutRute,
        tglPasangMeter: pelanggan.tglPasangMeter,
      })
      .from(pelanggan)
      .where(eq(pelanggan.ruteKode, ruteKode))
      .orderBy(pelanggan.noUrutRute, pelanggan.nolg);

    return list.map((p) => ({
      urut: p.noUrutRute ?? 1,
      noPel: p.nolg,
      nama: p.nama,
      alamat: p.alamat || '-',
      golTarif: p.tarifKode || 'R2',
      wilayah: wilLabel,
      rute: p.ruteKode || ruteKode,
      tglPasang: p.tglPasangMeter
        ? new Date(p.tglPasangMeter).toISOString().slice(0, 10)
        : '2026-01-01',
    }));
  }

  /**
   * Mencari detail satu pelanggan berdasarkan nomor pelanggan (nolg)
   */
  async cariPelanggan(noPel: string): Promise<PelangganRuteItem | null> {
    const cleanNoPel = noPel.trim();

    const [found] = await db
      .select({
        nolg: pelanggan.nolg,
        nama: pelanggan.nama,
        alamat: pelanggan.alamat,
        tarifKode: pelanggan.tarifKode,
        ruteKode: pelanggan.ruteKode,
        noUrutRute: pelanggan.noUrutRute,
        tglPasangMeter: pelanggan.tglPasangMeter,
      })
      .from(pelanggan)
      .where(eq(pelanggan.nolg, cleanNoPel));

    if (!found) return null;

    let wilLabel = 'Wilayah PDAM';
    if (found.ruteKode) {
      const [r] = await db
        .select({ seksiNama: ruteCater.seksiNama, seksiKode: ruteCater.seksiKode })
        .from(ruteCater)
        .where(eq(ruteCater.kode, found.ruteKode));
      if (r) {
        wilLabel = r.seksiNama || r.seksiKode || 'Wilayah PDAM';
      }
    }

    return {
      urut: found.noUrutRute ?? 1,
      noPel: found.nolg,
      nama: found.nama,
      alamat: found.alamat || '-',
      golTarif: found.tarifKode || 'R2',
      wilayah: wilLabel,
      rute: found.ruteKode || '-',
      tglPasang: found.tglPasangMeter
        ? new Date(found.tglPasangMeter).toISOString().slice(0, 10)
        : '2026-01-01',
    };
  }

  /**
   * Menjalankan mutasi satu pelanggan ke rute dan nomor urut baru dalam 1 transaksi
   */
  async mutasiPelanggan(
    input: MutasiPelangganInput,
    user: { id: string; name?: string }
  ): Promise<RiwayatMutasiItem> {
    const { noPel, wilayahId, ruteKode, noUrut, zona } = input;

    if (!noPel || !ruteKode || !noUrut || noUrut < 1) {
      throw { status: 422, message: 'Nomor pelanggan, rute baru, dan nomor urut minimal 1 wajib diisi.' };
    }

    const cleanRuteBaru = ruteKode.trim().toUpperCase();

    // 1. Verifikasi rute tujuan ada di database
    const [ruteTujuan] = await db
      .select()
      .from(ruteCater)
      .where(eq(ruteCater.kode, cleanRuteBaru));

    if (!ruteTujuan) {
      throw { status: 404, message: `Rute tujuan ${cleanRuteBaru} tidak ditemukan dalam sistem.` };
    }

    const operatorName = user.name || user.id || 'SUPERVISOR';

    // 2. Transaksi Mutasi dengan Row-Level Lock
    return await db.transaction(async (tx) => {
      // Lock baris pelanggan
      const [targetPelanggan] = await tx
        .select()
        .from(pelanggan)
        .where(eq(pelanggan.nolg, noPel.trim()))
        .for('update');

      if (!targetPelanggan) {
        throw { status: 404, message: `Pelanggan dengan nomor ${noPel} tidak ditemukan.` };
      }

      const ruteLama = targetPelanggan.ruteKode || '-';
      const urutLama = targetPelanggan.noUrutRute || 1;

      // Ambil label wilayah lama
      let wilayahLama = 'Wilayah Asal';
      if (ruteLama && ruteLama !== '-') {
        const [rLama] = await tx
          .select({ seksiNama: ruteCater.seksiNama, seksiKode: ruteCater.seksiKode })
          .from(ruteCater)
          .where(eq(ruteCater.kode, ruteLama));
        if (rLama) {
          wilayahLama = rLama.seksiNama || rLama.seksiKode || 'Wilayah Asal';
        }
      }

      const wilayahBaru = ruteTujuan.seksiNama || ruteTujuan.seksiKode || wilayahId || 'Wilayah Baru';

      // Validasi tidak ada perubahan posisi
      if (ruteLama === cleanRuteBaru && urutLama === noUrut) {
        throw {
          status: 409,
          message: 'Rute dan nomor urut tujuan persis sama dengan posisi saat ini (tidak ada perubahan).',
        };
      }

      // Shifting sekuensial jika nomor urut sudah terisi di rute tujuan
      await tx
        .update(pelanggan)
        .set({
          noUrutRute: sql`${pelanggan.noUrutRute} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(pelanggan.ruteKode, cleanRuteBaru),
            sql`${pelanggan.noUrutRute} >= ${noUrut}`
          )
        );

      // Pindahkan pelanggan target
      await tx
        .update(pelanggan)
        .set({
          ruteKode: cleanRuteBaru,
          noUrutRute: noUrut,
          updatedAt: new Date(),
        })
        .where(eq(pelanggan.nolg, noPel.trim()));

      const tglInputStr = new Date().toISOString().slice(0, 10);
      const tglPasangStr = targetPelanggan.tglPasangMeter
        ? new Date(targetPelanggan.tglPasangMeter).toISOString().slice(0, 10)
        : tglInputStr;

      // Insert ke tabel audit log mutasi_rute
      const [insertedLog] = await tx
        .insert(mutasiRute)
        .values({
          batchId: crypto.randomUUID(),
          tipe: 'mutasi',
          nolg: targetPelanggan.nolg,
          namaPelanggan: targetPelanggan.nama,
          tglPasang: tglPasangStr,
          wilayahLama,
          ruteLama: ruteLama === '-' ? cleanRuteBaru : ruteLama,
          urutLama,
          wilayahBaru,
          ruteBaru: cleanRuteBaru,
          urutBaru: noUrut,
          zonaBaru: zona || null,
          inputBy: operatorName,
        })
        .returning();

      return {
        id: insertedLog.id,
        tglInput: tglInputStr,
        noPel: targetPelanggan.nolg,
        nama: targetPelanggan.nama,
        kodeWilayah: wilayahBaru,
        tglPasang: tglPasangStr,
        baru: { wil: wilayahBaru, rute: cleanRuteBaru, urut: noUrut },
        lama: { wil: wilayahLama, rute: ruteLama, urut: urutLama },
        inputBy: operatorName,
      };
    });
  }

  /**
   * Menggabungkan atau memindahkan sejumlah pelanggan sekaligus ke rute tujuan
   */
  async penggabunganRute(
    input: PenggabunganRuteInput,
    user: { id: string; name?: string }
  ): Promise<{
    success: boolean;
    totalDipindahkan: number;
    ruteTujuan: string;
    batchId: string;
  }> {
    const { noPelList, ruteTujuan } = input;

    if (!noPelList || noPelList.length === 0) {
      throw { status: 422, message: 'Daftar nomor pelanggan yang akan dipindahkan tidak boleh kosong.' };
    }

    if (noPelList.length > 500) {
      throw { status: 422, message: 'Maksimal 500 pelanggan dalam satu kali proses penggabungan rute.' };
    }

    const cleanRuteTujuan = ruteTujuan.trim().toUpperCase();

    // 1. Verifikasi rute tujuan ada
    const [targetRute] = await db
      .select()
      .from(ruteCater)
      .where(eq(ruteCater.kode, cleanRuteTujuan));

    if (!targetRute) {
      throw { status: 404, message: `Rute tujuan ${cleanRuteTujuan} tidak ditemukan.` };
    }

    const operatorName = user.name || user.id || 'SUPERVISOR';
    const batchId = crypto.randomUUID();

    // 2. Jalankan transaksi penggabungan
    return await db.transaction(async (tx) => {
      // Lock semua baris pelanggan yang dipilih
      const listPelanggan = await tx
        .select()
        .from(pelanggan)
        .where(inArray(pelanggan.nolg, noPelList))
        .for('update');

      if (listPelanggan.length === 0) {
        throw { status: 404, message: 'Tidak ada data pelanggan yang cocok dengan daftar nomor pelanggan.' };
      }

      // Validasi semua pelanggan berasal dari rute asal yang sama
      const ruteAsalSet = new Set(listPelanggan.map((p) => p.ruteKode));
      if (ruteAsalSet.size > 1) {
        throw {
          status: 422,
          message: 'Seluruh pelanggan yang digabungkan harus berasal dari rute yang sama.',
        };
      }

      const ruteAsal = Array.from(ruteAsalSet)[0] || '';
      if (ruteAsal === cleanRuteTujuan) {
        throw {
          status: 409,
          message: 'Rute tujuan tidak boleh sama dengan rute asal.',
        };
      }

      // Ambil wilayah asal
      let wilayahAsal = 'Wilayah Asal';
      if (ruteAsal) {
        const [rAsal] = await tx
          .select({ seksiNama: ruteCater.seksiNama, seksiKode: ruteCater.seksiKode })
          .from(ruteCater)
          .where(eq(ruteCater.kode, ruteAsal));
        if (rAsal) {
          wilayahAsal = rAsal.seksiNama || rAsal.seksiKode || 'Wilayah Asal';
        }
      }

      const wilayahTujuan = targetRute.seksiNama || targetRute.seksiKode || 'Wilayah Tujuan';

      // Cari nomor urut maksimum di rute tujuan
      const [maxUrutRow] = await tx
        .select({
          maxUrut: sql<number>`COALESCE(MAX(${pelanggan.noUrutRute}), 0)::int`,
        })
        .from(pelanggan)
        .where(eq(pelanggan.ruteKode, cleanRuteTujuan));

      let currentUrut = maxUrutRow?.maxUrut ?? 0;

      // Urutkan pelanggan sesuai urutan lama mereka agar sekuensial tetap terjaga
      const sortedPelanggan = [...listPelanggan].sort(
        (a, b) => (a.noUrutRute ?? 0) - (b.noUrutRute ?? 0)
      );

      const logsToInsert = [];

      for (const p of sortedPelanggan) {
        currentUrut += 1;

        // Update pelanggan ke rute dan nomor urut baru
        await tx
          .update(pelanggan)
          .set({
            ruteKode: cleanRuteTujuan,
            noUrutRute: currentUrut,
            updatedAt: new Date(),
          })
          .where(eq(pelanggan.nolg, p.nolg));

        const tglPasangStr = p.tglPasangMeter
          ? new Date(p.tglPasangMeter).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10);

        logsToInsert.push({
          batchId,
          tipe: 'penggabungan',
          nolg: p.nolg,
          namaPelanggan: p.nama,
          tglPasang: tglPasangStr,
          wilayahLama: wilayahAsal,
          ruteLama: ruteAsal || cleanRuteTujuan,
          urutLama: p.noUrutRute ?? 1,
          wilayahBaru: wilayahTujuan,
          ruteBaru: cleanRuteTujuan,
          urutBaru: currentUrut,
          zonaBaru: null,
          inputBy: operatorName,
        });
      }

      // Batch insert ke mutasi_rute
      if (logsToInsert.length > 0) {
        await tx.insert(mutasiRute).values(logsToInsert);
      }

      return {
        success: true,
        totalDipindahkan: sortedPelanggan.length,
        ruteTujuan: cleanRuteTujuan,
        batchId,
      };
    });
  }

  /**
   * Mengambil riwayat mutasi dan penggabungan rute terbaru
   */
  async getRiwayat(limit = 50, cursor?: string): Promise<RiwayatMutasiItem[]> {
    const list = await db
      .select()
      .from(mutasiRute)
      .orderBy(desc(mutasiRute.createdAt))
      .limit(limit);

    return list.map((item) => ({
      id: item.id,
      tglInput: item.createdAt ? new Date(item.createdAt).toISOString().slice(0, 10) : '',
      noPel: item.nolg,
      nama: item.namaPelanggan,
      kodeWilayah: item.wilayahBaru,
      tglPasang: item.tglPasang || '',
      baru: {
        wil: item.wilayahBaru,
        rute: item.ruteBaru,
        urut: item.urutBaru,
      },
      lama: {
        wil: item.wilayahLama,
        rute: item.ruteLama,
        urut: item.urutLama,
      },
      inputBy: item.inputBy,
    }));
  }
}

export const mutasiRuteService = new MutasiRuteService();
