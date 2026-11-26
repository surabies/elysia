import { sql } from "drizzle-orm";
import { db } from "@cater/db";

export type UrutAntreanAkumulasi = "RISIKO" | "AKUMULASI" | "NOLG";

export interface FilterAntreanAkumulasi {
  periode: string;
  ruteKode?: string;
  petugasId?: string;
  /** true = hanya yang sudah ada bacaan bulan ini; false = belum dibaca; undefined = semua */
  sudahDibaca?: boolean;
  minAkumulasiM3?: number;
  urut?: UrutAntreanAkumulasi;
  limit?: number;
  offset?: number;
}

/**
 * Antrean verifikasi KHUSUS pelanggan dengan akumulasi_perlu_verifikasi = true
 * (riwayat taksasi sebelum data infolang belum terverifikasi). Terpisah dari antrean ANOMALY biasa.
 *
 * Skor risiko:
 *  - Sudah dibaca bulan ini  : |pakai_tagih - pakai_lalu|  (selisih netto terhadap pemakaian bulan lalu)
 *  - Belum dibaca            : akumulasi_taksasi_m3        (potensi kredit yang belum teruji bacaan fisik)
 */
export async function daftarAntreanAkumulasi(f: FilterAntreanAkumulasi) {
  const limit = Math.min(Math.max(f.limit ?? 50, 1), 500);
  const offset = Math.max(f.offset ?? 0, 0);
  const urut = f.urut ?? "RISIKO";
  const orderBy =
    urut === "AKUMULASI"
      ? sql`d.akumulasi_taksasi_m3::numeric DESC, d.nolg`
      : urut === "NOLG"
        ? sql`d.nolg`
        : sql`risiko_skor DESC, d.nolg`;

  const rows = await db.execute(sql`
    SELECT d.nolg, p.nama, d.rute_kode, d.petugas_id,
           d.akumulasi_taksasi_m3::numeric AS akumulasi_m3,
           d.pakai_lalu::numeric AS pakai_lalu,
           c.id AS cater_id, c.status_verifikasi, c.pakai_tagih::numeric AS pakai_tagih,
           (c.id IS NOT NULL) AS sudah_dibaca,
           CASE WHEN c.id IS NOT NULL
                THEN abs(c.pakai_tagih::numeric - COALESCE(d.pakai_lalu::numeric, 0))
                ELSE d.akumulasi_taksasi_m3::numeric END AS risiko_skor
    FROM daftar_catat d
    JOIN pelanggan p ON p.nolg = d.nolg
    LEFT JOIN cater_baca_meter c ON c.thbl = d.periode AND c.nolg = d.nolg
    WHERE d.periode = ${f.periode}
      AND d.akumulasi_perlu_verifikasi = true
      ${f.ruteKode ? sql`AND d.rute_kode = ${f.ruteKode}` : sql``}
      ${f.petugasId ? sql`AND d.petugas_id = ${f.petugasId}` : sql``}
      ${f.sudahDibaca === true ? sql`AND c.id IS NOT NULL` : f.sudahDibaca === false ? sql`AND c.id IS NULL` : sql``}
      ${f.minAkumulasiM3 !== undefined ? sql`AND d.akumulasi_taksasi_m3::numeric >= ${f.minAkumulasiM3}` : sql``}
    ORDER BY ${orderBy}
    LIMIT ${limit} OFFSET ${offset}
  `);

  const [ringkas] = await db.execute(sql`
    SELECT count(*)::int AS total,
           count(*) FILTER (WHERE EXISTS (SELECT 1 FROM cater_baca_meter c WHERE c.thbl = d.periode AND c.nolg = d.nolg))::int AS sudah_dibaca
    FROM daftar_catat d
    WHERE d.periode = ${f.periode} AND d.akumulasi_perlu_verifikasi = true
  `);

  return { ringkasan: ringkas, data: rows };
}
