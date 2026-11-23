import type { Metadata } from "next";
import { cookies } from "next/headers";
import { dashboardService } from "@/server/services/dashboard/dashboard.service";
import {
  PapanPengaduan,
  DEFAULT_PENGADUAN_PANEL_WIDTH,
  MIN_PENGADUAN_PANEL_WIDTH,
  MAX_PENGADUAN_PANEL_WIDTH,
} from "@/features/dashboard/pengaduan/components/papan-pengaduan/index";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Daftar Pengaduan Air — PDAM Tirtawening",
  description:
    "Manajemen antrean penanganan tiket pengaduan, verifikasi SLA, dan eskalasi teknisi lapangan.",
};

export default async function PengaduanDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; periode?: string | string[] }>;
}) {
  const [{ q, periode: rawPeriode }, cookieStore, availablePeriods] =
    await Promise.all([
      searchParams,
      cookies(),
      dashboardService.getAvailablePeriods().catch(() => []),
    ]);

  const initialPeriode =
    typeof rawPeriode === "string" && /^\d{6}$/.test(rawPeriode)
      ? rawPeriode
      : "SEMUA";

  const rawWidth = cookieStore.get("pengaduan_panel_width")?.value;
  const parsedWidth = rawWidth ? parseInt(rawWidth, 10) : DEFAULT_PENGADUAN_PANEL_WIDTH;
  const defaultPanelWidth =
    !isNaN(parsedWidth) &&
    parsedWidth >= MIN_PENGADUAN_PANEL_WIDTH &&
    parsedWidth <= MAX_PENGADUAN_PANEL_WIDTH
      ? parsedWidth
      : DEFAULT_PENGADUAN_PANEL_WIDTH;

  const rawPanelOpen = cookieStore.get("pengaduan_panel_open")?.value;
  const defaultPanelOpen = rawPanelOpen !== undefined ? rawPanelOpen === "true" : true;

  const rawHeaderOpen = cookieStore.get("pengaduan_header_open")?.value;
  const defaultHeaderOpen = rawHeaderOpen !== undefined ? rawHeaderOpen === "true" : true;

  const rawKpiOpen = cookieStore.get("pengaduan_kpi_open")?.value;
  const defaultKpiOpen = rawKpiOpen !== undefined ? rawKpiOpen === "true" : true;

  return (
    <PapanPengaduan
      initialQ={typeof q === "string" ? q : ""}
      initialPeriode={initialPeriode}
      availablePeriods={availablePeriods}
      defaultPanelWidth={defaultPanelWidth}
      defaultPanelOpen={defaultPanelOpen}
      defaultHeaderOpen={defaultHeaderOpen}
      defaultKpiOpen={defaultKpiOpen}
    />
  );
}
