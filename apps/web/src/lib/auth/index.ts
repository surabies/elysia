import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth as betterAuthInstance } from '../auth';
import { db, userRoles, type AppRole } from '@cater/db';
import { eq } from 'drizzle-orm';

/**
 * Server-side Auth Session Resolver
 * Kompatibel dengan Next.js App Router (Server Components & Server Actions)
 * Menjembatani Better Auth & Drizzle userRoles ke UI/UX Layout & Navigation.
 */
export async function auth() {
  try {
    const headerList = await headers();
    const sessionData = await betterAuthInstance.api.getSession({
      headers: headerList,
    });

    if (!sessionData?.user) return null;

    let roles: AppRole[] = [];
    if (sessionData.user.id) {
      const userRolesList = await db
        .select({ role: userRoles.role })
        .from(userRoles)
        .where(eq(userRoles.userId, sessionData.user.id));
      roles = userRolesList.map((r) => r.role);
    }

    return {
      user: {
        id: sessionData.user.id,
        name: sessionData.user.name ?? 'Petugas PDAM',
        email: sessionData.user.email ?? '',
        image: sessionData.user.image ?? null,
        role: roles[0] ?? 'VERIFIKATOR_1',
        roles,
      },
      session: sessionData.session,
    };
  } catch (err) {
    console.error('[AUTH_RESOLVER_ERROR]', err);
    return null;
  }
}

/**
 * Server-side SignOut Action
 */
export async function signOut(opts?: { redirectTo?: string }) {
  try {
    const headerList = await headers();
    await betterAuthInstance.api.signOut({
      headers: headerList,
    });
  } catch (err) {
    console.error('[SIGN_OUT_ERROR]', err);
  }

  if (opts?.redirectTo) {
    redirect(opts.redirectTo);
  }
}
