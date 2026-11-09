"use client";

// features/dashboard/verifikasi/components/BilahVerifikasi.tsx — bilah
// saringan layar verifikasi, versi COMPACT.
//
// BARIS UTAMA hanya memuat yang dipakai tiap hari: cari, periode, tanggal.
// Sisanya (status, petugas, rute, anomali) dilipat ke panel "Filters".
// BARU: tombol "Cari lanjutan" membuka modal Pencarian Data (filter custom
// dengan kriteria bercentang) — angka di tombolnya = jumlah kriteria yang
// terakhir diterapkan.
//
// Di ujung kanan: jumlah tampil, pilihan jumlah baris, lalu `aksiKanan`
// (tombol tampilan) — satu kelompok, satu baris.
import * as React from "react";
import {
  Alert02Icon,
  Cancel01Icon,
  CalendarDaysIcon,
  Database01Icon,
  FilterIcon,
  Route01Icon,
  Search01Icon,
  Task01Icon,
  UserGroupIcon,
} from "@/features/dashboard/shared/icons/IkonLucide";
import { HugeiconsIcon } from "@/features/dashboard/shared/icons/IconRenderer";
import { cn } from "@/lib/Utilitas";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatPeriode } from "@/features/public/lib/Format";
import {
  KELAS_KONTROL_AKTIF,
} from "../../shared/data-grid/KelasKontrol";
import { KotakCari } from "../../shared/data-grid/toolbar/KotakCari";
import { FilterPilihan } from "../../shared/data-grid/toolbar/PenyaringPilihan";
import { PenyaringTanggal } from "../../shared/data-grid/toolbar/PenyaringTanggal";
import {
  hitungKriteriaPencarian,
  ModalPencarian,
  type KriteriaPencarian,
  type OpsiPencarian,
} from "./modal/ModalPencarian";
import {
  saringOpsiPetugasRute,
  type PenugasanFilter,
} from "../lib/PenyaringanRelasi";
import { LABEL_KONDISI_CATAT } from "@/features/dashboard/verifikasi/lib/LabelPencatatan";

export interface FilterVerifikasi {
  q: string;
  periode: number | null;
  statusVerif: string;
  pencatatId: string;
  /// Rute ≠ pencatat: pencatat = "siapa yang menyetor", rute = "wilayah mana".
  ruteId: string;
  tanggalDari: string;
  tanggalSampai: string;
  hanyaAnomali: boolean;
  kondisi: string;
  jenisInput: string;
  kriteriaLanjutan: KriteriaPencarian;
  pageSize: number;
}

export const FILTER_AWAL: FilterVerifikasi = {
  q: "",
  periode: null,
  statusVerif: "",
  pencatatId: "",
  ruteId: "",
  tanggalDari: "",
  tanggalSampai: "",
  hanyaAnomali: false,
  kondisi: "",
  jenisInput: "",
  kriteriaLanjutan: {},
  pageSize: 100,
};

export const PILIHAN_UKURAN = [50, 100, 200, 500, 1000, 2000, 5000] as const;

export function TombolIkonVerifikasi({
  label,
  ikon,
  onClick,
  aktif = false,
  jumlah,
  warnaBadge,
  ditekan,
  diperluas,
  hasPopup,
  controls,
}: {
  label: string;
  ikon: React.ReactNode;
  onClick: () => void;
  aktif?: boolean;
  jumlah?: number;
  warnaBadge?: string;
  ditekan?: boolean;
  diperluas?: boolean;
  hasPopup?: "dialog";
  controls?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={label}
          aria-pressed={ditekan}
          aria-expanded={diperluas}
          aria-haspopup={hasPopup}
          aria-controls={controls}
          onClick={onClick}
          className={cn(
            "relative shrink-0 overflow-visible",
            aktif && KELAS_KONTROL_AKTIF,
          )}
        >
          {ikon}
          {jumlah !== undefined && jumlah > 0 && (
            <span
              className={cn(
                "absolute -top-1.5 -right-1.5 z-10 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-background tabular-nums shadow-xs pointer-events-none",
                warnaBadge ?? "bg-foreground"
              )}
            >
              {jumlah}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function ToolbarVerifikasi({
  filter,
  onGanti,
  periodes,
  pencatats,
  rutes,
  penugasanRute,
  jumlahTampil,
  jumlahTotal,
  memuat,
  modeBelumDibaca = false,
  anomali = 0,
  ambang = 50,
  aksiKanan,
  opsiPencarian,
  onPencarianLanjutan,
}: {
  filter: FilterVerifikasi;
  onGanti: (f: FilterVerifikasi) => void;
  periodes: number[];
  pencatats: { id: string; namaLapangan: string }[];
  rutes: { id: string; kode: string }[];
  penugasanRute: PenugasanFilter[];
  jumlahTampil: number;
  jumlahTotal: number;
  memuat: boolean;
  /** Tab "belum dibaca": sembunyikan saringan yang tidak berlaku. */
  modeBelumDibaca?: boolean;
  anomali?: number;
  ambang?: number;
  /** Dirender tepat di sebelah kanan pilihan jumlah baris. */
  aksiKanan?: React.ReactNode;
  /** Pilihan dropdown modal Pencarian Data (wilayah, zonasi, …) dari server. */
  opsiPencarian?: OpsiPencarian;
  /** Dipanggil saat kriteria Cari Lanjutan diterapkan. */
  onPencarianLanjutan: (kriteria: KriteriaPencarian) => void;
}) {
  const [cari, setCari] = React.useState(filter.q);
  const [panelBuka, setPanelBuka] = React.useState(false);
  const [pencarianBuka, setPencarianBuka] = React.useState(false);
  const kriteriaTerapan = hitungKriteriaPencarian(filter.kriteriaLanjutan);

  // Pencarian ditunda 350 ms — mengetik 11 digit nomor tidak boleh = 11 permintaan.
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (cari !== filter.q) onGanti({ ...filter, q: cari });
    }, 350);
    return () => clearTimeout(t);
  }, [cari]);

  React.useEffect(() => {
    setCari(filter.q);
  }, [filter.q]);

  const set = <K extends keyof FilterVerifikasi>(
    k: K,
    v: FilterVerifikasi[K],
  ) => {
    const berikutnya = { ...filter, [k]: v };
    if (k === "pencatatId" && typeof v === "string" && v && filter.ruteId) {
      if (
        !penugasanRute.some(
          (item) => item.pencatatId === v && item.ruteId === filter.ruteId,
        )
      ) {
        berikutnya.ruteId = "";
      }
    }
    if (k === "ruteId" && typeof v === "string" && v && filter.pencatatId) {
      if (
        !penugasanRute.some(
          (item) => item.pencatatId === filter.pencatatId && item.ruteId === v,
        )
      ) {
        berikutnya.pencatatId = "";
      }
    }
    onGanti(berikutnya);
  };

  const opsiFilterUtama = saringOpsiPetugasRute(
    pencatats,
    rutes,
    penugasanRute,
    filter.pencatatId,
    filter.ruteId,
  );

  // Hanya saringan yang ADA di panel yang dihitung di tombol "Filters".
  const jumlahLanjutan =
    (filter.pencatatId ? 1 : 0) +
    (filter.ruteId ? 1 : 0) +
    (!modeBelumDibaca && filter.statusVerif ? 1 : 0) +
    (!modeBelumDibaca && filter.hanyaAnomali ? 1 : 0) +
    (!modeBelumDibaca && filter.kondisi ? 1 : 0) +
    (!modeBelumDibaca && filter.jenisInput ? 1 : 0);
  const adaFilter =
    jumlahLanjutan > 0 ||
    kriteriaTerapan > 0 ||
    filter.q !== "" ||
    filter.tanggalDari !== "" ||
    filter.tanggalSampai !== "";

  return (
    <>
      <div className="flex w-full min-w-0 items-center justify-between gap-2 overflow-visible">
        {/* KIRI: Kelompok Filter */}
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-visible py-1">
          <KotakCari
            nilai={cari}
            onUbah={setCari}
            placeholder="Cari no. langganan / nama"
            className="w-44 max-w-56 shrink-0"
          />

          <FilterPilihan
            filter={{
              param: "periode",
              label: "Periode",
              opsi: periodes.map((p) => ({
                value: String(p),
                label: formatPeriode(p),
              })),
            }}
            nilai={filter.periode === null ? "" : String(filter.periode)}
            onUbah={(v) => set("periode", v === "" ? null : Number(v))}
            ikon={
              <HugeiconsIcon
                icon={CalendarDaysIcon}
                strokeWidth={2}
                className="size-3.5"
                aria-hidden
              />
            }
            labelIkonSaja
          />

          {!modeBelumDibaca && (
            <PenyaringTanggal
              label="Tanggal"
              dari={filter.tanggalDari}
              sampai={filter.tanggalSampai}
              onTerapkan={(dari, sampai) =>
                onGanti({
                  ...filter,
                  tanggalDari: dari,
                  tanggalSampai: sampai,
                })
              }
              ringkas
              align="end"
            />
          )}

          {!modeBelumDibaca && (
            <>
              <TombolIkonVerifikasi
                label={`Cari lanjutan${kriteriaTerapan > 0 ? ` (${kriteriaTerapan} kriteria aktif)` : ""}`}
                onClick={() => setPencarianBuka(true)}
                hasPopup="dialog"
                aktif={kriteriaTerapan > 0}
                jumlah={kriteriaTerapan}
                ikon={
                  <HugeiconsIcon
                    icon={Search01Icon}
                    strokeWidth={2}
                    className="size-3.5"
                    aria-hidden
                  />
                }
              />
              {kriteriaTerapan > 0 && (
                <TombolIkonVerifikasi
                  label="Hapus kriteria pencarian lanjutan"
                  onClick={() => onPencarianLanjutan({})}
                  ikon={
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      strokeWidth={2}
                      className="size-3.5"
                      aria-hidden
                    />
                  }
                />
              )}
            </>
          )}

          {/* Popover Filter Lanjutan: Muncul rapi ke bawah, TIDAK AKAN PERNAH menimpa elemen lain */}
          <Popover open={panelBuka} onOpenChange={setPanelBuka}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`Filter lainnya${jumlahLanjutan > 0 ? ` (${jumlahLanjutan} aktif)` : ""}`}
                    aria-expanded={panelBuka}
                    className={cn(
                      "relative shrink-0 overflow-visible",
                      (panelBuka || jumlahLanjutan > 0) && KELAS_KONTROL_AKTIF
                    )}
                  >
                    <HugeiconsIcon
                      icon={FilterIcon}
                      strokeWidth={2}
                      className="size-3.5 text-muted-foreground"
                      aria-hidden
                    />
                    {jumlahLanjutan > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 z-10 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold text-background tabular-nums shadow-xs pointer-events-none">
                        {jumlahLanjutan}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Filter lainnya</TooltipContent>
            </Tooltip>

            <PopoverContent
              align="end"
              side="bottom"
              sideOffset={8}
              collisionPadding={16}
              className="w-80 rounded-xl border border-border bg-popover p-3.5 shadow-xl z-50 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <div className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={FilterIcon} className="size-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-foreground">Filter Lainnya</span>
                  {jumlahLanjutan > 0 && (
                    <span className="inline-flex items-center justify-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground tabular-nums">
                      {jumlahLanjutan} aktif
                    </span>
                  )}
                </div>
                {adaFilter && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      onGanti({
                        ...FILTER_AWAL,
                        periode: filter.periode,
                        pageSize: filter.pageSize,
                      });
                    }}
                  >
                    Reset Filter
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-2.5 text-xs">
                {/* Petugas */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Petugas Lapangan</label>
                  <Select
                    value={filter.pencatatId || "SEMUA"}
                    onValueChange={(v) => set("pencatatId", v === "SEMUA" ? "" : v)}
                  >
                    <SelectTrigger size="sm" className="w-full h-8 text-xs">
                      <SelectValue placeholder="Semua Petugas" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-56 z-50">
                      <SelectItem value="SEMUA">Semua Petugas</SelectItem>
                      {opsiFilterUtama.pencatats.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.namaLapangan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Rute */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Rute Baca</label>
                  <Select
                    value={filter.ruteId || "SEMUA"}
                    onValueChange={(v) => set("ruteId", v === "SEMUA" ? "" : v)}
                  >
                    <SelectTrigger size="sm" className="w-full h-8 text-xs">
                      <SelectValue placeholder="Semua Rute" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-56 z-50">
                      <SelectItem value="SEMUA">Semua Rute</SelectItem>
                      {opsiFilterUtama.rutes.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.kode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!modeBelumDibaca && (
                  <>
                    {/* Status Verifikasi */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Status Verifikasi</label>
                      <Select
                        value={filter.statusVerif || "SEMUA"}
                        onValueChange={(v) => set("statusVerif", v === "SEMUA" ? "" : v)}
                      >
                        <SelectTrigger size="sm" className="w-full h-8 text-xs">
                          <SelectValue placeholder="Semua Status" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-56 z-50">
                          <SelectItem value="SEMUA">Semua Status</SelectItem>
                          <SelectItem value="SUBMITTED">Menunggu</SelectItem>
                          <SelectItem value="VERIFIED_L1">V1</SelectItem>
                          <SelectItem value="VERIFIED_L2">V2</SelectItem>
                          <SelectItem value="APPROVED_FINAL">V3</SelectItem>
                          <SelectItem value="NEED_RESURVEY">Cek ulang</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Kondisi Catat */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Kondisi Catat</label>
                      <Select
                        value={filter.kondisi || "SEMUA"}
                        onValueChange={(v) => set("kondisi", v === "SEMUA" ? "" : v)}
                      >
                        <SelectTrigger size="sm" className="w-full h-8 text-xs">
                          <SelectValue placeholder="Semua Kondisi" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-56 z-50">
                          <SelectItem value="SEMUA">Semua Kondisi</SelectItem>
                          {Object.entries(LABEL_KONDISI_CATAT).map(([val, lbl]) => (
                            <SelectItem key={val} value={val}>
                              {lbl}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Asal Laporan */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-muted-foreground">Asal Laporan</label>
                      <Select
                        value={filter.jenisInput || "SEMUA"}
                        onValueChange={(v) => set("jenisInput", v === "SEMUA" ? "" : v)}
                      >
                        <SelectTrigger size="sm" className="w-full h-8 text-xs">
                          <SelectValue placeholder="Semua Asal" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-56 z-50">
                          <SelectItem value="SEMUA">Semua Asal</SelectItem>
                          <SelectItem value="PETUGAS">Petugas</SelectItem>
                          <SelectItem value="KONSUMEN">Mandiri</SelectItem>
                          <SelectItem value="MANUAL_SATUAN">Manual Add satuan</SelectItem>
                          <SelectItem value="MANUAL_MASSAL">Manual Add All</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Quick Toggle Anomali: Diposisikan di paling kanan setelah filter lainnya */}
          {!modeBelumDibaca && (
            <TombolIkonVerifikasi
              label={`Hanya anomali: deviasi lebih dari ±${ambang}% dari bulan lalu`}
              onClick={() => set("hanyaAnomali", !filter.hanyaAnomali)}
              aktif={filter.hanyaAnomali}
              jumlah={anomali > 0 ? anomali : undefined}
              warnaBadge="bg-(--verif-error)"
              ikon={
                <HugeiconsIcon
                  icon={Alert02Icon}
                  strokeWidth={2}
                  className="size-3.5"
                  aria-hidden
                />
              }
            />
          )}

          {/* Quick Clear Filter jika ada filter aktif */}
          {adaFilter && (
            <TombolIkonVerifikasi
              label="Bersihkan semua filter"
              onClick={() =>
                onGanti({
                  ...FILTER_AWAL,
                  periode: filter.periode,
                  pageSize: filter.pageSize,
                })
              }
              ikon={
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  strokeWidth={2}
                  className="size-3.5"
                  aria-hidden
                />
              }
            />
          )}
        </div>

        {/* Separator Antar Kolom */}
        <div className="h-4 w-px bg-border/80 shrink-0 mx-0.5" />

        {/* KANAN: Status Baris, Baris per Halaman & Kontrol Tampilan */}
        <div className="flex shrink-0 items-center justify-end gap-1.5">
          <span className="text-label-12 text-muted-foreground tabular-nums whitespace-nowrap">
            {memuat
              ? "Memuat…"
              : `${jumlahTampil.toLocaleString("id-ID")} dari ${jumlahTotal.toLocaleString("id-ID")}`}
          </span>

          <Select
            value={String(filter.pageSize)}
            onValueChange={(v) => set("pageSize", Number(v))}
          >
            <SelectTrigger
              size="sm"
              aria-label="Baris per halaman"
              className="w-auto h-8 text-xs shrink-0"
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

          {/* Separator Antar Kontrol Tampilan */}
          <div className="h-4 w-px bg-border/80 shrink-0 mx-0.5" />

          {aksiKanan}
        </div>
      </div>

      {/* Dirender hanya saat dibuka — state isian selalu mulai bersih. */}
      {pencarianBuka && (
        <ModalPencarian
          buka
          onBuka={(b) => !b && setPencarianBuka(false)}
          opsi={opsiPencarian}
          nilaiAwal={filter.kriteriaLanjutan}
          onCari={(kriteria) => onPencarianLanjutan(kriteria)}
        />
      )}
    </>
  );
}
