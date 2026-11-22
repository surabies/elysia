Latihan jalur migrasi pada tabel yang sudah berisi data, di branch yang sekarang:
a. Jalankan down migration 0019 (lepas tabel, kolom, trigger, dan fungsi anomali), lalu verifikasi dengan query bahwa semuanya hilang dan jumlah baris cater_baca_meter per periode tidak berubah.
b. Jalankan persis urutan rencana database utama: drizzle-kit migrate (migrasi 0019), seeder aturan, lalu skrip backfill-anomali-massal.ts (bukan evaluasi saat seed).
c. Bandingkan hasilnya dengan kondisi sebelum latihan: total anomali, peringatan, normal, dan rincian per kode utama untuk 202610 dan 202611 harus identik dengan hasil evaluasi saat seed (1.692 dan 2.500 anomali, dan seterusnya). Laporkan selisih sekecil apa pun beserta penyebabnya.
d. Jalankan ulang Gerbang A-D, query integritas, tsc, dan drizzle-kit check setelah backfill.
e. Ukur dan laporkan durasi migrasi dan backfill, serta ukuran batch yang dipakai.
f. Pastikan DATABASE_URL tiap perintah menunjuk branch dan lampirkan buktinya. Database utama tidak boleh disentuh.
g. Di laporan akhir cantumkan batasan: latihan ini memakai data seed. Tulis pemeriksaan satu kali sebelum eksekusi utama yang perlu saya lakukan (membuat branch dari database utama dan menjalankan urutan yang sama), lengkap dengan langkah-langkahnya.
