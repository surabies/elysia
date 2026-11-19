/**
 * Service: Import Data & Pemulihan Operasional (Backup HP, R-Nomor, PBPK)
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM & File Storage)
 *
 * Mengelola:
 * 1. Import Foto Backup (stand, segel, rumah dari backup mobile app petugas)
 *    Format penamaan baku: {THBL}_{JENIS}_{NOLG}.jpg
 *    Contoh: 202601_stand_00703600750.jpg, 202601_segel_00703600750.jpg, 202601_rumah_00703600750.jpg
 * 2. Import Data Pencatatan (pemulihan data bacaan meter jika upload mobile gagal)
 *    Mendukung format CSV & JSON baku Mobile Backup
 * 3. Import R Nomor (pemutusan pelanggan / status R)
 * 4. Import PBPK (Pasang Baru & Pemasangan Kembali dari file CSV PDAM)
 */

import fs from 'fs';
import path from 'path';
import { eq, sql } from 'drizzle-orm';
import {
  db,
  pelanggan,
  caterBacaMeter,
  waterMeter,
  daftarCatat,
} from '@cater/db';
import {
  isCloudinaryConfigured,
  uploadToCloudinary,
  type ModulFoto,
  type JenisFoto,
} from '../../lib/cloudinary';

export interface ParsedPhotoInfo {
  thbl: string;
  jenis: 'stand' | 'segel' | 'rumah';
  nolg: string;
  ext: string;
  rawFileName: string;
}

export interface FotoUploadFileItem {
  fileName: string;
  fileData: string; // Base64 data URL atau plain base64
}

export interface DataPencatatanItem {
  thbl: string;
  nolg: string;
  stml: number;
  stma: number;
  pakaiM3?: number;
  tglCatat?: string;
  petugasId?: string;
  ruteKode?: string;
  ketCatat?: string;
  metodeCatat?: string;
  latitude?: number;
  longitude?: number;
  catatan?: string;
}

export interface RNomorItem {
  nolg: string;
  tglPutus?: string;
  nomorBa?: string;
  standCabut?: number;
  alasan?: string;
}

export interface PbpkCsvRow {
  nolg: string;
  nolangganan?: string;
  nama: string;
  kd_kecamatan?: string;
  kd_kelurahan?: string;
  rt?: string;
  rw?: string;
  alamat: string;
  notelp?: string;
  jmlpenghuni?: number;
  nometer?: string;
  kd_merkmeter?: string;
  kd_ukmeter?: string;
  tglaktif?: string;
  sta_aktif?: string;
  wilayah?: string;
  kd_rute?: string;
  updater?: string;
  geo_long?: string;
  goe_lat?: string;
  kode_wilayah?: string;
  kd_goltarif?: string;
  no_urutrute?: number;
  mutasian: 'PB' | 'PK' | string;
}

export class ImportDataService {
  /**
   * Helper: Parse Penamaan Berkas Foto Mobile Backup
   * Format baku: {THBL}_{JENIS}_{NOLG}.jpg
   * Contoh:
   * - 202601_stand_00703600750.jpg -> { thbl: '202601', jenis: 'stand', nolg: '00703600750', ext: 'jpg' }
   * - 202601_segel_00703600750.jpg -> { thbl: '202601', jenis: 'segel', nolg: '00703600750', ext: 'jpg' }
   * - 202601_rumah_00703600750.jpg -> { thbl: '202601', jenis: 'rumah', nolg: '00703600750', ext: 'jpg' }
   */
  parsePhotoFileName(fileName: string): ParsedPhotoInfo | null {
    const cleanName = path.basename(fileName).trim();
    const match = cleanName.match(
      /^(\d{6})_(stand|segel|rumah)_([a-zA-Z0-9_-]+)\.(jpg|jpeg|png|webp)$/i
    );
    if (!match) return null;

    return {
      thbl: match[1],
      jenis: match[2].toLowerCase() as 'stand' | 'segel' | 'rumah',
      nolg: match[3],
      ext: match[4].toLowerCase(),
      rawFileName: cleanName,
    };
  }

  /**
   * Helper: Simpan Berkas Gambar (Cloudinary atau Local Storage Publik)
   */
  async savePhotoFile(
    parsed: ParsedPhotoInfo,
    fileData: string
  ): Promise<string> {
    if (isCloudinaryConfigured()) {
      try {
        const uploadRes = await uploadToCloudinary({
          file: fileData.startsWith('data:') ? fileData : `data:image/jpeg;base64,${fileData}`,
          modul: 'cater' as ModulFoto,
          jenis: parsed.jenis as JenisFoto,
          identifier: parsed.nolg,
          thbl: parsed.thbl,
        });
        if (uploadRes.secureUrl || uploadRes.url) {
          return uploadRes.secureUrl || uploadRes.url;
        }
      } catch (cloudErr) {
        console.warn(`[Cloudinary Warning] Upload to Cloudinary failed for ${parsed.rawFileName}, falling back to local storage:`, cloudErr);
      }
    }

    // Fallback simpan lokal ke public/uploads/cater/{thbl}/{filename}
    const publicDirCandidates = [
      path.resolve(process.cwd(), 'apps/web/public/uploads/cater', parsed.thbl),
      path.resolve(process.cwd(), 'public/uploads/cater', parsed.thbl),
    ];
    let uploadDir = publicDirCandidates[0];
    for (const dir of publicDirCandidates) {
      if (fs.existsSync(path.dirname(path.dirname(dir)))) {
        uploadDir = dir;
        break;
      }
    }

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const targetPath = path.join(uploadDir, parsed.rawFileName);
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(targetPath, Buffer.from(base64Data, 'base64'));

    return `/uploads/cater/${parsed.thbl}/${parsed.rawFileName}`;
  }

  /**
   * 1. Import Paket Foto Backup (File stand, segel, rumah dari HP Petugas)
   * Membaca penamaan file {THBL}_{JENIS}_{NOLG}.jpg, menyimpan foto,
   * dan memetakan langsung ke tabel cater_baca_meter:
   * - jenis 'stand' -> fotoMeterUrl
   * - jenis 'segel' -> fotoSegelUrl
   * - jenis 'rumah' -> fotoRumahUrl
   */
  async importFotoBackupFiles(files: FotoUploadFileItem[]) {
    if (!files || files.length === 0) {
      throw new Error('Tidak ada berkas foto yang dikirim.');
    }

    const results = {
      totalFiles: files.length,
      sukses: 0,
      gagal: 0,
      detail: [] as {
        fileName: string;
        nolg?: string;
        thbl?: string;
        jenis?: string;
        url?: string;
        status: 'SUCCESS' | 'FAILED';
        error?: string;
      }[],
    };

    // Kelompokkan update per nolg + thbl untuk meminimalkan transaksi
    const grouped = new Map<
      string,
      {
        thbl: string;
        nolg: string;
        updates: {
          fotoMeterUrl?: string;
          fotoSegelUrl?: string;
          fotoRumahUrl?: string;
        };
      }
    >();

    for (const file of files) {
      const parsed = this.parsePhotoFileName(file.fileName);
      if (!parsed) {
        results.gagal++;
        results.detail.push({
          fileName: file.fileName,
          status: 'FAILED',
          error:
            'Format nama berkas tidak valid. Harus sesuai standar: {THBL}_{JENIS}_{NOLG}.jpg (contoh: 202601_stand_00703600750.jpg)',
        });
        continue;
      }

      try {
        const photoUrl = await this.savePhotoFile(parsed, file.fileData);

        const groupKey = `${parsed.thbl}_${parsed.nolg}`;
        if (!grouped.has(groupKey)) {
          grouped.set(groupKey, {
            thbl: parsed.thbl,
            nolg: parsed.nolg,
            updates: {},
          });
        }

        const groupEntry = grouped.get(groupKey)!;
        if (parsed.jenis === 'stand') {
          groupEntry.updates.fotoMeterUrl = photoUrl;
        } else if (parsed.jenis === 'segel') {
          groupEntry.updates.fotoSegelUrl = photoUrl;
        } else if (parsed.jenis === 'rumah') {
          groupEntry.updates.fotoRumahUrl = photoUrl;
        }

        results.sukses++;
        results.detail.push({
          fileName: file.fileName,
          nolg: parsed.nolg,
          thbl: parsed.thbl,
          jenis: parsed.jenis,
          url: photoUrl,
          status: 'SUCCESS',
        });
      } catch (err: any) {
        results.gagal++;
        results.detail.push({
          fileName: file.fileName,
          nolg: parsed.nolg,
          thbl: parsed.thbl,
          jenis: parsed.jenis,
          status: 'FAILED',
          error: err.message,
        });
      }
    }

    // Lakukan mapping dan sinkronisasi ke tabel cater_baca_meter
    for (const [, entry] of grouped.entries()) {
      try {
        const [existing] = await db
          .select({
            id: caterBacaMeter.id,
            catatan: caterBacaMeter.catatan,
            sumberCatat: caterBacaMeter.sumberCatat,
            statusVerifikasi: caterBacaMeter.statusVerifikasi,
          })
          .from(caterBacaMeter)
          .where(
            sql`${caterBacaMeter.thbl} = ${entry.thbl} AND ${caterBacaMeter.nolg} = ${entry.nolg}`
          );

        if (existing) {
          // Koreksi foto: menimpa URL foto meter/segel/rumah petugas dengan foto baru yang sah,
          // sambil tetap mempertahankan data angka stand (stml, stma), id petugas, dan metadata asli
          const updatedCatatan =
            existing.catatan && !existing.catatan.includes('dikoreksi')
              ? `${existing.catatan} (Foto dikoreksi via Import)`
              : existing.catatan || 'Foto diperbarui dari Import Backup HP';

          await db
            .update(caterBacaMeter)
            .set({
              ...entry.updates,
              catatan: updatedCatatan,
              updatedAt: new Date(),
            })
            .where(eq(caterBacaMeter.id, existing.id));
        } else {
          // Cari info rute dari master pelanggan jika ada
          const [cust] = await db
            .select({ ruteKode: pelanggan.ruteKode })
            .from(pelanggan)
            .where(eq(pelanggan.nolg, entry.nolg));

          await db.insert(caterBacaMeter).values({
            thbl: entry.thbl,
            nolg: entry.nolg,
            ruteKode: cust?.ruteKode || null,
            petugasId: null,
            stml: '0',
            stma: '0',
            pakaiM3: '0',
            sumberCatat: 'BACKUP_MOBILE',
            statusVerifikasi: 'SUBMITTED',
            ...entry.updates,
            catatan: 'Dibuat otomatis dari Import Foto Backup HP (Menunggu Data Angka Stand)',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } catch (err) {
        console.error(`[IMPORT_FOTO_SYNC_ERROR] ${entry.nolg}:`, err);
      }
    }

    return results;
  }

  /**
   * Helper: Parser Format Baku CSV Data Pencatatan Mobile & LapDataMeter PDAM
   * Mendukung 2 format:
   * 1. Baku Mobile: thbl;nolg;stml;stma;pakai_m3;tgl_catat;petugas_id;rute_kode;kondisi;latitude;longitude;catatan
   * 2. Laporan Data Meter PDAM (lapdatameter): "No Pel";Nama;Alamat;Periode;"St AWAL";"St Akhir";"St Akhir Catat";Pakai;...
   */
  parsePencatatanCsv(csvText: string): DataPencatatanItem[] {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) return [];

    const delimiter = lines[0].includes(';') ? ';' : ',';
    const header = lines[0]
      .split(delimiter)
      .map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

    const items: DataPencatatanItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map((p) => p.replace(/^["']|["']$/g, '').trim());
      if (parts.length < 3) continue;

      const obj: any = {};
      header.forEach((col, idx) => {
        obj[col] = parts[idx] ?? '';
      });

      // Deteksi nomor pelanggan dan periode (mendukung format mobile & format resmi lapdatameter)
      const rawNolg = (obj['no pel'] || obj['nolg'] || obj['nomor_pelanggan'])?.replace(/\s+/g, '');
      const rawThbl = (obj['periode'] || obj['thbl'])?.replace(/\s+/g, '');

      if (rawNolg && rawThbl) {
        const stml = parseFloat(obj['st awal'] ?? obj['stml'] ?? '0') || 0;
        const stma = parseFloat(obj['st akhir'] ?? obj['stma'] ?? '0') || 0;
        const pakaiM3 = obj['pakai']
          ? parseFloat(obj['pakai'])
          : obj['pakai_m3']
            ? parseFloat(obj['pakai_m3'])
            : Math.max(0, stma - stml);

        const ketCatat = obj['nm_kel'] || obj['kondisi'] || obj['ket_catat'] || 'Normal';
        const petugasId = obj['kd_petugas'] || obj['nama petugas'] || obj['petugas_id'] || 'PETUGAS_OFFLINE';
        const ruteKode = obj['rute'] || obj['rute_kode'] || '';
        const catatan =
          obj['catatan'] ||
          (obj['nama zonasi'] ? `Zonasi: ${obj['nama zonasi']}` : 'Import Laporan Data Meter');

        items.push({
          thbl: rawThbl,
          nolg: rawNolg,
          stml,
          stma,
          pakaiM3,
          tglCatat: obj['tgl_catat'] || new Date().toISOString(),
          petugasId,
          ruteKode,
          ketCatat,
          latitude: obj['latitude'] ? parseFloat(obj['latitude']) : undefined,
          longitude: obj['longitude'] ? parseFloat(obj['longitude']) : undefined,
          catatan,
        });
      }
    }

    return items;
  }

  /**
   * 2. Import Data Pencatatan (File CSV / JSON Backup Mobile)
   * Memulihkan data angka stand meter hasil pencatatan mobile.
   * Terintegrasi mulus dengan foto yang sudah diunggah sebelumnya.
   */
  async importDataPencatatan(items: DataPencatatanItem[]) {
    if (!items || items.length === 0) {
      throw new Error('Tidak ada data pencatatan yang dikirim.');
    }

    const results = {
      total: items.length,
      sukses: 0,
      gagal: 0,
      detail: [] as { nolg: string; status: 'SUCCESS' | 'FAILED'; error?: string }[],
    };

    for (const item of items) {
      try {
        const [cust] = await db
          .select({ nolg: pelanggan.nolg, ruteKode: pelanggan.ruteKode })
          .from(pelanggan)
          .where(eq(pelanggan.nolg, item.nolg));

        if (!cust) {
          throw new Error(`Pelanggan ${item.nolg} tidak ditemukan di master database.`);
        }

        const pakaiM3 = item.pakaiM3 ?? Math.max(0, item.stma - item.stml);
        const ruteKodeFinal = item.ruteKode || cust.ruteKode || null;
        const tglCatat = item.tglCatat ? new Date(item.tglCatat) : new Date();

        const [existing] = await db
          .select({ id: caterBacaMeter.id })
          .from(caterBacaMeter)
          .where(
            sql`${caterBacaMeter.thbl} = ${item.thbl} AND ${caterBacaMeter.nolg} = ${item.nolg}`
          );

        if (existing) {
          // Update data pencatatan tanpa menghapus URL foto yang sudah ada
          await db
            .update(caterBacaMeter)
            .set({
              stml: String(item.stml),
              stma: String(item.stma),
              pakaiM3: String(pakaiM3),
              ketCatat: item.ketCatat || 'Normal',
              metodeCatat: item.metodeCatat || 'OFFSITE',
              sumberCatat: 'BACKUP_MOBILE',
              tglCatat,
              statusVerifikasi: 'SUBMITTED',
              catatan: item.catatan || 'Data stan meter dipulihkan dari mobile backup',
              updatedAt: new Date(),
            })
            .where(eq(caterBacaMeter.id, existing.id));
        } else {
          await db.insert(caterBacaMeter).values({
            thbl: item.thbl,
            nolg: item.nolg,
            ruteKode: ruteKodeFinal,
            petugasId: item.petugasId || 'BACKUP_OFFLINE',
            stml: String(item.stml),
            stma: String(item.stma),
            pakaiM3: String(pakaiM3),
            ketCatat: item.ketCatat || 'Normal',
            metodeCatat: item.metodeCatat || 'OFFSITE',
            sumberCatat: 'BACKUP_MOBILE',
            tglCatat,
            statusVerifikasi: 'SUBMITTED',
            catatan: item.catatan || 'Data baru dari mobile backup',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        results.sukses++;
        results.detail.push({ nolg: item.nolg, status: 'SUCCESS' });
      } catch (err: any) {
        results.gagal++;
        results.detail.push({ nolg: item.nolg, status: 'FAILED', error: err.message });
      }
    }

    return results;
  }

  /**
   * 3. Import R Nomor (Pemutusan Pelanggan & Rekening Non-aktif)
   */
  async importRNomor(items: RNomorItem[]) {
    if (!items || items.length === 0) {
      throw new Error('Tidak ada data pemutusan R-Nomor yang dikirim.');
    }

    const results = {
      total: items.length,
      sukses: 0,
      gagal: 0,
      detail: [] as { nolg: string; status: 'SUCCESS' | 'FAILED'; error?: string }[],
    };

    for (const item of items) {
      try {
        const [cust] = await db
          .select({ nolg: pelanggan.nolg, status: pelanggan.status })
          .from(pelanggan)
          .where(eq(pelanggan.nolg, item.nolg));

        if (!cust) {
          throw new Error(`Nomor langganan ${item.nolg} tidak ditemukan.`);
        }

        await db
          .update(pelanggan)
          .set({
            status: 'NON AKTIF (R)',
            updatedAt: new Date(),
          })
          .where(eq(pelanggan.nolg, item.nolg));

        results.sukses++;
        results.detail.push({ nolg: item.nolg, status: 'SUCCESS' });
      } catch (err: any) {
        results.gagal++;
        results.detail.push({ nolg: item.nolg, status: 'FAILED', error: err.message });
      }
    }

    return results;
  }

  /**
   * 4. Parser & Import PBPK (Pasang Baru & Pemasangan Kembali)
   * Berkas acuan: data/raw/PBPK.csv
   */
  parsePbpkCsv(csvText: string): PbpkCsvRow[] {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) return [];

    const delimiter = lines[0].includes(';') ? ';' : ',';
    const header = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());

    const rows: PbpkCsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map((p) => p.trim());
      if (parts.length < 3) continue;

      const obj: any = {};
      header.forEach((col, idx) => {
        obj[col] = parts[idx] ?? '';
      });

      if (obj.nolg) {
        rows.push({
          nolg: obj.nolg,
          nolangganan: obj.nolangganan || obj.nolg,
          nama: obj.nama || 'Pelanggan Baru',
          kd_kecamatan: obj.kd_kecamatan,
          kd_kelurahan: obj.kd_kelurahan,
          rt: obj.rt,
          rw: obj.rw,
          alamat: obj.alamat || '-',
          notelp: obj.notelp || '',
          jmlpenghuni: parseInt(obj.jmlpenghuni, 10) || 4,
          nometer: obj.nometer || `MTR-${obj.nolg}`,
          kd_merkmeter: obj.kd_merkmeter || 'ITR',
          kd_ukmeter: obj.kd_ukmeter || '1/2',
          tglaktif: obj.tglaktif,
          sta_aktif: obj.sta_aktif,
          wilayah: obj.wilayah,
          kd_rute: obj.kd_rute || '99999',
          updater: obj.updater,
          kode_wilayah: obj.kode_wilayah,
          kd_goltarif: obj.kd_goltarif || '2A2',
          no_urutrute: parseInt(obj.no_urutrute, 10) || 0,
          mutasian: (obj.mutasian?.toUpperCase() === 'PK' ? 'PK' : 'PB') as 'PB' | 'PK',
        });
      }
    }

    return rows;
  }

  /**
   * Eksekusi Import PBPK ke Database (Master Pelanggan, Water Meter & DPM)
   */
  async importPbpk(rows: PbpkCsvRow[], targetPeriode = '202601') {
    if (!rows || rows.length === 0) {
      throw new Error('Data PBPK kosong.');
    }

    const stats = {
      total: rows.length,
      pb: 0,
      pk: 0,
      sukses: 0,
      gagal: 0,
      detail: [] as { nolg: string; mutasian: string; status: 'SUCCESS' | 'FAILED'; error?: string }[],
    };

    for (const row of rows) {
      try {
        await db.transaction(async (tx) => {
          const noMeter = row.nometer?.trim() || `MTR-${row.nolg}`;

          await tx
            .insert(waterMeter)
            .values({
              noMeter,
              merk: row.kd_merkmeter || 'ITR',
              ukuran: row.kd_ukmeter || '1/2',
              tglPasang: new Date(),
              umurTahun: 0,
              umurBulan: 0,
              kondisi: 'Normal',
            })
            .onConflictDoNothing({ target: waterMeter.noMeter });

          if (row.mutasian === 'PB') {
            const [cust] = await tx
              .select({ nolg: pelanggan.nolg })
              .from(pelanggan)
              .where(eq(pelanggan.nolg, row.nolg));

            if (!cust) {
              await tx.insert(pelanggan).values({
                nolg: row.nolg,
                nama: row.nama,
                alamat: row.alamat,
                rt: row.rt || null,
                rw: row.rw || null,
                noTelp: row.notelp || null,
                jmlPenghuni: row.jmlpenghuni || 4,
                tarifKode: row.kd_goltarif || '2A2',
                ruteKode: row.kd_rute || '99999',
                noUrutRute: row.no_urutrute || 0,
                noMeter,
                status: 'PELANGGAN AKTIF',
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            } else {
              await tx
                .update(pelanggan)
                .set({
                  nama: row.nama,
                  alamat: row.alamat,
                  tarifKode: row.kd_goltarif || '2A2',
                  status: 'PELANGGAN AKTIF',
                  noMeter,
                  updatedAt: new Date(),
                })
                .where(eq(pelanggan.nolg, row.nolg));
            }
            stats.pb++;
          } else {
            const [cust] = await tx
              .select({ nolg: pelanggan.nolg })
              .from(pelanggan)
              .where(eq(pelanggan.nolg, row.nolg));

            if (cust) {
              await tx
                .update(pelanggan)
                .set({
                  status: 'PELANGGAN AKTIF',
                  tarifKode: row.kd_goltarif || '2A2',
                  noMeter,
                  updatedAt: new Date(),
                })
                .where(eq(pelanggan.nolg, row.nolg));
            } else {
              await tx.insert(pelanggan).values({
                nolg: row.nolg,
                nama: row.nama,
                alamat: row.alamat,
                tarifKode: row.kd_goltarif || '2A2',
                ruteKode: row.kd_rute || '99999',
                noUrutRute: row.no_urutrute || 0,
                noMeter,
                status: 'PELANGGAN AKTIF',
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
            stats.pk++;
          }

          await tx
            .insert(daftarCatat)
            .values({
              periode: targetPeriode,
              nolg: row.nolg,
              ruteKode: row.kd_rute || '99999',
              urutan: row.no_urutrute || 0,
              sumber: row.mutasian === 'PK' ? 'PK' : 'PBPK',
              status: 'BELUM_DICATAT',
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .onConflictDoNothing({
              target: [daftarCatat.periode, daftarCatat.nolg],
            });
        });

        stats.sukses++;
        stats.detail.push({
          nolg: row.nolg,
          mutasian: row.mutasian,
          status: 'SUCCESS',
        });
      } catch (err: any) {
        stats.gagal++;
        stats.detail.push({
          nolg: row.nolg,
          mutasian: row.mutasian,
          status: 'FAILED',
          error: err.message,
        });
      }
    }

    return stats;
  }
}

export const importDataService = new ImportDataService();
