import { sql } from "drizzle-orm";
import { db, drdCakupanPenduduk } from "@cater/db";

export const DRD_TABS = [
  "ringkasan",
  "kelurahan",
  "domestik",
  "tarif",
  "taa-kelurahan",
  "taa",
  "cakupan",
  "tagihan",
  "pelanggan",
] as const;

export type DrdTab = (typeof DRD_TABS)[number];

export interface DrdColumn {
  key: string;
  label: string;
  format?: "number" | "currency" | "percent" | "text";
  group?: string;
}

export type DrdRow = Record<string, string | number | null>;

export interface DrdChartGroup {
  kode: string;
  nama: string;
  jumlahPelanggan: number;
  pemakaianM3: number;
  totalTagihan: number;
}

export interface DrdSummary {
  periode: string;
  jumlahPelanggan: number;
  pemakaianM3: number;
  totalTagihan: number;
  jumlahTaa: number;
  jumlahDomestik: number;
  jumlahKelurahan: number;
  dataKelurahan: DrdChartGroup[];
  dataDomestik: DrdChartGroup[];
  dataTarif: DrdChartGroup[];
  dataTaaKelurahan: Array<{
    kelurahan: string;
    jumlahTaa: number;
    persentaseTaa: number;
  }>;
  dataCakupan: Array<{
    kelurahan: string;
    sl: number;
    pemakaianM3: number;
    totalTagihan: number;
  }>;
  dataTaaStatus: {
    normal: number;
    taa: number;
    persenTaa: number;
    sebaranTarif: Array<{ kode: string; jumlahTaa: number }>;
  };
  dataTagihanKomposisi: {
    hargaAir: number;
    beaBeban: number;
    beaAdmin: number;
    airKotor: number;
    lainLain: number;
    totalTagihan: number;
  };
}

export interface DrdPageData {
  periodeAktif: string;
  periodes: string[];
  tab: DrdTab;
  ringkasan: DrdSummary | null;
  kolom: DrdColumn[];
  baris: DrdRow[];
  barisFooter?: DrdRow;
  halaman: number;
  ukuranHalaman: number;
  total: number;
  totalHalaman: number;
  pencarian: string;
}

const TAA_CONDITION = sql`(
  upper(trim(coalesce(c.ket_catat, ''))) IN ('TIDAK ADA AIR', 'TIDAK_ADA_AIR', 'TAA')
  OR upper(trim(coalesce(c.tmss, ''))) = 'TIDAK_ADA_AIR'
  OR c.alasan_taksir = 'NOL_TIDAK_ADA_AIR'
  OR EXISTS (
    SELECT 1
    FROM master_kondisi_catat mk
    WHERE mk.kode_tmss = c.tmss
      AND upper(trim(mk.nama)) IN ('TIDAK ADA AIR', 'TIDAK_ADA_AIR', 'TAA')
  )
)`;

const DOMESTIC_TARIFFS = [
  "1A",
  "2A1",
  "2A2",
  "2A3",
  "2A4",
  "2A5",
  "3A",
  "3B",
  "3C",
] as const;

const COVERAGE_TARIFFS = [
  "1A",
  "1B",
  "2A1",
  "2A2",
  "2A3",
  "2A4",
  "2A5",
  "2B",
  "3A",
  "3B",
  "3C",
  "4A",
  "4B",
] as const;

const COVERAGE_TECHNICAL_TARIFFS = [
  "1A",
  "2A1",
  "2A2",
  "2A3",
  "2A4",
  "3A",
  "3B",
] as const;

const TABLE_COLUMNS: Record<Exclude<DrdTab, "ringkasan">, DrdColumn[]> = {
  kelurahan: [
    { key: "kelurahan", label: "Kelurahan", format: "text" },
    { key: "jumlahPelanggan", label: "Pelanggan", format: "number" },
    { key: "pemakaianM3", label: "Pemakaian (m³)", format: "number" },
    { key: "totalTagihan", label: "Total tagihan", format: "currency" },
  ],
  domestik: [
    { key: "tarif", label: "Tarif", format: "text" },
    { key: "namaTarif", label: "Nama tarif", format: "text" },
    { key: "jumlahPelanggan", label: "Pelanggan", format: "number" },
    { key: "pemakaianM3", label: "Pemakaian (m³)", format: "number" },
    { key: "totalTagihan", label: "Total tagihan", format: "currency" },
  ],
  tarif: [
    { key: "tarif", label: "Tarif", format: "text" },
    { key: "namaTarif", label: "Nama tarif", format: "text" },
    { key: "jumlahPelanggan", label: "Pelanggan", format: "number" },
    { key: "pemakaianM3", label: "Pemakaian (m³)", format: "number" },
    { key: "totalTagihan", label: "Total tagihan", format: "currency" },
  ],
  "taa-kelurahan": [
    { key: "kelurahan", label: "Kelurahan", format: "text" },
    { key: "jumlahPelanggan", label: "Pelanggan TAA", format: "number" },
    { key: "pemakaianM3", label: "Pemakaian (m³)", format: "number" },
    { key: "totalTagihan", label: "Total tagihan", format: "currency" },
  ],
  cakupan: [{ key: "kelurahan", label: "Kelurahan", format: "text" }],
  taa: [
    { key: "nomorLangganan", label: "No. langganan", format: "text" },
    { key: "nama", label: "Nama", format: "text" },
    { key: "alamat", label: "Alamat", format: "text" },
    { key: "tarif", label: "Tarif", format: "text" },
    { key: "kelurahan", label: "Kelurahan", format: "text" },
    { key: "kondisi", label: "Keterangan", format: "text" },
    { key: "pemakaianM3", label: "Pemakaian (m³)", format: "number" },
    { key: "totalTagihan", label: "Total tagihan", format: "currency" },
  ],
  tagihan: [
    { key: "nomorLangganan", label: "No. langganan", format: "text" },
    { key: "nama", label: "Nama", format: "text" },
    { key: "alamat", label: "Alamat", format: "text" },
    { key: "tarif", label: "Tarif", format: "text" },
    { key: "kelurahan", label: "Kelurahan", format: "text" },
    { key: "hargaAir", label: "Harga air", format: "currency" },
    { key: "beaBeban", label: "Bea beban", format: "currency" },
    { key: "beaAdmin", label: "Bea admin", format: "currency" },
    { key: "airKotor", label: "Air kotor", format: "currency" },
    { key: "lainLain", label: "Lain-lain", format: "currency" },
    { key: "totalTagihan", label: "Total tagihan", format: "currency" },
  ],
  pelanggan: [
    { key: "nomorLangganan", label: "No. langganan", format: "text" },
    { key: "nama", label: "Nama", format: "text" },
    { key: "alamat", label: "Alamat", format: "text" },
    { key: "tarif", label: "Tarif", format: "text" },
    { key: "kelurahan", label: "Kelurahan", format: "text" },
    { key: "pemakaianM3", label: "Pemakaian (m³)", format: "number" },
    { key: "totalTagihan", label: "Total tagihan", format: "currency" },
  ],
};

const toNumber = (value: unknown) => Number(value ?? 0);
const toString = (value: unknown, fallback = "") =>
  value == null ? fallback : String(value);

function isDrdTab(value: string | undefined): value is DrdTab {
  return DRD_TABS.includes(value as DrdTab);
}

export class DrdService {
  async setCoveragePopulation(input: {
    kelurahanKode: string;
    jumlahPenduduk: number;
    updatedBy: string;
  }) {
    await db
      .insert(drdCakupanPenduduk)
      .values({
        kelurahanKode: input.kelurahanKode,
        jumlahPenduduk: input.jumlahPenduduk,
        updatedBy: input.updatedBy,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: drdCakupanPenduduk.kelurahanKode,
        set: {
          jumlahPenduduk: input.jumlahPenduduk,
          updatedBy: input.updatedBy,
          updatedAt: new Date(),
        },
      });
  }

  async getPeriods(): Promise<string[]> {
    const raw = await db.execute(sql`
      SELECT DISTINCT thbl
      FROM rekening_drd
      WHERE thbl ~ '^[0-9]{6}$'
      ORDER BY thbl DESC
    `);
    return (raw as Array<Record<string, unknown>>).map((row) =>
      toString(row.thbl),
    );
  }

  async getSummary(thbl: string): Promise<DrdSummary> {
    const [totalsRaw, kelurahanRaw, tariffRaw, domesticRaw, coverageRaw, taaAreaRaw, taaTariffRaw, taaTotalRaw, compositionRaw] =
      await Promise.all([
        db.execute(sql`
          SELECT
            count(*)::int AS jumlah_pelanggan,
            coalesce(sum(d.pakai_m3), 0)::float AS pemakaian_m3,
            coalesce(sum(d.total_tagihan), 0)::float AS total_tagihan,
            count(*) FILTER (WHERE EXISTS (
              SELECT 1 FROM cater_baca_meter c
              WHERE c.thbl = d.thbl AND c.nolg = d.nolg AND ${TAA_CONDITION}
            ))::int AS jumlah_taa,
            count(DISTINCT coalesce(k.nama, 'Tidak diketahui'))::int AS jumlah_kelurahan
          FROM rekening_drd d
          LEFT JOIN pelanggan p ON p.nolg = d.nolg
          LEFT JOIN kelurahan k ON k.kode = p.kelurahan_kode
          WHERE d.thbl = ${thbl}
        `),
        db.execute(sql`
          SELECT coalesce(k.nama, 'Tidak diketahui') AS kelurahan,
            count(*)::int AS jumlah_pelanggan,
            coalesce(sum(d.pakai_m3), 0)::float AS pemakaian_m3,
            coalesce(sum(d.total_tagihan), 0)::float AS total_tagihan
          FROM rekening_drd d
          LEFT JOIN pelanggan p ON p.nolg = d.nolg
          LEFT JOIN kelurahan k ON k.kode = p.kelurahan_kode
          WHERE d.thbl = ${thbl}
          GROUP BY coalesce(k.nama, 'Tidak diketahui')
          ORDER BY total_tagihan DESC
        `),
        db.execute(sql`
          SELECT coalesce(p.tarif_kode, 'TANPA_TARIF') AS kode,
            coalesce(t.nama, 'Tanpa tarif') AS nama,
            count(*)::int AS jumlah_pelanggan,
            coalesce(sum(d.pakai_m3), 0)::float AS pemakaian_m3,
            coalesce(sum(d.total_tagihan), 0)::float AS total_tagihan
          FROM rekening_drd d
          LEFT JOIN pelanggan p ON p.nolg = d.nolg
          LEFT JOIN golongan_tarif t ON t.kode = p.tarif_kode
          WHERE d.thbl = ${thbl}
          GROUP BY coalesce(p.tarif_kode, 'TANPA_TARIF'), coalesce(t.nama, 'Tanpa tarif')
          ORDER BY total_tagihan DESC
        `),
        db.execute(sql`
          SELECT p.tarif_kode AS kode, coalesce(t.nama, p.tarif_kode) AS nama,
            count(*)::int AS jumlah_pelanggan,
            coalesce(sum(d.pakai_m3), 0)::float AS pemakaian_m3,
            coalesce(sum(d.total_tagihan), 0)::float AS total_tagihan
          FROM rekening_drd d
          INNER JOIN pelanggan p ON p.nolg = d.nolg
          LEFT JOIN golongan_tarif t ON t.kode = p.tarif_kode
          WHERE d.thbl = ${thbl} AND regexp_replace(p.tarif_kode, '^GOL_', '') IN (${sql.join(DOMESTIC_TARIFFS.map((code) => sql`${code}`), sql`, `)})
          GROUP BY p.tarif_kode, t.nama
          ORDER BY p.tarif_kode
        `),
        db.execute(sql`
          SELECT coalesce(k.nama, 'Tidak diketahui') AS kelurahan,
            count(*)::int AS sl,
            coalesce(sum(d.pakai_m3), 0)::float AS pemakaian_m3,
            coalesce(sum(d.total_tagihan), 0)::float AS total_tagihan
          FROM rekening_drd d
          LEFT JOIN pelanggan p ON p.nolg = d.nolg
          LEFT JOIN kelurahan k ON k.kode = p.kelurahan_kode
          WHERE d.thbl = ${thbl}
          GROUP BY coalesce(k.nama, 'Tidak diketahui')
          ORDER BY sl DESC
        `),
        db.execute(sql`
          SELECT coalesce(k.nama, 'Tidak diketahui') AS kelurahan,
            count(*)::int AS jumlah_taa
          FROM rekening_drd d
          LEFT JOIN pelanggan p ON p.nolg = d.nolg
          LEFT JOIN kelurahan k ON k.kode = p.kelurahan_kode
          WHERE d.thbl = ${thbl} AND EXISTS (
            SELECT 1 FROM cater_baca_meter c
            WHERE c.thbl = d.thbl AND c.nolg = d.nolg AND ${TAA_CONDITION}
          )
          GROUP BY coalesce(k.nama, 'Tidak diketahui')
          ORDER BY jumlah_taa DESC
        `),
        db.execute(sql`
          SELECT coalesce(p.tarif_kode, 'TANPA_TARIF') AS kode,
            count(*)::int AS jumlah_taa
          FROM rekening_drd d
          LEFT JOIN pelanggan p ON p.nolg = d.nolg
          WHERE d.thbl = ${thbl} AND EXISTS (
            SELECT 1 FROM cater_baca_meter c
            WHERE c.thbl = d.thbl AND c.nolg = d.nolg AND ${TAA_CONDITION}
          )
          GROUP BY coalesce(p.tarif_kode, 'TANPA_TARIF')
          ORDER BY jumlah_taa DESC
          LIMIT 6
        `),
        db.execute(sql`
          SELECT count(*)::int AS total,
            count(*) FILTER (WHERE EXISTS (
              SELECT 1 FROM cater_baca_meter c
              WHERE c.thbl = d.thbl AND c.nolg = d.nolg AND ${TAA_CONDITION}
            ))::int AS taa
          FROM rekening_drd d
          WHERE d.thbl = ${thbl}
        `),
        db.execute(sql`
          SELECT
            coalesce(sum(jml_harga_air), 0)::float AS harga_air,
            coalesce(sum(bea_beban), 0)::float AS bea_beban,
            coalesce(sum(bea_admin), 0)::float AS bea_admin,
            coalesce(sum(air_kotor), 0)::float AS air_kotor,
            coalesce(sum(lain_lain), 0)::float AS lain_lain,
            coalesce(sum(total_tagihan), 0)::float AS total_tagihan
          FROM rekening_drd
          WHERE thbl = ${thbl}
        `),
      ]);

    const total = (totalsRaw[0] ?? {}) as Record<string, unknown>;
    const taaTotals = (taaTotalRaw[0] ?? {}) as Record<string, unknown>;
    const jumlahPelanggan = toNumber(total.jumlah_pelanggan);
    const jumlahTaa = toNumber(total.jumlah_taa);
    const taaTotal = toNumber(taaTotals.total);
    const taaCount = toNumber(taaTotals.taa);
    const mapGroup = (rows: unknown[]) =>
      (rows as Array<Record<string, unknown>>).map((row) => ({
        kode: toString(row.kode, toString(row.kelurahan)),
        nama: toString(row.nama, toString(row.kelurahan)),
        jumlahPelanggan: toNumber(row.jumlah_pelanggan ?? row.sl),
        pemakaianM3: toNumber(row.pemakaian_m3),
        totalTagihan: toNumber(row.total_tagihan),
      }));
    const taaRows = taaAreaRaw as Array<Record<string, unknown>>;
    const composition = (compositionRaw[0] ?? {}) as Record<string, unknown>;

    return {
      periode: thbl,
      jumlahPelanggan,
      pemakaianM3: toNumber(total.pemakaian_m3),
      totalTagihan: toNumber(total.total_tagihan),
      jumlahTaa,
      jumlahDomestik: (domesticRaw as Array<Record<string, unknown>>).reduce(
        (sum, row) => sum + toNumber(row.jumlah_pelanggan),
        0,
      ),
      jumlahKelurahan: toNumber(total.jumlah_kelurahan),
      dataKelurahan: mapGroup((kelurahanRaw as Array<Record<string, unknown>>).slice(0, 8)),
      dataDomestik: mapGroup(domesticRaw as unknown[]),
      dataTarif: mapGroup(tariffRaw as unknown[]),
      dataTaaKelurahan: taaRows.slice(0, 8).map((row) => ({
        kelurahan: toString(row.kelurahan),
        jumlahTaa: toNumber(row.jumlah_taa),
        persentaseTaa:
          jumlahPelanggan > 0
            ? Math.round((toNumber(row.jumlah_taa) / jumlahPelanggan) * 1000) / 10
            : 0,
      })),
      dataCakupan: (coverageRaw as Array<Record<string, unknown>>)
        .slice(0, 8)
        .map((row) => ({
          kelurahan: toString(row.kelurahan),
          sl: toNumber(row.sl),
          pemakaianM3: toNumber(row.pemakaian_m3),
          totalTagihan: toNumber(row.total_tagihan),
        })),
      dataTaaStatus: {
        normal: Math.max(0, taaTotal - taaCount),
        taa: taaCount,
        persenTaa: taaTotal > 0 ? Math.round((taaCount / taaTotal) * 1000) / 10 : 0,
        sebaranTarif: (taaTariffRaw as Array<Record<string, unknown>>).map(
          (row) => ({
            kode: toString(row.kode),
            jumlahTaa: toNumber(row.jumlah_taa),
          }),
        ),
      },
      dataTagihanKomposisi: {
        hargaAir: toNumber(composition.harga_air),
        beaBeban: toNumber(composition.bea_beban),
        beaAdmin: toNumber(composition.bea_admin),
        airKotor: toNumber(composition.air_kotor),
        lainLain: toNumber(composition.lain_lain),
        totalTagihan: toNumber(composition.total_tagihan),
      },
    };
  }

  async getPageData(input: {
    thbl?: string;
    tab?: string;
    page?: string;
    pageSize?: string;
    q?: string;
  }): Promise<DrdPageData> {
    const periodes = await this.getPeriods();
    const requestedPeriod = input.thbl?.trim();
    const periodeAktif =
      requestedPeriod && periodes.includes(requestedPeriod)
        ? requestedPeriod
        : (periodes[0] ?? new Date().toISOString().slice(0, 7).replace("-", ""));
    const tab = isDrdTab(input.tab) ? input.tab : "ringkasan";
    const requestedPageSize = Number.parseInt(input.pageSize ?? "100", 10);
    const ukuranHalaman = [50, 100, 200, 500, 1000].includes(
      requestedPageSize,
    )
      ? requestedPageSize
      : 100;
    const pencarian = (input.q ?? "").trim().slice(0, 120);
    const ringkasan =
      tab === "ringkasan" ? await this.getSummary(periodeAktif) : null;

    if (tab === "ringkasan") {
      return {
        periodeAktif,
        periodes,
        tab,
        ringkasan,
        kolom: [],
        baris: [],
        halaman: 1,
        ukuranHalaman,
        total: 0,
        totalHalaman: 0,
        pencarian,
      };
    }

    const requestedPage = Math.max(
      1,
      Number.parseInt(input.page ?? "1", 10) || 1,
    );
    let rowsResult = await this.getRows({
      thbl: periodeAktif,
      tab,
      q: pencarian,
      page: requestedPage,
      pageSize: ukuranHalaman,
    });
    const totalHalaman = Math.ceil(rowsResult.total / ukuranHalaman);
    const halaman = Math.min(requestedPage, Math.max(1, totalHalaman));
    if (halaman !== requestedPage) {
      rowsResult = await this.getRows({
        thbl: periodeAktif,
        tab,
        q: pencarian,
        page: halaman,
        pageSize: ukuranHalaman,
      });
    }

    return {
      periodeAktif,
      periodes,
      tab,
      ringkasan,
      kolom: rowsResult.kolom ?? TABLE_COLUMNS[tab],
      baris: rowsResult.baris,
      barisFooter: rowsResult.barisFooter,
      halaman,
      ukuranHalaman,
      total: rowsResult.total,
      totalHalaman,
      pencarian,
    };
  }

  private async getRows(input: {
    thbl: string;
    tab: Exclude<DrdTab, "ringkasan">;
    q: string;
    page: number;
    pageSize: number;
  }): Promise<{
    baris: DrdRow[];
    barisFooter?: DrdRow;
    total: number;
    kolom?: DrdColumn[];
  }> {
    const offset = (input.page - 1) * input.pageSize;
    const search = `%${input.q}%`;

    if (input.tab === "kelurahan" || input.tab === "domestik" || input.tab === "tarif" || input.tab === "taa-kelurahan") {
      const data = await this.getGroupedRows(input.thbl, input.tab, input.q);
      const start = offset;
      const barisFooter: DrdRow = {};
      const labelKey = TABLE_COLUMNS[input.tab][0]?.key;
      if (labelKey) barisFooter[labelKey] = "TOTAL";
      barisFooter.jumlahPelanggan = data.reduce(
        (sum, row) => sum + toNumber(row.jumlahPelanggan),
        0,
      );
      barisFooter.pemakaianM3 = data.reduce(
        (sum, row) => sum + toNumber(row.pemakaianM3),
        0,
      );
      barisFooter.totalTagihan = data.reduce(
        (sum, row) => sum + toNumber(row.totalTagihan),
        0,
      );
      return {
        baris: data.slice(start, start + input.pageSize),
        barisFooter,
        total: data.length,
      };
    }

    if (input.tab === "cakupan") {
      const coverageSearch = input.q
        ? sql`AND coalesce(k.nama, 'Tidak diketahui') ILIKE ${search}`
        : sql``;
      const rows = await db.execute(sql`
        SELECT coalesce(k.kode, '') AS kelurahan_kode,
          coalesce(k.nama, 'Tidak diketahui') AS kelurahan,
          regexp_replace(coalesce(p.tarif_kode, 'TANPA_TARIF'), '^GOL_', '') AS tarif,
          count(d.nolg)::int AS sl,
          coalesce(sum(d.pakai_m3), 0)::float AS pemakaian_m3,
          coalesce(sum(d.total_tagihan), 0)::float AS total_tagihan,
          coalesce(
            sum(CASE WHEN d.nolg IS NOT NULL THEN p.jml_penghuni ELSE 0 END),
            0
          )::int AS jiwa_terlayani,
          max(cp.jumlah_penduduk)::int AS jumlah_penduduk
        FROM kelurahan k
        LEFT JOIN pelanggan p ON p.kelurahan_kode = k.kode
        LEFT JOIN rekening_drd d
          ON d.nolg = p.nolg AND d.thbl = ${input.thbl}
        LEFT JOIN drd_cakupan_penduduk cp ON cp.kelurahan_kode = k.kode
        WHERE true ${coverageSearch}
        GROUP BY
          coalesce(k.kode, ''),
          coalesce(k.nama, 'Tidak diketahui'),
          regexp_replace(coalesce(p.tarif_kode, 'TANPA_TARIF'), '^GOL_', '')
        ORDER BY kelurahan, tarif
      `);
      const grouped = new Map<string, DrdRow>();
      for (const rawRow of rows as Array<Record<string, unknown>>) {
        const kelurahanKode = toString(rawRow.kelurahan_kode);
        const kelurahan = toString(rawRow.kelurahan);
        const tarif = toString(rawRow.tarif).trim().toUpperCase();
        const row = grouped.get(kelurahanKode) ?? {
          kelurahanKode,
          kelurahan,
          total_sl: 0,
          total_m3: 0,
          total_drd: 0,
          jumlahPenduduk:
            rawRow.jumlah_penduduk == null
              ? null
              : toNumber(rawRow.jumlah_penduduk),
          jiwaTerlayani: 0,
        };
        const sl = toNumber(rawRow.sl);
        const pemakaianM3 = toNumber(rawRow.pemakaian_m3);
        const totalTagihan = toNumber(rawRow.total_tagihan);
        const jiwaTerlayani = toNumber(rawRow.jiwa_terlayani);

        row.total_sl = toNumber(row.total_sl) + sl;
        row.total_m3 = toNumber(row.total_m3) + pemakaianM3;
        row.total_drd = toNumber(row.total_drd) + totalTagihan;
        if ((COVERAGE_TARIFFS as readonly string[]).includes(tarif)) {
          row[`tarif_${tarif}_sl`] = toNumber(row[`tarif_${tarif}_sl`]) + sl;
          row[`tarif_${tarif}_m3`] =
            toNumber(row[`tarif_${tarif}_m3`]) + pemakaianM3;
          row[`tarif_${tarif}_drd`] =
            toNumber(row[`tarif_${tarif}_drd`]) + totalTagihan;
        }
        if (
          (COVERAGE_TECHNICAL_TARIFFS as readonly string[]).includes(tarif)
        ) {
          row[`teknis_${tarif}`] = jiwaTerlayani;
          row.jiwaTerlayani = toNumber(row.jiwaTerlayani) + jiwaTerlayani;
        }
        grouped.set(kelurahanKode, row);
      }

      const columns: DrdColumn[] = [
        { key: "kelurahan", label: "Kelurahan", format: "text" },
        ...COVERAGE_TARIFFS.map((tarif) => ({
            key: `tarif_${tarif}`,
            label: tarif,
          }))
          .flatMap((group) => [
          {
            key: `${group.key}_sl`,
            label: "SL",
            format: "number" as const,
            group: group.label,
          },
          {
            key: `${group.key}_m3`,
            label: "M3",
            format: "number" as const,
            group: group.label,
          },
          {
            key: `${group.key}_drd`,
            label: "DRD",
            format: "currency" as const,
            group: group.label,
          },
        ]),
        ...[
          {
            key: "total",
            label: "TOTAL",
          },
        ].flatMap((group) => [
          {
            key: `${group.key}_sl`,
            label: "SL",
            format: "number" as const,
            group: group.label,
          },
          {
            key: `${group.key}_m3`,
            label: "M3",
            format: "number" as const,
            group: group.label,
          },
          {
            key: `${group.key}_drd`,
            label: "DRD",
            format: "currency" as const,
            group: group.label,
          },
        ]),
        ...COVERAGE_TECHNICAL_TARIFFS.map((tarif) => ({
          key: `teknis_${tarif}`,
          label: tarif,
          format: "number" as const,
          group: "CAKUPAN PELAYANAN TEKNIS",
        })),
        {
          key: "jiwaTerlayani",
          label: "Total Jiwa Terlayani",
          format: "number",
          group: "CAKUPAN PELAYANAN TEKNIS",
        },
        {
          key: "jumlahPenduduk",
          label: "Jumlah Penduduk",
          format: "number",
          group: "CAKUPAN PELAYANAN TEKNIS",
        },
        {
          key: "persentaseCakupan",
          label: "% Cakupan Pelayanan",
          format: "percent",
          group: "CAKUPAN PELAYANAN TEKNIS",
        },
      ];

      const filtered = Array.from(grouped.values()).map((row) => {
        for (const tarif of COVERAGE_TARIFFS) {
          row[`tarif_${tarif}_sl`] ??= 0;
          row[`tarif_${tarif}_m3`] ??= 0;
          row[`tarif_${tarif}_drd`] ??= 0;
        }
        for (const tarif of COVERAGE_TECHNICAL_TARIFFS) {
          row[`teknis_${tarif}`] ??= 0;
        }
        row.persentaseCakupan =
          typeof row.jumlahPenduduk === "number" && row.jumlahPenduduk > 0
            ? Math.round(
                (toNumber(row.jiwaTerlayani) / row.jumlahPenduduk) * 10000,
              ) / 100
            : null;
        return row;
      });
      const barisFooter: DrdRow = { kelurahan: "TOTAL" };
      for (const column of columns) {
        if (column.key === "kelurahan" || column.key === "jumlahPenduduk") {
          continue;
        }
        barisFooter[column.key] = filtered.reduce(
          (sum, row) => sum + toNumber(row[column.key]),
          0,
        );
      }
      const populationValues = filtered
        .map((row) => row.jumlahPenduduk)
        .filter((value): value is number => typeof value === "number");
      barisFooter.jumlahPenduduk =
        populationValues.length > 0
          ? populationValues.reduce((sum, value) => sum + value, 0)
          : null;
      barisFooter.persentaseCakupan =
        toNumber(barisFooter.jumlahPenduduk) > 0
          ? Math.round(
              (toNumber(barisFooter.jiwaTerlayani) /
                toNumber(barisFooter.jumlahPenduduk)) *
                10000,
            ) / 100
          : null;
      return {
        baris: filtered.slice(offset, offset + input.pageSize),
        total: filtered.length,
        barisFooter,
        kolom: columns,
      };
    }

    const taaOnly = input.tab === "taa";
    const whereTaa = taaOnly ? sql`AND ${TAA_CONDITION}` : sql``;
    const whereSearch = input.q
      ? sql`AND concat_ws(' ', d.nolg, p.nama, p.alamat, t.nama, k.nama, c.ket_catat) ILIKE ${search}`
      : sql``;
    const lateral = sql`
      LEFT JOIN LATERAL (
        SELECT c.*
        FROM cater_baca_meter c
        WHERE c.thbl = d.thbl AND c.nolg = d.nolg
        ORDER BY c.updated_at DESC, c.created_at DESC
        LIMIT 1
      ) c ON true
    `;
    const from = sql`
      FROM rekening_drd d
      LEFT JOIN pelanggan p ON p.nolg = d.nolg
      LEFT JOIN golongan_tarif t ON t.kode = p.tarif_kode
      LEFT JOIN kelurahan k ON k.kode = p.kelurahan_kode
      ${lateral}
      LEFT JOIN master_kondisi_catat t_kondisi ON t_kondisi.kode_tmss = c.tmss
      WHERE d.thbl = ${input.thbl} ${whereTaa} ${whereSearch}
    `;
    const [countRaw, rowsRaw] = await Promise.all([
      db.execute(sql`
        SELECT count(*)::int AS total,
          coalesce(sum(d.pakai_m3), 0)::float AS total_pemakaian_m3,
          coalesce(sum(d.jml_harga_air), 0)::float AS total_harga_air,
          coalesce(sum(d.bea_beban), 0)::float AS total_bea_beban,
          coalesce(sum(d.bea_admin), 0)::float AS total_bea_admin,
          coalesce(sum(d.air_kotor), 0)::float AS total_air_kotor,
          coalesce(sum(d.lain_lain), 0)::float AS total_lain_lain,
          coalesce(sum(d.total_tagihan), 0)::float AS total_tagihan
        ${from}
      `),
      db.execute(sql`
        SELECT d.nolg AS nomor_langganan, p.nama, p.alamat,
          coalesce(p.tarif_kode, 'Tanpa tarif') AS tarif,
          coalesce(t.nama, 'Tanpa tarif') AS nama_tarif,
          coalesce(k.nama, 'Tidak diketahui') AS kelurahan,
          coalesce(c.ket_catat, t_kondisi.nama, 'Tidak diketahui') AS kondisi,
          c.stml::float AS stand_lalu,
          c.stma::float AS stand_akhir,
          coalesce(d.pakai_m3, 0)::float AS pemakaian_m3,
          coalesce(d.jml_harga_air, 0)::float AS harga_air,
          coalesce(d.bea_beban, 0)::float AS bea_beban,
          coalesce(d.bea_admin, 0)::float AS bea_admin,
          coalesce(d.air_kotor, 0)::float AS air_kotor,
          coalesce(d.lain_lain, 0)::float AS lain_lain,
          coalesce(d.total_tagihan, 0)::float AS total_tagihan
        ${from}
        ORDER BY d.nolg ASC
        LIMIT ${input.pageSize} OFFSET ${offset}
      `),
    ]);

    const aggregate = (countRaw[0] ?? {}) as Record<string, unknown>;
    const barisFooter: DrdRow = {};
    const labelKey = TABLE_COLUMNS[input.tab][0]?.key;
    if (labelKey) barisFooter[labelKey] = "TOTAL";
    barisFooter.jumlahPelanggan = toNumber(aggregate.total);
    barisFooter.pemakaianM3 = toNumber(aggregate.total_pemakaian_m3);
    barisFooter.hargaAir = toNumber(aggregate.total_harga_air);
    barisFooter.beaBeban = toNumber(aggregate.total_bea_beban);
    barisFooter.beaAdmin = toNumber(aggregate.total_bea_admin);
    barisFooter.airKotor = toNumber(aggregate.total_air_kotor);
    barisFooter.lainLain = toNumber(aggregate.total_lain_lain);
    barisFooter.totalTagihan = toNumber(aggregate.total_tagihan);
    return {
      total: toNumber(aggregate.total),
      barisFooter,
      baris: (rowsRaw as Array<Record<string, unknown>>).map((row) => {
        const kondisi = toString(row.kondisi);
        const kondisiKey = kondisi.trim().toUpperCase().replace(/[\s-]+/g, "_");
        return {
          nomorLangganan: toString(row.nomor_langganan),
          nama: toString(row.nama),
          alamat: toString(row.alamat),
          tarif: toString(row.tarif),
          namaTarif: toString(row.nama_tarif),
          kelurahan: toString(row.kelurahan),
          kondisi: kondisiKey === "TIDAK_ADA_AIR" ? "Tidak ada air" : kondisi,
          standLalu: row.stand_lalu == null ? null : toNumber(row.stand_lalu),
          standAkhir: row.stand_akhir == null ? null : toNumber(row.stand_akhir),
          pemakaianM3: toNumber(row.pemakaian_m3),
          hargaAir: toNumber(row.harga_air),
          beaBeban: toNumber(row.bea_beban),
          beaAdmin: toNumber(row.bea_admin),
          airKotor: toNumber(row.air_kotor),
          lainLain: toNumber(row.lain_lain),
          totalTagihan: toNumber(row.total_tagihan),
        };
      }),
    };
  }

  private async getGroupedRows(
    thbl: string,
    tab: "kelurahan" | "domestik" | "tarif" | "taa-kelurahan",
    q: string,
  ): Promise<DrdRow[]> {
    const search = `%${q}%`;
    const filterSearch = q
      ? tab === "kelurahan" || tab === "taa-kelurahan"
        ? sql`AND coalesce(k.nama, 'Tidak diketahui') ILIKE ${search}`
        : sql`AND concat_ws(' ', p.tarif_kode, t.nama) ILIKE ${search}`
      : sql``;
    const domesticFilter =
      tab === "domestik"
        ? sql`AND regexp_replace(p.tarif_kode, '^GOL_', '') IN (${sql.join(DOMESTIC_TARIFFS.map((code) => sql`${code}`), sql`, `)})`
        : sql``;
    const taaFilter = tab === "taa-kelurahan" ? sql`AND ${TAA_CONDITION}` : sql``;
    const groupByTariff = tab === "tarif" || tab === "domestik";
    const rows = await db.execute(sql`
      SELECT
        ${groupByTariff
          ? sql`coalesce(p.tarif_kode, 'TANPA_TARIF') AS tarif,
              coalesce(t.nama, 'Tanpa tarif') AS nama_tarif`
          : sql`coalesce(k.nama, 'Tidak diketahui') AS kelurahan`}
        , count(*)::int AS jumlah_pelanggan,
        coalesce(sum(d.pakai_m3), 0)::float AS pemakaian_m3,
        coalesce(sum(d.total_tagihan), 0)::float AS total_tagihan
      FROM rekening_drd d
      LEFT JOIN pelanggan p ON p.nolg = d.nolg
      LEFT JOIN golongan_tarif t ON t.kode = p.tarif_kode
      LEFT JOIN kelurahan k ON k.kode = p.kelurahan_kode
      LEFT JOIN LATERAL (
        SELECT c.ket_catat, c.tmss, c.alasan_taksir
        FROM cater_baca_meter c
        WHERE c.thbl = d.thbl AND c.nolg = d.nolg
        ORDER BY c.updated_at DESC, c.created_at DESC
        LIMIT 1
      ) c ON true
      WHERE d.thbl = ${thbl} ${domesticFilter} ${taaFilter} ${filterSearch}
      GROUP BY ${groupByTariff
        ? sql`coalesce(p.tarif_kode, 'TANPA_TARIF'), coalesce(t.nama, 'Tanpa tarif')`
        : sql`coalesce(k.nama, 'Tidak diketahui')`}
      ORDER BY ${
        tab === "kelurahan"
          ? sql`total_tagihan DESC`
          : tab === "taa-kelurahan"
            ? sql`jumlah_pelanggan DESC`
            : tab === "tarif"
              ? sql`total_tagihan DESC`
              : sql`tarif ASC`
      }
    `);
    return (rows as Array<Record<string, unknown>>).map((row) => ({
      ...(groupByTariff
        ? {
            tarif: toString(row.tarif),
            namaTarif: toString(row.nama_tarif),
          }
        : { kelurahan: toString(row.kelurahan) }),
      jumlahPelanggan: toNumber(row.jumlah_pelanggan),
      pemakaianM3: toNumber(row.pemakaian_m3),
      totalTagihan: toNumber(row.total_tagihan),
    }));
  }
}

export const drdService = new DrdService();
