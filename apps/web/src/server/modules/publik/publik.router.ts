import { Elysia } from 'elysia';
import { inquiryTagihanService } from '../../services/publik/inquiry-tagihan.service';
import { pengaduanService } from '../../services/pengaduan/pengaduan.service';
import {
  inquiryTagihanParamsSchema,
  publicCreatePengaduanBodySchema,
  publicDetailPengaduanParamsSchema,
  publicRatingPengaduanBodySchema,
} from './publik.schema';

/**
 * Publik Router: Menangani endpoint portal publik warga
 * (Form Cek Tagihan, Pengaduan Air, & Pelacakan Tiket)
 * Bebas otentikasi internal staf dengan validasi TypeBox ketat & CSPRNG unguessable ticket.
 */
export const publikRouter = new Elysia({ prefix: '/publik' })
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

  // 3. Lacak Status Pengaduan Air (Hanya Linimasa Publik yang Ditampilkan)
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

  // 4. Rating Kepuasan Pelanggan terhadap Tiket Selesai
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
  );
