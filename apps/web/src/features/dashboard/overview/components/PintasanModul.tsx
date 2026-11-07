import Link from "next/link";
import {
  Compass,
  Gauge,
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
import { Button } from "@/components/ui/button";
import { IconTile } from "@/components/reui/icon-tile";

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
    description: "Grafik Vercel time-series, kubikasi & beban kerja",
    Icon: Gauge,
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
        <CardTitle className="font-semibold tracking-tight">
          Pintasan Modul Utama
        </CardTitle>
        <CardDescription>
          Akses cepat ke modul operasional harian PDAM Tirtawening.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2.5 p-4 pt-0 sm:grid-cols-2 sm:p-5 sm:pt-0">
        {shortcuts.map(({ href, title, description, Icon }) => (
          <Button
            key={href}
            asChild
            variant="outline"
            className="h-auto w-full min-w-0 flex-col items-start whitespace-normal rounded-md border-border p-3 hover:bg-accent/60"
          >
            <Link href={href}>
              <div className="mb-1 flex min-w-0 items-center gap-2">
                <IconTile
                  aria-hidden="true"
                  size="sm"
                  variant="frame"
                  className="text-muted-foreground"
                >
                  <Icon />
                </IconTile>
                <span className="min-w-0 text-left text-label-13 text-foreground">
                  {title}
                </span>
              </div>
              <span className="min-w-0 text-left text-copy-13 text-muted-foreground">
                {description}
              </span>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
