import { CheckCircle2, User } from "@/components/ui/hugeicons-compat"
import type { HasilCekTagihan } from "../../lib/api"

export function HasilTagihanHeader({ hasil }: { hasil: HasilCekTagihan }) {
  const { pelanggan } = hasil

  return (
    <div className="border-b border-border bg-gradient-to-r from-blue-500/5 via-card to-sky-500/5 px-6 py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              No. Langganan
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" /> Sambungan Aktif
            </span>
          </div>

          <p className="font-mono text-xl font-bold tracking-tight text-foreground">
            {pelanggan.nomorLangganan}
          </p>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
            <User className="size-3.5 text-muted-foreground" />
            <span className="truncate text-foreground/90">{pelanggan.nama}</span>
          </div>
        </div>

        {pelanggan.tarifGolongan && (
          <div className="self-start rounded-xl border border-border bg-card px-3.5 py-2 shadow-xs sm:self-auto sm:text-right">
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Golongan Tarif
            </p>
            <p className="font-mono text-xs font-bold text-foreground">
              {pelanggan.tarifGolongan.kodeAsli}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {pelanggan.tarifGolongan.kategori}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
