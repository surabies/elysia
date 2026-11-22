'use client'

import * as React from 'react'
import Image from 'next/image'
import {
  Download,
  Smartphone,
  Share2,
  PlusSquare,
  Loader2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PwaContextValue {
  isInstallable: boolean
  isInstalled: boolean
  isInstalling: boolean
  isIos: boolean
  promptInstall: () => Promise<void>
}

const PwaContext = React.createContext<PwaContextValue>({
  isInstallable: false,
  isInstalled: false,
  isInstalling: false,
  isIos: false,
  promptInstall: async () => {},
})

export function usePwa() {
  return React.useContext(PwaContext)
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = React.useState(false)
  const [isInstalling, setIsInstalling] = React.useState(false)
  const [isIos, setIsIos] = React.useState(false)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [showBottomBanner, setShowBottomBanner] = React.useState(false)

  // Inisialisasi Service Worker & Deteksi Lingkungan PWA
  React.useEffect(() => {
    // 0. DI LINGKUNGAN DEVELOPMENT / LOCALHOST:
    // Hapus seluruh Service Worker dan CacheStorage secara otomatis agar tidak pernah ada
    // aset JavaScript, HTML, atau API kadaluarsa yang dicegat dan disajikan secara offline.
    const isLocalhost =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '0.0.0.0');

    if (process.env.NODE_ENV !== 'production' || isLocalhost) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        });
      }
      if ('caches' in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      }
      return;
    }

    // 1. Registrasi Service Worker HANYA di lingkungan PRODUCTION
    const registerSw = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
          console.warn('[PWA] Gagal meregistrasi Service Worker:', error);
        });
      }
    };

    if (document.readyState === 'complete') {
      registerSw();
    } else {
      window.addEventListener('load', registerSw, { once: true });
    }

    // 2. Deteksi apakah sudah berjalan di mode standalone (benar-benar terpasang & dibuka sebagai app)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://')

    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)

    const frameId = window.requestAnimationFrame(() => {
      setIsInstalled(isStandaloneMode)
      setIsIos(isIosDevice)
    })

    // 3. Tangkap event beforeinstallprompt (Android Chrome / Edge / Desktop Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)

      let bannerDismissed = false
      try {
        bannerDismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true'
      } catch {
        // Abaikan jika sessionStorage tidak tersedia
      }

      if (!isStandaloneMode && !bannerDismissed && window.innerWidth < 768) {
        setShowBottomBanner(true)
      }
    }

    // 4. Tangkap event appinstalled (dipicu browser setelah proses instalasi sistem selesai)
    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setIsInstalling(false)
      setIsInstalled(true)
      setShowBottomBanner(false)
      setIsModalOpen(false)
      toast.success('Aplikasi Tirtawening selesai dipasang.', {
        description: 'Cek ikon Tirtawening di layar utama atau laci aplikasi perangkat Anda.',
      })
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('load', registerSw)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Fungsi utama untuk memicu instalasi secara mulus & jujur terhadap status sistem
  const promptInstall = React.useCallback(async () => {
    if (isInstalling) return

    if (isInstalled) {
      toast.info('Aplikasi Tirtawening sudah terpasang di perangkat Anda.')
      return
    }

    // Jika browser menyediakan native install prompt
    if (deferredPrompt) {
      setIsInstalling(true)
      try {
        await deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice

        if (choice.outcome === 'accepted') {
          setDeferredPrompt(null)
          setShowBottomBanner(false)
          setIsModalOpen(false)
          toast.info('Sedang memasang aplikasi Tirtawening...', {
            description:
              'Browser sedang menyiapkan ikon aplikasi di latar belakang (sekitar 5–15 detik).',
          })
          // Reset state installing jika browser tidak mengirim appinstalled dalam 12 detik
          window.setTimeout(() => {
            setIsInstalling(false)
          }, 12000)
        } else {
          setIsInstalling(false)
          toast.message('Pemasangan dibatalkan. Anda dapat memasangnya kapan saja.')
        }
      } catch (err) {
        console.warn('[PWA] Error saat memicu install prompt:', err)
        setIsInstalling(false)
        setDeferredPrompt(null)
        setIsModalOpen(true)
      }
      return
    }

    // Jika belum ada native prompt (iOS Safari, Firefox, WebView, atau kriteria browser belum terpenuhi)
    setIsModalOpen(true)
  }, [deferredPrompt, isInstalled, isInstalling])

  const dismissBanner = () => {
    setShowBottomBanner(false)
    try {
      sessionStorage.setItem('pwa_banner_dismissed', 'true')
    } catch {
      // Abaikan
    }
  }

  const isInstallable = !isInstalled && (!!deferredPrompt || isIos)

  return (
    <PwaContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isInstalling,
        isIos,
        promptInstall,
      }}
    >
      {children}

      {/* FLOATING BOTTOM BANNER DI MOBILE (< md) */}
      {showBottomBanner && !isInstalled && (
        <div className="fixed bottom-3 inset-x-3 z-50 md:hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="rounded-2xl border border-primary/20 bg-background/95 p-3.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-border bg-white shadow-xs flex items-center justify-center p-1">
                <Image
                  src="/icons/icon-192.png"
                  alt="Tirtawening App"
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="text-copy-13 font-bold text-foreground leading-tight truncate">
                  Aplikasi Tirtawening
                </p>
                <p className="text-copy-11 text-muted-foreground truncate">
                  Pasang di layar HP Anda untuk akses instan
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="xs"
                disabled={isInstalling}
                onClick={promptInstall}
                className="gap-1 font-semibold rounded-lg shadow-sm"
              >
                {isInstalling ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                <span>{isInstalling ? 'Memasang...' : 'Pasang'}</span>
              </Button>
              <button
                type="button"
                onClick={dismissBanner}
                aria-label="Tutup banner"
                className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PANDUAN INSTALASI (PWA INSTALL MODAL) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <Smartphone className="size-6" />
              </div>
              <div>
                <DialogTitle className="text-heading-18 font-bold">
                  Pasang Aplikasi Tirtawening
                </DialogTitle>
                <span className="text-copy-12 text-muted-foreground">
                  Akses Cepat &amp; Ringan di Layar Handphone
                </span>
              </div>
            </div>
            <DialogDescription className="text-copy-13 text-muted-foreground text-left pt-1">
              Nikmati layanan cek tagihan, lapor meter, dan aduan air langsung dari ikon aplikasi di handphone Anda tanpa perlu membuka browser.
            </DialogDescription>
          </DialogHeader>

          {/* Panduan Khusus iOS (Safari di iPhone / iPad) */}
          {isIos ? (
            <div className="space-y-3.5 my-2 rounded-2xl border border-border bg-muted/30 p-4 text-copy-13">
              <span className="font-semibold text-foreground flex items-center gap-1.5 text-copy-13">
                <span>Cara Pasang di iPhone (Safari):</span>
              </span>
              <ol className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground mt-0.5">
                    1
                  </span>
                  <span>
                    Buka situs ini di browser <strong>Safari</strong>, lalu ketuk tombol <strong>Bagikan (Share)</strong>{' '}
                    <Share2 className="inline size-4 text-primary align-text-bottom mx-0.5" /> di bilah bawah layar.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground mt-0.5">
                    2
                  </span>
                  <span>
                    Gulir ke bawah dan pilih menu <strong>&quot;Tambahkan ke Layar Utama&quot;</strong> (Add to Home Screen){' '}
                    <PlusSquare className="inline size-4 text-primary align-text-bottom mx-0.5" />.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground mt-0.5">
                    3
                  </span>
                  <span>
                    Ketuk tombol <strong>&quot;Tambah&quot; (Add)</strong> di pojok kanan atas. Ikon Tirtawening akan langsung muncul di menu HP Anda!
                  </span>
                </li>
              </ol>
            </div>
          ) : (
            /* Panduan Umum (Android / Chrome / Desktop) */
            <div className="space-y-3.5 my-2 rounded-2xl border border-border bg-muted/30 p-4 text-copy-13">
              <span className="font-semibold text-foreground flex items-center gap-1.5 text-copy-13">
                <span>Langkah Pemasangan di Handphone:</span>
              </span>
              <ol className="space-y-2.5 text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground mt-0.5">
                    1
                  </span>
                  <span>
                    Pastikan Anda membuka situs ini di <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong> (bukan browser di dalam aplikasi WhatsApp/Instagram).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground mt-0.5">
                    2
                  </span>
                  <span>
                    Ketuk menu titik tiga (<strong>⋮</strong>) di pojok kanan atas browser, lalu pilih <strong>&quot;Pasang Aplikasi&quot;</strong> atau <strong>&quot;Tambahkan ke Layar Utama&quot;</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground mt-0.5">
                    3
                  </span>
                  <span>
                    Konfirmasi pemasangan dan tunggu beberapa detik hingga ikon Tirtawening muncul di layar utama HP Anda.
                  </span>
                </li>
              </ol>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Tutup
            </Button>
            {deferredPrompt && (
              <Button
                disabled={isInstalling}
                onClick={promptInstall}
                className="gap-1.5 font-semibold"
              >
                {isInstalling ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                <span>{isInstalling ? 'Memasang...' : 'Pasang Sekarang'}</span>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PwaContext.Provider>
  )
}
