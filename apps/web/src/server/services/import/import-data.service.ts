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
import { eq, sql, and, inArray } from 'drizzle-orm';
import {
  db,
  pelanggan,
  caterBacaMeter,
  waterMeter,
  daftarCatat,
  petugasCater,
  ruteCater,
  golonganTarif,
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

export interface LapDataMeterItem {
  thbl: string;
  nolg: string;
  nama?: string;
  alamat?: string;
  stml: number;
  stma: number;
  stmaCatat?: number;
  pakaiM3?: number;
  pakaiLalu?: number;
  persentase?: number;
  trf?: string;
  tmss?: string;
  ketCatat?: string;
  petugasId?: string;
  namaPetugas?: string;
  kdWm?: string;
  wil?: string;
  ruteKode?: string;
  zonaWil?: string;
  kdZonasi?: string;
  namaZonasi?: string;
  kecamatan?: string;
  kelurahan?: string;
  tglCatat?: string;
  tglUpload?: string;
  catatan?: string;
}

export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (!insideQuotes && (char === ',' || char === ';')) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if (!insideQuotes && (char === '\r' || char === '\n')) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
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
      if (fs.existsSync(/* turbopackIgnore: true */ path.dirname(path.dirname(dir)))) {
        uploadDir = dir;
        break;
      }
    }

    if (!fs.existsSync(/* turbopackIgnore: true */ uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const targetPath = path.join(uploadDir, parsed.rawFileName);
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(/* turbopackIgnore: true */ targetPath, Buffer.from(base64Data, 'base64'));

    return `/uploads/cater/${parsed.thbl}/${parsed.rawFileName}`;
  }

  /**
   * 1. Import Paket Foto Backup (File stand, segel, rumah dari HP Petugas)
   * Membaca penamaan file {THBL}_{JENIS}_{NOLG}.jpg, menyimpan foto,
   * dan memetakan langsung ke tabel cater_baca_meter:
   * - jenis 'stand' -> fotoMeterUrl
   * - jenis 'segel' -> fotoSegelUrl
   * - jenis 'rumah' -> fotoRumahUrl
   *
   * Perbaikan terkait:
   * - Validasi jumlah berkas maksimal (100 per batch)
   * - Validasi ukuran berkas maksimal (5 MB per berkas, perkiraan dari base64)
   * - Semua operasi DB diwrap dalam satu transaksi untuk atomicity
   * - Hitungan sukses/gagal hanya dilakukan setelah sinkronisasi DB selesai
   * - Gagal DB menandai semua berkas dalam grup tersebut sebagai FAILED
   */
  async importFotoBackupFiles(files: FotoUploadFileItem[]) {
    const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    const MAX_FILES = 100;

    if (!files || files.length === 0) {
      throw new Error('Tidak ada berkas foto yang dikirim.');
    }

    if (files.length > MAX_FILES) {
      throw new Error(`Maksimal ${MAX_FILES} berkas per batch impor.`);
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

    // Validasi ukuran berkas (perkiraan dari base64)
    const validFiles: FotoUploadFileItem[] = [];
    for (const file of files) {
      const estimatedSizeBytes = Math.round((file.fileData.length * 3) / 4);
      if (estimatedSizeBytes > MAX_FILE_SIZE_BYTES) {
        results.gagal++;
        results.detail.push({
          fileName: file.fileName,
          status: 'FAILED',
          error: `Ukuran berkas melebihi batas 5 MB (perkiraan ${Math.round(estimatedSizeBytes / 1024)} KB)`,
        });
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      return results;
    }

    // Kelompokkan update per nolg + thbl
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
        sourceFiles: string[];
      }
    >();

    // Fase 1: Parse dan simpan berkas (belum dihitung sukses DB)
    for (const file of validFiles) {
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
            sourceFiles: [],
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
        groupEntry.sourceFiles.push(file.fileName);

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

    // Fase 2: Sinkronisasi ke tabel cater_baca_meter dalam satu transaksi
    try {
      await db.transaction(async (tx) => {
        for (const [, entry] of grouped.entries()) {
          try {
            const [existing] = await tx
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
              const updatedCatatan =
                existing.catatan && !existing.catatan.includes('dikoreksi')
                  ? `${existing.catatan} (Foto dikoreksi via Import)`
                  : existing.catatan || 'Foto diperbarui dari Import Backup HP';

              await tx
                .update(caterBacaMeter)
                .set({
                  ...entry.updates,
                  catatan: updatedCatatan,
                  updatedAt: new Date(),
                })
                .where(eq(caterBacaMeter.id, existing.id));
            } else {
              const [cust] = await tx
                .select({ ruteKode: pelanggan.ruteKode })
                .from(pelanggan)
                .where(eq(pelanggan.nolg, entry.nolg));

              await tx.insert(caterBacaMeter).values({
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

            results.sukses++;
          } catch (err) {
            results.gagal++;
            // Tandai semua berkas dalam grup ini sebagai FAILED karena DB gagal
            for (const srcFile of entry.sourceFiles) {
              const existingDetail = results.detail.find((d) => d.fileName === srcFile);
              if (existingDetail && existingDetail.status === 'SUCCESS') {
                existingDetail.status = 'FAILED';
                existingDetail.error = err.message;
                results.sukses--;
              }
            }
            console.error(`[IMPORT_FOTO_SYNC_ERROR] ${entry.nolg}:`, err);
          }
        }
      });
    } catch (txErr: any) {
      // Transaksi gagal total
      for (const detail of results.detail) {
        if (detail.status === 'SUCCESS') {
          detail.status = 'FAILED';
          detail.error = txErr.message;
          results.sukses--;
          results.gagal++;
        }
      }
      console.error('[IMPORT_FOTO_TRANSACTION_ERROR]', txErr);
    }

    return results;
  }

  /**
   * Helper: Parser Format Baku CSV Data Pencatatan Mobile & LapDataMeter PDAM
   * Mendukung 2 format:
   * 1. Baku Mobile: thbl;nolg;stml;stma;pakai_m3;tgl_catat;petugas_id;rute_kode;kondisi;latitude;longitude;catatan
   * 2. Laporan Data Meter PDAM (lapdatameter): "No Pel";Nama;Alamat;Periode;"St AWAL";"St Akhir";"St Akhir Catat";Pakai;...
   */
  /**
   * Helper: Parser Format Baku CSV Data Pencatatan Mobile & LapDataMeter PDAM
   * Mendukung 2 format:
   * 1. Baku Mobile: thbl;nolg;stml;stma;pakai_m3;tgl_catat;petugas_id;rute_kode;kondisi;latitude;longitude;catatan
   * 2. Laporan Data Meter PDAM (lapdatameter): "No Pel";Nama;Alamat;Periode;"St AWAL";"St Akhir";"St Akhir Catat";Pakai;...
   */
  parsePencatatanCsv(csvText: string): DataPencatatanItem[] {
    const rows = parseCsvRows(csvText);
    if (rows.length < 2) return [];

    const header = rows[0].map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

    const items: DataPencatatanItem[] = [];

    for (let i = 1; i < rows.length; i++) {
      const parts = rows[i];
      if (parts.length < 3) continue;

      const obj: any = {};
      header.forEach((col, idx) => {
        obj[col] = parts[idx] ?? '';
      });

      // Deteksi nomor pelanggan dan periode (mendukung format mobile & format resmi lapdatameter)
      const rawNolg = (obj['no pel'] || obj['nolg'] || obj['nomor_pelanggan'])?.replace(/[^\w-]/g, '').trim();
      const rawThbl = (obj['periode'] || obj['thbl'])?.replace(/[^\w]/g, '').trim();

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
   * Helper: Parser Format Resmi PDAM LapDataMeter CSV
   * Kolom: "No Pel",Nama,Alamat,Periode,"St AWAL","St Akhir","St Akhir Catat",Pakai,"Pakai Lau",persentase,Trf,Kd_kel,Nm_Kel,kd_petugas,kd_wm,Wil,Rute,"Zona Wil","Kd Zonasi","Nama Zonasi",Kecamatan,Kelurahan,tgl_catat,tgl_upload,"Nama Petugas"
   */
  parseLapDataMeterCsv(csvText: string): LapDataMeterItem[] {
    const rows = parseCsvRows(csvText);
    if (rows.length < 2) return [];

    const header = rows[0].map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

    const findIdx = (aliases: string[]) =>
      header.findIndex((h) => aliases.some((a) => h === a || h.includes(a)));

    const nolgIdx = findIdx(['no pel', 'nolg', 'nomor pelanggan', 'nopel']);
    const namaIdx = findIdx(['nama', 'nama pelanggan']);
    const alamatIdx = findIdx(['alamat']);
    const thblIdx = findIdx(['periode', 'thbl']);
    const stmlIdx = findIdx(['st awal', 'stml', 'stand awal']);
    const stmaIdx = findIdx(['st akhir', 'stma', 'stand akhir']);
    const stmaCatatIdx = findIdx(['st akhir catat']);
    const pakaiIdx = findIdx(['pakai', 'pakai_m3', 'kubikasi']);
    const pakaiLaluIdx = findIdx(['pakai lau', 'pakai lalu', 'pakai_lalu']);
    const persenIdx = findIdx(['persentase', 'persen']);
    const trfIdx = findIdx(['trf', 'tarif', 'kd_goltarif', 'golongan']);
    const tmssIdx = findIdx(['kd_kel', 'tmss', 'kode_kondisi']);
    const ketCatatIdx = findIdx(['nm_kel', 'kondisi', 'ket_catat', 'keterangan']);
    const petugasIdx = findIdx(['kd_petugas', 'petugas_id']);
    const namaPetugasIdx = findIdx(['nama petugas']);
    const kdWmIdx = findIdx(['kd_wm', 'nometer', 'no_meter']);
    const wilIdx = findIdx(['wil', 'wilayah']);
    const ruteIdx = findIdx(['rute', 'rute_kode', 'kd_rute']);
    const zonaWilIdx = findIdx(['zona wil', 'zona']);
    const kdZonasiIdx = findIdx(['kd zonasi', 'kode zonasi']);
    const namaZonasiIdx = findIdx(['nama zonasi']);
    const kecIdx = findIdx(['kecamatan']);
    const kelIdx = findIdx(['kelurahan']);
    const tglCatatIdx = findIdx(['tgl_catat', 'tanggal catat']);
    const tglUploadIdx = findIdx(['tgl_upload']);

    const items: LapDataMeterItem[] = [];

    for (let i = 1; i < rows.length; i++) {
      const parts = rows[i];
      if (parts.length < 3) continue;

      const rawNolg = (nolgIdx >= 0 ? parts[nolgIdx] : '')?.replace(/[^\w-]/g, '').trim();
      const rawThbl = (thblIdx >= 0 ? parts[thblIdx] : '')?.replace(/[^\w]/g, '').trim();

      if (!rawNolg || !rawThbl) continue;

      const stml = stmlIdx >= 0 && parts[stmlIdx] ? parseFloat(parts[stmlIdx].replace(',', '.')) || 0 : 0;
      const stma = stmaIdx >= 0 && parts[stmaIdx] ? parseFloat(parts[stmaIdx].replace(',', '.')) || 0 : 0;
      const stmaCatat = stmaCatatIdx >= 0 && parts[stmaCatatIdx] ? parseFloat(parts[stmaCatatIdx].replace(',', '.')) : undefined;
      const pakaiM3 =
        pakaiIdx >= 0 && parts[pakaiIdx] !== '' && parts[pakaiIdx] !== undefined
          ? parseFloat(parts[pakaiIdx].replace(',', '.')) || 0
          : Math.max(0, stma - stml);
      const pakaiLalu =
        pakaiLaluIdx >= 0 && parts[pakaiLaluIdx] !== '' && parts[pakaiLaluIdx] !== undefined
          ? parseFloat(parts[pakaiLaluIdx].replace(',', '.')) || 0
          : undefined;
      const persentase =
        persenIdx >= 0 && parts[persenIdx] !== '' && parts[persenIdx] !== undefined
          ? parseFloat(parts[persenIdx].replace(',', '.'))
          : undefined;

      const nama = namaIdx >= 0 ? parts[namaIdx]?.trim() : undefined;
      const alamat = alamatIdx >= 0 ? parts[alamatIdx]?.trim() : undefined;
      const trf = trfIdx >= 0 ? parts[trfIdx]?.trim() : undefined;
      const tmssRaw = tmssIdx >= 0 ? parts[tmssIdx]?.trim() : '-';
      const tmss = tmssRaw === '' ? '-' : tmssRaw;
      const ketCatat = ketCatatIdx >= 0 && parts[ketCatatIdx]?.trim() ? parts[ketCatatIdx].trim() : 'Normal';
      const petugasId =
        (petugasIdx >= 0 && parts[petugasIdx]?.trim()) ||
        (namaPetugasIdx >= 0 && parts[namaPetugasIdx]?.trim()) ||
        undefined;
      const namaPetugas = (namaPetugasIdx >= 0 && parts[namaPetugasIdx]?.trim()) || petugasId;
      const kdWm = kdWmIdx >= 0 ? parts[kdWmIdx]?.trim() : undefined;
      const wil = wilIdx >= 0 ? parts[wilIdx]?.trim() : undefined;
      const ruteKode = ruteIdx >= 0 ? parts[ruteIdx]?.trim() : undefined;
      const zonaWil = zonaWilIdx >= 0 ? parts[zonaWilIdx]?.trim() : undefined;
      const kdZonasi = kdZonasiIdx >= 0 ? parts[kdZonasiIdx]?.trim() : undefined;
      const namaZonasi = namaZonasiIdx >= 0 ? parts[namaZonasiIdx]?.trim() : undefined;
      const kecamatan = kecIdx >= 0 ? parts[kecIdx]?.trim() : undefined;
      const kelurahan = kelIdx >= 0 ? parts[kelIdx]?.trim() : undefined;
      const tglCatat =
        tglCatatIdx >= 0 && parts[tglCatatIdx]?.trim()
          ? parts[tglCatatIdx].trim()
          : new Date().toISOString();
      const tglUpload = tglUploadIdx >= 0 && parts[tglUploadIdx]?.trim() ? parts[tglUploadIdx].trim() : undefined;

      items.push({
        thbl: rawThbl,
        nolg: rawNolg,
        nama,
        alamat,
        stml,
        stma,
        stmaCatat,
        pakaiM3,
        pakaiLalu,
        persentase,
        trf,
        tmss,
        ketCatat,
        petugasId,
        namaPetugas,
        kdWm,
        wil,
        ruteKode,
        zonaWil,
        kdZonasi,
        namaZonasi,
        kecamatan,
        kelurahan,
        tglCatat,
        tglUpload,
        catatan: namaZonasi ? `Zonasi: ${namaZonasi} (Rute ${ruteKode || '-'})` : 'Import Laporan Data Meter',
      });
    }

    return items;
  }

  /**
   * Import Laporan Data Meter PDAM (lapdatameter) ke tabel cater_baca_meter
   * Mendukung pemrosesan batching performa tinggi dengan integritas relasi:
   * 1. Upsert rute_cater & petugas_cater jika belum ada
   * 2. Upsert master pelanggan & golongan tarif jika belum ada
   * 3. Upsert data pembacaan meter ke tabel cater_baca_meter (kolom stml, stma, pakai_m3, pakai_lalu, tmss, ket_catat, dll.)
   *
   * Perbaikan terkait:
   * - Kelompokkan item per periode (thbl) untuk pengecekan lock periode dan transaksi terpisah.
   * - Pengecekan status TERKUNCI dilakukan di dalam transaksi untuk mencegah race condition.
   * - Jika periode status = 'TERKUNCI', seluruh baris periode tersebut ditolak.
   * - Setiap periode diproses dalam satu transaksi DB untuk atomicity.
   * - Validasi stma >= stml dan pakaiM3 >= 0 sebelum upsert.
   * - Deteksi duplikat NOLG dalam satu periode.
   * - Error handling per baris agar satu baris gagal tidak membatalkan batch lain dalam periode yang sama.
   */
  async importLapDataMeter(items: LapDataMeterItem[]) {
    if (!items || items.length === 0) {
      throw new Error('Tidak ada baris data LapDataMeter untuk diproses.');
    }

    const results = {
      total: items.length,
      sukses: 0,
      gagal: 0,
      created: 0,
      updated: 0,
      detail: [] as { nolg: string; thbl: string; status: 'SUCCESS' | 'FAILED'; error?: string }[],
    };

    // Kelompokkan per periode (thbl) untuk pengecekan lock dan transaksi terpisah
    const groups = new Map<string, LapDataMeterItem[]>();
    for (const item of items) {
      const group = groups.get(item.thbl) ?? [];
      group.push(item);
      groups.set(item.thbl, group);
    }

    for (const [thbl, batch] of groups) {
      // Hapus duplikat nolg dalam satu periode (ambil yang pertama, tandai sisanya sebagai gagal)
      const seenNolg = new Set<string>();
      const uniqueBatch: LapDataMeterItem[] = [];
      for (const item of batch) {
        if (seenNolg.has(item.nolg)) {
          results.gagal++;
          results.detail.push({
            nolg: item.nolg,
            thbl: item.thbl,
            status: 'FAILED',
            error: 'Duplikat NOLG dalam satu berkas impor untuk periode yang sama',
          });
          continue;
        }
        seenNolg.add(item.nolg);
        uniqueBatch.push(item);
      }

      try {
        await db.transaction(async (tx) => {
          // Pengecekan status periode di dalam transaksi untuk mencegah race condition
          const [periodeRow] = await tx.execute(sql`
            SELECT status FROM periode_penagihan WHERE periode = ${thbl} LIMIT 1
          `);
          const isLocked = periodeRow ? String((periodeRow as any).status) === 'TERKUNCI' : false;

          if (isLocked) {
            for (const item of uniqueBatch) {
              results.gagal++;
              results.detail.push({
                nolg: item.nolg,
                thbl: item.thbl,
                status: 'FAILED',
                error: `Periode ${thbl} sudah dikunci (TERKUNCI). Impor dibatalkan untuk menjaga integritas data.`,
              });
            }
            return;
          }

          // 1. Pastikan rute_cater terdaftar untuk mencegah FK violation
          const uniqueRoutes = Array.from(new Set(uniqueBatch.map((b) => b.ruteKode).filter(Boolean))) as string[];
          if (uniqueRoutes.length > 0) {
            const routeRecords = uniqueRoutes.map((kode) => {
              const itemMatch = uniqueBatch.find((b) => b.ruteKode === kode);
              return {
                kode,
                seksiKode: itemMatch?.zonaWil || null,
                seksiNama: itemMatch?.namaZonasi || null,
              };
            });
            await tx.insert(ruteCater).values(routeRecords).onConflictDoNothing();
          }

          // 2. Pastikan petugas_cater terdaftar untuk mencegah FK violation
          const uniquePetugas = Array.from(new Set(uniqueBatch.map((b) => b.petugasId).filter(Boolean))) as string[];
          if (uniquePetugas.length > 0) {
            const petugasRecords = uniquePetugas.map((id) => {
              const itemMatch = uniqueBatch.find((b) => b.petugasId === id);
              return {
                id,
                nama: itemMatch?.namaPetugas || id,
                aktif: true,
              };
            });
            await tx.insert(petugasCater).values(petugasRecords).onConflictDoNothing();
          }

          // 3. Pastikan golongan_tarif terdaftar jika ada
          const uniqueTarif = Array.from(new Set(uniqueBatch.map((b) => b.trf).filter(Boolean))) as string[];
          if (uniqueTarif.length > 0) {
            const tarifRecords = uniqueTarif.map((kode) => ({
              kode,
              nama: `Tarif Golongan ${kode}`,
            }));
            await tx.insert(golonganTarif).values(tarifRecords).onConflictDoNothing();
          }

          // 4. Pastikan pelanggan terdaftar di master database
          const batchNolgs = uniqueBatch.map((b) => b.nolg);
          const existingCusts = await tx
            .select({ nolg: pelanggan.nolg, ruteKode: pelanggan.ruteKode })
            .from(pelanggan)
            .where(inArray(pelanggan.nolg, batchNolgs));

          const existingCustMap = new Map(existingCusts.map((c) => [c.nolg, c]));
          const missingCusts: (typeof pelanggan.$inferInsert)[] = [];

          for (const item of uniqueBatch) {
            if (!existingCustMap.has(item.nolg)) {
              missingCusts.push({
                nolg: item.nolg,
                nama: item.nama || `Pelanggan ${item.nolg}`,
                alamat: item.alamat || 'Alamat Terdata LapDataMeter',
                ruteKode: item.ruteKode || null,
                tarifKode: item.trf || null,
                status: 'PELANGGAN AKTIF',
              });
              existingCustMap.set(item.nolg, { nolg: item.nolg, ruteKode: item.ruteKode || null });
            }
          }

          if (missingCusts.length > 0) {
            await tx.insert(pelanggan).values(missingCusts).onConflictDoNothing();
          }

          // 5. Cek existing cater_baca_meter berdasarkan (thbl, nolg)
          const existingCaterRows = await tx
            .select({
              id: caterBacaMeter.id,
              nolg: caterBacaMeter.nolg,
              thbl: caterBacaMeter.thbl,
            })
            .from(caterBacaMeter)
            .where(
              and(
                eq(caterBacaMeter.thbl, thbl),
                inArray(caterBacaMeter.nolg, batchNolgs)
              )
            );

          const existingCaterMap = new Map(existingCaterRows.map((r) => [r.nolg, r.id]));

          for (const item of uniqueBatch) {
            // Validasi data dasar
            if (item.stma < item.stml) {
              results.gagal++;
              results.detail.push({
                nolg: item.nolg,
                thbl: item.thbl,
                status: 'FAILED',
                error: `STMA (${item.stma}) lebih kecil dari STML (${item.stml})`,
              });
              continue;
            }

            const pakaiM3 = item.pakaiM3 ?? Math.max(0, item.stma - item.stml);
            if (pakaiM3 < 0) {
              results.gagal++;
              results.detail.push({
                nolg: item.nolg,
                thbl: item.thbl,
                status: 'FAILED',
                error: 'Kubikasi pemakaian tidak boleh negatif',
              });
              continue;
            }

            const existingId = existingCaterMap.get(item.nolg);
            const tglCatat = item.tglCatat ? new Date(item.tglCatat) : new Date();
            const tmss = item.tmss || '-';

            if (existingId) {
              // Update pembacaan meter tanpa menghilangkan data foto jika ada
              await tx
                .update(caterBacaMeter)
                .set({
                  stml: String(item.stml),
                  stma: String(item.stma),
                  pakaiM3: String(pakaiM3),
                  pakaiLalu: item.pakaiLalu !== undefined ? String(item.pakaiLalu) : null,
                  tmss,
                  ketCatat: item.ketCatat || 'Normal',
                  ruteKode: item.ruteKode || null,
                  petugasId: item.petugasId || null,
                  sumberCatat: 'LAPDATAMETER',
                  statusVerifikasi: 'SUBMITTED',
                  tglCatat,
                  catatan: item.catatan || `Import LapDataMeter ${item.thbl}`,
                  updatedAt: new Date(),
                })
                .where(eq(caterBacaMeter.id, existingId));

              results.updated++;
            } else {
              // Insert transaksi baru ke cater_baca_meter
              await tx.insert(caterBacaMeter).values({
                thbl: item.thbl,
                nolg: item.nolg,
                ruteKode: item.ruteKode || null,
                petugasId: item.petugasId || null,
                stml: String(item.stml),
                stma: String(item.stma),
                pakaiM3: String(pakaiM3),
                pakaiLalu: item.pakaiLalu !== undefined ? String(item.pakaiLalu) : null,
                tmss,
                ketCatat: item.ketCatat || 'Normal',
                metodeCatat: 'ONSITE',
                sumberCatat: 'LAPDATAMETER',
                statusVerifikasi: 'SUBMITTED',
                tglCatat,
                catatan: item.catatan || `Import LapDataMeter ${item.thbl}`,
                createdAt: new Date(),
                updatedAt: new Date(),
              });

              results.created++;
            }

            results.sukses++;
            results.detail.push({ nolg: item.nolg, thbl: item.thbl, status: 'SUCCESS' });
          }
        });
      } catch (err: any) {
        // Jika transaksi gagal sepenuhnya, tandai semua baris unik dalam batch ini sebagai gagal
        for (const item of uniqueBatch) {
          const alreadyRecorded = results.detail.some(
            (d) => d.nolg === item.nolg && d.thbl === item.thbl
          );
          if (!alreadyRecorded) {
            results.gagal++;
            results.detail.push({
              nolg: item.nolg,
              thbl: item.thbl,
              status: 'FAILED',
              error: err.message || 'Terjadi kesalahan saat memproses transaksi impor',
            });
          }
        }
      }
    }

    return results;
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
  async importPbpk(rows: PbpkCsvRow[], targetPeriode = '202611') {
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
