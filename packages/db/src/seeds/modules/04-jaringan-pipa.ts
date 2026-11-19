import fs from 'fs';
import path from 'path';
import { db, conn } from '../../client';
import { sumberAir, pipaJaringan, type MultiLineStringGeometry } from '../../schema';
import { count } from 'drizzle-orm';
import type { SeedModule, SeedOptions } from '../types';

export const MASTER_SUMBER_AIR = [
  {
    id: 'IPA_BADAK_SINGA',
    nama: 'IPA Badak Singa (Pusat)',
    tipe: 'IPA',
    wilayah: 'Pelayanan Wilayah 2 & 5',
    kapasitasLps: 1800,
    status: 'Aktif',
    keterangan: 'Instalasi Pengolahan Air baku utama kota Bandung',
  },
  {
    id: 'IPA_CIKALONG',
    nama: 'IPA Cikalong',
    tipe: 'IPA',
    wilayah: 'Pelayanan Wilayah 4 & 5',
    kapasitasLps: 600,
    status: 'Aktif',
    keterangan: 'Penyuplai distribusi transmisi Bandung Selatan & Timur',
  },
  {
    id: 'IPA_SABILULUNGAN',
    nama: 'IPA Sabilulungan (Soreang)',
    tipe: 'IPA',
    wilayah: 'Pelayanan Wilayah 5',
    kapasitasLps: 200,
    status: 'Aktif',
    keterangan: 'Interkoneksi pasokan air baku gravitasi',
  },
  {
    id: 'BSP01',
    nama: 'Booster Pump BSP 01',
    tipe: 'BOOSTER_PUMP',
    wilayah: 'Pelayanan Wilayah 5',
    kapasitasLps: 150,
    status: 'Aktif',
    keterangan: 'Pompa pendorong jaringan distribusi utama',
  },
  {
    id: 'BSP03',
    nama: 'Booster Pump BSP 03 (Lengkong)',
    tipe: 'BOOSTER_PUMP',
    wilayah: 'Pelayanan Wilayah 5',
    kapasitasLps: 120,
    status: 'Aktif',
    keterangan: 'Pendorong zona Lengkong, Cijagra, Burangrang, Cikawao',
  },
  {
    id: 'BSP05',
    nama: 'Booster Pump BSP 05 (Cigereleng)',
    tipe: 'BOOSTER_PUMP',
    wilayah: 'Pelayanan Wilayah 5',
    kapasitasLps: 100,
    status: 'Aktif',
    keterangan: 'Pendorong elevasi zona Cigereleng & Regol',
  },
  {
    id: 'BSP06',
    nama: 'Booster Pump BSP 06 (Panjunan / Astana Anyar)',
    tipe: 'BOOSTER_PUMP',
    wilayah: 'Pelayanan Wilayah 5',
    kapasitasLps: 110,
    status: 'Aktif',
    keterangan: 'Pendorong zona Pungkur, Balonggede, Ciateul, Panjunan',
  },
  {
    id: 'MA_CISURUPAN',
    nama: 'Mata Air Cisurupan',
    tipe: 'MATA_AIR',
    wilayah: 'Pelayanan Wilayah 5',
    kapasitasLps: 50,
    status: 'Aktif',
    keterangan: 'Mata air alami penambah debit zona gravitasi',
  },
];

export async function seedJaringanPipa(options: SeedOptions) {
  // 1. Seed Master Sumber Air
  for (const item of MASTER_SUMBER_AIR) {
    await db
      .insert(sumberAir)
      .values(item)
      .onConflictDoUpdate({
        target: sumberAir.id,
        set: {
          nama: item.nama,
          tipe: item.tipe,
          wilayah: item.wilayah,
          kapasitasLps: item.kapasitasLps,
          status: item.status,
          keterangan: item.keterangan,
          updatedAt: new Date(),
        },
      });
  }

  // 2. Ensure column fid is bigint in DB
  try {
    await conn.unsafe('ALTER TABLE "pipa_jaringan" ALTER COLUMN "fid" TYPE bigint;');
  } catch (_e) {
    // Ignore if already bigint
  }

  // 3. Seed GIS Pipa Jaringan
  const pipaGeojsonPath = path.resolve(__dirname, '../../../data/pipa jaring.geojson');
  let insertedSegments = 0;

  if (fs.existsSync(pipaGeojsonPath)) {
    const [existing] = await db.select({ total: count() }).from(pipaJaringan);
    const hasExistingPipa = existing && existing.total > 0;

    if (!hasExistingPipa || options.forceEtl) {
      const raw = JSON.parse(fs.readFileSync(pipaGeojsonPath, 'utf8'));
      const features: any[] = raw.features || [];
      const maxSegments = options.pipaLimit || features.length;
      const targetFeatures = features.slice(0, maxSegments);

      const batchSize = 500;
      for (let i = 0; i < targetFeatures.length; i += batchSize) {
        const chunk = targetFeatures.slice(i, i + batchSize);
        const rows = chunk.map((f: any) => {
          const props = f.properties || {};
          const rawFid = props.fid !== undefined && props.fid !== null ? Number(props.fid) : null;
          return {
            id: Number(props.id),
            fid: rawFid && !isNaN(rawFid) ? Math.round(rawFid) : null,
            kodePipa: props['Kode Pipa'] || null,
            jenisPipa: props['Jenis Pipa'] || null,
            material: props['Material Pipa'] || null,
            diameter: props['Diameter Pipa'] ? String(props['Diameter Pipa']) : null,
            diameterDalam: props['Diameter Dalam'] || null,
            kedalaman: props['Kedalaman Pipa'] || null,
            tahunPasang: props['Tahun Pasang'] ? String(props['Tahun Pasang']) : null,
            tahunGanti: props['Tahun Ganti'] ? String(props['Tahun Ganti']) : null,
            lokasi: props['Lokasi'] || null,
            pelaksana: props['Pelaksana'] || null,
            pelayanan: props['Pelayanan'] || 'Pelayanan Wilayah 5',
            jenisJaringan: props['Jenis Jaringan'] || null,
            jenisMaterial: props['Jenis Material'] || null,
            sumberData: props['Sumber Data'] || 'GIS STI',
            posisiPipa: props['Posisi Pipa'] || null,
            fungsi: props['Fungsi'] || null,
            steptest: props['Steptest'] || null,
            jaringanDma: props['Jaringan DMA'] || null,
            dma: props['DMA'] || null,
            sumberAir: props['Sumber Air'] || null,
            petugasUpdate: props['Petugas Update QGIS'] || null,
            panjangMeter: props['Panjang (m)'] ? Number(props['Panjang (m)']) : 0,
            statusPipa: props['Status Pipa'] || 'Aktif',
            keterangan: props['Keterangan'] || null,
            geometry: f.geometry as MultiLineStringGeometry,
          };
        });

        await db.insert(pipaJaringan).values(rows).onConflictDoNothing();
        insertedSegments += rows.length;
      }
    } else {
      insertedSegments = existing.total;
    }
  }

  return {
    count: insertedSegments,
    message: `Seeded ${MASTER_SUMBER_AIR.length} sumber air & ${insertedSegments.toLocaleString()} segmen pipa jaringan GIS.`,
  };
}

export const jaringanPipaModule: SeedModule = {
  id: 'jaringan-pipa',
  name: 'Jaringan Distribusi & Sumber Air',
  description: 'Master Sumber Air (IPA Badak Singa, Cikalong, BSP 01-06) & Pipa Jaringan GIS (12.100 segmen)',
  run: async (options: SeedOptions) => {
    return await seedJaringanPipa(options);
  },
};
