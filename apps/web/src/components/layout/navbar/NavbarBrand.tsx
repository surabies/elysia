// components/layout/navbar/NavbarBrand.tsx
// Tugas: menampilkan logo, nama brand, dan dropdown versi.
import Image from "next/image"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { versions } from "@/config/Navigasi"
import { BRAND } from "@/config/site"

export function NavbarBrand() {
  return (
    <div className="flex items-center gap-3">
      <Link href="/dashboard" className="flex items-center gap-2">
        {/* alt kosong: logo hanya dekorasi, nama tautan sudah dibaca dari teks di sebelahnya */}
        <Image
          src={BRAND.logo}
          alt=""
          width={32}
          height={32}
          priority
          unoptimized
          className="size-8 object-contain"
        />
        <span className="text-lg font-semibold tracking-tight text-foreground">
          Wiska.<span className="text-blue-500">Dev</span>
        </span>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex h-6 items-center gap-1 rounded-md border border-border bg-muted/60 px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Pilih versi aplikasi"
          >
            <span className="font-mono">{versions[0]}</span>
            <ChevronDown className="size-3 text-muted-foreground opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="w-44 min-w-44 rounded-lg border border-border bg-popover p-1.5 shadow-lg"
        >
          <DropdownMenuLabel className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Versi Rilis
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="my-1" />
          {versions.map((version, index) => (
            <DropdownMenuItem
              key={version}
              className="flex h-9 w-full cursor-pointer items-center justify-between rounded-md px-2.5 text-sm font-normal transition-colors hover:bg-[#F2F2F2] focus:bg-[#F2F2F2] dark:hover:bg-[#1F1F1F] dark:focus:bg-[#1F1F1F]"
            >
              <span className="font-mono">{version}</span>
              {index === 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  aktif
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
