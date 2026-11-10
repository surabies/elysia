import { describe, expect, it } from "bun:test";
import {
  formatDurasiJamMenit,
  hitungP95Durasi,
  hitungRangkaianBermasalahTerpanjang,
  hitungRingkasanRute,
  hitungTinggiPilPerBaris,
  hitungTuntasRute,
} from "../apps/web/src/features/cater-monitoring/lib/perhitungan-riwayat-rute";
import { contoh8RuteBaca } from "../apps/web/src/features/cater-monitoring/lib/data-contoh-rute";
import { caterProgressService } from "../apps/web/src/server/services/cater/cater-progress.service";

describe("Riwayat Pembacaan Rute (Kalkulasi & Spesifikasi)", () => {
  it("memiliki tepat 8 rute dengan masing-masing 20 sesi (total 160 sesi)", () => {
    expect(contoh8RuteBaca).toHaveLength(8);
    for (const rute of contoh8RuteBaca) {
      expect(rute.sesiList).toHaveLength(20);
    }
  });

  it("menghasilkan ringkasan akurat sesuai dokumen spesifikasi", () => {
    const ringkasan = hitungRingkasanRute(contoh8RuteBaca);

    // Total sesi: 160
    expect(ringkasan.totalSesi).toBe(160);

    // Total tuntas: 153
    expect(ringkasan.totalTuntas).toBe(153);

    // Sesi Tuntas: 95.6%
    expect(ringkasan.sesiTuntasPersen).toBe(95.6);

    // Total bermasalah: 7 sesi
    expect(ringkasan.totalBermasalah).toBe(7);

    // Rute bermasalah: 1 dari 8
    expect(ringkasan.ruteBermasalahCount).toBe(1);
    expect(ringkasan.totalRuteCount).toBe(8);

    // Rangkaian terpanjang: 5 sesi berturut-turut
    expect(ringkasan.rangkaianTerpanjangBermasalah).toBe(5);

    // Selisih vs 10 sesi sebelumnya: -8.8 pts
    expect(ringkasan.selisihVsSebelumnyaPts).toBe(-8.8);

    // Sesi Terlama (p95): 7j 30m di Rute 01 Coblong
    expect(ringkasan.sesiTerlamaP95Teks).toBe("7j 30m");
    expect(ringkasan.sesiTerlamaRuteNama).toBe("Rute 01 Coblong");
  });

  it("menghitung tuntas per rute secara akurat", () => {
    // Coblong: 15/20 = 75%
    expect(hitungTuntasRute(contoh8RuteBaca[0]!.sesiList)).toBe(75);

    // Cicendo: 19/20 = 95%
    expect(hitungTuntasRute(contoh8RuteBaca[1]!.sesiList)).toBe(95);

    // Lengkong: 20/20 = 100%
    expect(hitungTuntasRute(contoh8RuteBaca[2]!.sesiList)).toBe(100);
  });

  it("menormalisasi tinggi pil secara per baris (bukan global)", () => {
    const coblong = contoh8RuteBaca[0]!;
    const heights = hitungTinggiPilPerBaris(coblong.sesiList, 6, 36);

    expect(heights).toHaveLength(20);
    // Sesi terlama mendapat maxHeight (36)
    expect(Math.max(...heights)).toBe(36);
    // Sesi singkat/gagal mendapat minimal minHeight (6)
    expect(Math.min(...heights)).toBe(6);
  });

  it("berhasil mengambil riwayat sesi petugas dari database nyata (PostgreSQL)", async () => {
    const dataPetugas = await caterProgressService.getRiwayatSesiPetugas("202601");
    expect(dataPetugas.length).toBeGreaterThan(0);

    const firstOfficer = dataPetugas[0]!;
    expect(firstOfficer.nama).toBeDefined();
    expect(firstOfficer.jumlahPelanggan).toBeGreaterThan(0);
    expect(firstOfficer.sesiList.length).toBeGreaterThan(0);

    // Kalkulasi ringkasan riil dari database
    const ringkasanRiil = hitungRingkasanRute(dataPetugas as any);
    expect(ringkasanRiil.totalSesi).toBeGreaterThan(0);
    expect(ringkasanRiil.sesiTuntasPersen).toBeGreaterThan(0);
  });
});
