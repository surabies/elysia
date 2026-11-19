import { Elysia, t } from 'elysia';
import { eq, and, desc } from 'drizzle-orm';
import { db, caterMandiriPelanggan, golonganTarif, tarifBlok, periodePenagihan } from '@cater/db';
import { periksaJendelaLaporMandiri } from '../../domain/mandiri/mandiri.engine';
import {
  hitungRincianHargaAir,
  hitungTotalTagihan,
  type HargaBlok,
} from '../../domain/tagihan/tagihan.engine';
import { inquiryTagihanService } from '../../services/publik/inquiry-tagihan.service';
import { pengaduanService } from '../../services/pengaduan/pengaduan.service';
import { mandiriService } from '../../services/mandiri/mandiri.service';
import { broadcastService } from '../../services/broadcast/broadcast.service';
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

  // 8b. Jendela & Jadwal Pelaporan Mandiri Resmi (WIB & Periode Aktif)
  .get('/lapor-meter/jadwal', async () => {
    const [periodeAktif] = await db
      .select({
        periode: periodePenagihan.periode,
        status: periodePenagihan.status,
      })
      .from(periodePenagihan)
      .where(eq(periodePenagihan.status, 'BERJALAN'))
      .orderBy(desc(periodePenagihan.periode))
      .limit(1);

    const sekarang = new Date();
    const wib = new Date(sekarang.getTime() + 7 * 60 * 60 * 1000);
    const defaultPeriodeNum = wib.getUTCFullYear() * 100 + (wib.getUTCMonth() + 1);

    const activeThbl = periodeAktif?.periode ?? String(defaultPeriodeNum);
    const isLocked = !periodeAktif || periodeAktif.status === 'TERKUNCI';

    const jendela = periksaJendelaLaporMandiri(sekarang);
    const boleh = jendela.boleh && !isLocked;

    return {
      success: true,
      data: {
        ...jendela,
        boleh,
        periode: Number(activeThbl),
        thbl: activeThbl,
        isCutOff: isLocked || !jendela.boleh,
        pesan: isLocked
          ? `Pelaporan meter mandiri periode ${activeThbl} telah ditutup (Cut-off penagihan).`
          : jendela.pesan,
      },
    };
  })

  // 9. Cek Status Laporan Mandiri Warga
  .get(
    '/lapor-meter/status/:nolg',
    async ({ params: { nolg }, query }) => {
      let thbl = query.thbl;
      if (!thbl) {
        const [periodeAktif] = await db
          .select({ periode: periodePenagihan.periode })
          .from(periodePenagihan)
          .where(eq(periodePenagihan.status, 'BERJALAN'))
          .orderBy(desc(periodePenagihan.periode))
          .limit(1);
        const wib = new Date(Date.now() + 7 * 60 * 60 * 1000);
        thbl =
          periodeAktif?.periode ??
          `${wib.getUTCFullYear()}${String(wib.getUTCMonth() + 1).padStart(2, '0')}`;
      }

      const [laporan] = await db
        .select()
        .from(caterMandiriPelanggan)
        .where(
          and(
            eq(caterMandiriPelanggan.nolg, nolg),
            eq(caterMandiriPelanggan.thbl, thbl)
          )
        )
        .orderBy(desc(caterMandiriPelanggan.createdAt))
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
  )

  // 10. Master Tarif Air & Blok Progresif untuk Publik & Simulator
  .get('/tarif', async () => {
    const daftarGolongan = await db.select().from(golonganTarif);
    const daftarBlok = await db.select().from(tarifBlok);

    const data = daftarGolongan.map((g) => {
      const blokTerkait = daftarBlok
        .filter((b) => b.tarifKode === g.kode)
        .sort((a, b) => a.blok - b.blok)
        .map((b) => ({
          blok: b.blok,
          batasAwalM3: b.batasAwalM3,
          batasAkhirM3: b.batasAkhirM3,
          hargaPerM3: Number(b.hargaPerM3),
        }));

      return {
        kode: g.kode,
        nama: g.nama,
        beaBeban: Number(g.beaBeban ?? 0),
        beaAdmin: Number(g.beaAdmin ?? 0),
        airKotor: Number(g.airKotor ?? 0),
        lainLain: Number(g.lainLain ?? 0),
        blok: blokTerkait,
      };
    });

    return { success: true, data };
  })

  // 11. Hitung Simulasi Tagihan Air Berdasarkan Database & Domain Engine
  .get(
    '/tarif/hitung',
    async ({ query: { kode, volume } }) => {
      const vol = Math.max(0, Number(volume) || 0);
      const [gol] = await db
        .select()
        .from(golonganTarif)
        .where(eq(golonganTarif.kode, kode))
        .limit(1);

      if (!gol) {
        return { success: false, error: `Golongan tarif ${kode} tidak ditemukan.` };
      }

      const blokRows = await db
        .select()
        .from(tarifBlok)
        .where(eq(tarifBlok.tarifKode, kode));

      const hargaBlokList: HargaBlok[] = blokRows.map((b) => ({
        blok: b.blok,
        batasAwalM3: b.batasAwalM3,
        batasAkhirM3: b.batasAkhirM3,
        hargaPerM3: Number(b.hargaPerM3),
      }));

      const rincianHargaAir = hitungRincianHargaAir(vol, hargaBlokList);
      const beaBeban = Number(gol.beaBeban ?? 0);
      const beaAdmin = Number(gol.beaAdmin ?? 0);
      const airKotor = Number(gol.airKotor ?? 0);
      const lainLain = Number(gol.lainLain ?? 0);

      const totalTagihan = hitungTotalTagihan({
        jmlHargaAir: rincianHargaAir.total,
        beaBeban,
        beaAdmin,
        airKotor,
        lainLain,
      });

      return {
        success: true,
        data: {
          kode: gol.kode,
          nama: gol.nama,
          volumeM3: vol,
          hargaAir: rincianHargaAir.total,
          rincianBlok: rincianHargaAir.rincian,
          beaBeban,
          beaAdmin,
          airKotor,
          lainLain,
          totalTagihan,
        },
      };
    },
    {
      query: t.Object({
        kode: t.String(),
        volume: t.String(),
      }),
    }
  )

  // 6. Siaran Gangguan & Banner Iklan Publik
  .get('/broadcast', async () => {
    const data = await broadcastService.getPublicBroadcasts();
    return { success: true, data };
  });

export const publikRouter = new Elysia({ prefix: '/publik' }).use(publikRoutes);
export const publicRouter = new Elysia({ prefix: '/public' }).use(publikRoutes);
