import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { db } from '@cater/db';
import * as schema from '@cater/db';
import { eq } from 'drizzle-orm';
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
  ? env.CORS_ALLOWED_ORIGINS.split(',').map((s) => s.trim().replace(/\/$/, ''))
  : [];

const isProduction = process.env.NODE_ENV === 'production';

const trustedOrigins = Array.from(
  new Set(
    [
      ...(!isProduction ? ['http://localhost:3000', 'http://localhost:3001'] : []),
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
      userRelations: schema.userRelations,
      sessionRelations: schema.sessionRelations,
      accountRelations: schema.accountRelations,
    },
    usePlural: false,
  }),
  user: {
    additionalFields: {
      nolg: {
        type: 'string',
        required: false,
        input: true,
      },
      wajibGantiPassword: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 100,
  },
  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            // Kunci pendaftaran liar lewat Google OAuth: hanya akun staf/pengguna
            // yang sudah terdaftar yang dapat masuk dengan Google.
            disableSignUp: true,
          },
        }
      : {}),
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
    customRules: {
      '/sign-in/email': { window: 60, max: 10 },
      '/sign-up/email': { window: 300, max: 5 },
      '/request-password-reset': { window: 300, max: 5 },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (incomingUser, ctx) => {
          // Setiap pendaftaran publik via HTTP wajib menyertakan Nomor Pelanggan (nolg)
          // yang valid & terdaftar di tabel master `pelanggan`.
          if (ctx) {
            const rawNolg =
              typeof (incomingUser as Record<string, unknown>).nolg === 'string'
                ? ((incomingUser as Record<string, unknown>).nolg as string).trim()
                : '';

            if (!rawNolg) {
              throw new APIError('BAD_REQUEST', {
                message: 'Pendaftaran ditolak: Nomor Pelanggan wajib diisi.',
              });
            }

            if (rawNolg.length > 20 || !/^[A-Za-z0-9._-]+$/.test(rawNolg)) {
              throw new APIError('BAD_REQUEST', {
                message: 'Pendaftaran ditolak: Format Nomor Pelanggan tidak valid.',
              });
            }

            const [foundPelanggan] = await db
              .select({ nolg: schema.pelanggan.nolg })
              .from(schema.pelanggan)
              .where(eq(schema.pelanggan.nolg, rawNolg))
              .limit(1);

            if (!foundPelanggan) {
              throw new APIError('BAD_REQUEST', {
                message:
                  'Pendaftaran ditolak: Nomor Pelanggan tidak terdaftar di database.',
              });
            }

            const [existingAccount] = await db
              .select({ id: schema.user.id })
              .from(schema.user)
              .where(eq(schema.user.nolg, rawNolg))
              .limit(1);

            if (existingAccount) {
              throw new APIError('BAD_REQUEST', {
                message:
                  'Pendaftaran ditolak: Nomor Pelanggan ini sudah terdaftar pada akun lain.',
              });
            }

            return {
              data: {
                ...incomingUser,
                nolg: foundPelanggan.nolg,
              },
            };
          }

          return { data: incomingUser };
        },
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
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
