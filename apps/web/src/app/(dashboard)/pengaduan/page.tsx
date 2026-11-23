import type { Metadata } from "next";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth/index";
import { dashboardService } from "@/server/services/dashboard/dashboard.service";
import { pengaduanService } from "@/server/services/pengaduan/pengaduan.service";
import {
  PapanPengaduan,
  DEFAULT_PENGADUAN_PANEL_WIDTH,
  MIN_PENGADUAN_PANEL_WIDTH,
  MAX_PENGADUAN_PANEL_WIDTH,
} from "@/features/dashboard/pengaduan/components/papan-pengaduan/index";
import type {
  PengaduanBaris,
  PengaduanDetail,
  PetugasRingkas,
  StatistikPengaduan,
} from "@/features/dashboard/pengaduan/types/TipePengaduan";

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
  const [{ q, periode: rawPeriode }, cookieStore, session] = await Promise.all([
    searchParams,
    cookies(),
    auth().catch(() => null),
  ]);

  const initialQ = typeof q === "string" ? q : "";
  const initialPeriode =
    typeof rawPeriode === "string" && /^\d{6}$/.test(rawPeriode)
      ? rawPeriode
      : "SEMUA";
  const filterPeriode = initialPeriode !== "SEMUA" ? initialPeriode : undefined;

  // Prefetch seluruh data awal di server (SSR) agar saat halaman di-reload
  // tidak ada kedipan skeleton di tabel, kartu KPI, maupun panel detail kanan.
  const [availablePeriods, initialStat, initialList, initialPetugas] =
    await Promise.all([
      dashboardService.getAvailablePeriods().catch(() => []),
      pengaduanService
        .getStatistikPengaduan(filterPeriode)
        .catch(() => null) as Promise<StatistikPengaduan | null>,
      pengaduanService
        .listPengaduan({
          page: 1,
          pageSize: 50,
          q: initialQ || undefined,
          periode: filterPeriode,
        })
        .catch(() => ({ data: [], meta: { total: 0 } })),
      pengaduanService
        .listPetugasPengaduan()
        .catch(() => []) as Promise<PetugasRingkas[]>,
    ]);

  const initialRows = (initialList.data ?? []) as unknown as PengaduanBaris[];
  const initialTotal = initialList.meta?.total ?? initialRows.length;

  let initialDetail: PengaduanDetail | null = null;
  if (initialRows.length > 0) {
    const firstId = initialRows[0].id;
    const aktor = {
      id: session?.user?.id ?? null,
      role: (session?.user?.roles?.[0] ?? session?.user?.role) as any,
    };
    initialDetail = (await pengaduanService
      .getDetailPengaduanFull(firstId, aktor)
      .catch(() => null)) as unknown as PengaduanDetail | null;
  }

  const rawWidth = cookieStore.get("pengaduan_panel_width")?.value;
  const parsedWidth = rawWidth
    ? parseInt(rawWidth, 10)
    : DEFAULT_PENGADUAN_PANEL_WIDTH;
  const defaultPanelWidth =
    !isNaN(parsedWidth) &&
    parsedWidth >= MIN_PENGADUAN_PANEL_WIDTH &&
    parsedWidth <= MAX_PENGADUAN_PANEL_WIDTH
      ? parsedWidth
      : DEFAULT_PENGADUAN_PANEL_WIDTH;

  const rawPanelOpen = cookieStore.get("pengaduan_panel_open")?.value;
  const defaultPanelOpen =
    rawPanelOpen !== undefined ? rawPanelOpen === "true" : true;

  const rawHeaderOpen = cookieStore.get("pengaduan_header_open")?.value;
  const defaultHeaderOpen =
    rawHeaderOpen !== undefined ? rawHeaderOpen === "true" : true;

  const rawKpiOpen = cookieStore.get("pengaduan_kpi_open")?.value;
  const defaultKpiOpen =
    rawKpiOpen !== undefined ? rawKpiOpen === "true" : true;

  return (
    <PapanPengaduan
      initialQ={initialQ}
      initialPeriode={initialPeriode}
      availablePeriods={availablePeriods}
      initialStat={initialStat}
      initialRows={initialRows}
      initialTotal={initialTotal}
      initialDetail={initialDetail}
      initialPetugas={initialPetugas}
      defaultPanelWidth={defaultPanelWidth}
      defaultPanelOpen={defaultPanelOpen}
      defaultHeaderOpen={defaultHeaderOpen}
      defaultKpiOpen={defaultKpiOpen}
    />
  );
}
