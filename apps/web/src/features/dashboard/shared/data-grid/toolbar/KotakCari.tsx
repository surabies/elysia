import { HugeiconsIcon } from "@/features/dashboard/shared/icons/IconRenderer"
import { Search01Icon } from "@/features/dashboard/shared/icons/IkonLucide"
import { cn } from "@/lib/Utilitas"
import { Input } from "@/components/ui/input"

export function KotakCari({
  nilai,
  onUbah,
  placeholder,
  className,
}: {
  nilai: string
  onUbah: (nilai: string) => void
  placeholder: string
  className?: string
}) {
  return (
    <div
      role="search"
      className={cn(
        "relative w-full min-w-0 sm:w-64 lg:w-auto lg:max-w-72 lg:min-w-44 lg:flex-1",
        className
      )}
    >
      <HugeiconsIcon
        icon={Search01Icon}
        strokeWidth={2}
        className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        density="compact"
        type="search"
        name="cari-grid"
        autoComplete="off"
        value={nilai}
        onChange={(e) => onUbah(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 focus-visible:border-transparent focus-visible:ring-inset"
        aria-label="Cari"
      />
    </div>
  )
}
