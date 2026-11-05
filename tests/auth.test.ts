import { describe, expect, it } from 'bun:test';
import { app } from '@/src/server/app';

describe('Auth & Session Protection', () => {
  it('GET /api/me should return 401 when unauthenticated', async () => {
    const res = await app.handle(new Request('http://localhost:3000/api/me'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/places should return 401 when unauthenticated', async () => {
    const res = await app.handle(
      new Request('http://localhost:3000/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Forbidden Place',
          longitude: 106.8,
          latitude: -6.2,
        }),
      })
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('DELETE /api/places/:id should return 401 when unauthenticated', async () => {
    const res = await app.handle(
      new Request('http://localhost:3000/api/places/test-id-123', {
        method: 'DELETE',
      })
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});
