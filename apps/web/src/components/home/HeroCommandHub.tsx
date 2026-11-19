'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowRight, X } from 'lucide-react'

export function HeroCommandHub() {
  const router = useRouter()
  const [inputVal, setInputVal] = React.useState('')
  const [tabTujuan, setTabTujuan] = React.useState<'tagihan' | 'lapor' | 'aduan'>('tagihan')

  const handleCari = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = inputVal.trim()
    if (!clean) return

    // Deteksi jika berupa kode tiket aduan (misal ADU-...)
    if (clean.toUpperCase().startsWith('ADU') || clean.includes('-')) {
      router.push(`/pengaduan-air?tab=lacak&nomor=${encodeURIComponent(clean)}`)
      return
    }

    // Jika nomor sambungan pelanggan (11 digit)
    if (tabTujuan === 'tagihan') {
      router.push(`/cek-tagihan?nomor=${encodeURIComponent(clean)}`)
    } else if (tabTujuan === 'lapor') {
      router.push(`/lapor-meter?tab=lapor&nomor=${encodeURIComponent(clean)}`)
    } else {
      router.push(`/pengaduan-air?tab=lacak&nomor=${encodeURIComponent(clean)}`)
    }
  }

  return (
    <div className="w-full max-w-xl space-y-2.5">
      {/* Sub Tabs Pilihan Layanan Ringkas & Bersih */}
      <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg w-fit border border-border/80">
        <button
          type="button"
          onClick={() => setTabTujuan('tagihan')}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            tabTujuan === 'tagihan'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Cek Tagihan
        </button>
        <button
          type="button"
          onClick={() => setTabTujuan('lapor')}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            tabTujuan === 'lapor'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Lapor Meter
        </button>
        <button
          type="button"
          onClick={() => setTabTujuan('aduan')}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            tabTujuan === 'aduan'
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Lacak Aduan
        </button>
      </div>

      {/* Main Command Input Bar (Ringkas & Presisi ala Dashboard Card) */}
      <form onSubmit={handleCari} className="relative w-full group">
        <div className="h-11 sm:h-12 flex items-center rounded-lg bg-card border border-border/80 shadow-none transition-all focus-within:border-foreground/30 focus-within:ring-1 focus-within:ring-ring/20">
          <div className="pl-3.5 text-muted-foreground group-focus-within:text-foreground shrink-0 transition-colors">
            <Search className="size-4" />
          </div>

          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={
              tabTujuan === 'aduan'
                ? 'Nomor tiket aduan (cth: ADU-001)...'
                : '11 digit nomor langganan...'
            }
            className="w-full min-w-0 bg-transparent px-2.5 sm:px-3 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
          />

          {inputVal && (
            <button
              type="button"
              onClick={() => setInputVal('')}
              className="p-1 mr-1 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}

          {/* Submit Action Button */}
          <div className="pr-1.5 shrink-0">
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-lg bg-foreground text-background text-xs font-semibold shadow-xs hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="hidden sm:inline">Cek Layanan</span>
              <span className="sm:hidden">Cek</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
