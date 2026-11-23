// Tipe + data tiruan. Ganti fungsi async di bawah dengan fetch ke API Hono.

export type Opsi = { value: string; label: string };

export type Pelanggan = {
  urut: number;
  noPel: string;
  nama: string;
  alamat: string;
  golTarif: string;
  wilayah: string;
  rute: string;
  tglPasang: string;
};

type Posisi = { wil: string; rute: string; urut: number };

export type RiwayatMutasi = {
  id: string;
  tglInput: string;
  noPel: string;
  nama: string;
  kodeWilayah: string;
  tglPasang: string;
  baru: Posisi;
  lama: Posisi;
  inputBy: string;
};

const tunda = <T>(v: T, ms = 400) =>
  new Promise<T>((r) => setTimeout(() => r(v), ms));

const seed = (urut: number, noPel: string, nama: string, alamat: string): Pelanggan => ({
  urut, noPel, nama, alamat, golTarif: "R2", wilayah: "WP 5", rute: "BD502", tglPasang: "2026-11-02",
});

let pelangganDb: Pelanggan[] = [
  seed(143, "00800400520", "LIM JI TEK", "JL.SUNIARAJA 120"),
  seed(144, "00800400525", "HASAN SUGIRI UMIADJI", "SUNIARAJA NO.122A"),
  seed(145, "00800400530", "NY NENENG AMIJATI", "JL.SUNIARAJA 120BAG/BLK"),
  seed(146, "00800500642", "SAMSUL ARIFIN", "STASION SELATAN 23 B"),
  seed(147, "00800400535", "KOMALA DEWI UMI ADJI", "JL.SUNIARAJA NO.122B (124"),
  seed(148, "00800400550", "M.SJAHRODJI", "JL.SUNIARAJA 122"),
  seed(149, "00800400610", "LIM JIOE HONG", "SUNIARAJA B/128 100/7B"),
  seed(150, "00800400620", "HALIMAH MAGNAR", "JL.SUNIARAJA 130"),
  seed(151, "00800400625", "HALIMAH MAGNAR", "JL.SUNIARAJA 130"),
];

const petugasDb = [
  { id: "p1", nama: "AGUS GANTINA", wilayah: "WP 5" },
  { id: "p2", nama: "DEDI SUKMANA", wilayah: "WP 5" },
  { id: "p3", nama: "RINA MARLINA", wilayah: "WP 4" },
];

const ruteDb = [
  { kode: "BD502", petugasId: "p1" },
  { kode: "BD503", petugasId: "p1" },
  { kode: "BD601", petugasId: "p2" },
  { kode: "BD602", petugasId: "p2" },
  { kode: "BC411", petugasId: "p3" },
];

const toOpsi = (v: string): Opsi => ({ value: v, label: v });

export const wilayahOpsi = ["WP 1", "WP 2", "WP 3", "WP 4", "WP 5"].map(toOpsi);

export const getPetugas = (wilayah: string) =>
  tunda(petugasDb.filter((p) => p.wilayah === wilayah).map((p) => ({ value: p.id, label: p.nama })), 250);

export const getRute = (petugasId: string) =>
  tunda(ruteDb.filter((r) => r.petugasId === petugasId).map((r) => toOpsi(r.kode)), 250);

export const getRuteTujuan = (kecuali: string) =>
  tunda(
    ruteDb
      .filter((r) => r.kode !== kecuali)
      .map((r) => ({
        value: r.kode,
        label: `${r.kode} · ${petugasDb.find((p) => p.id === r.petugasId)?.nama}`,
      })),
    250,
  );

export const getZona = () => tunda([1, 2, 3, 4].map((n) => toOpsi(`Zona ${n}`)), 250);

export const getPelanggan = (rute: string) =>
  tunda(pelangganDb.filter((p) => p.rute === rute));

export const cariPelanggan = (noPel: string) =>
  tunda(pelangganDb.find((p) => p.noPel === noPel) ?? null);

export function pindahRute(noPelList: string[], ruteBaru: string) {
  pelangganDb = pelangganDb.map((p) => (noPelList.includes(p.noPel) ? { ...p, rute: ruteBaru } : p));
  return tunda(true, 600);
}

let riwayatDb: RiwayatMutasi[] = [];

export const getRiwayat = () => tunda([...riwayatDb], 300);

export function simpanMutasi(p: Pelanggan, tujuan: Posisi) {
  const log: RiwayatMutasi = {
    id: crypto.randomUUID(),
    tglInput: new Date().toISOString().slice(0, 10),
    noPel: p.noPel,
    nama: p.nama,
    kodeWilayah: p.wilayah,
    tglPasang: p.tglPasang,
    baru: tujuan,
    lama: { wil: p.wilayah, rute: p.rute, urut: p.urut },
    inputBy: "SURABIE",
  };
  riwayatDb = [log, ...riwayatDb];
  return tunda(log, 600);
}
