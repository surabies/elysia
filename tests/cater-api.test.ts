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

  it('GET /api/cater/routes/:kode/pelanggan should reject unauthenticated customer data access', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/cater/routes/CD104/pelanggan?limit=5')
    );
    expect(res.status).toBe(401);
  });

  it('POST /api/cater/readings should reject unauthenticated submissions', async () => {
    const payload = {
      thbl: '202601',
      nolg: 'test-customer',
      stml: 10,
      stma: 15,
      kondisiCatat: 'Normal',
    };

    const res = await app.handle(
      new Request('http://localhost/api/cater/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );

    expect(res.status).toBe(401);
  });

  it('POST /api/cater/readings/simulate should reject unauthenticated writes', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/cater/readings/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thbl: '202611',
          nolg: 'test-customer',
          stml: 100,
          stma: 120,
          pakaiLalu: 18,
        }),
      })
    );

    expect(res.status).toBe(401);
  });

  it('GET /api/cater/anomalies should reject unauthenticated access', async () => {
    const res = await app.handle(new Request('http://localhost/api/cater/anomalies?limit=10'));
    expect(res.status).toBe(401);
  });

  it('GET /api/cater/history/:caterId should reject unauthenticated audit access', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/cater/history/cater-202601-test-customer')
    );
    expect(res.status).toBe(401);
  });
});
