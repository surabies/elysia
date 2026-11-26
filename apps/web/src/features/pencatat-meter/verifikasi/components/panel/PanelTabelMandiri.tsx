"use client";

// features/dashboard/verifikasi/components/panelTabelMandiri.tsx — tabel
// laporan mandiri dengan kemampuan yang sama seperti halaman Petugas:
// kotak centang (Shift+klik rentang, Ctrl+A), pilihan jumlah baris, saringan,
// dan ekspor CSV untuk baris terpilih.
//
// Memakai TabelVerifikasi yang sama dengan Petugas (modeRing="tunggal").
// Baris API dipetakan ke BarisVerifikasi agar laporan terverifikasi tampil
// berbeda dari V3 resmi pada tabel bersama.
// Tombol tampilan ada di toolbar, sebaris dengan pilihan jumlah baris.
import * as React from "react";
import { createPortal } from "react-dom";
import {
  CalendarDaysIcon,
  Cancel01Icon,
  Download01Icon,
  Task01Icon,
} from "@/components/icons/ikon-lucide";
import { HugeiconsIcon } from "@/components/icons/IconRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPeriode } from "@/features/public";
import {
  ambilList,
  kirimJson,
  ApiError,
} from "@/lib/api-dashboard";
import { KotakCari } from "@/features/penagihan/drd/components/data-grid";
import { PILIHAN_UKURAN } from "../toolbar/ToolbarVerifikasi";
import { CanvasTabelVerifikasi } from "../canvas/CanvasTabelVerifikasi";
import { cn } from "@/lib/utils";
import type { BarisVerifikasi } from "../../types";
import { usePreferensiKolom } from "../../hooks/use-preferensi-kolom";
import { KontrolTampilanTabel } from "../toolbar/KontrolTampilanTabel";
import { RingkasanSebaris } from "../RingkasanVerifikasi";
import type { StatsVerifikasi } from "../../types";
import { toast } from "sonner";
import { Filters } from "@/components/reui/filters/filters";
import type { FilterQuery } from "@/components/reui/filters/filters-types";
import {
  buatSkemaFilterMandiri,
  filterMandiriToQuery,
  queryToFilterMandiri,
} from "../toolbar/skema-filter";
import { TEMA_TAB_AKTIF } from "../../lib/tema-verifikasi";

export type StatusMandiri =
  | "MENUNGGU"
  | "DIVERIFIKASI"
  | "DITOLAK"
  | "DIGUNAKAN";

export type BarisMandiriTabel = BarisVerifikasi & {
  status: StatusMandiri;
  namaPelapor?: string | null;
  nomorPelapor?: string | null;
  verifiedByRole?: string | null;
  sudahTahapPetugas?: boolean;
  sudahDitagih?: boolean;
  sumberLaporan?: string | null;
};

/// Bentuk baris mentah /laporan-mandiri yang dibaca tabel.
interface BarisApi {
  id: string;
  nomorLangganan?: string;
  standAwal?: number | null;
  standDilaporkan?: number;
  pemakaianLalu?: number | null;
  kondisi?: string | null;
  tanggalCatat?: string | null;
  createdAt?: string;
  verifiedAt?: string | null;
  pembacaanId?: string | null;
  namaPelapor?: string | null;
  nomorPelapor?: string | null;
  verifiedByRole?: string | null;
  sudahTahapPetugas?: boolean;
  sudahDitagih?: boolean;
  status: StatusMandiri;
  pelanggan?: BarisVerifikasi["pelanggan"];
  pembacaan?: {
    standLalu?: number;
    standAkhir: number;
    pemakaianRiil?: number | null;
    pemakaianM3: number;
    pemakaianLalu?: number | null;
    kondisi?: string;
  } | null;
}

function petaBaris(r: BarisApi): BarisMandiriTabel {
  const terverifikasi = r.status === "DIVERIFIKASI" || r.status === "DIGUNAKAN";
  const resmi =
    terverifikasi &&
    (r.status === "DIGUNAKAN" || r.pembacaanId != null || r.pembacaan != null);
  const standAwal = r.standAwal ?? r.pembacaan?.standLalu ?? null;
  const pemakaian =
    standAwal != null && r.standDilaporkan != null
      ? r.standDilaporkan - standAwal
      : (r.pembacaan?.pemakaianRiil ?? null);
  return {
    id: r.id,
    status: r.status,
    nomorLangganan: r.nomorLangganan,
    standAwal,
    standAkhir: r.standDilaporkan ?? null,
    pemakaian,
    pembacaan:
      resmi && r.pembacaan
        ? {
            standLalu: r.pembacaan.standLalu,
            standAkhir: r.pembacaan.standAkhir,
            pemakaianRiil: r.pembacaan.pemakaianRiil,
            pemakaianM3: r.pembacaan.pemakaianM3,
            pemakaianLalu: r.pembacaan.pemakaianLalu,
          }
        : null,
    pemakaianLalu: r.pemakaianLalu ?? r.pembacaan?.pemakaianLalu ?? null,
    persentase: null,
    kondisi: r.kondisi ?? r.pembacaan?.kondisi ?? "STAND_KONSUMEN",
    jenisInput: "KONSUMEN",
    sumberLaporan: "KONSUMEN",
    tanggalCatat: r.tanggalCatat ?? r.createdAt ?? null,
    verif3At: resmi ? (r.verifiedAt ?? r.tanggalCatat ?? r.createdAt ?? "ok") : null,
    laporanMandiriTerverifikasi: terverifikasi && !resmi,
    verifiedAt:
      r.status === "DITOLAK" ? (r.verifiedAt ?? r.tanggalCatat ?? r.createdAt ?? "ok") : null,
    isVerified: terverifikasi,
    pencatat: { id: "konsumen", namaLapangan: "Konsumen" },
    pelanggan: r.pelanggan,
    namaPelapor: r.namaPelapor,
    nomorPelapor: r.nomorPelapor,
    verifiedByRole: r.verifiedByRole ?? null,
    sudahTahapPetugas: r.sudahTahapPetugas ?? false,
    sudahDitagih: r.sudahDitagih ?? false,
  };
}

const LABEL_STATUS: Record<StatusMandiri, string> = {
  MENUNGGU: "MENUNGGU",
  DIVERIFIKASI: "TERVERIFIKASI",
  DIGUNAKAN: "PEMBACAAN RESMI",
  DITOLAK: "DITOLAK",
};

interface FilterMandiri {
  q: string;
  status: string;
  pageSize: number;
}

export function PanelTabelMandiri({
  periodes,
  periode,
  onPeriode,
  refreshKey,
  idTerpilih,
  onKlikBaris,
  onKlikKanan,
  ringkasanTerbuka,
  onRingkasan,
  onRowsLoaded,
  stats,
  bisaAksi = true,
  onBerubah,
}: {
  periodes: number[];
  /** undefined = periode awal belum ditentukan; tabel menunggu. */
  periode: number | null | undefined;
  onPeriode: (p: number | null) => void;
  refreshKey: number;
  idTerpilih: string | null;
  onKlikBaris: (row: BarisMandiriTabel) => void;
  onKlikKanan: (
    row: BarisMandiriTabel,
    posisi: { x: number; y: number },
  ) => void;
  ringkasanTerbuka: boolean;
  onRingkasan: (buka: boolean) => void;
  onRowsLoaded: (hasRows: boolean, error?: string) => void;
  stats: StatsVerifikasi | null;
  bisaAksi?: boolean;
  onBerubah?: () => void;
}) {
  const [filter, setFilter] = React.useState<FilterMandiri>({
    q: "",
    status: "",
    pageSize: 100,
  });
  const [cari, setCari] = React.useState("");
  const preferensiKolom = usePreferensiKolom();
  const [rows, setRows] = React.useState<BarisMandiriTabel[]>([]);
  const [total, setTotal] = React.useState(0);
  const [memuat, setMemuat] = React.useState(true);
  const sedangMemuatRef = React.useRef(false);
  const [terpilih, setTerpilih] = React.useState<Set<string>>(new Set());
  const jangkarRef = React.useRef<number | null>(null);
  const [targetPortal, setTargetPortal] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    const el = document.getElementById("verifikasi-navbar-controls");
    if (el) setTargetPortal(el);
  }, []);

  // Pencarian ditunda 350 ms — mengetik nomor tidak boleh = satu permintaan per digit.
  React.useEffect(() => {
    const t = setTimeout(() => {
      setFilter((f) => (f.q === cari ? f : { ...f, q: cari }));
    }, 350);
    return () => clearTimeout(t);
  }, [cari]);

  React.useEffect(() => {
    if (periode === undefined) return;
    let batal = false;
    // Penanda "memuat" harus dinyalakan tepat sebelum permintaan berangkat.
    sedangMemuatRef.current = true;
    setMemuat(true);
    ambilList<BarisApi>("/laporan-mandiri", {
      pageSize: filter.pageSize,
      periode: periode ?? undefined,
      status: filter.status || undefined,
      q: filter.q || undefined,
    })
      .then(({ rows: r, total: t }) => {
        if (batal) return;
        setRows(r.map(petaBaris));
        setTotal(t);
        setTerpilih(new Set());
        onRowsLoaded(r.length > 0);
      })
      .catch((e) => {
        if (!batal) {
          const pesan =
            e instanceof ApiError ? e.message : "Gagal memuat data.";
          toast.error(pesan);
          onRowsLoaded(false);
        }
      })
      .finally(() => {
        if (!batal) {
          sedangMemuatRef.current = false;
          setMemuat(false);
        }
      });
    return () => {
      batal = true;
    };
  }, [periode, filter, refreshKey, onRowsLoaded]);

  React.useEffect(() => {
    if (sedangMemuatRef.current || rows.length === 0) return;
    if (!rows.some((row) => row.id === idTerpilih)) onKlikBaris(rows[0]);
  }, [rows, idTerpilih, onKlikBaris]);

  // Papan ketik: Ctrl+A pilih semua, Esc batal pilih.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setTerpilih(new Set(rows.map((r) => r.id)));
      } else if (e.key === "Escape") {
        setTerpilih((s) => (s.size > 0 ? new Set() : s));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows]);

  function toggle(id: string, rentang: boolean, indeks: number) {
    setTerpilih((lama) => {
      const baru = new Set(lama);
      if (rentang && jangkarRef.current !== null) {
        const [a, b] = [jangkarRef.current, indeks].sort((x, y) => x - y) as [
          number,
          number,
        ];
        for (let i = a; i <= b; i++) {
          const r = rows[i];
          if (r) baru.add(r.id);
        }
        return baru;
      }
      if (baru.has(id)) baru.delete(id);
      else baru.add(id);
      jangkarRef.current = indeks;
      return baru;
    });
  }

  /// Ekspor baris terpilih ke CSV. Urutan kolom mengikuti urutan kolom tabel.
  function ekspor() {
    const pilih = rows.filter((r) => terpilih.has(r.id));
    const kolom = [
      "No. Pel",
      "Nama",
      "ST Awal",
      "ST Akhir",
      "Pakai (m3)",
      "Lalu (m3)",
      "ST Resmi",
      "Tagihan (m3)",
      "Rute",
      "Pelapor",
      "No. pelapor",
      "Tgl Lapor",
      "Alamat",
      "Status",
    ];
    const isi = pilih.map((r) => [
      r.nomorLangganan ?? "",
      r.pelanggan?.nama ?? "",
      r.standAwal ?? "",
      r.standAkhir ?? "",
      r.pemakaian ?? "",
      r.pemakaianLalu ?? "",
      r.pembacaan?.standAkhir ?? "",
      r.pembacaan?.pemakaianM3 ?? "",
      r.pelanggan?.rute?.kode ?? "",
      r.namaPelapor ?? "",
      r.nomorPelapor ?? "",
      r.tanggalCatat ? r.tanggalCatat.slice(0, 10) : "",
      r.pelanggan?.alamat ?? "",
      LABEL_STATUS[r.status],
    ]);
    const csv = [kolom, ...isi]
      .map((baris) =>
        baris.map((s) => `"${String(s).replace(/"/g, '""')}"`).join(";"),
      )
      .join("\n");
    // BOM: tanpa ini Excel Indonesia membaca UTF-8 sebagai ANSI.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `verifikasi-mandiri-${periode ?? "semua"}-${pilih.length}baris.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const filterSchema = React.useMemo(() => buatSkemaFilterMandiri(), []);
  const [filterQuery, setFilterQuery] = React.useState<FilterQuery>(() =>
    filterMandiriToQuery(filter),
  );

  React.useEffect(() => {
    setFilterQuery(filterMandiriToQuery(filter));
  }, [filter.status]);

  const toolbarContent = (
    <div className="flex items-center justify-between w-full min-w-0 overflow-visible py-1 gap-2">
      {/* Sisi Kiri: Filter Periode & REUI Filters Status */}
      <div className="flex items-center gap-1.5 min-w-0 overflow-visible">
        {/* Periode Kerja */}
        <Select
          value={
            periode === null || periode === undefined ? "all" : String(periode)
          }
          onValueChange={(v) => onPeriode(v === "all" ? null : Number(v))}
        >
          <SelectTrigger
            size="sm"
            aria-label="Pilih Periode Kerja"
            className="h-8 gap-1.5 px-2.5 text-xs font-normal border-border/60 bg-background hover:bg-muted/60 text-foreground transition-colors cursor-pointer shrink-0"
          >
            <HugeiconsIcon
              icon={CalendarDaysIcon}
              strokeWidth={2}
              className="size-3.5 text-muted-foreground"
              aria-hidden
            />
            <SelectValue placeholder="Pilih Periode">
              {periode ? formatPeriode(periode) : "Semua Periode"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent position="popper" align="start" className="z-50">
            <SelectItem value="all">Semua Periode</SelectItem>
            {periodes.map((p) => (
              <SelectItem key={p} value={String(p)}>
                {formatPeriode(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* REUI Filters Bar (Status Laporan Mandiri) */}
        <div className="flex items-center">
          <Filters
            fields={filterSchema}
            query={filterQuery}
            onQueryChange={(nextQuery) => {
              setFilterQuery(nextQuery);
              const updated = queryToFilterMandiri(nextQuery, filter);
              setFilter((f) => ({ ...f, status: updated.status }));
            }}
            showClear
            size="sm"
          />
        </div>
      </div>

      {/* Sisi Kanan: Kontrol Tampilan (Collapse Ringkasan) & Paginasi Baris */}
      <div className="flex items-center gap-1.5 shrink-0">
        <KontrolTampilanTabel
          ringkasanTerbuka={ringkasanTerbuka}
          onRingkasan={onRingkasan}
          preferensiKolom={{
            preferensi: preferensiKolom.preferensiKolom,
            onVisibilitas: preferensiKolom.ubahVisibilitasKolom,
            onPindah: preferensiKolom.pindahKolom,
            onReset: preferensiKolom.resetKolom,
          }}
        />

        {/* Separator Antar Kontrol Tampilan & Paginasi Baris */}
        <div
          className="h-4 w-px bg-border/60 shrink-0 mx-0.5"
          aria-hidden="true"
        />

        {/* Status Baris Premium dengan Indicator Dot Permanen */}
        <div
          className="flex items-center gap-1.5 px-2.5 h-8 rounded-md bg-muted/40 border border-border/50 text-[11px] font-mono tabular-nums text-muted-foreground shrink-0 select-none transition-colors"
          title={
            memuat
              ? "Sedang menyinkronkan data..."
              : `Data siap: ${rows.length.toLocaleString("id-ID")} dari ${total.toLocaleString("id-ID")} baris`
          }
        >
          <span
            className={cn(
              "size-1.5 rounded-full shrink-0 transition-colors duration-300",
              memuat
                ? "bg-amber-500 animate-pulse ring-2 ring-amber-500/20"
                : "bg-emerald-500 ring-2 ring-emerald-500/20",
            )}
          />
          <span className="font-medium text-foreground">
            {rows.length.toLocaleString("id-ID")}
          </span>
          <span className="text-muted-foreground/40">/</span>
          <span>{total.toLocaleString("id-ID")}</span>
        </div>

        {/* Pilihan Ukuran Baris per Halaman */}
        <Select
          value={String(filter.pageSize)}
          onValueChange={(v) =>
            setFilter((f) => ({ ...f, pageSize: Number(v) }))
          }
        >
          <SelectTrigger
            size="sm"
            aria-label="Baris per halaman"
            className="w-auto h-8 text-xs shrink-0 cursor-pointer border-border/60 bg-background hover:bg-muted/60 transition-colors"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="end" className="z-50">
            {PILIHAN_UKURAN.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n.toLocaleString("id-ID")} baris
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* Baris Atas: Kotak Cari Cepat, Tab Laporan Mandiri, dan Ringkasan Sebaris */}
      <div className="flex shrink-0 items-center gap-2">
        <KotakCari
          nilai={cari}
          onUbah={setCari}
          placeholder="Cari no. langganan / nama..."
          className="w-48 sm:w-60 h-8 text-xs shrink-0"
        />

        <Button
          size="default"
          variant="ghost"
          className={cn("transition-all", TEMA_TAB_AKTIF)}
        >
          <HugeiconsIcon
            icon={Task01Icon}
            strokeWidth={2}
            className="size-3.5"
            aria-hidden
          />{" "}
          Laporan Mandiri
        </Button>

        <div className="ml-auto flex items-center gap-3">
          {/* Terlipat = angka ringkasan KPI pindah ke sini, tidak hilang */}
          {!ringkasanTerbuka && <RingkasanSebaris stats={stats} />}
        </div>
      </div>

      {targetPortal ? createPortal(toolbarContent, targetPortal) : (
        <div className="shrink-0">{toolbarContent}</div>
      )}

      <div className="min-h-0 flex-1">
        <CanvasTabelVerifikasi
          rows={rows}
          terpilih={terpilih}
          onToggle={toggle}
          onToggleSemua={(pilih) =>
            setTerpilih(pilih ? new Set(rows.map((r) => r.id)) : new Set())
          }
          idTerpilih={idTerpilih}
          onKlikBaris={(r) => onKlikBaris(r as BarisMandiriTabel)}
          onKlikKanan={(r, pos) => onKlikKanan(r as BarisMandiriTabel, pos)}
          ambangAnomali={50}
          modeRing="tunggal"
          memuat={memuat}
          preferensiKolom={preferensiKolom.preferensiKolom}
          onLebarKolom={preferensiKolom.ubahLebarKolom}
          onPindahKolom={preferensiKolom.pindahKolom}
          onUbahVisibilitasKolom={preferensiKolom.ubahVisibilitasKolom}
          onResetKolom={preferensiKolom.resetKolom}
          bolehEdit={(row) => {
            const m = row as BarisMandiriTabel;
            return (
              bisaAksi &&
              !m.sudahTahapPetugas &&
              !m.sudahDitagih &&
              m.status !== "DIGUNAKAN"
            );
          }}
          onSimpanKoreksi={async (row, hasil) => {
            const standBaru = hasil.standAkhirRevisi ?? row.standAkhir;
            if (standBaru == null) return;
            const snapshotLama = row as BarisMandiriTabel;

            // 1. Optimistic update (0ms latency)
            setRows((lama) =>
              lama.map((item) => {
                if (item.id !== row.id) return item;
                const pakaiBaru =
                  item.standAwal != null
                    ? standBaru - item.standAwal
                    : item.pemakaian;
                return {
                  ...item,
                  standAkhir: standBaru,
                  pemakaian: pakaiBaru,
                  status: "DIVERIFIKASI",
                  isVerified: true,
                  laporanMandiriTerverifikasi: true,
                  isCorrected: standBaru !== row.standAkhir,
                };
              }),
            );

            // 2. Sinkronisasi ke server di latar belakang; rollback jika gagal
            try {
              await kirimJson(`/laporan-mandiri/${row.id}/verify`, "PATCH", {
                standDilaporkan: standBaru,
              });
              toast.success(
                "Stand laporan mandiri berhasil dikoreksi dan diverifikasi.",
              );
              onBerubah?.();
            } catch (err) {
              setRows((lama) =>
                lama.map((item) => (item.id === row.id ? snapshotLama : item)),
              );
              toast.error(
                err instanceof ApiError
                  ? err.message
                  : "Gagal menyimpan koreksi laporan mandiri.",
              );
            }
          }}
        />
      </div>

      {terpilih.size > 0 && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2.5 shadow-xs">
          <Badge
            variant="pill"
            size="lg"
            className="h-8 rounded-md px-3 font-mono text-label-12 font-medium text-foreground border-border"
          >
            <span className="font-semibold text-foreground">
              {terpilih.size.toLocaleString("id-ID")}
            </span>{" "}
            baris dipilih
          </Badge>
          <Button
            size="default"
            variant="outline"
            className="h-8 rounded-md gap-1.5 text-label-12 font-medium border-border"
            onClick={ekspor}
          >
            <HugeiconsIcon
              icon={Download01Icon}
              strokeWidth={2}
              className="size-3.5"
              aria-hidden
            />
            Ekspor terpilih
          </Button>
          <Button
            size="default"
            variant="ghost"
            className="h-8 rounded-md gap-1.5 text-label-12 text-muted-foreground hover:text-foreground"
            onClick={() => setTerpilih(new Set())}
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              strokeWidth={2}
              className="size-3.5"
              aria-hidden
            />
            Batal pilih
            <kbd className="ml-1 rounded border border-border bg-muted/60 px-1.5 py-0.5 text-label-11 text-muted-foreground font-mono">
              Esc
            </kbd>
          </Button>
          <span className="ml-auto hidden text-label-12 text-muted-foreground lg:inline">
            Ctrl+A pilih semua · Shift+klik pilih rentang
          </span>
        </div>
      )}
    </div>
  );
}
