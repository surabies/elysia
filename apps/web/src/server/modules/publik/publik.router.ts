import { Elysia, t } from 'elysia';
import { eq, and } from 'drizzle-orm';
import { db, caterMandiriPelanggan } from '@cater/db';
import { inquiryTagihanService } from '../../services/publik/inquiry-tagihan.service';
import { pengaduanService } from '../../services/pengaduan/pengaduan.service';
import { mandiriService } from '../../services/mandiri/mandiri.service';
import { submitMandiriPublicBodySchema } from '../mandiri/mandiri.schema';
import {
  inquiryTagihanParamsSchema,
  publicCreatePengaduanBodySchema,
  publicDetailPengaduanParamsSchema,
  publicRatingPengaduanBodySchema,
} from './publik.schema';

/**
 * Publik Routes: Menangani endpoint portal publik warga
 * (Form Cek Tagihan, Pengaduan Air, Peta Spasial Aduan, Geokode, & Pelacakan Tiket)
 * Bebas otentikasi internal staf dengan validasi TypeBox ketat & CSPRNG unguessable ticket.
 */
const publikRoutes = new Elysia()
  // 1. Cek Tagihan Rekening Air Warga (Inquiry Sinkron: Billing + Catat Meter + Komplain)
  .get(
    '/tagihan/:nolg',
    async ({ params: { nolg }, set }) => {
      try {
        const data = await inquiryTagihanService.inquiryTagihan(nolg);
        return { success: true, data };
      } catch (err: any) {
        set.status = err.message.includes('tidak ditemukan') ? 404 : 500;
        return { success: false, error: err.message };
      }
    },
    {
      params: inquiryTagihanParamsSchema,
    }
  )

  // 2. Submit Pengaduan Air Baru oleh Warga
  .post(
    '/pengaduan',
    async ({ body, set }) => {
      try {
        const result = await pengaduanService.createPengaduan(body as any);
        set.status = 201;
        return {
          success: true,
          message: 'Pengaduan Anda berhasil dikirim dan sedang ditindaklanjuti.',
          data: {
            id: result.id,
            nomorTiket: result.nomorTiket,
            judul: result.judul,
            status: result.status,
            targetSelesaiAt: result.targetSelesaiAt,
            createdAt: result.createdAt,
          },
        };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: publicCreatePengaduanBodySchema,
    }
  )

  // 3. Peta Spasial Pengaduan Publik (Wajib SEBELUM /pengaduan/:nomorTiket)
  .get('/pengaduan/peta', async () => {
    const data = await pengaduanService.getPengaduanPetaPublik();
    return { success: true, data };
  })

  // 4. Geokoding Balik (lat, lng -> alamat display)
  .get(
    '/geokode/balik',
    async ({ query: { lat, lng } }) => {
      const numLat = Number(lat);
      const numLng = Number(lng);
      if (Number.isNaN(numLat) || Number.isNaN(numLng)) {
        return { success: true, data: { alamat: 'Kota Bandung' } };
      }

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${numLat}&lon=${numLng}`,
          {
            headers: { 'User-Agent': 'PerumdaTirtawening/1.0' },
            signal: controller.signal,
          }
        );
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          if (data?.display_name) {
            return { success: true, data: { alamat: data.display_name } };
          }
        }
      } catch {}

      return { success: true, data: { alamat: 'Kota Bandung' } };
    },
    {
      query: t.Object({
        lat: t.String(),
        lng: t.String(),
      }),
    }
  )

  // 5. Geokoding Cari (q -> array of locations)
  .get(
    '/geokode/cari',
    async ({ query: { q } }) => {
      if (!q || !q.trim()) {
        return { success: true, data: { hasil: [] } };
      }

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
            q.trim()
          )}&viewbox=107.55,-6.8,107.75,-7.0&bounded=1&limit=5`,
          {
            headers: { 'User-Agent': 'PerumdaTirtawening/1.0' },
            signal: controller.signal,
          }
        );
        clearTimeout(timer);
        if (res.ok) {
          const items = await res.json();
          if (Array.isArray(items)) {
            const hasil = items.map((it: any) => ({
              lng: parseFloat(it.lon),
              lat: parseFloat(it.lat),
              label: it.display_name,
            }));
            return { success: true, data: { hasil } };
          }
        }
      } catch {}

      return { success: true, data: { hasil: [] } };
    },
    {
      query: t.Object({
        q: t.String(),
      }),
    }
  )

  // 6. Lacak Status Pengaduan Air (Hanya Linimasa Publik yang Ditampilkan)
  .get(
    '/pengaduan/:nomorTiket',
    async ({ params: { nomorTiket }, set }) => {
      try {
        const result = await pengaduanService.getDetailPengaduan(nomorTiket, false);
        return {
          success: true,
          data: {
            nomorTiket: result.pengaduan.nomorTiket,
            judul: result.pengaduan.judul,
            jenis: result.pengaduan.jenis,
            status: result.pengaduan.status,
            prioritas: result.pengaduan.prioritas,
            pelapor: result.pengaduan.pelapor,
            targetSelesaiAt: result.pengaduan.targetSelesaiAt,
            selesaiAt: result.pengaduan.selesaiAt,
            catatanPenyelesaian: result.pengaduan.catatanPenyelesaian,
            fotoPenyelesaianUrl: result.pengaduan.fotoPenyelesaianUrl,
            linimasa: result.linimasa,
          },
        };
      } catch (err: any) {
        set.status = err.message.includes('tidak ditemukan') ? 404 : 500;
        return { success: false, error: err.message };
      }
    },
    {
      params: publicDetailPengaduanParamsSchema,
    }
  )

  // 7. Rating Kepuasan Pelanggan terhadap Tiket Selesai
  .post(
    '/pengaduan/:nomorTiket/rating',
    async ({ params: { nomorTiket }, body, set }) => {
      try {
        const result = await pengaduanService.beriRating(
          nomorTiket,
          body.rating,
          body.komentar
        );
        return { success: true, ...result };
      } catch (err: any) {
        set.status = 400;
        return { success: false, error: err.message };
      }
    },
    {
      params: publicDetailPengaduanParamsSchema,
      body: publicRatingPengaduanBodySchema,
    }
  )

  // 8. Lapor Meter Mandiri oleh Warga (Web & Mobile App) - API Terpadu
  .post(
    '/lapor-meter',
    async ({ body, set, request }) => {
      try {
        const ipAddress = request.headers.get('x-forwarded-for') ?? undefined;
        const userAgent = request.headers.get('user-agent') ?? undefined;

        const result = await mandiriService.submitLaporanMandiri({
          ...body,
          ipAddress,
          userAgent,
        });

        set.status = 201;
        return { success: true, data: result };
      } catch (err: any) {
        set.status = err.message.includes('ditutup') ? 403 : 400;
        return { success: false, error: err.message };
      }
    },
    {
      body: submitMandiriPublicBodySchema,
    }
  )

  // 9. Cek Status Laporan Mandiri Warga
  .get(
    '/lapor-meter/status/:nolg',
    async ({ params: { nolg }, query }) => {
      const thbl = query.thbl ?? '202601';
      const [laporan] = await db
        .select()
        .from(caterMandiriPelanggan)
        .where(
          and(
            eq(caterMandiriPelanggan.nolg, nolg),
            eq(caterMandiriPelanggan.thbl, thbl)
          )
        )
        .limit(1);

      return {
        success: true,
        data: laporan ?? null,
      };
    },
    {
      params: t.Object({ nolg: t.String() }),
      query: t.Object({ thbl: t.Optional(t.String()) }),
    }
  );

export const publikRouter = new Elysia({ prefix: '/publik' }).use(publikRoutes);
export const publicRouter = new Elysia({ prefix: '/public' }).use(publikRoutes);
