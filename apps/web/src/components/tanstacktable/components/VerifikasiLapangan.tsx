"use client"

// features/dashboard/verifikasi/components/VerifikasiLapangan.tsx —
// halaman verifikasi laporan petugas lapangan (master-detail): panel detail
// murni penampil (kiri) + kartu ringkasan dan tabel laporan (kanan).
//
// SELURUH AKSI lewat MENU KLIK KANAN (disusun lib/MenuAksi.ts):
//   Verifikasi    → langsung menandai ring berikutnya; tidak membuka modal
//   Unverifikasi  → batalkan SATU tahap terakhir (dialog konfirmasi)
//   Edit / CHN    → modal Koreksi Data Pembacaan
//   ADD           → Manual ADD satuan, menunggu verifikasi ulang
//   Kondisi Foto  → penilaian tersimpan di AuditLog
//   BacaUlang     → modal cek ulang (tolak)
//   Batal Baca Ulang → kembalikan baris DITOLAK ke antrean
// Pembacaan resmi baru dibuat saat V3 — lihat laporan-harian.router.ts.
import * as React from "react"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { ViewOffIcon } from "@/features/dashboard/shared/icons/ikon-lucide"
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
  ambilList,
  kirimJson,
  ApiError,
} from "@/features/dashboard/shared/api/api-dashboard"
import {
  broadcastDataUpdated,
  subscribeDataUpdated,
} from "@/features/dashboard/shared/lib/data-sync"
import type {
  StatsVerifikasi,
  RingLaporanHarian,
} from "../types"
import { tahapLaporanHarian } from "../types"
import { RingkasanVerifikasi } from "./RingkasanVerifikasi"
import { PanelTabel } from "./panel/PanelTabel"
import { PanelKosong, PanelMemuat } from "./panel/KomponenPanel"
import { PanelLapangan } from "./panel/PanelLapangan"
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
import type { PenugasanFilter } from "../lib/penyaringan-relasi"
import {
  sertakanPenugasanPadaOpsiRute,
  type OpsiFilterPencarian,
} from "../lib/penyaringan-relasi"
import {
  ModalKoreksi,
  dataKoreksiDariBaris,
  type HasilKoreksi,
} from "./modal/ModalKoreksi"
import {
  ModalKondisiFoto,
  type HasilKondisiFoto,
} from "./modal/ModalKondisiFoto"
import { ModalBacaManual, type HasilBacaManual } from "./modal/ModalBacaManual"
import { ModalCekUlang } from "./modal/ModalCekUlang"

// Cermin ROLE_GROUPS (server/middleware/rbac.ts). Server tetap penjaga aslinya;
// ini hanya menentukan item menu mana yang aktif.
const SUPERVISOR_UP = new Set([
  "SUPER_ADMIN",
  "DIREKSI",
  "SENIOR_MANAGER",
  "MANAGER",
  "SUPERVISOR",
])
const MANAGEMENT_UP = new Set([
  "SUPER_ADMIN",
  "DIREKSI",
  "SENIOR_MANAGER",
  "MANAGER",
])
const SENIOR_UP = new Set(["SUPER_ADMIN", "DIREKSI", "SENIOR_MANAGER"])
const BISA_EDIT = new Set([
  "SUPER_ADMIN",
  "DIREKSI",
  "SENIOR_MANAGER",
  "MANAGER",
  "SUPERVISOR",
  "STAFF",
])

// ISI role mana saja yang memakai menu profil "chn" (CHN, Batal Baca Ulang,
// Unverifikasi mati). Dikosongkan sampai peran itu dipastikan — semua role
// sementara memakai profil "penilai".
const ROLE_CHN = new Set<string>([])

/** Bentuk baris grid /laporan-harian yang dibaca kolom & menu konteks. */
type BarisLaporan = RingLaporanHarian & {
  id: string
  pelangganId?: string | null
  nomorLangganan?: string
  namaPelanggan?: string | null
  alamatPelanggan?: string | null
  periode?: number
  kondisi?: string | null
  standAwal?: number
  standAkhir?: number
  standAkhirRevisi?: number | null
  standAwalRevisi?: number | null
  kondisiRevisi?: string | null
  standAngkatLama?: number | null
  standMeterBaru?: number | null
  pemakaian?: number
  pemakaianTagihVerif?: number | null
  meterVerifId?: string | null
  blokTarifVerif?: number | null
  pemakaianLalu?: number | null
  persentase?: number | null
  nomorMeter?: string | null
  tanggalCatat?: string | null
  pelanggan?: {
    id: string
    nomorLangganan?: string
    nama: string
    alamat?: string | null
    tarifGolongan?: { kodeAsli: string } | null
    rute?: { kode: string } | null
    zona?: { kode: string; wilayahSeksi?: { kode: string } | null } | null
  } | null
  pencatat?: { id: string; namaLapangan: string } | null
  pembacaan?: { id: string; standAkhir: number } | null
  verif1By?: { name: string | null } | null
  verif2By?: { name: string | null } | null
  verif3By?: { name: string | null } | null
  verifiedBy?: { name: string | null } | null
  isCorrected?: boolean
}

type Konfirmasi = {
  endpoint: "verif2" | "verif3" | "unverify"
  id: string
  judul: string
  deskripsi: string
  destruktif?: boolean
}

/** Modal formulir baru (tampilan saja) yang sedang terbuka. */
type ModalLain = {
  jenis: "edit" | "chn" | "add" | "foto"
  baris: BarisLaporan
}

const MIN_PANEL_WIDTH = 280
const MAX_PANEL_WIDTH = 600
const DEFAULT_PANEL_WIDTH = 340
const PANEL_WIDTH_COOKIE = "verif_panel_width"
const PANEL_WIDTH_STORAGE_KEY = "elysia-verif-panel-width"

export function VerifikasiLapangan({
  role,
  defaultWidth = DEFAULT_PANEL_WIDTH,
}: {
  role: string
  defaultWidth?: number
}) {
  const bisaV1 = SUPERVISOR_UP.has(role)
  const bisaV2 = MANAGEMENT_UP.has(role)
  const bisaV3 = SENIOR_UP.has(role)
  const bisaEdit = BISA_EDIT.has(role)
  const ringAkun: 1 | 2 | 3 | null = bisaV3 ? 3 : bisaV2 ? 2 : bisaV1 ? 1 : null
  const profil: ProfilMenu = ROLE_CHN.has(role) ? "chn" : "penilai"

  // undefined = belum init (diisi periode terbaru yang punya data).
  // null = pengguna memilih "Semua periode".
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
  // Tab aktif diangkat ke sini: baris "belum dibaca" adalah DaftarCatat, bukan
  // laporan, jadi id-nya TIDAK ADA di /laporan-harian/:id.
  const [tab, setTab] = React.useState<"laporan" | "belum">("laporan")
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
    baris: BarisLaporan
  } | null>(null)
  const [cekUlangId, setCekUlangId] = React.useState<string | null>(null)
  const [modalLain, setModalLain] = React.useState<ModalLain | null>(null)
  const [konfirmasi, setKonfirmasi] = React.useState<Konfirmasi | null>(null)
  const [mengirim, setMengirim] = React.useState(false)

  const [pencatats, setPencatats] = React.useState<
    { id: string; namaLapangan: string }[]
  >([])
  const [rutes, setRutes] = React.useState<{ id: string; kode: string }[]>([])
  const [penugasanRute, setPenugasanRute] = React.useState<PenugasanFilter[]>(
    []
  )
  const [penugasanRuteDimuat, setPenugasanRuteDimuat] = React.useState(false)
  const [opsiPencarian, setOpsiPencarian] = React.useState<OpsiFilterPencarian>({})
  const opsiPencarianDenganPenugasan = React.useMemo(
    () =>
      sertakanPenugasanPadaOpsiRute(
        opsiPencarian,
        penugasanRute,
        penugasanRuteDimuat
      ),
    [opsiPencarian, penugasanRute, penugasanRuteDimuat]
  )

  React.useEffect(() => {
    return subscribeDataUpdated(() => setRefreshKey((k) => k + 1))
  }, [])



  React.useEffect(() => {
    let batal = false
    Promise.all([
      ambilList<{ id: string; namaLapangan: string }>("/pencatat", {
        pageSize: 500,
      }),
      ambilList<{
        id: string
        kode: string
        seksiCater: { wilayahDistId: string }
      }>("/rute", { pageSize: 500 }),
      ambilList<{ id: string; kode: string; nama: string }>("/wilayah-dist", {
        pageSize: 500,
      }),
      ambilList<{
        id: string
        kode: string
        nama: string
        wilayahSeksi: { wilayahDistId: string }
      }>("/zona", { pageSize: 500 }),
      ambilList<{ id: string; kodeAsli: string; nama: string }>("/tarif", {
        pageSize: 500,
      }),
      ambilList<{ id: string; kode: string; nama: string }>("/kecamatan", {
        pageSize: 500,
      }),
      ambilList<{
        id: string
        kode: string
        nama: string
        kecamatanId: string
      }>("/kelurahan", { pageSize: 500 }),
    ])
      .then(
        ([
          hasilPencatat,
          hasilRute,
          wilayah,
          zona,
          tarif,
          kecamatan,
          kelurahan,
        ]) => {
          if (batal) return
          setPencatats(hasilPencatat.rows)
          setRutes(hasilRute.rows.map(({ id, kode }) => ({ id, kode })))
          setOpsiPencarian({
            wilayahDistId: wilayah.rows.map(({ id, kode, nama }) => ({
              value: id,
              label: `${kode} · ${nama}`,
            })),
            zonaId: zona.rows.map(({ id, kode, nama, wilayahSeksi }) => ({
              value: id,
              label: `${kode} · ${nama}`,
              wilayahDistId: wilayahSeksi.wilayahDistId,
            })),
            ruteLanjutanId: hasilRute.rows.map(({ id, kode, seksiCater }) => ({
              value: id,
              label: kode,
              wilayahDistId: seksiCater.wilayahDistId,
            })),
            tarifGolonganId: tarif.rows.map(({ id, kodeAsli, nama }) => ({
              value: id,
              label: `${kodeAsli} · ${nama}`,
            })),
            pencatatLanjutanId: hasilPencatat.rows.map(
              ({ id, namaLapangan }) => ({
                value: id,
                label: namaLapangan,
              })
            ),
            kecamatanId: kecamatan.rows.map(({ id, kode, nama }) => ({
              value: id,
              label: `${kode} · ${nama}`,
            })),
            kelurahanId: kelurahan.rows.map(
              ({ id, kode, nama, kecamatanId }) => ({
                value: id,
                label: `${kode} · ${nama}`,
                kecamatanId,
              })
            ),
          })
        }
      )
      .catch((err) => {
        if (!batal) {
          toast.error(
            err instanceof ApiError ? err.message : "Gagal memuat data pilihan."
          )
        }
      })
    return () => {
      batal = true
    }
  }, [])

  React.useEffect(() => {
    let batal = false
    setPenugasanRuteDimuat(false)
    setPenugasanRute([])
    ambilSatu<PenugasanFilter[]>("/penugasan-rute/opsi-filter", {
      periode: periode ?? undefined,
    })
      .then((pasangan) => {
        if (!batal) {
          setPenugasanRute(pasangan)
          setPenugasanRuteDimuat(true)
        }
      })
      .catch((err) => {
        if (!batal) {
          setPenugasanRute([])
          setPenugasanRuteDimuat(true)
          toast.error(
            err instanceof ApiError
              ? err.message
              : "Gagal memuat relasi Petugas dan Rute."
          )
        }
      })
    return () => {
      batal = true
    }
  }, [periode])

  React.useEffect(() => {
    let batal = false
    ambilSatu<StatsVerifikasi>("/laporan-harian/stats", {
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

  const ambang = stats?.ambangAnomali ?? 50

  async function jalankanKonfirmasi() {
    if (!konfirmasi) return
    setMengirim(true)
    try {
      await kirimJson(
        `/laporan-harian/${konfirmasi.id}/${konfirmasi.endpoint}`,
        "PATCH",
        {}
      )
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

  async function verifikasiLangsung(id: string) {
    setMengirim(true)
    try {
      const hasil = await kirimJson<{ ring: 1 | 2 | 3; laporan: unknown }>(
        `/laporan-harian/${id}/verifikasi-langsung`,
        "PATCH",
        {}
      )
      toast.success(
        hasil.ring === 3
          ? "Hasil resmi berhasil diterbitkan atau diperbarui."
          : `Laporan ditandai diverifikasi pada ring V${hasil.ring}.`
      )
      setRefreshKey((k) => k + 1)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Verifikasi gagal dijalankan."
      )
    } finally {
      setMengirim(false)
    }
  }

  async function simpanKoreksi(id: string, hasil: HasilKoreksi) {
    await kirimJson(`/laporan-harian/${id}/koreksi`, "PATCH", hasil)
    setModalLain(null)
    setRefreshKey((k) => k + 1)
    toast.success("Koreksi laporan berhasil disimpan.")
  }

  async function simpanBacaManual(baris: BarisLaporan, hasil: HasilBacaManual) {
    const { pelangganId: pelangganIdHasil, ...dataHasil } = hasil
    const pelangganId =
      pelangganIdHasil ?? baris.pelangganId ?? baris.pelanggan?.id
    if (!pelangganId || !baris.periode) {
      throw new Error("Data pelanggan atau periode tidak lengkap.")
    }
    await kirimJson("/manual-add/satuan", "POST", {
      pelangganId,
      periode: baris.periode,
      ...dataHasil,
    })
    setModalLain(null)
    setRefreshKey((k) => k + 1)
    toast.success("Manual ADD tersimpan dan menunggu verifikasi ulang.")
  }

  async function simpanKondisiFoto(id: string, hasil: HasilKondisiFoto) {
    await kirimJson(`/laporan-harian/${id}/kondisi-foto`, "POST", hasil)
    setModalLain(null)
    toast.success("Penilaian kondisi foto tersimpan di riwayat audit.")
  }

  /// Keadaan tiap item menu menurut tahap baris + role. Susunan dan label
  /// diurus bangunMenuAksi; di sini hanya: boleh/tidak, dan apa yang terjadi.
  function aksiMenu(baris: BarisLaporan): AksiKonteks[] {
    const id = baris.id
    if (!id) return []
    const tahap = tahapLaporanHarian(baris)
    const nama =
      baris.pelanggan?.nama ?? baris.namaPelanggan ?? baris.nomorLangganan ?? ""

    const bukaKonfirmasi = (k: Omit<Konfirmasi, "id" | "endpoint">) => {
      setMenu(null)
      setKonfirmasi({ id, endpoint: "unverify", ...k })
    }
    const bukaModal = (jenis: ModalLain["jenis"]) => {
      setMenu(null)
      setModalLain({ jenis, baris })
    }

    // Verifikasi = ring BERIKUTNYA yang belum terisi.
    const bolehRing =
      (ringAkun === 1 && (tahap === "MENUNGGU_V1" || tahap === "DITOLAK")) ||
      (ringAkun === 2 &&
        (tahap === "MENUNGGU_V1" || tahap === "MENUNGGU_V2")) ||
      (ringAkun === 3 &&
        (tahap === "MENUNGGU_V1" ||
          tahap === "MENUNGGU_V2" ||
          tahap === "MENUNGGU_V3"))

    // Unverifikasi = batalkan persetujuan verifikasi dan kembalikan laporan ke antrean belum diverifikasi.
    // V1 hanya dapat dibatalkan oleh V2/V3 (bisaV2), V2/V3 dapat dibatalkan oleh V3 (bisaV3).
    const unverif =
      tahap === "RESMI"
        ? {
            nama: "Batalkan Verifikasi (V3)",
            boleh: bisaV3,
            judul: "Batalkan verifikasi resmi (V3)?",
            deskripsi: `Persetujuan verifikasi V3 untuk laporan ${nama} dibatalkan. Status laporan dikembalikan ke Belum Diverifikasi (antrean awal).`,
          }
        : tahap === "MENUNGGU_V3"
          ? {
              nama: "Batalkan Verifikasi (V2)",
              boleh: bisaV3,
              judul: "Batalkan verifikasi V2?",
              deskripsi: `Validasi V2 pada laporan ${nama} dibatalkan. Status laporan dikembalikan ke Belum Diverifikasi (antrean awal).`,
            }
          : tahap === "MENUNGGU_V2"
            ? {
                nama: "Batalkan Verifikasi (V1)",
                boleh: bisaV2,
                judul: "Batalkan verifikasi V1?",
                deskripsi: `Pemeriksaan V1 pada laporan ${nama} dibatalkan. Status laporan dikembalikan ke Belum Diverifikasi (antrean awal).`,
              }
            : null

    const k: Record<KunciMenu, KeadaanMenu> = {
      verifikasi: {
        aktif: bolehRing,
        keterangan: ringAkun
          ? `Tandai sebagai V${ringAkun}`
          : "Role tidak memiliki izin verifikasi",
        onPilih: () => {
          setMenu(null)
          void verifikasiLangsung(id)
        },
      },
      unverifikasi: {
        aktif: !!unverif && unverif.boleh,
        keterangan: unverif?.nama ?? "Belum ada tahap yang bisa dibatalkan",
        onPilih: () =>
          unverif &&
          bukaKonfirmasi({
            judul: unverif.judul,
            deskripsi: unverif.deskripsi,
            destruktif: true,
          }),
      },
      edit: {
        aktif:
          bisaEdit &&
          tahap !== "RESMI" &&
          (role === "STAFF" ||
            (tahap === "MENUNGGU_V3"
              ? bisaV3
              : tahap === "MENUNGGU_V2"
                ? bisaV2
                : bisaV1)),
        keterangan:
          tahap === "RESMI"
            ? "Buka kembali (Batalkan V3) terlebih dahulu sebelum mengoreksi hasil resmi"
            : tahap === "MENUNGGU_V3" && !bisaV3 && role !== "STAFF"
              ? "Koreksi setelah V2 memerlukan Senior Manager ke atas (V3)"
              : tahap === "MENUNGGU_V2" && !bisaV2 && role !== "STAFF"
                ? "Koreksi setelah V1 memerlukan Manager ke atas (V2/V3)"
                : undefined,
        onPilih: () => bukaModal(profil === "chn" ? "chn" : "edit"),
      },
      add: {
        aktif:
          bisaEdit &&
          (tahap === "MENUNGGU_V2" ||
            tahap === "MENUNGGU_V3" ||
            tahap === "RESMI"),
        keterangan:
          tahap === "MENUNGGU_V1" || tahap === "DITOLAK"
            ? "Laporan belum diverifikasi; gunakan menu Edit/Koreksi"
            : undefined,
        onPilih: () => bukaModal("add"),
      },
      kondisiFoto: { aktif: bisaV1, onPilih: () => bukaModal("foto") },
      bacaUlang: {
        aktif: bisaV1 && tahap !== "RESMI" && tahap !== "DITOLAK",
        keterangan:
          tahap === "DITOLAK"
            ? "Sudah dikembalikan untuk cek ulang"
            : undefined,
        onPilih: () => {
          setMenu(null)
          setCekUlangId(id)
        },
      },
      batalBacaUlang: {
        aktif: bisaV1 && tahap === "DITOLAK",
        keterangan:
          tahap === "DITOLAK" ? undefined : "Baris tidak sedang dibaca ulang",
        onPilih: () =>
          bukaKonfirmasi({
            judul: "Batalkan penolakan?",
            deskripsi: `Laporan ${nama} dikembalikan ke antrean MENUNGGU. Ring dan koreksi sebelumnya tetap tercatat dalam audit.`,
          }),
      },
    }

    return bangunMenuAksi(profil, k)
  }

  return (
    <>
      {/* TATA LETAK FULL FLUID: panel detail KIRI (terbuka di ukuran paling kecil —
          defaultSize = minSize), tabel KANAN yang butuh lebar. Mengisi ruang layar penuh
          secara fluid tanpa container/breadcrumb. */}
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
            {tab === "laporan" && detailMemuat && (
              <Spinner
                className="absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-label="Memuat detail laporan"
              />
            )}
          </div>
          <div className="sidebar-scroll relative min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
            {tab === "belum" ? (
              <PanelKosong
                icon={ViewOffIcon}
                pesan="Sambungan ini belum punya setoran, jadi belum ada detail laporan. Tagih pencatatannya ke petugas rute."
              />
            ) : !barisDimuat ? (
              <PanelMemuat />
            ) : !adaBaris ? (
              <PanelKosong
                icon={ViewOffIcon}
                pesan="Tidak ada laporan yang cocok dengan filter saat ini."
              />
            ) : idTerpilih ? (
              <PanelLapangan
                id={idTerpilih}
                refreshKey={refreshKey + detailRefreshKey}
                onLoadingChange={onDetailMemuat}
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

            <PanelTabel
                  periodes={stats?.periodes ?? []}
                  pencatats={pencatats}
                  rutes={rutes}
                  penugasanRute={penugasanRute}
                  opsiPencarian={opsiPencarianDenganPenugasan}
                  ambangAnomali={ambang}
                  bolehRing={(r) =>
                    r === 1 ? bisaV1 : r === 2 ? bisaV2 : bisaV3
                  }
                  idTerpilih={idTerpilih}
                  onRowsLoaded={onBarisDimuat}
                  onPeriodeBerubah={setPeriode}
                  onKlikBaris={(row) => setIdTerpilih(row.id)}
                  onKlikKanan={(row, posisi) => {
                    setIdTerpilih(row.id)
                    setCekUlangId(null)
                    setMenu({ posisi, baris: row as BarisLaporan })
                  }}
                  refreshKey={refreshKey}
                  onBerubah={() => setRefreshKey((k) => k + 1)}
                  sisaKerja={stats ? stats.total - stats.diverifikasi : null}
                  onTabBerubah={(t) => {
                    setTab(t)
                    setIdTerpilih(null)
                    setBarisDimuat(false)
                    setAdaBaris(false)
                    setCekUlangId(null)
                  }}
                  anomali={stats?.anomali ?? 0}
                  ringkasanTerbuka={ringkasanTerbuka}
                  onRingkasan={setRingkasanTerbuka}
                  stats={stats}
                  bolehEdit={(row) => {
                    const tahap = tahapLaporanHarian(row as BarisLaporan)
                    return (
                      bisaEdit &&
                      tahap !== "RESMI" &&
                      (role === "STAFF" ||
                        (tahap === "MENUNGGU_V3"
                          ? bisaV3
                          : tahap === "MENUNGGU_V2"
                            ? bisaV2
                            : bisaV1))
                    )
                  }}
                  bolehEditTagihan={(row) => {
                    const tahap = tahapLaporanHarian(row as BarisLaporan)
                    return bisaV3 && tahap !== "RESMI"
                  }}
                  onDetailBerubah={() => setDetailRefreshKey((k) => k + 1)}
                />
              </div>
            </div>
          </div>

      {menu && (
        <MenuKonteks
          posisi={menu.posisi}
          judul={`${menu.baris.nomorLangganan ?? ""} · ${menu.baris.pelanggan?.nama ?? menu.baris.namaPelanggan ?? ""}`}
          aksi={aksiMenu(menu.baris)}
          onTutup={() => setMenu(null)}
        />
      )}

      {/* Modal edit terhubung ke koreksi laporan petugas; jalur mandiri tetap baca-saja. */}
      {modalLain &&
        (modalLain.jenis === "edit" || modalLain.jenis === "chn") && (
          <ModalKoreksi
            key={modalLain.baris.id}
            id={modalLain.baris.id}
            data={dataKoreksiDariBaris(modalLain.baris)}
            onTutup={() => setModalLain(null)}
            onSimpan={(hasil) => simpanKoreksi(modalLain.baris.id, hasil)}
            bolehAturTagihan={bisaV3}
          />
        )}
      {modalLain?.jenis === "add" && (
        <ModalBacaManual
          data={{
            ...dataKoreksiDariBaris(modalLain.baris),
            pelangganId:
              modalLain.baris.pelangganId ??
              modalLain.baris.pelanggan?.id ??
              (modalLain.baris as any).nolg ??
              null,
            nomorLangganan:
              modalLain.baris.nomorLangganan ??
              modalLain.baris.pelanggan?.nomorLangganan ??
              (modalLain.baris as any).nolg ??
              null,
            periodeId:
              modalLain.baris.periode ??
              ((modalLain.baris as any).thbl
                ? Number((modalLain.baris as any).thbl)
                : null),
          }}
          onTutup={() => setModalLain(null)}
          onSimpan={(hasil) => simpanBacaManual(modalLain.baris, hasil)}
        />
      )}
      {modalLain?.jenis === "foto" && (
        <ModalKondisiFoto
          data={dataKoreksiDariBaris(modalLain.baris)}
          id={modalLain.baris.id}
          onTutup={() => setModalLain(null)}
          onSimpan={(hasil) => simpanKondisiFoto(modalLain.baris.id, hasil)}
        />
      )}
      {cekUlangId && (
        <ModalCekUlang
          id={cekUlangId}
          onTutup={() => setCekUlangId(null)}
          onSelesai={() => {
            setCekUlangId(null)
            setRefreshKey((k) => k + 1)
          }}
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
                void jalankanKonfirmasi()
              }}
            >
              {mengirim && <Spinner className="size-3.5" />}
              {konfirmasi?.destruktif ? "Ya, batalkan" : "Ya, lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
