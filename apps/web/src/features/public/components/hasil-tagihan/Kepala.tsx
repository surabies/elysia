// features/publik/components/hasil-tagihan/header.tsx — identitas pelanggan
// di atas kartu hasil cek-tagihan.
//
// TIDAK ADA LENCANA STATUS PEMBAYARAN, dan itu keputusan sadar. Basis data
// ini belum pernah menerima data pembayaran: `RiwayatPembayaran` kosong dan
// `tanggalBayar` null di seluruh 157.898 tagihan, sehingga `Tagihan.status`
// hanyalah pantulan dari `jumlahRekTunggak` hasil impor — bukan bukti bayar.
// Menampilkannya berarti memberi tahu pelanggan sesuatu yang tidak kita
// ketahui: menyebut "Lunas" pada yang belum membuat orang tidak membayar,
// menyebut "Belum dibayar" pada yang sudah adalah tuduhan. Halaman ini
// menampilkan RIWAYAT TAGIHAN dan pemakaiannya saja; kebenaran pembayaran
// ada di loket.
import { CheckCircle2, User, MapPin } from "@/components/ui/hugeicons-compat"
import type { HasilCekTagihan } from "../../lib/api"

export function HasilTagihanHeader({ hasil }: { hasil: HasilCekTagihan }) {
  const { pelanggan } = hasil

  return (
    <div className="border-b border-neutral-100 bg-gradient-to-r from-blue-50/40 via-white to-sky-50/30 px-6 py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">
              No. Langganan
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              <CheckCircle2 className="size-3 text-emerald-600" /> Sambungan Aktif
            </span>
          </div>

          <p className="font-mono text-xl font-bold tracking-tight text-neutral-900">
            {pelanggan.nomorLangganan}
          </p>

          <div className="flex items-center gap-1.5 text-sm text-neutral-600 font-medium">
            <User className="size-3.5 text-neutral-400" />
            <span className="truncate">{pelanggan.nama}</span>
          </div>
        </div>

        {pelanggan.tarifGolongan && (
          <div className="self-start rounded-xl border border-neutral-200/80 bg-white px-3.5 py-2 shadow-xs sm:self-auto sm:text-right">
            <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
              Golongan Tarif
            </p>
            <p className="font-mono text-xs font-bold text-neutral-900">
              {pelanggan.tarifGolongan.kodeAsli}
            </p>
            <p className="text-[11px] text-neutral-500">
              {pelanggan.tarifGolongan.kategori}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
