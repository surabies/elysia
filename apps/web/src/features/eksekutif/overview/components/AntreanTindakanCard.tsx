import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  MessageSquareWarning,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { IconTile } from "@/components/reui/icon-tile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type {
  AntreanTindakan,
  PeriodeInfo,
} from "@/server/services/dashboard/dashboard.service";
import { formatAngka } from "../lib/format-ringkasan";

interface AntreanTindakanCardProps {
  antrean: AntreanTindakan;
  periode: PeriodeInfo;
}

type QueueTone = "neutral" | "warning" | "danger" | "positive";

interface QueueItem {
  id: string;
  title: string;
  description: string;
  href: string;
  count: number;
  countLabel: string;
  tone: QueueTone;
  icon: LucideIcon;
}

const DOT_CLASS: Record<QueueTone, string> = {
  neutral: "bg-(--ds-gray-700)",
  positive: "bg-(--ds-green-700)",
  warning: "bg-(--ds-amber-700)",
  danger: "bg-(--ds-red-700)",
};

const BADGE_VARIANT: Record<QueueTone, NonNullable<BadgeProps["variant"]>> = {
  neutral: "gray-subtle",
  positive: "green-subtle",
  warning: "amber-subtle",
  danger: "red-subtle",
};

export function AntreanTindakanCard({
  antrean,
  periode,
}: AntreanTindakanCardProps) {
  const totalTindakan =
    antrean.verifikasiMenunggu.total +
    antrean.laporanMandiri.total +
    antrean.pengaduanTerbuka.total;

  const items: QueueItem[] = [
    {
      id: "verif-menunggu",
      title: "Verifikasi Baca Meter",
      description: `Hasil catat periode ${periode.label} menunggu persetujuan V1`,
      href: "/verifikasi/baca-petugas",
      count: antrean.verifikasiMenunggu.total,
      countLabel:
        antrean.verifikasiMenunggu.total > 0 ? "menunggu" : "terkendali",
      tone: antrean.verifikasiMenunggu.total > 0 ? "warning" : "positive",
      icon: ClipboardCheck,
    },
    {
      id: "anomali-meter",
      title: "Anomali & Kendala Meter",
      description: "Bacaan di luar stand normal yang perlu screening petugas",
      href: "/verifikasi/baca-petugas",
      count: antrean.verifikasiMenunggu.anomaliKritis,
      countLabel:
        antrean.verifikasiMenunggu.anomaliKritis > 0 ? "perlu cek" : "bersih",
      tone: antrean.verifikasiMenunggu.anomaliKritis > 0 ? "danger" : "positive",
      icon: AlertTriangle,
    },
    {
      id: "lapor-mandiri",
      title: "Lapor Mandiri Pelanggan",
      description: "Foto & angka stand kiriman warga menunggu validasi kantor",
      href: "/verifikasi/baca-pelanggan",
      count: antrean.laporanMandiri.total,
      countLabel: antrean.laporanMandiri.total > 0 ? "menunggu" : "selesai",
      tone: antrean.laporanMandiri.total > 0 ? "warning" : "positive",
      icon: Smartphone,
    },
    {
      id: "pengaduan-warga",
      title: "Tiket Pengaduan Warga",
      description:
        antrean.pengaduanTerbuka.darurat > 0
          ? `${formatAngka(antrean.pengaduanTerbuka.darurat)} tiket berprioritas tinggi / darurat`
          : "Keluhan kebocoran, air mati, dan tagihan yang masih aktif",
      href: "/pengaduan",
      count: antrean.pengaduanTerbuka.total,
      countLabel: antrean.pengaduanTerbuka.total > 0 ? "aktif" : "tuntas",
      tone:
        antrean.pengaduanTerbuka.darurat > 0
          ? "danger"
          : antrean.pengaduanTerbuka.total > 0
            ? "warning"
            : "positive",
      icon: MessageSquareWarning,
    },
  ];

  return (
    <Card className="flex flex-col rounded-lg border border-border bg-card shadow-none">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-[15px] font-semibold tracking-tight">
              Antrean Tindak Lanjut
            </CardTitle>
            <CardDescription className="mt-0.5 text-[12.5px]">
              Daftar pekerjaan operasional yang menunggu verifikasi &amp; penanganan.
            </CardDescription>
          </div>
          <Badge
            variant={totalTindakan > 0 ? "amber-subtle" : "green-subtle"}
            size="md"
          >
            {totalTindakan > 0 ? (
              `${formatAngka(totalTindakan)} Item`
            ) : (
              <>
                <CheckCircle2 />
                Semua Bersih
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-2 p-5 pt-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className="group flex items-center justify-between gap-3 rounded-md border border-border bg-muted/20 px-3.5 py-2.5 transition-colors hover:border-foreground/25 hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex min-w-0 items-center gap-3">
                <IconTile
                  size="sm"
                  variant="frame"
                  className="text-muted-foreground transition-colors group-hover:text-foreground shrink-0"
                >
                  <Icon className="size-4 stroke-[1.5]" />
                </IconTile>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={`size-1.5 shrink-0 rounded-full ${DOT_CLASS[item.tone]}`}
                    />
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={BADGE_VARIANT[item.tone]} size="md">
                  <span>{formatAngka(item.count)}</span>
                  <span className="hidden sm:inline font-normal opacity-85">
                    {item.countLabel}
                  </span>
                </Badge>
                <ArrowUpRight className="size-3.5 text-muted-foreground/60 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
