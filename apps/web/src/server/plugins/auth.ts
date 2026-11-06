import { Elysia } from 'elysia';
import { auth, type User, type Session } from '@/src/lib/auth';

export const authPlugin = new Elysia({ name: 'auth-plugin' })
  .derive({ as: 'scoped' }, async ({ request }) => {
    try {
      const sessionData = await auth.api.getSession({
        headers: request.headers,
      });

      return {
        session: (sessionData?.session as Session) ?? null,
        user: (sessionData?.user as User) ?? null,
      };
    } catch (err) {
      console.error('[AUTH_DERIVE_ERROR]', err);
      return {
        session: null,
        user: null,
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
  });
