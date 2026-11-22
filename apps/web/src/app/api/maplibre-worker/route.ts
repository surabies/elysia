import { readFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { createRequire } from "node:module"

export const runtime = "nodejs"

export async function GET() {
  let workerPath = ""

  // 1. Coba resolve via Node require resolution dari package web
  try {
    const req = createRequire(import.meta.url)
    const resolved = req.resolve("maplibre-gl/dist/maplibre-gl-worker.mjs")
    if (typeof resolved === "string") {
      workerPath = resolved
    }
  } catch {}

  // 2. Fallback cek jalur monorepo apps/web atau root
  if (!workerPath || typeof workerPath !== "string" || !existsSync(/*turbopackIgnore: true*/ workerPath)) {
    const kandidat = [
      join(process.cwd(), "apps", "web", "node_modules", "maplibre-gl", "dist", "maplibre-gl-worker.mjs"),
      join(process.cwd(), "node_modules", "maplibre-gl", "dist", "maplibre-gl-worker.mjs"),
    ]
    for (const k of kandidat) {
      if (typeof k === "string" && existsSync(/*turbopackIgnore: true*/ k)) {
        workerPath = k
        break
      }
    }
  }

  let worker = ""
  if (workerPath && typeof workerPath === "string") {
    try {
      worker = await readFile(/*turbopackIgnore: true*/ workerPath, "utf8")
    } catch {}
  }

  if (!worker) {
    // Fallback stub response jika worker file tidak dapat dibaca di filesystem serverless Vercel
    return new Response("// maplibre-gl worker runtime stub", {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": "text/javascript; charset=utf-8",
      },
    })
  }

  return new Response(worker, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "text/javascript; charset=utf-8",
    },
  })
}
