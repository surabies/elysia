import { treaty } from "@elysiajs/eden";
import type { App } from "../../../apps/web/src/server/app";

export interface ApiClientOptions {
  headers?: Record<string, string> | (() => Record<string, string> | Promise<Record<string, string>>);
}

/**
 * Membuat client Eden Treaty yang type-safe langsung ke backend Elysia.
 */
export function createApiClient(baseUrl: string, options?: ApiClientOptions) {
  return treaty<App>(baseUrl, {
    headers: options?.headers,
  });
}

export type { App };
export type CaterApiClient = ReturnType<typeof createApiClient>;
