import { describe, expect, it } from 'bun:test';
import { tentukanLatarBaris } from '../apps/web/src/features/pencatat-meter/verifikasi/lib/tema-verifikasi';

describe('Warna baris tabel verifikasi', () => {
  it('menggunakan warna dan hover yang sesuai untuk tiap tahap', () => {
    const warnaPerTahap = {
      MENUNGGU: { normal: 'transparent', hover: 'var(--table-hover)' },
      V1: {
        normal: 'var(--verif-v1-row)',
        hover: 'var(--verif-v1-row-hover)',
      },
      V2: {
        normal: 'var(--verif-v2-row)',
        hover: 'var(--verif-v2-row-hover)',
      },
      TERVERIFIKASI: {
        normal: 'var(--verif-v2-row)',
        hover: 'var(--verif-v2-row-hover)',
      },
      V3: {
        normal: 'var(--verif-v3-row)',
        hover: 'var(--verif-v3-row-hover)',
      },
      DITOLAK: {
        normal: 'var(--verif-error-row)',
        hover: 'var(--verif-error-row-hover)',
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
        normal: 'var(--verif-v1-row)',
        hover: 'var(--verif-v1-row-hover)',
      },
      V2: {
        normal: 'var(--verif-v2-row)',
        hover: 'var(--verif-v2-row-hover)',
      },
      V3: {
        normal: 'var(--verif-v3-row)',
        hover: 'var(--verif-v3-row-hover)',
      },
      DITOLAK: {
        normal: 'var(--verif-error-row)',
        hover: 'var(--verif-error-row-hover)',
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
      normal: 'var(--verif-correction-row)',
      hover: 'var(--verif-correction-row-hover)',
    });
  });

  it('mempertahankan warna aktif atau terpilih dan hover tidak menimpanya', () => {
    expect(
      tentukanLatarBaris({
        aktif: true,
        dipilih: false,
        tahap: 'V2',
        koreksi: true,
      }),
    ).toEqual({
      normal: 'color-mix(in srgb, var(--verif-v2-row-hover) 65%, var(--table-active))',
      hover: 'color-mix(in srgb, var(--verif-v2-row-hover) 75%, var(--table-active-hover))',
    });

    expect(
      tentukanLatarBaris({
        aktif: false,
        dipilih: true,
        tahap: 'V2',
        koreksi: true,
      }),
    ).toEqual({
      normal: 'var(--table-selected)',
      hover: 'var(--table-selected-hover)',
    });
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
