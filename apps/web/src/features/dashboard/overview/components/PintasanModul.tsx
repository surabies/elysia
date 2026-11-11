import Link from "next/link";
import {
  ArrowUpRight,
  Compass,
  FileCheck2,
  Gauge,
  LineChart,
  Receipt,
  Users as UsersIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const shortcuts = [
  {
    href: "/cater",
    title: "Baca Meter Lapangan",
    description: "Monitoring 22.549 pembacaan rute cater",
    badge: "22.5k SL",
    Icon: Gauge,
  },
  {
    href: "/verifikasi",
    title: "Verifikasi & Koreksi",
    description: "Screening anomali kondisi meter & taksasi",
    badge: "Tier 1-3",
    Icon: FileCheck2,
  },
  {
    href: "/pelanggan",
    title: "Direktori Pelanggan",
    description: "Pencarian nolg, rute, golongan & alamat",
    badge: "4 Wilayah",
    Icon: UsersIcon,
  },
  {
    href: "/places",
    title: "Peta Spasial PostGIS",
    description: "Sebaran titik koordinat pelanggan PDAM",
    badge: "GIS Map",
    Icon: Compass,
  },
  {
    href: "/laporan/lap-drd",
    title: "Rekapitulasi DRD",
    description: "Laporan tagihan rekening air per wilayah",
    badge: "DRD Billing",
    Icon: Receipt,
  },
  {
    href: "/analytics",
    title: "Observabilitas & Tren",
    description: "Analisis tren pemakaian kubikasi & anomali",
    badge: "Time-Series",
    Icon: LineChart,
  },
];

export function PintasanModul() {
  return (
    <Card className="rounded-lg border-border/80 bg-card shadow-none">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>Pintasan Modul Utama</CardTitle>
            <CardDescription className="mt-0.5">
              Akses cepat ke alur kerja operasional harian PDAM Tirtawening.
            </CardDescription>
          </div>
          <Badge variant="outline" size="sm" className="hidden sm:inline-flex font-mono text-[10px]">
            6 MODUL
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-2.5 p-5 pt-0 sm:grid-cols-2">
        {shortcuts.map(({ href, title, description, badge, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col justify-between gap-2 rounded-md border border-border/70 bg-muted/20 p-3 transition-all duration-150 hover:border-foreground/30 hover:bg-muted/40 hover:shadow-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <div className="rounded-sm p-1 bg-background border border-border/60 text-muted-foreground group-hover:text-foreground transition-colors">
                  <Icon className="size-3.5" />
                </div>
                <span className="truncate text-label-13 font-medium text-foreground">
                  {title}
                </span>
              </div>
              <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
            </div>

            <div className="flex items-center justify-between gap-2 text-copy-12">
              <p className="truncate text-muted-foreground text-[12px]">
                {description}
              </p>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground/80 bg-background/70 px-1.5 py-0.5 rounded border border-border/50">
                {badge}
              </span>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
