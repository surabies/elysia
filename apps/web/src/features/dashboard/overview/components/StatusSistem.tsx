import { CheckCircle2, Cpu, Database, HardDrive, ShieldCheck } from "lucide-react";
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
    icon: Database,
    title: "PostgreSQL & PostGIS Spasial",
    description: "22.549 sambungan aktif & 22.078 meter air terverifikasi.",
    status: "CONNECTED",
    metric: "Latency ~24ms",
    tone: "positive",
  },
  {
    icon: ShieldCheck,
    title: "Siklus Verifikasi Multi-Tier (V1-V3)",
    description: "Alur screening supervisor rute, approval cabang & pengesahan DRD.",
    status: "ACTIVE",
    metric: "3-Tier Ready",
    tone: "positive",
  },
  {
    icon: Cpu,
    title: "Backend Service & Domain Engine",
    description: "Evaluasi anomali meter, kalkulasi taksasi, dan Drizzle ORM.",
    status: "HEALTHY",
    metric: "100% Operational",
    tone: "positive",
  },
  {
    icon: HardDrive,
    title: "Better-Auth & RBAC Security Layer",
    description: "Pengamanan session token, multi-role authority & proteksi rute.",
    status: "PROTECTED",
    metric: "Session Guard",
    tone: "positive",
  },
];

export function StatusSistem() {
  return (
    <Card className="rounded-lg border-border/80 bg-card shadow-none">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle>Integritas Sistem & Data</CardTitle>
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
            </div>
            <CardDescription className="mt-0.5">
              Status real-time infrastruktur basis data, engine verifikasi, dan keamanan.
            </CardDescription>
          </div>
          <Badge variant="outline" size="sm" className="hidden sm:inline-flex font-mono text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5">
            ALL SYSTEMS NORMAL
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 p-5 pt-0">
        {systemStatuses.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="group flex flex-col gap-2 rounded-md border border-border/70 bg-muted/20 p-3 transition-colors hover:border-border hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-2.5">
                <div className="mt-0.5 rounded-sm p-1 bg-background border border-border/60 text-emerald-600 dark:text-emerald-400">
                  <Icon className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-label-13 font-medium text-foreground">{item.title}</p>
                  <p className="text-copy-12 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start font-mono text-[11px] sm:self-center">
                <span className="text-muted-foreground/70 hidden md:inline">
                  {item.metric}
                </span>
                <Badge
                  variant="outline"
                  size="sm"
                  className="font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5 tracking-wider"
                >
                  {item.status}
                </Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
