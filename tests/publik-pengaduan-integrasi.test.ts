import { describe, it, expect } from 'bun:test';
import { app } from '@/src/server/app';
import { pengaduanService } from '../apps/web/src/server/services/pengaduan/pengaduan.service';
import { inquiryTagihanService } from '../apps/web/src/server/services/publik/inquiry-tagihan.service';
import {
  generateNomorTiket,
  isTransisiSah,
  hitungTargetSla,
} from '../apps/web/src/server/domain/pengaduan/alur-pengaduan.engine';

describe('Integrasi 3 Pilar: Pencatat Meter, Pengaduan Air, & Penagihan Publik', () => {
  describe('1. Domain Engine: Pengaduan Air State Machine & Format Terukur', () => {
    it('menghasilkan nomor tiket terukur dengan format [KODE][WILAYAH][TANGGAL][URUT] tanpa simbol', () => {
      const tiket = generateNomorTiket({
        kode: 'TK',
        wilayah: '05',
        tanggal: new Date('2026-11-06T03:00:00Z'),
        urut: 1,
      });
      expect(tiket).toBe('TK052611060001');
      expect(tiket.length).toBe(14);
      expect(tiket.includes('-')).toBe(false);
    });

    it('menegakkan aturan transisi status tiket secara ketat', () => {
      expect(isTransisiSah('BARU', 'TERVERIFIKASI')).toBe(true);
      expect(isTransisiSah('BARU', 'DITUGASKAN')).toBe(true);
      expect(isTransisiSah('DITUGASKAN', 'MENUJU_LOKASI')).toBe(true);
      expect(isTransisiSah('MENUJU_LOKASI', 'DIPROSES')).toBe(true);
      expect(isTransisiSah('DIPROSES', 'SELESAI')).toBe(true);
      expect(isTransisiSah('SELESAI', 'DITUTUP')).toBe(true);
      expect(isTransisiSah('SELESAI', 'DIBUKA_KEMBALI')).toBe(true);

      // Transisi terlarang
      expect(isTransisiSah('BARU', 'SELESAI')).toBe(false);
      expect(isTransisiSah('DITUTUP', 'DIPROSES')).toBe(false);
    });

    it('menghitung SLA dinamis berdasarkan tingkat prioritas tiket', () => {
      const tgl = new Date('2026-05-01T08:00:00Z');
      const sla = hitungTargetSla('DARURAT', tgl);
      expect(sla.targetResponsAt.getTime() - tgl.getTime()).toBe(1 * 60 * 60 * 1000); // 1 jam
      expect(sla.targetSelesaiAt.getTime() - tgl.getTime()).toBe(6 * 60 * 60 * 1000); // 6 jam
    });
  });

  describe('2. Service Layer: Pengaduan & Inquiry Tagihan Publik', () => {
    it('pengaduanService mengekspos seluruh orkestrasi tiket', () => {
      expect(pengaduanService).toBeDefined();
      expect(typeof pengaduanService.createPengaduan).toBe('function');
      expect(typeof pengaduanService.getDetailPengaduan).toBe('function');
      expect(typeof pengaduanService.tugaskanPengaduan).toBe('function');
      expect(typeof pengaduanService.ubahStatusPengaduan).toBe('function');
      expect(typeof pengaduanService.beriRating).toBe('function');
    });

    it('inquiryTagihanService mengekspos inquiry terpadu 3 pilar', () => {
      expect(inquiryTagihanService).toBeDefined();
      expect(typeof inquiryTagihanService.inquiryTagihan).toBe('function');
    });
  });

  describe('3. Proteksi RBAC Endpoint Internal Pengaduan', () => {
    it('POST /api/pengaduan menolak akses tanpa autentikasi (401)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/pengaduan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            judul: 'Pipa Bocor',
            deskripsi: 'Pipa dinas bocor di depan rumah',
            jenis: 'BOCOR_PIPA_DINAS',
            pelapor: 'Budi',
          }),
        })
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/pengaduan/tugaskan menolak akses tanpa autentikasi (401)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/pengaduan/tugaskan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pengaduanId: 'ticket-1',
            ditugaskanKeId: 'user-1',
          }),
        })
      );
      expect(res.status).toBe(401);
    });

    it('PATCH /api/pengaduan/status menolak akses tanpa autentikasi (401)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/pengaduan/status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pengaduanId: 'ticket-1',
            statusKe: 'DIPROSES',
          }),
        })
      );
      expect(res.status).toBe(401);
    });
  });

  describe('4. Portal Publik Warga: Form Cek Tagihan & Pengaduan Air', () => {
    it('POST /api/publik/pengaduan menolak payload yang tidak lengkap (422)', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/publik/pengaduan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // judul kosong & pelapor kosong
            jenis: 'LAINNYA',
          }),
        })
      );
      expect(res.status).toBe(422);
    });

    it('GET /api/publik/tagihan/:nolg dapat diakses secara publik tanpa token auth', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/publik/tagihan/00302600011')
      );
      // Status bukan 401 (auth lolos; baik 200 bila ada data atau 404/500 bila DB offline)
      expect(res.status).not.toBe(401);
    });

    it('GET /api/publik/pengaduan/:nomorTiket dapat diakses secara publik tanpa token auth', async () => {
      const res = await app.handle(
        new Request('http://localhost/api/publik/pengaduan/TK052611060001')
      );
      // Status bukan 401 (auth lolos)
      expect(res.status).not.toBe(401);
    });
  });

  describe('5. Validasi Sinergi Data 3 Pilar', () => {
    it('nomorTiketKomplain terdefinisi pada skema koreksi administratif staff', async () => {
      const { staffCorrectionBodySchema } = await import(
        '../apps/web/src/server/modules/cater/cater.schema'
      );
      expect(staffCorrectionBodySchema).toBeDefined();
      expect(staffCorrectionBodySchema.properties.nomorTiketKomplain).toBeDefined();
    });

    it('modul mandiri terintegrasi untuk override kondisi DK (Pagar Dikunci)', async () => {
      const { mandiriService } = await import(
        '../apps/web/src/server/services/mandiri/mandiri.service'
      );
      expect(mandiriService).toBeDefined();
      expect(typeof mandiriService.verifikasiLaporanMandiri).toBe('function');
    });
  });
});
