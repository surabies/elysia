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
      <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl w-fit border border-neutral-200/80">
        <button
          type="button"
          onClick={() => setTabTujuan('tagihan')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            tabTujuan === 'tagihan'
              ? 'bg-white text-neutral-900 shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Cek Tagihan
        </button>
        <button
          type="button"
          onClick={() => setTabTujuan('lapor')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            tabTujuan === 'lapor'
              ? 'bg-white text-neutral-900 shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Lapor Meter
        </button>
        <button
          type="button"
          onClick={() => setTabTujuan('aduan')}
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            tabTujuan === 'aduan'
              ? 'bg-white text-neutral-900 shadow-2xs'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Lacak Aduan
        </button>
      </div>

      {/* Main Command Input Bar (Ringkas & Presisi) */}
      <form onSubmit={handleCari} className="relative w-full group">
        <div className="h-11 sm:h-12 flex items-center rounded-xl bg-white border border-neutral-300 shadow-2xs transition-all focus-within:border-neutral-900 focus-within:ring-2 focus-within:ring-neutral-900/10">
          <div className="pl-3.5 text-neutral-400 group-focus-within:text-neutral-900 shrink-0 transition-colors">
            <Search className="size-4" />
          </div>

          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={
              tabTujuan === 'aduan'
                ? 'Ketik nomor tiket aduan (cth: ADU-2026-001)...'
                : 'Ketik 11 digit nomor langganan...'
            }
            className="w-full min-w-0 bg-transparent px-3 text-xs sm:text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
          />

          {inputVal && (
            <button
              type="button"
              onClick={() => setInputVal('')}
              className="p-1 mr-1 text-neutral-400 hover:text-neutral-600 cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}

          {/* Submit Action Button */}
          <div className="pr-1.5 shrink-0">
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="inline-flex items-center justify-center gap-1.5 h-8 sm:h-9 px-3.5 rounded-lg bg-neutral-900 text-white text-xs font-semibold shadow-xs hover:bg-black active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Cek Layanan</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
