import { describe, expect, it } from 'bun:test';
import {
  buildOperatorErrorFeedback,
  calculateVerificationRate,
  computeDefaultDueDate,
  computeNextPeriode,
  evaluateClosingWizardSteps,
  formatAngkaId,
  formatPeriodeLabelId,
  formatRupiahId,
  getClosingConfirmPhrase,
  getStageCategoryLabel,
  getStageStatusBadgeVariant,
  getStageStatusLabel,
} from './closing-format';
import {
  hitungRincianHargaAir,
  hitungTotalTagihan,
  tentukanBlok,
  type HargaBlok,
} from '@/server/domain/tagihan/tagihan.engine';
import { cn } from '@/lib/utils';

const MOCK_TARIF_2A2: HargaBlok[] = [
  { blok: 1, batasAwalM3: 1, batasAkhirM3: 10, hargaPerM3: 2800 },
  { blok: 2, batasAwalM3: 11, batasAkhirM3: 20, hargaPerM3: 5600 },
  { blok: 3, batasAwalM3: 21, batasAkhirM3: 30, hargaPerM3: 8400 },
  { blok: 4, batasAwalM3: 31, batasAkhirM3: null, hargaPerM3: 11200 },
];

describe('Closing Periode & Billing Engine Verification', () => {
  describe('Formatting & Status Helpers (closing-format.ts)', () => {
    it('formats Indonesian numbers and Rupiah accurately', () => {
      expect(formatAngkaId(12500)).toBe('12.500');
      expect(formatAngkaId(null)).toBe('—');
      expect(formatRupiahId(1500000)).toBe('Rp 1.500.000');
      expect(formatRupiahId(undefined)).toBe('Rp 0');
    });

    it('maps workflow stage categories and statuses to semantic Geist variants', () => {
      expect(getStageCategoryLabel('PRA_CLOSING')).toBe('Persiapan Data');
      expect(getStageCategoryLabel('EKSEKUSI')).toBe('Kunci & Tagihan');
      expect(getStageCategoryLabel('PASCA_CLOSING')).toBe('Persiapan Bulan Baru');
      expect(getStageCategoryLabel('MONITORING')).toBe('Pemeriksaan');

      expect(getStageStatusBadgeVariant('SELESAI')).toBe('green-subtle');
      expect(getStageStatusBadgeVariant('SIAP')).toBe('blue-subtle');
      expect(getStageStatusBadgeVariant('PERLU_TINDAKAN')).toBe('amber-subtle');
      expect(getStageStatusBadgeVariant('TERKUNCI')).toBe('secondary');
      expect(getStageStatusBadgeVariant('MENUNGGU')).toBe('subtle');

      expect(getStageStatusLabel('TERKUNCI')).toBe('Terkunci');
    });

    it('calculates verification percentage safely', () => {
      expect(calculateVerificationRate(250, 500)).toBe(50);
      expect(calculateVerificationRate(500, 500)).toBe(100);
      expect(calculateVerificationRate(0, 0)).toBe(0);
    });

    it('computes human-readable period labels, next period, and due dates across year boundaries', () => {
      expect(formatPeriodeLabelId('202611')).toBe('November 2026');
      expect(computeNextPeriode('202611')).toBe('202612');
      expect(computeNextPeriode('202612')).toBe('202701');
      expect(computeDefaultDueDate('202611')).toBe('2026-12-20');
      expect(computeDefaultDueDate('202612')).toBe('2027-01-20');
    });
  });

  describe('4-Step Linear Closing Pipeline & Safety Guards', () => {
    it('generates explicit confirmation phrase per period', () => {
      expect(getClosingConfirmPhrase('202601')).toBe('TUTUP 202601');
    });

    it('blocks advancing steps when preconditions are not met and unlocks sequentially across 4 stages', () => {
      const basePratinjau = {
        periode: '202601',
        status: 'BERJALAN' as const,
        daftarCatat: { total: 100, selesai: 100, belumSelesai: 0, readRatePersen: 100 },
        verifikasi: { total: 100, selesaiV3: 80, belumSelesai: 20, siapDisahkan: 20, butuhKoreksi: 0 },
        pembacaan: { total: 100, sudahDitagih: 0, akanDitagih: 100 },
        perkiraan: { jumlahSl: 100, totalM3: 1500, totalTagihan: 12000000 },
        hambatan: [],
        bisaDitutup: false,
      };

      // Case 1: DPM incomplete (belumSelesai > 0) -> stays on Step 1 (Cek Kesiapan Data)
      const evalDpmIncomplete = evaluateClosingWizardSteps({
        stages: [],
        pratinjau: {
          ...basePratinjau,
          daftarCatat: { total: 100, selesai: 95, belumSelesai: 5, readRatePersen: 95 },
        },
        standAngkatList: [],
        reviewConfirmed: false,
        tanggalJatuhTempo: '2026-02-20',
      });
      expect(evalDpmIncomplete.recommendedStep).toBe(1);
      expect(evalDpmIncomplete.steps[0]?.canProceed).toBe(false);

      // Case 2: Step 1 complete, Step 2 has 20 unapproved readings -> recommended step is 2
      const evalUnapproved = evaluateClosingWizardSteps({
        stages: [],
        pratinjau: basePratinjau,
        standAngkatList: [],
        reviewConfirmed: false,
        tanggalJatuhTempo: '2026-02-20',
      });
      expect(evalUnapproved.steps).toHaveLength(4);
      expect(evalUnapproved.recommendedStep).toBe(2);
      expect(evalUnapproved.steps[0]?.canProceed).toBe(true);
      expect(evalUnapproved.steps[1]?.canProceed).toBe(false);
      expect(evalUnapproved.steps[1]?.blockerReasons.length).toBeGreaterThan(0);

      // Case 3: All readings approved -> moves directly to Step 3 (Tinjau DRD & Kunci Buku)
      const evalApproved = evaluateClosingWizardSteps({
        stages: [],
        pratinjau: {
          ...basePratinjau,
          verifikasi: { total: 100, selesaiV3: 100, belumSelesai: 0, siapDisahkan: 0, butuhKoreksi: 0 },
          bisaDitutup: true,
        },
        standAngkatList: [],
        reviewConfirmed: false,
        tanggalJatuhTempo: '2026-02-20',
      });
      expect(evalApproved.recommendedStep).toBe(3);
      expect(evalApproved.steps[1]?.canProceed).toBe(true);
      expect(evalApproved.steps[2]?.isCompleted).toBe(false);

      // Case 4: Period is TERKUNCI -> jumps to Step 4 (Bukti Tutup Buku & Buka Bulan Baru)
      const evalLocked = evaluateClosingWizardSteps({
        stages: [],
        pratinjau: {
          ...basePratinjau,
          status: 'TERKUNCI',
          verifikasi: { total: 100, selesaiV3: 100, belumSelesai: 0 },
        },
        standAngkatList: [],
        reviewConfirmed: false,
        tanggalJatuhTempo: '2026-02-20',
      });
      expect(evalLocked.recommendedStep).toBe(4);
      expect(evalLocked.steps[2]?.isCompleted).toBe(true);
    });

    it('formats errors with operator-friendly explanation, data safety assurance, and next action', () => {
      const fb = buildOperatorErrorFeedback(
        new Error('Masih ada 5 hasil baca meter yang belum disahkan'),
        'Gagal Menutup Buku',
      );
      expect(fb.type).toBe('error');
      expect(fb.title).toBe('Gagal Menutup Buku');
      expect(fb.dataImpact).toContain('tetap utuh 100%');
      expect(fb.nextAction).toContain('Tahap 2');
    });
  });

  describe('Progressive 4-Block Tariff Engine (tagihan.engine.ts)', () => {
    it('calculates progressive water charges across blocks 1 to 4', () => {
      const res = hitungRincianHargaAir(25, MOCK_TARIF_2A2);
      expect(res.total).toBe(126000);
      expect(res.rincian).toHaveLength(3);
      expect(tentukanBlok(25)).toBe(3);

      const totalDrd = hitungTotalTagihan({
        jmlHargaAir: res.total,
        beaBeban: 15000,
        beaAdmin: 5000,
        airKotor: 0,
      });
      expect(totalDrd).toBe(146000);
    });
  });

  describe('Geist Typography & Tailwind-Merge Integration (cn)', () => {
    it('preserves text-primary-foreground when combined with Geist text-button-14', () => {
      const merged = cn(
        'bg-primary text-primary-foreground',
        'h-9 px-3 text-button-14',
      );
      expect(merged).toContain('text-primary-foreground');
      expect(merged).toContain('text-button-14');
    });
  });
});
