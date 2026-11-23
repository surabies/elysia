/**
 * Service: Pengaduan Air & Layanan Pengaduan Pelanggan
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM, Domain Engine, & Transaksi DB)
 */

import { eq, desc, and, like, sql, inArray, ilike, or, count, ne, isNotNull, gte } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  db,
  pengaduan,
  riwayatPengaduan,
  pengaduanNomorUrut,
  pelanggan,
  user,
  userRoles,
  pegawai,
  type PengaduanRow,
  type RiwayatPengaduanRow,
} from '@cater/db';
import {
  generateNomorTiket,
  isTransisiSah,
  hitungTargetSla,
  evaluasiPembuatanTiket,
  ringkasSla,
  tentukanKlasifikasi,
  tentukanPrioritasAwal,
  hitungPerubahanTransisi,
  hitungEfekJeda,
  bolehMelakukan,
  tentukanAksiDariStatus,
  TRANSISI_PENGADUAN,
  KODE_JENIS_PENGADUAN,
  LABEL_JENIS_PENGADUAN,
} from '../../domain/pengaduan/alur-pengaduan.engine';
import {
  JENIS_PENGADUAN_PETA_PUBLIK,
  DUPLIKAT_RADIUS_METER,
  DUPLIKAT_JENDELA_JAM,
} from '../../domain/pengaduan/pengaduan.config';
import {
  DomainError,
  NotFoundError,
  ConflictError,
  InvalidTransitionError,
  ForbiddenError,
  ValidationError,
} from '../../domain/pengaduan/pengaduan.errors';
import { isCloudinaryConfigured, uploadToCloudinary } from '../../lib/cloudinary';
import { kebijakanPengaduanService } from './kebijakan-pengaduan.service';
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
  sumberAksi?: 'STAF' | 'PELAPOR' | 'OTOMATIS';
  aktor?: { id?: string | null; role?: AppRole };
}

export interface TugaskanPengaduanInput {
  pengaduanId: string;
  ditugaskanKeId: string;
  catatan?: string;
  petugasId?: string | null;
  aktor?: { id?: string | null; role?: AppRole };
}

export interface EskalasiPengaduanInput {
  pengaduanId: string;
  prioritasBaru?: PrioritasPengaduan;
  eskalasiKeId?: string;
  catatan?: string;
  petugasId?: string | null;
  aktor?: { id?: string | null; role?: AppRole };
}

export interface TambahCatatanPengaduanInput {
  pengaduanId: string;
  catatan: string;
  isPublik?: boolean;
  petugasId?: string | null;
  aktor?: { id?: string | null; role?: AppRole };
}

export interface KirimChatPetugasInput {
  pengaduanId: string;
  pesan: string;
  isPublik?: boolean;
  petugasId?: string | null;
  aktor?: { id?: string | null; role?: AppRole };
}

export class PengaduanService {
  /**
   * Helper sanitasi ID Petugas agar tidak melanggar foreign key constraint PostgreSQL jika user tidak ada
   */
  private async sanitizeUserId(userId?: string | null): Promise<string | null> {
    if (!userId) return null;
    try {
      const [found] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);
      return found ? found.id : null;
    } catch {
      return null;
    }
  }

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

    const kebijakanAktif = await kebijakanPengaduanService.getKebijakanAktif();
    const configKebijakan = kebijakanAktif.config;

    const klasifikasi = input.klasifikasi ?? tentukanKlasifikasi(input.jenis, configKebijakan);
    const prioritas = tentukanPrioritasAwal(input.jenis, input.prioritas, configKebijakan);
    const sla = hitungTargetSla(prioritas, undefined, { jenis: input.jenis, kebijakan: configKebijakan });

    // Deteksi laporan duplikat spasial & temporal (K7)
    let kemungkinanDuplikat: Array<{ nomorTiket: string; jarakMeter: number }> = [];
    const duplikatJendelaJam = configKebijakan.duplikatJendelaJam ?? DUPLIKAT_JENDELA_JAM;
    const duplikatRadiusMeter = configKebijakan.duplikatRadiusMeter ?? DUPLIKAT_RADIUS_METER;

    if (
      input.koordinat &&
      (input.jenis === 'BOCOR_PIPA_DINAS' ||
        input.jenis === 'TIDAK_ADA_AIR' ||
        input.jenis === 'AIR_KERUH_BAU_BERWARNA')
    ) {
      try {
        const batasWaktu = new Date(Date.now() - duplikatJendelaJam * 60 * 60 * 1000);
        const openStatuses = [
          'BARU',
          'TERVERIFIKASI',
          'DITUGASKAN',
          'MENUJU_LOKASI',
          'DIPROSES',
          'MENUNGGU_PELANGGAN',
          'DIBUKA_KEMBALI',
        ];

        const duplikatRows = await db
          .select({
            nomorTiket: pengaduan.nomorTiket,
            jarak: sql<number>`ST_Distance(
              ${pengaduan.koordinat}::geography,
              ST_SetSRID(ST_MakePoint(${input.koordinat.x}, ${input.koordinat.y}), 4326)::geography
            )::int`,
          })
          .from(pengaduan)
          .where(
            and(
              eq(pengaduan.jenis, input.jenis),
              inArray(pengaduan.status, openStatuses as any),
              isNotNull(pengaduan.koordinat),
              gte(pengaduan.createdAt, batasWaktu),
              sql`ST_DWithin(
                ${pengaduan.koordinat}::geography,
                ST_SetSRID(ST_MakePoint(${input.koordinat.x}, ${input.koordinat.y}), 4326)::geography,
                ${duplikatRadiusMeter}
              )`
            )
          )
          .limit(5);

        kemungkinanDuplikat = duplikatRows.map((d) => ({
          nomorTiket: d.nomorTiket,
          jarakMeter: Number(d.jarak),
        }));
      } catch (err) {
        console.warn('[DETEKSI_DUPLIKAT_ERR]', err);
      }
    }

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
              klasifikasi,
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
              kebijakanVersi: kebijakanAktif.versi,
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

          // Catat indikasi duplikasi ke riwayat internal jika terdeteksi (K7)
          if (kemungkinanDuplikat.length > 0) {
            await tx.insert(riwayatPengaduan).values({
              pengaduanId: row.id,
              aksi: 'CATATAN',
              statusKe: 'BARU',
              catatan: `Terdeteksi kemungkinan laporan duplikat dengan tiket: ${kemungkinanDuplikat
                .map((d) => `${d.nomorTiket} (${d.jarakMeter}m)`)
                .join(', ')}`,
              isPublik: false,
            });
          }

          return Object.assign(row, { kemungkinanDuplikat });
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
   * Dilengkapi pengunci optimistik (B8), verifikasi wewenang aktor (B6), validasi petugas layak (B3), dan petugasTujuanId (B10)
   */
  async tugaskanPengaduan(input: TugaskanPengaduanInput) {
    const [row] = await db
      .select()
      .from(pengaduan)
      .where(or(eq(pengaduan.id, input.pengaduanId), eq(pengaduan.nomorTiket, input.pengaduanId)));

    if (!row) {
      throw new NotFoundError(`Pengaduan dengan ID atau nomor tiket '${input.pengaduanId}' tidak ditemukan.`);
    }

    // B6: Verifikasi wewenang aktor internal
    if (input.aktor?.role) {
      if (!bolehMelakukan(input.aktor.role, 'TUGASKAN')) {
        throw new ForbiddenError('Anda tidak memiliki wewenang untuk menugaskan tiket pengaduan.');
      }
    }

    // B3 & B6: Validasi kelayakan petugas lapangan / pejabat penerima tugas
    const rolesLayak: AppRole[] = [
      'PELAKSANA',
      'PENCATAT',
      'STAFF',
      'STAFF_ADMIN_BILLING',
      'SUPERVISOR',
      'MANAGER',
      'SENIOR_MANAGER',
      'VERIFIKATOR_1',
      'VERIFIKATOR_2',
      'VERIFIKATOR_3',
      'SUPERADMIN',
    ];

    const [petugasTujuan] = await db
      .select({ id: user.id, name: user.name, role: userRoles.role })
      .from(user)
      .innerJoin(userRoles, eq(user.id, userRoles.userId))
      .where(and(eq(user.id, input.ditugaskanKeId), inArray(userRoles.role, rolesLayak)))
      .limit(1);

    if (!petugasTujuan) {
      throw new ValidationError(
        'Petugas penerima tugas tidak ditemukan atau tidak memiliki hak akses lapangan.'
      );
    }

    const statusDari = row.status as StatusPengaduan;
    if (
      !isTransisiSah(statusDari, 'DITUGASKAN', {
        klasifikasi: row.klasifikasi as KlasifikasiPengaduan,
      })
    ) {
      throw new InvalidTransitionError(
        `Tidak dapat menugaskan tiket yang berada pada status ${statusDari}.`
      );
    }

    // B8: Pengunci optimistik di dalam transaksi DB
    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(pengaduan)
        .set({
          status: 'DITUGASKAN',
          ditugaskanKeId: input.ditugaskanKeId,
          ditanganiMulai: row.ditanganiMulai ?? new Date(),
          responsAt: row.responsAt ?? new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(pengaduan.id, row.id), eq(pengaduan.status, statusDari)))
        .returning();

      if (!updated) {
        throw new ConflictError('Status tiket sudah berubah oleh proses lain, silakan muat ulang.');
      }

      const validPetugasId = await this.sanitizeUserId(input.petugasId ?? input.aktor?.id);

      // B10: Catat petugas_tujuan_id pada riwayat aksi DITUGASKAN
      await tx.insert(riwayatPengaduan).values({
        pengaduanId: row.id,
        aksi: 'DITUGASKAN',
        statusDari,
        statusKe: 'DITUGASKAN',
        petugasId: validPetugasId,
        petugasTujuanId: input.ditugaskanKeId,
        catatan: input.catatan ?? `Tiket ditugaskan kepada ${petugasTujuan.name ?? 'petugas lapangan'}.`,
        isPublik: true,
      });

      return updated;
    });
  }

  /**
   * 4. Transisi Status Pengaduan (State Machine Transition)
   * Dilengkapi B7 (blokir DITUGASKAN langsung), B6 (otorisasi role), B8 (optimistic locking), dan K1-K5, K8
   */
  async ubahStatusPengaduan(input: UbahStatusPengaduanInput) {
    // B7: Penugasan lewat jalur penugasan saja
    if (input.statusKe === 'DITUGASKAN') {
      throw new ValidationError(
        'Penugasan petugas harus dilakukan melalui endpoint penugasan (/tugaskan), bukan melalui perubahan status langsung.'
      );
    }

    const [row] = await db
      .select()
      .from(pengaduan)
      .where(or(eq(pengaduan.id, input.pengaduanId), eq(pengaduan.nomorTiket, input.pengaduanId)));

    if (!row) {
      throw new NotFoundError(`Pengaduan dengan ID atau nomor tiket '${input.pengaduanId}' tidak ditemukan.`);
    }

    const statusDari = row.status as StatusPengaduan;
    const statusKe = input.statusKe;
    const sumberAksi = input.sumberAksi ?? 'STAF';

    // B6: Verifikasi wewenang role internal
    if (sumberAksi === 'STAF' && input.aktor?.role) {
      const aksi = tentukanAksiDariStatus(statusKe);
      const diizinkan = bolehMelakukan(input.aktor.role, aksi, {
        penerimaTugasId: row.ditugaskanKeId,
        aktorId: input.aktor.id ?? input.petugasId,
        klasifikasi: row.klasifikasi as KlasifikasiPengaduan,
      });

      if (!diizinkan) {
        throw new ForbiddenError(
          `Role ${input.aktor.role} tidak memiliki wewenang untuk mengubah status ke ${statusKe}.`
        );
      }
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

    // Evaluasi seluruh side-effect perubahan transisi status (Fase 3: K1-K5, K8 & Kebijakan Dinamis Berversi)
    let kebijakanTiket = await kebijakanPengaduanService.getKebijakanAktif();
    if (row.kebijakanVersi && row.kebijakanVersi !== kebijakanTiket.versi) {
      const khusus = await kebijakanPengaduanService.getKebijakanByVersi(row.kebijakanVersi);
      if (khusus) {
        kebijakanTiket = khusus;
      }
    }

    let transisi;
    try {
      transisi = hitungPerubahanTransisi({
        statusDari,
        statusKe,
        prioritas: row.prioritas as PrioritasPengaduan,
        jenis: row.jenis as JenisPengaduan,
        klasifikasi: row.klasifikasi as KlasifikasiPengaduan,
        responsAt: row.responsAt,
        jedaMulaiAt: row.jedaMulaiAt,
        jedaTotalMenit: row.jedaTotalMenit,
        targetSelesaiAt: row.targetSelesaiAt,
        konfirmasiBatasAt: row.konfirmasiBatasAt,
        jumlahDibukaKembali: row.jumlahDibukaKembali,
        catatan: input.catatan,
        fotoUrl: processedFotoPenyelesaian,
        sumberAksi,
        kebijakan: kebijakanTiket.config,
      });
    } catch (err: any) {
      if (err.message && err.message.includes('tidak sah')) {
        throw new InvalidTransitionError(err.message);
      }
      throw new ValidationError(err.message);
    }

    // B8: Pengunci optimistik di dalam transaksi DB
    return db.transaction(async (tx) => {
      const updateData: Partial<PengaduanRow> = {
        ...transisi.patch,
      };

      if (statusKe === 'SELESAI') {
        updateData.catatanPenyelesaian = input.catatan;
        updateData.fotoPenyelesaianUrl = processedFotoPenyelesaian;
        if (fotoPenyelesaianPublicId) {
          updateData.fotoPenyelesaianPublicId = fotoPenyelesaianPublicId;
        }
      }

      const [updated] = await tx
        .update(pengaduan)
        .set(updateData)
        .where(and(eq(pengaduan.id, row.id), eq(pengaduan.status, statusDari)))
        .returning();

      if (!updated) {
        throw new ConflictError('Status tiket sudah berubah oleh proses lain, silakan muat ulang.');
      }

      const validPetugasId = await this.sanitizeUserId(input.petugasId ?? input.aktor?.id);

      await tx.insert(riwayatPengaduan).values({
        pengaduanId: row.id,
        aksi: transisi.aksiRiwayat,
        statusDari,
        statusKe,
        petugasId: validPetugasId,
        catatan: transisi.pesanRiwayat,
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
      throw new ValidationError('Rating kepuasan harus berada pada rentang 1 hingga 5.');
    }

    const [row] = await db
      .select()
      .from(pengaduan)
      .where(eq(pengaduan.nomorTiket, nomorTiket));

    if (!row) {
      throw new NotFoundError(`Tiket ${nomorTiket} tidak ditemukan.`);
    }

    if (row.status !== 'SELESAI' && row.status !== 'DITUTUP') {
      throw new ValidationError('Rating hanya dapat diberikan pada pengaduan yang telah berstatus SELESAI atau DITUTUP.');
    }

    if (row.ratingKepuasan !== null && row.ratingKepuasan > 0) {
      throw new ValidationError('Pengaduan ini sudah pernah dinilai sebelumnya.');
    }

    return db.transaction(async (tx) => {
      await tx
        .update(pengaduan)
        .set({
          ratingKepuasan: rating,
          komentarKepuasan: komentar,
          ratingAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(pengaduan.id, row.id));

      await tx.insert(riwayatPengaduan).values({
        pengaduanId: row.id,
        aksi: 'DINILAI',
        statusDari: row.status as any,
        statusKe: row.status as any,
        catatan: komentar ? `Penilaian bintang ${rating}: ${komentar}` : `Penilaian kepuasan bintang ${rating}.`,
        isPublik: true,
      });

      return {
        nomorTiket,
        ratingKepuasan: rating,
        message: 'Terima kasih atas penilaian Anda terhadap layanan kami.',
      };
    });
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
   * 7. Statistik Ringkasan Antrean Pengaduan (Dashboard Desk) (B11)
   * Agregasi SQL murni di database (GROUP BY / COUNT FILTER) tanpa memuat baris ke memori
   */
  async getStatistikPengaduan(periode?: string) {
    try {
      const STATUS_TERBUKA = [
        'BARU',
        'TERVERIFIKASI',
        'DITUGASKAN',
        'MENUJU_LOKASI',
        'DIPROSES',
        'MENUNGGU_PELANGGAN',
        'DIBUKA_KEMBALI',
      ];

      const filterPeriode =
        periode && /^\d{6}$/.test(periode)
          ? sql`TO_CHAR(${pengaduan.createdAt} AT TIME ZONE 'Asia/Jakarta', 'YYYYMM') = ${periode}`
          : undefined;

      const [statusRows, prioritasRows, agregatRows, trenHarianRows] = await Promise.all([
        db
          .select({
            status: pengaduan.status,
            jumlah: count(),
          })
          .from(pengaduan)
          .where(filterPeriode)
          .groupBy(pengaduan.status),

        db
          .select({
            prioritas: pengaduan.prioritas,
            jumlah: count(),
          })
          .from(pengaduan)
          .where(
            filterPeriode
              ? and(inArray(pengaduan.status, STATUS_TERBUKA as any), filterPeriode)
              : inArray(pengaduan.status, STATUS_TERBUKA as any)
          )
          .groupBy(pengaduan.prioritas),

        db
          .select({
            melanggarSla: sql<number>`COALESCE(COUNT(*) FILTER (
              WHERE ${pengaduan.status} IN ('BARU', 'TERVERIFIKASI', 'DITUGASKAN', 'MENUJU_LOKASI', 'DIPROSES', 'DIBUKA_KEMBALI')
                AND ${pengaduan.status} <> 'MENUNGGU_PELANGGAN'
                AND ${pengaduan.targetSelesaiAt} < NOW()
            ), 0)::int`,
            belumDitugaskan: sql<number>`COALESCE(COUNT(*) FILTER (
              WHERE ${pengaduan.status} IN ('BARU', 'TERVERIFIKASI', 'DITUGASKAN', 'MENUJU_LOKASI', 'DIPROSES', 'MENUNGGU_PELANGGAN', 'DIBUKA_KEMBALI')
                AND ${pengaduan.ditugaskanKeId} IS NULL
            ), 0)::int`,
            totalRating: sql<number>`COALESCE(SUM(${pengaduan.ratingKepuasan}) FILTER (
              WHERE ${pengaduan.ratingKepuasan} IS NOT NULL AND ${pengaduan.ratingKepuasan} > 0
            ), 0)::int`,
            jumlahDinilai: sql<number>`COALESCE(COUNT(*) FILTER (
              WHERE ${pengaduan.ratingKepuasan} IS NOT NULL AND ${pengaduan.ratingKepuasan} > 0
            ), 0)::int`,
          })
          .from(pengaduan)
          .where(filterPeriode),

        db
          .select({
            tanggal: sql<string>`TO_CHAR(${pengaduan.createdAt} AT TIME ZONE 'Asia/Jakarta', 'DD Mon')`,
            hariIso: sql<string>`TO_CHAR(${pengaduan.createdAt} AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD')`,
            masuk: count(),
            selesai: sql<number>`COALESCE(COUNT(*) FILTER (
              WHERE ${pengaduan.status} IN ('SELESAI', 'DITUTUP')
            ), 0)::int`,
          })
          .from(pengaduan)
          .where(filterPeriode)
          .groupBy(
            sql`TO_CHAR(${pengaduan.createdAt} AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD')`,
            sql`TO_CHAR(${pengaduan.createdAt} AT TIME ZONE 'Asia/Jakarta', 'DD Mon')`
          )
          .orderBy(sql`TO_CHAR(${pengaduan.createdAt} AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD') ASC`)
          .limit(20),
      ]);

      const perStatus: Record<string, number> = {};
      for (const r of statusRows) {
        perStatus[r.status] = Number(r.jumlah);
      }

      const perPrioritasTerbuka: Record<string, number> = {};
      for (const r of prioritasRows) {
        perPrioritasTerbuka[r.prioritas] = Number(r.jumlah);
      }

      const agregat = agregatRows[0] ?? {
        melanggarSla: 0,
        belumDitugaskan: 0,
        totalRating: 0,
        jumlahDinilai: 0,
      };

      const jumlahDinilai = Number(agregat.jumlahDinilai);
      const totalRating = Number(agregat.totalRating);
      const rataRating =
        jumlahDinilai > 0
          ? Number((totalRating / jumlahDinilai).toFixed(1))
          : null;

      const trenHarian = trenHarianRows.map((t) => ({
        label: t.tanggal,
        masuk: Number(t.masuk),
        selesai: Number(t.selesai),
      }));

      return {
        perStatus,
        perPrioritasTerbuka,
        melanggarSla: Number(agregat.melanggarSla),
        belumDitugaskan: Number(agregat.belumDitugaskan),
        rataRating,
        jumlahDinilai,
        trenHarian,
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
        trenHarian: [],
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
    periode?: string;
    ditugaskanKeId?: string;
    melanggarSla?: boolean | string;
  } = {}) {
    const page = Math.max(1, Number(filter.page ?? 1));
    const pageSize = Math.min(500, Math.max(1, Number(filter.pageSize ?? 25)));
    const offset = (page - 1) * pageSize;
    const sekarang = new Date();

    const conditions: any[] = [];

    if (filter.periode && /^\d{6}$/.test(filter.periode)) {
      conditions.push(
        sql`TO_CHAR(${pengaduan.createdAt} AT TIME ZONE 'Asia/Jakarta', 'YYYYMM') = ${filter.periode}`
      );
    }
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
    // B11: Filter melanggar SLA mengecualikan tiket yang berstatus jeda (MENUNGGU_PELANGGAN)
    if (filter.melanggarSla === true || filter.melanggarSla === 'true') {
      conditions.push(sql`${pengaduan.targetSelesaiAt} < NOW()`);
      conditions.push(ne(pengaduan.status, 'MENUNGGU_PELANGGAN'));
      conditions.push(
        inArray(pengaduan.status, [
          'BARU',
          'TERVERIFIKASI',
          'DITUGASKAN',
          'MENUJU_LOKASI',
          'DIPROSES',
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
   * Dilengkapi B6 (kewenangan dinamis aktor) dan B10 (petugas tujuan pada eskalasi dan riwayat)
   */
  async getDetailPengaduanFull(
    idOrTiket: string,
    aktor?: { id?: string | null; role?: AppRole }
  ) {
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
        kebijakanVersi: pengaduan.kebijakanVersi,
        createdAt: pengaduan.createdAt,
        updatedAt: pengaduan.updatedAt,
      })
      .from(pengaduan)
      .leftJoin(user, eq(pengaduan.ditugaskanKeId, user.id))
      .where(
        or(eq(pengaduan.id, idOrTiket), eq(pengaduan.nomorTiket, idOrTiket))
      );

    if (!row) {
      throw new NotFoundError(`Pengaduan dengan identitas '${idOrTiket}' tidak ditemukan.`);
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

    // B10: Ambil seluruh riwayat linimasa beserta info petugas tujuan
    const petugasTujuanAlias = alias(user, 'petugas_tujuan');
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
        petugasTujuanId: riwayatPengaduan.petugasTujuanId,
        petugasTujuanNama: petugasTujuanAlias.name,
      })
      .from(riwayatPengaduan)
      .leftJoin(user, eq(riwayatPengaduan.petugasId, user.id))
      .leftJoin(petugasTujuanAlias, eq(riwayatPengaduan.petugasTujuanId, petugasTujuanAlias.id))
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
      tujuanNama: rw.petugasTujuanNama ?? null,
      createdAt: rw.createdAt ? new Date(rw.createdAt).toISOString() : new Date().toISOString(),
      oleh: rw.petugasId
        ? {
            id: rw.petugasId,
            name: rw.petugasNama ?? null,
            role: 'PETUGAS_LAPANGAN',
          }
        : null,
      tujuan: rw.petugasTujuanId
        ? {
            id: rw.petugasTujuanId,
            name: rw.petugasTujuanNama ?? null,
          }
        : null,
    }));

    const transisiTersedia = (TRANSISI_PENGADUAN[row.status as StatusPengaduan] ?? []) as string[];

    // B10: EskalasiKe dibaca dari petugas_tujuan_id pada riwayat aksi ESKALASI terakhir
    const lastEscalation = riwayatList.find((r) => r.aksi === 'ESKALASI');
    const eskalasiAt = lastEscalation?.createdAt
      ? new Date(lastEscalation.createdAt).toISOString()
      : null;
    const alasanEskalasi = lastEscalation?.catatan ?? null;
    const eskalasiKe = lastEscalation?.petugasTujuanId
      ? {
          id: lastEscalation.petugasTujuanId,
          name: lastEscalation.petugasTujuanNama ?? null,
          role: 'SUPERVISOR',
        }
      : null;

    // B6: Hitung kewenangan dinamis berdasarkan role aktor + status + penerima tugas
    const roleAktor = aktor?.role;
    const aktorId = aktor?.id;
    const isClosed = row.status === 'DITUTUP';
    const isResolvedOrClosed =
      row.status === 'SELESAI' || row.status === 'DITUTUP' || row.status === 'DITOLAK';

    const kewenangan = {
      bisaTugaskan: roleAktor
        ? bolehMelakukan(roleAktor, 'TUGASKAN') && !isResolvedOrClosed
        : !isResolvedOrClosed,
      bisaEskalasi: roleAktor
        ? bolehMelakukan(roleAktor, 'ESKALASI', {
            penerimaTugasId: row.ditugaskanKeId,
            aktorId,
          }) && !isResolvedOrClosed
        : !isResolvedOrClosed,
      bisaChat: roleAktor
        ? bolehMelakukan(roleAktor, 'CATATAN_CHAT') && !isClosed
        : !isClosed,
      transisiDiizinkan: transisiTersedia.filter((st) => {
        if (!roleAktor) return true;
        const aksi = tentukanAksiDariStatus(st as StatusPengaduan);
        return bolehMelakukan(roleAktor, aksi, {
          penerimaTugasId: row.ditugaskanKeId,
          aktorId,
          klasifikasi: row.klasifikasi as KlasifikasiPengaduan,
        });
      }),
    };

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
      kebijakanVersi: row.kebijakanVersi,
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
      kewenangan,
    };
  }

  /**
   * 10. Daftar Petugas & Pejabat Struktural untuk Penugasan / Eskalasi
   * Mengambil data profil asli dari tabel `pegawai` (jabatanNama, bagian, level)
   * sekaligus membersihkan bridging VERIFIKATOR_1/VERIFIKATOR_2 yang tidak berada di bagian PENCATAT_METER.
   */
  async listPetugasPengaduan() {
    const rolesLayak: AppRole[] = [
      'PELAKSANA',
      'PENCATAT',
      'STAFF',
      'STAFF_ADMIN_BILLING',
      'SUPERVISOR',
      'MANAGER',
      'SENIOR_MANAGER',
      'VERIFIKATOR_1',
      'VERIFIKATOR_2',
      'VERIFIKATOR_3',
      'SUPERADMIN',
    ];

    try {
      // Koreksi otomatis di DB bila ada pegawai non-PENCATAT_METER yang masih menyimpan role VERIFIKATOR_1 / VERIFIKATOR_2 warisan seed lama
      await db.execute(sql`
        DELETE FROM user_roles ur
        USING pegawai p
        WHERE ur.user_id = p.user_id
          AND p.bagian <> 'PENCATAT_METER'
          AND ur.role IN ('VERIFIKATOR_1', 'VERIFIKATOR_2')
      `).catch(() => {});

      const eligibleUsers = await db
        .select({
          id: user.id,
          name: user.name,
          role: userRoles.role,
          level: pegawai.level,
          bagian: pegawai.bagian,
          jabatanNama: pegawai.jabatanNama,
        })
        .from(user)
        .innerJoin(userRoles, eq(user.id, userRoles.userId))
        .leftJoin(pegawai, eq(user.id, pegawai.userId))
        .where(inArray(userRoles.role, rolesLayak))
        .limit(200);

      // Prioritas role struktural bila tidak ada jabatanNama di tabel pegawai
      const ROLE_PRIORITY: Record<string, number> = {
        SENIOR_MANAGER: 1,
        MANAGER: 2,
        SUPERVISOR: 3,
        STAFF: 4,
        STAFF_ADMIN_BILLING: 5,
        PELAKSANA: 6,
        PENCATAT: 7,
        VERIFIKATOR_3: 8,
        VERIFIKATOR_2: 9,
        VERIFIKATOR_1: 10,
        SUPERADMIN: 11,
      };

      const userMap = new Map<
        string,
        {
          id: string;
          name: string | null;
          role: string;
          rawRolePriority: number;
          level: string | null;
          bagian: string | null;
          jabatan: string | null;
        }
      >();

      const hasOfficialPegawai = eligibleUsers.some((u) => u.bagian !== null);
      const sourceUsers = hasOfficialPegawai
        ? eligibleUsers.filter((u) => u.bagian !== null)
        : eligibleUsers;

      for (const u of sourceUsers) {
        const prio = ROLE_PRIORITY[u.role] ?? 99;
        const cleanJabatan = u.jabatanNama
          ? u.jabatanNama.replace(/\s+Wilayah\s+\d+$/i, '').trim()
          : null;
        const displayRole = cleanJabatan || u.level || u.role;

        const existing = userMap.get(u.id);
        if (!existing || prio < existing.rawRolePriority) {
          userMap.set(u.id, {
            id: u.id,
            name: u.name,
            role: displayRole,
            rawRolePriority: prio,
            level: u.level ?? null,
            bagian: u.bagian ?? null,
            jabatan: cleanJabatan,
          });
        }
      }

      return Array.from(userMap.values()).map(({ rawRolePriority, ...rest }) => rest);
    } catch (err) {
      console.error('[LIST_PETUGAS_PENGADUAN_ERR]', err);
      throw err;
    }
  }

  /**
   * 11. Tambah Catatan Internal / Publik ke Linimasa Tiket (B6, B12)
   */
  async tambahCatatanPengaduan(input: TambahCatatanPengaduanInput) {
    const [row] = await db
      .select({ id: pengaduan.id, status: pengaduan.status })
      .from(pengaduan)
      .where(or(eq(pengaduan.id, input.pengaduanId), eq(pengaduan.nomorTiket, input.pengaduanId)));

    if (!row) {
      throw new NotFoundError(`Pengaduan dengan identitas '${input.pengaduanId}' tidak ditemukan.`);
    }

    // B12: Catatan ditolak pada status DITUTUP
    if (row.status === 'DITUTUP') {
      throw new ValidationError('Tidak dapat menambahkan catatan pada tiket yang sudah ditutup.');
    }

    // B6: Verifikasi wewenang role internal
    if (input.aktor?.role) {
      if (!bolehMelakukan(input.aktor.role, 'CATATAN_CHAT')) {
        throw new ForbiddenError('Role Anda tidak memiliki izin untuk menambahkan catatan.');
      }
    }

    const validPetugasId = await this.sanitizeUserId(input.petugasId ?? input.aktor?.id);

    const [inserted] = await db
      .insert(riwayatPengaduan)
      .values({
        pengaduanId: row.id,
        aksi: 'CATATAN',
        statusDari: row.status as any,
        statusKe: row.status as any,
        catatan: input.catatan,
        isPublik: Boolean(input.isPublik),
        petugasId: validPetugasId,
      })
      .returning();

    return inserted;
  }

  /**
   * 12. Kirim Chat Interaksi Petugas dengan Pelapor (B6, B12)
   */
  async kirimChatPetugas(input: KirimChatPetugasInput) {
    const [row] = await db
      .select({ id: pengaduan.id, status: pengaduan.status })
      .from(pengaduan)
      .where(or(eq(pengaduan.id, input.pengaduanId), eq(pengaduan.nomorTiket, input.pengaduanId)));

    if (!row) {
      throw new NotFoundError(`Pengaduan dengan identitas '${input.pengaduanId}' tidak ditemukan.`);
    }

    // B12: Chat ditolak pada status DITUTUP
    if (row.status === 'DITUTUP') {
      throw new ValidationError('Tidak dapat mengirim pesan interaksi pada tiket yang sudah ditutup.');
    }

    // B6: Verifikasi wewenang role internal
    if (input.aktor?.role) {
      if (!bolehMelakukan(input.aktor.role, 'CATATAN_CHAT')) {
        throw new ForbiddenError('Role Anda tidak memiliki izin untuk mengirim interaksi pesan.');
      }
    }

    const validPetugasId = await this.sanitizeUserId(input.petugasId ?? input.aktor?.id);

    const [inserted] = await db
      .insert(riwayatPengaduan)
      .values({
        pengaduanId: row.id,
        aksi: 'CHAT',
        statusDari: row.status as any,
        statusKe: row.status as any,
        catatan: input.pesan,
        isPublik: input.isPublik !== undefined ? Boolean(input.isPublik) : true,
        petugasId: validPetugasId,
      })
      .returning();

    return inserted;
  }

  /**
   * 13. Eskalasi Tiket ke Supervisor / Prioritas Lebih Tinggi (B6, B8, B10, B12)
   */
  async eskalasiPengaduan(input: EskalasiPengaduanInput) {
    const [row] = await db
      .select()
      .from(pengaduan)
      .where(or(eq(pengaduan.id, input.pengaduanId), eq(pengaduan.nomorTiket, input.pengaduanId)));

    if (!row) {
      throw new NotFoundError(`Pengaduan dengan identitas '${input.pengaduanId}' tidak ditemukan.`);
    }

    // B12: Eskalasi ditolak pada SELESAI, DITUTUP, DITOLAK
    if (row.status === 'SELESAI' || row.status === 'DITUTUP' || row.status === 'DITOLAK') {
      throw new ValidationError(`Tiket berstatus ${row.status} tidak dapat dieskalasi.`);
    }

    // B6: Verifikasi wewenang aktor
    if (input.aktor?.role) {
      const boleh = bolehMelakukan(input.aktor.role, 'ESKALASI', {
        penerimaTugasId: row.ditugaskanKeId,
        aktorId: input.aktor.id ?? input.petugasId,
      });
      if (!boleh) {
        throw new ForbiddenError('Anda tidak memiliki wewenang untuk melakukan eskalasi tiket ini.');
      }
    }

    // B12: Eskalasi hanya boleh menaikkan prioritas (urutan RENDAH < NORMAL < TINGGI < DARURAT)
    const PRIORITAS_BOBOT: Record<PrioritasPengaduan, number> = {
      RENDAH: 1,
      NORMAL: 2,
      TINGGI: 3,
      DARURAT: 4,
    };

    const statusDari = row.status as StatusPengaduan;
    const prioritasLama = row.prioritas as PrioritasPengaduan;
    let prioritasAkhir = prioritasLama;

    if (input.prioritasBaru) {
      if (PRIORITAS_BOBOT[input.prioritasBaru] <= PRIORITAS_BOBOT[prioritasLama]) {
        throw new ValidationError(
          `Eskalasi prioritas hanya boleh menaikkan tingkat prioritas tiket (${prioritasLama} tidak dapat dieskalasi ke ${input.prioritasBaru}).`
        );
      }
      prioritasAkhir = input.prioritasBaru;
    }

    // B8: Pengunci optimistik di dalam transaksi DB
    return db.transaction(async (tx) => {
      const updateData: Partial<PengaduanRow> = {
        prioritas: prioritasAkhir,
        updatedAt: new Date(),
      };

      if (input.eskalasiKeId) {
        updateData.ditugaskanKeId = input.eskalasiKeId;
      }

      // B12: Hitung ulang targetSelesaiAt & targetResponsAt saat prioritas naik
      if (input.prioritasBaru) {
        const slaBaru = hitungTargetSla(input.prioritasBaru, row.createdAt, {
          jenis: row.jenis as JenisPengaduan,
        });
        const jedaMs = (row.jedaTotalMenit ?? 0) * 60 * 1000;
        updateData.targetSelesaiAt = new Date(slaBaru.targetSelesaiAt.getTime() + jedaMs);
        if (!row.responsAt) {
          updateData.targetResponsAt = slaBaru.targetResponsAt;
        }
      }

      const [updated] = await tx
        .update(pengaduan)
        .set(updateData)
        .where(and(eq(pengaduan.id, row.id), eq(pengaduan.status, statusDari)))
        .returning();

      if (!updated) {
        throw new ConflictError('Status tiket sudah berubah oleh proses lain, silakan muat ulang.');
      }

      const validPetugasId = await this.sanitizeUserId(input.petugasId ?? input.aktor?.id);

      // B10: Catat petugas_tujuan_id pada riwayat aksi ESKALASI
      await tx.insert(riwayatPengaduan).values({
        pengaduanId: row.id,
        aksi: 'ESKALASI',
        statusDari,
        statusKe: statusDari,
        petugasId: validPetugasId,
        petugasTujuanId: input.eskalasiKeId ?? null,
        catatan:
          input.catatan ??
          (input.prioritasBaru
            ? `Tiket dieskalasi ke prioritas ${prioritasAkhir}.`
            : 'Tiket dialihkan ke petugas lain.'),
        isPublik: true,
      });

      return updated;
    });
  }

  /**
   * 14. Penutupan Otomatis Pengaduan Selesai yang Melewati Batas Konfirmasi (K4, K6)
   * Hanya menyasar tiket SELESAI dengan konfirmasiBatasAt tidak null dan < now
   */
  async tutupOtomatisKedaluwarsa(options: { dryRun?: boolean } = {}) {
    const sekarang = new Date();
    const dryRun = Boolean(options.dryRun);

    const expiredRows = await db
      .select({
        id: pengaduan.id,
        nomorTiket: pengaduan.nomorTiket,
        status: pengaduan.status,
        konfirmasiBatasAt: pengaduan.konfirmasiBatasAt,
      })
      .from(pengaduan)
      .where(
        and(
          eq(pengaduan.status, 'SELESAI'),
          isNotNull(pengaduan.konfirmasiBatasAt),
          sql`${pengaduan.konfirmasiBatasAt} < NOW()`
        )
      );

    if (dryRun) {
      return {
        dryRun: true,
        totalDitemukan: expiredRows.length,
        tiketKedaluwarsa: expiredRows.map((r) => ({
          id: r.id,
          nomorTiket: r.nomorTiket,
          konfirmasiBatasAt: r.konfirmasiBatasAt,
        })),
        berhasilDitutup: 0,
      };
    }

    let berhasilDitutup = 0;
    for (const tiket of expiredRows) {
      try {
        await db.transaction(async (tx) => {
          const [updated] = await tx
            .update(pengaduan)
            .set({
              status: 'DITUTUP',
              updatedAt: new Date(),
            })
            .where(and(eq(pengaduan.id, tiket.id), eq(pengaduan.status, 'SELESAI')))
            .returning();

          if (updated) {
            await tx.insert(riwayatPengaduan).values({
              pengaduanId: tiket.id,
              aksi: 'DITUTUP_OTOMATIS',
              statusDari: 'SELESAI',
              statusKe: 'DITUTUP',
              catatan:
                'Tiket ditutup secara otomatis oleh sistem karena melewati batas waktu konfirmasi warga.',
              isPublik: true,
            });
            berhasilDitutup++;
          }
        });
      } catch (err) {
        console.error(`[AUTO_CLOSE_TIKET_ERR] Gagal menutup tiket ${tiket.nomorTiket}:`, err);
      }
    }

    return {
      dryRun: false,
      totalDitemukan: expiredRows.length,
      berhasilDitutup,
    };
  }
}

export const pengaduanService = new PengaduanService();
