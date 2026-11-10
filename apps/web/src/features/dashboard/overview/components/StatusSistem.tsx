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
        <CardTitle>Status Integritas Basis Data & Infrastruktur</CardTitle>
        <CardDescription>
          Koneksi engine Next.js, Drizzle ORM, PostgreSQL & PostGIS.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5 p-5 pt-0">
        {systemStatuses.map((item) => (
          <div
            key={item.title}
            className="flex flex-col items-start gap-2 rounded-md border border-border bg-(--ds-gray-100) p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-(--ds-green-600)" />
              <div className="min-w-0">
                <p className="text-label-13 text-foreground">{item.title}</p>
                <p className="text-copy-13 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
            <Badge variant="green-subtle" size="sm" className="ml-6 shrink-0 sm:ml-0">
              {item.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
