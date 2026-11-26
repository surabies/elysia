// features/dashboard/setting-landing/components/CmsLayananView.tsx
// Halaman Mandiri Pengaturan Konten Layanan Publik CMS: Pasang Baru, Cara Bayar, Tarif Air

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  CreditCard,
  DollarSign,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page/PageContainer';
import { SettingLandingHeader } from './SettingLandingHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type {
  SyaratPasangBaruData,
  CaraPembayaranData,
  StrukturTarifData,
} from '@/types/pengaturan-konten';

const DEFAULT_SYARAT: SyaratPasangBaruData = {
  judul: 'Pasang Baru Sambungan Air Minum',
  deskripsi: 'Syarat dan alur pengajuan sambungan air minum perpipaan baru PERUMDA Tirtawening Kota Bandung.',
  syaratDokumen: [
    'Fotokopi KTP / identitas diri pemohon yang masih berlaku',
    'Fotokopi bukti kepemilikan bangunan (Sertifikat Tanah / AJB / IMB / PBB terakhir)',
    'Surat kuasa bermaterai apabila pemohon bukan pemilik sah bangunan',
    'Denah lokasi atau titik koordinat bangunan yang akan dipasangi sambungan',
    'Mengisi formulir Surat Permohonan Langganan (SPL) air minum resmi',
  ],
  alurTahapan: [
    {
      judul: '1. Pengajuan Permohonan',
      isi: 'Datangi loket kantor pelayanan wilayah terdekat atau hubungi petugas layanan untuk mengisi formulir pendaftaran sambungan baru.',
    },
    {
      judul: '2. Survei Teknis & Gambar Rencana',
      isi: 'Petugas teknis melakukan survei ke lokasi guna memeriksa jaringan pipa distribusi terdekat dan menyusun rencana anggaran biaya (RAB).',
    },
    {
      judul: '3. Pembayaran Biaya Sambungan',
      isi: 'Pemohon melakukan pembayaran biaya pasang baru resmi sesuai rincian RAB di loket atau kanal perbankan mitra.',
    },
    {
      judul: '4. Pemasangan & Kalibrasi Meter',
      isi: 'Teknisi memasang pipa dinas, kran meter, dan water meter air tersegel, disusul penerbitan 11 digit Nomor Langganan resmi.',
    },
  ],
  catatanPenting:
    'Biaya pemasangan sambungan standar mengacu pada jarak pipa retikulasi ke kran meter maksimal 6 meter. Kelebihan jarak pipa dikenakan biaya tambahan sesuai tarif teknis resmi.',
};

const DEFAULT_CARA_BAYAR: CaraPembayaranData = {
  judul: 'Cara Pembayaran Tagihan Rekening Air',
  deskripsi: 'Langkah mudah membayar tagihan rekening air dan kanal perbankan/mitra resmi yang tersedia.',
  langkah: [
    {
      judul: 'Cek tagihan',
      isi: 'Masukkan nomor langganan 11 digit untuk melihat rincian jumlah tagihan rekening air berjalan.',
    },
    {
      judul: 'Pilih kanal pembayaran',
      isi: 'Pilih salah satu kanal pembayaran resmi yang tersedia (ATM, Mobile Banking, Dompet Digital, Minimarket, atau Loket Cabang).',
    },
    {
      judul: 'Simpan bukti bayar',
      isi: 'Simpan struk transaksi atau bukti transfer digital hingga status tagihan Anda berubah menjadi lunas.',
    },
  ],
  kanal: [
    {
      nama: 'Mobile Banking & ATM',
      deskripsi: 'Bank bjb, Bank Mandiri, BRI, BNI, BCA melalui menu Pembayaran Tagihan PDAM / Tirtawening Kota Bandung.',
    },
    {
      nama: 'Dompet Digital & E-Commerce',
      deskripsi: 'GoPay, OVO, DANA, ShopeePay, Tokopedia, dan Blibli dengan memasukkan 11 digit nomor langganan.',
    },
    {
      nama: 'Gerai Ritel Modern & Agen Resmi',
      deskripsi: 'Indomaret, Alfamart, Alfamidi, Pos Indonesia, dan Agen PPOB terverifikasi di seluruh Indonesia.',
    },
    {
      nama: 'Loket Kantor Pelayanan',
      deskripsi: 'Kantor Pusat Jl. Badaksinga No. 10 dan kantor cabang wilayah pelayanan Bandung (Senin - Jumat 08.00 - 15.00 WIB).',
    },
  ],
  catatanDenda:
    'Pembayaran tagihan rekening air jatuh tempo setiap tanggal 20 setiap bulannya. Keterlambatan dikenakan denda administrasi sesuai peraturan daerah yang berlaku.',
};

const DEFAULT_TARIF: StrukturTarifData = {
  judul: 'Struktur Tarif Pemakaian Air Minum',
  deskripsi:
    'Struktur tarif pemakaian air minum perpipaan berdasarkan kelompok golongan pelanggan dan blok konsumsi progresif PERUMDA Tirtawening.',
  tarif: [
    {
      golongan: 'Kelompok I (Sosial)',
      keterangan: 'Kran umum, tempat ibadah, panti asuhan, sekolah negeri',
      tarif: 'Rp 1.050 – Rp 1.500 / m³',
    },
    {
      golongan: 'Kelompok IIA (Rumah Tangga Sederhana)',
      keterangan: 'Rumah tinggal non-permanen / sederhana daya listrik s/d 900 VA',
      tarif: 'Rp 2.200 – Rp 4.100 / m³',
    },
    {
      golongan: 'Kelompok IIB (Rumah Tangga Menengah)',
      keterangan: 'Rumah tinggal permanen daya listrik 1300 VA s/d 2200 VA',
      tarif: 'Rp 3.500 – Rp 6.800 / m³',
    },
    {
      golongan: 'Kelompok IIC (Rumah Tangga Atas)',
      keterangan: 'Rumah tinggal mewah / daya listrik > 2200 VA',
      tarif: 'Rp 5.200 – Rp 9.500 / m³',
    },
    {
      golongan: 'Kelompok III (Niaga)',
      keterangan: 'Ruko, restoran, bengkel, perkantoran swasta, perhotelan',
      tarif: 'Rp 8.000 – Rp 14.500 / m³',
    },
    {
      golongan: 'Kelompok IV (Industri)',
      keterangan: 'Pabrik, manufaktur, industri tekstil, pencucian besar',
      tarif: 'Rp 11.000 – Rp 18.000 / m³',
    },
  ],
  ketentuan: [
    'Perhitungan tarif menggunakan sistem blok konsumsi progresif (Blok I: 0–10 m³, Blok II: 11–20 m³, Blok III: 21–30 m³, Blok IV: >30 m³).',
    'Total tagihan bulanan mencakup harga air, biaya pemeliharaan meter (bea beban), bea administrasi rekening, dan retribusi air limbah sesuai peraturan daerah.',
    'Tarif mengacu pada Keputusan Walikota Bandung tentang Penyesuaian Tarif Air Minum PERUMDA Tirtawening Kota Bandung.',
  ],
};

type SubSection = 'pasang-baru' | 'cara-bayar' | 'tarif-air';

export function CmsLayananView() {
  const router = useRouter();
  const [subSection, setSubSection] = React.useState<SubSection>('pasang-baru');
  const [syarat, setSyarat] = React.useState<SyaratPasangBaruData>(DEFAULT_SYARAT);
  const [caraBayar, setCaraBayar] = React.useState<CaraPembayaranData>(DEFAULT_CARA_BAYAR);
  const [tarif, setTarif] = React.useState<StrukturTarifData>(DEFAULT_TARIF);
  const [sedangMenyimpan, setSedangMenyimpan] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<{ title: string; desc: string; type?: 'success' | 'error' } | null>(null);

  React.useEffect(() => {
    let aktif = true;
    async function muatData() {
      try {
        const res = await fetch('/api/public/pengaturan');
        if (!res.ok) return;
        const json = await res.json();
        if (aktif && json.success && json.data) {
          if (json.data.syaratPasangBaru) setSyarat(json.data.syaratPasangBaru);
          if (json.data.caraPembayaran) setCaraBayar(json.data.caraPembayaran);
          if (json.data.strukturTarif) setTarif(json.data.strukturTarif);
        }
      } catch (err) {
        console.warn('[CMS_LAYANAN_VIEW] Gagal mengambil konfigurasi backend:', err);
      }
    }
    muatData();
    return () => {
      aktif = false;
    };
  }, []);

  const triggerToast = (title: string, desc: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleSimpan = async () => {
    setSedangMenyimpan(true);
    try {
      const items = [
        { kunci: 'syarat_pasang_baru', nilai: syarat, kategori: 'cms' },
        { kunci: 'cara_pembayaran', nilai: caraBayar, kategori: 'cms' },
        { kunci: 'struktur_tarif', nilai: tarif, kategori: 'cms' },
      ];

      await Promise.all(
        items.map((item) =>
          fetch('/api/pengaturan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          })
        )
      );

      triggerToast(
        'Konten Layanan Berhasil Disimpan',
        'Data syarat pasang baru, kanal pembayaran, dan tarif air telah disinkronisasi ke portal publik.'
      );
      router.refresh();
    } catch (err: any) {
      console.error('[SIMPAN_CMS_LAYANAN_ERROR]', err);
      triggerToast('Gagal Menyimpan', err.message || 'Terjadi kesalahan saat menyimpan pengaturan.', 'error');
    } finally {
      setSedangMenyimpan(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <SettingLandingHeader
          title="Pengaturan Konten Layanan Publik CMS"
          description="Kelola syarat & dokumen pasang baru sambungan air, kanal pembayaran tagihan rekening, dan tabel struktur tarif blok konsumsi progresif."
          badge="Modul Mandiri CMS"
          extraAction={
            <Button
              size="sm"
              onClick={handleSimpan}
              disabled={sedangMenyimpan}
              className="cursor-pointer gap-1.5 text-xs bg-foreground text-background hover:bg-foreground/90 font-medium"
            >
              <Save className="size-3.5" />
              {sedangMenyimpan ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          }
        />

        {toastMessage && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <div
              className={`flex items-center gap-3 p-3.5 rounded-xl border shadow-sm ${
                toastMessage.type === 'error'
                  ? 'bg-rose-500/10 text-rose-800 border-rose-500/25 dark:text-rose-300'
                  : 'bg-emerald-500/10 text-emerald-800 border-emerald-500/25 dark:text-emerald-300'
              }`}
            >
              {toastMessage.type === 'error' ? (
                <AlertCircle className="size-4.5 text-rose-600 dark:text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="size-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              )}
              <div className="flex flex-col">
                <span className="text-xs font-semibold">{toastMessage.title}</span>
                <span className="text-xs opacity-90">{toastMessage.desc}</span>
              </div>
            </div>
          </div>
        )}

        {/* Sub-Pills Navigasi Layanan */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
          <Button
            variant={subSection === 'pasang-baru' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSubSection('pasang-baru')}
            className="cursor-pointer gap-1.5 text-xs"
          >
            <FileText className="size-3.5" />
            1. Syarat Pasang Baru ({syarat.syaratDokumen.length} Syarat)
          </Button>

          <Button
            variant={subSection === 'cara-bayar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSubSection('cara-bayar')}
            className="cursor-pointer gap-1.5 text-xs"
          >
            <CreditCard className="size-3.5" />
            2. Cara Pembayaran ({caraBayar.kanal.length} Kanal)
          </Button>

          <Button
            variant={subSection === 'tarif-air' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSubSection('tarif-air')}
            className="cursor-pointer gap-1.5 text-xs"
          >
            <DollarSign className="size-3.5" />
            3. Struktur Tarif Air ({tarif.tarif.length} Golongan)
          </Button>
        </div>

        {/* SECTION 1: PASANG BARU */}
        {subSection === 'pasang-baru' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                Judul & Deskripsi Modul Pasang Baru
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Judul Halaman</label>
                  <Input
                    value={syarat.judul}
                    onChange={(e) => setSyarat({ ...syarat, judul: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Deskripsi Singkat</label>
                  <Input
                    value={syarat.deskripsi}
                    onChange={(e) => setSyarat({ ...syarat, deskripsi: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Daftar Dokumen Persyaratan</h3>
                  <p className="text-xs text-muted-foreground">Dokumen wajib yang harus disiapkan pemohon</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setSyarat({
                      ...syarat,
                      syaratDokumen: [...syarat.syaratDokumen, 'Dokumen persyaratan baru'],
                    })
                  }
                  className="gap-1.5 text-xs cursor-pointer"
                >
                  <Plus className="size-3.5" /> Tambah Dokumen
                </Button>
              </div>

              <div className="space-y-2">
                {syarat.syaratDokumen.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground w-6 text-right">{idx + 1}.</span>
                    <Input
                      value={item}
                      onChange={(e) => {
                        const list = [...syarat.syaratDokumen];
                        list[idx] = e.target.value;
                        setSyarat({ ...syarat, syaratDokumen: list });
                      }}
                      className="text-xs"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setSyarat({
                          ...syarat,
                          syaratDokumen: syarat.syaratDokumen.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Alur & Tahapan Pengajuan</h3>
                  <p className="text-xs text-muted-foreground">Langkah prosedural dari pengajuan hingga sambungan aktif</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setSyarat({
                      ...syarat,
                      alurTahapan: [
                        ...syarat.alurTahapan,
                        { judul: `${syarat.alurTahapan.length + 1}. Tahapan Baru`, isi: 'Deskripsi tahapan baru' },
                      ],
                    })
                  }
                  className="gap-1.5 text-xs cursor-pointer"
                >
                  <Plus className="size-3.5" /> Tambah Alur
                </Button>
              </div>

              <div className="space-y-3">
                {syarat.alurTahapan.map((alur, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border/80 bg-background/50 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        value={alur.judul}
                        onChange={(e) => {
                          const list = [...syarat.alurTahapan];
                          list[idx] = { ...list[idx], judul: e.target.value };
                          setSyarat({ ...syarat, alurTahapan: list });
                        }}
                        className="text-xs font-semibold"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setSyarat({
                            ...syarat,
                            alurTahapan: syarat.alurTahapan.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <Textarea
                      rows={2}
                      value={alur.isi}
                      onChange={(e) => {
                        const list = [...syarat.alurTahapan];
                        list[idx] = { ...list[idx], isi: e.target.value };
                        setSyarat({ ...syarat, alurTahapan: list });
                      }}
                      className="text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: CARA PEMBAYARAN */}
        {subSection === 'cara-bayar' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                <CreditCard className="size-4 text-primary" />
                Informasi & Kebijakan Denda Pembayaran
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Judul Halaman</label>
                  <Input
                    value={caraBayar.judul}
                    onChange={(e) => setCaraBayar({ ...caraBayar, judul: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Catatan Jatuh Tempo & Denda</label>
                  <Input
                    value={caraBayar.catatanDenda}
                    onChange={(e) => setCaraBayar({ ...caraBayar, catatanDenda: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Kanal Pembayaran Resmi</h3>
                  <p className="text-xs text-muted-foreground">Perbankan mitra, loket tunai, dan dompet digital</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCaraBayar({
                      ...caraBayar,
                      kanal: [
                        ...caraBayar.kanal,
                        { nama: 'Kanal Pembayaran Baru', deskripsi: 'Deskripsi kanal dan instruksi' },
                      ],
                    })
                  }
                  className="gap-1.5 text-xs cursor-pointer"
                >
                  <Plus className="size-3.5" /> Tambah Kanal
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {caraBayar.kanal.map((k, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg border border-border bg-background/50 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        value={k.nama}
                        onChange={(e) => {
                          const list = [...caraBayar.kanal];
                          list[idx] = { ...list[idx], nama: e.target.value };
                          setCaraBayar({ ...caraBayar, kanal: list });
                        }}
                        className="text-xs font-semibold"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setCaraBayar({
                            ...caraBayar,
                            kanal: caraBayar.kanal.filter((_, i) => i !== idx),
                          })
                        }
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <Textarea
                      rows={2}
                      value={k.deskripsi}
                      onChange={(e) => {
                        const list = [...caraBayar.kanal];
                        list[idx] = { ...list[idx], deskripsi: e.target.value };
                        setCaraBayar({ ...caraBayar, kanal: list });
                      }}
                      className="text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: STRUKTUR TARIF AIR */}
        {subSection === 'tarif-air' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                <DollarSign className="size-4 text-primary" />
                Tabel Tarif Golongan Pelanggan
              </h2>

              <div className="space-y-3">
                {tarif.tarif.map((t, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg border border-border bg-background/50 space-y-2">
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground">Golongan</label>
                        <Input
                          value={t.golongan}
                          onChange={(e) => {
                            const list = [...tarif.tarif];
                            list[idx] = { ...list[idx], golongan: e.target.value };
                            setTarif({ ...tarif, tarif: list });
                          }}
                          className="text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground">Tarif Air per m³</label>
                        <Input
                          value={t.tarif}
                          onChange={(e) => {
                            const list = [...tarif.tarif];
                            list[idx] = { ...list[idx], tarif: e.target.value };
                            setTarif({ ...tarif, tarif: list });
                          }}
                          className="text-xs font-mono font-medium text-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground">Keterangan / Sasaran</label>
                        <Input
                          value={t.keterangan}
                          onChange={(e) => {
                            const list = [...tarif.tarif];
                            list[idx] = { ...list[idx], keterangan: e.target.value };
                            setTarif({ ...tarif, tarif: list });
                          }}
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Ketentuan & Kebijakan Tarif</h3>
                  <p className="text-xs text-muted-foreground">Poin-poin hukum dan penjelasan blok progresif</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setTarif({
                      ...tarif,
                      ketentuan: [...tarif.ketentuan, 'Ketentuan baru penerapan tarif air'],
                    })
                  }
                  className="gap-1.5 text-xs cursor-pointer"
                >
                  <Plus className="size-3.5" /> Tambah Poin
                </Button>
              </div>

              <div className="space-y-2">
                {tarif.ketentuan.map((k, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground w-6 text-right">•</span>
                    <Input
                      value={k}
                      onChange={(e) => {
                        const list = [...tarif.ketentuan];
                        list[idx] = e.target.value;
                        setTarif({ ...tarif, ketentuan: list });
                      }}
                      className="text-xs"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setTarif({
                          ...tarif,
                          ketentuan: tarif.ketentuan.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
