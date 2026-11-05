import { describe, expect, it } from 'bun:test';
import { app } from '@/src/server/app';

describe('Geo & Spatial Validation', () => {
  it('GET /api/places/nearby should fail if longitude is out of range (> 180)', async () => {
    const res = await app.handle(
      new Request('http://localhost:3000/api/places/nearby?lon=195&lat=10')
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/places/nearby should fail if latitude is out of range (> 90)', async () => {
    const res = await app.handle(
      new Request('http://localhost:3000/api/places/nearby?lon=100&lat=95')
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/places/nearby should validate positive radius', async () => {
    const res = await app.handle(
      new Request('http://localhost:3000/api/places/nearby?lon=106.8&lat=-6.2&radius=-50')
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('Haversine distance calculation matches spherical geodesics', () => {
    // Great circle calculation test between Monas and Istiqlal
    const monas = { lon: 106.827153, lat: -6.175392 };
    const istiqlal = { lon: 106.831389, lat: -6.170278 };

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371e3; // Earth radius in meters
    const dLat = toRad(istiqlal.lat - monas.lat);
    const dLon = toRad(istiqlal.lon - monas.lon);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(monas.lat)) *
        Math.cos(toRad(istiqlal.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Approximate straight-line distance between Monas and Istiqlal is ~730m
    expect(distance).toBeGreaterThan(600);
    expect(distance).toBeLessThan(900);
  });
});
