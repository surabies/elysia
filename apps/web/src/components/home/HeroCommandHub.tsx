'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  ArrowRight,
  Receipt,
  Camera,
  AlertTriangle,
  MapPin,
  X,
} from 'lucide-react'

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
      router.push(`/pengaduan-air?tab=riwayat&tiket=${encodeURIComponent(clean)}`)
      return
    }

    // Jika nomor sambungan pelanggan (11 digit)
    if (tabTujuan === 'tagihan') {
      router.push(`/cek-tagihan?nosamb=${encodeURIComponent(clean)}`)
    } else if (tabTujuan === 'lapor') {
      router.push(`/lapor-meter?nosamb=${encodeURIComponent(clean)}`)
    } else {
      router.push(`/pengaduan-air?nosamb=${encodeURIComponent(clean)}`)
    }
  }

  return (
    <div className="w-full max-w-lg space-y-2.5">
      {/* Sub Tabs Pilihan Pintas (Kompak & Ergonomis) */}
      <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl w-fit border border-slate-200/70 dark:bg-slate-900 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setTabTujuan('tagihan')}
          className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
            tabTujuan === 'tagihan'
              ? 'bg-white text-slate-950 shadow-2xs dark:bg-slate-800 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Cek Tagihan
        </button>
        <button
          type="button"
          onClick={() => setTabTujuan('lapor')}
          className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
            tabTujuan === 'lapor'
              ? 'bg-white text-slate-950 shadow-2xs dark:bg-slate-800 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Lapor Meter (1-20)
        </button>
        <button
          type="button"
          onClick={() => setTabTujuan('aduan')}
          className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ${
            tabTujuan === 'aduan'
              ? 'bg-white text-slate-950 shadow-2xs dark:bg-slate-800 dark:text-white'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          Lacak Aduan
        </button>
      </div>

      {/* Main Command Input Bar (Proporsional, Ramping, & Presisi) */}
      <form onSubmit={handleCari} className="relative w-full group">
        <div className="h-11 sm:h-12 flex items-center rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-sm transition-all focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 dark:bg-slate-900 dark:border-slate-800">
          <div className="pl-3 sm:pl-3.5 text-slate-400 group-focus-within:text-cyan-500 shrink-0 transition-colors">
            <Search className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
          </div>

          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={
              tabTujuan === 'aduan'
                ? 'Nomor Tiket Aduan (cth: ADU-2026-001)...'
                : 'Ketik 11 Digit No. Pelanggan...'
            }
            className="w-full min-w-0 bg-transparent px-2.5 sm:px-3 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white"
          />

          {inputVal && (
            <button
              type="button"
              onClick={() => setInputVal('')}
              className="p-1 mr-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Submit Action Button (Kompak di Mobile, Terbuka di Desktop) */}
          <div className="pr-1.5 shrink-0">
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="inline-flex items-center justify-center gap-1.5 h-8 sm:h-9 px-3 sm:px-3.5 rounded-lg sm:rounded-xl bg-slate-950 text-white text-xs font-semibold shadow-xs hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
            >
              <span className="hidden sm:inline">Cek Layanan</span>
              <span className="sm:hidden text-[11px]">Cek</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </form>

      {/* Quick Links Direct Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
          Pintas:
        </span>
        <Link
          href="/cek-tagihan"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-cyan-50 hover:border-cyan-300 hover:text-cyan-800 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <Receipt className="h-3 w-3 text-cyan-600" />
          <span>Cek Rekening</span>
        </Link>
        <Link
          href="/lapor-meter"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-cyan-50 hover:border-cyan-300 hover:text-cyan-800 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <Camera className="h-3 w-3 text-blue-600" />
          <span>Lapor Meter</span>
        </Link>
        <Link
          href="/pengaduan-air"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-800 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          <span>Pengaduan</span>
        </Link>
        <Link
          href="/peta-pengaduan"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <MapPin className="h-3 w-3 text-emerald-500" />
          <span>Peta GIS</span>
        </Link>
      </div>
    </div>
  )
}
