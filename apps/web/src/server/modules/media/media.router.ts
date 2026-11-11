import { Elysia, t } from 'elysia';
import { authPlugin } from '../../plugins/auth';
import {
  uploadToCloudinary,
  isCloudinaryConfigured,
  generatePhotoPublicId,
  getCloudinaryFolder,
  type ModulFoto,
  type JenisFoto,
} from '../../lib/cloudinary';

/**
 * Media Router: Menangani endpoint unggah foto & media terstandar Cloudinary
 * Format file: ({THBL}_{JENIS}_{IDENTIFIER}.jpg)
 */
export const mediaRouter = new Elysia({ prefix: '/media' })
  .use(authPlugin)

  // Status Koneksi Cloudinary
  .get('/status', () => {
    return {
      success: true,
      configured: isCloudinaryConfigured(),
      message: isCloudinaryConfigured()
        ? 'Cloudinary CDN terhubung dan siap digunakan.'
        : 'Cloudinary belum dikonfigurasi di .env.local',
    };
  })

  // Upload Foto Media
  .post(
    '/upload',
    async ({ body, set }) => {
      try {
        if (!isCloudinaryConfigured()) {
          set.status = 503;
          return {
            success: false,
            error: 'Layanan Cloudinary belum aktif / kredensial belum dikonfigurasi.',
          };
        }

        const result = await uploadToCloudinary({
          file: body.file,
          modul: body.modul as ModulFoto,
          jenis: body.jenis as JenisFoto,
          identifier: body.identifier,
          thbl: body.thbl,
        });

        const filename = `${generatePhotoPublicId({
          thbl: body.thbl,
          jenis: body.jenis as JenisFoto,
          identifier: body.identifier,
        })}.${result.format || 'jpg'}`;

        set.status = 201;
        return {
          success: true,
          data: {
            ...result,
            filename,
          },
        };
      } catch (err: any) {
        set.status = 500;
        return {
          success: false,
          error: err.message || 'Gagal mengunggah foto ke Cloudinary.',
        };
      }
    },
    {
      body: t.Object({
        file: t.String({ description: 'Base64 DataURL gambar' }),
        modul: t.Union([
          t.Literal('cater'),
          t.Literal('mandiri'),
          t.Literal('gwm'),
          t.Literal('pengaduan'),
          t.Literal('avatars'),
        ]),
        jenis: t.Union([
          t.Literal('stand'),
          t.Literal('segel'),
          t.Literal('rumah'),
          t.Literal('aduan'),
          t.Literal('selesai'),
          t.Literal('angkat'),
          t.Literal('pasang'),
          t.Literal('avatar'),
        ]),
        identifier: t.String({ description: 'NOLG / Nomor Tiket / User ID' }),
        thbl: t.Optional(t.String({ description: 'THBL 6 digit, contoh: 202610' })),
      }),
    }
  );
