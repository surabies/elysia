"use client"

// features/dashboard/pengaduan/components/detail-tiket/PanelEskalasi.tsx —
// Eskalasi tiket ke pejabat struktural / atasan (Supervisor, Manager, Senior Manager),
// menggunakan komponen shadcn/ui <Select> penuh.
// Pilihan kenaikan prioritas disaring otomatis hanya untuk prioritas di atas prioritas tiket saat ini.
import * as React from "react"
import { ArrowUpCircle } from "@/components/ui/hugeicons-compat"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { kirimJson } from "@/features/dashboard/api/ApiDashboard"
import { LABEL_PRIORITAS_PENGADUAN } from "@/features/dashboard/lib/LabelPengaduan"
import { PanelKartu } from "@/features/dashboard/pengaduan/components/bersama/PanelKartu"
import { PilihPetugas } from "@/features/dashboard/pengaduan/components/bersama/PilihPetugas"
import type {
  PengaduanDetail,
  PetugasRingkas,
  PrioritasPengaduan,
} from "@/features/dashboard/pengaduan/types/TipePengaduan"
import type { JalankanAksi } from "../../hooks/UseRincianTiket"

const TETAP_VALUE = "TETAP"

const BOBOT_PRIORITAS: Record<PrioritasPengaduan, number> = {
  RENDAH: 1,
  NORMAL: 2,
  TINGGI: 3,
  DARURAT: 4,
}

export function PanelEskalasi({
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
  const [atasan, setAtasan] = React.useState("")
  const [alasan, setAlasan] = React.useState("")
  const [prioritas, setPrioritas] = React.useState<string>(TETAP_VALUE)

  // Saring hanya prioritas yang lebih tinggi dari prioritas tiket saat ini (sesuai aturan domain B12)
  const opsiPrioritasLebihTinggi = React.useMemo(() => {
    const bobotSaatIni = BOBOT_PRIORITAS[detail.prioritas] ?? 2
    return (Object.entries(LABEL_PRIORITAS_PENGADUAN) as [PrioritasPengaduan, string][]).filter(
      ([val]) => (BOBOT_PRIORITAS[val] ?? 0) > bobotSaatIni
    )
  }, [detail.prioritas])

  React.useEffect(() => {
    setPrioritas(TETAP_VALUE)
  }, [detail.id, detail.prioritas])

  async function eskalasi() {
    const prioritasBaru =
      prioritas && prioritas !== TETAP_VALUE ? prioritas : undefined
    const sukses = await jalankan(() =>
      kirimJson(`/pengaduan/${detail.id}/eskalasi`, "PATCH", {
        eskalasiKeId: atasan,
        catatan: alasan.trim(),
        alasan: alasan.trim(),
        prioritasBaru,
      })
    )
    if (sukses) {
      setAtasan("")
      setAlasan("")
      setPrioritas(TETAP_VALUE)
    }
  }

  return (
    <PanelKartu judul="Eskalasi ke atasan">
      <div className="flex flex-col @[440px]/detail:flex-row gap-2">
        <PilihPetugas
          petugas={petugas}
          value={atasan}
          onChange={setAtasan}
          placeholder="Pilih atasan / pejabat…"
          ariaLabel="Pilih atasan untuk eskalasi"
          disabled={mengirim}
          mode="atasan"
        />
        <Select
          value={prioritas}
          onValueChange={setPrioritas}
          disabled={mengirim}
        >
          <SelectTrigger
            size="sm"
            aria-label="Naikkan prioritas (opsional)"
            className="h-9 w-full @[440px]/detail:w-44 shrink-0 text-xs bg-background"
          >
            <SelectValue placeholder="Prioritas tetap" />
          </SelectTrigger>
          <SelectContent position="popper" align="end" className="z-50">
            <SelectItem value={TETAP_VALUE} className="text-xs">
              Prioritas tetap ({LABEL_PRIORITAS_PENGADUAN[detail.prioritas]})
            </SelectItem>
            {opsiPrioritasLebihTinggi.map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-xs">
                Naik ke {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Textarea
        rows={2}
        placeholder="Alasan eskalasi… (mis. butuh alat berat / keputusan lintas bagian)"
        value={alasan}
        onChange={(e) => setAlasan(e.target.value)}
        disabled={mengirim}
      />
      <Button
        size="sm"
        variant="outline"
        className="self-start"
        disabled={mengirim || !atasan || !alasan.trim()}
        onClick={eskalasi}
      >
        <ArrowUpCircle className="size-3.5" />
        Eskalasi
      </Button>
    </PanelKartu>
  )
}
