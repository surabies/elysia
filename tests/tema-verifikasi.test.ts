import { describe, expect, it } from 'bun:test';
import { tentukanLatarBaris } from '../apps/web/src/features/dashboard/verifikasi/lib/TemaVerifikasi';

describe('Warna baris tabel verifikasi', () => {
  it('menggunakan warna dan hover yang sesuai untuk tiap tahap', () => {
    const warnaPerTahap = {
      MENUNGGU: { normal: 'transparent', hover: 'var(--table-hover)' },
      V1: {
        normal: 'var(--verif-v1-soft)',
        hover: 'var(--verif-v1-hover)',
      },
      V2: {
        normal: 'var(--verif-v2-soft)',
        hover: 'var(--verif-v2-hover)',
      },
      TERVERIFIKASI: {
        normal: 'var(--verif-v2-soft)',
        hover: 'var(--verif-v2-hover)',
      },
      V3: {
        normal: 'var(--verif-v3-soft)',
        hover: 'var(--verif-v3-hover)',
      },
      DITOLAK: {
        normal: 'var(--verif-error-soft)',
        hover: 'var(--verif-error-hover)',
      },
    } as const;

    for (const tahap of [
      'MENUNGGU',
      'V1',
      'V2',
      'TERVERIFIKASI',
      'V3',
      'DITOLAK',
    ] as const) {
      expect(
        tentukanLatarBaris({
          aktif: false,
          dipilih: false,
          tahap,
        }),
      ).toEqual(warnaPerTahap[tahap]);
    }
  });

  it('menjaga warna tahap sebagai warna utama setelah proses verifikasi berjalan', () => {
    const warnaPerTahap = {
      V1: {
        normal: 'var(--verif-v1-soft)',
        hover: 'var(--verif-v1-hover)',
      },
      V2: {
        normal: 'var(--verif-v2-soft)',
        hover: 'var(--verif-v2-hover)',
      },
      V3: {
        normal: 'var(--verif-v3-soft)',
        hover: 'var(--verif-v3-hover)',
      },
      DITOLAK: {
        normal: 'var(--verif-error-soft)',
        hover: 'var(--verif-error-hover)',
      },
    } as const;

    for (const tahap of ['V1', 'V2', 'V3', 'DITOLAK'] as const) {
      expect(
        tentukanLatarBaris({
          aktif: false,
          dipilih: false,
          tahap,
          koreksi: true,
        }),
      ).toEqual(warnaPerTahap[tahap]);
    }
  });

  it('menggunakan ungu sebagai latar koreksi selama masih menunggu', () => {
    expect(
      tentukanLatarBaris({
        aktif: false,
        dipilih: false,
        tahap: 'MENUNGGU',
        koreksi: true,
      }),
    ).toEqual({
      normal: 'var(--verif-correction-soft)',
      hover: 'var(--verif-correction-hover)',
    });
  });

  it('mempertahankan warna aktif atau terpilih dan hover tidak menimpanya', () => {
    for (const selected of [{ aktif: true, dipilih: false }, { aktif: false, dipilih: true }]) {
      expect(
        tentukanLatarBaris({
          ...selected,
          tahap: 'V2',
          koreksi: true,
        }),
      ).toEqual({
        normal: 'var(--table-accent)',
        hover: 'var(--table-accent)',
      });
    }
  });

  it('menggunakan warna hover netral untuk baris yang menunggu', () => {
    expect(
      tentukanLatarBaris({
        aktif: false,
        dipilih: false,
        tahap: 'MENUNGGU',
      }),
    ).toEqual({ normal: 'transparent', hover: 'var(--table-hover)' });
  });
});
