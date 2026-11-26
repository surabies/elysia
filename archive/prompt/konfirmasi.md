1. Anomali Sejati / Anomali Validasi Meter (is_anomali = true):
   • Diatur oleh aturan di tabel aturan_anomali yang memiliki flag dihitung_sebagai_anomali = true.
   • Terdiri dari 10 kode anomali:
   • ANOM_METER_MUNDUR (Meter terbalik)
   • ANOM_LONJAKAN_M3 (Lonjakan besar > 75 m³)
   • ANOM_LONJAKAN_PERSEN (Kenaikan tajam ≥ 100%)
   • ANOM_TIDAK_ADA_AIR_MENDADAK
   • ANOM_TIDAK_ADA_AIR_BERKEPANJANGAN
   • ANOM_DEVIASI_RING3 (Deviasi ekstrim > 80%)
   • ANOM_DEVIASI_RING2 (Deviasi moderat 50% s.d. 80%)
   • ANOM_PENURUNAN_PERSEN
   • ANOM_PEMAKAIAN_NOL  
    • ANOM_KERUSAKAN_METER (Kerusakan fisik / segel lepas)
   • Total Riil di Database:
   • Oktober 2026: Tepat 2.500 kasus
   • November 2026: Tepat 1.692 kasus
2. Catatan Lapangan & Peringatan Ringan (is*anomali = false, kode WARN*\*):
   • Diatur oleh aturan yang memiliki flag dihitung_sebagai_anomali = false.
   • Terdiri dari:
   • WARN_KENDALA_AKSES: Pagar terkunci, meter tertimbun, anjing galak, dll. (3.772 kasus di Oktober, 2.482 di November).
   • WARN_DEVIASI_RING1: Fluktuasi wajar 30% s.d. 50% (1.470 kasus di Oktober, 910 di November).
   • Total Riil di Database: 5.242 kasus (Oktober) dan 3.392 kasus (November).
