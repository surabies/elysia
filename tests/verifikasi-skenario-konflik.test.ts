import { describe, it, expect, beforeEach, afterAll, beforeAll } from "bun:test";
import {
  db,
  caterBacaMeter,
  caterMandiriPelanggan,
  caterVerifikasiLog,
  daftarCatat,
  pelanggan,
  golonganTarif,
  masterKondisiCatat,
  user,
} from "@cater/db";
import { eq, and } from "drizzle-orm";
import { caterVerifikasiService } from "@/server/services/cater/cater-verifikasi.service";
import { mandiriService } from "@/server/services/mandiri/mandiri.service";
import { app } from "@/server/app";

describe("Skenario Robust: Konflik Catat Petugas vs Lapor Mandiri", () => {
  const thbl = "202611";
  const nolg = "99900000001"; // Pelanggan Dummy Khusus Unit Test (tidak mengganggu data riil)
  let validUserId: string;

  beforeAll(async () => {
    // Siapkan master pelanggan dummy
    await db
      .insert(pelanggan)
      .values({
        nolg,
        nama: "PELANGGAN UJI KONFLIK",
        alamat: "JL. PENGUJIAN SISTEM NO. 1",
        status: "AKTIF",
      })
      .onConflictDoNothing();
  });

  beforeEach(async () => {
    // Ambil user valid untuk verifiedBy FK
    const [u] = await db.select({ id: user.id }).from(user).limit(1);
    validUserId = u?.id || "user-superadmin";

    // Reset kondisi pengujian untuk pelanggan dummy
    await db.delete(caterVerifikasiLog).where(eq(caterVerifikasiLog.caterId, `cater-${thbl}-${nolg}`));
    await db.delete(caterMandiriPelanggan).where(and(eq(caterMandiriPelanggan.nolg, nolg), eq(caterMandiriPelanggan.thbl, thbl)));
    await db.delete(caterBacaMeter).where(and(eq(caterBacaMeter.nolg, nolg), eq(caterBacaMeter.thbl, thbl)));
  });

  it("Skenario 1 & 2: Menolak penimpaan mobile jika status LOCKED_BILLING atau APPROVED_FINAL", async () => {
    // Buat data dengan LOCKED_BILLING
    await db.insert(caterBacaMeter).values({
      id: `cater-${thbl}-${nolg}`,
      thbl,
      nolg,
      stml: "100",
      stma: "120",
      pakaiM3: "20",
      sumberCatat: "PETUGAS_ONSITE",
      statusVerifikasi: "LOCKED_BILLING",
    });

    // Petugas mobile mencoba submit reading baru
    expect(
      caterVerifikasiService.submitReading({
        thbl,
        nolg,
        stml: 100,
        stma: 125,
        sumberCatat: "PETUGAS_ONSITE",
      })
    ).rejects.toThrow("LOCKED_BILLING");

    // Ubah ke APPROVED_FINAL (V3)
    await db.update(caterBacaMeter).set({ statusVerifikasi: "APPROVED_FINAL" }).where(eq(caterBacaMeter.id, `cater-${thbl}-${nolg}`));

    // Petugas mobile mencoba submit reading baru
    expect(
      caterVerifikasiService.submitReading({
        thbl,
        nolg,
        stml: 100,
        stma: 125,
        sumberCatat: "PETUGAS_ONSITE",
      })
    ).rejects.toThrow("(V3)");
  });

  it("Skenario 3: Konsumen tgl 4 diverifikasi mandiri, Petugas tgl 6 input stand beda -> Terdeteksi Discrepancy & Anomali", async () => {
    // 1. Konsumen submit mandiri stand 500 (simulasi kiriman tgl 4)
    const mandiriId = `mandiri-test-${Date.now()}`;
    await db.insert(caterMandiriPelanggan).values({
      id: mandiriId,
      thbl,
      nolg,
      stma: "500",
      pakaiM3: "19",
      fotoMeterUrl: "https://example.com/foto-500.jpg",
      channel: "WEB_PORTAL",
      statusVerifikasi: "PENDING",
    });

    // 2. Verifikator setujui mandiri
    await mandiriService.verifikasiLaporanMandiri({
      mandiriId,
      action: "APPROVE",
      standDilaporkan: 500,
      userId: validUserId,
    });

    // Cek di caterBacaMeter sudah ada mandiri stand 500
    const [cater1] = await db.select().from(caterBacaMeter).where(and(eq(caterBacaMeter.thbl, thbl), eq(caterBacaMeter.nolg, nolg)));
    expect(cater1).toBeDefined();
    expect(Number(cater1.stma)).toBe(500);

    // 3. Petugas datang tgl 6 input stand 508 via mobile
    await caterVerifikasiService.submitReading({
      thbl,
      nolg,
      stml: 481,
      stma: 508,
      sumberCatat: "PETUGAS_ONSITE",
      catatan: "Catatan petugas tgl 6",
    });

    // Cek caterBacaMeter sekarang
    const [cater2] = await db.select().from(caterBacaMeter).where(and(eq(caterBacaMeter.thbl, thbl), eq(caterBacaMeter.nolg, nolg)));
    expect(cater2).toBeDefined();
    expect(Number(cater2.stma)).toBe(508);
    expect(cater2.isAnomali).toBe(true);
    expect(cater2.kodeAnomaliList).toContain("BEDA_STAND_MANDIRI_PETUGAS");
    expect(cater2.catatan).toContain("BEDA_STAND_MANDIRI_PETUGAS");
    expect(cater2.statusVerifikasi).toBe("ANOMALY");
  });

  it("Skenario 4 & 5: Petugas input duluan, lalu Mandiri disetujui -> Backup tersimpan; Saat Mandiri di-unverify -> Data Petugas pulih", async () => {
    // 1. Petugas lapangan catat duluan: stml 480, stma 495, pakai 15
    await db.insert(caterBacaMeter).values({
      id: `cater-${thbl}-${nolg}`,
      thbl,
      nolg,
      stml: "480",
      stma: "495",
      pakaiM3: "15",
      sumberCatat: "PETUGAS_ONSITE",
      statusVerifikasi: "SUBMITTED",
      catatan: "Catatan asli petugas lapangan",
    });

    // 2. Konsumen kirim mandiri stand 500 (simulasi kiriman tgl 6)
    const mandiriId = `mandiri-test-${Date.now()}`;
    await db.insert(caterMandiriPelanggan).values({
      id: mandiriId,
      thbl,
      nolg,
      stma: "500",
      pakaiM3: "20",
      fotoMeterUrl: "https://example.com/foto-500.jpg",
      channel: "WEB_PORTAL",
      statusVerifikasi: "PENDING",
    });

    // 3. Verifikator setujui mandiri
    await mandiriService.verifikasiLaporanMandiri({
      mandiriId,
      action: "APPROVE",
      standDilaporkan: 500,
      userId: validUserId,
    });

    // Cek caterBacaMeter sekarang berisi mandiri dan mem-backup data petugas
    const [caterOverride] = await db.select().from(caterBacaMeter).where(and(eq(caterBacaMeter.thbl, thbl), eq(caterBacaMeter.nolg, nolg)));
    expect(Number(caterOverride.stma)).toBe(500);
    expect(caterOverride.catatan).toContain("[PREV_PETUGAS:PETUGAS_ONSITE:STMA=495");

    // 4. Verifikator membatalkan verifikasi mandiri (UNVERIFY) lewat endpoint router
    const res = await app.handle(
      new Request(`http://localhost/api/v1/laporan-mandiri/${mandiriId}/unverify`, {
        method: "PATCH",
        headers: {
          "x-test-role": "VERIFIKATOR_1",
          "x-test-user-id": validUserId,
        },
      })
    );

    expect(res.status).toBe(200);

    // 5. Verifikasi bahwa data petugas asli telah DIPULIHKAN kembali!
    const [caterRestored] = await db.select().from(caterBacaMeter).where(and(eq(caterBacaMeter.thbl, thbl), eq(caterBacaMeter.nolg, nolg)));
    expect(caterRestored).toBeDefined();
    expect(caterRestored.sumberCatat).toBe("PETUGAS_ONSITE");
    expect(Number(caterRestored.stma)).toBe(495);
    expect(Number(caterRestored.stml)).toBe(480);
    expect(Number(caterRestored.pakaiM3)).toBe(15);
    expect(caterRestored.caterMandiriId).toBeNull();
    expect(caterRestored.catatan).toContain("[Pemulihan Data Petugas]");
  });

  it("Skenario 6: Unverify V3 langsung mengembalikan status ke SUBMITTED dan mereset pakaiTagih ke null (tanpa menggantung di V2)", async () => {
    const caterId = `cater-${thbl}-${nolg}`;
    // 1. Buat data sudah disahkan V3 (APPROVED_FINAL) dengan pakaiTagih terisi
    await db.insert(caterBacaMeter).values({
      id: caterId,
      thbl,
      nolg,
      stml: "200",
      stma: "220",
      pakaiM3: "20",
      pakaiTagih: "20",
      sumberCatat: "PETUGAS_ONSITE",
      statusVerifikasi: "APPROVED_FINAL",
    });

    // 2. Jalankan unverify V3 lewat endpoint API
    const res = await app.handle(
      new Request(`http://localhost/api/v1/laporan-harian/${caterId}/unverify`, {
        method: "PATCH",
        headers: {
          "x-test-role": "VERIFIKATOR_3",
          "x-test-user-id": validUserId,
        },
      })
    );

    expect(res.status).toBe(200);

    // 3. Pastikan status langsung SUBMITTED (bukan menggantung di VERIFIED_L2) dan pakaiTagih bernilai null
    const [rowAfter] = await db.select().from(caterBacaMeter).where(eq(caterBacaMeter.id, caterId));
    expect(rowAfter).toBeDefined();
    expect(rowAfter.statusVerifikasi).toBe("SUBMITTED");
    expect(rowAfter.pakaiTagih).toBeNull();

    // 4. Pastikan audit log tercatat
    const logs = await db.select().from(caterVerifikasiLog).where(eq(caterVerifikasiLog.caterId, caterId));
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].action).toBe("UNVERIFY");
    expect(logs[0].stage).toBe("V3");
  });

  afterAll(async () => {
    // Bersihkan seluruh data test dummy
    await db.delete(caterVerifikasiLog).where(eq(caterVerifikasiLog.caterId, `cater-${thbl}-${nolg}`));
    await db.delete(caterMandiriPelanggan).where(and(eq(caterMandiriPelanggan.nolg, nolg), eq(caterMandiriPelanggan.thbl, thbl)));
    await db.delete(caterBacaMeter).where(and(eq(caterBacaMeter.nolg, nolg), eq(caterBacaMeter.thbl, thbl)));
    await db.delete(pelanggan).where(eq(pelanggan.nolg, nolg));
  });
});
