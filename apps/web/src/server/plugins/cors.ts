import { cors } from '@elysiajs/cors';
import { env } from '@/lib/env';

const serverBaseUrl =
  env.BETTER_AUTH_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');

const configuredOrigins = env.CORS_ALLOWED_ORIGINS
  ? env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim().replace(/\/$/, ''))
  : [];

const allowedOrigins = Array.from(
  new Set(
    [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://surabiedev.vercel.app',
      serverBaseUrl.replace(/\/$/, ''),
      ...(env.NEXT_PUBLIC_APP_URL ? [env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')] : []),
      ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
      ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
      ...configuredOrigins,
    ].filter(Boolean)
  )
);

export const corsPlugin = cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
});
