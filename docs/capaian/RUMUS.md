# Dokumentasi Rumus & Domain Engine Capaian Pencatatan

Dokumen ini mendefinisikan rumus matematis murni yang diimplementasikan di `apps/web/src/server/domain/capaian/capaian.engine.ts` untuk menghitung capaian target dan realisasi pembacaan meter PDAM Tirtawening.

---

## 1. Tabel 1: Progress Capaian Bulanan

### 1.1 Hari Kalender
- **Jumlah Hari** dihitung secara dinamis berbasis kalender gregorian (aware terhadap tahun kabisat pada bulan Februari).
- **Desember (Tahun Lalu)**: Ditetapkan 31 hari sebagai baseline pembanding untuk bulan Januari tahun berjalan.

### 1.2 Rasio Pemakaian Air
$$\text{M}^3/\text{SL} = \frac{\text{Realisasi M}^3}{\text{Realisasi SL}}$$
- Pembagian aman terhadap nol: Jika $\text{Realisasi SL} = 0$ atau $\text{Realisasi M}^3 = 0$, hasilnya bernilai `null` (`-`).
- Dibulatkan hingga 2 angka desimal.

$$\text{M}^3/\text{SL}/\text{Hari} = \frac{\text{M}^3/\text{SL}}{\text{Jumlah Hari Kalender}}$$
- Dibulatkan hingga 3 angka desimal.

### 1.3 Delta Bulanan ($\Delta$)
Untuk bulan $n \ge 1$:
$$\Delta\text{SL}_n = \text{Realisasi SL}_n - \text{Realisasi SL}_{n-1}$$
$$\Delta\text{M}^3_n = \text{Realisasi M}^3_n - \text{Realisasi M}^3_{n-1}$$
$$\Delta(\text{M}^3/\text{SL})_n = (\text{M}^3/\text{SL})_n - (\text{M}^3/\text{SL})_{n-1}$$
$$\Delta(\text{M}^3/\text{SL}/\text{Hari})_n = (\text{M}^3/\text{SL}/\text{Hari})_n - (\text{M}^3/\text{SL}/\text{Hari})_{n-1}$$

> [!NOTE]
> Pada baris **Desember Tahun Lalu** ($n = 0$), nilai $\Delta$ berstatus `-` (`null`) karena berfungsi murni sebagai acuan pembanding.

### 1.4 Baris Ringkasan JUMLAH / RATA-RATA (Tabel 1)
- **Total Hari**: $\sum \text{Hari bulan aktif berjalan (Jan s.d. YTD)}$.
- **Rata-rata SL**: $\frac{\sum \text{Realisasi SL}}{\text{Jumlah Bulan Berjalan}}$.
- **Total M³**: $\sum \text{Realisasi M}^3$.
- **M³/SL Tertimbang**: $\frac{\text{Total Realisasi M}^3}{\text{Total Realisasi SL}}$ (Bukan rata-rata aritmatika sederhana dari rasio bulanan, melainkan rasio volume terhadap total pelanggan aktif).
- **Net Delta SL**: $\text{Realisasi SL}_{\text{YTD Terakhir}} - \text{Realisasi SL}_{\text{Desember Tahun Lalu}}$.
- **Net Delta M³**: $\text{Realisasi M}^3_{\text{YTD Terakhir}} - \text{Realisasi M}^3_{\text{Desember Tahun Lalu}}$.

---

## 2. Tabel 2: Target dan Realisasi Capaian

### 2.1 Capaian Persentase
$$\text{Capaian SL (\%)} = \frac{\text{Realisasi SL}}{\text{Target SL}} \times 100\%$$
$$\text{Capaian M}^3\text{ (\%)} = \frac{\text{Realisasi M}^3}{\text{Target M}^3} \times 100\%$$

### 2.2 Debit Aliran (Liter Per Detik - LPS)
$$\text{LPS} = \frac{\text{Realisasi M}^3 \times 1.000}{\text{Hari Acuan LPS} \times 86.400}$$
- $\text{Hari Acuan LPS}$ default bernilai **30 hari** ($30 \times 86.400 = 2.592.000$ detik).
- Parameter ini dapat disesuaikan melalui UI.

### 2.3 Selisih Terhadap Target
$$\text{Selisih M}^3 = \text{Realisasi M}^3 - \text{Target M}^3$$
$$\text{Selisih LPS} = \frac{\text{Selisih M}^3 \times 1.000}{\text{Hari Acuan LPS} \times 86.400}$$

> [!IMPORTANT]
> **Pencegahan Bug Excel**:
> Untuk bulan yang belum berjalan (misal November & Desember dengan realisasi belum ada), nilai **Realisasi**, **Capaian %**, **LPS**, dan **Selisih** menghasilkan `null` (`-`).
> Sistem **DILARANG** menghitung $0 - \text{Target}$ yang menghasilkan nilai minus target semu (misal $-345.000\text{ m}^3$).

### 2.4 Baris Ringkasan & Dua Lapis CAPAIAN (Tabel 2)
1. **Baris JUMLAH**:
   - $\text{Rata-rata Target SL (YTD)} = \frac{\sum_{i=1}^k \text{Target SL}_i}{k}$
   - $\text{Total Target M}^3\text{ (YTD)} = \sum_{i=1}^k \text{Target M}^3_i$
   - $\text{Total Realisasi M}^3\text{ (YTD)} = \sum_{i=1}^k \text{Realisasi M}^3_i$
   - $\text{JUMLAH Selisih M}^3\text{ (YTD)} = \text{Total Realisasi M}^3\text{ (YTD)} - \text{Total Target M}^3\text{ (YTD)}$
2. **Baris CAPAIAN (YTD)**:
   $$\text{Capaian YTD (\%)} = \frac{\sum_{i=1}^k \text{Realisasi M}^3_i}{\sum_{i=1}^k \text{Target M}^3_i} \times 100\%$$
   *(Contoh: Evaluasi bulan berjalan Jan s.d. Okt menghasilkan ~97,0%)*
3. **Baris CAPAIAN (Tahunan)**:
   $$\text{Capaian Tahunan (\%)} = \frac{\sum_{i=1}^k \text{Realisasi M}^3_i}{\sum_{i=1}^{12} \text{Target M}^3_i} \times 100\%$$
   *(Contoh: Realisasi Jan s.d. Okt terhadap target total 12 bulan penuh menghasilkan ~80,6%)*
