import { describe, expect, it } from 'bun:test';
import { app } from '../apps/web/src/server/app';
import { pengaduanService } from '../apps/web/src/server/services/pengaduan/pengaduan.service';

describe('Peta Pengaduan Spasial & Endpoint Publik', () => {
  it('pengaduanService.getPengaduanPetaPublik returns array of map-ready complaints', async () => {
    const data = await pengaduanService.getPengaduanPetaPublik();
    expect(Array.isArray(data)).toBe(true);
    for (const item of data) {
      expect(typeof item.id).toBe('string');
      expect(typeof item.lng).toBe('number');
      expect(typeof item.lat).toBe('number');
    }
  });

  it('GET /api/publik/pengaduan/peta returns success and complaint array', async () => {
    const res = await app.handle(new Request('http://localhost/api/publik/pengaduan/peta'));
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('GET /api/public/pengaduan/peta is also accessible via /public alias', async () => {
    const res = await app.handle(new Request('http://localhost/api/public/pengaduan/peta'));
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('GET /api/publik/geokode/balik returns default or resolved address', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/publik/geokode/balik?lat=-6.9147&lng=107.6098')
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(typeof json.data?.alamat).toBe('string');
  });

  it('GET /api/publik/geokode/cari returns hasil array', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/publik/geokode/cari?q=Badaksinga')
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data?.hasil)).toBe(true);
  });
});

describe('Dashboard Pengaduan Desk & V1 Endpoints', () => {
  it('GET /api/v1/pengaduan/statistik returns operational statistics', async () => {
    const res = await app.handle(new Request('http://localhost/api/v1/pengaduan/statistik'));
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(json.data).toBeDefined();
    expect(typeof json.data.perStatus).toBe('object');
    expect(typeof json.data.melanggarSla).toBe('number');
    expect(typeof json.data.belumDitugaskan).toBe('number');
  });

  it('GET /api/v1/pengaduan/petugas returns list of petugas', async () => {
    const res = await app.handle(new Request('http://localhost/api/v1/pengaduan/petugas'));
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
    expect(json.data[0].id).toBeDefined();
    expect(json.data[0].name).toBeDefined();
  });

  it('GET /api/v1/pengaduan returns paginated complaints for DataGrid', async () => {
    const res = await app.handle(new Request('http://localhost/api/v1/pengaduan?page=1&pageSize=10'));
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.meta).toBeDefined();
    expect(typeof json.meta.total).toBe('number');
  });

  it('Full ticket lifecycle: create -> detail -> catatan -> chat -> tugaskan', async () => {
    // 1. Create a ticket
    const createRes = await app.handle(
      new Request('http://localhost/api/pengaduan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jenis: 'BOCOR_PIPA_DINAS',
          judul: 'Pipa retak depan gerbang kantor',
          deskripsi: 'Air menyembur cukup deras, membahayakan pengguna jalan.',
          pelapor: 'Dedi Kusnadi',
          kontakPelapor: '081234567890',
          koordinat: { x: 107.61, y: -6.91 },
        }),
      })
    );
    expect(createRes.status).toBe(201);
    const createJson = (await createRes.json()) as any;
    expect(createJson.success).toBe(true);
    const ticketId = createJson.data.id;
    const nomorTiket = createJson.data.nomorTiket;

    // 2. Fetch full detail by ID
    const detailRes = await app.handle(new Request(`http://localhost/api/v1/pengaduan/${ticketId}`));
    expect(detailRes.status).toBe(200);
    const detailJson = (await detailRes.json()) as any;
    expect(detailJson.success).toBe(true);
    expect(detailJson.data.nomorTiket).toBe(nomorTiket);
    expect(detailJson.data.sla).toBeDefined();
    expect(Array.isArray(detailJson.data.transisiTersedia)).toBe(true);

    // 3. Add internal note
    const catatanRes = await app.handle(
      new Request(`http://localhost/api/v1/pengaduan/${ticketId}/catatan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ catatan: 'Telah dicek oleh tim jaga malam.' }),
      })
    );
    expect(catatanRes.status).toBe(200);
    const catatanJson = (await catatanRes.json()) as any;
    expect(catatanJson.success).toBe(true);

    // 4. Send chat message
    const chatRes = await app.handle(
      new Request(`http://localhost/api/v1/pengaduan/${ticketId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pesan: 'Regu lapangan sedang mempersiapkan klem pipa pengganti.' }),
      })
    );
    expect(chatRes.status).toBe(200);
    const chatJson = (await chatRes.json()) as any;
    expect(chatJson.success).toBe(true);

    // 5. Cleanup test ticket so DB stays clean for user seed viewing
    const { db, pengaduan, riwayatPengaduan } = await import('@cater/db');
    const { eq } = await import('drizzle-orm');
    await db.delete(riwayatPengaduan).where(eq(riwayatPengaduan.pengaduanId, ticketId));
    await db.delete(pengaduan).where(eq(pengaduan.id, ticketId));
  });
});
