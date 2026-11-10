"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  Filter,
  Minus,
  MoreVertical,
  Play,
  RotateCw,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  InfoSambunganAir,
  PeriodePemakaian,
  StatusPemakaian,
} from "../types/GrafikPemakaianTypes";
import { hitungRingkasan } from "../lib/perhitungan-pemakaian";
import {
  contoh18PeriodePemakaian,
  contohInfoSambungan,
} from "../lib/data-contoh-pemakaian";

interface KartuPemakaianAirProps {
  infoSambungan?: InfoSambunganAir;
  dataPeriode?: PeriodePemakaian[];
  onDeteksiAnomali?: () => void;
  onMuatUlang?: () => void;
}

export function KartuPemakaianAir({
  infoSambungan = contohInfoSambungan,
  dataPeriode = contoh18PeriodePemakaian,
  onDeteksiAnomali,
  onMuatUlang,
}: KartuPemakaianAirProps) {
  // State filter status
  const [filterStatus, setFilterStatus] = React.useState<string>("Semua Status");

  // State bar yang sedang aktif/dipilih (default: bar terakhir)
  const defaultBar = dataPeriode[dataPeriode.length - 1] ?? null;
  const [selectedBar, setSelectedBar] = React.useState<PeriodePemakaian | null>(
    defaultBar
  );
  const [hoveredBar, setHoveredBar] = React.useState<PeriodePemakaian | null>(
    null
  );

  // Bar yang sedang ditampilkan di baris detail
  const activeBar = hoveredBar || selectedBar || defaultBar;

  // Filter data jika ada pilihan status
  const displayedBars = React.useMemo(() => {
    if (filterStatus === "Semua Status") return dataPeriode;
    return dataPeriode.map((bar) => ({
      ...bar,
      isDimmed: bar.status !== filterStatus,
    }));
  }, [dataPeriode, filterStatus]);

  // Kalkulasi 4 ringkasan
  const ringkasan = React.useMemo(() => {
    return hitungRingkasan(dataPeriode, infoSambungan.batasWajarM3);
  }, [dataPeriode, infoSambungan.batasWajarM3]);

  // Dimensi Grafik SVG
  const chartWidth = 720;
  const chartHeight = 220;
  const paddingLeft = 36;
  const paddingRight = 24;
  const paddingTop = 32;
  const paddingBottom = 30;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const maxY = 60; // Skala sumbu Y maksimum 60 m³

  // Fungsi konversi nilai m3 ke koordinat Y
  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(val, maxY));
    return paddingTop + innerHeight - (clamped / maxY) * innerHeight;
  };

  const batasWajarY = getY(infoSambungan.batasWajarM3);
  const medianY = getY(20);
  const p95Y = getY(39);

  // Lebar per bar
  const barCount = displayedBars.length;
  const barSlotWidth = innerWidth / barCount;
  const barWidth = Math.min(22, barSlotWidth * 0.65);

  // Warna status
  const getStatusColor = (status: StatusPemakaian) => {
    switch (status) {
      case "Normal":
        return {
          main: "#10b981", // emerald-500
          bg: "rgba(16, 185, 129, 0.12)",
          badgeBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
        };
      case "Melewati Batas":
        return {
          main: "#f59e0b", // amber-500
          bg: "rgba(245, 158, 11, 0.15)",
          badgeBg: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
        };
      case "Anomali":
        return {
          main: "#ef4444", // red-500
          bg: "rgba(239, 68, 68, 0.18)",
          badgeBg: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
        };
      case "Tidak Terbaca":
      default:
        return {
          main: "#94a3b8", // slate-400
          bg: "rgba(148, 163, 184, 0.1)",
          badgeBg: "bg-muted text-muted-foreground border-border",
        };
    }
  };

  return (
    <div className="w-full rounded-[8px] border border-border bg-card text-card-foreground shadow-sm overflow-hidden select-none">
      {/* ========================================================= */}
      {/* A. HEADER KARTU                                           */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-border bg-card">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-heading-18 font-bold text-foreground tracking-tight">
              Pemakaian Air
            </h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-label-12 font-medium">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sehat</span>
            </div>
          </div>
          <p className="text-copy-13 text-muted-foreground mt-0.5">
            Sambungan {infoSambungan.nomorSambungan} • Dibaca bulanan oleh petugas dan mandiri
          </p>
        </div>

        {/* Tombol Kontrol Kanan */}
        <div className="flex items-center gap-1.5 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-copy-12 font-medium">
                <Filter className="size-3.5 text-muted-foreground" />
                <span>{filterStatus}</span>
                <ChevronDown className="size-3.5 text-muted-foreground opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-copy-13">
              <DropdownMenuItem onClick={() => setFilterStatus("Semua Status")}>
                Semua Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("Normal")}>
                Normal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("Melewati Batas")}>
                Melewati Batas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("Anomali")}>
                Anomali
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("Tidak Terbaca")}>
                Tidak Terbaca
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            title="Muat ulang data"
            onClick={onMuatUlang}
          >
            <RotateCw className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            title="Jalankan deteksi anomali ulang"
            onClick={onDeteksiAnomali}
          >
            <Play className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            title="Pengaturan"
          >
            <Settings className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            title="Menu lainnya"
          >
            <MoreVertical className="size-4" />
          </Button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* B. STRIP 4 RINGKASAN                                      */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border border-b border-border bg-muted/20">
        {[
          ringkasan.tingkatTerbaca,
          ringkasan.medianPemakaian,
          ringkasan.pemakaianTinggiP95,
          ringkasan.diAtasBatasWajar,
        ].map((item, idx) => {
          const toneClass =
            item.selisih.tone === "negative"
              ? "text-red-500 dark:text-rose-400"
              : item.selisih.tone === "positive"
              ? "text-emerald-500 dark:text-emerald-400"
              : "text-muted-foreground";

          return (
            <div key={idx} className="flex items-center justify-between p-4 min-w-0">
              <div className="min-w-0">
                <span className="text-label-12 font-normal text-muted-foreground block truncate">
                  {item.label}
                </span>
                <span className="text-[22px] font-bold text-foreground tracking-tight tabular-nums block mt-0.5">
                  {item.nilai}
                </span>
                <span className={`inline-flex items-center gap-0.5 text-copy-12 font-medium mt-0.5 ${toneClass}`}>
                  {item.selisih.arah === "down" && <ArrowDown className="size-3" />}
                  {item.selisih.arah === "up" && <ArrowUp className="size-3" />}
                  {item.selisih.arah === "neutral" && <Minus className="size-3" />}
                  <span>{item.selisih.teks}</span>
                </span>
              </div>

              {/* Sparkline Tipis Abu-abu */}
              <div className="w-16 h-8 shrink-0 flex items-end justify-end">
                <svg className="w-16 h-8 overflow-visible" viewBox="0 0 64 32">
                  {item.sparkline.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-muted-foreground/40"
                      points={item.sparkline
                        .map((val, sIdx) => {
                          const x = (sIdx / (item.sparkline.length - 1)) * 64;
                          const maxVal = Math.max(...item.sparkline, 1);
                          const y = 30 - (val / maxVal) * 26;
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        })
                        .join(" ")}
                    />
                  )}
                  {/* Titik Terakhir Lebih Gelap */}
                  {item.sparkline.length > 0 && (
                    <circle
                      cx="64"
                      cy={(
                        30 -
                        ((item.sparkline[item.sparkline.length - 1] ?? 0) /
                          Math.max(...item.sparkline, 1)) *
                          26
                      ).toFixed(1)}
                      r="2"
                      className="fill-foreground"
                    />
                  )}
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* C. BARIS DETAIL BAR TERPILIH                              */}
      {/* ========================================================= */}
      {activeBar && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-b border-border bg-card text-copy-13">
          {/* Sisi Kiri: Badge status, No Meter, Waktu Baca */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Badge
              variant="outline"
              className={`gap-1 px-2.5 py-0.5 text-label-12 font-semibold ${
                getStatusColor(activeBar.status).badgeBg
              }`}
            >
              {activeBar.status === "Anomali" && (
                <AlertTriangle className="size-3.5 stroke-[2.5]" />
              )}
              {activeBar.status === "Normal" && (
                <CheckCircle2 className="size-3.5 stroke-[2.5]" />
              )}
              <span>{activeBar.status}</span>
            </Badge>

            <span className="font-mono text-copy-12 font-medium text-foreground bg-muted px-1.5 py-0.5 rounded">
              {activeBar.nomorMeter || infoSambungan.nomorMeterDefault}
            </span>

            <span className="text-muted-foreground/60">•</span>

            <span className="text-muted-foreground">
              {activeBar.bulanTahun}
              {activeBar.waktuCatat ? `, dibaca ${activeBar.waktuCatat}` : " (Tidak ada bacaan)"}
            </span>
          </div>

          {/* Sisi Kanan: Rincian segmen per pola */}
          <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-copy-12">
            {activeBar.segmen ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="flex items-center gap-1.5" title="Blok 1 (0-10 m³)">
                  <span className="size-3.5 rounded-sm border border-border bg-[#e0e7ff] dark:bg-indigo-950 inline-block overflow-hidden">
                    <svg width="14" height="14">
                      <pattern id="mini-dots" width="4" height="4" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="0.8" fill="currentColor" className="text-foreground" />
                      </pattern>
                      <rect width="14" height="14" fill="url(#mini-dots)" />
                    </svg>
                  </span>
                  <span>{activeBar.segmen.blok1} m³</span>
                </span>

                <span className="flex items-center gap-1.5" title="Blok 2 (11-20 m³)">
                  <span className="size-3.5 rounded-sm border border-border bg-[#e0e7ff] dark:bg-indigo-950 inline-block overflow-hidden">
                    <svg width="14" height="14">
                      <pattern id="mini-diag" width="4" height="4" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="4" x2="4" y2="0" stroke="currentColor" strokeWidth="1" className="text-foreground" />
                      </pattern>
                      <rect width="14" height="14" fill="url(#mini-diag)" />
                    </svg>
                  </span>
                  <span>{activeBar.segmen.blok2} m³</span>
                </span>

                <span className="flex items-center gap-1.5" title="Blok 3 (> 20 m³)">
                  <span className="size-3.5 rounded-sm border border-border bg-[#e0e7ff] dark:bg-indigo-950 inline-block overflow-hidden">
                    <svg width="14" height="14">
                      <pattern id="mini-horiz" width="4" height="4" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="2" x2="4" y2="2" stroke="currentColor" strokeWidth="1" className="text-foreground" />
                      </pattern>
                      <rect width="14" height="14" fill="url(#mini-horiz)" />
                    </svg>
                  </span>
                  <span>{activeBar.segmen.blok3} m³</span>
                </span>

                <span className="text-foreground font-bold text-copy-14 pl-1">
                  {activeBar.totalM3} m³
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground italic">Tidak Terbaca</span>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* D. AREA GRAFIK SVG                                        */}
      {/* ========================================================= */}
      <div className="relative w-full p-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[620px] overflow-visible"
        >
          <defs>
            {/* Pola Blok 1: Titik-titik */}
            <pattern id="pattern-dots" width="6" height="6" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1.1" fill="currentColor" />
            </pattern>

            {/* Pola Blok 2: Garis Miring Diagonal */}
            <pattern id="pattern-diagonal" width="6" height="6" patternUnits="userSpaceOnUse">
              <line x1="0" y1="6" x2="6" y2="0" stroke="currentColor" strokeWidth="1.2" />
            </pattern>

            {/* Pola Blok 3: Garis Datar Horizontal */}
            <pattern id="pattern-horizontal" width="6" height="4" patternUnits="userSpaceOnUse">
              <line x1="0" y1="2" x2="6" y2="2" stroke="currentColor" strokeWidth="1.2" />
            </pattern>
          </defs>

          {/* 1. Sumbu Y Gridlines & Labels */}
          {[0, 20, 40, 60].map((val) => {
            const y = getY(val);
            return (
              <g key={val} className="text-muted-foreground/40 dark:text-muted-foreground/20">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray={val === 0 ? "none" : "3 3"}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground text-[11px] font-mono tabular-nums"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* 2. Rentang Normal (Median 20 - p95 39 m3) pita abu-abu putus */}
          <rect
            x={paddingLeft}
            y={p95Y}
            width={innerWidth}
            height={Math.max(0, medianY - p95Y)}
            fill="currentColor"
            className="text-muted/40 dark:text-muted/20"
          />
          <line
            x1={paddingLeft}
            y1={p95Y}
            x2={chartWidth - paddingRight}
            y2={p95Y}
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 4"
            className="text-muted-foreground/60"
          />

          {/* 3. Garis Ambang Putus Kuning: Batas Wajar 30 m3 */}
          <g>
            <line
              x1={paddingLeft}
              y1={batasWajarY}
              x2={chartWidth - paddingRight}
              y2={batasWajarY}
              stroke="#eab308"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <text
              x={chartWidth - paddingRight - 4}
              y={batasWajarY - 5}
              textAnchor="end"
              className="fill-amber-600 dark:fill-amber-400 text-[10.5px] font-medium"
            >
              Batas wajar 30 m³
            </text>
          </g>

          {/* 4. Batang Bar Bertumpuk (18 Periode) */}
          {displayedBars.map((item, idx) => {
            const slotX = paddingLeft + idx * barSlotWidth;
            const barX = slotX + (barSlotWidth - barWidth) / 2;
            const isHovered = hoveredBar?.id === item.id;
            const isSelected = selectedBar?.id === item.id;
            const statusColor = getStatusColor(item.status);
            const isDimmed = (item as unknown as { isDimmed?: boolean }).isDimmed;

            return (
              <g
                key={item.id}
                className="cursor-pointer transition-opacity"
                opacity={isDimmed ? 0.25 : 1}
                onMouseEnter={() => setHoveredBar(item)}
                onMouseLeave={() => setHoveredBar(null)}
                onClick={() => setSelectedBar(item)}
              >
                {/* Hitbox transparan untuk kenyamanan hover */}
                <rect
                  x={slotX}
                  y={paddingTop}
                  width={barSlotWidth}
                  height={innerHeight}
                  fill="transparent"
                />

                {/* Indikator Sorotan Bar Terpilih */}
                {(isHovered || isSelected) && (
                  <rect
                    x={slotX + 1}
                    y={paddingTop - 4}
                    width={barSlotWidth - 2}
                    height={innerHeight + 8}
                    fill="currentColor"
                    className="text-muted/30 rounded"
                    rx="4"
                  />
                )}

                {/* Kasus 1: Periode Tidak Terbaca (Bar bergaris putus dengan tanda -) */}
                {item.totalM3 === null || !item.segmen ? (
                  <g>
                    <rect
                      x={barX}
                      y={paddingTop + innerHeight - 40}
                      width={barWidth}
                      height={40}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      className="text-muted-foreground/60"
                      rx="3"
                    />
                    <text
                      x={barX + barWidth / 2}
                      y={paddingTop + innerHeight - 16}
                      textAnchor="middle"
                      className="fill-muted-foreground font-bold text-[14px]"
                    >
                      –
                    </text>
                  </g>
                ) : (
                  /* Kasus 2: Batang Bertumpuk 3 Blok */
                  (() => {
                    const b1Val = item.segmen.blok1;
                    const b2Val = item.segmen.blok2;
                    const b3Val = item.segmen.blok3;
                    const total = item.totalM3;

                    const totalHeight = (total / maxY) * innerHeight;
                    const b1Height = (b1Val / maxY) * innerHeight;
                    const b2Height = (b2Val / maxY) * innerHeight;
                    const b3Height = (b3Val / maxY) * innerHeight;

                    const baseY = paddingTop + innerHeight;
                    const b1Y = baseY - b1Height;
                    const b2Y = b1Y - b2Height;
                    const b3Y = b2Y - b3Height;

                    return (
                      <g>
                        {/* Latar Belakang Warna Status Pudar */}
                        <rect
                          x={barX}
                          y={baseY - totalHeight}
                          width={barWidth}
                          height={totalHeight}
                          fill={statusColor.bg}
                          rx="3"
                        />

                        {/* Segmen Blok 1 (Pola Titik) */}
                        {b1Height > 0 && (
                          <rect
                            x={barX}
                            y={b1Y}
                            width={barWidth}
                            height={b1Height}
                            fill="url(#pattern-dots)"
                            style={{ color: statusColor.main }}
                            className="transition-colors"
                          />
                        )}

                        {/* Segmen Blok 2 (Pola Garis Miring) */}
                        {b2Height > 0 && (
                          <rect
                            x={barX}
                            y={b2Y}
                            width={barWidth}
                            height={b2Height}
                            fill="url(#pattern-diagonal)"
                            style={{ color: statusColor.main }}
                            className="transition-colors"
                          />
                        )}

                        {/* Segmen Blok 3 (Pola Garis Datar) */}
                        {b3Height > 0 && (
                          <rect
                            x={barX}
                            y={b3Y}
                            width={barWidth}
                            height={b3Height}
                            fill="url(#pattern-horizontal)"
                            style={{ color: statusColor.main }}
                            className="transition-colors"
                          />
                        )}

                        {/* Bingkai Luar Tipis */}
                        <rect
                          x={barX}
                          y={baseY - totalHeight}
                          width={barWidth}
                          height={totalHeight}
                          fill="none"
                          stroke={statusColor.main}
                          strokeWidth={isHovered || isSelected ? 1.5 : 1}
                          rx="3"
                        />
                      </g>
                    );
                  })()
                )}

                {/* Segitiga Outlier di atas batang */}
                {item.isOutlier && item.totalM3 !== null && (
                  <polygon
                    points={`${barX + barWidth / 2},${getY(item.totalM3) - 10} ${
                      barX + barWidth / 2 - 4
                    },${getY(item.totalM3) - 4} ${barX + barWidth / 2 + 4},${
                      getY(item.totalM3) - 4
                    }`}
                    className="fill-foreground"
                    title="Outlier: Menyimpang dari pola historis"
                  />
                )}

                {/* Penanda Kejadian (misal: Meter diganti 12 Agu 2026) */}
                {item.kejadian && (
                  <g>
                    <line
                      x1={barX + barWidth / 2}
                      y1={paddingTop - 12}
                      x2={barX + barWidth / 2}
                      y2={paddingTop + innerHeight}
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeDasharray="2 2"
                      className="text-foreground/70"
                    />
                    <circle
                      cx={barX + barWidth / 2}
                      cy={paddingTop - 12}
                      r="2"
                      className="fill-foreground"
                    />
                    <text
                      x={barX + barWidth / 2}
                      y={paddingTop - 16}
                      textAnchor="middle"
                      className="fill-foreground text-[9.5px] font-medium"
                    >
                      {item.kejadian.keterangan}
                    </text>
                  </g>
                )}

                {/* Sumbu X: Label Bulan Jarang-jarang (setiap 3 bulan atau bulan kunci) */}
                {(idx % 3 === 0 || idx === displayedBars.length - 1) && (
                  <text
                    x={barX + barWidth / 2}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10.5px] font-mono tabular-nums"
                  >
                    {item.periode}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* ========================================================= */}
      {/* E. LEGENDA KARTU                                          */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 border-t border-border bg-muted/10 text-copy-12 text-muted-foreground">
        {/* Kiri: Keterangan Pola Blok Tarif */}
        <div className="flex items-center gap-4 flex-wrap font-medium">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm border border-border inline-block overflow-hidden bg-card">
              <svg width="12" height="12">
                <rect width="12" height="12" fill="url(#pattern-dots)" className="text-foreground" />
              </svg>
            </span>
            <span>Blok 1 (0–10 m³)</span>
          </span>

          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm border border-border inline-block overflow-hidden bg-card">
              <svg width="12" height="12">
                <rect width="12" height="12" fill="url(#pattern-diagonal)" className="text-foreground" />
              </svg>
            </span>
            <span>Blok 2 (11–20 m³)</span>
          </span>

          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm border border-border inline-block overflow-hidden bg-card">
              <svg width="12" height="12">
                <rect width="12" height="12" fill="url(#pattern-horizontal)" className="text-foreground" />
              </svg>
            </span>
            <span>Blok 3 (&gt;20 m³)</span>
          </span>
        </div>

        {/* Kanan: Keterangan Penanda Grafis */}
        <div className="flex items-center gap-3.5 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 bg-muted/80 border border-muted-foreground/30 border-dashed rounded-xs inline-block" />
            <span>Rentang normal</span>
          </span>

          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0 border-t-2 border-dashed border-amber-500 inline-block" />
            <span>Batas wajar (30 m³)</span>
          </span>

          <span className="flex items-center gap-1">
            <span className="inline-block text-[10px]">▲</span>
            <span>Outlier</span>
          </span>

          <span className="flex items-center gap-1">
            <span className="w-0.5 h-3 border-r border-dotted border-foreground inline-block" />
            <span>Kejadian</span>
          </span>
        </div>
      </div>
    </div>
  );
}
