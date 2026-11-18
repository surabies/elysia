// apps/web/src/app/api/mock/foto/route.ts
// Route Handler Endpoint untuk Generator Mock Foto SVG Dinamis On-Demand
// Menghasilkan foto SVG berkualitas tinggi tanpa memakan disk komputer atau kuota Cloudinary.

import { NextRequest, NextResponse } from "next/server";
import { generateMockFotoSvg } from "@/server/services/mock/foto-svg-generator";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const nolg = searchParams.get("nolg") || "01020001";
  const jenis = searchParams.get("jenis") || "stand";
  const stand = searchParams.get("stand") || undefined;
  const periode = searchParams.get("periode") || "202601";
  const rute = searchParams.get("rute") || undefined;
  const petugas = searchParams.get("petugas") || undefined;
  const nama = searchParams.get("nama") || undefined;

  const svg = generateMockFotoSvg({
    nolg,
    jenis,
    stand,
    periode,
    rute,
    petugas,
    nama,
  });

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
