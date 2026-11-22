import { describe, expect, it } from 'bun:test';
import { app } from '../apps/web/src/server/app';
import { pengaduanService } from '../apps/web/src/server/services/pengaduan/pengaduan.service';
import { JENIS_PENGADUAN_PETA_PUBLIK } from '../apps/web/src/server/domain/pengaduan/pengaduan.config';

describe('Fase 1: Keamanan Data & Privasi Peta Publik (B1, B2)', () => {
  it('1. Endpoint publik /api/publik/pengaduan/peta TIDAK membocorkan PII (pelapor, kontak, deskripsi, petugas)', async () => {
    const res = await app.handle(new Request('http://localhost/api/publik/pengaduan/peta'));
    expect(res.status).toBe(200);
    const text = await res.text();

    // Pastikan seluruh JSON respons bersih dari key sensitif
    expect(text.includes('"pelapor":')).toBe(false);
    expect(text.includes('"kontakPelapor":')).toBe(false);
    expect(text.includes('"deskripsi":')).toBe(false);
    expect(text.includes('"alamatKejadian":')).toBe(false);
    expect(text.includes('"fotoUrl":')).toBe(false);
    expect(text.includes('"petugasNama":')).toBe(false);
    expect(text.includes('"olehNama":')).toBe(false);

    const json = JSON.parse(text);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('2. getPengaduanPetaPublik membulatkan koordinat ke 3 desimal (~110m) dan tanpa fallback koordinat fiktif', async () => {
    const data = await pengaduanService.getPengaduanPetaPublik();
    expect(Array.isArray(data)).toBe(true);

    for (const item of data) {
      expect(typeof item.lng).toBe('number');
      expect(typeof item.lat).toBe('number');

      // Cek bahwa pembulatan maksimal 3 desimal
      const lngDecimals = (item.lng.toString().split('.')[1] || '').length;
      const latDecimals = (item.lat.toString().split('.')[1] || '').length;
      expect(lngDecimals).toBeLessThanOrEqual(3);
      expect(latDecimals).toBeLessThanOrEqual(3);

      // Cek bahwa status DITOLAK tidak pernah muncul di peta publik
      expect(item.status).not.toBe('DITOLAK');

      // Cek bahwa jenis hanya yang terdaftar di JENIS_PENGADUAN_PETA_PUBLIK
      expect((JENIS_PENGADUAN_PETA_PUBLIK as readonly string[]).includes(item.jenis)).toBe(true);

      // Cek bahwa linimasa tidak memuat nama/identitas petugas
      if (Array.isArray(item.riwayat)) {
        for (const rw of item.riwayat) {
          expect((rw as any).petugasId).toBeUndefined();
          expect((rw as any).olehNama).toBeUndefined();
          expect((rw as any).petugasNama).toBeUndefined();
        }
      }
    }
  });

  it('3. Endpoint alias /api/public/pengaduan/peta juga menerapkan sanitasi data yang identik', async () => {
    const res = await app.handle(new Request('http://localhost/api/public/pengaduan/peta'));
    expect(res.status).toBe(200);
    const text = await res.text();

    expect(text.includes('"pelapor":')).toBe(false);
    expect(text.includes('"kontakPelapor":')).toBe(false);
    expect(text.includes('"deskripsi":')).toBe(false);
    expect(text.includes('"petugasNama":')).toBe(false);
  });
});
