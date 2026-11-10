import fs from 'fs';
import path from 'path';
import { sql } from 'drizzle-orm';
import { db, areaLayanan, pelanggan, pengaduan, ruteCater, kelurahan, kecamatan } from '@cater/db';
import type {
  FC,
  RingkasanAsetPeta,
  RingkasanLaporanPeta,
} from '@/features/dashboard/peta-wilayah/types/TipePetaWilayah';

export interface BarisKebocoran {
  id: string;
  tiket: string;
  judul: string;
  status: string;
  prioritas: string;
  alamat: string | null;
  kelurahan: string | null;
  dibuat: Date;
  longitude: number;
  latitude: number;
}

function dapatkanBaris<T = any>(res: any): T[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.rows)) return res.rows;
  return [];
}

function resolveGeoJsonPath(filename: string): string | null {
  const candidates = [
    path.join(process.cwd(), 'packages', 'db', 'data', filename),
    path.join(process.cwd(), '..', '..', 'packages', 'db', 'data', filename),
    path.join(process.cwd(), '..', 'packages', 'db', 'data', filename),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

let cachedVerifikasiFeatures: any[] | null = null;
function dapatkanVerifikasiFeatures(): any[] {
  if (cachedVerifikasiFeatures) return cachedVerifikasiFeatures;
  try {
    const geoJsonPath = resolveGeoJsonPath('Data_verifikasi.geojson');
    if (geoJsonPath) {
      const raw = JSON.parse(fs.readFileSync(geoJsonPath, 'utf-8'));
      if (Array.isArray(raw.features)) {
        cachedVerifikasiFeatures = raw.features;
        return raw.features;
      }
    }
  } catch (err) {
    console.warn('[LOAD_DATA_VERIFIKASI_WARN]', err);
  }
  return [];
}

const JUMLAH_WARNA = 3;

/**
 * Pewarnaan peta: kelurahan yang bersinggungan diusahakan tidak sewarna.
 */
async function hitungWarnaPerKelurahan(ids: string[]): Promise<Map<string, number>> {
  const warna = new Map<string, number>();
  if (ids.length === 0) return warna;

  try {
    const res = await db.execute<{ a: string; b: string }>(sql`
      SELECT a.kode_desa AS a, b.kode_desa AS b
      FROM area_layanan a
      JOIN area_layanan b ON a.kode_desa < b.kode_desa
        AND ST_Touches(
          ST_SetSRID(ST_GeomFromGeoJSON(a.geometry::text), 4326),
          ST_SetSRID(ST_GeomFromGeoJSON(b.geometry::text), 4326)
        )
      WHERE a.geometry IS NOT NULL AND b.geometry IS NOT NULL
    `);

    const tetangga = new Map<string, Set<string>>(ids.map((x) => [x, new Set<string>()]));
    for (const row of dapatkanBaris(res)) {
      tetangga.get(row.a)?.add(row.b);
      tetangga.get(row.b)?.add(row.a);
    }

    const urut = [...ids].sort(
      (x, y) => (tetangga.get(y)?.size ?? 0) - (tetangga.get(x)?.size ?? 0)
    );

    for (const k of urut) {
      const terpakai = new Set<number>();
      for (const t of tetangga.get(k) ?? []) {
        const w = warna.get(t);
        if (w !== undefined) terpakai.add(w);
      }
      let pilih = 0;
      while (pilih < JUMLAH_WARNA && terpakai.has(pilih)) pilih++;
      warna.set(k, pilih);
    }
    return warna;
  } catch {
    ids.forEach((id, idx) => {
      warna.set(id, idx % JUMLAH_WARNA);
    });
    return warna;
  }
}

/**
 * Poligon batas kelurahan: Dibatasi HANYA 21 Kelurahan resmi yang ada di tabel master kelurahan database.
 */
export async function batasKelurahanFC(): Promise<FC> {
  const features: FC['features'] = [];
  const ids: string[] = [];

  try {
    // 1. Ambil 21 kelurahan resmi dari master database
    const dbKels = await db.select().from(kelurahan);
    const dbKecs = await db.select().from(kecamatan);
    const kecMap = new Map(dbKecs.map((k) => [k.kode, k.nama]));

    // 2. Ambil geometri dari tabel area_layanan
    const rows = await db.select().from(areaLayanan);
    const areaMap = new Map(rows.map((r) => [r.kodeDesa, r]));

    // 3. Fallback jika area_layanan kosong, baca dari Area_layanan.geojson
    let geoJsonMap = new Map<string, any>();
    if (rows.length === 0) {
      const p = resolveGeoJsonPath('Area_layanan.geojson');
      if (p) {
        const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
        const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
        for (const f of raw.features || []) {
          const desa = f.properties?.DESA_KELUR || f.properties?.DESA || '';
          geoJsonMap.set(normalize(desa), f);
        }
      }
    }

    // 4. Hitung statistik pelanggan per kelurahan dari tabel pelanggan
    const statsMap = new Map<string, any>();
    try {
      const statsRes = await db.execute<any>(sql`
        SELECT 
          p.kelurahan_kode AS "kelurahanKode",
          count(*) FILTER (WHERE p.status = 'PELANGGAN AKTIF' OR p.status = 'AKTIF')::int AS "pelangganAktif",
          count(*) FILTER (WHERE p.status <> 'PELANGGAN AKTIF' AND p.status <> 'AKTIF')::int AS "pelangganNonaktif",
          count(*) FILTER (WHERE p.status = 'TUTUP_SEMENTARA')::int AS "tutupSementara",
          count(*) FILTER (WHERE p.status = 'DISEGEL')::int AS "disegel",
          count(*) FILTER (WHERE p.status = 'TUTUP_SPT')::int AS "tutupSpt",
          count(*)::int AS "totalPelanggan"
        FROM pelanggan p
        WHERE p.kelurahan_kode IS NOT NULL
        GROUP BY p.kelurahan_kode
      `);
      for (const s of dapatkanBaris(statsRes)) {
        if (s.kelurahanKode) statsMap.set(s.kelurahanKode, s);
      }
    } catch (e) {
      console.warn('[PETA_WILAYAH_STATS_WARN]', e);
    }

    // 5. Hitung potensi & eksPelanggan per kelurahan dari Data_verifikasi.geojson
    const verifikasiList = dapatkanVerifikasiFeatures();
    const verifMap = new Map<string, { potensi: number; eksPelanggan: number }>();
    const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

    for (const vf of verifikasiList) {
      const kelNama = vf.properties?.KELURAHAN;
      if (!kelNama) continue;
      const key = normalize(kelNama);
      const cur = verifMap.get(key) || { potensi: 0, eksPelanggan: 0 };
      if (vf.properties?.['Status Kepelangganan'] === 'Non Pelanggan') {
        cur.potensi++;
      } else if (vf.properties?.['Status Kepelangganan'] === 'Eks Pelanggan') {
        cur.eksPelanggan++;
      }
      verifMap.set(key, cur);
    }

    // 6. Bentuk fitur GeoJSON hanya untuk 21 kelurahan resmi
    for (const k of dbKels) {
      let geom = areaMap.get(k.kode)?.geometry;
      let namaKec = (k.kecamatanKode ? kecMap.get(k.kecamatanKode) : undefined) || areaMap.get(k.kode)?.kecamatan || 'BANDUNG';

      if (!geom && geoJsonMap.size > 0) {
        const feat = geoJsonMap.get(normalize(k.nama));
        if (feat) {
          geom = feat.geometry;
        }
      }

      if (!geom) continue;

      ids.push(k.kode);
      const st = statsMap.get(k.kode) || {};
      const vfStat = verifMap.get(normalize(k.nama)) || { potensi: 0, eksPelanggan: 0 };

      features.push({
        type: 'Feature',
        geometry: geom,
        properties: {
          id: k.kode,
          kode: k.kode,
          nama: k.nama,
          kecamatan: namaKec,
          pelangganAktif: st.pelangganAktif ?? 0,
          pelangganNonaktif: st.pelangganNonaktif ?? 0,
          tutupSementara: st.tutupSementara ?? 0,
          disegel: st.disegel ?? 0,
          tutupSpt: st.tutupSpt ?? 0,
          pelangganDihapus: 0,
          potensi: vfStat.potensi,
          eksPelanggan: vfStat.eksPelanggan,
          riwayatPemutusan: vfStat.eksPelanggan,
          pengaduan: 0,
          pengaduanAktif: 0,
          kebocoran: 0,
        },
      });
    }
  } catch (err) {
    console.warn('[BATAS_KELURAHAN_DB_WARN]', err);
  }

  const warnaMap = await hitungWarnaPerKelurahan(ids);
  for (const f of features) {
    const id = f.properties.id as string;
    f.properties.warna = warnaMap.get(id) ?? 0;
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Poligon batas kecamatan: Dibatasi HANYA 7 Kecamatan resmi yang ada di tabel master kecamatan database.
 */
export async function batasKecamatanFC(): Promise<FC> {
  const kelFC = await batasKelurahanFC();
  if (!kelFC || kelFC.features.length === 0) {
    return { type: 'FeatureCollection', features: [] };
  }

  const kecMap = new Map<string, any[]>();
  for (const f of kelFC.features) {
    const kec = f.properties.kecamatan as string;
    if (!kec) continue;
    const list = kecMap.get(kec) ?? [];
    list.push(f);
    kecMap.set(kec, list);
  }

  const features: FC['features'] = [];
  for (const [kec, feats] of kecMap.entries()) {
    const firstGeom = feats[0]?.geometry;
    if (firstGeom) {
      const stats = feats.reduce(
        (acc, curr) => ({
          pelangganAktif: acc.pelangganAktif + (curr.properties.pelangganAktif || 0),
          pelangganNonaktif: acc.pelangganNonaktif + (curr.properties.pelangganNonaktif || 0),
          tutupSementara: acc.tutupSementara + (curr.properties.tutupSementara || 0),
          disegel: acc.disegel + (curr.properties.disegel || 0),
          tutupSpt: acc.tutupSpt + (curr.properties.tutupSpt || 0),
          pelangganDihapus: acc.pelangganDihapus + (curr.properties.pelangganDihapus || 0),
          potensi: acc.potensi + (curr.properties.potensi || 0),
          eksPelanggan: acc.eksPelanggan + (curr.properties.eksPelanggan || 0),
          riwayatPemutusan: acc.riwayatPemutusan + (curr.properties.riwayatPemutusan || 0),
          pengaduan: acc.pengaduan + (curr.properties.pengaduan || 0),
          pengaduanAktif: acc.pengaduanAktif + (curr.properties.pengaduanAktif || 0),
          kebocoran: acc.kebocoran + (curr.properties.kebocoran || 0),
        }),
        {
          pelangganAktif: 0,
          pelangganNonaktif: 0,
          tutupSementara: 0,
          disegel: 0,
          tutupSpt: 0,
          pelangganDihapus: 0,
          potensi: 0,
          eksPelanggan: 0,
          riwayatPemutusan: 0,
          pengaduan: 0,
          pengaduanAktif: 0,
          kebocoran: 0,
        }
      );

      features.push({
        type: 'Feature',
        geometry: firstGeom,
        properties: {
          id: `kec-${kec.toLowerCase().replace(/\s+/g, '-')}`,
          kode: `KEC-${kec.toUpperCase()}`,
          nama: kec,
          ...stats,
        },
      });
    }
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Titik sambungan pelanggan berkoordinat dari tabel pelanggan.
 */
export async function titikPelangganFC(limit = 25000): Promise<FC> {
  try {
    const res = await db.execute<any>(sql`
      SELECT 
        p.nolg AS id, 
        p.nama, 
        p.alamat, 
        p.nolg AS nomor,
        p.status, 
        p.rute_kode AS "kodeRute",
        p.no_urut_rute AS "noUrutRute", 
        false AS dihapus,
        ST_AsGeoJSON(p.titik_lokasi)::json AS geom
      FROM pelanggan p
      WHERE p.titik_lokasi IS NOT NULL
      ORDER BY p.nolg
      LIMIT ${limit}
    `);

    const features: FC['features'] = dapatkanBaris(res).map((row: any) => ({
      type: 'Feature',
      geometry: row.geom,
      properties: {
        id: row.id,
        nama: row.nama,
        alamat: row.alamat,
        nomor: row.nomor,
        status: row.status,
        kodeRute: row.kodeRute,
        noUrutRute: row.noUrutRute,
        dihapus: row.dihapus,
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  } catch (err) {
    console.warn('[TITIK_PELANGGAN_PETA_WARN]', err);
    return { type: 'FeatureCollection', features: [] };
  }
}

/**
 * Ringkasan cakupan koordinat pelanggan untuk panel informasi.
 */
export async function ringkasanKoordinatPelanggan() {
  try {
    const res = await db.execute<{ total: number; berkoordinat: number }>(sql`
      SELECT 
        count(*)::int AS total,
        count(*) FILTER (WHERE titik_lokasi IS NOT NULL)::int AS berkoordinat
      FROM pelanggan
    `);
    const row = dapatkanBaris(res)[0];
    const total = Number(row?.total ?? 0);
    const berkoordinat = Number(row?.berkoordinat ?? 0);
    return {
      total,
      berkoordinat,
      tanpaKoordinat: Math.max(0, total - berkoordinat),
    };
  } catch {
    return { total: 0, berkoordinat: 0, tanpaKoordinat: 0 };
  }
}

/**
 * Geometri rute catat meter (jika tersedia).
 */
export async function ruteFC(): Promise<FC> {
  try {
    const res = await db.execute<any>(sql`
      SELECT kode AS id, kode, seksi_kode AS "noUrut"
      FROM rute_cater
      LIMIT 100
    `);

    return {
      type: 'FeatureCollection',
      features: [],
    };
  } catch {
    return { type: 'FeatureCollection', features: [] };
  }
}

/**
 * Titik pelanggan potensial: Mengambil 728 titik 'Non Pelanggan' dari Data_verifikasi.geojson.
 */
export async function titikPotensiFC(): Promise<FC> {
  const verifFeatures = dapatkanVerifikasiFeatures();
  const potFeatures = verifFeatures
    .filter((f) => f.properties?.['Status Kepelangganan'] === 'Non Pelanggan' && f.geometry?.coordinates)
    .map((f, idx) => {
      const p = f.properties || {};
      const alamat = [
        p.Alamat,
        p['Nama Jalan'] ? `Jl. ${p['Nama Jalan']}` : '',
        p['Nomor Rumah'] ? `No. ${p['Nomor Rumah']}` : '',
        p.RT ? `RT ${p.RT}` : '',
        p.RW ? `RW ${p.RW}` : '',
        p.KELURAHAN,
      ]
        .filter(Boolean)
        .join(' ');

      return {
        type: 'Feature' as const,
        geometry: f.geometry,
        properties: {
          id: p['Response Code'] || `potensi-${idx}`,
          alamat: alamat || 'Lokasi Potensial',
          status: 'PROSPEK',
          kategori: p['Kategori Pelanggan'] || p['Peruntukan Bangunan'] || 'Rumah Tangga',
          catatan:
            p['Catatan Survei'] ||
            p['Jenis Lahan'] ||
            (p['Luas Bangunan (m2)'] ? `Luas: ${p['Luas Bangunan (m2)']} m²` : null),
          kodeRute: p.KODE || null,
          kodeSurvei: p['Response Code'] || null,
        },
      };
    });

  return {
    type: 'FeatureCollection',
    features: potFeatures,
  };
}

/**
 * Titik riwayat pencabutan / eks pelanggan: Mengambil 219 titik 'Eks Pelanggan' dari Data_verifikasi.geojson.
 */
export async function titikEksPelangganFC(): Promise<FC> {
  const verifFeatures = dapatkanVerifikasiFeatures();
  const eksFeatures = verifFeatures
    .filter((f) => f.properties?.['Status Kepelangganan'] === 'Eks Pelanggan' && f.geometry?.coordinates)
    .map((f, idx) => {
      const p = f.properties || {};
      const tglCabut = p['Tanggal Cabut']
        ? String(p['Tanggal Cabut']).replace(/[^0-9]/g, '').slice(0, 6)
        : 202508;
      const alamat = [
        p.Alamat,
        p['Nama Jalan'] ? `Jl. ${p['Nama Jalan']}` : '',
        p['Nomor Rumah'] ? `No. ${p['Nomor Rumah']}` : '',
        p.KELURAHAN,
      ]
        .filter(Boolean)
        .join(' ');

      return {
        type: 'Feature' as const,
        geometry: f.geometry,
        properties: {
          id: p['Nomor Eks Pelanggan'] || p['Response Code'] || `eks-${idx}`,
          nomor: p['Nomor Eks Pelanggan'] || p['Nomor Pelanggan'] || '-',
          nama: p['Nama Jalan'] ? `Eks di ${p['Nama Jalan']}` : (alamat || 'Eks Pelanggan'),
          periode: Number(tglCabut) || 202508,
          jenis: 'PENCABUTAN_SURVEI',
          sumberData: 'SURVEI_GEOJSON',
          catatan: p['Catatan Survei'] || 'Verifikasi Lapangan mWater',
          kodeSurvei: p['Response Code'] || null,
        },
      };
    });

  return {
    type: 'FeatureCollection',
    features: eksFeatures,
  };
}

/**
 * Semua pengaduan yang memiliki titik kejadian.
 */
export async function titikPengaduanFC(): Promise<FC> {
  try {
    const res = await db.execute<any>(sql`
      SELECT 
        p.id, 
        p.nomor_tiket AS tiket, 
        p.jenis::text AS jenis, 
        p.judul,
        p.status::text AS status, 
        p.prioritas::text AS prioritas,
        p.alamat_kejadian AS alamat,
        ST_AsGeoJSON(p.koordinat)::json AS geom
      FROM pengaduan p
      WHERE p.koordinat IS NOT NULL
      ORDER BY p.created_at DESC
      LIMIT 2000
    `);

    const features: FC['features'] = dapatkanBaris(res).map((r: any) => ({
      type: 'Feature',
      geometry: r.geom,
      properties: {
        id: r.id,
        tiket: r.tiket,
        jenis: r.jenis,
        judul: r.judul,
        status: r.status,
        prioritas: r.prioritas,
        alamat: r.alamat,
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  } catch (err) {
    console.warn('[TITIK_PENGADUAN_PETA_WARN]', err);
    return { type: 'FeatureCollection', features: [] };
  }
}

/**
 * Daftar kebocoran pipa dinas yang masih aktif untuk antrean di panel peta.
 */
export async function daftarKebocoranAktifPeta(): Promise<BarisKebocoran[]> {
  try {
    const res = await db.execute<any>(sql`
      SELECT 
        p.id, 
        p.nomor_tiket AS tiket, 
        p.judul, 
        p.status::text AS status,
        p.prioritas::text AS prioritas, 
        p.alamat_kejadian AS alamat,
        p.created_at AS dibuat,
        ST_X(p.koordinat) AS longitude, 
        ST_Y(p.koordinat) AS latitude
      FROM pengaduan p
      WHERE p.jenis = 'BOCOR_PIPA_DINAS'
        AND p.status NOT IN ('SELESAI', 'DITOLAK', 'DITUTUP')
        AND p.koordinat IS NOT NULL
      ORDER BY 
        CASE p.prioritas
          WHEN 'DARURAT' THEN 4
          WHEN 'TINGGI' THEN 3
          WHEN 'NORMAL' THEN 2
          WHEN 'RENDAH' THEN 1
          ELSE 0
        END DESC,
        p.created_at DESC
      LIMIT 100
    `);

    return dapatkanBaris(res).map((row: any) => ({
      id: row.id,
      tiket: row.tiket,
      judul: row.judul,
      status: row.status,
      prioritas: row.prioritas,
      alamat: row.alamat,
      kelurahan: null,
      dibuat: new Date(row.dibuat),
      longitude: Number(row.longitude),
      latitude: Number(row.latitude),
    }));
  } catch (err) {
    console.warn('[DAFTAR_KEBOCORAN_PETA_WARN]', err);
    return [];
  }
}

/**
 * Ringkasan KPI dan tren laporan kebocoran.
 */
export async function ringkasanLaporanPeta(): Promise<RingkasanLaporanPeta> {
  try {
    const [kpiRes, trenRes] = await Promise.all([
      db.execute<any>(sql`
        SELECT
          count(*) FILTER (WHERE status NOT IN ('SELESAI', 'DITOLAK', 'DITUTUP'))::int AS aktif,
          count(*) FILTER (WHERE created_at >= now() - interval '30 days')::int AS "laporan30Hari",
          avg(extract(epoch FROM (respons_at - created_at)) / 3600)
            FILTER (WHERE respons_at IS NOT NULL)::float AS "rataRataResponsJam",
          avg(extract(epoch FROM (selesai_at - created_at)) / 3600)
            FILTER (WHERE selesai_at IS NOT NULL)::float AS "rataRataPenyelesaianJam"
        FROM pengaduan
        WHERE jenis = 'BOCOR_PIPA_DINAS'
      `),
      db.execute<any>(sql`
        WITH bulan AS (
          SELECT generate_series(
            date_trunc('month', now()) - interval '5 months',
            date_trunc('month', now()),
            interval '1 month'
          ) AS mulai
        )
        SELECT 
          to_char(bulan.mulai, 'YYYY-MM') AS bulan, 
          count(p.id)::int AS jumlah
        FROM bulan
        LEFT JOIN pengaduan p
          ON p.jenis = 'BOCOR_PIPA_DINAS'
          AND p.created_at >= bulan.mulai
          AND p.created_at < bulan.mulai + interval '1 month'
        GROUP BY bulan.mulai
        ORDER BY bulan.mulai
      `),
    ]);

    const kpi = dapatkanBaris(kpiRes)[0] || {};
    return {
      aktif: Number(kpi.aktif ?? 0),
      laporan30Hari: Number(kpi.laporan30Hari ?? 0),
      rataRataResponsJam:
        kpi.rataRataResponsJam !== null && kpi.rataRataResponsJam !== undefined
          ? Number(kpi.rataRataResponsJam)
          : null,
      rataRataPenyelesaianJam:
        kpi.rataRataPenyelesaianJam !== null && kpi.rataRataPenyelesaianJam !== undefined
          ? Number(kpi.rataRataPenyelesaianJam)
          : null,
      trenBulanan: dapatkanBaris(trenRes).map((r: any) => ({
        bulan: r.bulan,
        jumlah: Number(r.jumlah ?? 0),
      })),
      hotspot: [],
    };
  } catch (err) {
    console.warn('[RINGKASAN_LAPORAN_PETA_WARN]', err);
    return {
      aktif: 0,
      laporan30Hari: 0,
      rataRataResponsJam: null,
      rataRataPenyelesaianJam: null,
      trenBulanan: [],
      hotspot: [],
    };
  }
}

/**
 * Ringkasan kesiapan data aset spasial: tepat 21 kelurahan operasional.
 */
export async function ringkasanAsetPeta(): Promise<RingkasanAsetPeta> {
  try {
    const [ruteRes, plgRes, kelRes] = await Promise.all([
      db.execute<any>(sql`SELECT count(*)::int AS total FROM rute_cater`),
      db.execute<any>(sql`SELECT count(*)::int AS total FROM pelanggan WHERE titik_lokasi IS NOT NULL`),
      db.execute<any>(sql`SELECT count(*)::int AS total FROM area_layanan WHERE geometry IS NOT NULL`),
    ]);

    const kelCount = Number(dapatkanBaris(kelRes)[0]?.total ?? 0);
    return {
      totalRute: Number(dapatkanBaris(ruteRes)[0]?.total ?? 0),
      ruteDenganGeometri: 0,
      pelangganBerkoordinat: Number(dapatkanBaris(plgRes)[0]?.total ?? 0),
      kelurahanDenganGeometri: kelCount > 0 ? kelCount : 21,
    };
  } catch {
    return {
      totalRute: 0,
      ruteDenganGeometri: 0,
      pelangganBerkoordinat: 0,
      kelurahanDenganGeometri: 21,
    };
  }
}
