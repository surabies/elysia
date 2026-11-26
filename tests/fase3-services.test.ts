import { describe, it, expect } from 'bun:test';
import { closingService } from '../packages/backend/src/services/penagihan/closing/closing.service';
import { mandiriService } from '../packages/backend/src/services/langganan/mandiri/mandiri.service';
import { gwmService } from '../packages/backend/src/services/rpm/gwm/gwm.service';
import { caterKueriService } from '../packages/backend/src/services/pencatat-meter/cater/cater-kueri.service';
import { caterVerifikasiService } from '../packages/backend/src/services/pencatat-meter/cater/cater-verifikasi.service';

describe('Fase 3: Service Layer Integrity & Orchestration Tests', () => {
  it('1. closingService exposes pratinjauClosing and eksekusiClosing', () => {
    expect(closingService).toBeDefined();
    expect(typeof closingService.pratinjauClosing).toBe('function');
    expect(typeof closingService.eksekusiClosing).toBe('function');
  });

  it('2. mandiriService exposes submitLaporanMandiri and verifikasiLaporanMandiri', () => {
    expect(mandiriService).toBeDefined();
    expect(typeof mandiriService.submitLaporanMandiri).toBe('function');
    expect(typeof mandiriService.verifikasiLaporanMandiri).toBe('function');
  });

  it('3. gwmService exposes mutasi, debit, and neraca air orchestration', () => {
    expect(gwmService).toBeDefined();
    expect(typeof gwmService.catatMutasiGantiMeter).toBe('function');
    expect(typeof gwmService.verifikasiMutasiGantiMeter).toBe('function');
    expect(typeof gwmService.catatDebitGwm).toBe('function');
    expect(typeof gwmService.hitungNeracaAirZona).toBe('function');
  });

  it('4. caterKueriService exposes read-side query orchestration', () => {
    expect(caterKueriService).toBeDefined();
    expect(typeof caterKueriService.getStats).toBe('function');
    expect(typeof caterKueriService.getRoutes).toBe('function');
    expect(typeof caterKueriService.getRoutePelanggan).toBe('function');
    expect(typeof caterKueriService.getAnomalies).toBe('function');
    expect(typeof caterKueriService.getAuditHistory).toBe('function');
  });

  it('5. caterVerifikasiService exposes 3-tier verification and staff correction', () => {
    expect(caterVerifikasiService).toBeDefined();
    expect(typeof caterVerifikasiService.submitReading).toBe('function');
    expect(typeof caterVerifikasiService.verifikasiV1).toBe('function');
    expect(typeof caterVerifikasiService.verifikasiV2).toBe('function');
    expect(typeof caterVerifikasiService.verifikasiV3).toBe('function');
    expect(typeof caterVerifikasiService.koreksiStaff).toBe('function');
  });
});
