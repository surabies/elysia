import { describe, test, expect } from 'bun:test';
import { broadcastService } from '../apps/web/src/server/services/broadcast/broadcast.service';
import { app } from '../apps/web/src/server/app';
import { isCloudinaryConfigured } from '../apps/web/src/server/lib/cloudinary';

describe('Integrasi Siaran Gangguan, Banner Iklan & Media Cloudinary', () => {
  test('1. Service Layer mengekspos fungsi operasional siaran dan fallback data', async () => {
    const list = await broadcastService.getAllBroadcasts();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);

    const publicList = await broadcastService.getPublicBroadcasts();
    expect(Array.isArray(publicList)).toBe(true);
    expect(publicList.every((item) => item.aktif)).toBe(true);
  });

  test('2. CRUD Siklus Hidup Siaran di Service Layer', async () => {
    const testId = `bc-test-${Date.now().toString().slice(-4)}`;
    const created = await broadcastService.createBroadcast({
      id: testId,
      judul: 'Uji Coba Pipa Distribusi Unit Test',
      ringkasan: 'Uji coba penanganan kebocoran pipa',
      kategori: 'DARURAT',
      status: 'DALAM_PENGERJAAN',
      progresPersen: 80,
      prioritas: 'TINGGI',
      waktuMulai: 'Hari ini',
      estimasiSelesai: 'Hari ini',
      aktif: true,
      gambarUtama: 'https://res.cloudinary.com/surabiedev/image/upload/sample.jpg',
      tipeGambarUtama: 'FOTO_KEGIATAN',
    });

    expect(created.id).toBe(testId);
    expect(created.judul).toBe('Uji Coba Pipa Distribusi Unit Test');
    expect(created.aktif).toBe(true);

    // Toggle Aktif
    const toggled = await broadcastService.toggleAktif(testId);
    expect(toggled.aktif).toBe(false);

    // Update
    const updated = await broadcastService.updateBroadcast(testId, {
      progresPersen: 95,
      status: 'SELESAI',
    });
    expect(updated.progresPersen).toBe(95);
    expect(updated.status).toBe('SELESAI');

    // Delete
    const deleted = await broadcastService.deleteBroadcast(testId);
    expect(deleted).toBe(true);
  });

  test('3. Endpoint Publik /api/broadcast/public & /api/public/broadcast dapat diakses publik', async () => {
    const res1 = await app.handle(new Request('http://localhost/api/broadcast/public'));
    expect(res1.status).toBe(200);
    const json1 = await res1.json();
    expect(json1.success).toBe(true);
    expect(Array.isArray(json1.data)).toBe(true);

    const res2 = await app.handle(new Request('http://localhost/api/public/broadcast'));
    expect(res2.status).toBe(200);
    const json2 = await res2.json();
    expect(json2.success).toBe(true);
    expect(Array.isArray(json2.data)).toBe(true);
  });

  test('4. Endpoint Media Status Cloudinary', async () => {
    const res = await app.handle(new Request('http://localhost/api/media/status'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(typeof json.configured).toBe('boolean');
  });
});
