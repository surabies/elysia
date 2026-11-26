"use client";

// features/dashboard/pengaduan/components/papan-pengaduan/SkemaFilterPengaduan.tsx
// Skema Filter REUI (+ Filter) untuk Pengaduan Air:
// Menyatukan Status Tiket, Prioritas, Jenis Keluhan, dan Status Tenggat SLA
// ke dalam satu pill bar REUI yang compact, enterprise, dan premium di Navbar.

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
  Flame,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { LABEL_JENIS_PENGADUAN } from "@/features/public/lib/format";
import {
  LABEL_PRIORITAS_PENGADUAN,
  LABEL_STATUS_PENGADUAN_STAF_RINGKAS,
} from "@/features/langganan/pengaduan/lib/LabelPengaduan";

export interface PengaduanTone {
  value: string;
  label: string;
  dot: string;
  badge: string;
}

export const STATUS_PENGADUAN_TONES: PengaduanTone[] = [
  {
    value: "BARU",
    label: LABEL_STATUS_PENGADUAN_STAF_RINGKAS.BARU ?? "Baru",
    dot: "bg-blue-500",
    badge:
      "border-blue-500/25 bg-blue-500/15 text-blue-800 dark:border-blue-400/30 dark:bg-blue-400/20 dark:text-blue-300",
  },
  {
    value: "TERVERIFIKASI",
    label: LABEL_STATUS_PENGADUAN_STAF_RINGKAS.TERVERIFIKASI ?? "Terverifikasi",
    dot: "bg-sky-500",
    badge:
      "border-sky-500/25 bg-sky-500/15 text-sky-800 dark:border-sky-400/30 dark:bg-sky-400/20 dark:text-sky-300",
  },
  {
    value: "DITUGASKAN",
    label: LABEL_STATUS_PENGADUAN_STAF_RINGKAS.DITUGASKAN ?? "Ditugaskan",
    dot: "bg-amber-500",
    badge:
      "border-amber-500/25 bg-amber-500/15 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/20 dark:text-amber-300",
  },
  {
    value: "MENUJU_LOKASI",
    label: LABEL_STATUS_PENGADUAN_STAF_RINGKAS.MENUJU_LOKASI ?? "Menuju Lokasi",
    dot: "bg-indigo-500",
    badge:
      "border-indigo-500/25 bg-indigo-500/15 text-indigo-800 dark:border-indigo-400/30 dark:bg-indigo-400/20 dark:text-indigo-300",
  },
  {
    value: "DIPROSES",
    label: LABEL_STATUS_PENGADUAN_STAF_RINGKAS.DIPROSES ?? "Diproses",
    dot: "bg-amber-500",
    badge:
      "border-amber-500/25 bg-amber-500/15 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/20 dark:text-amber-300",
  },
  {
    value: "MENUNGGU_PELANGGAN",
    label: LABEL_STATUS_PENGADUAN_STAF_RINGKAS.MENUNGGU_PELANGGAN ?? "Menunggu Pelanggan",
    dot: "bg-zinc-400",
    badge:
      "border-border bg-muted/60 text-muted-foreground",
  },
  {
    value: "SELESAI",
    label: LABEL_STATUS_PENGADUAN_STAF_RINGKAS.SELESAI ?? "Selesai",
    dot: "bg-emerald-500",
    badge:
      "border-emerald-500/25 bg-emerald-500/15 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/20 dark:text-emerald-300",
  },
  {
    value: "DITUTUP",
    label: LABEL_STATUS_PENGADUAN_STAF_RINGKAS.DITUTUP ?? "Ditutup",
    dot: "bg-zinc-500",
    badge:
      "border-border bg-muted/60 text-muted-foreground",
  },
  {
    value: "DITOLAK",
    label: LABEL_STATUS_PENGADUAN_STAF_RINGKAS.DITOLAK ?? "Ditolak",
    dot: "bg-rose-500",
    badge:
      "border-rose-500/25 bg-rose-500/15 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/20 dark:text-rose-300",
  },
];

export const PRIORITAS_PENGADUAN_TONES: PengaduanTone[] = [
  {
    value: "DARURAT",
    label: LABEL_PRIORITAS_PENGADUAN.DARURAT ?? "Darurat",
    dot: "bg-rose-500",
    badge:
      "border-rose-500/25 bg-rose-500/15 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/20 dark:text-rose-300",
  },
  {
    value: "TINGGI",
    label: LABEL_PRIORITAS_PENGADUAN.TINGGI ?? "Tinggi",
    dot: "bg-amber-500",
    badge:
      "border-amber-500/25 bg-amber-500/15 text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/20 dark:text-amber-300",
  },
  {
    value: "NORMAL",
    label: LABEL_PRIORITAS_PENGADUAN.NORMAL ?? "Normal",
    dot: "bg-blue-500",
    badge:
      "border-blue-500/25 bg-blue-500/15 text-blue-800 dark:border-blue-400/30 dark:bg-blue-400/20 dark:text-blue-300",
  },
  {
    value: "RENDAH",
    label: LABEL_PRIORITAS_PENGADUAN.RENDAH ?? "Rendah",
    dot: "bg-zinc-400",
    badge: "border-border bg-muted/60 text-muted-foreground",
  },
];

export const SLA_PENGADUAN_TONES: PengaduanTone[] = [
  {
    value: "LEWAT_SLA",
    label: "Lewat Tenggat SLA",
    dot: "bg-rose-500",
    badge:
      "border-rose-500/25 bg-rose-500/15 text-rose-800 dark:border-rose-400/30 dark:bg-rose-400/20 dark:text-rose-300",
  },
];

export const JENIS_PENGADUAN_TONES: PengaduanTone[] = Object.entries(
  LABEL_JENIS_PENGADUAN
).map(([val, lbl]) => ({
  value: val,
  label: lbl,
  dot: "bg-sky-500",
  badge:
    "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/15 dark:text-sky-300",
}));

export const ALL_PENGADUAN_TONES = new Map<string, PengaduanTone>(
  [
    ...STATUS_PENGADUAN_TONES,
    ...PRIORITAS_PENGADUAN_TONES,
    ...SLA_PENGADUAN_TONES,
    ...JENIS_PENGADUAN_TONES,
  ].map((t) => [t.value, t])
);

function Swatch({ tone }: { tone: PengaduanTone }) {
  return <span className={cn("size-2.5 shrink-0 rounded-full", tone.dot)} />;
}

function toOptions(tones: PengaduanTone[]): FilterOption[] {
  return tones.map((tone) => ({
    value: tone.value,
    label: tone.label,
    icon: <Swatch tone={tone} />,
  }));
}

function BadgesValue({
  options,
  fallback,
}: {
  options: FilterOption[];
  fallback: string;
}) {
  if (options.length === 0) return <>{fallback}</>;
  return (
    <span className="flex items-center gap-1.5">
      {options.map((opt) => (
        <Badge
          key={opt.value}
          variant="outline"
          className={cn(
            "px-2 py-0.5 text-[11px] font-medium leading-none",
            ALL_PENGADUAN_TONES.get(opt.value)?.badge
          )}
        >
          {opt.label}
        </Badge>
      ))}
    </span>
  );
}

export interface FilterPengaduanState {
  status: string;
  prioritas: string;
  jenis: string;
  slaMelanggar: boolean;
}

export function buatSkemaFilterPengaduan(): FilterField[] {
  return [
    {
      id: "status",
      label: "Status Tiket",
      type: "select",
      defaultOperator: "is",
      options: toOptions(STATUS_PENGADUAN_TONES),
      searchable: false,
      renderValue: ({ options }) => (
        <BadgesValue options={options} fallback="Semua Status" />
      ),
      icon: <ShieldCheck className="size-3.5" />,
    },
    {
      id: "prioritas",
      label: "Prioritas",
      type: "select",
      defaultOperator: "is",
      options: toOptions(PRIORITAS_PENGADUAN_TONES),
      searchable: false,
      renderValue: ({ options }) => (
        <BadgesValue options={options} fallback="Semua Prioritas" />
      ),
      icon: <Flame className="size-3.5" />,
    },
    {
      id: "jenis",
      label: "Jenis Pengaduan",
      type: "select",
      defaultOperator: "is",
      options: toOptions(JENIS_PENGADUAN_TONES),
      searchable: true,
      renderValue: ({ options }) => (
        <BadgesValue options={options} fallback="Semua Jenis" />
      ),
      icon: <Tag className="size-3.5" />,
    },
    {
      id: "sla",
      label: "Tenggat SLA",
      type: "select",
      defaultOperator: "is",
      options: toOptions(SLA_PENGADUAN_TONES),
      searchable: false,
      renderValue: ({ options }) => (
        <BadgesValue options={options} fallback="Semua" />
      ),
      icon: <AlertTriangle className="size-3.5" />,
    },
  ];
}

export function filterPengaduanToQuery(
  state: FilterPengaduanState
): FilterQuery {
  const rules = [];
  if (state.status && state.status !== "SEMUA") {
    rules.push(
      createFilterRule({
        id: "rule-status-pengaduan",
        path: ["status"],
        operator: "is",
        value: state.status,
      })
    );
  }
  if (state.prioritas && state.prioritas !== "SEMUA") {
    rules.push(
      createFilterRule({
        id: "rule-prioritas-pengaduan",
        path: ["prioritas"],
        operator: "is",
        value: state.prioritas,
      })
    );
  }
  if (state.jenis && state.jenis !== "SEMUA") {
    rules.push(
      createFilterRule({
        id: "rule-jenis-pengaduan",
        path: ["jenis"],
        operator: "is",
        value: state.jenis,
      })
    );
  }
  if (state.slaMelanggar) {
    rules.push(
      createFilterRule({
        id: "rule-sla-pengaduan",
        path: ["sla"],
        operator: "is",
        value: "LEWAT_SLA",
      })
    );
  }
  return createFilterQuery(rules);
}

export function queryToFilterPengaduan(
  query: FilterQuery
): FilterPengaduanState {
  let status = "SEMUA";
  let prioritas = "SEMUA";
  let jenis = "SEMUA";
  let slaMelanggar = false;

  const rules = flattenFilterRules(query);
  for (const r of rules) {
    const key = r.path[0];
    const val = r.value as any;
    const strVal = Array.isArray(val) ? (val[0] ?? "") : (val ?? "");

    if (key === "status" && strVal) {
      status = strVal;
    } else if (key === "prioritas" && strVal) {
      prioritas = strVal;
    } else if (key === "jenis" && strVal) {
      jenis = strVal;
    } else if (key === "sla") {
      slaMelanggar = strVal === "LEWAT_SLA";
    }
  }

  return {
    status,
    prioritas,
    jenis,
    slaMelanggar,
  };
}
