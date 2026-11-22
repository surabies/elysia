import { describe, expect, it, afterAll } from 'bun:test';
import { db, pengaduan, riwayatPengaduan, pengaduanNomorUrut } from '@cater/db';
import { inArray, eq } from 'drizzle-orm';
import { pengaduanService } from '../apps/web/src/server/services/pengaduan/pengaduan.service';

describe('Fase 2: Integritas Data & Transaksi Tiket (B3, B4, B5, B14, B15)', () => {
  const createdTicketIds: string[] = [];

  afterAll(async () => {
    if (createdTicketIds.length > 0) {
      await db.delete(riwayatPengaduan).where(inArray(riwayatPengaduan.pengaduanId, createdTicketIds));
      await db.delete(pengaduan).where(inArray(pengaduan.id, createdTicketIds));
    }
  });

  it('1. B4: 20 pembuatan tiket paralel menghasilkan nomor unik dan berurutan', async () => {
    const totalParalel = 20;
    const promises = Array.from({ length: totalParalel }).map((_, idx) =>
      pengaduanService.createPengaduan({
        jenis: 'BOCOR_PIPA_DINAS',
        pelapor: `Warga Paralel ${idx + 1}`,
        deskripsi: `Tes konkurensi tiket pipa bocor ke-${idx + 1}`,
        koordinat: { x: 107.61, y: -6.91 },
      })
    );

    const hasil = await Promise.all(promises);
    expect(hasil).toHaveLength(totalParalel);

    const nomorTiketList = hasil.map((h) => {
      createdTicketIds.push(h.id);
      return h.nomorTiket;
    });

    // 1. Semua nomor tiket unik
    const uniqueSet = new Set(nomorTiketList);
    expect(uniqueSet.size).toBe(totalParalel);

    // 2. Format 14 karakter
    for (const no of nomorTiketList) {
      expect(no).toHaveLength(14);
      expect(no.startsWith('BP')).toBe(true);
    }

    // 3. Urutannya berurutan
    const urutList = nomorTiketList
      .map((no) => parseInt(no.slice(-4), 10))
      .sort((a, b) => a - b);

    for (let i = 1; i < urutList.length; i++) {
      expect(urutList[i]).toBe(urutList[i - 1] + 1);
    }
  });

  it('2. B5: Nomor langganan fiktif tidak memicu error FK dan tiket tetap tercatat', async () => {
    const fiktifNolg = '99988877766';
    const tiket = await pengaduanService.createPengaduan({
      jenis: 'TIDAK_ADA_AIR',
      pelapor: 'Pelanggan Baru Belum Terdaftar',
      nomorLangganan: fiktifNolg,
      deskripsi: 'Air mati sejak pagi hari di perumahan baru.',
    });

    createdTicketIds.push(tiket.id);
    expect(tiket.id).toBeDefined();
    expect(tiket.nomorLangganan).toBe(fiktifNolg);
    expect(tiket.pelangganId).toBeNull();
  });

  it('3. Idempotensi clientRequestId: dua request paralel menghasilkan tiket yang sama', async () => {
    const reqId = `client-req-${crypto.randomUUID()}`;

    const [t1, t2] = await Promise.all([
      pengaduanService.createPengaduan({
        clientRequestId: reqId,
        jenis: 'AIR_KERUH_BAU_BERWARNA',
        pelapor: 'Pelapor Idempoten',
        deskripsi: 'Air berbau kaporit sangat menyengat.',
      }),
      pengaduanService.createPengaduan({
        clientRequestId: reqId,
        jenis: 'AIR_KERUH_BAU_BERWARNA',
        pelapor: 'Pelapor Idempoten',
        deskripsi: 'Air berbau kaporit sangat menyengat.',
      }),
    ]);

    createdTicketIds.push(t1.id);
    expect(t1.id).toBe(t2.id);
    expect(t1.nomorTiket).toBe(t2.nomorTiket);
  });

  it('4. B15: Foto base64 data:image tidak pernah disimpan mentah ke kolom DB', async () => {
    const base64Dummy =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const tiket = await pengaduanService.createPengaduan({
      jenis: 'GANTI_STOP_KRAN',
      pelapor: 'Pelapor Foto Base64',
      deskripsi: 'Stop kran patah di pipa meteran.',
      fotoUrl: base64Dummy,
    });

    createdTicketIds.push(tiket.id);

    // Cek kolom DB
    const [row] = await db
      .select({ fotoUrl: pengaduan.fotoUrl })
      .from(pengaduan)
      .where(eq(pengaduan.id, tiket.id));

    if (row.fotoUrl) {
      expect(row.fotoUrl.startsWith('http')).toBe(true);
      expect(row.fotoUrl.startsWith('data:image/')).toBe(false);
    } else {
      expect(row.fotoUrl).toBeNull();
    }
  });

  it('5. B3: listPetugasPengaduan hanya mengembalikan user yang memiliki role yang layak', async () => {
    const petugas = await pengaduanService.listPetugasPengaduan();
    expect(Array.isArray(petugas)).toBe(true);

    const rolesLayak = [
      'PELAKSANA',
      'PENCATAT',
      'VERIFIKATOR_1',
      'VERIFIKATOR_2',
      'VERIFIKATOR_3',
      'SUPERADMIN',
    ];

    for (const p of petugas) {
      expect(p.id).toBeDefined();
      expect(p.name).toBeDefined();
      expect(rolesLayak.includes(p.role as string)).toBe(true);
      // Memastikan bukan mock data palsu fiktif ('usr-1', 'usr-2', 'usr-3', 'usr-4')
      expect(['usr-1', 'usr-2', 'usr-3', 'usr-4'].includes(p.id)).toBe(false);
    }
  });
});
