import Link from "next/link";
import {
  ArrowUpRight,
  Compass,
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

const shortcuts = [
  {
    href: "/cater",
    title: "Baca Meter CHN",
    description: "Tabel data 22.549 pembacaan meter & anomali",
    Icon: Gauge,
  },
  {
    href: "/pelanggan",
    title: "Master Pelanggan",
    description: "Direktori pencarian nolg, rute, dan alamat",
    Icon: UsersIcon,
  },
  {
    href: "/places",
    title: "Pemetaan Spasial",
    description: "Peta sebaran koordinat PostGIS pelanggan",
    Icon: Compass,
  },
  {
    href: "/analytics",
    title: "Observabilitas & Grafik",
    description: "Grafik time-series, kubikasi & beban kerja",
    Icon: LineChart,
  },
  {
    href: "/laporan/lap-drd",
    title: "Laporan DRD",
    description: "Rekapitulasi nilai rekening tagihan air",
    Icon: Receipt,
  },
];

export function PintasanModul() {
  return (
    <Card>
      <CardHeader className="p-5 pb-3">
        <CardTitle>Pintasan Modul Utama</CardTitle>
        <CardDescription>
          Akses cepat ke modul operasional harian PDAM Tirtawening.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2.5 p-5 pt-0 sm:grid-cols-2">
        {shortcuts.map(({ href, title, description, Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col justify-between gap-1.5 rounded-md border border-border bg-card p-3 transition-colors duration-150 hover:border-(--ds-gray-500) hover:bg-(--ds-gray-100) dark:hover:bg-(--ds-gray-200)"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Icon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                <span className="truncate text-label-13 text-foreground">
                  {title}
                </span>
              </div>
              <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
            </div>
            <p className="text-copy-12 text-muted-foreground">
              {description}
            </p>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
