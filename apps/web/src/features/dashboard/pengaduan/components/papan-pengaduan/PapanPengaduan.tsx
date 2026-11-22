"use client"

// features/dashboard/pengaduan/components/papan-pengaduan/PapanPengaduan.tsx
// Halaman kerja pengaduan: kartu ringkasan antrean + Enterprise Glide Data Grid (60 FPS)

import { KartuStatistik } from "./KartuStatistik"
import { TabelPengaduanGlide } from "./TabelPengaduanGlide"
import { useStatistikPengaduan } from "../../hooks/UseStatistikPengaduan"

export function PapanPengaduan({ initialQ }: { initialQ?: string }) {
  const { stat } = useStatistikPengaduan()

  return (
    <div className="flex h-full min-h-[600px] flex-col gap-4">
      {stat && <KartuStatistik stat={stat} />}

      <div className="min-h-[500px] min-w-0 flex-1">
        <TabelPengaduanGlide initialSearch={initialQ} />
      </div>
    </div>
  )
}
