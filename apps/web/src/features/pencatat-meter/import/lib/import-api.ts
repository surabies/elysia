// features/dashboard/import/lib/import-api.ts
import type {
  ImportApiBase,
  ImportSampleResponse,
} from "../types/import.types";

interface PostImportOptions {
  signal?: AbortSignal;
  fallbackError: string;
}

/** POST JSON ke endpoint import; melempar Error bila respons gagal. */
export async function postImport<TResponse extends ImportApiBase>(
  url: string,
  body: unknown,
  { signal, fallbackError }: PostImportOptions,
): Promise<TResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const json = (await res.json()) as TResponse;
  if (!res.ok || !json.success) {
    throw new Error(json.error || fallbackError);
  }
  return json;
}

/** GET berkas contoh dari server. Tidak melempar bila `success` false. */
export async function fetchImportSample<TRow>(
  url: string,
): Promise<ImportSampleResponse<TRow>> {
  const res = await fetch(url);
  return (await res.json()) as ImportSampleResponse<TRow>;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
