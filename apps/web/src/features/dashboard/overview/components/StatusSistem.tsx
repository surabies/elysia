import { CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const systemStatuses = [
  {
    title: "PostgreSQL & PostGIS Spasial",
    description: "22.549 data pelanggan & 22.078 meter air terkoneksi",
    status: "Terhubung (Aktif)",
  },
  {
    title: "Siklus Verifikasi Multi-Tier (V1-V3)",
    description: "Alur screening supervisor, approval cabang & pengesahan DRD",
    status: "Siap Melayani",
  },
  {
    title: "Elysia 4-Tier Backend Engine",
    description: "Transport, Service, Domain Logic, dan Data Access aktif",
    status: "Normal (100%)",
  },
];

export function StatusSistem() {
  return (
    <Card>
      <CardHeader className="p-5 pb-3">
        <CardTitle className="font-semibold tracking-tight">
          Status Integritas Basis Data & Infrastruktur
        </CardTitle>
        <CardDescription>
          Koneksi engine Next.js 15, Drizzle ORM, PostgreSQL & PostGIS.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5 p-5 pt-0">
        {systemStatuses.map((item) => (
          <div
            key={item.title}
            className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-2.5"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <div>
                <p className="text-label-13 text-foreground">
                  {item.title}
                </p>
                <p className="text-copy-13 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="border-border text-emerald-600 dark:text-emerald-400"
            >
              {item.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
