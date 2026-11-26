// features/dashboard/import/lib/import-parsers.ts
import { PERIODE_BERJALAN_AKTIF } from "@/config/periode";
import { createColumnFinder, parseDecimal, readCell, tokenizeCsv } from "./csv";
import {
  KONDISI_NORMAL_KEYWORD,
  LAPDATAMETER_DEFAULTS,
  PBPK_DEFAULTS,
  PENCATATAN_DEFAULTS,
} from "./import-config";
import type {
  LapDataMeterRow,
  PbpkMutasi,
  PbpkRow,
  PencatatanRow,
  RNomorRow,
} from "../types/import.types";

const stripToId = (value: string) => value.replace(/[^\w-]/g, "");
const stripToPeriode = (value: string) => value.replace(/[^\w]/g, "");

/** Kondisi dianggap normal bila keterangan memuat kata "normal" atau TMSS kosong ("-"). */
export const isKondisiNormal = (ketCatat: string, tmss?: string) =>
  ketCatat.toLowerCase().includes(KONDISI_NORMAL_KEYWORD) || tmss === "-";

/* ---------------------------------- PBPK --------------------------------- */

export function parsePbpkCsv(text: string): PbpkRow[] {
  const table = tokenizeCsv(text);
  if (table.length < 2) return [];

  const find = createColumnFinder(table[0]);
  const col = {
    nolg: find(["nolg", "nolangganan", "no pel", "nomor pelanggan"]),
    nama: find(["nama", "nama pelanggan"]),
    alamat: find(["alamat", "alamat sambungan", "alamat pelanggan"]),
    rt: find(["rt"]),
    rw: find(["rw"]),
    notelp: find(["notelp", "no_telp", "no telp", "telepon", "hp"]),
    jmlpenghuni: find(["jmlpenghuni", "jml_penghuni", "penghuni"]),
    nometer: find(["nometer", "no_meter", "no meter", "meter"]),
    kd_merkmeter: find(["kd_merkmeter", "merk_meter", "merkmeter", "merk"]),
    kd_ukmeter: find(["kd_ukmeter", "ukuran_meter", "ukmeter", "ukuran"]),
    tglaktif: find(["tglaktif", "tgl_aktif", "tanggal aktif", "tgl_pasang"]),
    kd_kelurahan: find(["kd_kelurahan", "kelurahan_kode", "kelurahan"]),
    kd_kecamatan: find(["kd_kecamatan", "kecamatan_kode", "kecamatan"]),
    kode_wilayah: find(["kode_wilayah", "wilayah_kode", "wilayah"]),
    tarif: find(["kd_goltarif", "goltarif", "tarif_kode", "tarif", "golongan"]),
    rute: find(["kd_rute", "rute_kode", "rute"]),
    urutan: find(["no_urutrute", "no_urut_rute", "urut_rute", "no_urut", "urutan"]),
    mutasi: find(["mutasian", "mutasi", "tipe_mutasi"]),
  };

  const rows: PbpkRow[] = [];
  table.slice(1).forEach((parts) => {
    if (parts.length < 3) return;
    const nolgRaw = readCell(parts, col.nolg);
    const nolg = stripToId(nolgRaw);
    if (!nolg) return;

    const notelpRaw = readCell(parts, col.notelp);
    const notelp = notelpRaw && notelpRaw !== "-" ? notelpRaw : undefined;
    const nometerRaw = readCell(parts, col.nometer);
    const nometer = nometerRaw ? nometerRaw.trim() : `MTR-${nolg}`;

    const mutasiRaw = readCell(parts, col.mutasi).toUpperCase();
    const mutasian: PbpkMutasi = mutasiRaw.includes("PK") ? "PK" : "PB";

    rows.push({
      nolg,
      nama: readCell(parts, col.nama) || PBPK_DEFAULTS.nama,
      alamat: readCell(parts, col.alamat) || PBPK_DEFAULTS.alamat,
      rt: readCell(parts, col.rt) || undefined,
      rw: readCell(parts, col.rw) || undefined,
      notelp,
      jmlpenghuni: parseDecimal(readCell(parts, col.jmlpenghuni)),
      nometer,
      kd_merkmeter: readCell(parts, col.kd_merkmeter) || "ITR",
      kd_ukmeter: readCell(parts, col.kd_ukmeter) || "1/2",
      tglaktif: readCell(parts, col.tglaktif) || undefined,
      kd_kelurahan: readCell(parts, col.kd_kelurahan) || undefined,
      kd_kecamatan: readCell(parts, col.kd_kecamatan) || undefined,
      kode_wilayah: readCell(parts, col.kode_wilayah) || undefined,
      kd_goltarif: readCell(parts, col.tarif) || PBPK_DEFAULTS.tarif,
      kd_rute: readCell(parts, col.rute) || PBPK_DEFAULTS.rute,
      no_urutrute: parseDecimal(readCell(parts, col.urutan)) ?? 0,
      mutasian,
    });
  });
  return rows;
}

/* ----------------------------- Data Pencatatan ---------------------------- */

export function parsePencatatanCsv(text: string): PencatatanRow[] {
  const table = tokenizeCsv(text);
  if (table.length < 2) return [];

  const find = createColumnFinder(table[0]);
  const col = {
    thbl: find(["thbl", "periode"]),
    nolg: find(["nolg", "no pel", "nomor pelanggan"]),
    stml: find(["stml", "st awal", "stand awal"]),
    stma: find(["stma", "st akhir", "stand akhir"]),
    pakai: find(["pakai_m3", "pakai", "kubikasi"]),
    tgl: find(["tgl_catat", "tanggal catat"]),
    petugas: find(["petugas_id", "kd_petugas", "nama petugas"]),
    rute: find(["rute_kode", "rute", "kd_rute"]),
    kondisi: find(["kondisi", "nm_kel", "ket_catat", "kd_kel"]),
    lat: find(["latitude", "lat"]),
    lng: find(["longitude", "lng", "long"]),
    catatan: find(["catatan", "nama zonasi"]),
  };

  const rows: PencatatanRow[] = [];
  for (const parts of table.slice(1)) {
    if (parts.length < 3) continue;

    const nolg = stripToId(readCell(parts, col.nolg));
    if (!nolg) continue;

    const stml = parseDecimal(readCell(parts, col.stml)) ?? 0;
    const stma = parseDecimal(readCell(parts, col.stma)) ?? 0;

    rows.push({
      thbl: stripToPeriode(readCell(parts, col.thbl)) || PERIODE_BERJALAN_AKTIF,
      nolg,
      stml,
      stma,
      pakaiM3:
        parseDecimal(readCell(parts, col.pakai)) ?? Math.max(0, stma - stml),
      tglCatat: readCell(parts, col.tgl) || new Date().toISOString(),
      petugasId: readCell(parts, col.petugas) || PENCATATAN_DEFAULTS.petugasId,
      ruteKode: readCell(parts, col.rute) || PENCATATAN_DEFAULTS.ruteKode,
      ketCatat: readCell(parts, col.kondisi) || PENCATATAN_DEFAULTS.ketCatat,
      latitude: parseDecimal(readCell(parts, col.lat)),
      longitude: parseDecimal(readCell(parts, col.lng)),
      catatan: readCell(parts, col.catatan) || PENCATATAN_DEFAULTS.catatan,
    });
  }
  return rows;
}

/* ------------------------------ LapDataMeter ------------------------------ */

export function parseLapDataMeterCsv(text: string): LapDataMeterRow[] {
  const table = tokenizeCsv(text);
  if (table.length < 2) return [];

  const find = createColumnFinder(table[0]);
  const col = {
    nolg: find(["no pel", "nolg", "nomor pelanggan", "nopel"]),
    nama: find(["nama pelanggan", "nama"]),
    thbl: find(["periode", "thbl"]),
    stml: find(["st awal", "stml", "stand awal"]),
    stma: find(["st akhir", "stma", "stand akhir"]),
    pakai: find(["pakai_m3", "pakai", "kubikasi"]),
    pakaiLalu: find(["pakai lau", "pakai lalu", "pakai_lalu"]),
    tmss: find(["kd_kel", "tmss", "kode_kondisi"]),
    ketCatat: find(["nm_kel", "kondisi", "ket_catat", "keterangan"]),
    petugas: find(["kd_petugas", "petugas_id"]),
    namaPetugas: find(["nama petugas"]),
    rute: find(["rute_kode", "rute", "kd_rute"]),
    tgl: find(["tgl_catat", "tanggal catat"]),
  };

  const rows: LapDataMeterRow[] = [];
  for (const parts of table.slice(1)) {
    if (parts.length < 3) continue;

    const nolg = stripToId(readCell(parts, col.nolg));
    const thbl = stripToPeriode(readCell(parts, col.thbl));
    if (!nolg || !thbl) continue;

    const stml = parseDecimal(readCell(parts, col.stml)) ?? 0;
    const stma = parseDecimal(readCell(parts, col.stma)) ?? 0;
    const petugasId =
      readCell(parts, col.petugas) ||
      readCell(parts, col.namaPetugas) ||
      undefined;

    const rawPakai = parseDecimal(readCell(parts, col.pakai));
    const pakaiM3 =
      rawPakai !== undefined
        ? Math.max(0, rawPakai)
        : Math.max(0, stma - stml);

    rows.push({
      thbl,
      nolg,
      nama: readCell(parts, col.nama) || undefined,
      stml,
      stma,
      pakaiM3,
      pakaiLalu: parseDecimal(readCell(parts, col.pakaiLalu)),
      tmss: readCell(parts, col.tmss) || LAPDATAMETER_DEFAULTS.tmss,
      ketCatat: readCell(parts, col.ketCatat) || LAPDATAMETER_DEFAULTS.ketCatat,
      petugasId,
      namaPetugas: readCell(parts, col.namaPetugas) || petugasId,
      ruteKode: readCell(parts, col.rute) || undefined,
      tglCatat: readCell(parts, col.tgl) || new Date().toISOString(),
      catatan: LAPDATAMETER_DEFAULTS.catatan,
    });
  }
  return rows;
}

/** Pre-validasi LapDataMeter. Mengembalikan pesan galat pertama, atau `null` bila valid. */
export function validateLapDataMeterRows(
  rows: LapDataMeterRow[],
): string | null {
  const seen = new Set<string>();
  for (const row of rows) {
    const key = `${row.thbl}|${row.nolg}`;
    if (seen.has(key)) {
      return `Duplikat NOLG ${row.nolg} pada periode ${row.thbl}. Hapus baris duplikat sebelum mengimpor.`;
    }
    seen.add(key);
  }
  return null;
}

/* --------------------------------- R-Nomor -------------------------------- */

export function parseRNomorCsv(text: string): RNomorRow[] {
  const table = tokenizeCsv(text);
  if (table.length < 2) return [];

  const find = createColumnFinder(table[0]);
  const col = {
    nolg: find(["nolg", "no pel", "nomor pelanggan", "nopel"]),
    nama: find(["nama", "nama pelanggan"]),
    alamat: find(["alamat", "alamat pelanggan", "alamat sambungan"]),
    tglPutus: find(["tgl_putus", "tgl putus", "tanggal putus", "tgl"]),
    nomorBa: find(["nomor_ba", "nomor ba", "no_ba", "no ba", "ba"]),
    standCabut: find(["stand_cabut", "stand cabut", "stand"]),
    alasan: find(["alasan", "alasan pemutusan", "ket", "keterangan"]),
  };

  const rows: RNomorRow[] = [];
  for (const parts of table.slice(1)) {
    if (parts.length < 2) continue;
    const nolg = stripToId(readCell(parts, col.nolg));
    if (!nolg) continue;

    rows.push({
      nolg,
      nama: readCell(parts, col.nama) || "-",
      alamat: readCell(parts, col.alamat) || "-",
      tglPutus:
        readCell(parts, col.tglPutus) || new Date().toISOString().slice(0, 10),
      nomorBa: readCell(parts, col.nomorBa) || "-",
      standCabut: parseDecimal(readCell(parts, col.standCabut)) ?? 0,
      alasan: readCell(parts, col.alasan) || "Pemutusan Rekening",
    });
  }
  return rows;
}

