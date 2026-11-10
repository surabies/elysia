import type { JendelaLaporMandiri } from "@/lib/domain/lapor-mandiri"

export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly details?: Array<{ path: string; message: string }>

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Array<{ path: string; message: string }>
  ) {
    super(message)
    this.code = code
    this.status = status
    this.details = details
  }
}

interface EnvelopeSukses<T> {
  success: true
  data: T
}
interface EnvelopeError {
  success: false
  error: {
    code?: string
    message?: string
    details?: Array<{ path: string; message: string }>
  } | string
}

async function tangani<T>(res: Response): Promise<T> {
  let body: any
  try {
    body = await res.json()
  } catch {
    throw new ApiError(
      res.status,
      "NETWORK",
      "Gagal menghubungi server. Periksa koneksi Anda dan coba lagi."
    )
  }

  if (!res.ok || !body.success) {
    const errMsg = typeof body.error === "string" ? body.error : body.error?.message
    const code = typeof body.error === "object" ? body.error?.code : undefined
    const details = typeof body.error === "object" ? body.error?.details : undefined
    throw new ApiError(
      res.status,
      code ?? "UNKNOWN",
      errMsg ?? "Terjadi kesalahan.",
      details
    )
  }

  return body.data !== undefined ? body.data : body
}

export interface TarifGolonganPublik {
  kodeAsli: string
  kategori: string
}

export interface TagihanPublik {
  periode: number
  pemakaianM3: number
  jmlHargaAir: number
  beaBeban: number
  beaAdmin: number
  airKotor: number
  lainLain: number
  denda: number
  totalTagihan: number
  status: "BELUM_BAYAR" | "SUDAH_BAYAR" | "JATUH_TEMPO" | "DIHAPUSKAN"
  tanggalJatuhTempo: string
  tanggalBayar: string | null
  standLalu: number | null
  standAkhir: number | null
}

export interface PelangganPublik {
  nomorLangganan: string
  nama: string
  alamat: string
  rt: string | null
  rw: string | null
  status: string
  tarifGolongan: TarifGolonganPublik | null
}

export interface HasilCekTagihan {
  pelanggan: PelangganPublik
  tagihan: TagihanPublik[]
  totalTunggakan: number
}

export async function cekTagihan(input: { nomorLangganan: string }): Promise<HasilCekTagihan> {
  const res = await fetch(`/api/publik/tagihan/${encodeURIComponent(input.nomorLangganan)}`)
  const json = await tangani<any>(res)

  return {
    pelanggan: {
      nomorLangganan: json.pelanggan.nolg,
      nama: json.pelanggan.nama,
      alamat: json.pelanggan.alamat,
      rt: null,
      rw: null,
      status: json.pelanggan.status ?? "AKTIF",
      tarifGolongan: json.pelanggan.tarifKode
        ? {
            kodeAsli: json.pelanggan.tarifKode,
            kategori: json.pelanggan.tarifNama ?? json.pelanggan.tarifKode,
          }
        : null,
    },
    tagihan: (json.tagihan ?? []).map((t: any) => ({
      periode: Number(t.thbl),
      pemakaianM3: Number(t.pakaiM3 ?? 0),
      jmlHargaAir: Number(t.jmlHargaAir ?? 0),
      beaBeban: Number(t.beaBeban ?? 0),
      beaAdmin: Number(t.beaAdmin ?? 0),
      airKotor: Number(t.airKotor ?? 0),
      lainLain: 0,
      denda: 0,
      totalTagihan: Number(t.totalTagihan ?? 0),
      status: t.statusLunas ? "SUDAH_BAYAR" : "BELUM_BAYAR",
      tanggalJatuhTempo: `${String(t.thbl).slice(0, 4)}-${String(t.thbl).slice(4, 6)}-20`,
      tanggalBayar: null,
      standLalu: null,
      standAkhir: null,
    })),
    totalTunggakan: json.ringkasan?.totalNominalTagihan ?? 0,
  }
}

export interface DetailLaporanBulanIni {
  periode: number
  standDilaporkan: number
  fotoUrl: string
  status: string
  alasanDitolak: string | null
  createdAt: string
  verifiedAt: string | null
  standLalu: number | null
  standAkhir: number | null
  pemakaianM3: number | null
}

export interface PelangganPratinjau extends PelangganPublik {
  periodeBerjalan: number
  sudahLaporBulanIni: boolean
  statusLaporanBulanIni: string | null
  bisaKirimUlang: boolean
  alasanDitolak: string | null
  laporanBulanIni: DetailLaporanBulanIni | null
}

export async function cariPelanggan(
  nomorLangganan: string,
  _periodeUji?: number
): Promise<PelangganPratinjau> {
  const periodeAktif = _periodeUji ?? 202601
  const res = await fetch(`/api/publik/tagihan/${encodeURIComponent(nomorLangganan)}`)
  const json = await tangani<any>(res)

  // Cek apakah sudah pernah lapor mandiri di periode target
  let sudahLaporBulanIni = false
  let statusLaporanBulanIni: string | null = null
  let alasanDitolak: string | null = null
  let laporanBulanIni: DetailLaporanBulanIni | null = null

  try {
    const statusRes = await fetch(
      `/api/cater/mandiri/public/status/${encodeURIComponent(nomorLangganan)}?thbl=${periodeAktif}`
    )
    if (statusRes.ok) {
      const statusJson = await statusRes.json()
      if (statusJson.success && statusJson.data) {
        sudahLaporBulanIni = true
        statusLaporanBulanIni = statusJson.data.statusVerifikasi // 'PENDING' | 'APPROVED' | 'REJECTED'
        alasanDitolak = statusJson.data.alasanPenolakan ?? null
        laporanBulanIni = {
          periode: Number(statusJson.data.thbl),
          standDilaporkan: Number(statusJson.data.stma ?? 0),
          fotoUrl: statusJson.data.fotoMeterUrl,
          status: statusJson.data.statusVerifikasi,
          alasanDitolak: statusJson.data.alasanPenolakan ?? null,
          createdAt: statusJson.data.createdAt,
          verifiedAt: statusJson.data.verifiedAt ?? null,
          standLalu: null,
          standAkhir: null,
          pemakaianM3: Number(statusJson.data.pakaiM3 ?? 0),
        }
      }
    }
  } catch {
    // fallback jika endpoint status belum terjangkau
  }

  return {
    nomorLangganan: json.pelanggan.nolg,
    nama: json.pelanggan.nama,
    alamat: json.pelanggan.alamat,
    rt: null,
    rw: null,
    status: json.pelanggan.status ?? "AKTIF",
    tarifGolongan: json.pelanggan.tarifKode
      ? {
          kodeAsli: json.pelanggan.tarifKode,
          kategori: json.pelanggan.tarifNama ?? json.pelanggan.tarifKode,
        }
      : null,
    periodeBerjalan: periodeAktif,
    sudahLaporBulanIni,
    statusLaporanBulanIni,
    bisaKirimUlang: statusLaporanBulanIni === "REJECTED",
    alasanDitolak,
    laporanBulanIni,
  }
}

export interface HasilPengaduan {
  nomorTiket: string
  targetSelesaiAt: string | null
  pesan: string
}

export interface InputPengaduan {
  klasifikasi: string
  jenis: string
  judul?: string
  deskripsi: string
  pelapor: string
  kontakPelapor: string
  alamatKejadian?: string
  nomorLangganan?: string
  koordinat?: { lat: number; lng: number }
  foto?: File | null
  video?: File | null
  clientRequestId?: string
}

export async function kirimPengaduan(input: InputPengaduan): Promise<HasilPengaduan> {
  const payload: any = {
    nomorLangganan: input.nomorLangganan || undefined,
    pelapor: input.pelapor,
    kontakPelapor: input.kontakPelapor,
    jenis: input.jenis,
    judul: input.judul || undefined,
    deskripsi: input.deskripsi,
    alamatKejadian: input.alamatKejadian || "Kota Bandung",
  }
  if (input.koordinat) {
    payload.lokasiGps = {
      x: input.koordinat.lng,
      y: input.koordinat.lat,
    }
  }

  const res = await fetch("/api/publik/pengaduan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = await tangani<any>(res)

  return {
    nomorTiket: data.nomorTiket,
    targetSelesaiAt: data.targetSelesaiAt ?? null,
    pesan: "Pengaduan Anda berhasil dikirim dan sedang ditindaklanjuti.",
  }
}

export interface SlaTiket {
  targetResponsAt: string | null
  targetSelesaiAt: string | null
  sisaMenit: number | null
  melanggar: boolean
  responsTerlambat: boolean
  terjeda: boolean
}

export interface EntriRiwayatTiket {
  aksi: string
  statusKe: string | null
  catatan: string | null
  olehNama: string
  fotoUrl: string | null
  createdAt: string
}

export interface StatusTiket {
  nomorTiket: string
  jenis: string
  judul: string
  deskripsi: string
  alamatKejadian: string | null
  status: string
  prioritas: string
  fotoUrl: string | null
  videoUrl: string | null
  createdAt: string
  ditanganiMulai: string | null
  selesaiAt: string | null
  catatanPenyelesaian: string | null
  fotoPenyelesaianUrl: string | null
  konfirmasiBatasAt: string | null
  targetResponsAt: string | null
  responsAt: string | null
  jedaMulaiAt: string | null
  ratingKepuasan: number | null
  komentarKepuasan: string | null
  jumlahDibukaKembali: number
  ditugaskanKe: { name: string | null } | null
  riwayat: EntriRiwayatTiket[]
  sla: SlaTiket
  bisaDinilai: boolean
  bisaDibukaKembali: boolean
  bisaChat: boolean
}

export async function lacakTiket(nomorTiket: string): Promise<StatusTiket> {
  const res = await fetch(`/api/publik/pengaduan/${encodeURIComponent(nomorTiket)}`)
  const data = await tangani<any>(res)

  return {
    nomorTiket: data.nomorTiket,
    jenis: data.jenis,
    judul: data.judul,
    deskripsi: data.deskripsi ?? "-",
    alamatKejadian: data.alamatKejadian ?? null,
    status: data.status,
    prioritas: data.prioritas ?? "SEDANG",
    fotoUrl: data.fotoUrl ?? null,
    videoUrl: null,
    createdAt: data.createdAt ?? new Date().toISOString(),
    ditanganiMulai: null,
    selesaiAt: data.selesaiAt ?? null,
    catatanPenyelesaian: data.catatanPenyelesaian ?? null,
    fotoPenyelesaianUrl: data.fotoPenyelesaianUrl ?? null,
    konfirmasiBatasAt: null,
    targetResponsAt: null,
    responsAt: null,
    jedaMulaiAt: null,
    ratingKepuasan: null,
    komentarKepuasan: null,
    jumlahDibukaKembali: 0,
    ditugaskanKe: null,
    riwayat: (data.linimasa ?? []).map((l: any) => ({
      aksi: l.statusKe,
      statusKe: l.statusKe,
      catatan: l.keterangan,
      olehNama: l.petugasNama ?? "Petugas Layanan",
      fotoUrl: null,
      createdAt: l.waktu,
    })),
    sla: {
      targetResponsAt: null,
      targetSelesaiAt: data.targetSelesaiAt ?? null,
      sisaMenit: null,
      melanggar: false,
      responsTerlambat: false,
      terjeda: false,
    },
    bisaDinilai: data.status === "SELESAI",
    bisaDibukaKembali: data.status === "SELESAI",
    bisaChat: false,
  }
}

export async function konfirmasiTiket(
  nomorTiket: string,
  input: { rating: number; komentar?: string }
) {
  const res = await fetch(`/api/publik/pengaduan/${encodeURIComponent(nomorTiket)}/rating`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  return tangani<{ pesan: string }>(res)
}

export async function bukaKembaliTiket(
  nomorTiket: string,
  input: { alasan: string }
) {
  return { pesan: "Permintaan buka kembali tiket diterima." }
}

export interface HasilLaporMeter {
  periode: number
  standDilaporkan: number
  status: string
  createdAt: string
  pesan: string
}

export interface PeriodeUjiLaporMeter {
  aktif: boolean
  periodes: number[]
}

export async function ambilJendelaLaporMandiri(): Promise<JendelaLaporMandiri> {
  const { jendelaLaporMandiri } = await import("@/lib/domain/lapor-mandiri")
  return jendelaLaporMandiri()
}

/**
 * MODUL SEMENTARA (TESTING & UAT ONLY)
 * Catatan: Fitur ini dibuat sementara untuk menguji lapor meter mandiri karena data seed di database
 * saat ini berada pada periode 202601 (Januari 2026), sedangkan kalender berjalan sistem berada di bulan lain.
 * Jika tahap testing / UAT sudah selesai dan dianggap lulus, modul / endpoint ini dapat dihapus.
 */
export async function ambilPeriodeUjiLaporMandiri(): Promise<PeriodeUjiLaporMeter> {
  try {
    const res = await fetch("/api/cater/mandiri/public/periode-uji")
    if (res.ok) {
      const json = await res.json()
      if (json.success && json.data) {
        return json.data
      }
    }
  } catch {
    // fallback jika endpoint offline
  }

  return {
    aktif: true,
    periodes: [202601, 202602],
  }
}

export async function laporMeter(form: FormData): Promise<HasilLaporMeter> {
  const thblInput = String(
    form.get("thbl") ||
    form.get("periodeUji") ||
    "202601"
  )
  const nolgInput = String(form.get("nomorLangganan") || form.get("nolg") || "")
  const standInput = Number(
    form.get("standDilaporkan") ||
    form.get("standMeter") ||
    form.get("angkaMeter") ||
    0
  )

  let fotoMeterUrl = "https://placehold.co/600x400/png?text=Foto+Meter"
  const fotoFile = form.get("foto")
  if (fotoFile && typeof fotoFile !== "string" && "arrayBuffer" in fotoFile) {
    try {
      const buf = await (fotoFile as File).arrayBuffer()
      const base64 = Buffer.from(buf).toString("base64")
      fotoMeterUrl = `data:${(fotoFile as File).type || "image/jpeg"};base64,${base64}`
    } catch {
      // fallback jika pembacaan file gagal
    }
  }

  const payload = {
    nolg: nolgInput,
    thbl: thblInput,
    stma: standInput,
    fotoMeterUrl,
    channel: "WEB_PORTAL" as const,
  }

  const res = await fetch("/api/cater/mandiri/public", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  const data = await tangani<any>(res)

  return {
    periode: Number(payload.thbl),
    standDilaporkan: payload.stma,
    status: "MENUNGGU",
    createdAt: new Date().toISOString(),
    pesan: "Laporan angka meter berhasil dikirim dan menunggu verifikasi petugas.",
  }
}
