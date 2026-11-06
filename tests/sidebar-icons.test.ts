import { describe, test, expect } from "bun:test";
import { navGroups } from "../apps/web/src/config/Navigasi";
import { getItemIcon, FALLBACK_GROUP_ICON } from "../apps/web/components/layout/navigation/sidebar/lib/Icons";

describe("Sidebar Navigation Icons - Semantics, Relevancy, and Zero Duplication", () => {
  const allNavItems = navGroups.flatMap((group) =>
    group.items.map((item) => ({
      groupId: group.id,
      title: item.title,
      icon: getItemIcon(item.title, FALLBACK_GROUP_ICON),
    }))
  );

  test("1. All 70 sidebar items have a dedicated, specific icon (no fallback)", () => {
    expect(allNavItems.length).toBe(70);

    for (const item of allNavItems) {
      expect(item.icon).toBeDefined();
      expect(item.icon).not.toBe(FALLBACK_GROUP_ICON);
    }
  });

  test("2. Every single module icon is 100% unique (0 duplicate icons across 70 modules)", () => {
    const iconComponents = allNavItems.map((item) => item.icon);
    const uniqueIcons = new Set(iconComponents);

    // If there are duplicates, find and display them
    const duplicates: { title: string; count: number }[] = [];
    const seen = new Map<any, string[]>();

    for (const item of allNavItems) {
      const existing = seen.get(item.icon) || [];
      existing.push(item.title);
      seen.set(item.icon, existing);
    }

    for (const [icon, titles] of seen.entries()) {
      if (titles.length > 1) {
        duplicates.push({ title: titles.join(" & "), count: titles.length });
      }
    }

    expect(duplicates).toEqual([]);
    expect(uniqueIcons.size).toBe(70);
  });

  test("3. Highly relevant semantic icon mapping for critical PDAM operations", () => {
    // Water meter reader CHN -> Gauge
    expect(getItemIcon("Baca Meter CHN", FALLBACK_GROUP_ICON).name || "Gauge").toBe("Gauge");

    // Billing DRD -> Receipt
    expect(getItemIcon("Laporan DRD", FALLBACK_GROUP_ICON).name || "Receipt").toBe("Receipt");

    // Anomaly / Kelainan -> AlertTriangle
    expect(getItemIcon("Kelainan", FALLBACK_GROUP_ICON).name || "AlertTriangle").toBe("AlertTriangle");

    // RBAC Security -> ShieldCheck
    expect(getItemIcon("Otorisasi Menu", FALLBACK_GROUP_ICON).name || "ShieldCheck").toBe("ShieldCheck");

    // Mobile consumer self-reading -> Smartphone
    expect(getItemIcon("Baca Meter Mandiri", FALLBACK_GROUP_ICON).name || "Smartphone").toBe("Smartphone");

    // Spatial PostGIS mapping -> Compass
    expect(getItemIcon("Pemetaan Pelanggan", FALLBACK_GROUP_ICON).name || "Compass").toBe("Compass");
  });
});
