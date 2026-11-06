import { describe, it, expect } from 'bun:test';
import {
  pelanggan,
  caterBacaMeter,
  wilayahAdministrasi,
  kecamatan,
  kelurahan,
  ruteCater,
  petugasCater,
  golonganTarif,
  waterMeter,
  rekeningDrd,
  pegawai,
  userRoles,
  userWilayahScope,
  userRuteAssignment,
  caterVerifikasiLog,
  masterKondisiCatat,
  caterMandiriPelanggan,
  tarifBlok,
  biayaTetap,
  periodePenagihan,
  daftarCatat,
  employeeLevelEnum,
  appRoleEnum,
  caterVerificationStatusEnum,
} from '@cater/db';

describe('Modular Cater Drizzle Schema Integrity', () => {
  it('should export all 6 modular Cater tables from @cater/db', () => {
    expect(pelanggan).toBeDefined();
    expect(caterBacaMeter).toBeDefined();
    expect(wilayahAdministrasi).toBeDefined();
    expect(kecamatan).toBeDefined();
    expect(kelurahan).toBeDefined();
    expect(ruteCater).toBeDefined();
    expect(petugasCater).toBeDefined();
    expect(golonganTarif).toBeDefined();
    expect(waterMeter).toBeDefined();
    expect(rekeningDrd).toBeDefined();
  });

  it('should export Phase 1 reconciled tables: tarifBlok, biayaTetap, periodePenagihan, daftarCatat', () => {
    // 1. Tarif Blok (Tiered Tariffs)
    expect(tarifBlok).toBeDefined();
    expect(tarifBlok.id).toBeDefined();
    expect(tarifBlok.tarifKode).toBeDefined();
    expect(tarifBlok.blok).toBeDefined();
    expect(tarifBlok.batasAwalM3).toBeDefined();
    expect(tarifBlok.hargaPerM3).toBeDefined();
    expect(tarifBlok.berlakuMulai).toBeDefined();

    // 2. Biaya Tetap (Fixed Fee / Meter Size)
    expect(biayaTetap).toBeDefined();
    expect(biayaTetap.id).toBeDefined();
    expect(biayaTetap.jenis).toBeDefined();
    expect(biayaTetap.nominal).toBeDefined();
    expect(biayaTetap.ukuranMeter).toBeDefined();
    expect(biayaTetap.berlakuMulai).toBeDefined();

    // 3. Periode Penagihan (Closing Cycle Lock)
    expect(periodePenagihan).toBeDefined();
    expect(periodePenagihan.periode).toBeDefined();
    expect(periodePenagihan.status).toBeDefined();
    expect(periodePenagihan.tanggalJatuhTempo).toBeDefined();
    expect(periodePenagihan.ditutupAt).toBeDefined();
    expect(periodePenagihan.ditutupById).toBeDefined();
    expect(periodePenagihan.totalTagihan).toBeDefined();

    // 4. Daftar Catat (DPM - Target Beban Kerja Catat Bulanan)
    expect(daftarCatat).toBeDefined();
    expect(daftarCatat.id).toBeDefined();
    expect(daftarCatat.periode).toBeDefined();
    expect(daftarCatat.nolg).toBeDefined();
    expect(daftarCatat.ruteKode).toBeDefined();
    expect(daftarCatat.petugasId).toBeDefined();
    expect(daftarCatat.sumber).toBeDefined();
    expect(daftarCatat.status).toBeDefined();
  });

  it('should export masterKondisiCatat and caterMandiriPelanggan tables', () => {
    expect(masterKondisiCatat).toBeDefined();
    expect(masterKondisiCatat.kodeTmss).toBeDefined();
    expect(masterKondisiCatat.nama).toBeDefined();
    expect(masterKondisiCatat.triggerBacaMandiri).toBeDefined();

    expect(caterMandiriPelanggan).toBeDefined();
    expect(caterMandiriPelanggan.id).toBeDefined();
    expect(caterMandiriPelanggan.nolg).toBeDefined();
    expect(caterMandiriPelanggan.stma).toBeDefined();
    expect(caterMandiriPelanggan.fotoMeterUrl).toBeDefined();
    expect(caterMandiriPelanggan.lokasiGps).toBeDefined();
    expect(caterMandiriPelanggan.jarakDariRumahMeter).toBeDefined();
    expect(caterMandiriPelanggan.statusVerifikasi).toBeDefined();

    // Verify caterBacaMeter has new integration columns
    expect(caterBacaMeter.tmss).toBeDefined();
    expect(caterBacaMeter.sumberCatat).toBeDefined();
    expect(caterBacaMeter.caterMandiriId).toBeDefined();
  });

  it('should export all RBAC and organizational hierarchy tables and enums', () => {
    expect(pegawai).toBeDefined();
    expect(userRoles).toBeDefined();
    expect(userWilayahScope).toBeDefined();
    expect(userRuteAssignment).toBeDefined();
    expect(caterVerifikasiLog).toBeDefined();
    expect(employeeLevelEnum).toBeDefined();
    expect(appRoleEnum).toBeDefined();
    expect(caterVerificationStatusEnum).toBeDefined();

    // Verify 6 levels of organizational hierarchy
    expect(employeeLevelEnum.enumValues).toEqual([
      'DIREKSI',
      'SENIOR_MANAGER',
      'MANAGER',
      'SUPERVISOR',
      'STAFF_PENYELIA',
      'PELAKSANA',
    ]);

    // Verify system roles including V1, V2, V3, and STAFF_ADMIN_BILLING
    expect(appRoleEnum.enumValues).toContain('VERIFIKATOR_1');
    expect(appRoleEnum.enumValues).toContain('VERIFIKATOR_2');
    expect(appRoleEnum.enumValues).toContain('VERIFIKATOR_3');
    expect(appRoleEnum.enumValues).toContain('STAFF_ADMIN_BILLING');
    expect(appRoleEnum.enumValues).toContain('PENCATAT');
  });

  it('pegawai table should have structural columns', () => {
    expect(pegawai.id).toBeDefined();
    expect(pegawai.nip).toBeDefined();
    expect(pegawai.namaLengkap).toBeDefined();
    expect(pegawai.level).toBeDefined();
    expect(pegawai.jabatanNama).toBeDefined();
    expect(pegawai.atasanId).toBeDefined();
    expect(pegawai.aktif).toBeDefined();
  });

  it('caterVerifikasiLog table should have audit trail columns', () => {
    expect(caterVerifikasiLog.id).toBeDefined();
    expect(caterVerifikasiLog.caterId).toBeDefined();
    expect(caterVerifikasiLog.userId).toBeDefined();
    expect(caterVerifikasiLog.stage).toBeDefined();
    expect(caterVerifikasiLog.action).toBeDefined();
    expect(caterVerifikasiLog.stmaSebelum).toBeDefined();
    expect(caterVerifikasiLog.stmaSesudah).toBeDefined();
    expect(caterVerifikasiLog.nomorTiketKomplain).toBeDefined();
    expect(caterVerifikasiLog.alasan).toBeDefined();
  });

  it('pelanggan table should have required STI columns', () => {
    expect(pelanggan.nolg).toBeDefined();
    expect(pelanggan.nprs).toBeDefined();
    expect(pelanggan.nama).toBeDefined();
    expect(pelanggan.alamat).toBeDefined();
    expect(pelanggan.titikLokasi).toBeDefined();
    expect(pelanggan.tarifKode).toBeDefined();
    expect(pelanggan.ruteKode).toBeDefined();
  });

  it('caterBacaMeter table should have meter reading and spatial verification columns', () => {
    expect(caterBacaMeter.thbl).toBeDefined();
    expect(caterBacaMeter.stml).toBeDefined();
    expect(caterBacaMeter.stma).toBeDefined();
    expect(caterBacaMeter.pakaiM3).toBeDefined();
    expect(caterBacaMeter.lokasiGps).toBeDefined();
    expect(caterBacaMeter.jarakPelangganMeter).toBeDefined();
    expect(caterBacaMeter.statusVerifikasi).toBeDefined();
  });

  it('rekeningDrd table should have financial billing columns', () => {
    expect(rekeningDrd.thbl).toBeDefined();
    expect(rekeningDrd.jmlHargaAir).toBeDefined();
    expect(rekeningDrd.totalTagihan).toBeDefined();
    expect(rekeningDrd.tagNunggak).toBeDefined();
    expect(rekeningDrd.statusLunas).toBeDefined();
  });
});
