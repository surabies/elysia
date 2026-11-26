"use client"

// features/dashboard/pengaduan/components/detail-tiket/PanelTindakan.tsx —
// blok "Tindakan": tugaskan petugas, tulis catatan (internal/publik), dan
// tombol transisi status generik. `transisiTersedia` diputuskan SERVER
// (matriks TRANSISI, sudah disaring per role).
// Mengadopsi SOP v2.0: Dialog Penolakan Baku (min 30 karakter) & Dialog Jeda SLA Sah.
import * as React from "react"
import {
  Lock,
  MessageSquarePlus,
  Send,
  UserCheck,
  AlertTriangle,
  Clock,
  ShieldAlert,
} from "@/components/ui/hugeicons-compat"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { kirimJson } from "@/lib/api-dashboard"
import {
  LABEL_AKSI_STATUS_PENGADUAN,
  KODE_ALASAN_PENOLAKAN,
  KODE_JEDA_SAH_SLA,
} from "@/features/langganan/pengaduan/lib/LabelPengaduan"
import { PanelKartu } from "@/features/dashboard/pengaduan/components/bersama/PanelKartu"
import { PilihPetugas } from "@/features/dashboard/pengaduan/components/bersama/PilihPetugas"
import type {
  PengaduanDetail,
  PetugasRingkas,
} from "@/features/dashboard/pengaduan/types/TipePengaduan"
import { BUKAN_TOMBOL_STATUS } from "../../lib/KonstantaTiket"
import type { JalankanAksi } from "../../hooks/UseRincianTiket"

export function PanelTindakan({
  detail,
  petugas,
  mengirim,
  jalankan,
}: {
  detail: PengaduanDetail
  petugas: PetugasRingkas[]
  mengirim: boolean
  jalankan: JalankanAksi
}) {
  const [pilihPetugas, setPilihPetugas] = React.useState("")
  const [catatan, setCatatan] = React.useState("")
  const [catatanPublik, setCatatanPublik] = React.useState(false)

  // Dialog Penolakan Tiket (SOP v2.0 Butir I-7 & I-8: Kode Alasan + Min 30 Karakter)
  const [dialogTolakBuka, setDialogTolakBuka] = React.useState(false)
  const [kodeTolak, setKodeTolak] = React.useState<string>("")
  const [alasanTolak, setAlasanTolak] = React.useState("")

  // Dialog Penangguhan / Jeda SLA Sah (SOP v2.0 Butir II-3 & II-4: Kode Jeda Sah)
  const [dialogJedaBuka, setDialogJedaBuka] = React.useState(false)
  const [kodeJeda, setKodeJeda] = React.useState<string>("")
  const [alasanJeda, setAlasanJeda] = React.useState("")

  const transisi = detail.transisiTersedia.filter(
    (s) => !BUKAN_TOMBOL_STATUS.includes(s)
  )
  const bisaSelesai = detail.transisiTersedia.includes("SELESAI")
  const catatanBersih = catatan.trim()

  async function kirim(aksi: () => Promise<unknown>) {
    if (await jalankan(aksi)) {
      setCatatan("")
    }
  }

  // Eksekusi Penolakan Resmi
  async function eksekusiTolak() {
    const alasanLengkap = `[${kodeTolak}] ${alasanTolak.trim()}`
    const sukses = await jalankan(() =>
      kirimJson(`/pengaduan/${detail.id}/status`, "PATCH", {
        status: "DITOLAK",
        catatan: alasanLengkap,
        isPublik: true,
      })
    )
    if (sukses) {
      setDialogTolakBuka(false)
      setKodeTolak("")
      setAlasanTolak("")
    }
  }

  // Eksekusi Penangguhan / Jeda SLA
  async function eksekusiJeda() {
    const alasanLengkap = `[JEDA:${kodeJeda}] ${alasanJeda.trim()}`
    const sukses = await jalankan(() =>
      kirimJson(`/pengaduan/${detail.id}/status`, "PATCH", {
        status: "MENUNGGU_PELANGGAN",
        catatan: alasanLengkap,
        isPublik: true,
      })
    )
    if (sukses) {
      setDialogJedaBuka(false)
      setKodeJeda("")
      setAlasanJeda("")
    }
  }

  return (
    <PanelKartu judul="Tindakan">
      {/* 1. Form Penugasan Petugas */}
      <div className="flex items-center gap-2">
        <PilihPetugas
          petugas={petugas}
          value={pilihPetugas}
          onChange={setPilihPetugas}
          placeholder="Pilih petugas…"
          ariaLabel="Pilih petugas"
          disabled={mengirim}
          mode="petugas"
        />
        <Button
          size="default"
          title="Tugaskan petugas terpilih"
          className="shrink-0"
          disabled={mengirim || !pilihPetugas}
          onClick={() =>
            kirim(() =>
              kirimJson(`/pengaduan/${detail.id}/tugaskan`, "PATCH", {
                ditugaskanKeId: pilihPetugas,
                catatan: catatanBersih || undefined,
              })
            )
          }
        >
          <UserCheck className="size-4 shrink-0" />
          <span>Tugaskan</span>
        </Button>
      </div>

      {/* 2. Form Catatan Internal / Publik Cepat */}
      <Textarea
        rows={2}
        placeholder="Catatan tindak lanjut… (dipakai oleh tombol di bawah)"
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
        disabled={mengirim}
      />

      <div className="flex items-center gap-2">
        <Switch
          id="catatan-publik"
          checked={catatanPublik}
          onCheckedChange={setCatatanPublik}
          disabled={mengirim}
        />
        <Label
          htmlFor="catatan-publik"
          className="flex items-center gap-1.5 text-xs"
        >
          {catatanPublik ? (
            <>
              <MessageSquarePlus className="size-3.5" /> Terlihat oleh pelapor
            </>
          ) : (
            <>
              <Lock className="size-3.5" /> Catatan internal
            </>
          )}
        </Label>
      </div>

      {/* 3. Baris Tombol Aksi Transisi */}
      <div className="flex flex-wrap gap-1.5">
        <Button
          size="sm"
          variant="outline"
          disabled={mengirim || !catatanBersih}
          onClick={() =>
            kirim(() =>
              kirimJson(`/pengaduan/${detail.id}/catatan`, "POST", {
                catatan: catatanBersih,
                isPublik: catatanPublik,
              })
            )
          }
        >
          {mengirim ? <Spinner className="size-3.5" /> : <Send className="size-3.5" />}
          Tambah catatan
        </Button>

        {transisi.map((s) => {
          // Tombol Penolakan membuka Dialog Penolakan Khusus
          if (s === "DITOLAK") {
            return (
              <Button
                key={s}
                size="sm"
                variant="destructive"
                disabled={mengirim}
                onClick={() => setDialogTolakBuka(true)}
              >
                <ShieldAlert className="size-3.5" />
                {LABEL_AKSI_STATUS_PENGADUAN[s]}
              </Button>
            )
          }

          // Tombol Menunggu Pelanggan membuka Dialog Jeda Khusus
          if (s === "MENUNGGU_PELANGGAN") {
            return (
              <Button
                key={s}
                size="sm"
                variant="secondary"
                disabled={mengirim}
                onClick={() => setDialogJedaBuka(true)}
              >
                <Clock className="size-3.5" />
                {LABEL_AKSI_STATUS_PENGADUAN[s]}
              </Button>
            )
          }

          const butuhCatatan = s === "DIBUKA_KEMBALI"
          const tidakBoleh = mengirim || (butuhCatatan && !catatanBersih)

          return (
            <Button
              key={s}
              size="sm"
              variant="secondary"
              disabled={tidakBoleh}
              title={
                butuhCatatan && !catatanBersih
                  ? `Status ${s} wajib menyertakan catatan alasan di atas`
                  : undefined
              }
              onClick={() =>
                kirim(() =>
                  kirimJson(`/pengaduan/${detail.id}/status`, "PATCH", {
                    status: s,
                    catatan: catatanBersih || undefined,
                    isPublik: true,
                  })
                )
              }
            >
              {LABEL_AKSI_STATUS_PENGADUAN[s]}
            </Button>
          )
        })}
      </div>

      {transisi.length === 0 && !bisaSelesai && (
        <p className="text-xs text-muted-foreground">
          Status tiket ini sudah final — tidak ada transisi yang tersedia.
        </p>
      )}

      {/* ================================================================= */}
      {/* 4. MODAL DIALOG PENOLAKAN TIKET (SOP v2.0 Butir I-7 & I-8)        */}
      {/* ================================================================= */}
      <Dialog open={dialogTolakBuka} onOpenChange={setDialogTolakBuka}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="size-5" />
              Penolakan Resmi Pengaduan
            </DialogTitle>
            <DialogDescription className="text-xs">
              Berdasarkan SOP Tirtawening v2.0, penolakan pengaduan wajib memilih kode
              alasan baku dan disertai penjelasan faktual minimal 30 karakter.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs font-semibold">Kode Alasan Baku Penolakan *</Label>
              <Select value={kodeTolak} onValueChange={setKodeTolak}>
                <SelectTrigger className="mt-1 w-full text-xs">
                  <SelectValue placeholder="-- Pilih Alasan Baku SOP --" />
                </SelectTrigger>
                <SelectContent>
                  {KODE_ALASAN_PENOLAKAN.map((item) => (
                    <SelectItem key={item.kode} value={item.kode} className="text-xs">
                      <div className="flex flex-col text-left">
                        <span className="font-semibold">{item.judul}</span>
                        <span className="text-[10.5px] text-muted-foreground">
                          {item.deskripsi}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Rincian Penjelasan Faktual *</Label>
                <span
                  className={`text-[10px] font-mono ${
                    alasanTolak.trim().length >= 30
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {alasanTolak.trim().length}/30 karakter
                </span>
              </div>
              <Textarea
                rows={3}
                placeholder="Tuliskan temuan petugas, fakta lapangan, atau saran jalur alternatif bagi warga…"
                className="mt-1 text-xs"
                value={alasanTolak}
                onChange={(e) => setAlasanTolak(e.target.value)}
              />
              <p className="mt-1 text-[10.5px] text-muted-foreground">
                Penjelasan ini akan tercatat permanen di jejak audit dan dapat dibaca oleh
                pelapor melalui kanal pelacakan warga.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogTolakBuka(false)}
              disabled={mengirim}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={
                mengirim ||
                !kodeTolak ||
                alasanTolak.trim().length < 30
              }
              onClick={() => void eksekusiTolak()}
              className="gap-1.5"
            >
              {mengirim && <Spinner className="size-3" />}
              Tolak Tiket Resmi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* 5. MODAL DIALOG PENANGGUHAN / JEDA SLA (SOP v2.0 Butir II-3 & II-4) */}
      {/* ================================================================= */}
      <Dialog open={dialogJedaBuka} onOpenChange={setDialogJedaBuka}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Clock className="size-5" />
              Penangguhan / Jeda SLA Sah
            </DialogTitle>
            <DialogDescription className="text-xs">
              Sesuai SOP Trandis v2.0, perhitungan tenggat waktu SLA akan ditangguhkan
              secara sah (maksimal 7 hari kalender) karena kendala eksternal di luar kuasa PDAM.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs font-semibold">Kategori Alasan Jeda Sah *</Label>
              <Select value={kodeJeda} onValueChange={setKodeJeda}>
                <SelectTrigger className="mt-1 w-full text-xs">
                  <SelectValue placeholder="-- Pilih Kategori Jeda Sah --" />
                </SelectTrigger>
                <SelectContent>
                  {KODE_JEDA_SAH_SLA.map((item) => (
                    <SelectItem key={item.kode} value={item.kode} className="text-xs">
                      <div className="flex flex-col text-left">
                        <span className="font-semibold">{item.judul}</span>
                        <span className="text-[10.5px] text-muted-foreground">
                          {item.deskripsi}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Keterangan / Nomor Bukti Permohonan</Label>
              <Textarea
                rows={3}
                placeholder="Misal: Nomor surat permohonan izin galian Dishub, nomor kontak pemilik rumah yang dihubungi, dll…"
                className="mt-1 text-xs"
                value={alasanJeda}
                onChange={(e) => setAlasanJeda(e.target.value)}
              />
              <p className="mt-1 text-[10.5px] text-muted-foreground">
                Target selesai tiket akan digeser otomatis sebesar durasi penangguhan saat status
                dilanjutkan kembali.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogJedaBuka(false)}
              disabled={mengirim}
            >
              Batal
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={mengirim || !kodeJeda}
              onClick={() => void eksekusiJeda()}
              className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {mengirim && <Spinner className="size-3" />}
              Aktifkan Jeda SLA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PanelKartu>
  )
}
