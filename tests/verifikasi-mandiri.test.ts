import { describe, it, expect } from "bun:test";
import { db, caterMandiriPelanggan, caterBacaMeter, user } from "@cater/db";
import { eq, and } from "drizzle-orm";
import { mandiriService } from "@/server/services/mandiri/mandiri.service";
import { verifikasiGridService } from "@/server/services/cater/verifikasi-grid.service";

describe("Verifikasi Mandiri Flow & Logika Bisnis", () => {
  const nolgTest = "00401200610";
  const thblTest = "202601";

  it("menampilkan stand awal yang akurat, menghitung pemakaian, dan menjalankan siklus verifikasi (approve -> unverify -> reject)", async () => {
    // 0. Ambil user id valid dari database untuk verifikator
    const [verifikatorUser] = await db.select({ id: user.id }).from(user).limit(1);
    const userId = verifikatorUser?.id ?? "usr-admin";

    // 1. Bersihkan data mandiri pengujian bila ada
    await db
      .delete(caterMandiriPelanggan)
      .where(eq(caterMandiriPelanggan.nolg, nolgTest));

    // Pastikan transaksi cater_baca_meter ada dengan stml 129
    const [caterAwal] = await db
      .select()
      .from(caterBacaMeter)
      .where(and(eq(caterBacaMeter.nolg, nolgTest), eq(caterBacaMeter.thbl, thblTest)));

    expect(caterAwal).toBeDefined();
    expect(Number(caterAwal.stml)).toBe(129);

    // 2. Warga melapor meter mandiri dengan stand 145
    const submitResult = await mandiriService.submitLaporanMandiri({
      thbl: thblTest,
      nolg: nolgTest,
      stma: 145,
      fotoMeterUrl: "https://placehold.co/600x400/png?text=Meter+145",
      channel: "WEB_PORTAL",
    });

    expect(submitResult.statusVerifikasi).toBe("PENDING");
    expect(submitResult.pakaiM3).toBe(16); // 145 - 129 = 16 m³

    // 3. Grid Verifikasi Mandiri membaca antrean
    const gridData = await verifikasiGridService.getMandiriRows({
      periode: 202601,
      id: submitResult.id,
    });

    expect(gridData.rows.length).toBe(1);
    const row = gridData.rows[0];

    // Verifikasi stand awal tampil benar dari database cater_baca_meter
    expect(row.nomorLangganan).toBe(nolgTest);
    expect(row.status).toBe("MENUNGGU");
    expect(row.standAwal).toBe(129);
    expect(row.standDilaporkan).toBe(145);
    expect(row.pemakaian).toBe(16); // 145 - 129 = 16

    // 4. Verifikator menyetujui (APPROVE) dan mengoreksi angka meter ke 148
    const approveResult = await mandiriService.verifikasiLaporanMandiri({
      mandiriId: submitResult.id,
      action: "APPROVE",
      standDilaporkan: 148,
      userId,
    });

    expect(approveResult.statusVerifikasi).toBe("APPROVED");

    // Periksa dampak ke tabel cater_baca_meter
    const [caterApproved] = await db
      .select()
      .from(caterBacaMeter)
      .where(and(eq(caterBacaMeter.nolg, nolgTest), eq(caterBacaMeter.thbl, thblTest)));

    expect(Number(caterApproved.stma)).toBe(148);
    expect(Number(caterApproved.pakaiM3)).toBe(19); // 148 - 129 = 19
    expect(caterApproved.tmss).toBe("Z");
    expect(caterApproved.ketCatat).toBe("STAND-KONSUMEN");
    expect(caterApproved.caterMandiriId).toBe(submitResult.id);

    // 5. Verifikator membatalkan verifikasi (UNVERIFY)
    await db.transaction(async (tx) => {
      await tx
        .update(caterMandiriPelanggan)
        .set({
          statusVerifikasi: "PENDING",
          alasanPenolakan: null,
          verifiedBy: null,
          verifiedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(caterMandiriPelanggan.id, submitResult.id));

      await tx
        .update(caterBacaMeter)
        .set({
          caterMandiriId: null,
          updatedAt: new Date(),
        })
        .where(eq(caterBacaMeter.id, caterApproved.id));
    });

    const [mandiriUnverified] = await db
      .select()
      .from(caterMandiriPelanggan)
      .where(eq(caterMandiriPelanggan.id, submitResult.id));

    expect(mandiriUnverified.statusVerifikasi).toBe("PENDING");

    const [caterUnlinked] = await db
      .select()
      .from(caterBacaMeter)
      .where(eq(caterBacaMeter.id, caterApproved.id));

    expect(caterUnlinked.caterMandiriId).toBeNull();

    // 6. Verifikator menolak (REJECT) laporan
    const rejectResult = await mandiriService.verifikasiLaporanMandiri({
      mandiriId: submitResult.id,
      action: "REJECT",
      alasanPenolakan: "Foto angka meter buram, mohon kirim ulang.",
      userId,
    });

    expect(rejectResult.statusVerifikasi).toBe("REJECTED");
    expect(rejectResult.alasanPenolakan).toBe("Foto angka meter buram, mohon kirim ulang.");

    // 7. Bersihkan data uji agar database kembali 0
    await db
      .delete(caterMandiriPelanggan)
      .where(eq(caterMandiriPelanggan.nolg, nolgTest));
  });
});
