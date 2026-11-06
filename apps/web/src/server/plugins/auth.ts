import { Elysia } from 'elysia';
import { auth, type User, type Session } from '@/src/lib/auth';
import { db, userRoles, type AppRole } from '@cater/db';
import { eq } from 'drizzle-orm';

export const authPlugin = new Elysia({ name: 'auth-plugin' })
  .derive({ as: 'scoped' }, async ({ request }) => {
    try {
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
