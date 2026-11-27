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
import { eq, sql, and, inArray, desc } from 'drizzle-orm';
import {
  db,
  pelanggan,
  caterBacaMeter,
  caterVerifikasiLog,
  waterMeter,
  waterMeterMutasi,
  daftarCatat,
  petugasCater,
  ruteCater,
  golonganTarif,
  kecamatan,
  kelurahan,
  wilayahAdministrasi,
  masterKondisiCatat,
} from '@cater/db';
import {
  isCloudinaryConfigured,
  uploadToCloudinary,
  type ModulFoto,
  type JenisFoto,
} from "../../../lib/cloudinary";
import { evaluasiAnomaliBaris, type ReadingInput } from "../../../domain/cater/anomali-evaluator";
import { aturanAnomaliService } from "../cater/aturan-anomali.service";

export interface ParsedPhotoInfo {
  thbl: string;
  jenis: 'stand' | 'segel' | 'rumah';
  nolg: string;
  ext: string;
  rawFileName: string;
}

export type ImportLapDataMeterMode = 'SKIP_EXISTING' | 'FORCE_RESET_OVERWRITE';

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

export function detectDelimiter(text: string): string {
  const firstLine =
    text.split(/\r?\n/).find((line) => line.trim().length > 0) || '';
  const countSemi = (firstLine.match(/;/g) || []).length;
  const countComma = (firstLine.match(/,/g) || []).length;
  const countTab = (firstLine.match(/\t/g) || []).length;

  if (countSemi > countComma && countSemi > countTab) return ';';
  if (countTab > countComma && countTab > countSemi) return '\t';
  if (countComma > 0) return ',';
  return ';';
}

export function parseCsvRows(text: string, explicitDelimiter?: string): string[][] {
  const delimiter = explicitDelimiter || detectDelimiter(text);
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
    } else if (!insideQuotes && char === delimiter) {
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
      } catch (err: unknown) {
        results.gagal++;
        results.detail.push({
          fileName: file.fileName,
          nolg: parsed.nolg,
          thbl: parsed.thbl,
          jenis: parsed.jenis,
          status: 'FAILED',
          error: err instanceof Error ? err.message : String(err),
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
          } catch (err: unknown) {
            results.gagal++;
            // Tandai semua berkas dalam grup ini sebagai FAILED karena DB gagal
            for (const srcFile of entry.sourceFiles) {
              const existingDetail = results.detail.find((d) => d.fileName === srcFile);
              if (existingDetail && existingDetail.status === 'SUCCESS') {
                existingDetail.status = 'FAILED';
                existingDetail.error = err instanceof Error ? err.message : String(err);
                results.sukses--;
              }
            }
            console.error(`[IMPORT_FOTO_SYNC_ERROR] ${entry.nolg}:`, err);
          }
        }
      });
    } catch (txErr: unknown) {
      // Transaksi gagal total
      for (const detail of results.detail) {
        if (detail.status === 'SUCCESS') {
          detail.status = 'FAILED';
          detail.error = txErr instanceof Error ? txErr.message : String(txErr);
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
      const rawPetugasId = (petugasIdx >= 0 && parts[petugasIdx]?.trim()) || '';
      const rawNamaPetugas = (namaPetugasIdx >= 0 && parts[namaPetugasIdx]?.trim()) || '';
      const cleanPetugasId =
        rawPetugasId && rawPetugasId !== '-' && rawPetugasId !== '0' ? rawPetugasId : undefined;
      const cleanNamaPetugas =
        rawNamaPetugas && rawNamaPetugas !== '-' && rawNamaPetugas !== '0' ? rawNamaPetugas : undefined;

      const petugasId = cleanPetugasId || cleanNamaPetugas || undefined;
      const namaPetugas = cleanNamaPetugas || cleanPetugasId;
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
   * Pre-flight Check: Cek status periode & jumlah data yang sudah ada di database sebelum impor LapDataMeter
   */
  async getLapDataMeterPreflight(thbl: string) {
    const [periodeRow] = await db.execute(sql`
      SELECT status FROM periode_penagihan WHERE periode = ${thbl} LIMIT 1
    `);
    const isLockedPeriode = periodeRow ? String((periodeRow as any).status) === 'TERKUNCI' : false;

    const rows = await db
      .select({
        status: caterBacaMeter.statusVerifikasi,
        count: sql<number>`count(*)::int`,
      })
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.thbl, thbl))
      .groupBy(caterBacaMeter.statusVerifikasi);

    let totalExisting = 0;
    let verifiedV3 = 0;
    let verifiedV2 = 0;
    let verifiedV1 = 0;
    let submitted = 0;
    let lockedBilling = 0;

    for (const r of rows) {
      totalExisting += r.count;
      if (['APPROVED_FINAL', 'CORRECTED_POST_VERIF', 'LOCKED_BILLING'].includes(r.status)) {
        verifiedV3 += r.count;
      }
      if (r.status === 'LOCKED_BILLING') {
        lockedBilling += r.count;
      }
      if (r.status === 'VERIFIED_L2') {
        verifiedV2 += r.count;
      }
      if (r.status === 'VERIFIED_L1') {
        verifiedV1 += r.count;
      }
      if (r.status === 'SUBMITTED' || r.status === 'PENDING') {
        submitted += r.count;
      }
    }

    const isLocked = isLockedPeriode || lockedBilling > 0;

    return {
      thbl,
      isLocked,
      isLockedPeriode,
      hasLockedBilling: lockedBilling > 0,
      totalExisting,
      verifiedV3,
      verifiedV2,
      verifiedV1,
      submitted,
    };
  }

  /**
   * Import Laporan Data Meter PDAM (lapdatameter) ke tabel cater_baca_meter
   * Mendukung pemrosesan batching performa tinggi dengan integritas relasi:
   * 1. Upsert rute_cater & petugas_cater jika belum ada
   * 2. Upsert master pelanggan & golongan tarif jika belum ada
   * 3. Upsert data pembacaan meter ke tabel cater_baca_meter (kolom stml, stma, pakai_m3, pakai_lalu, tmss, ket_catat, dll.)
   *
   * Perbaikan terkait:
   * - Mendukung 2 mode impor: 'SKIP_EXISTING' (Default) dan 'FORCE_RESET_OVERWRITE' (Pemulihan Darurat).
   * - Pengecekan status TERKUNCI dilakukan di dalam transaksi untuk mencegah race condition.
   * - Jika periode status = 'TERKUNCI', seluruh baris periode tersebut ditolak.
   * - Setiap periode diproses dalam satu transaksi DB untuk atomicity.
   * - Validasi stma >= stml dan pakaiM3 >= 0 sebelum upsert.
   * - Deteksi duplikat NOLG dalam satu periode.
   * - Error handling per baris agar satu baris gagal tidak membatalkan batch lain dalam periode yang sama.
   */
  async importLapDataMeter(
    items: LapDataMeterItem[],
    mode: ImportLapDataMeterMode = 'SKIP_EXISTING',
    userContext?: { userId: string; userName?: string }
  ) {
    if (!items || items.length === 0) {
      throw new Error('Tidak ada baris data LapDataMeter untuk diproses.');
    }

    const results = {
      total: items.length,
      sukses: 0,
      gagal: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      detail: [] as { nolg: string; thbl: string; status: 'SUCCESS' | 'FAILED' | 'SKIPPED'; error?: string }[],
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

          // 2. Pastikan petugas_cater terdaftar untuk mencegah FK violation (abaikan ID '-' atau kosong)
          const uniquePetugas = Array.from(
            new Set(
              uniqueBatch
                .map((b) => b.petugasId)
                .filter((id): id is string => Boolean(id && id !== '-' && id !== '0' && id.trim() !== ''))
            )
          );
          if (uniquePetugas.length > 0) {
            const petugasRecords = uniquePetugas.map((id) => {
              const itemMatch = uniqueBatch.find((b) => b.petugasId === id);
              return {
                id,
                nama: itemMatch?.namaPetugas && itemMatch.namaPetugas !== '-' ? itemMatch.namaPetugas : id,
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

          // 4. Pastikan aset water_meter & pelanggan terdaftar lengkap (termasuk nomor meter kd_wm, alamat, & tarif)
          const validKdWmSet = new Set<string>();
          for (const item of uniqueBatch) {
            const wm = item.kdWm?.trim();
            if (wm && wm !== '-' && wm !== '0' && wm !== '00000000') {
              validKdWmSet.add(wm);
            }
          }
          if (validKdWmSet.size > 0) {
            const wmList = Array.from(validKdWmSet).map((noMeter) => ({
              noMeter,
              merk: 'ITR',
              ukuran: '1/2',
              kondisi: 'Normal',
            }));
            for (let i = 0; i < wmList.length; i += 500) {
              await tx
                .insert(waterMeter)
                .values(wmList.slice(i, i + 500))
                .onConflictDoNothing({ target: waterMeter.noMeter });
            }
          }

          const batchNolgs = uniqueBatch.map((b) => b.nolg);
          const existingCusts = await tx
            .select({
              nolg: pelanggan.nolg,
              ruteKode: pelanggan.ruteKode,
              alamat: pelanggan.alamat,
              noMeter: pelanggan.noMeter,
              tarifKode: pelanggan.tarifKode,
            })
            .from(pelanggan)
            .where(inArray(pelanggan.nolg, batchNolgs));

          const existingCustMap = new Map(existingCusts.map((c) => [c.nolg, c]));
          const missingCusts: (typeof pelanggan.$inferInsert)[] = [];
          const newPbpkDpmRows: (typeof daftarCatat.$inferInsert)[] = [];

          for (const item of uniqueBatch) {
            const wmClean = item.kdWm?.trim();
            const validNoMeter =
              wmClean && wmClean !== '-' && wmClean !== '0' && wmClean !== '00000000'
                ? wmClean
                : null;
            const existingCust = existingCustMap.get(item.nolg);

            if (!existingCust) {
              const ruteUpper = item.ruteKode ? item.ruteKode.trim().toUpperCase() : null;
              const kelKode = ruteUpper && ruteUpper.length >= 3 ? ruteUpper.slice(0, 3) : null;
              const tglCatatItem = item.tglCatat ? new Date(item.tglCatat) : new Date();

              missingCusts.push({
                nolg: item.nolg,
                nama: item.nama || `Pelanggan ${item.nolg}`,
                alamat: item.alamat || 'Alamat Terdata LapDataMeter',
                ruteKode: ruteUpper,
                kelurahanKode: kelKode,
                tarifKode: item.trf || null,
                noMeter: validNoMeter,
                noMeterAsli: wmClean || null,
                ukuranMeter: '1/2',
                status: 'PELANGGAN AKTIF',
              });

              newPbpkDpmRows.push({
                id: `dpm-${thbl}-${item.nolg}`,
                periode: thbl,
                nolg: item.nolg,
                ruteKode: ruteUpper,
                petugasId: item.petugasId && item.petugasId !== '-' ? item.petugasId : null,
                urutan: 999,
                standAwal: String(item.stml ?? 0),
                pakaiLalu: String(item.pakaiLalu ?? 0),
                sumber: 'PBPK',
                status: 'DICATAT',
                selesaiAt: tglCatatItem,
                catatan: `Terdeteksi otomatis dari Import LapDataMeter ${thbl}`,
                createdAt: new Date(),
                updatedAt: new Date(),
              });

              existingCustMap.set(item.nolg, {
                nolg: item.nolg,
                ruteKode: ruteUpper,
                alamat: item.alamat || 'Alamat Terdata LapDataMeter',
                noMeter: validNoMeter,
                tarifKode: item.trf || null,
              });
            } else {
              // Lengkapi otomatis jika pelanggan sebelumnya terinput tanpa noMeter / alamat placeholder
              const needAlamatFix =
                Boolean(item.alamat?.trim()) &&
                (!existingCust.alamat ||
                  existingCust.alamat === 'Alamat Terdata LapDataMeter' ||
                  existingCust.alamat === '-');
              const needMeterFix = Boolean(validNoMeter) && !existingCust.noMeter;
              const needTarifFix =
                Boolean(item.trf?.trim()) &&
                (!existingCust.tarifKode ||
                  existingCust.alamat === 'Alamat Terdata LapDataMeter');

              if (needAlamatFix || needMeterFix || needTarifFix) {
                await tx
                  .update(pelanggan)
                  .set({
                    ...(needAlamatFix ? { alamat: item.alamat!.trim() } : {}),
                    ...(needMeterFix
                      ? { noMeter: validNoMeter, noMeterAsli: validNoMeter }
                      : {}),
                    ...(needTarifFix ? { tarifKode: item.trf!.trim() } : {}),
                    updatedAt: new Date(),
                  })
                  .where(eq(pelanggan.nolg, item.nolg));
              }
            }
          }

          if (missingCusts.length > 0) {
            await tx.insert(pelanggan).values(missingCusts).onConflictDoNothing();
          }
          if (newPbpkDpmRows.length > 0) {
            await tx
              .insert(daftarCatat)
              .values(newPbpkDpmRows)
              .onConflictDoNothing({
                target: [daftarCatat.periode, daftarCatat.nolg],
              });
          }

          // 5. Pastikan semua kode TMSS terdaftar di masterKondisiCatat dalam 1 query bulk
          const uniqueTmss = Array.from(
            new Set(
              uniqueBatch
                .map((b) => b.tmss?.trim())
                .filter((t): t is string => Boolean(t && t !== '-'))
            )
          );
          if (uniqueTmss.length > 0) {
            const tmssRecords = uniqueTmss.map((kode) => {
              const itemMatch = uniqueBatch.find((b) => b.tmss?.trim() === kode);
              return {
                kodeTmss: kode,
                nama: itemMatch?.ketCatat || `Kondisi ${kode}`,
                kategori: 'TERBACA' as const,
                modeHitung: 'SELISIH_FISIK' as const,
              };
            });
            await tx
              .insert(masterKondisiCatat)
              .values(tmssRecords)
              .onConflictDoNothing({ target: masterKondisiCatat.kodeTmss });
          }

          // 6. Cek existing cater_baca_meter berdasarkan (thbl, nolg) untuk statistik created vs skipped/updated
          const existingCaterRows = await tx
            .select({
              id: caterBacaMeter.id,
              nolg: caterBacaMeter.nolg,
              status: caterBacaMeter.statusVerifikasi,
            })
            .from(caterBacaMeter)
            .where(
              and(
                eq(caterBacaMeter.thbl, thbl),
                inArray(caterBacaMeter.nolg, batchNolgs)
              )
            );

          const existingNolgSet = new Set(existingCaterRows.map((r) => r.nolg));
          const existingCount = existingCaterRows.length;

          // Jika mode FORCE_RESET_OVERWRITE, cegah bila ada data yang sudah menjadi tagihan terkunci
          if (mode === 'FORCE_RESET_OVERWRITE') {
            const hasLockedRow = existingCaterRows.some((r) => r.status === 'LOCKED_BILLING');
            if (hasLockedRow) {
              throw new Error(
                `Periode ${thbl} telah memiliki transaksi tagihan resmi yang terkunci (LOCKED_BILLING). Penimpaan total dilarang.`
              );
            }
          }

          // 7a. Ambil aturan anomali terpusat untuk klasifikasi otomatis
          const { rules, maps, versi } = await aturanAnomaliService.getCachedEngineContext();

          // 7b. Tentukan batch items yang akan diproses sesuai mode
          const isForceOverwrite = mode === 'FORCE_RESET_OVERWRITE';
          const itemsToProcess = isForceOverwrite
            ? uniqueBatch
            : uniqueBatch.filter((item) => !existingNolgSet.has(item.nolg));

          const draftMutasiRows: (typeof waterMeterMutasi.$inferInsert)[] = [];

          const bulkRecords = itemsToProcess.map((item) => {
            const tmss = item.tmss?.trim() || '-';
            const ketUpper = (item.ketCatat ?? '').trim().toUpperCase();
            const isMb = tmss === '4' || ketUpper === 'MB';
            const isMudaKembali =
              tmss.toUpperCase() === 'U' ||
              ketUpper === 'MUDA KEMBALI' ||
              ketUpper === 'MUDA_KEMBALI';
            const isNormalLike =
              !isMb &&
              !isMudaKembali &&
              (tmss === '-' || tmss === '' || ketUpper === 'NORMAL');

            let pakaiM3 = item.pakaiM3;
            if (pakaiM3 === undefined || isNaN(pakaiM3)) {
              if (item.stma >= item.stml) {
                pakaiM3 = item.stma - item.stml;
              } else if (isNormalLike) {
                // Pertahankan angka minus riil pada kondisi Normal agar memicu alert merah & ditahan Guard
                pakaiM3 = item.stma - item.stml;
              } else {
                pakaiM3 =
                  item.pakaiLalu !== undefined && item.pakaiLalu >= 0
                    ? item.pakaiLalu
                    : 0;
              }
            } else if (pakaiM3 < 0 && !isNormalLike) {
              pakaiM3 = 0;
            }

            const tglCatat = item.tglCatat ? new Date(item.tglCatat) : new Date();
            const isStandMundur = item.stma < item.stml && !isMb && !isMudaKembali;
            const defaultCatatan = isStandMundur
              ? `Import LapDataMeter (Anomali Stand: STMA ${item.stma} < STML ${item.stml}, Pakai=${pakaiM3}m³)`
              : isMb
                ? `Import LapDataMeter ${item.thbl} (Meter Baru / Wajib Konfirmasi Stand Angkat atau Override)`
                : `Import LapDataMeter ${item.thbl}`;
            const catatan = item.catatan || defaultCatatan;

            const evalRes = evaluasiAnomaliBaris(
              {
                stml: Number(item.stml),
                stma: Number(item.stma),
                pakaiM3: Number(pakaiM3),
                pakaiLalu:
                  item.pakaiLalu !== undefined && item.pakaiLalu !== null
                    ? Number(item.pakaiLalu)
                    : null,
                kodeTmss: tmss,
              },
              rules,
              maps,
              versi
            );

            let mutasiIdForRow: string | null = null;
            if (isMb) {
              mutasiIdForRow = `mutasi-${item.thbl}-${item.nolg}`;
              const custExisting = existingCustMap.get(item.nolg);
              draftMutasiRows.push({
                id: mutasiIdForRow,
                nolg: item.nolg,
                periode: Number(item.thbl),
                alasan: 'LAINNYA',
                keterangan:
                  'Terdeteksi otomatis dari Import LapDataMeter kondisi MB; menunggu konfirmasi Stand Angkat / Override operator.',
                noMeterLama: custExisting?.noMeter ?? '-',
                standAngkat: null,
                noMeterBaru: null,
                standPasang: 0,
                statusVerifikasi: 'DATA_METER_BELUM_LENGKAP',
              });
              evalRes.isAnomali = true;
              if (!evalRes.kodeList.includes('MB_BUTUH_STAND_ANGKAT')) {
                evalRes.kodeList.unshift('MB_BUTUH_STAND_ANGKAT');
              }
              evalRes.kodeUtama = 'MB_BUTUH_STAND_ANGKAT';
            }

            const statusVerifImport =
              isMb || (isStandMundur && isNormalLike) || pakaiM3 < 0
                ? 'ANOMALY_NEGATIVE'
                : 'SUBMITTED';

            return {
              thbl: item.thbl,
              nolg: item.nolg,
              ruteKode: item.ruteKode || null,
              petugasId: item.petugasId && item.petugasId !== '-' ? item.petugasId : null,
              stml: String(item.stml),
              stma: String(item.stma),
              pakaiM3: String(pakaiM3),
              pakaiLalu: item.pakaiLalu !== undefined ? String(item.pakaiLalu) : null,
              tmss,
              ketCatat: item.ketCatat || 'Normal',
              waterMeterMutasiId: mutasiIdForRow,
              mbTanpaStandAngkat: false,
              metodeCatat: 'ONSITE',
              sumberCatat: 'LAPDATAMETER',
              statusVerifikasi: statusVerifImport,
              isAnomali: evalRes.isAnomali,
              kodeAnomaliUtama: evalRes.kodeUtama,
              kodeAnomaliList: evalRes.kodeList,
              aturanVersi: versi,
              tglCatat,
              catatan,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          });

          if (draftMutasiRows.length > 0) {
            for (let i = 0; i < draftMutasiRows.length; i += 500) {
              await tx
                .insert(waterMeterMutasi)
                .values(draftMutasiRows.slice(i, i + 500))
                .onConflictDoNothing({ target: waterMeterMutasi.id });
            }
          }

          // 8. Eksekusi penyimpanan data dalam chunks 1.000 baris
          const CHUNK_SIZE = 1000;
          if (isForceOverwrite) {
            for (let i = 0; i < bulkRecords.length; i += CHUNK_SIZE) {
              const chunk = bulkRecords.slice(i, i + CHUNK_SIZE);
              await tx
                .insert(caterBacaMeter)
                .values(chunk)
                .onConflictDoUpdate({
                  target: [caterBacaMeter.thbl, caterBacaMeter.nolg],
                  set: {
                    ruteKode: sql`excluded.rute_kode`,
                    petugasId: sql`excluded.petugas_id`,
                    stml: sql`excluded.stml`,
                    stma: sql`excluded.stma`,
                    pakaiM3: sql`excluded.pakai_m3`,
                    pakaiLalu: sql`excluded.pakai_lalu`,
                    tmss: sql`excluded.tmss`,
                    ketCatat: sql`excluded.ket_catat`,
                    waterMeterMutasiId: sql`excluded.water_meter_mutasi_id`,
                    mbTanpaStandAngkat: false,
                    digitRollover: null,
                    sumberCatat: sql`excluded.sumber_catat`,
                    statusVerifikasi: sql`excluded.status_verifikasi`,
                    stmlRevisi: null,
                    stmaRevisi: null,
                    pakaiM3Revisi: null,
                    ketCatatRevisi: null,
                    standAngkatRevisi: null,
                    standMeterBaruRevisi: null,
                    pakaiTagih: null,
                    fotoMeterUrl: null,
                    fotoSegelUrl: null,
                    fotoRumahUrl: null,
                    caterMandiriId: null,
                    isAnomali: sql`excluded.is_anomali`,
                    kodeAnomaliUtama: sql`excluded.kode_anomali_utama`,
                    kodeAnomaliList: sql`excluded.kode_anomali_list`,
                    aturanVersi: sql`excluded.aturan_versi`,
                    tglCatat: sql`excluded.tgl_catat`,
                    catatan: sql`excluded.catatan`,
                    updatedAt: sql`now()`,
                  },
                });
            }

            // Bersihkan histori verifikasi lama dan catat audit log reset untuk baris yang ditimpa
            if (existingCaterRows.length > 0) {
              const existingIds = existingCaterRows.map((r) => r.id);
              for (let i = 0; i < existingIds.length; i += CHUNK_SIZE) {
                const chunkIds = existingIds.slice(i, i + CHUNK_SIZE);
                await tx.delete(caterVerifikasiLog).where(inArray(caterVerifikasiLog.caterId, chunkIds));
              }

              const auditLogItems = existingCaterRows.map((r) => ({
                caterId: r.id,
                userId: userContext?.userId || 'user-superadmin',
                stage: 'SYSTEM_RESET',
                action: 'RESET_OVERWRITE',
                alasan: `Reset data pembacaan meter via Import LapDataMeter oleh ${userContext?.userName || 'Operator'}.`,
              }));
              for (let i = 0; i < auditLogItems.length; i += CHUNK_SIZE) {
                await tx.insert(caterVerifikasiLog).values(auditLogItems.slice(i, i + CHUNK_SIZE));
              }
            }

            results.updated += existingCount;
            results.created += uniqueBatch.length - existingCount;
            results.sukses += bulkRecords.length;

            for (const item of uniqueBatch) {
              results.detail.push({ nolg: item.nolg, thbl: item.thbl, status: 'SUCCESS' });
            }
          } else {
            // Mode Default: SKIP_EXISTING
            for (let i = 0; i < bulkRecords.length; i += CHUNK_SIZE) {
              const chunk = bulkRecords.slice(i, i + CHUNK_SIZE);
              await tx
                .insert(caterBacaMeter)
                .values(chunk)
                .onConflictDoNothing({ target: [caterBacaMeter.thbl, caterBacaMeter.nolg] });
            }

            results.skipped += existingCount;
            results.created += bulkRecords.length;
            results.sukses += bulkRecords.length;

            for (const item of uniqueBatch) {
              if (existingNolgSet.has(item.nolg)) {
                results.detail.push({
                  nolg: item.nolg,
                  thbl: item.thbl,
                  status: 'SKIPPED',
                  error: 'Data pembacaan periode ini sudah tersedia di sistem (dilewati)',
                });
              } else {
                results.detail.push({ nolg: item.nolg, thbl: item.thbl, status: 'SUCCESS' });
              }
            }
          }

          // 9. Sinkronkan status daftar_catat (DPM) menjadi DICATAT untuk seluruh NOLG yang sudah memiliki bacaan pada periode ini
          for (let i = 0; i < batchNolgs.length; i += CHUNK_SIZE) {
            const nolgChunk = batchNolgs.slice(i, i + CHUNK_SIZE);
            await tx
              .update(daftarCatat)
              .set({
                status: 'DICATAT',
                selesaiAt: new Date(),
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(daftarCatat.periode, thbl),
                  inArray(daftarCatat.nolg, nolgChunk),
                  eq(daftarCatat.status, 'BELUM_DICATAT')
                )
              );
          }
        });
      } catch (err: unknown) {
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
              error: err instanceof Error ? err.message : String(err),
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

    const { rules, maps, versi } = await aturanAnomaliService.getCachedEngineContext();

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

        const evalRes = evaluasiAnomaliBaris(
          {
            stml: Number(item.stml),
            stma: Number(item.stma),
            pakaiM3: Number(pakaiM3),
            pakaiLalu: null,
            kodeTmss: item.ketCatat || null,
          },
          rules,
          maps,
          versi
        );

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
              isAnomali: evalRes.isAnomali,
              kodeAnomaliUtama: evalRes.kodeUtama,
              kodeAnomaliList: evalRes.kodeList,
              aturanVersi: versi,
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
            isAnomali: evalRes.isAnomali,
            kodeAnomaliUtama: evalRes.kodeUtama,
            kodeAnomaliList: evalRes.kodeList,
            aturanVersi: versi,
            catatan: item.catatan || 'Data baru dari mobile backup',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        await db
          .update(daftarCatat)
          .set({
            status: 'DICATAT',
            selesaiAt: tglCatat,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(daftarCatat.periode, item.thbl),
              eq(daftarCatat.nolg, item.nolg),
              eq(daftarCatat.status, 'BELUM_DICATAT')
            )
          );

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
   * Berkas acuan: packages/db/docs/PBPK.csv
   */
  parsePbpkCsv(csvText: string): PbpkCsvRow[] {
    const table = parseCsvRows(csvText);
    if (table.length < 2) return [];

    const header = table[0].map((h) => h.trim().toLowerCase());
    const findIndex = (aliases: string[]) => {
      for (const a of aliases) {
        const idx = header.indexOf(a);
        if (idx >= 0) return idx;
      }
      for (const a of aliases) {
        const idx = header.findIndex((h) => h.includes(a));
        if (idx >= 0) return idx;
      }
      return -1;
    };

    const col = {
      nolg: findIndex(['nolg', 'nolangganan', 'no pel', 'nomor pelanggan', 'nopel']),
      nama: findIndex(['nama', 'nama pelanggan']),
      kd_kecamatan: findIndex(['kd_kecamatan', 'kecamatan_kode', 'kecamatan']),
      kd_kelurahan: findIndex(['kd_kelurahan', 'kelurahan_kode', 'kelurahan']),
      rt: findIndex(['rt']),
      rw: findIndex(['rw']),
      alamat: findIndex(['alamat', 'alamat sambungan', 'alamat pelanggan']),
      notelp: findIndex(['notelp', 'no_telp', 'no telp', 'telepon', 'hp']),
      jmlpenghuni: findIndex(['jmlpenghuni', 'jml_penghuni', 'penghuni']),
      nometer: findIndex(['nometer', 'no_meter', 'no meter', 'meter']),
      kd_merkmeter: findIndex(['kd_merkmeter', 'merk_meter', 'merkmeter', 'merk']),
      kd_ukmeter: findIndex(['kd_ukmeter', 'ukuran_meter', 'ukmeter', 'ukuran']),
      tglaktif: findIndex(['tglaktif', 'tgl_aktif', 'tanggal aktif', 'tgl_pasang']),
      sta_aktif: findIndex(['sta_aktif', 'status']),
      wilayah: findIndex(['wilayah']),
      kd_rute: findIndex(['kd_rute', 'rute_kode', 'rute']),
      updater: findIndex(['updater']),
      geo_long: findIndex(['geo_long', 'longitude', 'long']),
      goe_lat: findIndex(['goe_lat', 'geo_lat', 'latitude', 'lat']),
      kode_wilayah: findIndex(['kode_wilayah', 'wilayah_kode']),
      kd_goltarif: findIndex(['kd_goltarif', 'tarif_kode', 'goltarif', 'tarif']),
      no_urutrute: findIndex(['no_urutrute', 'no_urut_rute', 'urut_rute', 'no_urut', 'urutan']),
      mutasian: findIndex(['mutasian', 'mutasi', 'tipe_mutasi']),
    };

    const rows: PbpkCsvRow[] = [];

    for (let i = 1; i < table.length; i++) {
      const parts = table[i];
      if (parts.length < 2) continue;

      const nolgRaw = col.nolg >= 0 ? parts[col.nolg] : parts[0];
      const nolgClean = nolgRaw?.trim()?.replace(/[^\w-]/g, '') || '';
      const nolg = nolgClean.length > 0 && nolgClean.length < 11 ? nolgClean.padStart(11, '0') : nolgClean;
      if (!nolg) continue;

      const nometerRaw = col.nometer >= 0 && parts[col.nometer] ? parts[col.nometer].trim() : '';
      const notelpRaw = col.notelp >= 0 && parts[col.notelp] ? parts[col.notelp].trim() : '';
      const mutasiRaw = (col.mutasian >= 0 && parts[col.mutasian] ? parts[col.mutasian] : '').trim().toUpperCase();
      const mutasian: 'PB' | 'PK' = mutasiRaw.includes('PK') ? 'PK' : 'PB';

      rows.push({
        nolg,
        nolangganan: nolg,
        nama: (col.nama >= 0 && parts[col.nama] ? parts[col.nama].trim() : '') || 'Pelanggan Baru',
        kd_kecamatan: col.kd_kecamatan >= 0 && parts[col.kd_kecamatan] ? parts[col.kd_kecamatan].trim() : undefined,
        kd_kelurahan: col.kd_kelurahan >= 0 && parts[col.kd_kelurahan] ? parts[col.kd_kelurahan].trim() : undefined,
        rt: col.rt >= 0 && parts[col.rt] ? parts[col.rt].trim() : undefined,
        rw: col.rw >= 0 && parts[col.rw] ? parts[col.rw].trim() : undefined,
        alamat: (col.alamat >= 0 && parts[col.alamat] ? parts[col.alamat].trim() : '') || '-',
        notelp: notelpRaw && notelpRaw !== '-' ? notelpRaw : '',
        jmlpenghuni: parseInt(col.jmlpenghuni >= 0 && parts[col.jmlpenghuni] ? parts[col.jmlpenghuni] : '0', 10) || 0,
        nometer: nometerRaw ? nometerRaw : `MTR-${nolg}`,
        kd_merkmeter: (col.kd_merkmeter >= 0 && parts[col.kd_merkmeter] ? parts[col.kd_merkmeter].trim() : '') || 'ITR',
        kd_ukmeter: (col.kd_ukmeter >= 0 && parts[col.kd_ukmeter] ? parts[col.kd_ukmeter].trim() : '') || '1/2',
        tglaktif: col.tglaktif >= 0 && parts[col.tglaktif] ? parts[col.tglaktif].trim() : undefined,
        sta_aktif: col.sta_aktif >= 0 && parts[col.sta_aktif] ? parts[col.sta_aktif].trim() : '1',
        wilayah: col.wilayah >= 0 && parts[col.wilayah] ? parts[col.wilayah].trim() : undefined,
        kd_rute: (col.kd_rute >= 0 && parts[col.kd_rute] ? parts[col.kd_rute].trim() : '') || '99999',
        updater: col.updater >= 0 && parts[col.updater] ? parts[col.updater].trim() : undefined,
        kode_wilayah: col.kode_wilayah >= 0 && parts[col.kode_wilayah] ? parts[col.kode_wilayah].trim() : undefined,
        kd_goltarif: (col.kd_goltarif >= 0 && parts[col.kd_goltarif] ? parts[col.kd_goltarif].trim() : '') || '2A2',
        no_urutrute: parseInt(col.no_urutrute >= 0 && parts[col.no_urutrute] ? parts[col.no_urutrute] : '0', 10) || 0,
        mutasian,
      });
    }

    return rows;
  }

  /**
   * Normalisasi ukuran meter dari kode aplikasi mutasi eksternal ('A'..'G') ke standar biaya_tetap
   */
  private normalizeUkuranMeter(raw?: string | null): string {
    const clean = (raw || '').trim();
    const upper = clean.toUpperCase();
    const codeMap: Record<string, string> = {
      A: '1/2',
      B: '3/4',
      C: '1',
      D: '1 1/2',
      E: '2',
      F: '3',
      G: '4',
      '0.5': '1/2',
      '0,5': '1/2',
    };
    if (codeMap[upper]) return codeMap[upper];
    const valid = new Set(['1/2', '3/4', '1', '1 1/2', '2', '3', '4']);
    return valid.has(clean) ? clean : '1/2';
  }

  /**
   * Eksekusi Import PBPK ke Database (Master Pelanggan, Water Meter & DPM)
   */
  async importPbpk(rows: PbpkCsvRow[], targetPeriode = '202612') {
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
      const rawNolg = (row.nolg || '').trim().replace(/[^\w-]/g, '');
      const normalizedNolg =
        rawNolg.length > 0 && rawNolg.length < 11
          ? rawNolg.padStart(11, '0')
          : rawNolg;

      try {
        if (!normalizedNolg) {
          throw new Error('NOLG kosong atau tidak valid.');
        }

        await db.transaction(async (tx) => {
          const merkMeter = (row.kd_merkmeter?.trim() || 'ITR').toUpperCase();
          const ukuranMeter = this.normalizeUkuranMeter(row.kd_ukmeter);
          const noMeter = row.nometer?.trim() || `MTR-${normalizedNolg}`;
          const tarifKode = (row.kd_goltarif?.trim() || '2A2').toUpperCase();
          const tglPasangMeter =
            row.tglaktif && !Number.isNaN(new Date(row.tglaktif).getTime())
              ? new Date(row.tglaktif)
              : new Date();
          const rt = row.rt?.trim() || null;
          const rw = row.rw?.trim() || null;
          const rawTelp = row.notelp && row.notelp !== '-' ? row.notelp.trim() : '';
          const noTelp = rawTelp
            ? /^8\d{8,13}$/.test(rawTelp)
              ? `0${rawTelp}`
              : rawTelp
            : null;
          const jmlPenghuni =
            typeof row.jmlpenghuni === 'number'
              ? row.jmlpenghuni
              : parseInt(String(row.jmlpenghuni || 0), 10) || 0;
          const noUrutRuteInput =
            typeof row.no_urutrute === 'number'
              ? row.no_urutrute
              : parseInt(String(row.no_urutrute || 0), 10) || 0;

          // Cek apakah pelanggan sudah ada di master (penting untuk PK maupun update PB)
          const [existingCust] = await tx
            .select({
              nolg: pelanggan.nolg,
              ruteKode: pelanggan.ruteKode,
              noUrutRute: pelanggan.noUrutRute,
              noMeter: pelanggan.noMeter,
              kelurahanKode: pelanggan.kelurahanKode,
            })
            .from(pelanggan)
            .where(eq(pelanggan.nolg, normalizedNolg));

          // Resolusi rute cerdas:
          // 1) Gunakan kd_rute bila bukan placeholder '99999'
          // 2) Jika '99999' dan pelanggan lama (PK) sudah punya rute valid, pertahankan rute lama!
          // 3) Jika '99999' pada PB baru, cek apakah 5 karakter awal kode_wilayah (mis. TC21101 -> TC211) cocok di rute_cater
          const rawRute = (row.kd_rute?.trim() || '99999').toUpperCase();
          let ruteKode = rawRute;
          if (rawRute === '99999') {
            if (existingCust?.ruteKode && existingCust.ruteKode !== '99999') {
              ruteKode = existingCust.ruteKode;
            } else if (row.kode_wilayah && row.kode_wilayah.trim().length >= 5) {
              const candidateRute = row.kode_wilayah.trim().slice(0, 5).toUpperCase();
              const [matchedRute] = await tx
                .select({ kode: ruteCater.kode })
                .from(ruteCater)
                .where(eq(ruteCater.kode, candidateRute));
              if (matchedRute) {
                ruteKode = matchedRute.kode;
              }
            }
          }

          // Pastikan FK kelurahan & kecamatan aman sebelum insert/update pelanggan
          const kelCandidate = (
            row.kd_kelurahan?.trim() ||
            existingCust?.kelurahanKode ||
            (ruteKode !== '99999' && ruteKode.length >= 3 ? ruteKode.slice(0, 3) : '')
          ).toUpperCase();
          let kelurahanKode: string | null = kelCandidate || null;

          if (kelurahanKode) {
            const [existingKel] = await tx
              .select({ kode: kelurahan.kode })
              .from(kelurahan)
              .where(eq(kelurahan.kode, kelurahanKode));

            if (!existingKel) {
              const kecKode = (
                row.kd_kecamatan?.trim() || kelurahanKode.slice(0, 2)
              ).toUpperCase();
              if (kecKode) {
                const [defaultWiladm] = await tx
                  .select({ kode: wilayahAdministrasi.kode })
                  .from(wilayahAdministrasi)
                  .limit(1);
                if (defaultWiladm) {
                  await tx
                    .insert(kecamatan)
                    .values({
                      kode: kecKode,
                      nama: `KECAMATAN ${kecKode}`,
                      wiladmKode: defaultWiladm.kode,
                    })
                    .onConflictDoNothing({ target: kecamatan.kode });
                  await tx
                    .insert(kelurahan)
                    .values({
                      kode: kelurahanKode,
                      nama: `KELURAHAN ${kelurahanKode}`,
                      kecamatanKode: kecKode,
                    })
                    .onConflictDoNothing({ target: kelurahan.kode });
                } else {
                  kelurahanKode = null;
                }
              } else {
                kelurahanKode = null;
              }
            }
          }

          // 1. Water Meter asset (Aset meter air pelanggan)
          await tx
            .insert(waterMeter)
            .values({
              noMeter,
              merk: merkMeter,
              ukuran: ukuranMeter,
              tglPasang: tglPasangMeter,
              umurTahun: 0,
              umurBulan: 0,
              kondisi: 'Normal',
            })
            .onConflictDoUpdate({
              target: waterMeter.noMeter,
              set: {
                merk: merkMeter,
                ukuran: ukuranMeter,
                kondisi: 'Normal',
              },
            });

          // 2. Integritas FK: Pastikan ruteCater & golonganTarif tersedia & ambil petugas default rute
          await tx
            .insert(ruteCater)
            .values({
              kode: ruteKode,
              seksiNama:
                ruteKode === '99999'
                  ? 'Rute Belum Ditentukan (PBPK)'
                  : `Rute ${ruteKode}`,
            })
            .onConflictDoNothing({ target: ruteCater.kode });

          const [ruteInfo] = await tx
            .select({ pencatatDefault: ruteCater.pencatatDefault })
            .from(ruteCater)
            .where(eq(ruteCater.kode, ruteKode));

          await tx
            .insert(golonganTarif)
            .values({
              kode: tarifKode,
              nama: `Golongan Tarif ${tarifKode}`,
            })
            .onConflictDoNothing({ target: golonganTarif.kode });

          // Tentukan nomor urut rute yang rapi bila di CSV bernilai 0
          let finalUrutRute =
            noUrutRuteInput > 0
              ? noUrutRuteInput
              : existingCust?.noUrutRute && existingCust.noUrutRute > 0
                ? existingCust.noUrutRute
                : 0;
          if (finalUrutRute <= 0) {
            const [maxUrut] = await tx
              .select({
                maxVal: sql<number>`coalesce(max(${pelanggan.noUrutRute}), 0)::int`,
              })
              .from(pelanggan)
              .where(eq(pelanggan.ruteKode, ruteKode));
            finalUrutRute = (maxUrut?.maxVal ?? 0) + 1;
          }

          // Hitung standAwal yang akurat untuk PK vs PB:
          // - PB selalu mulai dari stand 0
          // - PK dengan meter baru mulai dari stand 0; PK dengan meter lama melanjutkan stand akhir terakhir
          let standAwalDpm = '0';
          let pakaiLaluDpm = '0';
          if (
            row.mutasian === 'PK' &&
            existingCust?.noMeter &&
            existingCust.noMeter === noMeter
          ) {
            const [lastRead] = await tx
              .select({
                stma: caterBacaMeter.stma,
                stmaRevisi: caterBacaMeter.stmaRevisi,
                pakaiTagih: caterBacaMeter.pakaiTagih,
                pakaiM3: caterBacaMeter.pakaiM3,
              })
              .from(caterBacaMeter)
              .where(eq(caterBacaMeter.nolg, normalizedNolg))
              .orderBy(desc(caterBacaMeter.thbl))
              .limit(1);
            if (lastRead) {
              standAwalDpm = String(lastRead.stmaRevisi ?? lastRead.stma ?? '0');
              pakaiLaluDpm = String(lastRead.pakaiTagih ?? lastRead.pakaiM3 ?? '0');
            }
          }

          // 3. Mutasi Pelanggan (PB: Pasang Baru, PK: Pemasangan Kembali)
          if (!existingCust) {
            await tx.insert(pelanggan).values({
              nolg: normalizedNolg,
              nama: row.nama,
              alamat: row.alamat,
              rt,
              rw,
              noTelp,
              jmlPenghuni,
              tarifKode,
              ruteKode,
              kelurahanKode,
              noUrutRute: finalUrutRute,
              noMeter,
              noMeterAsli: noMeter,
              merkMeter,
              ukuranMeter,
              tglPasangMeter,
              status: 'PELANGGAN AKTIF',
              createdAt: tglPasangMeter,
              updatedAt: new Date(),
            });
          } else {
            await tx
              .update(pelanggan)
              .set({
                nama: row.nama,
                alamat: row.alamat,
                rt: rt || undefined,
                rw: rw || undefined,
                noTelp: noTelp || undefined,
                jmlPenghuni: jmlPenghuni || undefined,
                tarifKode,
                ruteKode,
                kelurahanKode: kelurahanKode || undefined,
                noUrutRute: finalUrutRute,
                noMeter,
                noMeterAsli: noMeter,
                merkMeter,
                ukuranMeter,
                status: 'PELANGGAN AKTIF',
                updatedAt: new Date(),
              })
              .where(eq(pelanggan.nolg, normalizedNolg));
          }

          if (row.mutasian === 'PK') {
            stats.pk++;
          } else {
            stats.pb++;
          }

          // 4. Injeksi target pembacaan ke DPM (daftarCatat) — otomatis arahkan ke N+1 bila targetPeriode sudah TERKUNCI
          const [periodeCheck] = await tx.execute(sql`
            SELECT status FROM periode_penagihan WHERE periode = ${targetPeriode} LIMIT 1
          `);
          const isTargetLocked =
            periodeCheck && String((periodeCheck as any).status) === 'TERKUNCI';
          const effectivePeriode = isTargetLocked
            ? (() => {
                const yr = parseInt(targetPeriode.slice(0, 4), 10);
                const mo = parseInt(targetPeriode.slice(4, 6), 10);
                return mo >= 12
                  ? `${yr + 1}01`
                  : `${yr}${String(mo + 1).padStart(2, '0')}`;
              })()
            : targetPeriode;

          const [existingReadingInTarget] = await tx
            .select({ id: caterBacaMeter.id })
            .from(caterBacaMeter)
            .where(
              and(
                eq(caterBacaMeter.thbl, effectivePeriode),
                eq(caterBacaMeter.nolg, normalizedNolg)
              )
            );

          const catatanDpm =
            row.mutasian === 'PK'
              ? `Sambung kembali (PK) dari Import PBPK`
              : `Pasang baru (PB) dari Import PBPK`;

          await tx
            .insert(daftarCatat)
            .values({
              id: `dpm-${effectivePeriode}-${normalizedNolg}`,
              periode: effectivePeriode,
              nolg: normalizedNolg,
              ruteKode,
              petugasId: ruteInfo?.pencatatDefault ?? null,
              urutan: finalUrutRute,
              standAwal: standAwalDpm,
              pakaiLalu: pakaiLaluDpm,
              sumber: 'PBPK',
              status: existingReadingInTarget ? 'DICATAT' : 'BELUM_DICATAT',
              catatan: catatanDpm,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: [daftarCatat.periode, daftarCatat.nolg],
              set: {
                ruteKode,
                petugasId: ruteInfo?.pencatatDefault ?? sql`${daftarCatat.petugasId}`,
                urutan: finalUrutRute,
                sumber: 'PBPK',
                catatan: catatanDpm,
                updatedAt: new Date(),
              },
            });
        });

        stats.sukses++;
        stats.detail.push({
          nolg: normalizedNolg,
          mutasian: row.mutasian,
          status: 'SUCCESS',
        });
      } catch (err: any) {
        stats.gagal++;
        stats.detail.push({
          nolg: normalizedNolg || row.nolg,
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
