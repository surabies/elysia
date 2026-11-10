import type { Metadata } from "next"
import {
  Bagian,
  HalamanInfo,
} from "@/components/shared/HalamanInfo"

export const metadata: Metadata = { title: "Tarif Air" }

const TARIF = [
  {
    golongan: "Kelompok I (Sosial)",
    keterangan: "Kran umum, tempat ibadah, panti asuhan, sekolah negeri",
    tarif: "Rp 1.050 – Rp 1.500 / m³",
  },
  {
    golongan: "Kelompok IIA (Rumah Tangga Sederhana)",
    keterangan: "Rumah tinggal non-permanen / sederhana daya listrik s/d 900 VA",
    tarif: "Rp 2.200 – Rp 4.100 / m³",
  },
  {
    golongan: "Kelompok IIB (Rumah Tangga Menengah)",
    keterangan: "Rumah tinggal permanen daya listrik 1300 VA s/d 2200 VA",
    tarif: "Rp 3.500 – Rp 6.800 / m³",
  },
  {
    golongan: "Kelompok IIC (Rumah Tangga Atas)",
    keterangan: "Rumah tinggal mewah / daya listrik > 2200 VA",
    tarif: "Rp 5.200 – Rp 9.500 / m³",
  },
  {
    golongan: "Kelompok III (Niaga)",
    keterangan: "Ruko, restoran, bengkel, perkantoran swasta, perhotelan",
    tarif: "Rp 8.000 – Rp 14.500 / m³",
  },
  {
    golongan: "Kelompok IV (Industri)",
    keterangan: "Pabrik, manufaktur, industri tekstil, pencucian besar",
    tarif: "Rp 11.000 – Rp 18.000 / m³",
  },
]

export default function TarifAirPage() {
  return (
    <HalamanInfo
      judul="Tarif Air"
      deskripsi="Struktur tarif pemakaian air minum perpipaan berdasarkan golongan pelanggan dan blok konsumsi PERUMDA Tirtawening."
    >
      <Bagian judul="Tarif per golongan pelanggan">
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Golongan Pelanggan</th>
                <th className="px-4 py-3 font-medium">Kriteria Sambungan</th>
                <th className="px-4 py-3 font-medium">Rentang Tarif Progresif</th>
              </tr>
            </thead>
            <tbody>
              {TARIF.map((t) => (
                <tr key={t.golongan} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                    {t.golongan}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.keterangan}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                    {t.tarif}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bagian>

      <Bagian judul="Ketentuan perhitungan tarif">
        <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
          <li>
            Perhitungan tarif menggunakan sistem <strong>blok konsumsi progresif</strong> (Blok I: 0–10 m³, Blok II: 11–20 m³, Blok III: 21–30 m³, Blok IV: &gt;30 m³).
          </li>
          <li>
            Total tagihan bulanan mencakup harga air, biaya pemeliharaan meter (bea beban), bea administrasi rekening, dan retribusi air limbah sesuai peraturan daerah.
          </li>
          <li>
            Tarif mengacu pada Keputusan Walikota Bandung tentang Penyesuaian Tarif Air Minum PERUMDA Tirtawening Kota Bandung.
          </li>
        </ul>
      </Bagian>
    </HalamanInfo>
  )
}
