import { describe, it, expect } from "bun:test";
import { generateMockFotoSvg } from "../packages/backend/src/services/core/mock/foto-svg-generator";
import { resolveFotoUrl } from "../apps/web/src/lib/foto-resolver";
import { hitungPeriodeSebelum } from "../apps/web/src/features/pencatat-meter/verifikasi/components/foto/FotoSebelumnya";

describe("Dynamic On-Demand SVG Mock Photo Generator & Fallback Resolver", () => {
  it("1. Generates valid SVG content for stand meter with correct customer data", () => {
    const svg = generateMockFotoSvg({
      nolg: "01020005",
      jenis: "stand",
      stand: 245,
      periode: "202601",
      rute: "KC304",
      petugas: "OMAY",
      nama: "AHMAD KURNIA",
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain('viewBox="0 0 600 800"');
    expect(svg).toContain('href="/logo.png"');
    expect(svg).toContain("</svg>");
    expect(svg).toContain("NOLG: 01020005");
    expect(svg).toContain("TIRTAWENING");
    expect(svg).toContain("FOTO STAND");
    expect(svg).toContain("ON-DEMAND SVG");
    expect(svg).toContain(">2</text>"); // Stand digits
    expect(svg).toContain(">4</text>");
    expect(svg).toContain(">5</text>");
  });

  it("2. Generates valid SVG content for segel meter with official badge", () => {
    const svg = generateMockFotoSvg({
      nolg: "01020008",
      jenis: "segel",
      periode: "202601",
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("SEGEL RESMI");
    expect(svg).toContain("PERUMDA TIRTAWENING");
    expect(svg).toContain("FOTO SEGEL");
    expect(svg).toContain("KONDISI SEGEL AMAN");
  });

  it("3. Generates valid SVG content for rumah pelanggan with house number stamp", () => {
    const svg = generateMockFotoSvg({
      nolg: "01020145",
      jenis: "rumah",
      periode: "202601",
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("FOTO RUMAH");
    expect(svg).toContain("LOKASI RUMAH &amp; POSISI METER TERPASANG");
    expect(svg).toContain("NO. 145"); // Last 3 digits of NOLG
  });

  it("4. resolveFotoUrl prioritizes real Cloudinary/uploaded photo URLs when available", () => {
    const realUrl = "https://res.cloudinary.com/tirtawening/image/upload/v1/202601_stand_01020001.jpg";
    const resolved = resolveFotoUrl({
      realUrl,
      nolg: "01020001",
      jenis: "stand",
      stand: 120,
    });

    expect(resolved).toBe(realUrl);
  });

  it("5. resolveFotoUrl cleanly falls back to dynamic SVG endpoint when realUrl is null or empty", () => {
    const resolvedNull = resolveFotoUrl({
      realUrl: null,
      nolg: "01020001",
      jenis: "stand",
      stand: 150,
      rute: "KC304",
    });

    expect(resolvedNull).toContain("/api/mock/foto?");
    expect(resolvedNull).toContain("nolg=01020001");
    expect(resolvedNull).toContain("jenis=stand");
    expect(resolvedNull).toContain("stand=150");
    expect(resolvedNull).toContain("rute=KC304");

    const resolvedSegel = resolveFotoUrl({
      realUrl: "",
      nolg: "01020002",
      jenis: "segel",
    });
    expect(resolvedSegel).toContain("jenis=segel");
    expect(resolvedSegel).toContain("nolg=01020002");
  });

  it("6. hitungPeriodeSebelum correctly calculates previous period crossing year boundaries", () => {
    expect(hitungPeriodeSebelum(202601)).toBe(202512);
    expect(hitungPeriodeSebelum("202601")).toBe(202512);
    expect(hitungPeriodeSebelum(202606)).toBe(202605);
    expect(hitungPeriodeSebelum(202612)).toBe(202611);
  });

  it("7. Foto pembanding correctly resolves standAwal as previous month's stand meter and generates segel/rumah", () => {
    const nolg = "01020033";
    const periodeBerjalan = 202601;
    const standAwal = 210; // Stand meter awal bulan berjalan = stand akhir bulan lalu
    const periodeSebelum = hitungPeriodeSebelum(periodeBerjalan);

    // 1. Stand meter pembanding dengan stand = standAwal
    const fotoStandPembanding = resolveFotoUrl({
      realUrl: null,
      nolg,
      jenis: "stand",
      stand: standAwal,
      periode: String(periodeSebelum),
    });
    expect(fotoStandPembanding).toContain(`nolg=${nolg}`);
    expect(fotoStandPembanding).toContain("jenis=stand");
    expect(fotoStandPembanding).toContain(`stand=${standAwal}`);
    expect(fotoStandPembanding).toContain(`periode=${periodeSebelum}`);

    // Generate SVG to check digit matching
    const svgStand = generateMockFotoSvg({
      nolg,
      jenis: "stand",
      stand: standAwal,
      periode: String(periodeSebelum),
    });
    expect(svgStand).toContain("NOLG: 01020033");
    expect(svgStand).toContain("STAND: 210 m³");
    expect(svgStand).toContain(">2</text>");
    expect(svgStand).toContain(">1</text>");
    expect(svgStand).toContain(">0</text>");

    // 2. Segel pembanding
    const fotoSegelPembanding = resolveFotoUrl({
      realUrl: null,
      nolg,
      jenis: "segel",
      stand: standAwal,
      periode: String(periodeSebelum),
    });
    expect(fotoSegelPembanding).toContain("jenis=segel");
    expect(fotoSegelPembanding).toContain(`periode=${periodeSebelum}`);

    // 3. Rumah pembanding
    const fotoRumahPembanding = resolveFotoUrl({
      realUrl: null,
      nolg,
      jenis: "rumah",
      stand: standAwal,
      periode: String(periodeSebelum),
    });
    expect(fotoRumahPembanding).toContain("jenis=rumah");
    expect(fotoRumahPembanding).toContain(`periode=${periodeSebelum}`);
  });
});
