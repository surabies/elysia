import { createAuthClient } from 'better-auth/react';

// Di browser (client-side), prioritaskan window.location.origin agar selalu
// menembak domain tempat aplikasi diakses (misal https://surabiedev.vercel.app),
// bukan http://localhost:3000. Fallback env hanya digunakan saat SSR.
const authBaseUrl =
  typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.BETTER_AUTH_URL ||
       process.env.NEXT_PUBLIC_APP_URL ||
       (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'));

export const authClient = createAuthClient({
  baseURL: authBaseUrl,
});

export const { signIn, signUp, signOut, useSession } = authClient;

