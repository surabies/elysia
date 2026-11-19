"use client";

import * as React from "react";
import {
  ChevronRight,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { BroadcastDetailModal } from "@/components/home/BroadcastDetailModal";
import { HaloBadge } from "@/components/ui/halo-badge";
import { DAFTAR_BROADCAST_AWAL } from "@/data/broadcast";
import type { BroadcastGangguanItem } from "@/types/broadcast";

interface BroadcastGangguanBannerProps {
  daftarBroadcast?: BroadcastGangguanItem[];
}

export function BroadcastGangguanBanner({
  daftarBroadcast = DAFTAR_BROADCAST_AWAL,
}: BroadcastGangguanBannerProps) {
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [modalBuka, setModalBuka] = React.useState(false);
  const [selectedItem, setSelectedItem] =
    React.useState<BroadcastGangguanItem | null>(null);

  const [daftar, setDaftar] =
    React.useState<BroadcastGangguanItem[]>(daftarBroadcast);

  React.useEffect(() => {
    try {
      const tersimpan = localStorage.getItem("elysia_broadcast_items");
      if (tersimpan) {
        const parsed = JSON.parse(tersimpan);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDaftar(parsed);
        }
      }
    } catch {}

    fetch("/api/broadcast/public")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setDaftar(json.data);
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    function handleStorageChange() {
      try {
        const tersimpan = localStorage.getItem("elysia_broadcast_items");
        if (tersimpan) {
          const parsed = JSON.parse(tersimpan);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setDaftar(parsed);
          }
        }
      } catch {}
    }
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("elysia:broadcast-updated", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "elysia:broadcast-updated",
        handleStorageChange,
      );
    };
  }, []);

  const broadcastAktif = React.useMemo(() => {
    return daftar
      .filter((b) => b.aktif && b.tampilkanDiTicker !== false)
      .sort((a, b) => {
        const priorityOrder: Record<string, number> = {
          DARURAT: 1,
          PEMELIHARAAN: 2,
          EVENT: 3,
          INFORMASI: 4,
        };
        return (
          (priorityOrder[a.kategori] || 5) - (priorityOrder[b.kategori] || 5)
        );
      });
  }, [daftar]);

  const displayItems = React.useMemo(() => {
    if (broadcastAktif.length === 0) return [];
    if (broadcastAktif.length === 1) {
      return [
        broadcastAktif[0],
        broadcastAktif[0],
        broadcastAktif[0],
        broadcastAktif[0],
      ];
    }
    if (broadcastAktif.length === 2) {
      return [...broadcastAktif, ...broadcastAktif];
    }
    return broadcastAktif;
  }, [broadcastAktif]);

  const tickerDuration = Math.max(30, displayItems.length * 15);

  if (isDismissed || broadcastAktif.length === 0) {
    return null;
  }

  const adaDarurat = broadcastAktif.some((b) => b.kategori === "DARURAT");
  const adaPemeliharaan = broadcastAktif.some(
    (b) => b.kategori === "PEMELIHARAAN",
  );

  const handleDismiss = () => {
    setIsDismissed(true);
    toast.info("Pemberitahuan ditutup sementara", {
      description:
        "Muat ulang (refresh) halaman untuk menampilkan kembali siaran informasi.",
      duration: 3500,
    });
  };

  const handleBukaDetail = (item: BroadcastGangguanItem) => {
    setSelectedItem(item);
    setModalBuka(true);
  };

  const renderBadge = (kategori: string) => {
    switch (kategori) {
      case "DARURAT":
        return (
          <HaloBadge live variant="destructive" className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0">
            Darurat
          </HaloBadge>
        );
      case "PEMELIHARAAN":
        return (
          <HaloBadge live variant="outline" className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0 text-white border-white/30">
            Pemeliharaan
          </HaloBadge>
        );
      case "EVENT":
        return (
          <HaloBadge live variant="outline" className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0 text-white border-white/30">
            Program Resmi
          </HaloBadge>
        );
      default:
        return (
          <HaloBadge live variant="secondary" className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0 text-white border-white/25">
            Info
          </HaloBadge>
        );
    }
  };

  const renderTrackContent = (
    items: BroadcastGangguanItem[],
    prefix: string,
  ) => {
    return (
      <div className="flex items-center">
        {items.map((item, idx) => (
          <React.Fragment key={`${prefix}-${item.id}-${idx}`}>
            <button
              type="button"
              onClick={() => handleBukaDetail(item)}
              className="group/item inline-flex items-center gap-1.5 px-2.5 py-0.5 text-left text-[11px] leading-none text-white/95 hover:text-white transition-colors cursor-pointer shrink-0"
              title={`Klik untuk melihat detail: ${item.judul}`}
            >
              {renderBadge(item.kategori)}

              <span className="font-semibold text-white tracking-tight group-hover/item:underline underline-offset-2 whitespace-nowrap">
                {item.judul}
              </span>

              {item.estimasiSelesai && (
                <span className="text-white/75 text-[10px] font-mono hidden sm:inline whitespace-nowrap">
                  ({item.estimasiSelesai})
                </span>
              )}

              <span className="text-white/40 text-[10px] select-none">•</span>

              <span className="text-white/85 text-[11px] max-w-60 sm:max-w-md truncate whitespace-nowrap font-normal">
                {item.ringkasan}
              </span>

              <span className="inline-flex items-center gap-0.5 text-white font-semibold text-[10px] whitespace-nowrap opacity-90 group-hover/item:opacity-100 ml-0.5">
                <span>Detail</span>
                <ChevronRight className="size-2.5 transition-transform group-hover/item:translate-x-0.5" />
              </span>
            </button>

            <span
              aria-hidden="true"
              className="size-1 rounded-full bg-white/35 mx-2.5 sm:mx-3 select-none shrink-0"
            />
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <>
      <aside
        aria-label="Pemberitahuan Siaran Resmi"
        className="relative z-30 w-full bg-[#0070f3] text-white border-b border-[#0060df] text-[11px] select-none overflow-hidden"
      >
        {/* Subtle Vercel Blue Top Specular Line */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/35 to-transparent pointer-events-none"
        />

        <div className="mx-auto flex h-7 max-w-360 items-center justify-between px-3 sm:px-4 lg:px-12">
          {/* Label Kiri Tetap (Fixed Indicator) */}
          <div className="flex items-center shrink-0 gap-1.5 pr-2.5 border-r border-white/20 z-20">
            <span className="relative flex h-1.5 w-1.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-80 ${
                  adaDarurat
                    ? "bg-amber-300"
                    : adaPemeliharaan
                      ? "bg-sky-200"
                      : "bg-white"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                  adaDarurat
                    ? "bg-amber-300"
                    : adaPemeliharaan
                      ? "bg-sky-200"
                      : "bg-white"
                }`}
              />
            </span>
            <span className="text-[10px] font-semibold text-white uppercase tracking-wider hidden xs:inline">
              {adaDarurat
                ? "Darurat"
                : adaPemeliharaan
                  ? "Pemeliharaan"
                  : "Siaran Resmi"}
            </span>
            <span className="text-[9px] font-mono font-semibold text-white px-1 py-px rounded-xs bg-white/20 hidden md:inline leading-none">
              {broadcastAktif.length}
            </span>
          </div>

          {/* Area Ticker Teks Bergerak Otomatis (Pause saat di-hover) */}
          <div
            className="relative flex-1 overflow-hidden flex items-center min-w-0"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Vignette fade masks selaras dengan Vercel Blue (#0070f3) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-5 sm:w-7 bg-linear-to-r from-[#0070f3] via-[#0070f3]/90 to-transparent z-10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-5 sm:w-7 bg-linear-to-l from-[#0070f3] via-[#0070f3]/90 to-transparent z-10"
            />

            <div
              className="flex w-max shrink-0 items-center animate-broadcast-ticker select-none"
              style={
                {
                  "--ticker-duration": `${tickerDuration}s`,
                  animationPlayState: isHovered ? "paused" : "running",
                } as React.CSSProperties
              }
            >
              {renderTrackContent(displayItems, "track-1")}
            </div>
            <div
              aria-hidden="true"
              className="flex w-max shrink-0 items-center animate-broadcast-ticker select-none"
              style={
                {
                  "--ticker-duration": `${tickerDuration}s`,
                  animationPlayState: isHovered ? "paused" : "running",
                } as React.CSSProperties
              }
            >
              {renderTrackContent(displayItems, "track-2")}
            </div>
          </div>

          {/* Tombol Tutup [X] di Ujung Kanan */}
          <div className="flex items-center shrink-0 pl-2 border-l border-white/20 z-20">
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Tutup sementara banner informasi"
              title="Tutup sementara pemberitahuan"
              className="size-5 rounded-xs flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      </aside>

      <BroadcastDetailModal
        broadcast={selectedItem}
        open={modalBuka}
        onOpenChange={setModalBuka}
      />
    </>
  );
}
