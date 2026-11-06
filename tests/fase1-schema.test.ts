import { describe, it, expect } from 'bun:test';
import {
  tarifBlok,
  biayaTetap,
  periodePenagihan,
  daftarCatat,
  waterMeterMutasi,
  grandWaterMeter,
  gwmBacaMeter,
  golonganTarif,
  pelanggan,
  ruteCater,
  petugasCater,
  user,
} from '@cater/db';

describe('Fase 1: Schema Reconciled Tables & Constraints', () => {
  it('1. tarifBlok table definition & relations', () => {
    expect(tarifBlok).toBeDefined();
    expect(tarifBlok.id.name).toBe('id');
    expect(tarifBlok.tarifKode.name).toBe('tarif_kode');
    expect(tarifBlok.blok.name).toBe('blok');
    expect(tarifBlok.batasAwalM3.name).toBe('batas_awal_m3');
    expect(tarifBlok.batasAkhirM3.name).toBe('batas_akhir_m3');
    expect(tarifBlok.hargaPerM3.name).toBe('harga_per_m3');
    expect(tarifBlok.berlakuMulai.name).toBe('berlaku_mulai');
    expect(tarifBlok.berlakuSampai.name).toBe('berlaku_sampai');
  });

  it('2. biayaTetap table definition', () => {
    expect(biayaTetap).toBeDefined();
    expect(biayaTetap.id.name).toBe('id');
    expect(biayaTetap.jenis.name).toBe('jenis');
    expect(biayaTetap.ukuranMeter.name).toBe('ukuran_meter');
    expect(biayaTetap.nominal.name).toBe('nominal');
    expect(biayaTetap.berlakuMulai.name).toBe('berlaku_mulai');
  });

  it('3. periodePenagihan table definition (Closing Lock)', () => {
    expect(periodePenagihan).toBeDefined();
    expect(periodePenagihan.periode.name).toBe('periode');
    expect(periodePenagihan.status.name).toBe('status');
    expect(periodePenagihan.tanggalJatuhTempo.name).toBe('tanggal_jatuh_tempo');
    expect(periodePenagihan.ditutupAt.name).toBe('ditutup_at');
    expect(periodePenagihan.ditutupById.name).toBe('ditutup_by_id');
    expect(periodePenagihan.jumlahSl.name).toBe('jumlah_sl');
    expect(periodePenagihan.totalM3.name).toBe('total_m3');
    expect(periodePenagihan.totalTagihan.name).toBe('total_tagihan');
  });

  it('4. daftarCatat table definition (DPM Target Bulanan)', () => {
    expect(daftarCatat).toBeDefined();
    expect(daftarCatat.id.name).toBe('id');
    expect(daftarCatat.periode.name).toBe('periode');
    expect(daftarCatat.nolg.name).toBe('nolg');
    expect(daftarCatat.ruteKode.name).toBe('rute_kode');
    expect(daftarCatat.petugasId.name).toBe('petugas_id');
    expect(daftarCatat.urutan.name).toBe('urutan');
    expect(daftarCatat.sumber.name).toBe('sumber');
    expect(daftarCatat.status.name).toBe('status');
  });

  it('5. waterMeterMutasi table definition (Ganti Water Meter / Stand Angkat)', () => {
    expect(waterMeterMutasi).toBeDefined();
    expect(waterMeterMutasi.id.name).toBe('id');
    expect(waterMeterMutasi.nolg.name).toBe('nolg');
    expect(waterMeterMutasi.periode.name).toBe('periode');
    expect(waterMeterMutasi.tglGanti.name).toBe('tgl_ganti');
    expect(waterMeterMutasi.alasan.name).toBe('alasan');
    expect(waterMeterMutasi.noMeterLama.name).toBe('no_meter_lama');
    expect(waterMeterMutasi.standAngkat.name).toBe('stand_angkat');
    expect(waterMeterMutasi.fotoStandAngkat.name).toBe('foto_stand_angkat');
    expect(waterMeterMutasi.noMeterBaru.name).toBe('no_meter_baru');
    expect(waterMeterMutasi.standPasang.name).toBe('stand_pasang');
    expect(waterMeterMutasi.fotoMeterBaru.name).toBe('foto_meter_baru');
    expect(waterMeterMutasi.statusVerifikasi.name).toBe('status_verifikasi');
  });

  it('6. grandWaterMeter table definition (Grand Water Meter / Meter Induk DMA)', () => {
    expect(grandWaterMeter).toBeDefined();
    expect(grandWaterMeter.id.name).toBe('id');
    expect(grandWaterMeter.kodeGwm.name).toBe('kode_gwm');
    expect(grandWaterMeter.nama.name).toBe('nama');
    expect(grandWaterMeter.zonaKode.name).toBe('zona_kode');
    expect(grandWaterMeter.dmaKode.name).toBe('dma_kode');
    expect(grandWaterMeter.ukuranPipa.name).toBe('ukuran_pipa');
    expect(grandWaterMeter.titikLokasi.name).toBe('titik_lokasi');
    expect(grandWaterMeter.isActive.name).toBe('is_active');
  });

  it('7. gwmBacaMeter table definition (Pencatatan Debit & Neraca Air)', () => {
    expect(gwmBacaMeter).toBeDefined();
    expect(gwmBacaMeter.id.name).toBe('id');
    expect(gwmBacaMeter.gwmId.name).toBe('gwm_id');
    expect(gwmBacaMeter.periode.name).toBe('periode');
    expect(gwmBacaMeter.standAwal.name).toBe('stand_awal');
    expect(gwmBacaMeter.standAkhir.name).toBe('stand_akhir');
    expect(gwmBacaMeter.totalDebitM3.name).toBe('total_debit_m3');
    expect(gwmBacaMeter.titikLokasi.name).toBe('titik_lokasi');
  });
});
