// features/dashboard/import/lib/foto-backup.ts
// Metadata jenis foto + fungsi murni untuk modul Foto Backup.
import { Gauge, Home, ShieldCheck, type LucideIcon } from "lucide-react";
import type {
  CustomerPhotoGroup,
  ModeImportFilter,
  ParsedPhotoItem,
} from "../types/foto-backup.types";
import { FOTO_FILENAME_PATTERN } from "./import-config";
import type { ImportTone } from "./import-ui";

export type FotoJenis = Exclude<ModeImportFilter, "all">;
type FotoField = "fotoStand" | "fotoSegel" | "fotoRumah";

export interface FotoJenisMeta {
  key: FotoJenis;
  field: FotoField;
  icon: LucideIcon;
  tone: ImportTone;
  /** Kartu ringkasan. */
  summaryLabel: string;
  summaryCaption: string;
  /** Segmented filter. */
  filterLabel: string;
  /** Header kolom pada mode "semua" / mode tunggal. */
  columnAll: string;
  columnSingle: string;
  validLabel: string;
  altText: string;
  /** Label kelompok pada ringkasan hasil & tombol eksekusi. */
  groupLabel: string;
  actionLabel: string;
}

export const FOTO_JENIS: Record<FotoJenis, FotoJenisMeta> = {
  stand: {
    key: "stand",
    field: "fotoStand",
    icon: Gauge,
    tone: "blue",
    summaryLabel: "Foto Stand",
    summaryCaption: "Angka meter stand",
    filterLabel: "Stand Meter",
    columnAll: "Foto Stand Meter",
    columnSingle: "Berkas Foto Stand Meter",
    validLabel: "Stand Valid",
    altText: "Foto Stand Meter",
    groupLabel: "Foto Stand",
    actionLabel: "Petakan Foto Stand",
  },
  segel: {
    key: "segel",
    field: "fotoSegel",
    icon: ShieldCheck,
    tone: "amber",
    summaryLabel: "Foto Segel",
    summaryCaption: "Integritas fisik segel",
    filterLabel: "Segel Meter",
    columnAll: "Foto Segel Meter",
    columnSingle: "Berkas Foto Segel Meter",
    validLabel: "Segel Valid",
    altText: "Foto Segel Meter",
    groupLabel: "Foto Segel",
    actionLabel: "Petakan Foto Segel",
  },
  rumah: {
    key: "rumah",
    field: "fotoRumah",
    icon: Home,
    tone: "blue",
    summaryLabel: "Foto Rumah",
    summaryCaption: "Fasad & koordinat persil",
    filterLabel: "Fasad Rumah",
    columnAll: "Foto Rumah / Fasad",
    columnSingle: "Berkas Foto Fasad Rumah",
    validLabel: "Rumah Valid",
    altText: "Fasad Rumah",
    groupLabel: "Foto Rumah",
    actionLabel: "Petakan Foto Rumah",
  },
};

export const FOTO_JENIS_LIST: readonly FotoJenisMeta[] = [
  FOTO_JENIS.stand,
  FOTO_JENIS.segel,
  FOTO_JENIS.rumah,
];

export const FOTO_ALL_LABEL = "Semua Foto (Stand, Segel, Rumah)";

export const getModeLabel = (mode: ModeImportFilter) =>
  mode === "all" ? FOTO_ALL_LABEL : FOTO_JENIS[mode].groupLabel;

export const getExecuteLabel = (
  mode: ModeImportFilter,
  processCount: number,
  selectedCount: number,
) =>
  mode === "all"
    ? `Petakan ke Database (${processCount} Berkas · ${selectedCount} SL)`
    : `${FOTO_JENIS[mode].actionLabel} (${processCount} Berkas)`;

export const getFoto = (group: CustomerPhotoGroup, jenis: FotoJenis) =>
  group[FOTO_JENIS[jenis].field];

/** Jumlah foto milik satu pelanggan yang masuk dalam mode aktif. */
export const countFotoByMode = (
  group: CustomerPhotoGroup,
  mode: ModeImportFilter,
) =>
  FOTO_JENIS_LIST.filter(
    (meta) => (mode === "all" || mode === meta.key) && getFoto(group, meta.key),
  ).length;

export function parseFotoFileName(
  fileName: string,
): { thbl: string; jenis: FotoJenis; nolg: string } | null {
  const match = FOTO_FILENAME_PATTERN.exec(fileName);
  if (!match) return null;
  return {
    thbl: match[1],
    jenis: match[2].toLowerCase() as FotoJenis,
    nolg: match[3],
  };
}

/** `202601_stand_00703600750.jpg` -> `202601_stand_…` */
export function shortenFotoName(fileName: string, nolg: string): string {
  const base = fileName.replace(/\.[^.]+$/, "");
  return base.endsWith(nolg) ? `${base.slice(0, -nolg.length)}…` : base;
}

export function buildSearchText(group: CustomerPhotoGroup): string {
  return [
    group.nolg,
    group.nama,
    group.alamat,
    group.ruteKode,
    group.thbl,
    ...FOTO_JENIS_LIST.map((meta) => getFoto(group, meta.key)?.fileName),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export type IncomingPhotoGroups = Record<
  string,
  { thbl: string; photos: Partial<Record<FotoJenis, ParsedPhotoItem>> }
>;

/** Gabungkan berkas baru ke daftar pelanggan tanpa mengubah urutan yang sudah ada. */
export function mergePhotoGroups(
  previous: CustomerPhotoGroup[],
  incoming: IncomingPhotoGroups,
): CustomerPhotoGroup[] {
  const byNolg = new Map(previous.map((group) => [group.nolg, group]));

  for (const [nolg, data] of Object.entries(incoming)) {
    const base: CustomerPhotoGroup = byNolg.get(nolg) ?? {
      nolg,
      thbl: data.thbl,
      countLengkap: 0,
    };
    const merged: CustomerPhotoGroup = {
      ...base,
      fotoStand: data.photos.stand ?? base.fotoStand,
      fotoSegel: data.photos.segel ?? base.fotoSegel,
      fotoRumah: data.photos.rumah ?? base.fotoRumah,
    };
    merged.countLengkap = FOTO_JENIS_LIST.filter((meta) =>
      getFoto(merged, meta.key),
    ).length;
    byNolg.set(nolg, merged);
  }

  return Array.from(byNolg.values());
}

export function buildUploadPayload(
  customers: CustomerPhotoGroup[],
  mode: ModeImportFilter,
): { fileName: string; fileData: string }[] {
  const payload: { fileName: string; fileData: string }[] = [];
  for (const customer of customers) {
    for (const meta of FOTO_JENIS_LIST) {
      if (mode !== "all" && mode !== meta.key) continue;
      const foto = getFoto(customer, meta.key);
      if (foto) payload.push({ fileName: foto.fileName, fileData: foto.url });
    }
  }
  return payload;
}
