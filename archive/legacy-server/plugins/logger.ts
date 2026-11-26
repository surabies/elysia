import type { Elysia } from 'elysia';

// ANSI styling for clean terminal logging
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;

function formatStatus(status: number): string {
  if (status < 300) return green(String(status));
  if (status < 400) return cyan(String(status));
  if (status < 500) return yellow(String(status));
  return red(String(status));
}

/**
 * HTTP Logger Plugin: Menampilkan request dan response ringkas dan jelas
 * Menggunakan format panah:
 *   --> METHOD /path (request masuk / mengambil data)
 *   <-- STATUS METHOD /path DURATIONms (response keluar)
 */
export const loggerPlugin = (app: Elysia) =>
  app
    .onRequest(({ request }) => {
      if (process.env.NODE_ENV === 'test') return;
      (request as any)._reqStartTime = performance.now();
      try {
        const url = new URL(request.url);
        console.log(`  ${dim('-->')} ${bold(request.method)} ${cyan(url.pathname)}${url.search ? dim(url.search) : ''}`);
      } catch {
        console.log(`  --> ${request.method} ${request.url}`);
      }
    })
    .mapResponse(({ request, set }) => {
      if (process.env.NODE_ENV === 'test') return;
      const startTime = (request as any)._reqStartTime || performance.now();
      const duration = Math.round(performance.now() - startTime);
      const status = Number(set.status || 200);
      try {
        const url = new URL(request.url);
        console.log(
          `  ${dim('<--')} ${formatStatus(status)} ${bold(request.method)} ${cyan(url.pathname)} ${dim(`${duration}ms`)}`
        );
      } catch {
        console.log(`  <-- ${status} ${request.method} ${request.url} ${duration}ms`);
      }
    });
