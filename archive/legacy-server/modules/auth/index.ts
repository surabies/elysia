import { Elysia } from 'elysia';
import { authPlugin } from '@/server/plugins/auth';
import { isInternalUser } from '@/lib/auth/access-control';

export const authModule = new Elysia({ prefix: '/me' })
  .use(authPlugin)
  .get(
    '/',
    ({ user, session, userRoles }) => {
      const roles = userRoles && userRoles.length > 0 ? userRoles : (['USER'] as const);
      return {
        success: true,
        data: {
          user: user
            ? {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image ?? null,
                nolg: (user as { nolg?: string | null }).nolg ?? null,
                role: roles[0] ?? 'USER',
                roles,
                isInternal: isInternalUser(roles),
              }
            : null,
          session,
        },
      };
    },
    {
      requireAuth: true,
    }
  );
