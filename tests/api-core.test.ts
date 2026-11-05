import { describe, expect, it } from 'bun:test';
import { app } from '@/src/server/app';

describe('Core API Endpoints', () => {
  it('GET /api should return API metadata', async () => {
    const res = await app.handle(new Request('http://localhost:3000/api'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.name).toBe('Elysia Backend API');
    expect(body.version).toBe('1.0.0');
  });

  it('GET /api/health should return healthy status', async () => {
    const res = await app.handle(
      new Request('http://localhost:3000/api/health')
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe('healthy');
    expect(body.timestamp).toBeDefined();
  });

  it('POST /api/echo should succeed with valid message', async () => {
    const res = await app.handle(
      new Request('http://localhost:3000/api/echo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Hello Elysia' }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('Hello Elysia');
  });

  it('POST /api/echo should return 422 on empty or invalid message', async () => {
    const res = await app.handle(
      new Request('http://localhost:3000/api/echo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '' }),
      })
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/echo should return 422 on missing body', async () => {
    const res = await app.handle(
      new Request('http://localhost:3000/api/echo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
  });
});
