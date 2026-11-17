'use client'

import * as React from 'react'
import Link from 'next/link'
import { WifiOff, RefreshCw, Home, PhoneCall } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = React.useState(false)

  const handleRetry = () => {
    setIsRetrying(true)
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="size-20 rounded-3xl bg-blue-50 text-primary dark:bg-blue-950/50 flex items-center justify-center mb-6 shadow-sm border border-blue-200/60 dark:border-blue-900/40 animate-pulse">
        <WifiOff className="size-10" />
      </div>

      <span className="text-label-12-mono font-mono text-muted-foreground uppercase tracking-widest mb-2">
        PERUMDA Tirtawening Kota Bandung
      </span>

      <h1 className="text-heading-26 sm:text-heading-32 font-bold tracking-tight text-foreground max-w-md">
        Koneksi Internet Terputus
      </h1>

      <p className="mt-3 text-copy-14 text-muted-foreground max-w-md leading-relaxed">
        Aplikasi Tirtawening tidak dapat terhubung ke server. Pastikan data seluler atau Wi-Fi di handphone Anda aktif, lalu coba muat ulang.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={handleRetry}
          disabled={isRetrying}
          className="gap-2 px-6 font-semibold"
        >
          <RefreshCw className={`size-4 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Mencoba...' : 'Coba Muat Ulang'}</span>
        </Button>

        <Button variant="outline" asChild className="gap-2">
          <Link href="/">
            <Home className="size-4" />
            <span>Ke Beranda</span>
          </Link>
        </Button>
      </div>

      <div className="mt-12 rounded-2xl border border-border bg-card p-4 max-w-sm text-copy-12 text-muted-foreground">
        <div className="flex items-center justify-center gap-2 font-medium text-foreground mb-1">
          <PhoneCall className="size-3.5 text-primary" />
          <span>Layanan Darurat Tirtawening</span>
        </div>
        <span>Hubungi Call Center 24 Jam di (022) 2509030 / 2509032</span>
      </div>
    </div>
  )
}
