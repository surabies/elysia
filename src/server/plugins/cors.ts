import { cors } from '@elysiajs/cors';
import { env } from '@/src/lib/env';

const allowedOrigins = env.CORS_ALLOWED_ORIGINS
  ? env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [env.BETTER_AUTH_URL];

export const corsPlugin = cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
});
