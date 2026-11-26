import { describe, it, expect } from 'bun:test';
import type { StatusPengaduan, AppRole, JenisPengaduan, PrioritasPengaduan } from '@cater/types';
import {
  isTransisiSah,
  hitungTargetSla,
  hitungEfekJeda,
  ringkasSla,
  hitungPerubahanTransisi,
  bolehMelakukan,
  tentukanKlasifikasi,
  tentukanPrioritasAwal,
  evaluasiPembuatanTiket,
  TRANSISI_PENGADUAN,
} from '../packages/backend/src/domain/pengaduan/alur-pengaduan.engine';

describe('Fase 6A: Pengujian Komprehensif Engine & Properti Graf', () => {
  const SEMUA_STATUS: StatusPengaduan[] = [
    'BARU',
    'TERVERIFIKASI',
    'DITUGASKAN',
    'MENUJU_LOKASI',
    'DIPROSES',
    'MENUNGGU_PELANGGAN',
    'SELESAI',
    'DITUTUP',
    'DITOLAK',
    'DIBUKA_KEMBALI',
  ];

  // 1. Matriks Transisi Penuh 10x10 (100 Pasangan)
  it('1. Matriks transisi penuh 10x10: memeriksa 100 kombinasi status secara eksplisit', () => {
    let sahCount = 0;
    let tidakSahCount = 0;

    for (const dari of SEMUA_STATUS) {
      for (const ke of SEMUA_STATUS) {
        const sah = isTransisiSah(dari, ke);
        const whitelist = TRANSISI_PENGADUAN[dari] ?? [];
        const expected = whitelist.includes(ke);

        expect(sah).toBe(expected);

        if (sah) sahCount++;
        else tidakSahCount++;
      }
    }

    // Pastikan total 100 pasangan teruji
    expect(sahCount + tidakSahCount).toBe(100);

    // DITUTUP adalah status terminal (0 transisi keluar)
    for (const ke of SEMUA_STATUS) {
      expect(isTransisiSah('DITUTUP', ke)).toBe(false);
    }

    // Self-transition DITUGASKAN -> DITUGASKAN adalah sah (re-assign teknisi)
    expect(isTransisiSah('DITUGASKAN', 'DITUGASKAN')).toBe(true);
  });

  // 2. Properti Graf Alur Tiket
  it('2. Properti graf: seluruh status dapat dicapai dari BARU dan memiliki jalur akhir', () => {
    // A. Reachability dari BARU via BFS
    const visitedFromBaru = new Set<StatusPengaduan>();
    const queue: StatusPengaduan[] = ['BARU'];
    visitedFromBaru.add('BARU');

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = TRANSISI_PENGADUAN[current] ?? [];
      for (const next of neighbors) {
        if (!visitedFromBaru.has(next)) {
          visitedFromBaru.add(next);
          queue.push(next);
        }
      }
    }

    // Seluruh 10 status harus dapat dicapai dari BARU
    for (const status of SEMUA_STATUS) {
      expect(visitedFromBaru.has(status)).toBe(true);
    }

    // B. Dari setiap status non-terminal ada jalur ke DITUTUP atau DITOLAK
    for (const status of SEMUA_STATUS) {
      if (status === 'DITUTUP' || status === 'DITOLAK') continue;

      const visited = new Set<StatusPengaduan>();
      const q: StatusPengaduan[] = [status];
      visited.add(status);
      let canReachTerminal = false;

      while (q.length > 0) {
        const curr = q.shift()!;
        if (curr === 'DITUTUP' || curr === 'DITOLAK') {
          canReachTerminal = true;
          break;
        }
        for (const next of TRANSISI_PENGADUAN[curr] ?? []) {
          if (!visited.has(next)) {
            visited.add(next);
            q.push(next);
          }
        }
      }

      expect(canReachTerminal).toBe(true);
    }
  });

  // 3. Transisi dengan Aturan Klasifikasi Tagihan
  it('3. BARU -> DITUGASKAN diblokir untuk tagihan rekening, tapi diizinkan untuk non-tagihan', () => {
    expect(
      isTransisiSah('BARU', 'DITUGASKAN', { klasifikasi: 'NILAI_TAGIHAN_REKENING' })
    ).toBe(false);

    expect(
      isTransisiSah('BARU', 'DITUGASKAN', { klasifikasi: 'BUKAN_NILAI_TAGIHAN_REKENING' })
    ).toBe(true);
  });

  // 4. Perhitungan SLA & Efek Jeda
  it('4. SLA Engine: 4 level prioritas, efek jeda, dan akumulasi jeda', () => {
    const t0 = new Date('2026-11-20T08:00:00Z');

    const slaRendah = hitungTargetSla('RENDAH', t0);
    const slaNormal = hitungTargetSla('NORMAL', t0);
    const slaTinggi = hitungTargetSla('TINGGI', t0);
    const slaDarurat = hitungTargetSla('DARURAT', t0);

    // Durasi selesai: DARURAT (6 jam) < TINGGI (24 jam) < NORMAL (48 jam) < RENDAH (72 jam)
    const durasiDarurat = (slaDarurat.targetSelesaiAt.getTime() - t0.getTime()) / (60 * 60 * 1000);
    const durasiTinggi = (slaTinggi.targetSelesaiAt.getTime() - t0.getTime()) / (60 * 60 * 1000);
    const durasiNormal = (slaNormal.targetSelesaiAt.getTime() - t0.getTime()) / (60 * 60 * 1000);
    const durasiRendah = (slaRendah.targetSelesaiAt.getTime() - t0.getTime()) / (60 * 60 * 1000);

    expect(durasiDarurat).toBe(6);
    expect(durasiTinggi).toBe(24);
    expect(durasiNormal).toBe(48);
    expect(durasiRendah).toBe(72);

    // Efek Jeda SLA
    const jedaMulai = new Date('2026-11-20T10:00:00Z');
    const targetAwal = new Date('2026-11-20T16:00:00Z');
    const sekarangResume = new Date('2026-11-20T12:00:00Z'); // Dijeda 2 jam (120 menit)

    const efek = hitungEfekJeda({
      jedaMulaiAt: jedaMulai,
      targetSelesaiAt: targetAwal,
      jedaTotalMenitSebelumnya: 30, // sebelumnya sudah pernah ada jeda 30 menit
      sekarang: sekarangResume,
    });

    expect(efek.durasiMenit).toBe(120);
    expect(efek.jedaTotalMenitBaru).toBe(150);
    expect(efek.targetSelesaiAtBaru.getTime()).toBe(
      targetAwal.getTime() + 120 * 60 * 1000
    );
  });

  // 5. Matriks Kasus ringkasSla
  it('5. ringkasSla: penanganan tiket terbuka, tertutup, terlambat, DITOLAK, dan terjeda', () => {
    const tAwal = new Date('2026-11-20T08:00:00Z');
    const targetRespons = new Date('2026-11-20T10:00:00Z');
    const targetSelesai = new Date('2026-11-20T14:00:00Z');

    // A. Terbuka tepat waktu
    const kasus1 = ringkasSla(
      {
        status: 'DIPROSES',
        targetResponsAt: targetRespons,
        targetSelesaiAt: targetSelesai,
        responsAt: new Date('2026-11-20T09:00:00Z'),
        selesaiAt: null,
      },
      new Date('2026-11-20T11:00:00Z')
    );
    expect(kasus1.melanggar).toBe(false);
    expect(kasus1.responsTerlambat).toBe(false);

    // B. Selesai terlambat -> melanggar = true (B9)
    const kasus2 = ringkasSla(
      {
        status: 'SELESAI',
        targetResponsAt: targetRespons,
        targetSelesaiAt: targetSelesai,
        responsAt: new Date('2026-11-20T09:00:00Z'),
        selesaiAt: new Date('2026-11-20T16:00:00Z'), // 2 jam melewati target
      },
      new Date('2026-11-20T18:00:00Z')
    );
    expect(kasus2.melanggar).toBe(true);

    // C. DITOLAK dari BARU -> tidak melanggar dan tidak respons terlambat (B9)
    const kasus3 = ringkasSla(
      {
        status: 'DITOLAK',
        targetResponsAt: targetRespons,
        targetSelesaiAt: targetSelesai,
        responsAt: null,
        selesaiAt: null,
      },
      new Date('2026-11-20T16:00:00Z')
    );
    expect(kasus3.melanggar).toBe(false);
    expect(kasus3.responsTerlambat).toBe(false);

    // D. Terjeda MENUNGGU_PELANGGAN -> sisaMenit membeku (B9)
    const kasus4 = ringkasSla(
      {
        status: 'MENUNGGU_PELANGGAN',
        targetResponsAt: targetRespons,
        targetSelesaiAt: targetSelesai,
        responsAt: new Date('2026-11-20T09:00:00Z'),
        jedaMulaiAt: new Date('2026-11-20T11:00:00Z'),
        selesaiAt: null,
      },
      new Date('2026-11-20T15:00:00Z')
    );
    // Sisa menit dihitung terhadap jedaMulaiAt (14:00 - 11:00 = 180 menit)
    expect(kasus4.sisaMenit).toBe(180);
    expect(kasus4.melanggar).toBe(false);
  });

  // 6. Matriks Izin Role Lengkap
  it('6. Matriks izin role internal sesuai wewenang tugas PDAM Tirtawening', () => {
    // Tabel wewenang: [role, aksi, konteks, expected]
    const kasusOtorisasi: Array<{
      role: AppRole;
      aksi: any;
      konteks?: any;
      expected: boolean;
    }> = [
      { role: 'EXECUTIVE', aksi: 'BACA', expected: true },
      { role: 'EXECUTIVE', aksi: 'TUGASKAN', expected: false },
      { role: 'EXECUTIVE', aksi: 'UPDATE_STATUS_LAPANGAN', expected: false },
      { role: 'EXECUTIVE', aksi: 'CATATAN_CHAT', expected: false },
      { role: 'SUPERADMIN', aksi: 'TUGASKAN', expected: true },
      { role: 'VERIFIKATOR_1', aksi: 'TUGASKAN', expected: true },
      { role: 'VERIFIKATOR_2', aksi: 'VERIFIKASI', expected: true },
      { role: 'VERIFIKATOR_3', aksi: 'TUTUP', expected: true },
      {
        role: 'STAFF_ADMIN_BILLING',
        aksi: 'VERIFIKASI',
        konteks: { klasifikasi: 'NILAI_TAGIHAN_REKENING' },
        expected: true,
      },
      {
        role: 'STAFF_ADMIN_BILLING',
        aksi: 'VERIFIKASI',
        konteks: { klasifikasi: 'BUKAN_NILAI_TAGIHAN_REKENING' },
        expected: false,
      },
      {
        role: 'PELAKSANA',
        aksi: 'UPDATE_STATUS_LAPANGAN',
        konteks: { aktorId: 'tek-1', penerimaTugasId: 'tek-1' },
        expected: true,
      },
      {
        role: 'PELAKSANA',
        aksi: 'UPDATE_STATUS_LAPANGAN',
        konteks: { aktorId: 'tek-2', penerimaTugasId: 'tek-1' },
        expected: false,
      },
      {
        role: 'PELAKSANA',
        aksi: 'ESKALASI',
        konteks: { aktorId: 'tek-1', penerimaTugasId: 'tek-1' },
        expected: true,
      },
      {
        role: 'PELAKSANA',
        aksi: 'ESKALASI',
        konteks: { aktorId: 'tek-2', penerimaTugasId: 'tek-1' },
        expected: false,
      },
    ];

    for (const k of kasusOtorisasi) {
      expect(bolehMelakukan(k.role, k.aksi, k.konteks)).toBe(k.expected);
    }
  });
});
