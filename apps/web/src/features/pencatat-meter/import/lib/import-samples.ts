// features/dashboard/import/lib/import-samples.ts
// Data contoh untuk pratinjau halaman Import.
import type { RNomorRow } from "../types/import.types";

export const SAMPLE_PENCATATAN_CSV = `thbl;nolg;stml;stma;pakai_m3;tgl_catat;petugas_id;rute_kode;kondisi;latitude;longitude;catatan
202601;00703600750;120;138;18;2026-01-19 07:39:00;PETUGAS01;CD305;Normal;-6.917464;107.619123;Meter normal terbaca jelas
202601;101900821;45;62;17;2026-01-19 07:36:00;PETUGAS02;KD309;Normal;-6.918512;107.618451;Sinyal terputus saat kirim
202601;403100658;210;235;25;2026-01-19 07:29:00;PETUGAS03;KC302;Normal;-6.920145;107.617892;Pulih dari backup HP`;

export const SAMPLE_R_NOMOR: RNomorRow[] = [
  {
    nolg: "101900821",
    nama: "YUYUN YUNINGSIH",
    alamat: "JL.PURNAWARMAN NO 4A RT.02/05",
    tglPutus: "2026-01-20",
    nomorBa: "BA-PUTUS/2026/01/014",
    standCabut: 138,
    alasan: "Permintaan Pelanggan (Rumah Kosong / Dijual)",
  },
  {
    nolg: "403100658",
    nama: "WAHYUDIN",
    alamat: "GG.MOCH.RAMDHAN II 47/97 RT.03/09",
    tglPutus: "2026-01-22",
    nomorBa: "BA-PUTUS/2026/01/089",
    standCabut: 62,
    alasan: "Tunggakan Rekening Air > 3 Bulan (Penyegelan Resmi)",
  },
  {
    nolg: "800800844",
    nama: "PAUD TAMAN CERIA",
    alamat: "GG. BANCEUY NO 51 RT.04/07",
    tglPutus: "2026-01-25",
    nomorBa: "BA-PUTUS/2026/01/102",
    standCabut: 94,
    alasan: "Pindah Lokasi Bangunan / Renovasi Total",
  },
];
