import { describe, expect, it } from "bun:test";
import {
  buildAnalyticsMetricCards,
  buildKpis,
} from "../apps/web/src/features/dashboard/analytics/lib/kpi";
import type { AnalyticsPageData } from "../apps/web/src/features/dashboard/analytics/types";

describe("Analytics Metric Cards (Vercel Geist Pattern)", () => {
  const mockData: AnalyticsPageData = {
    periode: {
      thbl: "202610",
      label: "Oktober 2026",
      bulan: "10",
      tahun: "2026",
    },
    totalPelanggan: 22549,
    totalBaca: 20100,
    totalKubikasi: 348120,
    rataRataHarian: 1340,
    puncakHarian: {
      hari: "08",
      total: 2410,
    },
    dailyTrends: [
      {
        tanggal: "2026-10-01",
        hari: "01",
        label: "01 Okt",
        total: 1200,
        normal: 1100,
        anomali: 100,
        kubikasi: 22000,
        kumulatifAktual: 1200,
        kumulatifTarget: 1500,
      },
      {
        tanggal: "2026-10-02",
        hari: "02",
        label: "02 Okt",
        total: 1400,
        normal: 1300,
        anomali: 100,
        kubikasi: 24000,
        kumulatifAktual: 2600,
        kumulatifTarget: 3000,
      },
      {
        tanggal: "2026-10-03",
        hari: "03",
        label: "03 Okt",
        total: 1800,
        normal: 1650,
        anomali: 150,
        kubikasi: 28000,
        kumulatifAktual: 4400,
        kumulatifTarget: 4500,
      },
    ],
    consumptionBuckets: [],
    officers: [],
    regionalTrends: [],
    serviceAreaRisks: [],
    anomalies: [
      { kode: "02", keterangan: "Meter Rusak", jumlah: 200, persentase: 57.1 },
      { kode: "03", keterangan: "Rumah Kosong", jumlah: 150, persentase: 42.9 },
    ],
  };

  it("menghasilkan tepat 4 kartu metrik dengan visual variant yang benar", () => {
    const cards = buildAnalyticsMetricCards(mockData);
    expect(cards).toHaveLength(4);

    const [card1, card2, card3, card4] = cards;

    // Kartu 1: Keterbacaan Meter (Varian Segments)
    expect(card1.id).toBe("keterbacaan-meter");
    expect(card1.title).toBe("Keterbacaan Meter");
    expect(card1.visual.type).toBe("segments");
    if (card1.visual.type === "segments") {
      expect(card1.visual.items).toHaveLength(3);
      expect(card1.visual.items.map((i) => i.id)).toEqual(["normal", "anomali", "sisa"]);
    }
    expect(card1.footer.href).toBe("#tren-harian");

    // Kartu 2: Kubikasi Air Terdistribusi (Varian Sparkline)
    expect(card2.id).toBe("volume-kubikasi");
    expect(card2.title).toBe("Kubikasi Air Terdistribusi");
    expect(card2.visual.type).toBe("sparkline");
    if (card2.visual.type === "sparkline") {
      expect(card2.visual.data).toEqual([22000, 24000, 28000]);
    }
    expect(card2.footer.href).toBe("#kelompok-konsumsi");

    // Kartu 3: Ritme Laju Harian (Varian Pills)
    expect(card3.id).toBe("laju-harian");
    expect(card3.title).toBe("Ritme Laju Harian");
    expect(card3.visual.type).toBe("pills");
    if (card3.visual.type === "pills") {
      expect(card3.visual.values).toEqual([1200, 1400, 1800]);
      expect(card3.visual.tone).toBe("neutral");
    }
    expect(card3.footer.href).toBe("#produktivitas-petugas");

    // Kartu 4: Temuan & Anomali Lapangan (Varian Pills dengan tone problem)
    expect(card4.id).toBe("anomali-lapangan");
    expect(card4.title).toBe("Temuan & Anomali Lapangan");
    expect(card4.visual.type).toBe("pills");
    if (card4.visual.type === "pills") {
      expect(card4.visual.values).toEqual([100, 100, 150]);
      expect(card4.visual.tone).toBe("problem");
    }
    expect(card4.footer.href).toBe("#status-pembacaan");
  });

  it("kompatibilitas mundur: buildKpis mengembalikan hasil yang identik", () => {
    const fromBuildKpis = buildKpis(mockData);
    const fromCards = buildAnalyticsMetricCards(mockData);
    expect(fromBuildKpis).toEqual(fromCards);
  });

  it("menangani data kosong tanpa runtime crash atau NaN", () => {
    const emptyData: AnalyticsPageData = {
      periode: {
        thbl: "202611",
        label: "November 2026",
        bulan: "11",
        tahun: "2026",
      },
      totalPelanggan: 0,
      totalBaca: 0,
      totalKubikasi: 0,
      rataRataHarian: 0,
      puncakHarian: { hari: "0", total: 0 },
      dailyTrends: [],
      consumptionBuckets: [],
      officers: [],
      regionalTrends: [],
      serviceAreaRisks: [],
      anomalies: [],
    };

    const cards = buildAnalyticsMetricCards(emptyData);
    expect(cards).toHaveLength(4);
    for (const card of cards) {
      expect(card.value).not.toBe("NaN");
      expect(card.helperText).toBeDefined();
      expect(card.visual).toBeDefined();
    }
  });
});
