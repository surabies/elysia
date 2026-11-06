/**
 * Service: Pengaduan Air & Layanan Pengaduan Pelanggan
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM, Domain Engine, & Transaksi DB)
 */

import { eq, desc, and, like, sql } from 'drizzle-orm';
import {
  db,
  pengaduan,
  riwayatPengaduan,
  pelanggan,
  type PengaduanRow,
  type RiwayatPengaduanRow,
} from '@cater/db';
import {
  generateNomorTiket,
  isTransisiSah,
  hitungTargetSla,
  evaluasiPembuatanTiket,
} from '../../domain/pengaduan/alur-pengaduan.engine';
import type {
  JenisPengaduan,
  KlasifikasiPengaduan,
  PrioritasPengaduan,
  StatusPengaduan,
} from '@cater/types';

export interface CreatePengaduanInput {
  clientRequestId?: string;
  nomorLangganan?: string;
  klasifikasi?: KlasifikasiPengaduan;
  jenis: JenisPengaduan;
  judul: string;
  deskripsi: string;
  koordinat?: { x: number; y: number } | null;
  alamatKejadian?: string;
  prioritas?: PrioritasPengaduan;
  pelapor: string;
  kontakPelapor?: string;
  fotoUrl?: string;
  videoUrl?: string;
}

export interface UbahStatusPengaduanInput {
  pengaduanId: string;
  statusKe: StatusPengaduan;
  catatan?: string;
  fotoPenyelesaianUrl?: string;
  petugasId: string;
}

export interface TugaskanPengaduanInput {
  pengaduanId: string;
  ditugaskanKeId: string;
  catatan?: string;
  petugasId: string;
}

export class PengaduanService {
  /**
   * 1. Membuat Pengaduan Baru (Publik maupun Internal Kantor)
   */
  async createPengaduan(input: CreatePengaduanInput) {
    // Validasi aturan bisnis domain engine
    const validasi = evaluasiPembuatanTiket({
      jenis: input.jenis,
      koordinat: input.koordinat,
      pelapor: input.pelapor,
    });

    if (!validasi.valid) {
      throw new Error(validasi.pesanError);
    }

    // Idempotensi: Jika clientRequestId sudah ada, kembalikan tiket yang sama
    if (input.clientRequestId) {
      const [existing] = await db
        .select()
        .from(pengaduan)
        .where(eq(pengaduan.clientRequestId, input.clientRequestId));
      if (existing) {
        return existing;
      }
    }

    // Resolusi Kode Wilayah Pelayanan (2 Digit)
    let wilayah = '00';
    if (input.nomorLangganan) {
      const [cust] = await db
        .select({ ruteKode: pelanggan.ruteKode })
        .from(pelanggan)
        .where(eq(pelanggan.nolg, input.nomorLangganan));
      if (cust?.ruteKode) {
        const match = cust.ruteKode.match(/\d+/);
        if (match) {
          wilayah = match[0].slice(0, 2).padStart(2, '0');
        }
      }
    }

    const prioritas = input.prioritas ?? 'NORMAL';
    const sla = hitungTargetSla(prioritas);

    return db.transaction(async (tx) => {
      // Hitung nomor urut harian per wilayah untuk format [KODE][WILAYAH][TANGGAL][URUT]
      const tgl = new Date();
      const wibTime = new Date(tgl.getTime() + 7 * 60 * 60 * 1000);
      const yy = String(wibTime.getUTCFullYear()).slice(-2);
      const mm = String(wibTime.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(wibTime.getUTCDate()).padStart(2, '0');
      const tanggalStr = `${yy}${mm}${dd}`;

      const prefix = `TK${wilayah}${tanggalStr}`;
      const [cnt] = await tx
        .select({ total: sql<number>`count(*)::int` })
        .from(pengaduan)
        .where(like(pengaduan.nomorTiket, `${prefix}%`));
      const urut = (cnt?.total ?? 0) + 1;

      const nomorTiket = generateNomorTiket({
        kode: 'TK',
        wilayah,
        tanggal: tgl,
        urut,
      });

      const [row] = await tx
        .insert(pengaduan)
        .values({
          nomorTiket,
          clientRequestId: input.clientRequestId,
          nomorLangganan: input.nomorLangganan,
          pelangganId: input.nomorLangganan,
          klasifikasi: input.klasifikasi ?? 'BUKAN_NILAI_TAGIHAN_REKENING',
          jenis: input.jenis,
          judul: input.judul.trim(),
          deskripsi: input.deskripsi.trim(),
          koordinat: input.koordinat,
          alamatKejadian: input.alamatKejadian,
          prioritas,
          status: 'BARU',
          pelapor: input.pelapor.trim(),
          kontakPelapor: input.kontakPelapor,
          fotoUrl: input.fotoUrl,
          videoUrl: input.videoUrl,
          targetResponsAt: sla.targetResponsAt,
          targetSelesaiAt: sla.targetSelesaiAt,
        })
        .returning();

      // Catat baris linimasa pertama
      await tx.insert(riwayatPengaduan).values({
        pengaduanId: row.id,
        aksi: 'DIBUAT',
        statusKe: 'BARU',
        catatan: 'Pengaduan berhasil didaftarkan oleh pelapor.',
        isPublik: true,
      });

      return row;
    });
  }

  /**
   * 2. Detail Pengaduan dan Linimasa Riwayat
   */
  async getDetailPengaduan(nomorTiket: string, isInternal: boolean = false) {
    const [row] = await db
      .select()
      .from(pengaduan)
      .where(eq(pengaduan.nomorTiket, nomorTiket));

    if (!row) {
      throw new Error(`Tiket pengaduan ${nomorTiket} tidak ditemukan.`);
    }

    // Ambil linimasa
    const linimasaQuery = db
      .select()
      .from(riwayatPengaduan)
      .where(
        isInternal
          ? eq(riwayatPengaduan.pengaduanId, row.id)
          : and(
              eq(riwayatPengaduan.pengaduanId, row.id),
              eq(riwayatPengaduan.isPublik, true)
            )
      )
      .orderBy(desc(riwayatPengaduan.createdAt));

    const linimasa = await linimasaQuery;

    return {
      pengaduan: row,
      linimasa,
    };
  }

  /**
   * 3. Penugasan Petugas Lapangan (BARU/TERVERIFIKASI -> DITUGASKAN)
   */
  async tugaskanPengaduan(input: TugaskanPengaduanInput) {
    const [row] = await db
      .select()
      .from(pengaduan)
      .where(eq(pengaduan.id, input.pengaduanId));

    if (!row) {
      throw new Error(`Pengaduan dengan ID ${input.pengaduanId} tidak ditemukan.`);
    }

    if (!isTransisiSah(row.status as StatusPengaduan, 'DITUGASKAN')) {
      throw new Error(`Tidak dapat menugaskan tiket yang berada pada status ${row.status}.`);
    }

    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(pengaduan)
        .set({
          status: 'DITUGASKAN',
          ditugaskanKeId: input.ditugaskanKeId,
          ditanganiMulai: new Date(),
          responsAt: row.responsAt ?? new Date(),
          updatedAt: new Date(),
        })
        .where(eq(pengaduan.id, input.pengaduanId))
        .returning();

      await tx.insert(riwayatPengaduan).values({
        pengaduanId: row.id,
        aksi: 'DITUGASKAN',
        statusDari: row.status as StatusPengaduan,
        statusKe: 'DITUGASKAN',
        petugasId: input.petugasId,
        catatan: input.catatan ?? 'Tiket ditugaskan ke petugas lapangan.',
        isPublik: true,
      });

      return updated;
    });
  }

  /**
   * 4. Transisi Status Pengaduan (State Machine Transition)
   */
  async ubahStatusPengaduan(input: UbahStatusPengaduanInput) {
    const [row] = await db
      .select()
      .from(pengaduan)
      .where(eq(pengaduan.id, input.pengaduanId));

    if (!row) {
      throw new Error(`Pengaduan dengan ID ${input.pengaduanId} tidak ditemukan.`);
    }

    const statusDari = row.status as StatusPengaduan;
    const statusKe = input.statusKe;

    if (!isTransisiSah(statusDari, statusKe)) {
      throw new Error(
        `Transisi status tidak diizinkan: dari '${statusDari}' ke '${statusKe}'.`
      );
    }

    // Jika ke SELESAI, foto penyelesaian atau catatan sangat disarankan
    if (statusKe === 'SELESAI' && !input.fotoPenyelesaianUrl && !input.catatan) {
      throw new Error('Penyelesaian tiket wajib menyertakan foto bukti atau catatan pekerjaan.');
    }

    return db.transaction(async (tx) => {
      const updateData: Partial<PengaduanRow> = {
        status: statusKe,
        updatedAt: new Date(),
      };

      if (statusKe === 'SELESAI') {
        updateData.selesaiAt = new Date();
        updateData.catatanPenyelesaian = input.catatan;
        updateData.fotoPenyelesaianUrl = input.fotoPenyelesaianUrl;
      }

      const [updated] = await tx
        .update(pengaduan)
        .set(updateData)
        .where(eq(pengaduan.id, input.pengaduanId))
        .returning();

      await tx.insert(riwayatPengaduan).values({
        pengaduanId: row.id,
        aksi: 'STATUS_DIUBAH',
        statusDari,
        statusKe,
        petugasId: input.petugasId,
        catatan: input.catatan,
        fotoUrl: input.fotoPenyelesaianUrl,
        isPublik: true,
      });

      return updated;
    });
  }

  /**
   * 5. Pelapor Memberi Penilaian Kepuasan (Rating 1 - 5)
   */
  async beriRating(nomorTiket: string, rating: number, komentar?: string) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating kepuasan harus berada pada rentang 1 hingga 5.');
    }

    const [row] = await db
      .select()
      .from(pengaduan)
      .where(eq(pengaduan.nomorTiket, nomorTiket));

    if (!row) {
      throw new Error(`Tiket ${nomorTiket} tidak ditemukan.`);
    }

    if (row.status !== 'SELESAI' && row.status !== 'DITUTUP') {
      throw new Error('Rating hanya dapat diberikan pada pengaduan yang telah berstatus SELESAI.');
    }

    await db
      .update(pengaduan)
      .set({
        ratingKepuasan: rating,
        komentarKepuasan: komentar,
        ratingAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(pengaduan.id, row.id));

    return {
      nomorTiket,
      ratingKepuasan: rating,
      message: 'Terima kasih atas penilaian Anda terhadap layanan kami.',
    };
  }
}

export const pengaduanService = new PengaduanService();
