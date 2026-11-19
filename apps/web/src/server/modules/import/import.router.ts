import { Elysia } from 'elysia';
import fs from 'fs';
import path from 'path';
import { db, pelanggan } from '@cater/db';
import { inArray } from 'drizzle-orm';
import { authPlugin } from '../../plugins/auth';
import { importDataService } from '../../services/import/import-data.service';
import {
  importFotoBackupBodySchema,
  importDataBodySchema,
  importRNomorBodySchema,
  importPbpkBodySchema,
} from './import.schema';

export const importRouter = new Elysia({ prefix: '/import' })
  .use(authPlugin)

  // 1. Import Paket Foto Backup (Format: {THBL}_{JENIS}_{NOLG}.jpg)
  // Contoh: 202601_stand_00703600750.jpg, 202601_segel_00703600750.jpg, 202601_rumah_00703600750.jpg
  .post(
    '/foto-backup',
    async ({ body, set }) => {
      try {
        if (body.files && body.files.length > 0) {
          const result = await importDataService.importFotoBackupFiles(body.files);
          return { success: true, ...result, data: result };
        }

        if (body.items && body.items.length > 0) {
          // Konversi format structured
          const files = body.items.flatMap((item) => {
            const list: { fileName: string; fileData: string }[] = [];
            if (item.fotoMeterUrl) {
              list.push({
                fileName: `${item.thbl}_stand_${item.nolg}.jpg`,
                fileData: item.fotoMeterUrl,
              });
            }
            if (item.fotoSegelUrl) {
              list.push({
                fileName: `${item.thbl}_segel_${item.nolg}.jpg`,
                fileData: item.fotoSegelUrl,
              });
            }
            if (item.fotoRumahUrl) {
              list.push({
                fileName: `${item.thbl}_rumah_${item.nolg}.jpg`,
                fileData: item.fotoRumahUrl,
              });
            }
            return list;
          });

          const result = await importDataService.importFotoBackupFiles(files);
          return { success: true, ...result, data: result };
        }

        set.status = 400;
        return { success: false, error: 'Tidak ada berkas foto yang dikirim.' };
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

        const result = await importDataService.importPbpk(rows as any, body.periode || '202601');
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
        if (fs.existsSync(p)) {
          csvContent = fs.readFileSync(p, 'utf-8');
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
