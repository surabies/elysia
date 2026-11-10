import { describe, expect, it } from 'bun:test';
import { caterProgresService } from '@/server/services/cater/cater-progres.service';

describe('Monitoring Progres Lapangan Petugas (Database Riil)', () => {
  it('berhasil memuat ringkasan KPI progres lapangan petugas dari database nyata', async () => {
    const res = await caterProgresService.getMonitoringProgres('202601');

    expect(res).toBeDefined();
    expect(res.periode).toBe('202601');
    expect(res.kpi).toBeDefined();

    // Verifikasi KPI total riil
    expect(res.kpi.totalTarget).toBe(22549);
    expect(res.kpi.totalTerbaca).toBe(22549);
    expect(res.kpi.totalM3).toBe(348231);
    expect(res.kpi.readRatePersen).toBe(100);
    expect(res.kpi.totalPetugas).toBe(9);

    // Verifikasi anomali sinkron 1:1 dengan SSOT Anomali Kubikasi
    expect(res.kpi.totalAnomali).toBe(1650);
    expect(res.kpi.totalEkstrim).toBe(632);
    expect(res.kpi.totalNol).toBe(375);
    expect(res.kpi.totalTurun).toBe(643);

    // Verifikasi data per petugas
    expect(res.petugas.length).toBe(9);

    const topOfficer = res.petugas[0]; // IWAN
    expect(topOfficer.petugasId).toBe('IWAN');
    expect(topOfficer.terbaca).toBe(2548);
    expect(topOfficer.totalM3).toBe(39648);
    expect(topOfficer.totalRute).toBe(15);
    expect(topOfficer.ruteList.length).toBe(15);
    expect(topOfficer.totalEkstrim).toBe(79);
    expect(topOfficer.totalNol).toBe(55);
    expect(topOfficer.totalTurun).toBe(73);
  });
});
