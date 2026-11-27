"use client";

// features/dashboard/verifikasi/components/tabel/SelEditInline.tsx — komponen
// editor langsung pada sel tabel (ST Akhir, ST Revisi, Ket Catat, Tagihan)
// beserta Popover 2-Input khusus kondisi Meter Baru (MB).
//
// PRINSIP UX CEPAT (SPREADSHEET-LIKE, ZERO LATENCY):
// 1. Area klik/hover mencakup SELURUH kotak <td> (via `after:absolute after:inset-0`),
//    bukan hanya pada teks di dalamnya.
// 2. Saat mode edit aktif, <input> mengisi penuh kotak <td> (`absolute inset-0`)
//    sementara teks asli dipertahankan (`invisible`) agar lebar kolom `w-max`
//    tidak bergeser 1 piksel pun (zero layout shift).
// 3. Klik 1x pada sel Ket Catat langsung memilih baris + membuka menu kondisi.
//    Klik 1x pada sel angka di baris aktif (atau klik ganda di baris mana pun,
//    atau langsung ketik angka 0-9 saat sel fokus) langsung membuka input edit.
// 4. Penyimpanan bersifat Optimistic (0ms): input tertutup dan angka tabel
//    berubah seketika tanpa menunggu jaringan.
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  hitungPemakaianGantiMeter,
  hitungPemakaianMudaKembali,
} from "@/lib/domain/perhitungan-meter";
import { cn } from "@/lib/utils";
import { formatAngka } from "../../lib/format-tabel";
import { LABEL_KONDISI_CATAT } from "../../lib/label-pencatatan";
import type { BarisTurunan } from "../../lib/turunan-baris";
import type { BarisVerifikasi } from "../../types";
import { SelStandAkhir } from "./SelStandAkhir";

export interface HasilKoreksiInline {
  standAwalRevisi: number | null;
  standAkhirRevisi: number | null;
  pemakaianRevisi?: number | null;
  kondisiRevisi: string | null;
  standAngkatLama: number | null;
  standMeterBaru: number | null;
  standPasang?: number | null;
  noMeterBaru?: string | null;
  mbTanpaStandAngkat?: boolean | null;
  digitRollover?: number | null;
  pemakaianTagihVerif?: number | null;
}

export interface KonteksEditTabel {
  /** Apakah baris ini diizinkan untuk diedit stand/kondisinya. */
  bolehEdit?: (row: BarisVerifikasi) => boolean;
  /** Khusus Role V3: apakah kolom Tagihan boleh diedit langsung. */
  bolehEditTagihan?: (row: BarisVerifikasi) => boolean;
  /** Callback penyimpanan koreksi baris (optimistic + sinkron ke server). */
  onSimpanKoreksi?: (
    row: BarisVerifikasi,
    hasil: HasilKoreksiInline,
  ) => Promise<void>;
  /** ID baris yang sedang terpilih/aktif di panel detail. */
  idTerpilih?: string | null;
  /** Memilih baris agar foto tampil di panel kiri. */
  onPilihBaris?: (row: BarisVerifikasi) => void;
  /** Koordinasi lintas-sel: ID baris yang sedang dipaksa buka Popover MB. */
  idBarisPopoverMB?: string | null;
  onSetBarisPopoverMB?: (id: string | null) => void;
  /** Koordinasi lintas-sel: ID baris yang sedang diminta fokus ke ST Revisi. */
  idBarisFokusRevisi?: string | null;
  onSetBarisFokusRevisi?: (id: string | null) => void;
}

/**
 * Kelas <input> yang mengisi penuh 100% ruang <td> tanpa menggeser layout,
 * tanpa panah spinner bawaan browser.
 */
const KELAS_INPUT_PENUH_SEL =
  "absolute inset-0 z-20 h-full w-full bg-background px-3 text-right font-mono text-copy-13 font-semibold tabular-nums text-(--verif-correction) ring-1 ring-inset ring-(--verif-correction)/70 outline-hidden selection:bg-(--verif-correction-hover)";

/**
 * Kelas pembungkus sel yang dapat diedit: menggunakan pseudo-element `after:inset-0`
 * sehingga seluruh kotak <td> (termasuk padding kosongnya) menjadi target klik
 * dan hover halus tanpa garis tebal yang mengganggu kebersihan tabel.
 */
const KELAS_TARGET_PENUH_SEL =
  "outline-hidden select-none cursor-cell after:content-[''] after:absolute after:inset-0 after:pointer-events-auto after:transition-colors hover:after:bg-foreground/[0.03] focus-visible:after:bg-(--verif-correction-row) focus-visible:after:ring-1 focus-visible:after:ring-inset focus-visible:after:ring-(--verif-correction)/60";

const KONDISI_TAKSASI_OTOMATIS_UI = new Set<string>([
  "RUMAH_KOSONG",
  "METER_RUSAK",
  "METER_MATI_ADA_AIR",
  "METER_MUNDUR",
  "METER_TERBALIK",
  "METER_DALAM_AIR",
  "LOS_METER",
  "BMK_BMB",
  "TTB",
  "MTA",
  "TERHALANG",
  "ADA_ANJING",
  "DK",
  "DICABUT",
]);

/** Hanya izinkan karakter digit bulat positif. */
function bersihkanDigit(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

/** Membentuk payload HasilKoreksiInline dasar dari keadaan baris saat ini. */
function payloadSaatIni(row: BarisVerifikasi): HasilKoreksiInline {
  return {
    standAwalRevisi: row.standAwalRevisi ?? null,
    standAkhirRevisi: row.standAkhirRevisi ?? null,
    pemakaianRevisi: row.pemakaianRevisi ?? null,
    kondisiRevisi: row.kondisiRevisi ?? null,
    standAngkatLama: row.standAngkatLama ?? null,
    standMeterBaru: row.standMeterBaru ?? null,
    standPasang: row.standPasang ?? null,
    noMeterBaru: row.noMeterBaru ?? null,
    mbTanpaStandAngkat: row.mbTanpaStandAngkat ?? null,
    digitRollover: row.digitRollover ?? null,
    ...(row.pemakaianTagihVerif !== undefined
      ? { pemakaianTagihVerif: row.pemakaianTagihVerif }
      : {}),
  };
}

/** Pindahkan fokus ke sel kolom yang sama pada baris tetangga (atas/bawah). */
function pindahFokusBarisTetangga(
  elSaatIni: HTMLElement | null,
  kolomEdit: string,
  arah: "atas" | "bawah",
) {
  const tr = elSaatIni?.closest("tr");
  if (!tr) return;
  const trTarget =
    arah === "bawah"
      ? (tr.nextElementSibling as HTMLElement | null)
      : (tr.previousElementSibling as HTMLElement | null);
  if (!trTarget) return;
  trTarget.click();
  const selTarget = trTarget.querySelector<HTMLElement>(
    `[data-edit-col="${kolomEdit}"]`,
  );
  selTarget?.focus();
}

// ============================================================================
// 1. SEL STAND AKHIR (Inline Input untuk Normal/Rev, Popover 2-Input untuk MB)
// ============================================================================

export function SelStandAkhirEditable({
  baris,
  edit,
}: {
  baris: BarisTurunan;
  edit?: KonteksEditTabel;
}) {
  const row = baris.row;
  const bisa = Boolean(edit?.onSimpanKoreksi && (edit.bolehEdit?.(row) ?? true));
  const barisAktif = edit?.idTerpilih === baris.id;
  const dipaksaMB = edit?.idBarisPopoverMB === baris.id;
  const modeMB = baris.isMB || dipaksaMB;

  const [sedangEditInline, setSedangEditInline] = React.useState(false);
  const [bukaPopoverMB, setBukaPopoverMB] = React.useState(false);
  const [nilaiInline, setNilaiInline] = React.useState("");
  const batalRef = React.useRef(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  // State khusus Popover MB (Stand Angkat Lama, Override Tanpa Stand Angkat, & Stand Meter Baru)
  const [angkatMB, setAngkatMB] = React.useState("");
  const [tanpaAngkatMB, setTanpaAngkatMB] = React.useState(false);
  const [meterBaruMB, setMeterBaruMB] = React.useState("");
  const inputMeterBaruRef = React.useRef<HTMLInputElement>(null);

  // Jika sel Ket Catat baru saja memilih "MB", langsung buka Popover MB di sel ini.
  React.useEffect(() => {
    if (dipaksaMB && bisa) {
      setTanpaAngkatMB(Boolean(row.mbTanpaStandAngkat));
      setAngkatMB(
        row.standAngkatLama != null ? String(row.standAngkatLama) : "",
      );
      setMeterBaruMB(
        row.standMeterBaru != null
          ? String(row.standMeterBaru)
          : row.standAkhir != null
            ? String(row.standAkhir)
            : "",
      );
      setBukaPopoverMB(true);
    }
  }, [
    dipaksaMB,
    bisa,
    row.standAngkatLama,
    row.mbTanpaStandAngkat,
    row.standAkhir,
    row.standMeterBaru,
  ]);

  function bukaEditor(nilaiAwalOverride?: string) {
    if (!bisa) return;
    edit?.onPilihBaris?.(row);
    if (modeMB) {
      setTanpaAngkatMB(Boolean(row.mbTanpaStandAngkat));
      setAngkatMB(
        row.standAngkatLama != null ? String(row.standAngkatLama) : "",
      );
      setMeterBaruMB(
        nilaiAwalOverride ??
          (row.standMeterBaru != null
            ? String(row.standMeterBaru)
            : baris.standAkhir != null
              ? String(baris.standAkhir)
              : ""),
      );
      setBukaPopoverMB(true);
    } else {
      batalRef.current = false;
      setNilaiInline(
        nilaiAwalOverride ??
          (baris.standAkhir != null ? String(baris.standAkhir) : ""),
      );
      setSedangEditInline(true);
    }
  }

  function komitInline() {
    if (batalRef.current) {
      batalRef.current = false;
      setSedangEditInline(false);
      return;
    }
    setSedangEditInline(false);
    if (!edit?.onSimpanKoreksi) return;

    const trimmed = nilaiInline.trim();
    if (trimmed === "") return;
    const angkaBaru = Number(trimmed);
    if (!Number.isInteger(angkaBaru) || angkaBaru < 0) {
      toast.error("Stand akhir harus bilangan bulat minimal 0.");
      return;
    }
    if (angkaBaru === baris.standAkhir) return;

    const standAwalAktif = baris.standAwal ?? 0;
    if (angkaBaru < standAwalAktif) {
      toast.error(
        `Stand akhir (${formatAngka(angkaBaru)}) tidak boleh lebih kecil dari ST Awal (${formatAngka(standAwalAktif)}).`,
      );
      return;
    }

    const dasar = payloadSaatIni(row);
    void edit.onSimpanKoreksi(row, {
      ...dasar,
      standAkhirRevisi: angkaBaru === row.standAkhir ? null : angkaBaru,
      // Jika stand akhir diubah berbeda dari stand awal, hitung otomatis dari selisih stand
      pemakaianRevisi:
        angkaBaru !== standAwalAktif ? null : dasar.pemakaianRevisi,
    });
  }

  function komitPopoverMB(e?: React.FormEvent) {
    e?.preventDefault();
    if (!edit?.onSimpanKoreksi) return;

    const angkatNum =
      tanpaAngkatMB || angkatMB.trim() === "" ? null : Number(angkatMB.trim());
    const baruNum =
      meterBaruMB.trim() === "" ? null : Number(meterBaruMB.trim());
    const standAwalAktif = baris.standAwal ?? 0;

    if (baruNum == null || !Number.isInteger(baruNum) || baruNum < 0) {
      toast.error("Lengkapi Stand Meter Baru (minimal 0).");
      return;
    }

    if (!tanpaAngkatMB) {
      if (angkatNum == null || !Number.isInteger(angkatNum) || angkatNum < 0) {
        toast.error(
          "Isi Stand Angkat Lama, atau centang Override Tanpa Stand Angkat.",
        );
        return;
      }
      if (angkatNum < standAwalAktif) {
        toast.error(
          `Stand Angkat (${formatAngka(angkatNum)}) lebih kecil dari ST Awal (${formatAngka(standAwalAktif)}). Periksa kembali atau gunakan Override.`,
        );
        return;
      }
    }

    const estimasiPakai = hitungPemakaianGantiMeter({
      standAwalLama: standAwalAktif,
      standAngkatLama: angkatNum,
      standMeterBaru: baruNum,
      standPasang: row.standPasang ?? 0,
      tanpaStandAngkat: tanpaAngkatMB,
    });

    if (estimasiPakai < 0) {
      toast.error(
        `Pemakaian ganti meter tidak boleh negatif (${estimasiPakai} m³). Periksa kembali angka stand.`,
      );
      return;
    }

    setBukaPopoverMB(false);
    edit.onSetBarisPopoverMB?.(null);

    const dasar = payloadSaatIni(row);
    void edit.onSimpanKoreksi(row, {
      ...dasar,
      kondisiRevisi: row.kondisi === "MB" ? null : "MB",
      standAngkatLama: tanpaAngkatMB ? null : angkatNum,
      mbTanpaStandAngkat: tanpaAngkatMB,
      standMeterBaru: baruNum,
      standAkhirRevisi: baruNum,
      pemakaianRevisi: null,
    });
  }

  if (sedangEditInline) {
    return (
      <>
        <span className="invisible select-none">
          <SelStandAkhir baris={baris} />
        </span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoFocus
          value={nilaiInline}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onChange={(e) => setNilaiInline(bersihkanDigit(e.target.value))}
          onFocus={(e) => {
            // Pilih seluruh teks kecuali jika baru diketik 1 digit langsung dari sel
            if (nilaiInline === String(baris.standAkhir ?? "")) {
              e.currentTarget.select();
            } else {
              const len = e.currentTarget.value.length;
              e.currentTarget.setSelectionRange(len, len);
            }
          }}
          onBlur={() => komitInline()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              e.preventDefault();
              const targetEl = e.currentTarget;
              komitInline();
              pindahFokusBarisTetangga(targetEl, "standAkhir", "bawah");
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              const targetEl = e.currentTarget;
              komitInline();
              pindahFokusBarisTetangga(targetEl, "standAkhir", "bawah");
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              const targetEl = e.currentTarget;
              komitInline();
              pindahFokusBarisTetangga(targetEl, "standAkhir", "atas");
            } else if (e.key === "Escape") {
              e.preventDefault();
              batalRef.current = true;
              setSedangEditInline(false);
              wrapperRef.current?.focus();
            }
          }}
          className={KELAS_INPUT_PENUH_SEL}
          aria-label="Koreksi Stand Akhir"
        />
      </>
    );
  }

  const angkatPreview =
    tanpaAngkatMB || angkatMB.trim() === "" ? null : Number(angkatMB.trim());
  const baruPreview =
    meterBaruMB.trim() === "" ? null : Number(meterBaruMB.trim());
  const pakaiMBPreview =
    baris.standAwal != null &&
    baruPreview != null &&
    Number.isInteger(baruPreview) &&
    (tanpaAngkatMB ||
      (angkatPreview != null && Number.isInteger(angkatPreview)))
      ? hitungPemakaianGantiMeter({
          standAwalLama: baris.standAwal,
          standAngkatLama: angkatPreview,
          standMeterBaru: baruPreview,
          standPasang: row.standPasang ?? 0,
          tanpaStandAngkat: tanpaAngkatMB,
        })
      : null;

  if (modeMB && bisa) {
    return (
      <Popover
        open={bukaPopoverMB}
        onOpenChange={(open) => {
          setBukaPopoverMB(open);
          if (!open) edit?.onSetBarisPopoverMB?.(null);
        }}
      >
        <PopoverTrigger asChild>
          <div
            ref={wrapperRef}
            data-edit-col="standAkhir"
            role="gridcell"
            tabIndex={0}
            title="Klik untuk koreksi Stand Angkat & Stand Meter Baru (MB)"
            onClick={(e) => {
              e.stopPropagation();
              edit?.onPilihBaris?.(row);
              if (!bukaPopoverMB) bukaEditor();
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              bukaEditor();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "F2") {
                e.preventDefault();
                e.stopPropagation();
                bukaEditor();
              } else if (/^\d$/.test(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                bukaEditor(e.key);
              }
            }}
            className={cn("w-full", KELAS_TARGET_PENUH_SEL)}
          >
            <SelStandAkhir baris={baris} />
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="bottom"
          className="w-72 p-3 text-copy-13"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <PopoverHeader className="mb-2.5 border-b border-border pb-2">
            <PopoverTitle className="flex items-center justify-between text-copy-13 font-semibold">
              <span>Koreksi Meter Baru (MB)</span>
              <span className="rounded bg-(--verif-info)/15 px-1.5 py-0.5 font-mono text-copy-11 text-(--verif-info)">
                {baris.nomor ?? "—"}
              </span>
            </PopoverTitle>
          </PopoverHeader>

          <form onSubmit={(e) => komitPopoverMB(e)} className="space-y-2.5">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-copy-11 select-none">
              <Checkbox
                checked={tanpaAngkatMB}
                onCheckedChange={(v) => {
                  const aktif = v === true;
                  setTanpaAngkatMB(aktif);
                  if (aktif) setAngkatMB("");
                }}
              />
              <span className="font-medium text-foreground">
                Override: Tanpa Stand Angkat
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label
                  htmlFor={`mb-angkat-${baris.id}`}
                  className="block text-copy-11 font-medium text-muted-foreground"
                >
                  Stand Angkat Lama
                </label>
                <Input
                  id={`mb-angkat-${baris.id}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  density="compact"
                  disabled={tanpaAngkatMB}
                  autoFocus={!tanpaAngkatMB && angkatMB === ""}
                  value={angkatMB}
                  onChange={(e) => setAngkatMB(bersihkanDigit(e.target.value))}
                  onFocus={(e) => e.currentTarget.select()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      inputMeterBaruRef.current?.focus();
                      inputMeterBaruRef.current?.select();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      setBukaPopoverMB(false);
                      edit?.onSetBarisPopoverMB?.(null);
                    }
                  }}
                  placeholder={tanpaAngkatMB ? "Override" : `Min ${formatAngka(baris.standAwal)}`}
                  className="font-mono tabular-nums"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor={`mb-baru-${baris.id}`}
                  className="block text-copy-11 font-medium text-muted-foreground"
                >
                  Stand Meter Baru
                </label>
                <Input
                  ref={inputMeterBaruRef}
                  id={`mb-baru-${baris.id}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  density="compact"
                  autoFocus={angkatMB !== ""}
                  value={meterBaruMB}
                  onChange={(e) =>
                    setMeterBaruMB(bersihkanDigit(e.target.value))
                  }
                  onFocus={(e) => e.currentTarget.select()}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setBukaPopoverMB(false);
                      edit?.onSetBarisPopoverMB?.(null);
                    }
                  }}
                  placeholder="Meter baru"
                  className="font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md bg-muted/60 px-2.5 py-1.5 text-copy-12">
              <span className="text-muted-foreground">
                ST Awal:{" "}
                <strong className="text-foreground">
                  {formatAngka(baris.standAwal)}
                </strong>
              </span>
              <span className="text-muted-foreground">
                Pakai:{" "}
                <strong
                  className={cn(
                    "font-mono tabular-nums",
                    pakaiMBPreview != null && pakaiMBPreview < 0
                      ? "text-(--verif-error)"
                      : "text-foreground",
                  )}
                >
                  {formatAngka(pakaiMBPreview)} m³
                </strong>
              </span>
            </div>

            <div className="flex items-center justify-end gap-1.5 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-copy-12"
                onClick={() => {
                  setBukaPopoverMB(false);
                  edit?.onSetBarisPopoverMB?.(null);
                }}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" className="h-7 px-3 text-copy-12">
                Simpan MB
              </Button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div
      ref={wrapperRef}
      data-edit-col="standAkhir"
      role={bisa ? "gridcell" : undefined}
      tabIndex={bisa ? 0 : undefined}
      onClick={
        bisa
          ? (e) => {
              if (barisAktif) {
                e.stopPropagation();
                bukaEditor();
              }
            }
          : undefined
      }
      onDoubleClick={
        bisa
          ? (e) => {
              e.stopPropagation();
              bukaEditor();
            }
          : undefined
      }
      onKeyDown={
        bisa
          ? (e) => {
              if (e.key === "Enter" || e.key === "F2") {
                e.preventDefault();
                e.stopPropagation();
                bukaEditor();
              } else if (/^\d$/.test(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                bukaEditor(e.key);
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                pindahFokusBarisTetangga(e.currentTarget, "standAkhir", "bawah");
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                pindahFokusBarisTetangga(e.currentTarget, "standAkhir", "atas");
              }
            }
          : undefined
      }
      className={cn("w-full", bisa && KELAS_TARGET_PENUH_SEL)}
    >
      <SelStandAkhir baris={baris} />
    </div>
  );
}

// ============================================================================
// 2. SEL STAND REVISI (Otomatis mengubah Ket Catat -> Revisi Pencatat)
// ============================================================================

export function SelStandRevisiEditable({
  baris,
  edit,
}: {
  baris: BarisTurunan;
  edit?: KonteksEditTabel;
}) {
  const row = baris.row;
  const bisa = Boolean(edit?.onSimpanKoreksi && (edit.bolehEdit?.(row) ?? true));
  const barisAktif = edit?.idTerpilih === baris.id;
  const dimintaFokus = edit?.idBarisFokusRevisi === baris.id;

  const [sedangEdit, setSedangEdit] = React.useState(false);
  const [nilai, setNilai] = React.useState("");
  const batalRef = React.useRef(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const nilaiDefault =
    baris.standAwalRevisi != null
      ? String(baris.standAwalRevisi)
      : row.standAwal != null
        ? String(row.standAwal)
        : "";

  React.useEffect(() => {
    if (dimintaFokus && bisa) {
      batalRef.current = false;
      setNilai(nilaiDefault);
      setSedangEdit(true);
      edit?.onSetBarisFokusRevisi?.(null);
    }
  }, [dimintaFokus, bisa, nilaiDefault, edit]);

  function bukaEditor(nilaiAwalOverride?: string) {
    if (!bisa) return;
    edit?.onPilihBaris?.(row);
    batalRef.current = false;
    setNilai(nilaiAwalOverride ?? nilaiDefault);
    setSedangEdit(true);
  }

  function komit() {
    if (batalRef.current) {
      batalRef.current = false;
      setSedangEdit(false);
      return;
    }
    setSedangEdit(false);
    if (!edit?.onSimpanKoreksi) return;

    const trimmed = nilai.trim();
    const dasar = payloadSaatIni(row);

    // Jika dikosongkan atau disamakan dengan ST Awal asli -> hapus revisi & kembalikan kondisi
    if (trimmed === "" || Number(trimmed) === row.standAwal) {
      if (baris.standAwalRevisi == null && row.kondisiRevisi !== "REV_PENCATAT") {
        return;
      }
      void edit.onSimpanKoreksi(row, {
        ...dasar,
        standAwalRevisi: null,
        kondisiRevisi:
          (row.kondisiRevisi ?? row.kondisi) === "REV_PENCATAT"
            ? null
            : dasar.kondisiRevisi,
      });
      return;
    }

    const angkaBaru = Number(trimmed);
    if (!Number.isInteger(angkaBaru) || angkaBaru < 0) {
      toast.error("ST Revisi harus bilangan bulat minimal 0.");
      return;
    }
    if (
      angkaBaru === baris.standAwalRevisi &&
      (row.kondisiRevisi ?? row.kondisi) === "REV_PENCATAT"
    ) {
      return;
    }

    if (
      !baris.isMB &&
      baris.standAkhir != null &&
      baris.standAkhir < angkaBaru
    ) {
      toast.error(
        `ST Revisi (${formatAngka(angkaBaru)}) tidak boleh melebihi ST Akhir (${formatAngka(baris.standAkhir)}).`,
      );
      return;
    }

    void edit.onSimpanKoreksi(row, {
      ...dasar,
      standAwalRevisi: angkaBaru,
      // Otomatis mengubah Ket Catat menjadi Revisi Pencatat!
      kondisiRevisi: row.kondisi === "REV_PENCATAT" ? null : "REV_PENCATAT",
      standAngkatLama: null,
      standMeterBaru: null,
      pemakaianRevisi:
        baris.standAkhir != null && baris.standAkhir !== angkaBaru
          ? null
          : dasar.pemakaianRevisi,
    });
  }

  const tampilanTeks =
    baris.standAwalRevisi != null ? (
      <span className="font-semibold text-(--verif-correction)">
        {formatAngka(baris.standAwalRevisi)}
      </span>
    ) : (
      formatAngka(null)
    );

  if (sedangEdit) {
    return (
      <>
        <span className="invisible select-none">{tampilanTeks}</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoFocus
          value={nilai}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onChange={(e) => setNilai(bersihkanDigit(e.target.value))}
          onFocus={(e) => {
            if (nilai === nilaiDefault) {
              e.currentTarget.select();
            } else {
              const len = e.currentTarget.value.length;
              e.currentTarget.setSelectionRange(len, len);
            }
          }}
          onBlur={() => komit()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter" || e.key === "ArrowDown") {
              e.preventDefault();
              const targetEl = e.currentTarget;
              komit();
              pindahFokusBarisTetangga(targetEl, "standRevisi", "bawah");
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              const targetEl = e.currentTarget;
              komit();
              pindahFokusBarisTetangga(targetEl, "standRevisi", "atas");
            } else if (e.key === "Escape") {
              e.preventDefault();
              batalRef.current = true;
              setSedangEdit(false);
              wrapperRef.current?.focus();
            }
          }}
          className={KELAS_INPUT_PENUH_SEL}
          aria-label="Koreksi Stand Awal Revisi"
        />
      </>
    );
  }

  return (
    <div
      ref={wrapperRef}
      data-edit-col="standRevisi"
      role={bisa ? "gridcell" : undefined}
      tabIndex={bisa ? 0 : undefined}
      onClick={
        bisa
          ? (e) => {
              if (barisAktif) {
                e.stopPropagation();
                bukaEditor();
              }
            }
          : undefined
      }
      onDoubleClick={
        bisa
          ? (e) => {
              e.stopPropagation();
              bukaEditor();
            }
          : undefined
      }
      onKeyDown={
        bisa
          ? (e) => {
              if (e.key === "Enter" || e.key === "F2") {
                e.preventDefault();
                e.stopPropagation();
                bukaEditor();
              } else if (/^\d$/.test(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                bukaEditor(e.key);
              } else if (e.key === "Backspace" || e.key === "Delete") {
                e.preventDefault();
                e.stopPropagation();
                bukaEditor("");
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                pindahFokusBarisTetangga(
                  e.currentTarget,
                  "standRevisi",
                  "bawah",
                );
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                pindahFokusBarisTetangga(
                  e.currentTarget,
                  "standRevisi",
                  "atas",
                );
              }
            }
          : undefined
      }
      className={cn("w-full", bisa && KELAS_TARGET_PENUH_SEL)}
    >
      {tampilanTeks}
    </div>
  );
}

// ============================================================================
// 3. SEL KET CATAT / KONDISI (Klik 1x Sel Langsung Buka Pilihan Kondisi)
// ============================================================================

export function SelKondisiEditable({
  baris,
  edit,
}: {
  baris: BarisTurunan;
  edit?: KonteksEditTabel;
}) {
  const row = baris.row;
  const bisa = Boolean(edit?.onSimpanKoreksi && (edit.bolehEdit?.(row) ?? true));
  const [buka, setBuka] = React.useState(false);

  const kondisiAktif = row.kondisiRevisi ?? row.kondisi ?? "";

  function pilihKondisi(kodeBaru: string) {
    setBuka(false);
    if (!edit?.onSimpanKoreksi) return;

    // 1. Jika memilih MB -> langsung buka Popover 2-Input di sel ST Akhir baris ini
    if (kodeBaru === "MB") {
      edit.onSetBarisPopoverMB?.(baris.id);
      return;
    }

    // 2. Jika memilih REV_PENCATAT -> langsung fokuskan input ST Revisi baris ini
    if (kodeBaru === "REV_PENCATAT") {
      edit.onSetBarisFokusRevisi?.(baris.id);
      return;
    }

    if (kodeBaru === kondisiAktif) return;

    // 3. Jika memilih salah satu dari 14 Kondisi Taksasi Otomatis (misal DK, TERHALANG, RUMAH_KOSONG, METER_RUSAK):
    //    Otomatis samakan ST Akhir = ST Awal dan isi Pakai dari taksasi/pakaiLalu/minimum (5 m³)
    const dasar = payloadSaatIni(row);
    if (KONDISI_TAKSASI_OTOMATIS_UI.has(kodeBaru)) {
      const standAwalAktif = row.standAwal ?? baris.standAwal ?? 0;
      const estimasiTaksasi =
        row.pemakaianRevisi ??
        (baris.pemakaian != null && baris.pemakaian > 0
          ? baris.pemakaian
          : baris.pemakaianLalu != null && baris.pemakaianLalu > 0
            ? Math.ceil(baris.pemakaianLalu)
            : 5);
      void edit.onSimpanKoreksi(row, {
        ...dasar,
        kondisiRevisi: kodeBaru === row.kondisi ? null : kodeBaru,
        standAwalRevisi: null,
        standAkhirRevisi:
          standAwalAktif === row.standAkhir ? null : standAwalAktif,
        pemakaianRevisi: estimasiTaksasi,
        standAngkatLama: null,
        standMeterBaru: null,
      });
      return;
    }

    // 3b. Jika memilih MUDA_KEMBALI (Rollover): hitung otomatis berdasarkan ukuran/digit meter
    if (kodeBaru === "MUDA_KEMBALI") {
      const standAwalAktif = baris.standAwal ?? 0;
      const standAkhirAktif = baris.standAkhir ?? 0;
      const rollover = hitungPemakaianMudaKembali({
        standAwal: standAwalAktif,
        standAkhir: standAkhirAktif,
        ukuranMeter: row.ukuranMeter ?? null,
        jumlahDigitAset: row.jumlahDigitAset ?? null,
        digitOverride: row.digitRollover ?? null,
      });
      void edit.onSimpanKoreksi(row, {
        ...dasar,
        kondisiRevisi: kodeBaru === row.kondisi ? null : kodeBaru,
        standAngkatLama: null,
        standMeterBaru: null,
        mbTanpaStandAngkat: false,
        digitRollover: rollover.digit,
        pemakaianRevisi: rollover.isValid ? rollover.totalPemakaianM3 : null,
      });
      return;
    }

    // 4. Kondisi lainnya (misal Normal, Tutup Total, Tidak Dipakai): simpan optimistik (0ms)
    //    & pertahankan pemakaian taksasi bila ST Awal == ST Akhir agar angka Pakai tidak jadi 0!
    const pakaiTaksasiSaatIni =
      row.pemakaianRevisi ??
      (baris.standAkhir === baris.standAwal &&
      baris.pemakaian != null &&
      baris.pemakaian > 0
        ? baris.pemakaian
        : null);
    void edit.onSimpanKoreksi(row, {
      ...dasar,
      kondisiRevisi: kodeBaru === row.kondisi ? null : kodeBaru,
      standAwalRevisi: null,
      standAngkatLama: null,
      standMeterBaru: null,
      pemakaianRevisi: pakaiTaksasiSaatIni,
    });
  }

  if (!bisa) {
    return <span>{baris.kondisiLabel ?? "—"}</span>;
  }

  return (
    <Popover
      open={buka}
      onOpenChange={(nextOpen) => {
        if (nextOpen) edit?.onPilihBaris?.(row);
        setBuka(nextOpen);
      }}
    >
      <PopoverTrigger asChild>
        <div
          data-edit-col="kondisi"
          role="gridcell"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            edit?.onPilihBaris?.(row);
            setBuka((prev) => !prev);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " " || e.key === "F2") {
              e.preventDefault();
              e.stopPropagation();
              edit?.onPilihBaris?.(row);
              setBuka(true);
            } else if (e.key === "ArrowDown" && !buka) {
              e.preventDefault();
              pindahFokusBarisTetangga(e.currentTarget, "kondisi", "bawah");
            } else if (e.key === "ArrowUp" && !buka) {
              e.preventDefault();
              pindahFokusBarisTetangga(e.currentTarget, "kondisi", "atas");
            }
          }}
          className={cn(
            "w-full truncate",
            KELAS_TARGET_PENUH_SEL,
            baris.kondisiDikoreksi && "font-semibold text-(--verif-correction)",
          )}
        >
          {baris.kondisiLabel ?? "—"}
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        className="w-56 p-1.5 text-copy-13"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <div className="px-2 py-1 text-copy-11 font-semibold tracking-wide text-muted-foreground uppercase">
          Pilih Ket. Catat
        </div>
        <div className="max-h-64 space-y-0.5 overflow-y-auto">
          {Object.entries(LABEL_KONDISI_CATAT).map(([kode, label]) => {
            const aktif = kode === kondisiAktif;
            return (
              <button
                key={kode}
                type="button"
                onClick={() => pilihKondisi(kode)}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-copy-13 transition-colors hover:bg-muted",
                  aktif && "bg-primary/10 font-semibold text-primary",
                )}
              >
                <span>{label}</span>
                {kode === "MB" && (
                  <span className="rounded bg-muted px-1 py-0.5 text-copy-11 text-muted-foreground">
                    2 Input
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// 4. SEL TAGIHAN (Inline Input khusus Role V3)
// ============================================================================

export function SelTagihanEditable({
  baris,
  edit,
}: {
  baris: BarisTurunan;
  edit?: KonteksEditTabel;
}) {
  const row = baris.row;
  const bisa = Boolean(
    edit?.onSimpanKoreksi && (edit.bolehEditTagihan?.(row) ?? false),
  );
  const barisAktif = edit?.idTerpilih === baris.id;

  const [sedangEdit, setSedangEdit] = React.useState(false);
  const [nilai, setNilai] = React.useState("");
  const batalRef = React.useRef(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const nilaiDefault =
    row.pemakaianTagihVerif ?? baris.hasilTagihan ?? baris.pemakaian ?? null;
  const nilaiDefaultStr = nilaiDefault != null ? String(nilaiDefault) : "";

  function bukaEditor(nilaiAwalOverride?: string) {
    if (!bisa) return;
    edit?.onPilihBaris?.(row);
    batalRef.current = false;
    setNilai(nilaiAwalOverride ?? nilaiDefaultStr);
    setSedangEdit(true);
  }

  function komit() {
    if (batalRef.current) {
      batalRef.current = false;
      setSedangEdit(false);
      return;
    }
    setSedangEdit(false);
    if (!edit?.onSimpanKoreksi) return;

    const trimmed = nilai.trim();
    const dasar = payloadSaatIni(row);

    if (trimmed === "") {
      if (row.pemakaianTagihVerif == null) return;
      void edit.onSimpanKoreksi(row, {
        ...dasar,
        pemakaianTagihVerif: null,
      });
      return;
    }

    const angkaBaru = Number(trimmed);
    if (!Number.isInteger(angkaBaru) || angkaBaru < 0) {
      toast.error("Nilai Tagihan harus bilangan bulat minimal 0.");
      return;
    }
    if (angkaBaru === row.pemakaianTagihVerif) return;

    void edit.onSimpanKoreksi(row, {
      ...dasar,
      pemakaianTagihVerif: angkaBaru,
    });
  }

  const tampilanTeks =
    row.pemakaianTagihVerif != null ? (
      <span className="font-semibold text-(--verif-correction)">
        {formatAngka(baris.hasilTagihan)}
      </span>
    ) : (
      formatAngka(baris.hasilTagihan)
    );

  if (sedangEdit) {
    return (
      <>
        <span className="invisible select-none">{tampilanTeks}</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoFocus
          value={nilai}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onChange={(e) => setNilai(bersihkanDigit(e.target.value))}
          onFocus={(e) => {
            if (nilai === nilaiDefaultStr) {
              e.currentTarget.select();
            } else {
              const len = e.currentTarget.value.length;
              e.currentTarget.setSelectionRange(len, len);
            }
          }}
          onBlur={() => komit()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter" || e.key === "ArrowDown") {
              e.preventDefault();
              const targetEl = e.currentTarget;
              komit();
              pindahFokusBarisTetangga(targetEl, "tagihan", "bawah");
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              const targetEl = e.currentTarget;
              komit();
              pindahFokusBarisTetangga(targetEl, "tagihan", "atas");
            } else if (e.key === "Escape") {
              e.preventDefault();
              batalRef.current = true;
              setSedangEdit(false);
              wrapperRef.current?.focus();
            }
          }}
          className={KELAS_INPUT_PENUH_SEL}
          aria-label="Koreksi Pemakaian Tagihan (m³)"
        />
      </>
    );
  }

  return (
    <div
      ref={wrapperRef}
      data-edit-col="tagihan"
      role={bisa ? "gridcell" : undefined}
      tabIndex={bisa ? 0 : undefined}
      onClick={
        bisa
          ? (e) => {
              if (barisAktif) {
                e.stopPropagation();
                bukaEditor();
              }
            }
          : undefined
      }
      onDoubleClick={
        bisa
          ? (e) => {
              e.stopPropagation();
              bukaEditor();
            }
          : undefined
      }
      onKeyDown={
        bisa
          ? (e) => {
              if (e.key === "Enter" || e.key === "F2") {
                e.preventDefault();
                e.stopPropagation();
                bukaEditor();
              } else if (/^\d$/.test(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                bukaEditor(e.key);
              } else if (e.key === "Backspace" || e.key === "Delete") {
                e.preventDefault();
                e.stopPropagation();
                bukaEditor("");
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                pindahFokusBarisTetangga(e.currentTarget, "tagihan", "bawah");
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                pindahFokusBarisTetangga(e.currentTarget, "tagihan", "atas");
              }
            }
          : undefined
      }
      className={cn("w-full", bisa && KELAS_TARGET_PENUH_SEL)}
    >
      {tampilanTeks}
    </div>
  );
}

// ============================================================================
// 5. SEL PAKAI / PEMAKAIAN M3 (Inline Input dinamis untuk Taksasi / Kebijakan)
// ============================================================================

export function SelPakaiEditable({
  baris,
  edit,
}: {
  baris: BarisTurunan;
  edit?: KonteksEditTabel;
}) {
  const row = baris.row;
  const bisa = Boolean(edit?.onSimpanKoreksi && (edit.bolehEdit?.(row) ?? true));
  const barisAktif = edit?.idTerpilih === baris.id;

  const [sedangEdit, setSedangEdit] = React.useState(false);
  const [nilai, setNilai] = React.useState("");
  const batalRef = React.useRef(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const nilaiDefault = baris.pemakaian;
  const nilaiDefaultStr = nilaiDefault != null ? String(nilaiDefault) : "";

  function bukaEditor(nilaiAwalOverride?: string) {
    if (!bisa) return;
    edit?.onPilihBaris?.(row);
    batalRef.current = false;
    setNilai(nilaiAwalOverride ?? nilaiDefaultStr);
    setSedangEdit(true);
  }

  function komit() {
    if (batalRef.current) {
      batalRef.current = false;
      setSedangEdit(false);
      return;
    }
    setSedangEdit(false);
    if (!edit?.onSimpanKoreksi) return;

    const trimmed = nilai.trim();
    const dasar = payloadSaatIni(row);

    // Jika dikosongkan -> reset pemakaianRevisi kembali ke perhitungan stand
    if (trimmed === "") {
      if (row.pemakaianRevisi == null) return;
      void edit.onSimpanKoreksi(row, {
        ...dasar,
        pemakaianRevisi: null,
      });
      return;
    }

    const angkaBaru = Number(trimmed);
    if (!Number.isInteger(angkaBaru) || angkaBaru < 0) {
      toast.error("Pemakaian (Pakai) harus bilangan bulat minimal 0.");
      return;
    }
    if (angkaBaru === baris.pemakaian && row.pemakaianRevisi != null) return;
    if (angkaBaru === baris.pemakaian && row.pemakaianRevisi == null) return;

    void edit.onSimpanKoreksi(row, {
      ...dasar,
      pemakaianRevisi: angkaBaru,
    });
  }

  const tampilanTeks =
    baris.pemakaianDikoreksi ? (
      <span className="font-semibold text-(--verif-correction)">
        {formatAngka(baris.pemakaian)}
      </span>
    ) : (
      formatAngka(baris.pemakaian)
    );

  if (sedangEdit) {
    return (
      <>
        <span className="invisible select-none">{tampilanTeks}</span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoFocus
          value={nilai}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onChange={(e) => setNilai(bersihkanDigit(e.target.value))}
          onFocus={(e) => {
            if (nilai === nilaiDefaultStr) {
              e.currentTarget.select();
            } else {
              const len = e.currentTarget.value.length;
              e.currentTarget.setSelectionRange(len, len);
            }
          }}
          onBlur={() => komit()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter" || e.key === "ArrowDown") {
              e.preventDefault();
              const targetEl = e.currentTarget;
              komit();
              pindahFokusBarisTetangga(targetEl, "pakai", "bawah");
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              const targetEl = e.currentTarget;
              komit();
              pindahFokusBarisTetangga(targetEl, "pakai", "atas");
            } else if (e.key === "Escape") {
              e.preventDefault();
              batalRef.current = true;
              setSedangEdit(false);
              wrapperRef.current?.focus();
            }
          }}
          className={KELAS_INPUT_PENUH_SEL}
          aria-label="Koreksi Pemakaian (m³)"
        />
      </>
    );
  }

  return (
    <div
      ref={wrapperRef}
      data-edit-col="pakai"
      role={bisa ? "gridcell" : undefined}
      tabIndex={bisa ? 0 : undefined}
      onClick={
        bisa
          ? (e) => {
              if (barisAktif) {
                e.stopPropagation();
                bukaEditor();
              }
            }
          : undefined
      }
      onDoubleClick={
        bisa
          ? (e) => {
              e.stopPropagation();
              bukaEditor();
            }
          : undefined
      }
      onKeyDown={
        bisa
          ? (e) => {
              if (e.key === "Enter" || e.key === "F2") {
                e.preventDefault();
                e.stopPropagation();
                bukaEditor();
              } else if (/^\d$/.test(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                bukaEditor(e.key);
              } else if (e.key === "Backspace" || e.key === "Delete") {
                e.preventDefault();
                e.stopPropagation();
                bukaEditor("");
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                pindahFokusBarisTetangga(e.currentTarget, "pakai", "bawah");
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                pindahFokusBarisTetangga(e.currentTarget, "pakai", "atas");
              }
            }
          : undefined
      }
      className={cn("w-full", bisa && KELAS_TARGET_PENUH_SEL)}
    >
      {tampilanTeks}
    </div>
  );
}
