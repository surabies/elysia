import { PageContainer } from "@/components/layout/index"
import { PetaClientWrapper } from "./components/PetaClientWrapper"
import {
  batasKecamatanFC,
  batasKelurahanFC,
  ringkasanKoordinatPelanggan,
  ruteFC,
  pipaJaringanFC,
  sumberAirFC,
  statistikPipaJaringan,
  statistikStatusPelanggan,
  titikEksPelangganFC,
  titikPengaduanFC,
  titikPelangganFC,
  titikPotensiFC,
  daftarKebocoranAktifPeta,
  ringkasanAsetPeta,
  ringkasanLaporanPeta,
} from "@/server/services/geo/peta-wilayah.service"

export async function PetaWilayahView() {
  const [
    kelurahan,
    kecamatan,
    rute,
    pipa,
    sumberAir,
    statistikPipa,
    statistikStatus,
    pelanggan,
    statistikPelanggan,
    potensi,
    eksPelanggan,
    pengaduan,
    daftarKebocoran,
    ringkasan,
    aset,
  ] = await Promise.all([
    batasKelurahanFC(),
    batasKecamatanFC(),
    ruteFC(),
    pipaJaringanFC(),
    sumberAirFC(),
    statistikPipaJaringan(),
    statistikStatusPelanggan(),
    titikPelangganFC(),
    ringkasanKoordinatPelanggan(),
    titikPotensiFC(),
    titikEksPelangganFC(),
    titikPengaduanFC(),
    daftarKebocoranAktifPeta(),
    ringkasanLaporanPeta(),
    ringkasanAsetPeta(),
  ])

  return (
    <PageContainer
      penuh
      tanpaHeader
      className="flex h-[calc(100dvh-3.5rem)] min-h-0 flex-1 flex-col overflow-hidden p-0"
    >
      <PetaClientWrapper
        kelurahan={kelurahan}
        kecamatan={kecamatan}
        rute={rute}
        pipa={pipa}
        sumberAir={sumberAir}
        statistikPipa={statistikPipa}
        statistikStatus={statistikStatus}
        pelanggan={pelanggan}
        statistikPelanggan={statistikPelanggan}
        potensi={potensi}
        eksPelanggan={eksPelanggan}
        pengaduan={pengaduan}
        daftarKebocoran={daftarKebocoran}
        ringkasan={ringkasan}
        aset={aset}
      />
    </PageContainer>
  )
}
