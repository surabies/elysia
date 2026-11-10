import { describe, it, expect } from "bun:test";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

describe("MapLibre Web Worker Asset", () => {
  it("file worker harus tersedia di public directory dengan ukuran valid", () => {
    const workerPathJs = join(process.cwd(), "apps", "web", "public", "maplibre-gl-worker.js");
    const workerPathMjs = join(process.cwd(), "apps", "web", "public", "maplibre-gl-worker.mjs");

    expect(existsSync(workerPathJs)).toBe(true);
    expect(existsSync(workerPathMjs)).toBe(true);

    const stat = statSync(workerPathJs);
    expect(stat.size).toBeGreaterThan(100000); // ~519 KB
  });
});
