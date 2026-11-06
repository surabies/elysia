import { describe, it, expect, beforeAll } from 'bun:test';
import { app } from '@/src/server/app';
import { db } from '@cater/db';
import { sql } from 'drizzle-orm';

describe('Cater Baca Meter API Endpoints', () => {
  let isDbOnline = false;

  beforeAll(async () => {
    try {
      await db.execute(sql`SELECT 1`);
      isDbOnline = true;
    } catch {
      isDbOnline = false;
    }
  });

  it('GET /api/cater/stats should return comprehensive system stats', async () => {
    const res = await app.handle(new Request('http://localhost/api/cater/stats'));
    expect(res.status).toBe(200);

    const body = await res.json();
    if (!isDbOnline) {
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
      return;
    }
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.totalPelanggan).toBeGreaterThanOrEqual(20000);
    expect(body.data.totalRute).toBeGreaterThanOrEqual(100);
    expect(body.data.totalPetugas).toBeGreaterThanOrEqual(5);
    expect(body.data.totalPakaiM3).toBeGreaterThan(0);
    expect(body.data.totalTagihan).toBeGreaterThan(0);
    expect(Array.isArray(body.data.kondisiBreakdown)).toBe(true);
  });

  it('GET /api/cater/routes should return route lists with customer counts', async () => {
    const res = await app.handle(new Request('http://localhost/api/cater/routes?limit=10'));
    expect(res.status).toBe(200);

    const body = await res.json();
    if (!isDbOnline) {
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
      return;
    }
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].kode).toBeDefined();
    expect(body.data[0].customerCount).toBeGreaterThan(0);
  });

  it('GET /api/cater/routes/:kode/pelanggan should return customers for offline mobile download', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/cater/routes/CD104/pelanggan?limit=5')
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    if (!isDbOnline) {
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
      return;
    }
    expect(body.success).toBe(true);
    expect(body.ruteKode).toBe('CD104');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.total).toBeGreaterThan(0);
    expect(body.data[0].nolg).toBeDefined();
    expect(body.data[0].nama).toBeDefined();
  });

  it('POST /api/cater/readings should record field meter reading with anomaly checking', async () => {
    const payload = {
      thbl: '202602',
      nolg: '00302600011',
      ruteKode: 'CD104',
      petugasId: 'DADANG',
      stml: 4830,
      stma: 4855, // 25 m3
      kondisiCatat: 'Normal',
      metodeCatat: 'ONSITE',
      fotoMeterUrl: 'https://storage.example.com/cater/202602/00302600011.jpg',
      durasiDetik: 45,
      longitude: 107.6186,
      latitude: -6.9175,
    };

    const res = await app.handle(
      new Request('http://localhost/api/cater/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );

    if (!isDbOnline) {
      expect([201, 500]).toContain(res.status);
      return;
    }
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.nolg).toBe('00302600011');
    expect(body.data.pakaiM3).toBe(25);
    expect(body.data.statusVerifikasi).toBe('SUBMITTED');
  });

  it('POST /api/cater/readings should flag negative consumption as ANOMALY_NEGATIVE', async () => {
    const payload = {
      thbl: '202602',
      nolg: '00302600011',
      stml: 4855,
      stma: 4800, // Negative consumption (meter reversed or misread)
      kondisiCatat: 'Normal',
    };

    const res = await app.handle(
      new Request('http://localhost/api/cater/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );

    if (!isDbOnline) {
      expect([201, 500]).toContain(res.status);
      return;
    }
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.pakaiM3).toBe(-55);
    expect(body.data.statusVerifikasi).toBe('ANOMALY_NEGATIVE');
  });

  it('GET /api/cater/anomalies should return flagged readings for supervisor inspection', async () => {
    const res = await app.handle(new Request('http://localhost/api/cater/anomalies?limit=10'));
    expect(res.status).toBe(200);

    const body = await res.json();
    if (!isDbOnline) {
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
      return;
    }
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});
