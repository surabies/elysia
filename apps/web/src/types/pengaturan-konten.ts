// apps/web/src/types/pengaturan-konten.ts
// Skema Tipe Komprehensif Konfigurasi Profil Perusahaan & CMS Konten Dinamis

export interface ProfilPerusahaanData {
  nama: string;
  singkatan: string;
  tagline: string;
  tentang: string;
  visi: string;
  misi: string[];
  sejarah: string;
  alamatPusat: string;
  callCenter: string;
  whatsapp: string;
  email: string;
  jamLayanan: string;
  website: string;
}

export interface KantorCabangItem {
  id: string;
  nama: string;
  wilayah: string;
  alamat: string;
  kontak: string;
  jamLayanan?: string;
  keterangan?: string;
}

export interface KontakLayananData {
  kantorPusat: {
    alamat: string;
    callCenter: string;
    whatsapp: string;
    email: string;
    jamLayanan: string;
  };
  kantorCabang: KantorCabangItem[];
  daruratPipa: string;
}

export interface AlurPasangItem {
  judul: string;
  isi: string;
}

export interface SyaratPasangBaruData {
  judul: string;
  deskripsi: string;
  syaratDokumen: string[];
  alurTahapan: AlurPasangItem[];
  catatanPenting: string;
}

export interface LangkahBayarItem {
  judul: string;
  isi: string;
}

export interface KanalBayarItem {
  nama: string;
  deskripsi: string;
}

export interface CaraPembayaranData {
  judul: string;
  deskripsi: string;
  langkah: LangkahBayarItem[];
  kanal: KanalBayarItem[];
  catatanDenda: string;
}

export interface TarifGolonganItem {
  golongan: string;
  keterangan: string;
  tarif: string;
}

export interface StrukturTarifData {
  judul: string;
  deskripsi: string;
  tarif: TarifGolonganItem[];
  ketentuan: string[];
}

export interface BeritaItem {
  slug: string;
  judul: string;
  ringkasan: string;
  konten?: string;
  tanggal: string;
  penulis?: string;
  tag?: string;
  aktif?: boolean;
}

export interface BeritaPengumumanData {
  daftarBerita: BeritaItem[];
}

export interface GangguanAirItem {
  id: string;
  wilayah: string;
  penyebab: string;
  status: 'Sedang ditangani' | 'Selesai' | 'Investigasi Lapangan';
  perkiraan: string;
  tanggal?: string;
}

export interface InfoGangguanAirData {
  daftarGangguan: GangguanAirItem[];
}

export interface SemuaPengaturanKonten {
  profilPerusahaan: ProfilPerusahaanData;
  kontakLayanan: KontakLayananData;
  syaratPasangBaru: SyaratPasangBaruData;
  caraPembayaran: CaraPembayaranData;
  strukturTarif: StrukturTarifData;
  beritaPengumuman: BeritaPengumumanData;
  infoGangguan: InfoGangguanAirData;
}
