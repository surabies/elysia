import { eq, desc, asc } from 'drizzle-orm';
import { db, broadcast, type NewBroadcastModel, type BroadcastModel } from '@cater/db';
import { DAFTAR_BROADCAST_AWAL } from '@/data/broadcast';
import type { BroadcastGangguanItem } from '@/types/broadcast';

function mapDbToItem(row: BroadcastModel): BroadcastGangguanItem {
  return {
    id: row.id,
    judul: row.judul,
    ringkasan: row.ringkasan,
    kategori: row.kategori as any,
    status: row.status as any,
    progresPersen: row.progresPersen,
    prioritas: row.prioritas as any,
    waktuMulai: row.waktuMulai,
    estimasiSelesai: row.estimasiSelesai,
    penyebab: row.penyebab,
    dampak: row.dampak,
    tindakanPenanganan: row.tindakanPenanganan,
    wilayahTerdampak: (row.wilayahTerdampak as any) || [],
    kontakBantuan: (row.kontakBantuan as any) || undefined,
    gambarUtama: row.gambarUtama || undefined,
    gambarUtamaPublicId: row.gambarUtamaPublicId || undefined,
    tipeGambarUtama: (row.tipeGambarUtama as any) || undefined,
    galeriMedia: (row.galeriMedia as any) || [],
    promoDetails: (row.promoDetails as any) || undefined,
    aktif: row.aktif,
    tampilkanDiTicker: row.tampilkanDiTicker,
    tampilkanDiSpotlight: row.tampilkanDiSpotlight,
    urutan: row.urutan,
    diperbaruiPada: row.diperbaruiPada || 'Baru saja',
  };
}

class BroadcastService {
  private isSeeded = false;

  private async ensureInitialSeed() {
    if (this.isSeeded) return;
    try {
      const existing = await db.select({ id: broadcast.id }).from(broadcast).limit(1);
      if (existing.length === 0) {
        // Auto-seed initial items
        for (let i = 0; i < DAFTAR_BROADCAST_AWAL.length; i++) {
          const item = DAFTAR_BROADCAST_AWAL[i];
          await db.insert(broadcast).values({
            id: item.id,
            judul: item.judul,
            ringkasan: item.ringkasan,
            kategori: item.kategori,
            status: item.status,
            progresPersen: item.progresPersen,
            prioritas: item.prioritas,
            waktuMulai: item.waktuMulai,
            estimasiSelesai: item.estimasiSelesai,
            penyebab: item.penyebab,
            dampak: item.dampak,
            tindakanPenanganan: item.tindakanPenanganan,
            wilayahTerdampak: item.wilayahTerdampak,
            kontakBantuan: item.kontakBantuan,
            gambarUtama: item.gambarUtama,
            tipeGambarUtama: item.tipeGambarUtama,
            galeriMedia: item.galeriMedia || [],
            promoDetails: item.promoDetails,
            aktif: item.aktif,
            tampilkanDiTicker: true,
            tampilkanDiSpotlight: true,
            urutan: i,
            diperbaruiPada: item.diperbaruiPada,
          }).onConflictDoNothing();
        }
      }
      this.isSeeded = true;
    } catch (err) {
      console.warn('[BROADCAST_SERVICE_ENSURE_SEED_WARN]', err);
    }
  }

  async getPublicBroadcasts(): Promise<BroadcastGangguanItem[]> {
    try {
      await this.ensureInitialSeed();
      const rows = await db
        .select()
        .from(broadcast)
        .where(eq(broadcast.aktif, true))
        .orderBy(asc(broadcast.urutan), desc(broadcast.updatedAt));

      if (rows.length > 0) {
        return rows.map(mapDbToItem);
      }
    } catch (err) {
      console.error('[BROADCAST_GET_PUBLIC_ERR]', err);
    }
    // Fallback if db error / connection issue
    return DAFTAR_BROADCAST_AWAL.filter((b) => b.aktif);
  }

  async getAllBroadcasts(): Promise<BroadcastGangguanItem[]> {
    try {
      await this.ensureInitialSeed();
      const rows = await db
        .select()
        .from(broadcast)
        .orderBy(asc(broadcast.urutan), desc(broadcast.updatedAt));

      if (rows.length > 0) {
        return rows.map(mapDbToItem);
      }
    } catch (err) {
      console.error('[BROADCAST_GET_ALL_ERR]', err);
    }
    // Fallback if db error
    return DAFTAR_BROADCAST_AWAL;
  }

  async getBroadcastById(id: string): Promise<BroadcastGangguanItem | null> {
    try {
      await this.ensureInitialSeed();
      const [row] = await db
        .select()
        .from(broadcast)
        .where(eq(broadcast.id, id))
        .limit(1);

      if (row) {
        return mapDbToItem(row);
      }
    } catch (err) {
      console.error('[BROADCAST_GET_BY_ID_ERR]', err);
    }
    const found = DAFTAR_BROADCAST_AWAL.find((b) => b.id === id);
    return found || null;
  }

  async createBroadcast(input: Partial<BroadcastGangguanItem>): Promise<BroadcastGangguanItem> {
    const id = input.id || `bc-${Date.now().toString().slice(-6)}`;
    const values: NewBroadcastModel = {
      id,
      judul: input.judul || 'Siaran Baru',
      ringkasan: input.ringkasan || '',
      kategori: input.kategori || 'DARURAT',
      status: input.status || 'DALAM_PENGERJAAN',
      progresPersen: input.progresPersen ?? 50,
      prioritas: input.prioritas || 'NORMAL',
      waktuMulai: input.waktuMulai || 'Hari ini',
      estimasiSelesai: input.estimasiSelesai || 'Hari ini',
      penyebab: input.penyebab || '',
      dampak: input.dampak || '',
      tindakanPenanganan: input.tindakanPenanganan || '',
      wilayahTerdampak: input.wilayahTerdampak || [],
      kontakBantuan: input.kontakBantuan,
      gambarUtama: input.gambarUtama,
      gambarUtamaPublicId: input.gambarUtamaPublicId,
      tipeGambarUtama: input.tipeGambarUtama || 'FOTO_KEGIATAN',
      galeriMedia: input.galeriMedia || [],
      promoDetails: input.promoDetails,
      aktif: input.aktif !== undefined ? input.aktif : true,
      tampilkanDiTicker: input.tampilkanDiTicker !== undefined ? input.tampilkanDiTicker : true,
      tampilkanDiSpotlight: input.tampilkanDiSpotlight !== undefined ? input.tampilkanDiSpotlight : true,
      urutan: input.urutan ?? 0,
      diperbaruiPada: 'Baru saja',
      updatedAt: new Date(),
    };

    try {
      await db.insert(broadcast).values(values);
      const inserted = await this.getBroadcastById(id);
      if (inserted) return inserted;
    } catch (err) {
      console.error('[BROADCAST_CREATE_DB_ERR]', err);
    }

    return {
      ...(values as any),
      id,
    };
  }

  async updateBroadcast(id: string, input: Partial<BroadcastGangguanItem>): Promise<BroadcastGangguanItem> {
    const updatePayload: Partial<NewBroadcastModel> = {
      updatedAt: new Date(),
      diperbaruiPada: 'Baru saja',
    };

    if (input.judul !== undefined) updatePayload.judul = input.judul;
    if (input.ringkasan !== undefined) updatePayload.ringkasan = input.ringkasan;
    if (input.kategori !== undefined) updatePayload.kategori = input.kategori;
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.progresPersen !== undefined) updatePayload.progresPersen = input.progresPersen;
    if (input.prioritas !== undefined) updatePayload.prioritas = input.prioritas;
    if (input.waktuMulai !== undefined) updatePayload.waktuMulai = input.waktuMulai;
    if (input.estimasiSelesai !== undefined) updatePayload.estimasiSelesai = input.estimasiSelesai;
    if (input.penyebab !== undefined) updatePayload.penyebab = input.penyebab;
    if (input.dampak !== undefined) updatePayload.dampak = input.dampak;
    if (input.tindakanPenanganan !== undefined) updatePayload.tindakanPenanganan = input.tindakanPenanganan;
    if (input.wilayahTerdampak !== undefined) updatePayload.wilayahTerdampak = input.wilayahTerdampak;
    if (input.kontakBantuan !== undefined) updatePayload.kontakBantuan = input.kontakBantuan;
    if (input.gambarUtama !== undefined) updatePayload.gambarUtama = input.gambarUtama;
    if (input.gambarUtamaPublicId !== undefined) updatePayload.gambarUtamaPublicId = input.gambarUtamaPublicId;
    if (input.tipeGambarUtama !== undefined) updatePayload.tipeGambarUtama = input.tipeGambarUtama;
    if (input.galeriMedia !== undefined) updatePayload.galeriMedia = input.galeriMedia;
    if (input.promoDetails !== undefined) updatePayload.promoDetails = input.promoDetails;
    if (input.aktif !== undefined) updatePayload.aktif = input.aktif;
    if (input.tampilkanDiTicker !== undefined) updatePayload.tampilkanDiTicker = input.tampilkanDiTicker;
    if (input.tampilkanDiSpotlight !== undefined) updatePayload.tampilkanDiSpotlight = input.tampilkanDiSpotlight;
    if (input.urutan !== undefined) updatePayload.urutan = input.urutan;

    try {
      await db.update(broadcast).set(updatePayload).where(eq(broadcast.id, id));
    } catch (err) {
      console.error('[BROADCAST_UPDATE_DB_ERR]', err);
    }

    const updated = await this.getBroadcastById(id);
    if (!updated) {
      throw new Error(`Broadcast dengan ID ${id} tidak ditemukan.`);
    }
    return updated;
  }

  async toggleAktif(id: string): Promise<BroadcastGangguanItem> {
    const item = await this.getBroadcastById(id);
    if (!item) {
      throw new Error(`Broadcast dengan ID ${id} tidak ditemukan.`);
    }
    return this.updateBroadcast(id, { aktif: !item.aktif });
  }

  async deleteBroadcast(id: string): Promise<boolean> {
    try {
      await db.delete(broadcast).where(eq(broadcast.id, id));
      return true;
    } catch (err) {
      console.error('[BROADCAST_DELETE_DB_ERR]', err);
      return false;
    }
  }
}

export const broadcastService = new BroadcastService();
