# Status: RESOLVED
Semua isu autentikasi (Google OAuth dan Login Superadmin) telah diperbaiki:
1. `authClient` di browser sekarang otomatis mengarah ke `window.location.origin` (bukan hardcoded `http://localhost:3000`).
2. Server Better Auth dan CORS Elysia sekarang secara otomatis mengenali dan mempercayai `https://surabiedev.vercel.app` serta domain deployment Vercel.
3. Ditambahkan handler OPTIONS di `/api/auth/[...all]` untuk menangani CORS preflight dengan aman.
4. Ditambahkan blok `try...catch...finally` pada tombol Google dan form login agar status pending / spinner tidak pernah macet berputar terus menerus.
