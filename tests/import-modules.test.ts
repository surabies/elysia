import { describe, test, expect } from "bun:test";
import fs from "fs";
import path from "path";
import { app } from "@cater/backend";
import { importDataService } from "../packages/backend/src/services/pencatat-meter/import/import-data.service";
import { navGroups } from "../apps/web/src/config/navigasi";

describe("Import Modules & Backend Data Integration (Foto Backup, Data, R Nomor, PBPK)", () => {
  const pbpkCsvPath = [
    path.resolve(process.cwd(), "packages/db/docs/PBPK.csv"),
    path.resolve(process.cwd(), "packages/db/data/raw/PBPK.csv"),
    path.resolve(process.cwd(), "packages/db/data/jan/PBPK.csv"),
  ].find((p) => fs.existsSync(p)) || path.resolve(process.cwd(), "packages/db/docs/PBPK.csv");

  test("1. Parse photo filename conforms strictly to {THBL}_{JENIS}_{NOLG}.jpg standard", () => {
    // 1. Stand meter photo
    const stand = importDataService.parsePhotoFileName("202601_stand_00703600750.jpg");
    expect(stand).not.toBeNull();
    expect(stand?.thbl).toBe("202601");
    expect(stand?.jenis).toBe("stand");
    expect(stand?.nolg).toBe("00703600750");
    expect(stand?.ext).toBe("jpg");

    // 2. Segel meter photo
    const segel = importDataService.parsePhotoFileName("202601_segel_00703600750.jpg");
    expect(segel).not.toBeNull();
    expect(segel?.thbl).toBe("202601");
    expect(segel?.jenis).toBe("segel");
    expect(segel?.nolg).toBe("00703600750");

    // 3. Fasad rumah photo
    const rumah = importDataService.parsePhotoFileName("202601_rumah_00703600750.jpg");
    expect(rumah).not.toBeNull();
    expect(rumah?.thbl).toBe("202601");
    expect(rumah?.jenis).toBe("rumah");
    expect(rumah?.nolg).toBe("00703600750");

    // 4. Invalid format should be rejected
    const invalid = importDataService.parsePhotoFileName("foto_random_123.jpg");
    expect(invalid).toBeNull();
  });

  test("2. Parse standard mobile data CSV extracts all reading fields", () => {
    const sampleCsv = `thbl;nolg;stml;stma;pakai_m3;tgl_catat;petugas_id;rute_kode;kondisi;latitude;longitude;catatan
202601;00703600750;120;138;18;2026-01-19 07:39:00;PETUGAS01;CD305;Normal;-6.917464;107.619123;Meter normal`;

    const parsed = importDataService.parsePencatatanCsv(sampleCsv);
    expect(parsed.length).toBe(1);
    expect(parsed[0].thbl).toBe("202601");
    expect(parsed[0].nolg).toBe("00703600750");
    expect(parsed[0].stml).toBe(120);
    expect(parsed[0].stma).toBe(138);
    expect(parsed[0].pakaiM3).toBe(18);
    expect(parsed[0].petugasId).toBe("PETUGAS01");
    expect(parsed[0].ruteKode).toBe("CD305");
    expect(parsed[0].ketCatat).toBe("Normal");
    expect(parsed[0].latitude).toBe(-6.917464);
    expect(parsed[0].longitude).toBe(107.619123);
  });

  test("2b. Parse official PDAM lapdatameter CSV format automatically", () => {
    const lapDataCsv = `"No Pel";Nama;Alamat;Periode;"St AWAL";"St Akhir";"St Akhir Catat";Pakai;"Pakai Lau";persentase;Trf;Kd_kel;Nm_Kel;kd_petugas;kd_wm;Wil;Rute;"Zona Wil";"Kd Zonasi";"Nama Zonasi";Kecamatan;Kelurahan;tgl_catat;tgl_upload;"Nama Petugas"
"\t00002801251";"INA GINARSIH";"SURYALAYA BARAT I NO.2";202601;4;4;0;10;10;0;2A4;H;"TIDAK DIPAKAI";OMAY;14000564;S;KC304;C5;B34;"ST SURYALAYA";LENGKONG;CIJAGRA;2026-01-01;2026-01-06;OMAY`;

    const parsed = importDataService.parsePencatatanCsv(lapDataCsv);
    expect(parsed.length).toBe(1);
    expect(parsed[0].thbl).toBe("202601");
    expect(parsed[0].nolg).toBe("00002801251");
    expect(parsed[0].stml).toBe(4);
    expect(parsed[0].stma).toBe(4);
    expect(parsed[0].pakaiM3).toBe(10);
    expect(parsed[0].petugasId).toBe("OMAY");
    expect(parsed[0].ruteKode).toBe("KC304");
  });

  test("2c. Parse official lapdatameter via parseLapDataMeterCsv extracts all fields and cleans NOLG", () => {
    const rawLine = `"No Pel",Nama,Alamat,Periode,"St AWAL","St Akhir","St Akhir Catat",Pakai,"Pakai Lau",persentase,Trf,Kd_kel,Nm_Kel,kd_petugas,kd_wm,Wil,Rute,"Zona Wil","Kd Zonasi","Nama Zonasi",Kecamatan,Kelurahan,tgl_catat,tgl_upload,"Nama Petugas"
"	00901000440","SYARIPUDIN AMIN","NYENGSERET B/122-145/198",202611,524,532,0,8,7,14,2A3,-,Normal,EDI,A19S-072378,S,TC101,C5,B05,"BSP06 BARAT 1","BOJONGLOA KIDUL",SITUSAEUR,2026-11-01,2026-11-04,EDI`;

    const parsed = importDataService.parseLapDataMeterCsv(rawLine);
    expect(parsed.length).toBe(1);
    expect(parsed[0].nolg).toBe("00901000440");
    expect(parsed[0].nama).toBe("SYARIPUDIN AMIN");
    expect(parsed[0].thbl).toBe("202611");
    expect(parsed[0].stml).toBe(524);
    expect(parsed[0].stma).toBe(532);
    expect(parsed[0].pakaiM3).toBe(8);
    expect(parsed[0].pakaiLalu).toBe(7);
    expect(parsed[0].trf).toBe("2A3");
    expect(parsed[0].tmss).toBe("-");
    expect(parsed[0].ketCatat).toBe("Normal");
    expect(parsed[0].petugasId).toBe("EDI");
    expect(parsed[0].ruteKode).toBe("TC101");
    expect(parsed[0].zonaWil).toBe("C5");
    expect(parsed[0].kdZonasi).toBe("B05");
  });

  test("3. Parse PBPK.csv accurately extracts all 26 official PDAM PB and PK rows", () => {
    expect(fs.existsSync(pbpkCsvPath)).toBe(true);
    const csvContent = fs.readFileSync(pbpkCsvPath, "utf-8");
    const rows = importDataService.parsePbpkCsv(csvContent);

    expect(rows.length).toBe(26);

    // Verify first row: 101900821 YUYUN YUNINGSIH PB
    expect(rows[0].nolg).toBe("101900821");
    expect(rows[0].nama).toBe("YUYUN YUNINGSIH");
    expect(rows[0].mutasian).toBe("PB");
    expect(rows[0].kd_goltarif).toBe("2A4");
    expect(rows[0].nometer).toBe("106972");

    // Verify a PK (Pemasangan Kembali) row: 802300160 MESJID ASALAM PK
    const pkRow = rows.find((r) => r.nolg === "802300160");
    expect(pkRow).toBeDefined();
    expect(pkRow?.nama).toBe("MESJID ASALAM");
    expect(pkRow?.mutasian).toBe("PK");
    expect(pkRow?.kd_goltarif).toBe("1A");

    // Check ratio of PB vs PK
    const pbCount = rows.filter((r) => r.mutasian === "PB").length;
    const pkCount = rows.filter((r) => r.mutasian === "PK").length;
    expect(pbCount).toBe(22);
    expect(pkCount).toBe(4);
  });

  test("4. GET /api/import/sample/pbpk returns parsed rows from packages/db/data/raw/PBPK.csv", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/import/sample/pbpk")
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.total).toBe(26);
    expect(json.rows.length).toBeGreaterThan(0);
    expect(json.rows[0].nolg).toBe("101900821");
  });

  test("4b. GET /api/import/sample/lapdatameter returns parsed rows from lapdatametertes.csv", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/import/sample/lapdatameter")
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.total).toBeGreaterThan(0);
    expect(json.rows.length).toBeGreaterThan(0);
    expect(json.rows[0].nolg).toBe("00901000440");
    expect(json.rows[0].thbl).toBe("202611");
    expect(json.rows[0].stml).toBe(524);
    expect(json.rows[0].stma).toBe(532);
    expect(json.rows[0].pakaiM3).toBe(8);
    expect(json.rows[0].petugasId).toBe("EDI");
  });

  test("5. GET /api/import/spec returns specification contract for mobile developers", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/import/spec")
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.specification.photoNaming.pattern).toBe("{THBL}_{JENIS}_{NOLG}.jpg");
    expect(json.specification.photoNaming.examples).toContain("202601_stand_00703600750.jpg");
    expect(json.specification.photoNaming.examples).toContain("202601_segel_00703600750.jpg");
    expect(json.specification.photoNaming.examples).toContain("202601_rumah_00703600750.jpg");
  });

  test("6. Sidebar navGroups includes 'import-data' section with 5 functional modules", () => {
    const importGroup = navGroups.find((g) => g.id === "import-data");
    expect(importGroup).toBeDefined();
    expect(importGroup?.title).toBe("Import Data");

    const items = importGroup?.items || [];
    expect(items.length).toBe(5);

    const hrefs = items.map((i) => ("href" in i ? i.href : ""));
    expect(hrefs).toEqual([
      "/import/foto-backup",
      "/import/data",
      "/import/lapdatameter",
      "/import/r-nomor",
      "/import/pbpk",
    ]);

    const titles = items.map((i) => i.title);
    expect(titles).toEqual([
      "Foto Backup",
      "Import Data",
      "Lap Data Meter",
      "R Nomor",
      "Import PBPK",
    ]);
  });

  test("7. Endpoints require authentication for security", async () => {
    const res1 = await app.handle(
      new Request("http://localhost/api/import/foto-backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: [{ fileName: "202601_stand_00703600750.jpg", fileData: "dummy" }],
        }),
      })
    );
    expect(res1.status).toBe(401);

    const res2 = await app.handle(
      new Request("http://localhost/api/import/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ thbl: "202601", nolg: "00703600750", stml: 120, stma: 138 }],
        }),
      })
    );
    expect(res2.status).toBe(401);

    const res3 = await app.handle(
      new Request("http://localhost/api/import/r-nomor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ nolg: "00703600750", tglPutus: "2026-01-20" }],
        }),
      })
    );
    expect(res3.status).toBe(401);

    const res4 = await app.handle(
      new Request("http://localhost/api/import/pbpk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periode: "202601",
          rows: [{ nolg: "00703600750", nama: "YUYUN", alamat: "JL", mutasian: "PB" }],
        }),
      })
    );
    expect(res4.status).toBe(401);
  });

  test("8. Verify generated 60 mock photos fixture (20 stand, 20 segel, 20 rumah) are parseable", () => {
    const mockPhotosDir = path.resolve(process.cwd(), "packages/db/data/mock-photos");
    expect(fs.existsSync(mockPhotosDir)).toBe(true);

    const files = fs.readdirSync(mockPhotosDir).filter((f) => f.endsWith(".jpg"));
    expect(files.length).toBe(60);

    const standFiles = files.filter((f) => f.includes("_stand_"));
    const segelFiles = files.filter((f) => f.includes("_segel_"));
    const rumahFiles = files.filter((f) => f.includes("_rumah_"));

    expect(standFiles.length).toBe(20);
    expect(segelFiles.length).toBe(20);
    expect(rumahFiles.length).toBe(20);

    // Pastikan setiap file memenuhi pola baku dan tervalidasi
    for (const file of files) {
      const parsed = importDataService.parsePhotoFileName(file);
      expect(parsed).not.toBeNull();
      expect(parsed?.thbl).toBe("202601");
      expect(["stand", "segel", "rumah"]).toContain(parsed?.jenis ?? "");
    }
  });

  test("9. Dynamic import: photo backup works seamlessly even if ONLY stand photos are provided", () => {
    // Simulasi import hanya foto stand untuk 2 pelanggan
    const onlyStandFiles = [
      "202601_stand_00302600011.jpg",
      "202601_stand_00401000220.jpg",
    ];

    for (const f of onlyStandFiles) {
      const parsed = importDataService.parsePhotoFileName(f);
      expect(parsed).not.toBeNull();
      expect(parsed?.jenis).toBe("stand");
    }
  });

  test("10. POST /api/import/lookup-pelanggan matches NOLG with database master data", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/import/lookup-pelanggan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nolgs: ["00302600011", "00401000220"],
        }),
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBe(2);

    const maryati = json.data.find((d: any) => d.nolg === "00302600011");
    expect(maryati).toBeDefined();
    expect(maryati.nama).toBe("MARYATI SALAM");
    expect(maryati.alamat).toBe("JL.NARIPAN 1A");
  });

  test("11. Verifikasi grid and cek foto backend services return fotoSegelUrl", async () => {
    const { verifikasiGridService } = await import(
      "../packages/backend/src/services/pencatat-meter/cater/verifikasi-grid.service"
    );
    const { caterProgressService } = await import(
      "../packages/backend/src/services/pencatat-meter/cater/cater-progress.service"
    );

    // Test getLaporanRows returns fotoSegelUrl property
    const gridRes = await verifikasiGridService.getLaporanRows({
      periode: "202601",
      page: 1,
      pageSize: 10,
    });
    expect(gridRes).toBeDefined();
    expect(Array.isArray(gridRes.rows)).toBe(true);

    const itemWithSegel = gridRes.rows.find((item: any) => Boolean(item.fotoSegelUrl));
    if (itemWithSegel) {
      expect(typeof itemWithSegel.fotoSegelUrl).toBe("string");
      expect(itemWithSegel.fotoSegelUrl).toContain("segel");
    }

    // Test getCekFotoList returns fotoSegelUrl property
    const cekFotoRes = await caterProgressService.getCekFotoList("202601", undefined, undefined, 10, 0);
    expect(cekFotoRes).toBeDefined();
    expect(Array.isArray(cekFotoRes.items)).toBe(true);
    const itemCekSegel = cekFotoRes.items.find((item) => Boolean(item.fotoSegelUrl));
    if (itemCekSegel) {
      expect(typeof itemCekSegel.fotoSegelUrl).toBe("string");
    }
  });

  test("12. Detail pelanggan (info-pelanggan) returns fotoSegelUrl in riwayatBaca", async () => {
    const { pelangganService } = await import(
      "../packages/backend/src/services/langganan/pelanggan/pelanggan.service"
    );

    // 00406100410 is one of the test customers that has segel photo in 202601
    const detail = await pelangganService.getDetailPelanggan("00406100410");
    expect(detail).toBeDefined();
    expect(detail.pelanggan).toBeDefined();
    expect(Array.isArray(detail.riwayatBaca)).toBe(true);

    const baca202601 = detail.riwayatBaca.find((r) => r.thbl === "202601");
    if (baca202601) {
      expect(baca202601.fotoSegelUrl).toBeDefined();
      expect(typeof baca202601.fotoSegelUrl).toBe("string");
      expect(baca202601.fotoSegelUrl).toContain("segel");
    }
  });

  test("13. importLapDataMeter successfully maps and saves reading data into cater_baca_meter table", async () => {
    const sampleItems = [
      {
        thbl: "202611",
        nolg: "00901000440",
        nama: "SYARIPUDIN AMIN",
        alamat: "NYENGSERET B/122-145/198",
        stml: 524,
        stma: 532,
        pakaiM3: 8,
        pakaiLalu: 7,
        trf: "2A3",
        tmss: "-",
        ketCatat: "Normal",
        petugasId: "EDI",
        ruteKode: "TC101",
        tglCatat: "2026-11-01",
      },
    ];

    const result = await importDataService.importLapDataMeter(sampleItems, "FORCE_RESET_OVERWRITE");
    expect(result.sukses).toBe(1);
    expect(result.gagal).toBe(0);

    // Verify row in database cater_baca_meter
    const { db, caterBacaMeter } = await import("@cater/db");
    const { eq, and } = await import("drizzle-orm");
    const [row] = await db
      .select()
      .from(caterBacaMeter)
      .where(
        and(
          eq(caterBacaMeter.thbl, "202611"),
          eq(caterBacaMeter.nolg, "00901000440")
        )
      );

    expect(row).toBeDefined();
    expect(row.thbl).toBe("202611");
    expect(row.nolg).toBe("00901000440");
    expect(parseFloat(row.stml)).toBe(524);
    expect(parseFloat(row.stma)).toBe(532);
    expect(parseFloat(row.pakaiM3)).toBe(8);
    expect(row.sumberCatat).toBe("LAPDATAMETER");

    // Clean up test record so database stays clean
    await db
      .delete(caterBacaMeter)
      .where(
        and(
          eq(caterBacaMeter.thbl, "202611"),
          eq(caterBacaMeter.nolg, "00901000440")
        )
      );
  });
});
