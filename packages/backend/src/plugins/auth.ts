import { Elysia } from 'elysia';
import { auth, type User, type Session } from "@cater/backend/lib/auth";
import { db, userRoles, type AppRole } from '@cater/db';
import { eq } from 'drizzle-orm';

export const authPlugin = new Elysia({ name: 'auth-plugin' })
  .derive({ as: 'scoped' }, async ({ request }) => {
    try {
      if (process.env.NODE_ENV === 'test' && request.headers.get('x-test-role')) {
        const testRole = request.headers.get('x-test-role') as AppRole;
        const testUserId = request.headers.get('x-test-user-id') || 'test-admin';
        return {
          session: { id: 'test-session', userId: testUserId } as any,
          user: { id: testUserId, name: 'Test User', email: 'test@example.com' } as any,
          userRoles: [testRole],
        };
      }

      const sessionData = await auth.api.getSession({
        headers: request.headers,
      });

      const user = (sessionData?.user as User) ?? null;
      let roles: AppRole[] = [];

      if (user?.id) {
        const userRolesList = await db
          .select({ role: userRoles.role })
          .from(userRoles)
          .where(eq(userRoles.userId, user.id));
        roles = userRolesList.map((r) => r.role);
      }

      return {
        session: (sessionData?.session as Session) ?? null,
        user,
        userRoles: roles,
      };
    } catch (err) {
      console.error('[AUTH_DERIVE_ERROR]', err);
      return {
        session: null,
        user: null,
        userRoles: [] as AppRole[],
      };
    }
  })
  .macro({
    requireAuth(enabled: boolean) {
      if (!enabled) return {};
      return {
        beforeHandle({ user, session, set }) {
          if (!user || !session) {
            set.status = 401;
            return {
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required to access this resource',
              },
            };
          }
          if ((user as { wajibGantiPassword?: boolean }).wajibGantiPassword) {
            set.status = 403;
            return {
              success: false,
              error: {
                code: 'PASSWORD_CHANGE_REQUIRED',
                message: 'Anda wajib mengganti password awal sebelum menggunakan sistem.',
              },
            };
          }
        },
      };
    },
    requireRole(allowedRoles: AppRole[]) {
      return {
        beforeHandle({ user, session, userRoles: currentRoles, set }) {
          if (!user || !session) {
            set.status = 401;
            return {
              success: false,
              error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required to access this resource',
              },
            };
          }

          if ((user as { wajibGantiPassword?: boolean }).wajibGantiPassword) {
            set.status = 403;
            return {
              success: false,
              error: {
                code: 'PASSWORD_CHANGE_REQUIRED',
                message: 'Anda wajib mengganti password awal sebelum menggunakan sistem.',
              },
            };
          }

          const roles = currentRoles ?? [];
          const isSuperAdmin = roles.includes('SUPERADMIN');
          const hasAccess = isSuperAdmin || allowedRoles.some((r) => roles.includes(r));

          if (!hasAccess) {
            set.status = 403;
            return {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: `Forbidden: requires one of role [${allowedRoles.join(', ')}]`,
              },
            };
          }
        },
      };
    },
  });
