"use client"

// features/dashboard/pengaduan/components/detail-tiket/PanelEskalasi.tsx —
// Eskalasi tiket ke atasan (Manager & Supervisor), menggunakan perilaku standar shadcn/ui <Select>.
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
} from "@/features/dashboard/pengaduan/types/TipePengaduan"
import type { JalankanAksi } from "../../hooks/UseRincianTiket"

const TETAP_VALUE = "TETAP"

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
      <div className="flex items-center gap-2">
        <PilihPetugas
          petugas={petugas}
          value={atasan}
          onChange={setAtasan}
          placeholder="Pilih atasan…"
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
            className="w-40 shrink-0"
          >
            <SelectValue placeholder="Prioritas tetap" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TETAP_VALUE}>Prioritas tetap</SelectItem>
            {Object.entries(LABEL_PRIORITAS_PENGADUAN).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Textarea
        rows={2}
        placeholder="Alasan eskalasi… (mis. butuh alat berat / keputusan anggaran)"
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
        <ArrowUpCircle />
        Eskalasi
      </Button>
    </PanelKartu>
  )
}
