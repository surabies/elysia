import { Elysia } from 'elysia';

export const healthModule = new Elysia({ prefix: '/health' })
  .get('/', () => {
    return {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  });
