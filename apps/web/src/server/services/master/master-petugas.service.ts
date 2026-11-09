/**
 * Service: Manajemen Master Petugas & Pemetaan Rute DPM
 * Lapisan: 2. Service Layer (Orkestrasi Drizzle ORM)
 */

import { eq, sql, inArray } from 'drizzle-orm';
import { db, petugasCater, ruteCater, pelanggan, caterBacaMeter } from '@cater/db';

export interface PetugasMasterItem {
  id: string;
  nama: string;
  noHp: string | null;
  aktif: boolean;
  totalRute: number;
  totalPelanggan: number;
  ruteList: string[];
  createdAt: string;
}

export interface RuteMappingItem {
  kode: string;
  seksiKode: string | null;
  seksiNama: string | null;
  pencatatDefault: string | null;
  namaPetugas: string | null;
  totalPelanggan: number;
}

export class MasterPetugasService {
  /**
   * Mengambil daftar seluruh petugas cater beserta rute yang diampu & beban pelanggan
   */
  async getDaftarPetugas(): Promise<PetugasMasterItem[]> {
    const listPetugas = await db.select().from(petugasCater).orderBy(petugasCater.nama);

    // Ambil pemetaan rute per petugas
    const routes = await db.select().from(ruteCater);

    // Hitung pelanggan per rute
    const pelangganPerRute = await db
      .select({
        ruteKode: pelanggan.ruteKode,
        total: sql<number>`count(*)::int`,
      })
      .from(pelanggan)
      .groupBy(pelanggan.ruteKode);

    const pelRuteMap = new Map(pelangganPerRute.map((r) => [r.ruteKode, r.total]));

    return listPetugas.map((p) => {
      const assignedRoutes = routes.filter((r) => r.pencatatDefault === p.id);
      const ruteList = assignedRoutes.map((r) => r.kode);
      const totalPelanggan = ruteList.reduce(
        (acc, ruteKode) => acc + (pelRuteMap.get(ruteKode) ?? 0),
        0
      );

      return {
        id: p.id,
        nama: p.nama,
        noHp: p.noHp,
        aktif: p.aktif,
        totalRute: ruteList.length,
        totalPelanggan,
        ruteList,
        createdAt: new Date(p.createdAt).toISOString(),
      };
    });
  }

  /**
   * Mengambil seluruh 126 rute dan petugas default yang ditugaskan
   */
  async getPemetaanRute(): Promise<{
    rute: RuteMappingItem[];
    petugasOptions: { id: string; nama: string }[];
  }> {
    const [routes, listPetugas, pelangganPerRute] = await Promise.all([
      db.select().from(ruteCater).orderBy(ruteCater.kode),
      db.select({ id: petugasCater.id, nama: petugasCater.nama }).from(petugasCater).where(eq(petugasCater.aktif, true)),
      db
        .select({
          ruteKode: pelanggan.ruteKode,
          total: sql<number>`count(*)::int`,
        })
        .from(pelanggan)
        .groupBy(pelanggan.ruteKode),
    ]);

    const pelMap = new Map(pelangganPerRute.map((p) => [p.ruteKode, p.total]));
    const petMap = new Map(listPetugas.map((p) => [p.id, p.nama]));

    const ruteItems: RuteMappingItem[] = routes.map((r) => ({
      kode: r.kode,
      seksiKode: r.seksiKode,
      seksiNama: r.seksiNama,
      pencatatDefault: r.pencatatDefault,
      namaPetugas: r.pencatatDefault ? petMap.get(r.pencatatDefault) ?? r.pencatatDefault : null,
      totalPelanggan: pelMap.get(r.kode) ?? 0,
    }));

    return {
      rute: ruteItems,
      petugasOptions: listPetugas,
    };
  }

  /**
   * Menambah petugas cater baru
   */
  async tambahPetugas(data: { id: string; nama: string; noHp?: string; aktif?: boolean }) {
    const [created] = await db
      .insert(petugasCater)
      .values({
        id: data.id.trim().toUpperCase(),
        nama: data.nama.trim(),
        noHp: data.noHp?.trim() ?? null,
        aktif: data.aktif ?? true,
      })
      .returning();
    return created;
  }

  /**
   * Update profil petugas cater
   */
  async updatePetugas(id: string, data: { nama?: string; noHp?: string; aktif?: boolean }) {
    const [updated] = await db
      .update(petugasCater)
      .set({
        ...(data.nama && { nama: data.nama.trim() }),
        ...(data.noHp !== undefined && { noHp: data.noHp ? data.noHp.trim() : null }),
        ...(data.aktif !== undefined && { aktif: data.aktif }),
      })
      .where(eq(petugasCater.id, id))
      .returning();
    return updated;
  }

  /**
   * Menugaskan satu rute ke petugas tertentu
   */
  async assignRute(ruteKode: string, petugasId: string | null) {
    const [updated] = await db
      .update(ruteCater)
      .set({ pencatatDefault: petugasId })
      .where(eq(ruteCater.kode, ruteKode))
      .returning();
    return updated;
  }

  /**
   * Menugaskan banyak rute sekaligus ke satu petugas (Batch Re-assignment)
   */
  async batchAssignRute(ruteKodes: string[], petugasId: string | null) {
    if (!ruteKodes.length) return [];
    const updated = await db
      .update(ruteCater)
      .set({ pencatatDefault: petugasId })
      .where(inArray(ruteCater.kode, ruteKodes))
      .returning();
    return updated;
  }
}

export const masterPetugasService = new MasterPetugasService();
