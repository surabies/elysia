# Error Log & Resolution Status

## Status: RESOLVED (Telah Diperbaiki)

### Masalah Awal (Reported Error):
```
Encountered two children with the same key, `user-superadmin`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted.
    at PilihPetugas (src/features/dashboard/pengaduan/components/bersama/PilihPetugas.tsx:32:16)
    at PanelTindakan (src/features/dashboard/pengaduan/components/detail-tiket/PanelTindakan.tsx:59:9)
    at DetailTiket (src/features/dashboard/pengaduan/components/detail-tiket/RincianTiket.tsx:123:13)
```

### Akar Masalah:
Pada `pengaduan.service.ts` method `listPetugasPengaduan`, query database melakukan `innerJoin(userRoles, ...)` dengan `.where(inArray(userRoles.role, rolesLayak))`.
Ketika seorang user memiliki lebih dari satu role yang layak (misalnya `SUPERADMIN` sekaligus `PELAKSANA` atau `VERIFIKATOR`), query menghasilkan dua baris berbeda untuk user yang sama. Akibatnya array mengembalikan ID user yang sama (`user-superadmin`) sebanyak dua kali, sehingga komponen React `<option key={p.id}>` merender elemen dengan key ganda.

### Tindakan Perbaikan:
1. **Backend (`pengaduan.service.ts`):** Mengelompokkan hasil query menggunakan `Map<string, Petugas>` berdasarkan `user.id` unik sehingga setiap petugas hanya muncul tepat 1 kali dalam daftar penugasan.
2. **Frontend (`PilihPetugas.tsx`):** Menambahkan index disambiguation pada `key={`${p.id}-${idx}`}` sebagai proteksi sekunder di layer presentasi.
3. **Verifikasi:** Pengujian `bun test tests/peta-pengaduan.test.ts` dan typecheck `@cater/web` berhasil 100% tanpa ada console warning atau error duplikasi.
