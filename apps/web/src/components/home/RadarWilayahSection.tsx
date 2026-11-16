'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Droplets,
  Layers,
  Activity,
  Gauge,
  Radio,
} from 'lucide-react'

export interface SubZonaWilayah {
  id: string
  kode: string
  nama: string
  cakupan: string
  tekanan: string
  status: 'NORMAL' | 'WASPADA' | 'GANGGUAN'
}

export interface PelayananWilayah {
  id: string
  nomor: number
  nama: string
  label: string
  kawasan: string
  status: 'NORMAL' | 'WASPADA' | 'GANGGUAN'
  statusLabel: string
  tekanan: string
  ipaSumber: string
  zonas: SubZonaWilayah[]
  kecamatan: string[]
  kelurahan: string[]
  catatan: string
}

export const DAFTAR_PELAYANAN_WILAYAH: PelayananWilayah[] = [
  {
    id: 'wilayah-1',
    nomor: 1,
    nama: 'Pelayanan Wilayah 1',
    label: 'Wilayah 1 (Bandung Utara)',
    kawasan: 'Bandung Utara (Coblong, Cidadap, Sukasari)',
    status: 'NORMAL',
    statusLabel: 'Penyaluran Normal & Stabil',
    tekanan: '1.9 - 2.3 Bar',
    ipaSumber: 'IPA Badaksinga & IPA Dago Pakar',
    zonas: [
      {
        id: 'z-1a',
        kode: 'Zona 1A',
        nama: 'Dago & Tamansari',
        cakupan: 'Dago, Tamansari, Lebakgede, Lebak Siliwangi',
        tekanan: '2.2 Bar',
        status: 'NORMAL',
      },
      {
        id: 'z-1b',
        kode: 'Zona 1B',
        nama: 'Sukaluyu & Sadang Serang',
        cakupan: 'Sukaluyu, Sekeloa, Sadang Serang, Cigadung',
        tekanan: '2.0 Bar',
        status: 'NORMAL',
      },
      {
        id: 'z-1c',
        kode: 'Zona 1C',
        nama: 'Ciumbuleuit & Pajajaran',
        cakupan: 'Ciumbuleuit, Hegarmanah, Pajajaran',
        tekanan: '1.9 Bar',
        status: 'NORMAL',
      },
    ],
    kecamatan: ['Coblong', 'Cidadap', 'Sukasari', 'Bandung Wetan'],
    kelurahan: [
      'Dago',
      'Sekeloa',
      'Lebakgede',
      'Lebak Siliwangi',
      'Sukaluyu',
      'Tamansari',
      'Cigadung',
      'Sadang Serang',
      'Ciumbuleuit',
      'Pajajaran',
    ],
    catatan:
      'Kapasitas reservoir Badaksinga beroperasi pada level optimal 88%. Penyaluran air bersih lancar 24 jam.',
  },
  {
    id: 'wilayah-2',
    nomor: 2,
    nama: 'Pelayanan Wilayah 2',
    label: 'Wilayah 2 (Bandung Timur)',
    kawasan: 'Bandung Timur (Antapani & Kiaracondong)',
    status: 'NORMAL',
    statusLabel: 'Penyaluran Normal',
    tekanan: '1.8 - 2.1 Bar',
    ipaSumber: 'IPA Cipanjalu & SPAM Gedebage',
    zonas: [
      {
        id: 'z-2a',
        kode: 'Zona 2A',
        nama: 'Antapani Raya',
        cakupan: 'Antapani Wetan, Antapani Kidul, Antapani Tengah',
        tekanan: '2.1 Bar',
        status: 'NORMAL',
      },
      {
        id: 'z-2b',
        kode: 'Zona 2B',
        nama: 'Cicaheum & Babakan',
        cakupan: 'Cicaheum, Neglasari, Babakan Surabaya',
        tekanan: '1.8 Bar',
        status: 'NORMAL',
      },
      {
        id: 'z-2c',
        kode: 'Zona 2C',
        nama: 'Sukamiskin & Sekitar',
        cakupan: 'Sukamiskin, Babakansari',
        tekanan: '1.9 Bar',
        status: 'NORMAL',
      },
    ],
    kecamatan: ['Antapani', 'Kiaracondong', 'Arcamanik', 'Batununggal'],
    kelurahan: [
      'Neglasari',
      'Cicaheum',
      'Babakan Surabaya',
      'Babakansari',
      'Antapani Wetan',
      'Antapani Kidul',
      'Antapani Tengah',
      'Sukamiskin',
    ],
    catatan:
      'Distribusi stabil, debit pompa booster beroperasi sesuai kurva kebutuhan harian warga.',
  },
  {
    id: 'wilayah-3',
    nomor: 3,
    nama: 'Pelayanan Wilayah 3',
    label: 'Wilayah 3 (Bandung Tengah-Timur)',
    kawasan: 'Bandung Tengah-Timur (Cicadas, Sekejati)',
    status: 'WASPADA',
    statusLabel: 'Pemeliharaan Valve Distribusi',
    tekanan: '1.5 - 1.8 Bar',
    ipaSumber: 'IPA Cipanjalu & Ulin',
    zonas: [
      {
        id: 'z-3a',
        kode: 'Zona 3A',
        nama: 'Cicadas & Kebon Waru',
        cakupan: 'Cicadas, Cihaurgeulis, Kebon Waru',
        tekanan: '1.5 Bar (Fluktuatif)',
        status: 'WASPADA',
      },
      {
        id: 'z-3b',
        kode: 'Zona 3B',
        nama: 'Kebon Jayanti & Sukapura',
        cakupan: 'Kebon Jayanti, Kebon Gedang, Sukapura',
        tekanan: '1.7 Bar',
        status: 'NORMAL',
      },
      {
        id: 'z-3c',
        kode: 'Zona 3C',
        nama: 'Sekejati & Paledang',
        cakupan: 'Gumuruh, Sekejati, Paledang',
        tekanan: '1.8 Bar',
        status: 'NORMAL',
      },
    ],
    kecamatan: ['Batununggal', 'Cibeunying Kidul', 'Buahbatu'],
    kelurahan: [
      'Cicadas',
      'Cihaurgeulis',
      'Kebon Waru',
      'Kebon Jayanti',
      'Kebon Gedang',
      'Sukapura',
      'Gumuruh',
      'Sekejati',
      'Paledang',
    ],
    catatan:
      'Pekerjaan balancing valve pipa distribusi sekunder di koridor Ibrahim Adjie. Tekanan fluktuatif sementara.',
  },
  {
    id: 'wilayah-4',
    nomor: 4,
    nama: 'Pelayanan Wilayah 4',
    label: 'Wilayah 4 (Bandung Tenggara)',
    kawasan: 'Bandung Tenggara (Gedebage, Rancasari)',
    status: 'NORMAL',
    statusLabel: 'Penyaluran Normal',
    tekanan: '1.8 - 2.2 Bar',
    ipaSumber: 'SPAM Gedebage & IPA Cikalong',
    zonas: [
      {
        id: 'z-4a',
        kode: 'Zona 4A',
        nama: 'Derwati & Gedebage',
        cakupan: 'Derwati, Rancabolang, Cisaranten',
        tekanan: '2.2 Bar',
        status: 'NORMAL',
      },
      {
        id: 'z-4b',
        kode: 'Zona 4B',
        nama: 'Cipamokolan & Cijaura',
        cakupan: 'Cipamokolan, Cijaura, Kukangsari',
        tekanan: '1.9 Bar',
        status: 'NORMAL',
      },
      {
        id: 'z-4c',
        kode: 'Zona 4C',
        nama: 'Margasari & Manjahlega',
        cakupan: 'Margasari, Manjahlega',
        tekanan: '1.8 Bar',
        status: 'NORMAL',
      },
    ],
    kecamatan: ['Rancasari', 'Gedebage', 'Cibiru', 'Panyileukan'],
    kelurahan: [
      'Cipamokolan',
      'Derwati',
      'Cijaura',
      'Kukangsari',
      'Manjahlega',
      'Margasari',
    ],
    catatan:
      'Suplai dari SPAM Gedebage beroperasi maksimal mendukung kebutuhan klaster perumahan baru.',
  },
  {
    id: 'wilayah-5',
    nomor: 5,
    nama: 'Pelayanan Wilayah 5',
    label: 'Wilayah 5 (Bandung Pusat-Selatan)',
    kawasan: 'Bandung Pusat-Selatan (Regol, Lengkong, Ciateul)',
    status: 'GANGGUAN',
    statusLabel: 'Pekerjaan Pipa Transmisi Cisangkuy',
    tekanan: '1.0 - 1.4 Bar (Menurun)',
    ipaSumber: 'IPA Cisangkuy Baru & Sabuga',
    zonas: [
      {
        id: 'z-5a',
        kode: 'Zona 5A',
        nama: 'Burangrang & Cijagra',
        cakupan: 'Burangrang, Cijagra, Cigereleng',
        tekanan: '1.3 Bar',
        status: 'WASPADA',
      },
      {
        id: 'z-5b',
        kode: 'Zona 5B',
        nama: 'Ancol & Ciateul',
        cakupan: 'Ancol, Ciateul, Pungkur',
        tekanan: '1.0 Bar',
        status: 'GANGGUAN',
      },
      {
        id: 'z-5c',
        kode: 'Zona 5C',
        nama: 'Braga & Pasirluyu',
        cakupan: 'Braga, Pasirluju, Cikarang',
        tekanan: '1.2 Bar',
        status: 'GANGGUAN',
      },
    ],
    kecamatan: ['Regol', 'Lengkong', 'Bandung Kidul', 'Sumur Bandung'],
    kelurahan: [
      'Ancol',
      'Ciateul',
      'Burangrang',
      'Cigereleng',
      'Cijagra',
      'Pungkur',
      'Cikarang',
      'Braga',
      'Pasirluju',
    ],
    catatan:
      'Sedang berlangsung perbaikan pipa transmisi Cisangkuy Ø 400mm. Armada tangki air gratis siaga melayani warga.',
  },
  {
    id: 'wilayah-6',
    nomor: 6,
    nama: 'Pelayanan Wilayah 6',
    label: 'Wilayah 6 (Bandung Barat)',
    kawasan: 'Bandung Barat (Bojongloa, Babakan, Jamika)',
    status: 'NORMAL',
    statusLabel: 'Penyaluran Normal',
    tekanan: '1.6 - 1.9 Bar',
    ipaSumber: 'IPA Cikalong & Sabuga',
    zonas: [
      {
        id: 'z-6a',
        kode: 'Zona 6A',
        nama: 'Kopo & Babakan',
        cakupan: 'Kopo, Babakan Ciparay, Sukahaji',
        tekanan: '1.7 Bar',
        status: 'NORMAL',
      },
      {
        id: 'z-6b',
        kode: 'Zona 6B',
        nama: 'Jamika & Maleber',
        cakupan: 'Jamika, Maleber, Dungus Cariang',
        tekanan: '1.6 Bar',
        status: 'NORMAL',
      },
      {
        id: 'z-6c',
        kode: 'Zona 6C',
        nama: 'Ciroyom & Kebon Jeruk',
        cakupan: 'Ciroyom, Kebon Jeruk, Garuda',
        tekanan: '1.8 Bar',
        status: 'NORMAL',
      },
    ],
    kecamatan: [
      'Bojongloa Kaler',
      'Bojongloa Kidul',
      'Andir',
      'Cicendo',
      'Babakan Ciparay',
    ],
    kelurahan: [
      'Kopo',
      'Sukahaji',
      'Maleber',
      'Margahayu Utara',
      'Margasuka',
      'Babakan',
      'Babakan Ciparay',
      'Ciroyom',
      'Jamika',
      'Garuda',
    ],
    catatan:
      'Aliran normal terkendali. Tidak ada laporan anomali penurunan debit di sektor perpipaan barat.',
  },
]

export function RadarWilayahSection() {
  const [wilayahAktifId, setWilayahAktifId] = React.useState('wilayah-1')
  const wilayahAktif =
    DAFTAR_PELAYANAN_WILAYAH.find((w) => w.id === wilayahAktifId) ??
    DAFTAR_PELAYANAN_WILAYAH[0]

  // Zona aktif di dalam wilayah terpilih
  const [zonaAktifId, setZonaAktifId] = React.useState<string>(
    wilayahAktif.zonas[0]?.id ?? ''
  )

  // Sinkronkan zona aktif saat wilayah berubah
  React.useEffect(() => {
    if (wilayahAktif.zonas.length > 0) {
      setZonaAktifId(wilayahAktif.zonas[0].id)
    }
  }, [wilayahAktif])

  const zonaAktif =
    wilayahAktif.zonas.find((z) => z.id === zonaAktifId) ??
    wilayahAktif.zonas[0]

  return (
    <section
      aria-labelledby="radar-wilayah-title"
      className="mx-auto w-full max-w-360 px-4 lg:px-12 py-12 md:py-16 bg-white text-black"
    >
      {/* Header Bagian */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 border border-cyan-200/80 mb-3">
            <Layers className="h-3.5 w-3.5 text-cyan-600" />
            <span>Sistem Pemantauan Spasial & SCADA</span>
          </div>
          <h2
            id="radar-wilayah-title"
            className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900"
          >
            Radar Distribusi Air Kota Bandung
          </h2>
          <p className="mt-2 text-sm md:text-base text-slate-600 max-w-2xl">
            Pantau kondisi tekanan pipa dan status aliran air bersih secara real-time
            di 6 Pelayanan Wilayah dan zonasi distribusi perpipaan Kota Bandung.
          </p>
        </div>

        <Link
          href="/peta-pengaduan"
          className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-900 bg-transparent px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 transition-all hover:bg-slate-900 hover:text-white active:scale-95 self-start md:self-auto"
        >
          <span>Buka Peta Kendali GIS</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Grid Utama: Kolom Kiri (Pelayanan Wilayah 1-6) & Kolom Kanan (Detail Wilayah & Zona) */}
      {/* Menggunakan items-stretch agar tinggi card kiri dan kanan benar-benar seimbang */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Kolom Kiri: Tab Pilihan Pelayanan Wilayah 1-6 */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-2.5 h-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 flex-1">
            {DAFTAR_PELAYANAN_WILAYAH.map((wilayah) => {
              const isSelected = wilayah.id === wilayahAktifId
              const isGangguan = wilayah.status === 'GANGGUAN'
              const isWaspada = wilayah.status === 'WASPADA'

              return (
                <button
                  key={wilayah.id}
                  type="button"
                  onClick={() => setWilayahAktifId(wilayah.id)}
                  className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/10 ring-1 ring-slate-900'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {wilayah.label}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isGangguan
                          ? isSelected
                            ? 'bg-rose-500 text-white'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                          : isWaspada
                            ? isSelected
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                            : isSelected
                              ? 'bg-emerald-500 text-white'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {wilayah.status}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold truncate">
                    {wilayah.nama}
                  </h3>
                  <p
                    className={`mt-0.5 text-xs truncate ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {wilayah.statusLabel}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Kolom Kanan: Detail Radar Interaktif Wilayah & Zona Terpilih */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl border-2 border-slate-100 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6 sm:p-8 shadow-sm h-full">
          {/* Header Kartu Detail Wilayah */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 rounded-md bg-cyan-100/70 px-2 py-0.5 text-[11px] font-mono font-bold text-cyan-800 uppercase tracking-wide">
                    <Radio className="h-3 w-3 text-cyan-600 animate-pulse" />
                    Pelayanan Wilayah {wilayahAktif.nomor}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-medium">
                    {wilayahAktif.zonas.length} Zona Distribusi
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {wilayahAktif.nama}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {wilayahAktif.kawasan}
                </p>
              </div>

              <div
                className={`inline-flex items-center gap-2 rounded-2xl px-3.5 py-1.5 text-xs font-bold ${
                  wilayahAktif.status === 'GANGGUAN'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : wilayahAktif.status === 'WASPADA'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {wilayahAktif.status === 'GANGGUAN' ? (
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
                <span>{wilayahAktif.statusLabel}</span>
              </div>
            </div>

            {/* Pilihan Zona di dalam Pelayanan Wilayah */}
            <div className="pt-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5 text-cyan-600" />
                  Zona Distribusi di {wilayahAktif.nama}:
                </span>
                <span className="text-[11px] text-slate-400">
                  Pilih zona untuk rincian
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {wilayahAktif.zonas.map((z) => {
                  const isZonaSelected = z.id === zonaAktifId
                  return (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => setZonaAktifId(z.id)}
                      className={`text-left p-2.5 rounded-xl border transition-all ${
                        isZonaSelected
                          ? 'border-cyan-600 bg-cyan-50/80 ring-1 ring-cyan-600 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-slate-900">
                          {z.kode}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                            z.status === 'GANGGUAN'
                              ? 'bg-rose-100 text-rose-700'
                              : z.status === 'WASPADA'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {z.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium truncate">
                        {z.nama}
                      </p>
                      <p className="text-[10px] text-cyan-700 font-mono mt-0.5 font-semibold">
                        {z.tekanan}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Grid Informasi Teknis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 py-4">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                  <Droplets className="h-3.5 w-3.5 text-cyan-600" />
                  Sumber Pengolahan (IPA)
                </span>
                <p className="text-sm font-bold text-slate-800">
                  {wilayahAktif.ipaSumber}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Tekanan Zona Terpilih ({zonaAktif?.kode ?? 'Rata-rata'})
                </span>
                <p className="text-sm font-bold font-mono text-slate-800">
                  {zonaAktif?.tekanan ?? wilayahAktif.tekanan}
                </p>
              </div>
            </div>

            {/* Wilayah Cakupan Kecamatan & Kelurahan */}
            <div className="space-y-2 mb-4">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                Cakupan Kelurahan & Wilayah:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {wilayahAktif.kelurahan.map((kel) => (
                  <span
                    key={kel}
                    className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs"
                  >
                    Kel. {kel}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Catatan Petugas */}
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-100/70 p-3.5 sm:p-4 text-xs sm:text-sm text-slate-700">
            <span className="font-bold text-slate-900 block mb-0.5 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-cyan-700" />
              Catatan Lapangan Pusat Distribusi:
            </span>
            {wilayahAktif.catatan}
          </div>
        </div>
      </div>
    </section>
  )
}
