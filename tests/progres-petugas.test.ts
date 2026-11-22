import { describe, expect, it } from 'bun:test';
import { caterProgresService } from '@/server/services/cater/cater-progres.service';

describe('Monitoring Progres Lapangan Petugas (Database Riil)', () => {
  it('berhasil memuat ringkasan KPI progres lapangan petugas dari database nyata', async () => {
    const res = await caterProgresService.getMonitoringProgres('202611');

    expect(res).toBeDefined();
    expect(res.periode).toBe('202611');
    expect(res.kpi).toBeDefined();

    // Verifikasi KPI total riil
    expect(res.kpi.totalTarget).toBe(22528);
    expect(res.kpi.totalTerbaca).toBe(14237);
    expect(res.kpi.totalM3).toBe(182236);
    expect(res.kpi.readRatePersen).toBe(63.2);
    expect(res.kpi.totalPetugas).toBe(9);

    // Verifikasi anomali sinkron 1:1 dengan SSOT Anomali Kubikasi
    expect(res.kpi.totalAnomali).toBe(1692);
    expect(res.kpi.totalEkstrim).toBe(399);
    expect(res.kpi.totalNol).toBe(273);
    expect(res.kpi.totalTurun).toBe(415);

    // Verifikasi data per petugas
    expect(res.petugas.length).toBe(9);

    const topOfficer = res.petugas[0]; // PERIYADI
    expect(topOfficer.petugasId).toBe('PERIYADI');
    expect(topOfficer.terbaca).toBe(2545);
    expect(topOfficer.totalM3).toBe(36097);
    expect(topOfficer.totalRute).toBe(14);
    expect(topOfficer.totalEkstrim).toBe(56);
    expect(topOfficer.totalNol).toBe(11);
    expect(topOfficer.totalTurun).toBe(36);
  });
});
