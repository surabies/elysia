import { describe, expect, it } from "bun:test";
import {
  hitungDiAtasBatasWajar,
  hitungMedian,
  hitungP95,
  hitungRingkasan,
  hitungTingkatTerbaca,
  tentukanStatusPemakaian,
} from "../apps/web/src/features/dashboard/info-pelanggan/lib/perhitungan-pemakaian";
import { contoh18PeriodePemakaian } from "../apps/web/src/features/dashboard/info-pelanggan/lib/data-contoh-pemakaian";

describe("Grafik Pemakaian Air (Kalkulasi & Spesifikasi)", () => {
  it("memiliki tepat 18 periode riwayat pembacaan", () => {
    expect(contoh18PeriodePemakaian).toHaveLength(18);
  });

  it("menghitung tingkat keterbacaan tepat 94.4% (17 terbaca dari 18)", () => {
    const tingkat = hitungTingkatTerbaca(contoh18PeriodePemakaian);
    expect(tingkat.toFixed(1)).toBe("94.4");
  });

  it("menghitung median pemakaian tepat 20 m³", () => {
    const terbacaValues = contoh18PeriodePemakaian
      .map((p) => p.totalM3)
      .filter((v): v is number => v !== null);

    const median = hitungMedian(terbacaValues);
    expect(median).toBe(20);
  });

  it("menghitung persentil ke-95 (p95) tepat 39 m³", () => {
    const terbacaValues = contoh18PeriodePemakaian
      .map((p) => p.totalM3)
      .filter((v): v is number => v !== null);

    const p95 = hitungP95(terbacaValues);
    expect(p95).toBe(39);
  });

  it("menghitung persentase di atas batas wajar (30 m³) tepat 11.8%", () => {
    const diAtasBatas = hitungDiAtasBatasWajar(contoh18PeriodePemakaian, 30);
    expect(diAtasBatas.toFixed(1)).toBe("11.8");
  });

  it("memastikan aturan penentuan status konsumsi akurat", () => {
    expect(tentukanStatusPemakaian(null)).toBe("Tidak Terbaca");
    expect(tentukanStatusPemakaian(18, 30, 20)).toBe("Normal");
    expect(tentukanStatusPemakaian(30, 30, 20)).toBe("Normal");
    expect(tentukanStatusPemakaian(39, 30, 20)).toBe("Melewati Batas");
    expect(tentukanStatusPemakaian(52, 30, 20)).toBe("Anomali"); // > 2x median (40)
    expect(tentukanStatusPemakaian(0, 30, 20)).toBe("Anomali");
  });

  it("menghasilkan 4 sel ringkasan lengkap dengan selisih yang sesuai", () => {
    const ringkasan = hitungRingkasan(contoh18PeriodePemakaian, 30);

    expect(ringkasan.tingkatTerbaca.nilai).toBe("94.4%");
    expect(ringkasan.tingkatTerbaca.selisih.teks).toContain("-5.6 pts");
    expect(ringkasan.tingkatTerbaca.selisih.tone).toBe("negative");

    expect(ringkasan.medianPemakaian.nilai).toBe("20 m³");
    expect(ringkasan.medianPemakaian.selisih.teks).toContain("0 m³");
    expect(ringkasan.medianPemakaian.selisih.tone).toBe("neutral");

    expect(ringkasan.pemakaianTinggiP95.nilai).toBe("39 m³");
    expect(ringkasan.pemakaianTinggiP95.selisih.teks).toContain("+12 m³");
    expect(ringkasan.pemakaianTinggiP95.selisih.tone).toBe("negative");

    expect(ringkasan.diAtasBatasWajar.nilai).toBe("11.8%");
    expect(ringkasan.diAtasBatasWajar.selisih.teks).toContain("+11.8 pts");
    expect(ringkasan.diAtasBatasWajar.selisih.tone).toBe("negative");
  });
});
