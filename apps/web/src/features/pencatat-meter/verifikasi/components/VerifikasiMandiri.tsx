"use client"

// features/dashboard/verifikasi/components/VerifikasiMandiri.tsx —
// halaman verifikasi laporan meter mandiri pelanggan (master-detail),
// kembaran verifikasi-lapangan untuk sumber data /laporan-mandiri.
// Verifikasi mandiri mengoreksi laporan; pembacaan resmi tetap diterbitkan
// terpisah melalui verifikasi petugas.
//
// MENU KLIK KANAN memakai susunan terarah dari lib/MenuAksi.ts:
//   Verifikasi    → modal verifikasi/koreksi stand (tanpa membuat bacaan resmi)
//   Unverifikasi  → batalkan verifikasi (laporan kembali MENUNGGU)
//   BacaUlang     → modal tolak / minta foto ulang (status MENUNGGU)
//   Batal Baca Ulang → kembalikan baris DITOLAK ke antrean
//
// BARIS YANG SUDAH DIVERIFIKASI TIDAK DIHAPUS dari tabel: statusnya berubah
// menjadi DIVERIFIKASI, tetapi stand resmi tetap dibuat lewat alur Petugas.
import * as React from "react"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { ViewOffIcon } from "@/components/icons/ikon-lucide"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  ambilSatu,
  kirimJson,
  ApiError,
} from "@/lib/api-dashboard"
import {
  broadcastDataUpdated,
  subscribeDataUpdated,
} from "@/lib/data-sync"
import type { StatsVerifikasi } from "../types"
import { RingkasanVerifikasi } from "./RingkasanVerifikasi"
import { PanelKosong, PanelMemuat } from "./panel/KomponenPanel"
import {
  PanelTabelMandiri,
  type BarisMandiriTabel,
} from "./panel/PanelTabelMandiri"
import { PanelMandiri, type AksiMandiri } from "./panel/PanelMandiri"
import { MenuKonteks, type AksiKonteks } from "./MenuKonteks"
import {
  bangunMenuAksi,
  type KeadaanMenu,
  type KunciMenu,
  type ProfilMenu,
} from "../lib/menu-aksi"
import {
  KELAS_JUDUL_PANEL,
  KELAS_PANEL_DETAIL,
} from "../lib/tema-verifikasi"

function bobotRole(role: string | null | undefined): number {
  switch (role) {
    case "SUPER_ADMIN":
    case "DIREKSI":
    case "SENIOR_MANAGER":
      return 3
    case "MANAGER":
      return 2
    case "SUPERVISOR":
      return 1
    case "STAFF":
      return 0
    default:
      return -1
  }
}

const MIN_PANEL_WIDTH = 280
const MAX_PANEL_WIDTH = 600
const DEFAULT_PANEL_WIDTH = 340
const PANEL_WIDTH_COOKIE = "verif_panel_width"
const PANEL_WIDTH_STORAGE_KEY = "elysia-verif-panel-width"

export function VerifikasiMandiri({
  bisaAksi,
  role = "",
  profilMenu = "penilai",
  defaultWidth = DEFAULT_PANEL_WIDTH,
}: {
  bisaAksi: boolean
  role?: string
  /** "chn" = menu CHN / Batal Baca Ulang / Unverifikasi mati. */
  profilMenu?: ProfilMenu
  defaultWidth?: number
}) {
  // undefined = belum init; diisi periode terbaru yang punya data.
  const [periode, setPeriode] = React.useState<number | null | undefined>(
    undefined
  )
  const [stats, setStats] = React.useState<StatsVerifikasi | null>(null)
  const [idTerpilih, setIdTerpilih] = React.useState<string | null>(null)
  const [detailMemuat, setDetailMemuat] = React.useState(false)
  const [barisDimuat, setBarisDimuat] = React.useState(false)
  const [adaBaris, setAdaBaris] = React.useState(false)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const [detailRefreshKey, setDetailRefreshKey] = React.useState(0)
  const [ringkasanTerbuka, setRingkasanTerbuka] = React.useState(true)
  const [panelTerbuka, setPanelTerbuka] = React.useState(true)
  const togglePanel = React.useCallback(() => {
    setPanelTerbuka((v) => !v)
  }, [])
  const onBarisDimuat = React.useCallback((ada: boolean) => {
    setBarisDimuat(true)
    setAdaBaris(ada)
    if (!ada) setIdTerpilih(null)
  }, [])
  const onDetailMemuat = React.useCallback((memuat: boolean) => {
    setDetailMemuat(memuat)
  }, [])

  // State lebar panel kiri (diadopsi persis dari SidebarContext & DashboardShell)
  const [panelWidth, setPanelWidth] = React.useState<number>(defaultWidth)
  const [isResizing, setIsResizing] = React.useState(false)

  // Pastikan sinkronisasi cookie & localStorage saat mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(PANEL_WIDTH_STORAGE_KEY)
      if (saved) {
        const n = parseInt(saved, 10)
        if (!isNaN(n) && n >= MIN_PANEL_WIDTH && n <= MAX_PANEL_WIDTH) {
          setPanelWidth(n)
          document.cookie = `${PANEL_WIDTH_COOKIE}=${n}; path=/; max-age=31536000; SameSite=Lax`
        }
      }
    } catch {}
  }, [])

  // Drag handler mousemove/mouseup pada window (persis seperti di sidebar DashboardShell.tsx)
  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return // Hanya klik kiri
      e.preventDefault()

      setIsResizing(true)
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"

      const startX = e.clientX
      const startWidth = panelWidth

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX
        const newWidth = Math.max(
          MIN_PANEL_WIDTH,
          Math.min(MAX_PANEL_WIDTH, Math.round(startWidth + delta))
        )
        setPanelWidth(newWidth)
      }

      const onMouseUp = () => {
        setIsResizing(false)
        document.body.style.cursor = ""
        document.body.style.userSelect = ""
        window.removeEventListener("mousemove", onMouseMove)
        window.removeEventListener("mouseup", onMouseUp)

        setPanelWidth((finalWidth) => {
          try {
            document.cookie = `${PANEL_WIDTH_COOKIE}=${finalWidth}; path=/; max-age=31536000; SameSite=Lax`
            localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(finalWidth))
          } catch {}
          return finalWidth
        })
      }

      window.addEventListener("mousemove", onMouseMove)
      window.addEventListener("mouseup", onMouseUp)
    },
    [panelWidth]
  )

  const [menu, setMenu] = React.useState<{
    posisi: { x: number; y: number }
    baris: BarisMandiriTabel
  } | null>(null)
  const [aksi, setAksi] = React.useState<AksiMandiri | null>(null)
  const [konfirmasi, setKonfirmasi] = React.useState<{
    id: string
    judul: string
    deskripsi: string
  } | null>(null)
  const [mengirim, setMengirim] = React.useState(false)

  React.useEffect(() => {
    return subscribeDataUpdated(() => setRefreshKey((k) => k + 1))
  }, [])



  React.useEffect(() => {
    let batal = false
    ambilSatu<StatsVerifikasi>("/laporan-mandiri/stats", {
      periode: periode ?? undefined,
    })
      .then((s) => {
        if (batal) return
        setStats(s)
        setPeriode((lama) =>
          lama === undefined ? (s.periodes[0] ?? null) : lama
        )
      })
      .catch((err) => {
        if (!batal)
          toast.error(
            err instanceof ApiError ? err.message : "Gagal memuat ringkasan."
          )
      })
    return () => {
      batal = true
    }
  }, [periode, refreshKey, detailRefreshKey])

  async function jalankanUnverify() {
    if (!konfirmasi) return
    setMengirim(true)
    try {
      await kirimJson(`/laporan-mandiri/${konfirmasi.id}/unverify`, "PATCH", {})
      setKonfirmasi(null)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Aksi gagal dijalankan."
      )
    } finally {
      setMengirim(false)
    }
  }

  function aksiMenu(baris: BarisMandiriTabel): AksiKonteks[] {
    const id = baris.id
    if (!id) return []
    const nama = baris.pelanggan?.nama ?? baris.nomorLangganan ?? ""
    const tanpaAkses = "Akun Anda tidak punya akses verifikasi"
    const disetujui =
      baris.status === "DIVERIFIKASI" || baris.status === "DIGUNAKAN"
    const kalahJenjangVerifikator = Boolean(
      baris.verifiedByRole &&
      role &&
      bobotRole(role) < bobotRole(baris.verifiedByRole)
    )
    const tertahanTahapPetugas = Boolean(
      baris.sudahTahapPetugas ||
      baris.sudahDitagih
    )
    const bolehUnverify =
      bisaAksi &&
      disetujui &&
      !baris.sudahDitagih &&
      !tertahanTahapPetugas &&
      !kalahJenjangVerifikator
    const bolehBatalBacaUlang =
      bisaAksi && baris.status === "DITOLAK" && !kalahJenjangVerifikator

    const bukaKonfirmasi = (judul: string, deskripsi: string) => {
      setMenu(null)
      setKonfirmasi({ id, judul, deskripsi })
    }
    const tidakBerlaku: KeadaanMenu = {
      aktif: false,
      keterangan: "Aksi ini hanya berlaku untuk laporan petugas lapangan",
      onPilih: () => undefined,
    }

    const k: Record<KunciMenu, KeadaanMenu> = {
      verifikasi: {
        aktif: bisaAksi && baris.status === "MENUNGGU",
        keterangan: !bisaAksi
          ? tanpaAkses
          : baris.status === "MENUNGGU"
            ? "Periksa foto dan koreksi stand bila angka laporan tidak sesuai"
            : disetujui
              ? "Laporan sudah diverifikasi"
              : "Perlu dikembalikan ke antrean dulu",
        onPilih: () => {
          setMenu(null)
          setAksi("verify")
        },
      },
      unverifikasi: {
        aktif: bolehUnverify,
        keterangan: !bisaAksi
          ? tanpaAkses
          : !disetujui
            ? "Belum ada verifikasi yang bisa dibatalkan"
            : baris.sudahDitagih
              ? "Pembacaan resmi sudah dipakai tagihan — tidak bisa dibatalkan"
              : tertahanTahapPetugas
                ? "Tidak dapat dibatalkan karena data telah diverifikasi di Verifikasi Petugas (V1/V2/V3). Batalkan verifikasi di halaman Petugas terlebih dahulu"
                : kalahJenjangVerifikator
                  ? "Pembatalan memerlukan kewenangan minimal setara dengan verifikator sebelumnya"
                  : "Kembalikan laporan terverifikasi ke antrean dan batalkan sinkronisasi Petugas",
        onPilih: () =>
          bukaKonfirmasi(
            "Batalkan verifikasi laporan mandiri?",
            `Laporan ${nama} dikembalikan ke status MENUNGGU, koreksi stand mandiri dibatalkan ke kiriman awal warga, dan data pada halaman Verifikasi Petugas dikembalikan ke kondisi semula.`
          ),
      },
      edit: tidakBerlaku,
      add: tidakBerlaku,
      kondisiFoto: tidakBerlaku,
      bacaUlang: {
        aktif: bisaAksi && baris.status === "MENUNGGU",
        keterangan: !bisaAksi
          ? tanpaAkses
          : baris.status === "MENUNGGU"
            ? "Minta pelapor mengirim foto ulang"
            : undefined,
        onPilih: () => {
          setMenu(null)
          setAksi("tolak")
        },
      },
      batalBacaUlang: {
        aktif: bolehBatalBacaUlang,
        keterangan: !bisaAksi
          ? tanpaAkses
          : baris.status !== "DITOLAK"
            ? "Laporan tidak sedang dibaca ulang"
            : kalahJenjangVerifikator
              ? "Pembatalan memerlukan kewenangan minimal setara dengan verifikator sebelumnya"
              : undefined,
        onPilih: () =>
          bukaKonfirmasi(
            "Batalkan penolakan?",
            `Laporan ${nama} dikembalikan ke antrean MENUNGGU agar dapat diverifikasi kembali.`
          ),
      },
    }

    return bangunMenuAksi(profilMenu, k, "mandiri")
  }

  return (
    // TATA LETAK KEMBAR verifikasi-lapangan: panel detail di kiri terbuka di
    // ukuran paling kecil (defaultSize = minSize) supaya tabel langsung mendapat
    // lebar maksimal. Mengisi ruang layar penuh secara fluid tanpa container/breadcrumb.
    <>
      <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-row gap-3 p-3 overflow-hidden">
        {/* Panel Kiri: Detail Laporan (resizable persis seperti sidebar) */}
        <aside
          style={{
            width: panelTerbuka ? `${panelWidth}px` : undefined,
            minWidth: panelTerbuka ? `${panelWidth}px` : undefined,
          }}
          className={cn(
            KELAS_PANEL_DETAIL,
            "relative shrink-0 z-20",
            panelTerbuka ? "overflow-visible" : "",
            isResizing
              ? "transition-none select-none"
              : "transition-[width,opacity] duration-200 ease-in-out",
            panelTerbuka
              ? "shrink-0 opacity-100"
              : "pointer-events-none lg:w-0 lg:min-w-0 lg:opacity-0 lg:!overflow-hidden lg:border-none lg:-mr-3"
          )}
        >
          {/* Judul DI LUAR wadah bergulir supaya garis atasnya tidak terpotong. */}
          <div className="relative shrink-0 border-b border-border px-4 py-2.5">
            <h2 className={`text-center ${KELAS_JUDUL_PANEL}`}>
              Detail laporan
            </h2>
            {detailMemuat && (
              <Spinner
                className="absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-label="Memuat detail laporan"
              />
            )}
          </div>
          <div className="sidebar-scroll relative min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
            {!barisDimuat ? (
              <PanelMemuat />
            ) : !adaBaris ? (
              <PanelKosong
                icon={ViewOffIcon}
                pesan="Tidak ada laporan yang cocok dengan filter saat ini."
              />
            ) : idTerpilih ? (
              <PanelMandiri
                id={idTerpilih}
                refreshKey={refreshKey + detailRefreshKey}
                onLoadingChange={onDetailMemuat}
                aksi={aksi}
                onTutupAksi={() => setAksi(null)}
                onSelesai={() => setRefreshKey((k) => k + 1)}
              />
            ) : (
              <PanelMemuat />
            )}
          </div>

          {/* Resize Handle di border kanan persis seperti sidebar di DashboardShell.tsx */}
          <div
            aria-hidden="true"
            onMouseDown={handleMouseDown}
            className="group/handle hidden lg:block absolute top-0 -right-2 h-full w-4 cursor-col-resize z-50 select-none"
          >
            {/* Tombol Collapse di tengah handle (persis DashboardShell) */}
            <button
              type="button"
              aria-label="Tutup panel detail"
              title="Tutup panel detail"
              onClick={(e) => {
                e.stopPropagation()
                togglePanel()
              }}
              onMouseDown={(e) => {
                e.stopPropagation()
              }}
              className={cn(
                "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                "size-6 rounded-full border border-border bg-card",
                "grid place-content-center cursor-pointer transition-opacity duration-150",
                "opacity-0 group-hover/handle:opacity-100 focus-visible:opacity-100 shadow-xs",
                "hover:bg-neutral-100 hover:border-neutral-400 dark:hover:bg-neutral-800",
                isResizing && "!opacity-0 pointer-events-none"
              )}
            >
              <ChevronLeft className="size-3.5 text-muted-foreground" />
            </button>
          </div>
        </aside>

        {/* Floating Expand Handle di tepi kiri layar saat Panel Kiri disembunyikan (persis DashboardShell) */}
        {!panelTerbuka && (
          <div
            aria-hidden="true"
            className="group/handle-left hidden lg:block absolute inset-y-0 left-0 w-5 z-50 select-none"
          >
            <button
              type="button"
              aria-label="Buka panel detail"
              title="Buka panel detail"
              onClick={togglePanel}
              className={cn(
                "absolute left-1.5 top-1/2 -translate-y-1/2 z-50",
                "size-6 rounded-full border border-border bg-card",
                "grid place-content-center cursor-pointer transition-opacity duration-150",
                "opacity-0 group-hover/handle-left:opacity-100 focus-visible:opacity-100 shadow-xs",
                "hover:bg-neutral-100 hover:border-neutral-400 dark:hover:bg-neutral-800"
              )}
            >
              <ChevronRight className="size-3.5 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Panel Kanan: Tabel Laporan & Ringkasan */}
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-3">
          <RingkasanVerifikasi
            stats={stats}
            periode={periode ?? null}
            terbuka={ringkasanTerbuka}
            onToggle={() => setRingkasanTerbuka((v) => !v)}
          />

          <div className="relative group/table-top flex min-h-0 min-w-0 flex-1 flex-col">
            {!ringkasanTerbuka && (
              <button
                type="button"
                aria-label="Tampilkan kartu ringkasan"
                title="Tampilkan kartu ringkasan"
                onClick={() => setRingkasanTerbuka(true)}
                className={cn(
                  "absolute -top-3 right-4 z-30",
                  "size-6 rounded-full border border-border bg-card",
                  "grid place-content-center cursor-pointer transition-opacity duration-150",
                  "opacity-0 pointer-events-none group-hover/table-top:opacity-100 group-hover/table-top:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto shadow-xs",
                  "hover:bg-neutral-100 hover:border-neutral-400 dark:hover:bg-neutral-800"
                )}
              >
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>
            )}

            <PanelTabelMandiri
              periodes={stats?.periodes ?? []}
              periode={periode}
              onPeriode={setPeriode}
              refreshKey={refreshKey}
              idTerpilih={idTerpilih}
              onRowsLoaded={onBarisDimuat}
              onKlikBaris={(row) => setIdTerpilih(row.id)}
              onKlikKanan={(row, posisi) => {
                setIdTerpilih(row.id)
                setAksi(null)
                setMenu({ posisi, baris: row })
              }}
              ringkasanTerbuka={ringkasanTerbuka}
              onRingkasan={setRingkasanTerbuka}
              stats={stats}
              bisaAksi={bisaAksi}
              onBerubah={() => setDetailRefreshKey((k) => k + 1)}
            />
          </div>
        </div>
      </div>

      {menu && (
        <MenuKonteks
          posisi={menu.posisi}
          judul={`${menu.baris.nomorLangganan ?? ""} · ${menu.baris.pelanggan?.nama ?? ""}`}
          aksi={aksiMenu(menu.baris)}
          onTutup={() => setMenu(null)}
        />
      )}

      <AlertDialog
        open={konfirmasi !== null}
        onOpenChange={(buka) => {
          if (!buka && !mengirim) setKonfirmasi(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{konfirmasi?.judul}</AlertDialogTitle>
            <AlertDialogDescription>
              {konfirmasi?.deskripsi}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mengirim}>Batal</AlertDialogCancel>
            {/* onClick tanpa auto-close: dialog baru ditutup setelah server
                menjawab sukses; galat tampil di dalam dialog. */}
            <AlertDialogAction
              disabled={mengirim}
              onClick={(e) => {
                e.preventDefault()
                void jalankanUnverify()
              }}
            >
              {mengirim && <Spinner className="size-3.5" />}
              Ya, lanjutkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
