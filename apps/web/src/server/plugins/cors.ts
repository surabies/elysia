import { cors } from '@elysiajs/cors';
import { env } from '@/lib/env';

function resolveServerBaseUrl(): string {
  const rawBetterAuthUrl = process.env.BETTER_AUTH_URL;
  if (rawBetterAuthUrl && !rawBetterAuthUrl.includes('localhost')) {
    return rawBetterAuthUrl.replace(/\/$/, '');
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const rawPublicUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (rawPublicUrl && !rawPublicUrl.includes('localhost')) {
    return rawPublicUrl.replace(/\/$/, '');
  }

  if (process.env.NODE_ENV === 'production') {
    return 'https://surabiedev.vercel.app';
  }

  return rawBetterAuthUrl ? rawBetterAuthUrl.replace(/\/$/, '') : 'http://localhost:3000';
}

const serverBaseUrl = resolveServerBaseUrl();

const configuredOrigins = env.CORS_ALLOWED_ORIGINS
  ? env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim().replace(/\/$/, ''))
  : [];

export const allowedOrigins = Array.from(
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
