import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .default('postgresql://postgres:postgres@localhost:5432/elysia_db'),
  BETTER_AUTH_SECRET: z
    .string()
    .min(16, 'BETTER_AUTH_SECRET must be at least 16 characters')
    .default('development-secret-key-must-be-at-least-32-chars-long'),
  BETTER_AUTH_URL: z
    .string()
    .url()
    .default('http://localhost:3000'),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .default('http://localhost:3000'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NODE_ENV: process.env.NODE_ENV,
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
});
