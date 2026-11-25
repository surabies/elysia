"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { formatPeriode } from "@/features/public"
import { ambilSatu, ApiError } from "@/features/dashboard/shared/api/api-dashboard"
import { DialogVerifikasi, PilihSatu } from "../DialogVerifikasi"
import type { LaporanHarianDetail } from "../../types"
import type { DataKoreksi } from "./ModalKoreksi"
import { resolveFotoUrl } from "@/lib/foto-resolver"

export interface HasilKondisiFoto {
  sesuai: boolean
  keterangan: string
}

export function ModalKondisiFoto({
  data,
  id,
  onTutup,
  onSimpan,
}: {
  data: Pick<DataKoreksi, "pelanggan" | "periode">
  id: string
  onTutup: () => void
  onSimpan: (hasil: HasilKondisiFoto) => Promise<void>
}) {
  const [detail, setDetail] = React.useState<LaporanHarianDetail | null>(null)
  const [galatMuat, setGalatMuat] = React.useState<string | null>(null)
  const [sesuai, setSesuai] = React.useState<"ya" | "tidak">("ya")
  const [keterangan, setKeterangan] = React.useState("")
  const [galat, setGalat] = React.useState<string | null>(null)
  const [menyimpan, setMenyimpan] = React.useState(false)

  React.useEffect(() => {
    let batal = false
    ambilSatu<LaporanHarianDetail>(`/laporan-harian/${id}`)
      .then((row) => {
        if (!batal) setDetail(row)
      })
      .catch((error: unknown) => {
        if (!batal) {
          setGalatMuat(
            error instanceof ApiError
              ? error.message
              : "Gagal memuat foto dan detail laporan."
          )
        }
      })
    return () => {
      batal = true
    }
  }, [id])

  async function simpan() {
    if (!detail) {
      setGalat("Foto dan detail laporan belum berhasil dimuat.")
      return
    }
    const catatan = keterangan.trim()
    if (sesuai === "tidak" && catatan.length < 5) {
      setGalat(
        "Tuliskan keterangan minimal 5 karakter untuk kondisi yang tidak sesuai."
      )
      return
    }

    setMenyimpan(true)
    setGalat(null)
    try {
      await onSimpan({ sesuai: sesuai === "ya", keterangan: catatan })
    } catch (error) {
      setGalat(
        error instanceof Error
          ? error.message
          : "Penilaian kondisi foto gagal disimpan."
      )
    } finally {
      setMenyimpan(false)
    }
  }

  const judul = detail
    ? `Kondisi Foto & Lapangan — ${detail.pelanggan?.nama ?? detail.namaPelanggan ?? data.pelanggan}`
    : `Kondisi Foto dan Lapangan — ${data.pelanggan}`

  const subjudul = detail
    ? `${formatPeriode(detail.periode)} · ${detail.pencatat?.namaLapangan ?? "Pencatat tidak diketahui"}`
    : `Periode ${data.periode}`

  return (
    <DialogVerifikasi
      buka
      onBuka={(buka) => !buka && !menyimpan && onTutup()}
      judul={judul}
      subjudul={subjudul}
      fotoLabel="Foto meter"
      fotos={
        detail
          ? [
              {
                kunci: "stand",
                label: "Stand meter",
                url: resolveFotoUrl({
                  realUrl: detail.fotoStandUrl ?? detail.pembacaan?.fotoBukti,
                  nolg: detail.nomorLangganan,
                  jenis: "stand",
                  stand: detail.standAkhir,
                  periode: String(detail.periode),
                  nama: detail.namaPelanggan ?? undefined,
                }),
                keteranganKosong: "Laporan ini tidak memiliki foto meter.",
              },
              {
                kunci: "segel",
                label: "Segel",
                url: resolveFotoUrl({
                  realUrl: detail.fotoSegelUrl,
                  nolg: detail.nomorLangganan,
                  jenis: "segel",
                  stand: detail.standAkhir,
                  periode: String(detail.periode),
                  nama: detail.namaPelanggan ?? undefined,
                }),
                keteranganKosong: "Petugas tidak mengirim foto segel.",
              },
              {
                kunci: "rumah",
                label: "Rumah",
                url: resolveFotoUrl({
                  realUrl: detail.fotoRumahUrl,
                  nolg: detail.nomorLangganan,
                  jenis: "rumah",
                  stand: detail.standAkhir,
                  periode: String(detail.periode),
                  nama: detail.namaPelanggan ?? undefined,
                }),
                keteranganKosong: "Petugas tidak mengirim foto rumah/persil.",
              },
            ]
          : undefined
      }
      footer={
        <div className="flex flex-col gap-2">
          <Button
            size="default"
            className="w-full"
            disabled={menyimpan || !detail}
            onClick={() => void simpan()}
          >
            {menyimpan && <Spinner className="size-3.5 mr-2" />}
            Simpan Penilaian
          </Button>
          <Button
            variant="outline"
            size="default"
            className="w-full border-border hover:bg-muted text-foreground"
            disabled={menyimpan}
            onClick={onTutup}
          >
            Tutup
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {galat && (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-copy-13 text-destructive"
          >
            {galat}
          </p>
        )}
        {galatMuat && (
          <p role="alert" className="text-copy-13 text-destructive">
            {galatMuat}
          </p>
        )}
        {!detail && !galatMuat && (
          <p className="text-copy-13 text-muted-foreground" role="status">
            <Spinner className="mr-2 inline size-4" />
            Memuat foto dan detail laporan…
          </p>
        )}
        {detail && (
          <>
            <div className="p-3 rounded-lg bg-muted/40 border border-border text-label-12 space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">No. Sambungan:</span>
                <span className="font-mono font-medium">{detail.nomorLangganan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stand Meter:</span>
                <span className="font-mono font-bold text-foreground">
                  {detail.standAkhir?.toLocaleString("id-ID") ?? "—"} m³
                </span>
              </div>
            </div>

            <p className="text-label-12 text-muted-foreground">
              Penilaian disimpan ke riwayat audit dan tidak mengubah stand atau status verifikasi.
            </p>

            <div className="space-y-1.5">
              <label className="text-label-13 font-medium text-foreground">
                Kondisi foto sesuai?
              </label>
              <PilihSatu
                ariaLabel="Kondisi foto sesuai"
                value={sesuai}
                onChange={(v) => setSesuai(v as "ya" | "tidak")}
                opsi={[
                  { value: "ya", label: "Ya (Sesuai)" },
                  { value: "tidak", label: "Tidak (Tidak Sesuai / Buram / Anomali)" },
                ]}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="kondisi-foto-ket" className="text-label-13 font-medium text-foreground">
                Keterangan
              </label>
              <Textarea
                id="kondisi-foto-ket"
                rows={3}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Mis. foto buram, segel rusak, meter tertutup..."
                maxLength={500}
              />
              <p className="text-right text-label-12 text-muted-foreground">
                {keterangan.length}/500
              </p>
            </div>
          </>
        )}
      </div>
    </DialogVerifikasi>
  )
}
