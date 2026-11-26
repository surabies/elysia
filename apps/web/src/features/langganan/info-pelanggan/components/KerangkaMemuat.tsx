// KerangkaMemuat menampilkan placeholder selama data dimuat.
import { Card } from "@/components/ui/card";

function Blok({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className}`} />;
}

export function KerangkaMemuat() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat data pelanggan"
      className="flex flex-col gap-6"
    >
      <Card className="rounded-lg border-border/80 bg-card p-4 sm:p-5 shadow-none">
        <div className="flex flex-col gap-3">
          <Blok className="h-6 w-32" />
          <Blok className="h-9 w-72 max-w-full" />
          <Blok className="h-4 w-96 max-w-full" />
        </div>
      </Card>
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.15fr]">
        <Card className="rounded-lg border-border/80 bg-card p-4 sm:p-5 shadow-none">
          <Blok className="h-24" />
        </Card>
        <Card className="rounded-lg border-border/80 bg-card p-4 sm:p-5 shadow-none">
          <Blok className="h-24" />
        </Card>
        <Card className="rounded-lg border-border/80 bg-card p-4 sm:p-5 shadow-none">
          <Blok className="h-24" />
        </Card>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="rounded-lg border-border/80 bg-card p-4 sm:p-5 shadow-none">
          <Blok className="h-6 w-36 mb-4" />
          <Blok className="h-56" />
        </Card>
        <Card className="rounded-lg border-border/80 bg-card p-4 sm:p-5 shadow-none">
          <Blok className="h-6 w-36 mb-4" />
          <Blok className="h-56" />
        </Card>
      </div>
      <Card className="rounded-lg border-border/80 bg-card p-4 sm:p-5 shadow-none">
        <Blok className="h-6 w-32 mb-4" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Blok className="aspect-3/4" />
          <Blok className="aspect-3/4" />
          <Blok className="aspect-3/4" />
        </div>
      </Card>
      <Card className="rounded-lg border-border/80 bg-card p-4 sm:p-5 shadow-none">
        <Blok className="h-6 w-32 mb-4" />
        <Blok className="h-72" />
      </Card>
    </div>
  );
}
