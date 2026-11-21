import { Elysia } from 'elysia';
import fs from 'fs';
import path from 'path';
import { db, pelanggan, type AppRole } from '@cater/db';
import { inArray } from 'drizzle-orm';
import { authPlugin } from '../../plugins/auth';
import { importDataService } from '../../services/import/import-data.service';
import {
  importFotoBackupBodySchema,
  importDataBodySchema,
  importLapDataMeterBodySchema,
  importRNomorBodySchema,
  importPbpkBodySchema,
} from './import.schema';

const IMPORT_ROLES: AppRole[] = [
  'SUPERADMIN',
  'STAFF_ADMIN_BILLING',
  'VERIFIKATOR_3',
];

const MAX_FILES_PER_BATCH = 100;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const importRouter = new Elysia({ prefix: '/import' })
  .use(authPlugin)
  
  // Rute mutasi yang membutuhkan autentikasi & hak akses IMPORT_ROLES
  .group('', (app) =>
    app
      .guard({
        requireRole: IMPORT_ROLES,
      })

      // 1. Import Paket Foto Backup (Format: {THBL}_{JENIS}_{NOLG}.jpg)
      .post(
        '/foto-backup',
        async ({ body, set }) => {
          try {
            const files = body.files ?? [];

            if (!Array.isArray(files) || files.length === 0) {
              set.status = 400;
              return { success: false, error: 'Tidak ada berkas foto yang dikirim.' };
            }

            if (files.length > MAX_FILES_PER_BATCH) {
              set.status = 400;
              return {
                success: false,
                error: `Maksimal ${MAX_FILES_PER_BATCH} berkas per batch impor.`,
              };
            }

            // Validasi ukuran berkas (perkiraan dari base64 string length)
            for (const file of files) {
              if (typeof file.fileData !== 'string') {
                set.status = 400;
                return {
                  success: false,
                  error: `Berkas ${file.fileName} tidak memiliki data yang valid.`,
                };
              }
              const estimatedSizeBytes = Math.round((file.fileData.length * 3) / 4);
              if (estimatedSizeBytes > MAX_FILE_SIZE_BYTES) {
                set.status = 400;
                return {
                  success: false,
                  error: `Berkas ${file.fileName} melebihi batas 5 MB (perkiraan ${Math.round(estimatedSizeBytes / 1024)} KB).`,
                };
              }
            }

            const result = await importDataService.importFotoBackupFiles(body.files);
            return { success: true, ...result, data: result };
          } catch (err: any) {
            set.status = 500;
            return { success: false, error: err.message };
          }
        },
        {
          body: importFotoBackupBodySchema,
          requireAuth: true,
        }
      )

      // 2. Import Data Pencatatan (Stand meter offline / recovery via CSV / JSON)
      .post(
        '/data',
        async ({ body, set }) => {
          try {
            let items = body.items as any;
            if (body.csvText) {
              items = importDataService.parsePencatatanCsv(body.csvText);
            }

            if (!items || items.length === 0) {
              set.status = 400;
              return { success: false, error: 'Tidak ada baris data pencatatan yang valid untuk diproses.' };
            }

            const result = await importDataService.importDataPencatatan(items);
            return { success: true, ...result, data: result };
          } catch (err: any) {
            set.status = 500;
            return { success: false, error: err.message };
          }
        },
        {
          body: importDataBodySchema,
          requireAuth: true,
        }
      )

      // 2b. Import Laporan Data Meter PDAM (lapdatameter) ke cater_baca_meter
      .post(
        '/lapdatameter',
        async ({ body, set }) => {
          try {
            let items = body.items as any;
            if (body.csvText) {
              items = importDataService.parseLapDataMeterCsv(body.csvText);
            }

            if (!items || items.length === 0) {
              set.status = 400;
              return {
                success: false,
                error: 'Tidak ada baris data LapDataMeter yang valid untuk diproses.',
              };
            }

            // Validasi struktur minimum setiap item sebelum diproses
            for (const item of items) {
              if (!item.nolg || !item.thbl || item.stml === undefined || item.stma === undefined) {
                set.status = 400;
                return {
                  success: false,
                  error: `Baris data tidak valid: nolg, thbl, stml, dan stma wajib diisi. Ditemukan nolg=${item.nolg}, thbl=${item.thbl}`,
                };
              }
            }

            const result = await importDataService.importLapDataMeter(items);
            return { success: true, ...result, data: result };
          } catch (err: any) {
            console.error('[IMPORT_LAPDATA_METER_ERROR]', err);
            set.status = 500;
            return { success: false, error: err.message };
          }
        },
        {
          body: importLapDataMeterBodySchema,
          requireAuth: true,
        }
      )

      // 3. Import R Nomor (Pemutusan Langganan)
      .post(
        '/r-nomor',
        async ({ body, set }) => {
          try {
            if (!body.items || body.items.length === 0) {
              set.status = 400;
              return { success: false, error: 'Tidak ada data pemutusan R-Nomor yang dikirim.' };
            }

            const result = await importDataService.importRNomor(body.items);
            return { success: true, ...result, data: result };
          } catch (err: any) {
            set.status = 500;
            return { success: false, error: err.message };
          }
        },
        {
          body: importRNomorBodySchema,
          requireAuth: true,
        }
      )

      // 4. Import PBPK (Pasang Baru & Pemasangan Kembali CSV)
      .post(
        '/pbpk',
        async ({ body, set }) => {
          try {
            let rows = body.rows;
            if (body.csvText) {
              rows = importDataService.parsePbpkCsv(body.csvText);
            }

            if (!rows || rows.length === 0) {
              set.status = 400;
              return { success: false, error: 'Tidak ada baris data PBPK yang valid untuk diproses.' };
            }

            const result = await importDataService.importPbpk(rows as any, body.periode || '202611');
            return { success: true, ...result, data: result };
          } catch (err: any) {
            set.status = 500;
            return { success: false, error: err.message };
          }
        },
        {
          body: importPbpkBodySchema,
          requireAuth: true,
        }
      )
  )

  // 5. Sample Data PBPK dari file packages/db/data/raw/PBPK.csv
  .get('/sample/pbpk', async ({ set }) => {
    try {
      const candidates = [
        path.resolve(process.cwd(), 'packages/db/data/raw/PBPK.csv'),
        path.resolve(process.cwd(), 'packages/db/data/jan/PBPK.csv'),
        path.resolve(process.cwd(), '../../packages/db/data/raw/PBPK.csv'),
        path.resolve(process.cwd(), '../../packages/db/data/jan/PBPK.csv'),
        path.resolve(__dirname, '../../../../../../packages/db/data/raw/PBPK.csv'),
        path.resolve(__dirname, '../../../../../../packages/db/data/jan/PBPK.csv'),
      ];

      let csvContent = '';
      for (const p of candidates) {
        if (fs.existsSync(/* turbopackIgnore: true */ p)) {
          csvContent = fs.readFileSync(/* turbopackIgnore: true */ p, 'utf-8');
          break;
        }
      }

      if (!csvContent) {
        return {
          success: true,
          total: 0,
          rows: [],
          csvText: '',
          message: 'File sample PBPK.csv tidak ditemukan di direktori default.',
        };
      }

      const rows = importDataService.parsePbpkCsv(csvContent);
      return {
        success: true,
        total: rows.length,
        rows: rows.slice(0, 50),
        csvText: csvContent,
      };
    } catch (err: any) {
      set.status = 500;
      return { success: false, error: err.message };
    }
  })

  // 5b. Sample Data LapDataMeter dari file packages/db/data/raw/lapdatametertes.csv
  .get('/sample/lapdatameter', async ({ set }) => {
    try {
      const candidates = [
        path.resolve(process.cwd(), 'packages/db/data/raw/lapdatametertes.csv'),
        path.resolve(process.cwd(), 'packages/db/data/raw/lapdatameter.csv'),
        path.resolve(process.cwd(), '../../packages/db/data/raw/lapdatametertes.csv'),
        path.resolve(process.cwd(), '../../packages/db/data/raw/lapdatameter.csv'),
        path.resolve(__dirname, '../../../../../../packages/db/data/raw/lapdatametertes.csv'),
        path.resolve(__dirname, '../../../../../../packages/db/data/raw/lapdatameter.csv'),
      ];

      let csvContent = '';
      for (const p of candidates) {
        if (fs.existsSync(/* turbopackIgnore: true */ p)) {
          csvContent = fs.readFileSync(/* turbopackIgnore: true */ p, 'utf-8');
          break;
        }
      }

      if (!csvContent) {
        return {
          success: true,
          total: 0,
          rows: [],
          csvText: '',
          message: 'Berkas sample lapdatametertes.csv tidak ditemukan di direktori default.',
        };
      }

      const rows = importDataService.parseLapDataMeterCsv(csvContent);
      // Ambil 50 baris pertama untuk preview cepat
      return {
        success: true,
        total: rows.length,
        rows: rows.slice(0, 50),
        csvText: csvContent.split(/\r?\n/).slice(0, 51).join('\n'),
      };
    } catch (err: any) {
      set.status = 500;
      return { success: false, error: err.message };
    }
  })

  // 6. Kontrak & Spesifikasi Baku Mobile App Developer
  .get('/spec', () => {
    return {
      success: true,
      specification: {
        photoNaming: {
          pattern: '{THBL}_{JENIS}_{NOLG}.jpg',
          examples: [
            '202601_stand_00703600750.jpg',
            '202601_segel_00703600750.jpg',
            '202601_rumah_00703600750.jpg',
          ],
          rules: {
            THBL: 'Periode penagihan 6 digit numerik (contoh: 202601)',
            JENIS: 'stand (angka meter) | segel (segel fisik) | rumah (fasad bangunan)',
            NOLG: 'Nomor langganan pelanggan (contoh: 00703600750)',
            EXTENSION: '.jpg, .jpeg, .png, .webp',
          },
        },
        dataExportCsv: {
          delimiter: ';',
          header: 'thbl;nolg;stml;stma;pakai_m3;tgl_catat;petugas_id;rute_kode;kondisi;latitude;longitude;catatan',
          sampleRow: '202601;00703600750;120;138;18;2026-01-19 07:39:00;PETUGAS01;CD305;Normal;-6.917464;107.619123;Meter normal',
        },
      },
    };
  })

  // 7. Lookup Pelanggan dari Database berdasarkan NOLG
  .post('/lookup-pelanggan', async ({ body, set }) => {
    try {
      const { nolgs } = (body as { nolgs?: string[] }) || {};
      if (!nolgs || !Array.isArray(nolgs) || nolgs.length === 0) {
        return { success: true, data: [] };
      }

      const list = await db
        .select({
          nolg: pelanggan.nolg,
          nama: pelanggan.nama,
          alamat: pelanggan.alamat,
          ruteKode: pelanggan.ruteKode,
          status: pelanggan.status,
        })
        .from(pelanggan)
        .where(inArray(pelanggan.nolg, nolgs.slice(0, 500)));

      return { success: true, data: list };
    } catch (err: any) {
      set.status = 500;
      return { success: false, error: err.message };
    }
  });
