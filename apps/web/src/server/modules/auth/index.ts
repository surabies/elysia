import { Elysia } from 'elysia';
import { authPlugin } from '@/server/plugins/auth';

export const authModule = new Elysia({ prefix: '/me' })
  .use(authPlugin)
  .get(
    '/',
    ({ user, session }) => {
      return {
        success: true,
        data: {
          user,
          session,
        },
      };
    },
    {
      requireAuth: true,
    }
  );
