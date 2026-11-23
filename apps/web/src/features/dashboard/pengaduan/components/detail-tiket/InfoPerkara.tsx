// features/dashboard/pengaduan/components/detail-tiket/InfoPerkara.tsx —
// Kartu "Duduk Perkara" (Ringkasan Perkara & Fakta Tiket):
// Menampung Judul Lengkap Pengaduan, Badge Jenis Keluhan, Badge Prioritas, Waktu Masuk,
// Deskripsi keluhan, serta grid fakta tiket (pelapor, target SLA, petugas, lokasi, eskalasi, penilaian).
import {
  ArrowUpCircle,
  CircleUser,
  Clock,
  MapPin,
  Star,
  UserCheck,
} from "@/components/ui/hugeicons-compat";
import { Badge } from "@/components/ui/badge";
import {
  LABEL_JENIS_PENGADUAN,
  formatWaktu,
} from "@/features/public/lib/format";
import { LABEL_PRIORITAS_PENGADUAN } from "@/features/dashboard/lib/LabelPengaduan";
import { BarisInfo } from "@/features/dashboard/pengaduan/components/bersama/BarisInfo";
import { PanelKartu } from "@/features/dashboard/pengaduan/components/bersama/PanelKartu";
import { cn } from "@/lib/utils";
import type {
  PengaduanDetail,
  PrioritasPengaduan,
} from "@/features/dashboard/pengaduan/types/TipePengaduan";

const TITIK_PRIORITAS: Record<PrioritasPengaduan, string> = {
  DARURAT: "bg-destructive",
  TINGGI: "bg-warning",
  NORMAL: "bg-muted-foreground/60",
  RENDAH: "bg-muted-foreground/30",
};

export function InfoPerkara({ detail }: { detail: PengaduanDetail }) {
  const wilayah = [detail.kelurahan?.nama, detail.kecamatan?.nama]
    .filter(Boolean)
    .join(", ");

  return (
    <PanelKartu
      judul="Duduk perkara"
      aksi={
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="blue-subtle" size="sm" className="text-[11px]">
            {LABEL_JENIS_PENGADUAN[detail.jenis] ?? detail.jenis}
          </Badge>
          <Badge variant="outline" className="gap-1 text-[11px] h-5 px-2">
            <span
              aria-hidden
              className={cn(
                "size-1.5 rounded-full shrink-0",
                TITIK_PRIORITAS[detail.prioritas]
              )}
            />
            <span>{LABEL_PRIORITAS_PENGADUAN[detail.prioritas]}</span>
          </Badge>
        </div>
      }
    >
      {/* 1. Judul Lengkap & Deskripsi Keluhan (Langsung tanpa container pembungkus ganda) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground font-mono">
          <span>Dilaporkan {formatWaktu(detail.createdAt)} WIB</span>
        </div>
        <h3 className="text-sm font-semibold text-foreground leading-snug">
          {detail.judul}
        </h3>
        <p className="text-xs @[420px]/detail:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {detail.deskripsi}
        </p>
      </div>

      {/* 2. Grid Fakta Tiket */}
      <div className="grid gap-3.5 border-t border-border-subtle pt-3.5 grid-cols-1 @[460px]/detail:grid-cols-2">
        <BarisInfo ikon={CircleUser} label="Pelapor">
          <p className="font-medium text-foreground">{detail.pelapor}</p>
          {detail.kontakPelapor && (
            <p className="text-muted-foreground">{detail.kontakPelapor}</p>
          )}
          {detail.pelanggan && (
            <p className="font-mono text-xs text-muted-foreground">
              {detail.pelanggan.nomorLangganan} · {detail.pelanggan.nama}
            </p>
          )}
          {!detail.pelanggan && detail.nomorLangganan && (
            <p className="font-mono text-xs text-muted-foreground">
              {detail.nomorLangganan} (belum dicocokkan)
            </p>
          )}
        </BarisInfo>

        <BarisInfo ikon={Clock} label="Target penyelesaian">
          <p>{formatWaktu(detail.sla.targetSelesaiAt)} WIB</p>
        </BarisInfo>

        <BarisInfo ikon={UserCheck} label="Ditugaskan ke">
          <p>{detail.ditugaskanKe?.name ?? "— belum ditugaskan"}</p>
        </BarisInfo>

        <BarisInfo ikon={MapPin} label="Lokasi kejadian">
          <p>{detail.alamatKejadian ?? "—"}</p>
          {wilayah && <p className="text-muted-foreground">{wilayah}</p>}
        </BarisInfo>

        {detail.eskalasiKe && (
          <BarisInfo ikon={ArrowUpCircle} label="Dieskalasi ke">
            <p>
              {detail.eskalasiKe.name ?? "—"}
              <span className="text-muted-foreground">
                {" "}
                · {detail.eskalasiKe.role}
              </span>
            </p>
            {detail.alasanEskalasi && (
              <p className="text-muted-foreground">{detail.alasanEskalasi}</p>
            )}
          </BarisInfo>
        )}

        {detail.status === "SELESAI" && detail.konfirmasiBatasAt && (
          <BarisInfo ikon={Clock} label="Batas konfirmasi pelapor">
            <p>{formatWaktu(detail.konfirmasiBatasAt)} WIB</p>
            <p className="text-muted-foreground">
              Lewat batas ini tiket ditutup otomatis.
            </p>
          </BarisInfo>
        )}

        {detail.ratingKepuasan !== null && (
          <BarisInfo ikon={Star} label="Penilaian pelapor">
            <p className="flex items-center gap-1">
              {detail.ratingKepuasan}/5
              <Star className="size-3.5 fill-warning text-warning" />
            </p>
            {detail.komentarKepuasan && (
              <p className="text-muted-foreground">
                “{detail.komentarKepuasan}”
              </p>
            )}
          </BarisInfo>
        )}
      </div>
    </PanelKartu>
  );
}
