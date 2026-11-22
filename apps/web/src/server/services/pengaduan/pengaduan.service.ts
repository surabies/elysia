/**
 * Service: Pengaduan Air & Layanan Pengaduan Pelanggan
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM, Domain Engine, & Transaksi DB)
 */

import { eq, desc, and, like, sql, inArray, ilike, or, count, ne, isNotNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  db,
  pengaduan,
  riwayatPengaduan,
  pengaduanNomorUrut,
  pelanggan,
  user,
  userRoles,
  type PengaduanRow,
  type RiwayatPengaduanRow,
} from '@cater/db';
import {
  generateNomorTiket,
  isTransisiSah,
  hitungTargetSla,
  evaluasiPembuatanTiket,
  ringkasSla,
  TRANSISI_PENGADUAN,
  KODE_JENIS_PENGADUAN,
  LABEL_JENIS_PENGADUAN,
} from '../../domain/pengaduan/alur-pengaduan.engine';
import { JENIS_PENGADUAN_PETA_PUBLIK } from '../../domain/pengaduan/pengaduan.config';
import { isCloudinaryConfigured, uploadToCloudinary } from '../../lib/cloudinary';
import type {
  JenisPengaduan,
  KlasifikasiPengaduan,
  PrioritasPengaduan,
  StatusPengaduan,
  AppRole,
} from '@cater/types';

export interface CreatePengaduanInput {
  clientRequestId?: string;
  nomorLangganan?: string;
  klasifikasi?: KlasifikasiPengaduan;
  jenis: JenisPengaduan;
  judul?: string;
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
  petugasId?: string | null;
}

export interface TugaskanPengaduanInput {
  pengaduanId: string;
  ditugaskanKeId: string;
  catatan?: string;
  petugasId?: string | null;
}

export class PengaduanService {
  /**
   * 1. Membuat Pengaduan Baru (Publik maupun Internal Kantor)
   * Perbaikan Integritas Data (B4, B5, B14, B15):
   * - B4: Nomor urut atomik dengan pengaduan_nomor_urut + retry maks 3x bila race condition.
   * - B5: Pelanggan tidak ditemukan -> pelangganId = null, nomorLangganan tetap tersimpan, tidak melempar FK error.
   * - B14: Upload Cloudinary di luar transaksi database.
   * - B15: Jika upload gagal / Cloudinary tidak aktif, jangan simpan data URL base64 ke DB.
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

    // B5: Resolusi Pelanggan & Kode Wilayah Pelayanan (2 Digit) secara aman tanpa FK violation
    let wilayah = '00';
    let resolvedPelangganId: string | null = null;
    if (input.nomorLangganan) {
      const [cust] = await db
        .select({ nolg: pelanggan.nolg, ruteKode: pelanggan.ruteKode })
        .from(pelanggan)
        .where(eq(pelanggan.nolg, input.nomorLangganan));
      if (cust) {
        resolvedPelangganId = cust.nolg;
        if (cust.ruteKode) {
          const match = cust.ruteKode.match(/\d+/);
          if (match) {
            wilayah = match[0].slice(0, 2).padStart(2, '0');
          }
        }
      }
    }

    const prioritas = input.prioritas ?? 'NORMAL';
    const sla = hitungTargetSla(prioritas);

    // B14: Siapkan ID tiket dan lakukan upload Cloudinary DI LUAR transaksi DB
    const ticketId = crypto.randomUUID();
    let processedFotoUrl: string | null = null;
    let fotoPublicId: string | null = null;
    let fotoGagalDiunggah = false;

    if (input.fotoUrl) {
      if (input.fotoUrl.startsWith('http://') || input.fotoUrl.startsWith('https://')) {
        processedFotoUrl = input.fotoUrl;
      } else if (input.fotoUrl.startsWith('data:image/')) {
        if (isCloudinaryConfigured()) {
          try {
            const res = await uploadToCloudinary({
              file: input.fotoUrl,
              modul: 'pengaduan',
              jenis: 'aduan',
              identifier: ticketId,
            });
            processedFotoUrl = res.secureUrl;
            fotoPublicId = res.publicId;
          } catch (err) {
            console.error('[CLOUDINARY_ADUAN_UPLOAD_ERR]', err);
            fotoGagalDiunggah = true;
          }
        } else {
          // B15: Cloudinary tidak terkonfigurasi, tolak penyimpanan base64 data:image
          fotoGagalDiunggah = true;
        }
      }
    }

    // Auto-generate judul terstandar jika tidak disertakan secara manual
    const labelJenis = LABEL_JENIS_PENGADUAN[input.jenis] ?? input.jenis;
    const ringkasanAlamat = input.alamatKejadian?.trim() ? ` (${input.alamatKejadian.trim().slice(0, 40)})` : '';
    const cuplikanDeskripsi = input.deskripsi.trim().slice(0, 60);
    const autoJudul = `${labelJenis}${ringkasanAlamat} — ${cuplikanDeskripsi}`;
    const finalJudul = (input.judul?.trim() || autoJudul).slice(0, 255);

    // B4: Retry loop maks 3x untuk menjamin nomor tiket unik dan atomik
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      attempt++;
      try {
        return await db.transaction(async (tx) => {
          // Hitung komponen tanggal YYMMDD dalam WIB UTC+7
          const tgl = new Date();
          const wibTime = new Date(tgl.getTime() + 7 * 60 * 60 * 1000);
          const yy = String(wibTime.getUTCFullYear()).slice(-2);
          const mm = String(wibTime.getUTCMonth() + 1).padStart(2, '0');
          const dd = String(wibTime.getUTCDate()).padStart(2, '0');
          const tanggalStr = `${yy}${mm}${dd}`;

          const kode = KODE_JENIS_PENGADUAN[input.jenis] ?? 'TK';
          const prefix = `${kode}${wilayah}${tanggalStr}`;

          // Ambil nomor urut tertinggi eksisting untuk prefix ini sebagai seed awal yang aman
          const [maxExisting] = await tx
            .select({
              maxUrut: sql<number>`COALESCE(MAX(CAST(RIGHT(${pengaduan.nomorTiket}, 4) AS int)), 0)`,
            })
            .from(pengaduan)
            .where(like(pengaduan.nomorTiket, `${prefix}%`));

          const seed = (maxExisting?.maxUrut ?? 0) + 1;

          // B4: Upsert atomik ke tabel pengaduan_nomor_urut
          const [seqRow] = await tx
            .insert(pengaduanNomorUrut)
            .values({
              prefix,
              lastUrut: seed,
            })
            .onConflictDoUpdate({
              target: pengaduanNomorUrut.prefix,
              set: {
                lastUrut: sql`${pengaduanNomorUrut.lastUrut} + 1`,
                updatedAt: new Date(),
              },
            })
            .returning({ lastUrut: pengaduanNomorUrut.lastUrut });

          const urut = seqRow.lastUrut;
          if (urut > 9999) {
            throw new Error(
              `Nomor urut tiket untuk prefix '${prefix}' telah melampaui batas maksimum 9999 per hari.`
            );
          }

          const nomorTiket = generateNomorTiket({
            kode,
            jenis: input.jenis,
            wilayah,
            tanggal: tgl,
            urut,
          });

          const [row] = await tx
            .insert(pengaduan)
            .values({
              id: ticketId,
              nomorTiket,
              clientRequestId: input.clientRequestId,
              nomorLangganan: input.nomorLangganan,
              pelangganId: resolvedPelangganId,
              klasifikasi: input.klasifikasi ?? 'BUKAN_NILAI_TAGIHAN_REKENING',
              jenis: input.jenis,
              judul: finalJudul,
              deskripsi: input.deskripsi.trim(),
              koordinat: input.koordinat,
              alamatKejadian: input.alamatKejadian,
              prioritas,
              status: 'BARU',
              pelapor: input.pelapor.trim(),
              kontakPelapor: input.kontakPelapor,
              fotoUrl: processedFotoUrl,
              fotoPublicId,
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

          // Catat audit internal jika foto gagal diunggah (B15)
          if (fotoGagalDiunggah) {
            await tx.insert(riwayatPengaduan).values({
              pengaduanId: row.id,
              aksi: 'CATATAN',
              statusKe: 'BARU',
              catatan: 'Foto bukti pengaduan gagal diunggah ke cloud storage.',
              isPublik: false,
            });
          }

          return row;
        });
      } catch (err: any) {
        const isUniqueViolation =
          err?.code === '23505' ||
          err?.cause?.code === '23505' ||
          err?.message?.includes('unique') ||
          err?.cause?.message?.includes('unique');

        if (isUniqueViolation) {
          // Jika bentrok clientRequestId pada concurrent request, return tiket yang sudah dibuat
          if (input.clientRequestId) {
            const [existing] = await db
              .select()
              .from(pengaduan)
              .where(eq(pengaduan.clientRequestId, input.clientRequestId));
            if (existing) {
              return existing;
            }
          }

          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 30 * attempt));
            continue;
          }
        }
        throw err;
      }
    }

    throw new Error('Gagal membuat tiket pengaduan setelah beberapa percobaan.');
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

    let processedFotoPenyelesaian: string | null = null;
    let fotoPenyelesaianPublicId: string | null = null;

    if (input.fotoPenyelesaianUrl) {
      if (
        input.fotoPenyelesaianUrl.startsWith('http://') ||
        input.fotoPenyelesaianUrl.startsWith('https://')
      ) {
        processedFotoPenyelesaian = input.fotoPenyelesaianUrl;
      } else if (input.fotoPenyelesaianUrl.startsWith('data:image/')) {
        if (isCloudinaryConfigured()) {
          try {
            const res = await uploadToCloudinary({
              file: input.fotoPenyelesaianUrl,
              modul: 'pengaduan',
              jenis: 'selesai',
              identifier: row.nomorTiket,
            });
            processedFotoPenyelesaian = res.secureUrl;
            fotoPenyelesaianPublicId = res.publicId;
          } catch (err) {
            console.error('[CLOUDINARY_PENYELESAIAN_UPLOAD_ERR]', err);
          }
        }
      }
    }

    return db.transaction(async (tx) => {
      const updateData: Partial<PengaduanRow> = {
        status: statusKe,
        updatedAt: new Date(),
      };

      if (statusKe === 'SELESAI') {
        updateData.selesaiAt = new Date();
        updateData.catatanPenyelesaian = input.catatan;
        updateData.fotoPenyelesaianUrl = processedFotoPenyelesaian;
        if (fotoPenyelesaianPublicId) {
          updateData.fotoPenyelesaianPublicId = fotoPenyelesaianPublicId;
        }
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
        fotoUrl: processedFotoPenyelesaian,
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

  /**
   * 6. Data Pengaduan Peta Spasial Publik (Max 300 tiket terbaru)
   * Sanitasi data privasi (B1, B2):
   * - Koordinat dibulatkan ke 3 desimal (~110m) untuk privasi warga.
   * - HANYA tiket dengan koordinat nyata yang ditampilkan (tanpa fallback koordinat fiktif).
   * - Tiket DITOLAK tidak ditampilkan.
   * - Dibatasi hanya jenis gangguan area fisik (JENIS_PENGADUAN_PETA_PUBLIK).
   * - Data pribadi (pelapor, kontakPelapor, deskripsi bebas, alamat kejadian mentah, fotoUrl, nama petugas) TIDAK disertakan.
   */
  async getPengaduanPetaPublik() {
    try {
      const rows = await db
        .select({
          id: pengaduan.id,
          nomorTiket: pengaduan.nomorTiket,
          jenis: pengaduan.jenis,
          status: pengaduan.status,
          prioritas: pengaduan.prioritas,
          koordinat: pengaduan.koordinat,
          createdAt: pengaduan.createdAt,
        })
        .from(pengaduan)
        .where(
          and(
            isNotNull(pengaduan.koordinat),
            ne(pengaduan.status, 'DITOLAK'),
            inArray(pengaduan.jenis, [...JENIS_PENGADUAN_PETA_PUBLIK])
          )
        )
        .orderBy(desc(pengaduan.createdAt))
        .limit(300);

      const pengaduanIds = rows.map((r) => r.id);
      const riwayatMap = new Map<
        string,
        Array<{
          id: string;
          aksi: string;
          statusKe: string | null;
          statusDari: string | null;
          catatan: string | null;
          createdAt: Date;
        }>
      >();

      if (pengaduanIds.length > 0) {
        const rwList = await db
          .select({
            id: riwayatPengaduan.id,
            pengaduanId: riwayatPengaduan.pengaduanId,
            aksi: riwayatPengaduan.aksi,
            statusKe: riwayatPengaduan.statusKe,
            statusDari: riwayatPengaduan.statusDari,
            catatan: riwayatPengaduan.catatan,
            createdAt: riwayatPengaduan.createdAt,
          })
          .from(riwayatPengaduan)
          .where(
            and(
              inArray(riwayatPengaduan.pengaduanId, pengaduanIds),
              eq(riwayatPengaduan.isPublik, true)
            )
          )
          .orderBy(desc(riwayatPengaduan.createdAt));

        for (const rw of rwList) {
          const arr = riwayatMap.get(rw.pengaduanId) ?? [];
          arr.push(rw);
          riwayatMap.set(rw.pengaduanId, arr);
        }
      }

      const hasil: Array<{
        id: string;
        nomorTiket: string;
        jenis: string;
        judul: string;
        status: string;
        prioritas: string;
        lng: number;
        lat: number;
        createdAt: Date;
        riwayat: Array<{
          id: string;
          aksi: string;
          statusKe: string | null;
          statusDari: string | null;
          catatan: string | null;
          createdAt: Date;
        }>;
      }> = [];

      for (const r of rows) {
        const geo = r.koordinat as { x: number; y: number } | null;
        if (!geo || typeof geo.x !== 'number' || typeof geo.y !== 'number') {
          continue;
        }

        // Pembulatan ke 3 desimal (~110m) untuk menjaga privasi lokasi
        const lng = Math.round(geo.x * 1000) / 1000;
        const lat = Math.round(geo.y * 1000) / 1000;

        hasil.push({
          id: r.id,
          nomorTiket: r.nomorTiket,
          jenis: r.jenis,
          judul: LABEL_JENIS_PENGADUAN[r.jenis] ?? r.jenis,
          status: r.status,
          prioritas: r.prioritas,
          lng,
          lat,
          createdAt: r.createdAt,
          riwayat: riwayatMap.get(r.id) ?? [],
        });
      }

      return hasil;
    } catch (err) {
      console.warn('[GET_PENGADUAN_PETA_PUBLIK_ERR]', err);
      return [];
    }
  }

  /**
   * 7. Statistik Ringkasan Antrean Pengaduan (Dashboard Desk)
   */
  async getStatistikPengaduan() {
    const sekarang = new Date();
    try {
      const allRows = await db
        .select({
          status: pengaduan.status,
          prioritas: pengaduan.prioritas,
          targetSelesaiAt: pengaduan.targetSelesaiAt,
          ratingKepuasan: pengaduan.ratingKepuasan,
          ditugaskanKeId: pengaduan.ditugaskanKeId,
        })
        .from(pengaduan);

      const perStatus: Record<string, number> = {};
      const perPrioritasTerbuka: Record<string, number> = {};
      let melanggarSla = 0;
      let belumDitugaskan = 0;
      let totalRating = 0;
      let jumlahDinilai = 0;

      const STATUS_TERBUKA = [
        'BARU',
        'TERVERIFIKASI',
        'DITUGASKAN',
        'MENUJU_LOKASI',
        'DIPROSES',
        'MENUNGGU_PELANGGAN',
        'DIBUKA_KEMBALI',
      ];

      for (const r of allRows) {
        perStatus[r.status] = (perStatus[r.status] ?? 0) + 1;

        if (STATUS_TERBUKA.includes(r.status)) {
          perPrioritasTerbuka[r.prioritas] =
            (perPrioritasTerbuka[r.prioritas] ?? 0) + 1;
        }

        if (
          STATUS_TERBUKA.includes(r.status) &&
          r.targetSelesaiAt &&
          new Date(r.targetSelesaiAt) < sekarang
        ) {
          melanggarSla++;
        }

        if (r.status === 'BARU' || !r.ditugaskanKeId) {
          belumDitugaskan++;
        }

        if (typeof r.ratingKepuasan === 'number' && r.ratingKepuasan > 0) {
          totalRating += r.ratingKepuasan;
          jumlahDinilai++;
        }
      }

      const rataRating =
        jumlahDinilai > 0
          ? Number((totalRating / jumlahDinilai).toFixed(1))
          : null;

      return {
        perStatus,
        perPrioritasTerbuka,
        melanggarSla,
        belumDitugaskan,
        rataRating,
        jumlahDinilai,
      };
    } catch (err) {
      console.warn('[GET_STATISTIK_PENGADUAN_ERR]', err);
      return {
        perStatus: {},
        perPrioritasTerbuka: {},
        melanggarSla: 0,
        belumDitugaskan: 0,
        rataRating: null,
        jumlahDinilai: 0,
      };
    }
  }

  /**
   * 8. Daftar Pengaduan dengan Paginasi, Filter & SLA (AG Grid / DataGrid)
   */
  async listPengaduan(filter: {
    page?: number;
    pageSize?: number;
    q?: string;
    status?: string;
    prioritas?: string;
    jenis?: string;
    ditugaskanKeId?: string;
    melanggarSla?: boolean | string;
  } = {}) {
    const page = Math.max(1, Number(filter.page ?? 1));
    const pageSize = Math.min(500, Math.max(1, Number(filter.pageSize ?? 25)));
    const offset = (page - 1) * pageSize;
    const sekarang = new Date();

    const conditions: any[] = [];

    if (filter.status) {
      conditions.push(eq(pengaduan.status, filter.status as any));
    }
    if (filter.prioritas) {
      conditions.push(eq(pengaduan.prioritas, filter.prioritas as any));
    }
    if (filter.jenis) {
      conditions.push(eq(pengaduan.jenis, filter.jenis as any));
    }
    if (filter.ditugaskanKeId) {
      conditions.push(eq(pengaduan.ditugaskanKeId, filter.ditugaskanKeId));
    }
    if (filter.q && filter.q.trim()) {
      const kw = `%${filter.q.trim()}%`;
      conditions.push(
        or(
          ilike(pengaduan.nomorTiket, kw),
          ilike(pengaduan.judul, kw),
          ilike(pengaduan.pelapor, kw),
          ilike(pengaduan.nomorLangganan, kw)
        )
      );
    }
    if (filter.melanggarSla === true || filter.melanggarSla === 'true') {
      conditions.push(sql`${pengaduan.targetSelesaiAt} < ${sekarang}`);
      conditions.push(
        inArray(pengaduan.status, [
          'BARU',
          'TERVERIFIKASI',
          'DITUGASKAN',
          'MENUJU_LOKASI',
          'DIPROSES',
          'MENUNGGU_PELANGGAN',
          'DIBUKA_KEMBALI',
        ])
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, [totalResult]] = await Promise.all([
      db
        .select({
          id: pengaduan.id,
          nomorTiket: pengaduan.nomorTiket,
          judul: pengaduan.judul,
          deskripsi: pengaduan.deskripsi,
          jenis: pengaduan.jenis,
          status: pengaduan.status,
          prioritas: pengaduan.prioritas,
          pelapor: pengaduan.pelapor,
          kontakPelapor: pengaduan.kontakPelapor,
          nomorLangganan: pengaduan.nomorLangganan,
          targetResponsAt: pengaduan.targetResponsAt,
          targetSelesaiAt: pengaduan.targetSelesaiAt,
          responsAt: pengaduan.responsAt,
          selesaiAt: pengaduan.selesaiAt,
          jedaMulaiAt: pengaduan.jedaMulaiAt,
          createdAt: pengaduan.createdAt,
          ditugaskanKeId: pengaduan.ditugaskanKeId,
          ditugaskanKeNama: user.name,
          pelangganNama: pelanggan.nama,
        })
        .from(pengaduan)
        .leftJoin(user, eq(pengaduan.ditugaskanKeId, user.id))
        .leftJoin(pelanggan, eq(pengaduan.nomorLangganan, pelanggan.nolg))
        .where(whereClause)
        .orderBy(desc(pengaduan.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ total: count() }).from(pengaduan).where(whereClause),
    ]);

    const total = Number(totalResult?.total ?? 0);

    const data = rows.map((r) => ({
      id: r.id,
      nomorTiket: r.nomorTiket,
      judul: r.judul,
      deskripsi: r.deskripsi,
      jenis: r.jenis,
      status: r.status,
      prioritas: r.prioritas,
      pelapor: r.pelapor,
      kontakPelapor: r.kontakPelapor,
      nomorLangganan: r.nomorLangganan,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      ditugaskanKe: r.ditugaskanKeId
        ? { id: r.ditugaskanKeId, name: r.ditugaskanKeNama ?? null }
        : null,
      pelanggan: r.nomorLangganan
        ? {
            id: r.nomorLangganan,
            nomorLangganan: r.nomorLangganan,
            nama: r.pelangganNama ?? r.pelapor,
          }
        : null,
      sla: ringkasSla(r, sekarang),
    }));

    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 9. Detail Lengkap Pengaduan untuk Halaman Kerja Petugas (/pengaduan/[id])
   */
  async getDetailPengaduanFull(idOrTiket: string) {
    const sekarang = new Date();

    const [row] = await db
      .select({
        id: pengaduan.id,
        nomorTiket: pengaduan.nomorTiket,
        clientRequestId: pengaduan.clientRequestId,
        pelangganId: pengaduan.pelangganId,
        nomorLangganan: pengaduan.nomorLangganan,
        klasifikasi: pengaduan.klasifikasi,
        jenis: pengaduan.jenis,
        judul: pengaduan.judul,
        deskripsi: pengaduan.deskripsi,
        koordinat: pengaduan.koordinat,
        alamatKejadian: pengaduan.alamatKejadian,
        prioritas: pengaduan.prioritas,
        status: pengaduan.status,
        pelapor: pengaduan.pelapor,
        kontakPelapor: pengaduan.kontakPelapor,
        fotoUrl: pengaduan.fotoUrl,
        videoUrl: pengaduan.videoUrl,
        ditugaskanKeId: pengaduan.ditugaskanKeId,
        ditugaskanKeNama: user.name,
        ditanganiMulai: pengaduan.ditanganiMulai,
        selesaiAt: pengaduan.selesaiAt,
        catatanPenyelesaian: pengaduan.catatanPenyelesaian,
        fotoPenyelesaianUrl: pengaduan.fotoPenyelesaianUrl,
        targetResponsAt: pengaduan.targetResponsAt,
        targetSelesaiAt: pengaduan.targetSelesaiAt,
        responsAt: pengaduan.responsAt,
        jedaMulaiAt: pengaduan.jedaMulaiAt,
        jedaTotalMenit: pengaduan.jedaTotalMenit,
        ratingKepuasan: pengaduan.ratingKepuasan,
        komentarKepuasan: pengaduan.komentarKepuasan,
        ratingAt: pengaduan.ratingAt,
        jumlahDibukaKembali: pengaduan.jumlahDibukaKembali,
        konfirmasiBatasAt: pengaduan.konfirmasiBatasAt,
        verifikasiAt: pengaduan.verifikasiAt,
        createdAt: pengaduan.createdAt,
        updatedAt: pengaduan.updatedAt,
      })
      .from(pengaduan)
      .leftJoin(user, eq(pengaduan.ditugaskanKeId, user.id))
      .where(
        or(eq(pengaduan.id, idOrTiket), eq(pengaduan.nomorTiket, idOrTiket))
      );

    if (!row) {
      throw new Error(`Pengaduan dengan identitas '${idOrTiket}' tidak ditemukan.`);
    }

    // Ambil info pelanggan jika ada nomor langganan
    let dataPelanggan: { id: string; nomorLangganan: string; nama: string } | null = null;
    if (row.nomorLangganan) {
      const [p] = await db
        .select({ nolg: pelanggan.nolg, nama: pelanggan.nama })
        .from(pelanggan)
        .where(eq(pelanggan.nolg, row.nomorLangganan));
      if (p) {
        dataPelanggan = {
          id: p.nolg,
          nomorLangganan: p.nolg,
          nama: p.nama,
        };
      }
    }

    // Ambil seluruh riwayat linimasa (staf melihat riwayat publik maupun internal)
    const riwayatList = await db
      .select({
        id: riwayatPengaduan.id,
        aksi: riwayatPengaduan.aksi,
        statusDari: riwayatPengaduan.statusDari,
        statusKe: riwayatPengaduan.statusKe,
        catatan: riwayatPengaduan.catatan,
        fotoUrl: riwayatPengaduan.fotoUrl,
        isPublik: riwayatPengaduan.isPublik,
        createdAt: riwayatPengaduan.createdAt,
        petugasId: riwayatPengaduan.petugasId,
        petugasNama: user.name,
      })
      .from(riwayatPengaduan)
      .leftJoin(user, eq(riwayatPengaduan.petugasId, user.id))
      .where(eq(riwayatPengaduan.pengaduanId, row.id))
      .orderBy(desc(riwayatPengaduan.createdAt));

    const riwayat = riwayatList.map((rw) => ({
      id: rw.id,
      aksi: rw.aksi,
      statusDari: rw.statusDari,
      statusKe: rw.statusKe,
      catatan: rw.catatan,
      fotoUrl: rw.fotoUrl,
      isPublik: rw.isPublik,
      olehNama: rw.petugasNama ?? 'Sistem',
      createdAt: rw.createdAt ? new Date(rw.createdAt).toISOString() : new Date().toISOString(),
      oleh: rw.petugasId
        ? {
            id: rw.petugasId,
            name: rw.petugasNama ?? null,
            role: 'PETUGAS_LAPANGAN',
          }
        : null,
    }));

    const transisiTersedia = (TRANSISI_PENGADUAN[row.status as StatusPengaduan] ?? []) as string[];

    const lastEscalation = riwayatList.find((r) => r.aksi === 'ESKALASI');
    const eskalasiAt = lastEscalation?.createdAt
      ? new Date(lastEscalation.createdAt).toISOString()
      : null;
    const alasanEskalasi = lastEscalation?.catatan ?? null;
    const eskalasiKe = lastEscalation?.petugasId
      ? {
          id: lastEscalation.petugasId,
          name: lastEscalation.petugasNama ?? null,
          role: 'SUPERVISOR',
        }
      : null;

    return {
      id: row.id,
      nomorTiket: row.nomorTiket,
      judul: row.judul,
      jenis: row.jenis,
      status: row.status,
      prioritas: row.prioritas,
      pelapor: row.pelapor,
      deskripsi: row.deskripsi,
      alamatKejadian: row.alamatKejadian,
      nomorLangganan: row.nomorLangganan,
      kontakPelapor: row.kontakPelapor,
      fotoUrl: row.fotoUrl,
      videoUrl: row.videoUrl,
      ditanganiMulai: row.ditanganiMulai ? new Date(row.ditanganiMulai).toISOString() : null,
      selesaiAt: row.selesaiAt ? new Date(row.selesaiAt).toISOString() : null,
      catatanPenyelesaian: row.catatanPenyelesaian,
      eskalasiAt,
      alasanEskalasi,
      ratingKepuasan: row.ratingKepuasan,
      komentarKepuasan: row.komentarKepuasan,
      jumlahDibukaKembali: row.jumlahDibukaKembali,
      jedaTotalMenit: row.jedaTotalMenit,
      fotoPenyelesaianUrl: row.fotoPenyelesaianUrl,
      konfirmasiBatasAt: row.konfirmasiBatasAt ? new Date(row.konfirmasiBatasAt).toISOString() : null,
      verifikasiAt: row.verifikasiAt ? new Date(row.verifikasiAt).toISOString() : null,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
      sla: ringkasSla(row, sekarang),
      ditugaskanKe: row.ditugaskanKeId
        ? {
            id: row.ditugaskanKeId,
            name: row.ditugaskanKeNama ?? null,
            role: 'PETUGAS_LAPANGAN',
          }
        : null,
      eskalasiKe,
      pelanggan: dataPelanggan,
      kelurahan: null,
      kecamatan: null,
      riwayat,
      transisiTersedia,
      kewenangan: {
        bisaTugaskan: row.status !== 'SELESAI' && row.status !== 'DITUTUP',
        bisaEskalasi: row.status !== 'SELESAI' && row.status !== 'DITUTUP',
        bisaChat: row.status !== 'DITUTUP',
      },
    };
  }

  /**
   * 10. Daftar Petugas untuk Penugasan / Eskalasi
   * Filter role petugas yang layak (PELAKSANA, VERIFIKATOR_*, SUPERADMIN)
   * Hapus fallback data tiruan fiktif (B3)
   */
  async listPetugasPengaduan() {
    const rolesLayak: AppRole[] = [
      'PELAKSANA',
      'PENCATAT',
      'VERIFIKATOR_1',
      'VERIFIKATOR_2',
      'VERIFIKATOR_3',
      'SUPERADMIN',
    ];

    try {
      const eligibleUsers = await db
        .selectDistinct({
          id: user.id,
          name: user.name,
          role: userRoles.role,
        })
        .from(user)
        .innerJoin(userRoles, eq(user.id, userRoles.userId))
        .where(inArray(userRoles.role, rolesLayak))
        .limit(100);

      return eligibleUsers.map((u) => ({
        id: u.id,
        name: u.name,
        role: u.role,
      }));
    } catch (err) {
      console.error('[LIST_PETUGAS_PENGADUAN_ERR]', err);
      throw err;
    }
  }

  /**
   * 11. Tambah Catatan Internal / Publik ke Linimasa Tiket
   */
  async tambahCatatanPengaduan(input: {
    pengaduanId: string;
    catatan: string;
    isPublik?: boolean;
    petugasId?: string | null;
  }) {
    const [row] = await db
      .select({ id: pengaduan.id, status: pengaduan.status })
      .from(pengaduan)
      .where(or(eq(pengaduan.id, input.pengaduanId), eq(pengaduan.nomorTiket, input.pengaduanId)));

    if (!row) throw new Error('Pengaduan tidak ditemukan.');

    const [inserted] = await db
      .insert(riwayatPengaduan)
      .values({
        pengaduanId: row.id,
        aksi: 'CATATAN',
        statusDari: row.status as any,
        statusKe: row.status as any,
        catatan: input.catatan,
        isPublik: Boolean(input.isPublik),
        petugasId: input.petugasId ?? null,
      })
      .returning();

    return inserted;
  }

  /**
   * 12. Kirim Chat Interaksi Petugas dengan Pelapor
   */
  async kirimChatPetugas(input: {
    pengaduanId: string;
    pesan: string;
    isPublik?: boolean;
    petugasId?: string | null;
  }) {
    const [row] = await db
      .select({ id: pengaduan.id, status: pengaduan.status })
      .from(pengaduan)
      .where(or(eq(pengaduan.id, input.pengaduanId), eq(pengaduan.nomorTiket, input.pengaduanId)));

    if (!row) throw new Error('Pengaduan tidak ditemukan.');

    const [inserted] = await db
      .insert(riwayatPengaduan)
      .values({
        pengaduanId: row.id,
        aksi: 'CHAT',
        statusDari: row.status as any,
        statusKe: row.status as any,
        catatan: input.pesan,
        isPublik: input.isPublik !== undefined ? Boolean(input.isPublik) : true,
        petugasId: input.petugasId ?? null,
      })
      .returning();

    return inserted;
  }

  /**
   * 13. Eskalasi Tiket ke Supervisor / Prioritas Lebih Tinggi
   */
  async eskalasiPengaduan(input: {
    pengaduanId: string;
    prioritasBaru?: PrioritasPengaduan;
    eskalasiKeId?: string;
    catatan?: string;
    petugasId?: string | null;
  }) {
    const [row] = await db
      .select()
      .from(pengaduan)
      .where(or(eq(pengaduan.id, input.pengaduanId), eq(pengaduan.nomorTiket, input.pengaduanId)));

    if (!row) throw new Error('Pengaduan tidak ditemukan.');

    const newPriority = input.prioritasBaru ?? 'TINGGI';

    return db.transaction(async (tx) => {
      const updateData: any = {
        prioritas: newPriority,
        updatedAt: new Date(),
      };
      if (input.eskalasiKeId) {
        updateData.ditugaskanKeId = input.eskalasiKeId;
      }

      const [updated] = await tx
        .update(pengaduan)
        .set(updateData)
        .where(eq(pengaduan.id, row.id))
        .returning();

      await tx.insert(riwayatPengaduan).values({
        pengaduanId: row.id,
        aksi: 'ESKALASI',
        statusDari: row.status as any,
        statusKe: row.status as any,
        catatan: input.catatan ?? `Tiket dieskalasi ke prioritas ${newPriority}.`,
        isPublik: true,
        petugasId: input.petugasId ?? null,
      });

      return updated;
    });
  }
}

export const pengaduanService = new PengaduanService();
