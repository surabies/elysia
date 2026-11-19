import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@cater/db';
import * as schema from '@cater/db';
import { env } from '@/lib/env';

const serverBaseUrl =
  env.BETTER_AUTH_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');

const configuredOrigins = env.CORS_ALLOWED_ORIGINS
  ? env.CORS_ALLOWED_ORIGINS.split(',').map((s) => s.trim().replace(/\/$/, ''))
  : [];

const trustedOrigins = Array.from(
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

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          try {
            await db
              .insert(schema.userRoles)
              .values({
                userId: createdUser.id,
                role: 'USER',
              })
              .onConflictDoNothing();
          } catch (err) {
            console.error('[AUTH_USER_ROLE_CREATE_ERROR]', err);
          }
        },
      },
    },
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: serverBaseUrl,
  trustedOrigins,
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
