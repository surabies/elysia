"use client"

// features/dashboard/verifikasi/components/modalMandiri.tsx — modal aksi
// verifikasi laporan mandiri: foto besar (zoom, geser, putar) berdampingan
// dengan kotak stand yang bisa dikoreksi, lalu verify/reject.
//
// Koreksi bukan aksi simpan tersendiri: verifikator membetulkan angkanya di
// sini lalu menekan verifikasi. Nilai hanya memperbarui laporan mandiri;
// pembacaan resmi dibuat lewat alur verifikasi petugas.
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { formatPeriode } from "@/features/public"
import { kirimJson, ApiError } from "@/features/dashboard/shared/api/api-dashboard"
import type { LaporanMandiriDetail } from "../../types"
import { Bagian } from "../panel/KomponenPanel"
import { DialogVerifikasi } from "../DialogVerifikasi"
import { toast } from "sonner"

export function ModalMandiri({
  detail,
  tolakAwal,
  onTutup,
  onSelesai,
}: {
  detail: LaporanMandiriDetail
  /** true = langsung mode tolak. */
  tolakAwal: boolean
  onTutup: () => void
  onSelesai: () => void
}) {
  const [stand, setStand] = React.useState(String(detail.standDilaporkan))
  const [alasan, setAlasan] = React.useState("")
  const [modeTolak, setModeTolak] = React.useState(tolakAwal)
  const [mengirim, setMengirim] = React.useState(false)

  const standNum = Number(stand)
  const standSiap = stand !== "" && Number.isInteger(standNum) && standNum >= 0
  const berubah = standSiap && standNum !== detail.standDilaporkan

  async function jalankan(aksi: "verify" | "reject") {
    if (aksi === "verify" && !standSiap) {
      toast.error("Isi ST akhir dengan bilangan bulat yang valid.")
      return
    }
    setMengirim(true)
    try {
      if (aksi === "verify") {
        await kirimJson(`/laporan-mandiri/${detail.id}/verify`, "PATCH", {
          standDilaporkan: standNum,
        })
      } else {
        await kirimJson(`/laporan-mandiri/${detail.id}/reject`, "PATCH", {
          alasanDitolak: alasan.trim(),
        })
      }
      onSelesai()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Aksi gagal dijalankan.",
      )
    } finally {
      setMengirim(false)
    }
  }

  const footer = (
    <div className="flex flex-col gap-2">
      {modeTolak ? (
        <>
          <Button
            variant="destructive"
            size="default"
            className="w-full"
            disabled={mengirim || alasan.trim().length === 0}
            onClick={() => jalankan("reject")}
          >
            {mengirim && <Spinner className="size-3.5" />} Tolak laporan
          </Button>
          <Button
            variant="ghost"
            size="default"
            className="w-full"
            disabled={mengirim}
            onClick={() => setModeTolak(false)}
          >
            Batal
          </Button>
        </>
      ) : (
        <>
          <Button
            size="default"
            className="w-full"
            disabled={mengirim || !standSiap}
            onClick={() => jalankan("verify")}
          >
            {mengirim && <Spinner className="size-3.5" />}
            Verifikasi dan simpan stand
          </Button>
          <Button
            variant="outline"
            size="default"
            className="w-full"
            disabled={mengirim}
            onClick={() => setModeTolak(true)}
          >
            Tolak laporan
          </Button>
        </>
      )}
    </div>
  )

  return (
    <DialogVerifikasi
      buka
      onBuka={(v) => !v && onTutup()}
      judul={`Verifikasi stand — ${detail.pelanggan?.nama ?? detail.nomorLangganan}`}
      subjudul={`${formatPeriode(detail.periode)} · dilaporkan ${detail.namaPelapor} · cocokkan angka pada foto dengan kotak stand.`}
      fotoUrl={detail.fotoUrl}
      fotoLabel={`Foto meter — ${formatPeriode(detail.periode)}`}
      footer={footer}
    >
      <Bagian judul="ST akhir">
        <Input
          type="number"
          min={0}
          value={stand}
          onChange={(e) => setStand(e.target.value)}
          aria-label="ST akhir catat"
        />
        <p className="text-center text-copy-13 text-muted-foreground">
          {berubah
            ? `Angka laporan awal: ${detail.standDilaporkan.toLocaleString("id-ID")}.`
            : "Isi sesuai angka pada foto."}
        </p>

        <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
          <div className="rounded-lg bg-muted/60 p-2.5">
            <span className="text-muted-foreground">Stand Awal (STML):</span>
            <p className="font-semibold text-foreground">
              {detail.standAwal !== undefined && detail.standAwal !== null
                ? Number(detail.standAwal).toLocaleString("id-ID")
                : "—"}
            </p>
          </div>
          <div className="rounded-lg bg-muted/60 p-2.5">
            <span className="text-muted-foreground">Estimasi Pemakaian:</span>
            <p className="font-semibold text-foreground">
              {detail.standAwal !== undefined &&
              detail.standAwal !== null &&
              standSiap
                ? `${Math.max(0, standNum - Number(detail.standAwal)).toLocaleString("id-ID")} m³`
                : "—"}
            </p>
          </div>
        </div>
      </Bagian>

      {modeTolak && (
        <Bagian judul="Alasan penolakan (wajib, dikirim ke pelapor)">
          <Textarea
            value={alasan}
            onChange={(e) => setAlasan(e.target.value)}
            rows={3}
            placeholder="Mis. foto buram / angka stand tidak terbaca"
          />
        </Bagian>
      )}
    </DialogVerifikasi>
  )
}
