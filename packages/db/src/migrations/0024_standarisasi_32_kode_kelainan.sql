-- Standarisasi 32 Kode Kelainan Resmi (docs/kelainan/kode-kelainan.md) & Penyatuan Kode Normal Tunggal ('-')
INSERT INTO "master_kondisi_catat" ("kode_tmss", "nama", "kategori", "mode_hitung", "is_kendala_akses", "trigger_baca_mandiri", "deskripsi", "aktif")
VALUES
  ('-', 'Normal', 'TERBACA', 'SELISIH_FISIK', false, false, 'Stand meter terbaca normal dan jelas di lokasi', true),
  ('0', 'REV.PENGADUAN', 'TERBACA', 'SELISIH_FISIK', false, false, 'Revisi angka stand meter berdasarkan tindak lanjut pengaduan pelanggan', true),
  ('1', 'TK', 'KENDALA_AKSES', 'TAKSASI_HISTORI', true, true, 'Tanah Kosong / bangunan belum dihuni sehingga meter belum dapat diakses langsung', true),
  ('2', 'DK', 'KENDALA_AKSES', 'TAKSASI_HISTORI', true, true, 'Dikunci: pagar atau rumah terkunci sehingga petugas tidak bisa masuk', true),
  ('3', 'MTA', 'KERUSAKAN_FISIK', 'TAKSASI_HISTORI', false, false, 'Meter Tak Ada: water meter hilang atau dicopot di lapangan', true),
  ('4', 'MB', 'TERBACA', 'METER_BARU', false, false, 'Meter Baru (Pergantian water meter baru, dihitung dari stand angkat + meter baru atau override)', true),
  ('5', 'TTB', 'KENDALA_AKSES', 'TAKSASI_HISTORI', true, true, 'Tidak Terbaca: meter tertimbun tanah, lumpur, atau kotoran', true),
  ('6', 'BMK/BMB', 'KERUSAKAN_FISIK', 'TAKSASI_HISTORI', false, false, 'Bodi Meter Kotor / Bodi Meter Buram: kaca meter berembun, kuning, atau kabur', true),
  ('7', 'METER MATI AIR ADA', 'KERUSAKAN_FISIK', 'TAKSASI_HISTORI', false, false, 'Meter macet / jarum register tidak berputar padahal air tetap mengalir', true),
  ('8', 'TIDAK ADA AIR', 'KENDALA_TEKNIS', 'NOL', false, false, 'Aliran air mati atau tidak mengalir sama sekali di wilayah layanan (pemakaian = 0 m³)', true),
  ('9', 'LOS METER', 'PELANGGARAN', 'TAKSASI_HISTORI', false, false, 'Sambungan pipa langsung tanpa melalui water meter', true),
  ('AA', 'Meter Dalam Air', 'KENDALA_AKSES', 'TAKSASI_HISTORI', true, true, 'Meteran terendam air got, bak kontrol penuh, atau genangan galian', true),
  ('C', 'MT DIBOLAK BALIK', 'PELANGGARAN', 'TAKSASI_HISTORI', false, false, 'Indikasi pelanggaran posisi water meter sengaja dibolak-balik untuk menurunkan stand', true),
  ('D', 'DI CABUT', 'PELANGGARAN', 'NOL', false, false, 'Meteran dicabut resmi oleh dinas / tim penertiban (pemakaian ditagih = 0 m³)', true),
  ('E', 'TERHALANG', 'KENDALA_AKSES', 'TAKSASI_HISTORI', true, true, 'Meter terhalang material, tumpukan barang, kendaraan, atau konstruksi bangunan', true),
  ('F', 'METER MUNDUR', 'KERUSAKAN_FISIK', 'TAKSASI_HISTORI', false, false, 'Angka stand meter tercatat berjalan mundur dibanding periode lalu', true),
  ('G', 'PEMBULATAN', 'TERBACA', 'SELISIH_FISIK', false, false, 'Penyesuaian pembulatan angka stand pembacaan meter', true),
  ('H', 'TIDAK DIPAKAI', 'TERBACA', 'TAKSASI_HISTORI', false, false, 'Stand meter tetap / pelanggan sedang tidak menggunakan air', true),
  ('I', 'MTK', 'KENDALA_AKSES', 'TAKSASI_HISTORI', true, true, 'Meter Terkunci di dalam boks pelindung sehingga angka tidak tampak jelas', true),
  ('J', 'DIOPREK/DICOLOK LIDI', 'PELANGGARAN', 'TAKSASI_HISTORI', false, false, 'Indikasi perusakan segel / jarum meter diganjal atau dicolok benda asing', true),
  ('K', 'STAN CICILAN', 'TERBACA', 'SELISIH_FISIK', false, false, 'Pencatatan stand meter dengan skema cicilan lonjakan pemakaian', true),
  ('M', 'KELEBIHAN', 'TERBACA', 'KREDIT_TAKSASI', false, false, 'Stand sistem lebih tinggi dari stand fisik meter akibat akumulasi taksasi bulan sebelumnya', true),
  ('N', 'STAND TEMPEL', 'KENDALA_AKSES', 'TAKSASI_HISTORI', true, true, 'Pelanggan menempelkan catatan angka stand di pagar/pintu rumah', true),
  ('O', 'METER RUSAK', 'KERUSAKAN_FISIK', 'TAKSASI_HISTORI', false, false, 'Kerusakan fisik mekanis atau kaca pecah pada water meter', true),
  ('P', 'REV.PENCATAT', 'TERBACA', 'SELISIH_FISIK', false, false, 'Revisi angka stand awal/akhir berdasarkan laporan koreksi petugas catat lapangan', true),
  ('Q', 'ADA ANJING', 'KENDALA_AKSES', 'TAKSASI_HISTORI', true, true, 'Terdapat anjing penjaga yang menghalangi keselamatan petugas lapangan', true),
  ('R', 'RMH/TANAH KSG', 'KENDALA_AKSES', 'TAKSASI_HISTORI', true, true, 'Rumah atau tanah kosong tidak berpenghuni saat dikunjungi petugas', true),
  ('T', 'METER TERBALIK', 'KERUSAKAN_FISIK', 'TAKSASI_HISTORI', false, false, 'Posisi pemasangan water meter terbalik terhadap arah aliran pipa', true),
  ('U', 'MUDA KEMBALI', 'TERBACA', 'MUDA_KEMBALI', false, false, 'Angka meter roll-over melewati batas maksimum register (mis. 9999 -> 0000 / 99999 -> 00000)', true),
  ('V', 'JAUH', 'KENDALA_AKSES', 'TAKSASI_HISTORI', true, true, 'Lokasi meter berada jauh di dalam persil/area tertutup yang sulit dijangkau langsung', true),
  ('W', 'STAND-KONSUMEN/PENGADUAN', 'TERBACA', 'SELISIH_FISIK', false, true, 'Angka stand dari pelaporan konsumen melalui layanan pengaduan pelanggan', true),
  ('Z', 'STAND-KONSUMEN', 'TERBACA', 'TAKSASI_HISTORI', false, true, 'Angka meter dilaporkan mandiri oleh konsumen melalui foto/WA/portal warga', true)
ON CONFLICT ("kode_tmss") DO UPDATE SET
  "nama" = EXCLUDED."nama",
  "kategori" = EXCLUDED."kategori",
  "mode_hitung" = EXCLUDED."mode_hitung",
  "is_kendala_akses" = EXCLUDED."is_kendala_akses",
  "trigger_baca_mandiri" = EXCLUDED."trigger_baca_mandiri",
  "deskripsi" = EXCLUDED."deskripsi";--> statement-breakpoint
ALTER TABLE "cater_baca_meter" ALTER COLUMN "tmss" SET DEFAULT '-';--> statement-breakpoint
UPDATE "cater_baca_meter" SET "tmss" = '-' WHERE TRIM(COALESCE("tmss", '')) = '';--> statement-breakpoint
UPDATE "cater_baca_meter" SET "ket_catat" = 'METER MATI AIR ADA' WHERE "ket_catat" = 'MATI ADA AIR';--> statement-breakpoint
UPDATE "cater_baca_meter" SET "ket_catat" = 'RMH/TANAH KSG' WHERE "ket_catat" = 'RUMAH KOSONG';--> statement-breakpoint
UPDATE "cater_baca_meter" SET "ket_catat" = 'DI CABUT' WHERE "ket_catat" = 'DICABUT';--> statement-breakpoint
DELETE FROM "aturan_kondisi_meter_map" WHERE "kode_tmss" = ' ';--> statement-breakpoint
DELETE FROM "master_kondisi_catat" WHERE "kode_tmss" = ' ';
