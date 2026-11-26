// features/dashboard/pengaduan/hooks/UseRincianTiket.ts —
// SEMUA urusan data halaman detail: ambil tiket, ambil daftar petugas, dan
// pembungkus aksi (`jalankan`) yang mengatur status mengirim, galat, dan
// muat ulang. Mendukung initialDetail & initialPetugas dari SSR agar saat reload
// panel kanan langsung menampilkan detail tiket tanpa berkedip skeleton.
import * as React from "react";
import { ambilSatu, ApiError } from "@/lib/api-dashboard";
import type {
  PengaduanDetail,
  PetugasRingkas,
} from "@/features/dashboard/pengaduan/types/TipePengaduan";

export type JalankanAksi = (aksi: () => Promise<unknown>) => Promise<boolean>;

function pesanGalat(err: unknown, cadangan: string) {
  return err instanceof ApiError ? err.message : cadangan;
}

export function useDetailTiket(
  pengaduanId: string | null,
  onMutated?: () => void,
  initialDetail: PengaduanDetail | null = null,
  initialPetugas: PetugasRingkas[] = []
) {
  const [detail, setDetail] = React.useState<PengaduanDetail | null>(
    initialDetail
  );
  const [petugas, setPetugas] = React.useState<PetugasRingkas[]>(
    initialPetugas
  );
  const [memuat, setMemuat] = React.useState(
    Boolean(pengaduanId) && !initialDetail
  );
  const [galat, setGalat] = React.useState<string | null>(null);
  const [mengirim, setMengirim] = React.useState(false);

  const onMutatedRef = React.useRef(onMutated);
  React.useEffect(() => {
    onMutatedRef.current = onMutated;
  }, [onMutated]);

  const initialIdRef = React.useRef<string | null>(
    initialDetail ? initialDetail.id : null
  );

  const muat = React.useCallback(async () => {
    if (!pengaduanId) {
      setDetail(null);
      setGalat(null);
      return;
    }
    try {
      setDetail(await ambilSatu<PengaduanDetail>(`/pengaduan/${pengaduanId}`));
      setGalat(null);
    } catch (err) {
      setGalat(pesanGalat(err, "Gagal memuat detail tiket."));
    }
  }, [pengaduanId]);

  React.useEffect(() => {
    if (!pengaduanId) {
      setDetail(null);
      setMemuat(false);
      return;
    }
    // Jika data awal dari SSR sudah cocok dengan pengaduanId pertama, lewati fetch ulang saat mount
    if (initialIdRef.current && initialIdRef.current === pengaduanId) {
      initialIdRef.current = null;
      setMemuat(false);
      return;
    }
    let batal = false;
    setMemuat(true);
    void muat().finally(() => {
      if (!batal) setMemuat(false);
    });
    return () => {
      batal = true;
    };
  }, [muat, pengaduanId]);

  React.useEffect(() => {
    if (initialPetugas.length > 0) return;
    let batal = false;
    void (async () => {
      try {
        const rows = await ambilSatu<PetugasRingkas[]>("/pengaduan/petugas");
        if (!batal) setPetugas(rows);
      } catch {
        // Abaikan
      }
    })();
    return () => {
      batal = true;
    };
  }, [initialPetugas.length]);

  const jalankan: JalankanAksi = React.useCallback(
    async (aksi) => {
      setMengirim(true);
      setGalat(null);
      try {
        await aksi();
        await muat();
        onMutatedRef.current?.();
        return true;
      } catch (err) {
        setGalat(pesanGalat(err, "Aksi gagal. Coba lagi."));
        return false;
      } finally {
        setMengirim(false);
      }
    },
    [muat]
  );

  return { detail, petugas, memuat, galat, mengirim, jalankan };
}
