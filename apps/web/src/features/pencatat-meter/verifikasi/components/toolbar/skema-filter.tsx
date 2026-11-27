"use client";

// components/tanstacktable/components/toolbar/skema-filter.tsx
// Skema Filter REUI untuk Verifikasi Pembacaan Meter
// Mengikuti pola resmi di @/components/reui/contoh-filter.tsx dengan
// Tone, Swatch, toOptions, BadgesOrStack, StackedDots, dan FilterField[].
// Menyatukan Petugas, Rute, Status, Anomali, Kondisi Meter, dan Asal Laporan ke dalam satu Add Filter.

import * as React from "react";
import type {
  FilterField,
  FilterOption,
  FilterQuery,
} from "@/components/reui/filters/filters-types";
import {
  createFilterQuery,
  createFilterRule,
  flattenFilterRules,
} from "@/components/reui/filters/filters-query";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/reui/badge";
import {
  AlertTriangle,
  Droplets,
  MapPin,
  Radio,
  ShieldCheck,
  Tag,
  UserCheck,
} from "lucide-react";
import { LABEL_KONDISI_CATAT } from "../../lib/label-pencatatan";
import type { FilterVerifikasi } from "../BilahVerifikasi";

/* -------------------------------------------------------------------------- */
/*                                   Tones                                    */
/* -------------------------------------------------------------------------- */

export interface Tone {
  value: string;
  label: string;
  dot: string;
  badge: string;
}

export const STATUS_TONES: Tone[] = [
  {
    value: "SUBMITTED",
    label: "Menunggu",
    dot: "bg-muted-foreground/60",
    badge:
      "border-border bg-muted/60 text-muted-foreground dark:border-border dark:bg-muted/40 dark:text-muted-foreground",
  },
  {
    value: "VERIFIED_L1",
    label: "V1",
    dot: "bg-amber-500",
    badge:
      "border-amber-500/25 bg-amber-500/15 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/20 dark:text-amber-300",
  },
  {
    value: "VERIFIED_L2",
    label: "V2",
    dot: "bg-blue-500",
    badge:
      "border-blue-500/25 bg-blue-500/15 text-blue-800 dark:border-blue-400/30 dark:bg-blue-400/20 dark:text-blue-300",
  },
  {
    value: "APPROVED_FINAL",
    label: "V3",
    dot: "bg-emerald-500",
    badge:
      "border-emerald-500/25 bg-emerald-500/15 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/20 dark:text-emerald-300",
  },
  {
    value: "NEED_RESURVEY",
    label: "Cek Ulang",
    dot: "bg-rose-500",
    badge:
      "border-rose-500/25 bg-rose-500/15 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/20 dark:text-rose-300",
  },
];

export const ANOMALI_TONES: Tone[] = [
  {
    value: "ANOMALI",
    label: "Anomali",
    dot: "bg-rose-500",
    badge:
      "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:border-rose-400/25 dark:bg-rose-400/15 dark:text-rose-300",
  },
  {
    value: "NORMAL",
    label: "Normal",
    dot: "bg-emerald-500",
    badge:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/15 dark:text-emerald-300",
  },
];

export const PEMAKAIAN_TONES: Tone[] = [
  {
    value: "MINUS",
    label: "Pemakaian Minus (< 0 m³)",
    dot: "bg-rose-500",
    badge:
      "border-rose-500/25 bg-rose-500/15 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/20 dark:text-rose-300",
  },
  {
    value: "NOL",
    label: "Pemakaian Nol (0 m³)",
    dot: "bg-amber-500",
    badge:
      "border-amber-500/25 bg-amber-500/15 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/20 dark:text-amber-300",
  },
  {
    value: "POSITIF",
    label: "Pemakaian Positif (> 0 m³)",
    dot: "bg-emerald-500",
    badge:
      "border-emerald-500/25 bg-emerald-500/15 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/20 dark:text-emerald-300",
  },
];

export const ASAL_TONES: Tone[] = [
  {
    value: "PETUGAS",
    label: "Petugas",
    dot: "bg-blue-500",
    badge:
      "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/15 dark:text-blue-300",
  },
  {
    value: "KONSUMEN",
    label: "Mandiri",
    dot: "bg-teal-500",
    badge:
      "border-teal-500/20 bg-teal-500/10 text-teal-700 dark:border-teal-400/25 dark:bg-teal-400/15 dark:text-teal-300",
  },
  {
    value: "MANUAL_SATUAN",
    label: "Manual Satuan",
    dot: "bg-purple-500",
    badge:
      "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:border-purple-400/25 dark:bg-purple-400/15 dark:text-purple-300",
  },
  {
    value: "MANUAL_MASSAL",
    label: "Manual Massal",
    dot: "bg-indigo-500",
    badge:
      "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400/25 dark:bg-indigo-400/15 dark:text-indigo-300",
  },
];

const WARNA_KONDISI: Record<string, { dot: string; badge: string }> = {
  NORMAL: {
    dot: "bg-emerald-500",
    badge:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/15 dark:text-emerald-300",
  },
  KABUR: {
    dot: "bg-amber-500",
    badge:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/15 dark:text-amber-300",
  },
  RUSAK: {
    dot: "bg-rose-500",
    badge:
      "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:border-rose-400/25 dark:bg-rose-400/15 dark:text-rose-300",
  },
  TERBALIK: {
    dot: "bg-violet-500",
    badge:
      "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:border-violet-400/25 dark:bg-violet-400/15 dark:text-violet-300",
  },
  TERKUNCI: {
    dot: "bg-orange-500",
    badge:
      "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:border-orange-400/25 dark:bg-orange-400/15 dark:text-orange-300",
  },
  RUMAH_KOSONG: {
    dot: "bg-zinc-400",
    badge:
      "border-zinc-500/20 bg-zinc-500/10 text-zinc-700 dark:border-zinc-400/25 dark:bg-zinc-400/15 dark:text-zinc-300",
  },
};

const DEFAULT_TONE = {
  dot: "bg-sky-500",
  badge:
    "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/15 dark:text-sky-300",
};

export const KONDISI_TONES: Tone[] = Object.entries(LABEL_KONDISI_CATAT).map(
  ([val, lbl]) => ({
    value: val,
    label: lbl,
    dot: WARNA_KONDISI[val]?.dot ?? DEFAULT_TONE.dot,
    badge: WARNA_KONDISI[val]?.badge ?? DEFAULT_TONE.badge,
  }),
);

export const STATUS_MANDIRI_TONES: Tone[] = [
  {
    value: "MENUNGGU",
    label: "Menunggu",
    dot: "bg-muted-foreground/60",
    badge:
      "border-border bg-muted/60 text-muted-foreground dark:border-border dark:bg-muted/40 dark:text-muted-foreground",
  },
  {
    value: "DIVERIFIKASI",
    label: "Terverifikasi",
    dot: "bg-emerald-500",
    badge:
      "border-emerald-500/25 bg-emerald-500/15 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/20 dark:text-emerald-300",
  },
  {
    value: "DITOLAK",
    label: "Ditolak",
    dot: "bg-rose-500",
    badge:
      "border-rose-500/25 bg-rose-500/15 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/20 dark:text-rose-300",
  },
];

export const ALL_TONES = new Map<string, Tone>(
  [
    ...STATUS_TONES,
    ...STATUS_MANDIRI_TONES,
    ...ANOMALI_TONES,
    ...PEMAKAIAN_TONES,
    ...ASAL_TONES,
    ...KONDISI_TONES,
  ].map((tone) => [tone.value, tone]),
);

/* -------------------------------------------------------------------------- */
/*                              Value Renderers                               */
/* -------------------------------------------------------------------------- */

export function Swatch({ tone }: { tone: Tone }) {
  return <span className={cn("size-2.5 shrink-0 rounded-full", tone.dot)} />;
}

export function toOptions(tones: Tone[]): FilterOption[] {
  return tones.map((tone) => ({
    value: tone.value,
    label: tone.label,
    icon: <Swatch tone={tone} />,
  }));
}

const BADGE_LIMIT = 2;

export function StackedDots({
  options,
  toneMap = ALL_TONES,
}: {
  options: FilterOption[];
  toneMap?: Map<string, Tone>;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex items-center">
        {options.slice(0, 4).map((option) => (
          <span
            key={option.value}
            className={cn(
              "ring-background -ml-1 size-2.5 rounded-full ring-2 first:ml-0",
              toneMap.get(option.value)?.dot ?? "bg-muted-foreground",
            )}
          />
        ))}
      </span>
      <span className="text-muted-foreground text-xs tabular-nums">
        {options.length}
      </span>
    </span>
  );
}

export function BadgesOrStack({
  options,
  fallback,
  toneMap = ALL_TONES,
}: {
  options: FilterOption[];
  fallback: string;
  toneMap?: Map<string, Tone>;
}) {
  if (options.length === 0) return <>{fallback}</>;
  if (options.length > BADGE_LIMIT) {
    return <StackedDots options={options} toneMap={toneMap} />;
  }

  return (
    <span className="flex items-center gap-1.5">
      {options.map((option) => (
        <Badge
          key={option.value}
          variant="outline"
          className={cn(
            "px-2 py-0.5 text-[11px] font-medium leading-none",
            toneMap.get(option.value)?.badge,
          )}
        >
          {option.label}
        </Badge>
      ))}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Schema Builder                                */
/* -------------------------------------------------------------------------- */

export interface OpsiSkemaFilter {
  pencatats?: { id: string; namaLapangan: string }[];
  rutes?: { id: string; kode: string }[];
  ambangAnomali?: number;
}

export function buatSkemaFilter({
  pencatats = [],
  rutes = [],
  ambangAnomali = 50,
}: OpsiSkemaFilter = {}): FilterField[] {
  const fields: FilterField[] = [];

  // 1. Petugas (Pencatat Lapangan)
  if (pencatats.length > 0) {
    fields.push({
      id: "pencatatId",
      label: "Petugas",
      type: "select",
      defaultOperator: "is",
      options: pencatats.map((p) => ({
        value: p.id,
        label: p.namaLapangan,
      })),
      searchable: true,
      renderValue: ({ options }) => {
        if (!options.length) return "Semua Petugas";
        return (
          <span className="flex items-center gap-1">
            {options.map((opt) => (
              <Badge
                key={opt.value}
                variant="outline"
                className="border-primary/25 bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-medium leading-none"
              >
                {opt.label}
              </Badge>
            ))}
          </span>
        );
      },
      icon: <UserCheck className="size-3.5" />,
    });
  }

  // 2. Rute Baca
  if (rutes.length > 0) {
    fields.push({
      id: "ruteId",
      label: "Rute",
      type: "select",
      defaultOperator: "is",
      options: rutes.map((r) => ({
        value: r.id,
        label: `Rute ${r.kode}`,
      })),
      searchable: true,
      renderValue: ({ options }) => {
        if (!options.length) return "Semua Rute";
        return (
          <span className="flex items-center gap-1">
            {options.map((opt) => (
              <Badge
                key={opt.value}
                variant="outline"
                className="border-sky-500/25 bg-sky-500/10 text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/15 dark:text-sky-300 px-2 py-0.5 text-[11px] font-medium leading-none"
              >
                {opt.label}
              </Badge>
            ))}
          </span>
        );
      },
      icon: <MapPin className="size-3.5" />,
    });
  }

  // 3. Status Verifikasi
  fields.push({
    id: "statusVerif",
    label: "Status",
    type: "select",
    defaultOperator: "is",
    options: toOptions(STATUS_TONES),
    searchable: false,
    renderValue: ({ options }) => (
      <BadgesOrStack
        options={options}
        fallback="Semua Status"
        toneMap={ALL_TONES}
      />
    ),
    icon: <ShieldCheck className="size-3.5" />,
  });

  // 4. Pemakaian Kubikasi (Minus / Nol / Positif)
  fields.push({
    id: "filterPemakaian",
    label: "Pemakaian",
    type: "select",
    defaultOperator: "is",
    options: toOptions(PEMAKAIAN_TONES),
    searchable: false,
    renderValue: ({ options }) => (
      <BadgesOrStack
        options={options}
        fallback="Semua Pemakaian"
        toneMap={ALL_TONES}
      />
    ),
    icon: <Droplets className="size-3.5" />,
  });

  // 5. Anomali
  fields.push({
    id: "anomali",
    label: `Anomali (>±${ambangAnomali}%)`,
    type: "select",
    defaultOperator: "is",
    options: toOptions(ANOMALI_TONES),
    searchable: false,
    renderValue: ({ options }) => (
      <BadgesOrStack
        options={options}
        fallback="Semua"
        toneMap={ALL_TONES}
      />
    ),
    icon: <AlertTriangle className="size-3.5" />,
  });

  // 5. Kondisi Meter
  fields.push({
    id: "kondisi",
    label: "Kondisi Meter",
    type: "select",
    defaultOperator: "is",
    options: toOptions(KONDISI_TONES),
    searchable: true,
    renderValue: ({ options }) => (
      <BadgesOrStack
        options={options}
        fallback="Semua Kondisi"
        toneMap={ALL_TONES}
      />
    ),
    icon: <Tag className="size-3.5" />,
  });

  // 6. Asal Laporan
  fields.push({
    id: "jenisInput",
    label: "Asal Laporan",
    type: "select",
    defaultOperator: "is",
    options: toOptions(ASAL_TONES),
    searchable: false,
    renderValue: ({ options }) => (
      <BadgesOrStack
        options={options}
        fallback="Semua Asal"
        toneMap={ALL_TONES}
      />
    ),
    icon: <Radio className="size-3.5" />,
  });

  return fields;
}

/* -------------------------------------------------------------------------- */
/*                           Query Synchronization                            */
/* -------------------------------------------------------------------------- */

export function filterVerifikasiToQuery(filter: FilterVerifikasi): FilterQuery {
  const rules = [];

  if (filter.pencatatId) {
    rules.push(
      createFilterRule({
        id: "rule-petugas",
        path: ["pencatatId"],
        operator: "is",
        value: filter.pencatatId,
      }),
    );
  }

  if (filter.ruteId) {
    rules.push(
      createFilterRule({
        id: "rule-rute",
        path: ["ruteId"],
        operator: "is",
        value: filter.ruteId,
      }),
    );
  }

  if (filter.statusVerif) {
    rules.push(
      createFilterRule({
        id: "rule-status",
        path: ["statusVerif"],
        operator: "is",
        value: filter.statusVerif,
      }),
    );
  }

  if (filter.hanyaAnomali) {
    const val =
      filter.hanyaAnomali === true ||
      filter.hanyaAnomali === "true" ||
      filter.hanyaAnomali === "ANOMALI"
        ? "ANOMALI"
        : filter.hanyaAnomali === "false" || filter.hanyaAnomali === "NORMAL"
          ? "NORMAL"
          : undefined;
    if (val) {
      rules.push(
        createFilterRule({
          id: "rule-anomali",
          path: ["anomali"],
          operator: "is",
          value: val,
        }),
      );
    }
  }

  if (filter.filterPemakaian) {
    rules.push(
      createFilterRule({
        id: "rule-pemakaian",
        path: ["filterPemakaian"],
        operator: "is",
        value: filter.filterPemakaian,
      }),
    );
  }

  if (filter.kondisi) {
    rules.push(
      createFilterRule({
        id: "rule-kondisi",
        path: ["kondisi"],
        operator: "is",
        value: filter.kondisi,
      }),
    );
  }

  if (filter.jenisInput) {
    rules.push(
      createFilterRule({
        id: "rule-jenisInput",
        path: ["jenisInput"],
        operator: "is",
        value: filter.jenisInput,
      }),
    );
  }

  return createFilterQuery(rules);
}

export function queryToFilterVerifikasi(
  query: FilterQuery,
  prev: FilterVerifikasi,
): FilterVerifikasi {
  let statusVerif = "";
  let pencatatId = "";
  let ruteId = "";
  let hanyaAnomali = false;
  let filterPemakaian = "";
  let kondisi = "";
  let jenisInput = "";

  const rules = flattenFilterRules(query);
  for (const r of rules) {
    const key = r.path[0];
    const val = r.value as any;

    if (key === "pencatatId") {
      pencatatId = Array.isArray(val) ? (val[0] ?? "") : (val ?? "");
    } else if (key === "ruteId") {
      ruteId = Array.isArray(val) ? (val[0] ?? "") : (val ?? "");
    } else if (key === "statusVerif") {
      statusVerif = Array.isArray(val) ? (val[0] ?? "") : (val ?? "");
    } else if (key === "filterPemakaian") {
      filterPemakaian = Array.isArray(val) ? (val[0] ?? "") : (val ?? "");
    } else if (key === "anomali") {
      if (Array.isArray(val)) {
        hanyaAnomali = val.includes("ANOMALI")
          ? ("ANOMALI" as any)
          : val.includes("NORMAL")
            ? ("NORMAL" as any)
            : false;
      } else {
        hanyaAnomali =
          val === "ANOMALI"
            ? ("ANOMALI" as any)
            : val === "NORMAL"
              ? ("NORMAL" as any)
              : false;
      }
    } else if (key === "kondisi") {
      kondisi = Array.isArray(val) ? (val[0] ?? "") : (val ?? "");
    } else if (key === "jenisInput") {
      jenisInput = Array.isArray(val) ? (val[0] ?? "") : (val ?? "");
    }
  }

  return {
    ...prev,
    statusVerif,
    pencatatId,
    ruteId,
    hanyaAnomali,
    filterPemakaian,
    kondisi,
    jenisInput,
  };
}

/**
 * Skema Filter REUI khusus Verifikasi Mandiri Pelanggan (Status & Pemakaian)
 */
export function buatSkemaFilterMandiri(): FilterField[] {
  return [
    {
      id: "status",
      label: "Status",
      type: "select",
      defaultOperator: "is",
      options: toOptions(STATUS_MANDIRI_TONES),
      searchable: false,
      renderValue: ({ options }) => (
        <BadgesOrStack
          options={options}
          fallback="Semua Status"
          toneMap={ALL_TONES}
        />
      ),
      icon: <ShieldCheck className="size-3.5" />,
    },
    {
      id: "filterPemakaian",
      label: "Pemakaian",
      type: "select",
      defaultOperator: "is",
      options: toOptions(PEMAKAIAN_TONES),
      searchable: false,
      renderValue: ({ options }) => (
        <BadgesOrStack
          options={options}
          fallback="Semua Pemakaian"
          toneMap={ALL_TONES}
        />
      ),
      icon: <Droplets className="size-3.5" />,
    },
  ];
}

export function filterMandiriToQuery(filter: {
  status: string;
  filterPemakaian?: string;
}): FilterQuery {
  const rules = [];
  if (filter.status) {
    rules.push(
      createFilterRule({
        id: "rule-status-mandiri",
        path: ["status"],
        operator: "is",
        value: filter.status,
      }),
    );
  }
  if (filter.filterPemakaian) {
    rules.push(
      createFilterRule({
        id: "rule-pemakaian-mandiri",
        path: ["filterPemakaian"],
        operator: "is",
        value: filter.filterPemakaian,
      }),
    );
  }
  return createFilterQuery(rules);
}

export function queryToFilterMandiri(
  query: FilterQuery,
  current: { status: string; filterPemakaian?: string },
): { status: string; filterPemakaian: string } {
  const rules = flattenFilterRules(query);
  let status = "";
  let filterPemakaian = "";
  for (const rule of rules) {
    const key = rule.path[0];
    const val = rule.value as any;
    if (key === "status") {
      status = Array.isArray(val) ? (val[0] ?? "") : (val ?? "");
    } else if (key === "filterPemakaian") {
      filterPemakaian = Array.isArray(val) ? (val[0] ?? "") : (val ?? "");
    }
  }
  return { ...current, status, filterPemakaian };
}
