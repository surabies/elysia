import type { InfoPelanggan } from "../types/TipeInfoPelanggan";
import { keYYYYMM, susunRiwayatPemakaian } from "../lib/RiwayatPemakaian";

type PelangganDetailResponse = {
  success: boolean;
  data?: {
    pelanggan: {
      nolg: string;
      nprs?: string | null;
      nama: string;
      alamat: string;
      rt?: string | null;
      rw?: string | null;
      noTelp?: string | null;
      isMbr?: boolean;
      status: string;
      tarifKode?: string | null;
      tarifNama?: string | null;
      ruteKode?: string | null;
      noUrutRute?: number | null;
      noMeter?: string | null;
      ukuranMeter?: string | null;
      titikLokasi?: { x: number; y: number } | null;
    };
    riwayatBaca: Array<{
      id: string;
      thbl: string;
      stml: string | number | null;
      stma: string | number | null;
      pakaiM3: string | number | null;
      pakaiTagih?: string | number | null;
      ketCatat?: string | null;
      fotoMeterUrl?: string | null;
      fotoRumahUrl?: string | null;
      lokasiGps?: { x: number; y: number } | null;
      petugasId?: string | null;
      petugasNama?: string | null;
      ruteKode?: string | null;
      statusVerifikasi?: string | null;
      tglCatat?: string | null;
    }>;
    riwayatDrd: Array<{
      id: string;
      thbl: string;
      pakaiM3: string | number | null;
      jmlHargaAir?: string | number | null;
      totalTagihan: string | number | null;
      statusLunas?: boolean;
    }>;
  };
  error?: string;
};

function gabungAlamat(p: {
  alamat?: string | null;
  rt?: string | null;
  rw?: string | null;
}): string | null {
  const bagian = [
    p.alamat,
    p.rt || p.rw ? `RT ${p.rt ?? "-"}/RW ${p.rw ?? "-"}` : null,
  ].filter((v): v is string => Boolean(v && v.trim()));
  return bagian.length ? bagian.join(", ") : null;
}

export async function ambilInfoPelanggan(
  nomor: string,
  periode: string
): Promise<InfoPelanggan> {
  const nomorBersih = nomor.trim();
  const periodeBersih = keYYYYMM(periode);

  const res = await fetch(`/api/cater/pelanggan/${encodeURIComponent(nomorBersih)}`);
  let json: PelangganDetailResponse;

  try {
    json = await res.json();
  } catch {
    throw new Error("Gagal mengurai respons server.");
  }

  if (!res.ok || !json.success || !json.data) {
    throw new Error(
      json.error ?? `Pelanggan dengan No. Langganan ${nomorBersih} tidak ditemukan.`
    );
  }

  const { pelanggan: pel, riwayatBaca, riwayatDrd } = json.data;

  // Temukan pembacaan terpilih atau bacaan terbaru
  const bacaanTerpilih = periodeBersih
    ? riwayatBaca.filter((b) => keYYYYMM(b.thbl) === periodeBersih)
    : [];
  const historiSebelum = periodeBersih
    ? riwayatBaca.filter((b) => keYYYYMM(b.thbl) < periodeBersih)
    : [];

  const { baca, riwayat } = susunRiwayatPemakaian({
    periode: periodeBersih,
    pembacaanTerpilih: bacaanTerpilih.map((b) => ({
      periode: b.thbl,
      standLalu: b.stml != null ? Number(b.stml) : null,
      standAkhir: b.stma != null ? Number(b.stma) : null,
      pemakaianM3: b.pakaiM3 != null ? Number(b.pakaiM3) : null,
      tagihan: Number(riwayatDrd.find((d) => d.thbl === b.thbl)?.totalTagihan ?? 0) || null,
      raw: b,
    })),
    pembacaanTerbaru: riwayatBaca.map((b) => ({
      periode: b.thbl,
      standLalu: b.stml != null ? Number(b.stml) : null,
      standAkhir: b.stma != null ? Number(b.stma) : null,
      pemakaianM3: b.pakaiM3 != null ? Number(b.pakaiM3) : null,
      tagihan: Number(riwayatDrd.find((d) => d.thbl === b.thbl)?.totalTagihan ?? 0) || null,
      raw: b,
    })),
    historiSebelum: historiSebelum.map((b) => ({
      periode: b.thbl,
      standLalu: b.stml != null ? Number(b.stml) : null,
      standAkhir: b.stma != null ? Number(b.stma) : null,
      pemakaianM3: b.pakaiM3 != null ? Number(b.pakaiM3) : null,
      tagihan: Number(riwayatDrd.find((d) => d.thbl === b.thbl)?.totalTagihan ?? 0) || null,
      raw: b,
    })),
  });

  const rawBaca = baca?.raw;
  const drdBaca = rawBaca
    ? riwayatDrd.find((d) => d.thbl === rawBaca.thbl)
    : null;

  const periodeCatat = keYYYYMM(rawBaca?.thbl ?? periodeBersih);
  const adaCatat = Boolean(rawBaca);

  // Koordinat lokasi
  const geo = (rawBaca?.lokasiGps ?? pel.titikLokasi) as { x: number; y: number } | null;
  const lat = geo?.y != null ? Number(geo.y) : null;
  const lng = geo?.x != null ? Number(geo.x) : null;

  return {
    pelanggan: {
      nomorLangganan: pel.nolg,
      nama: pel.nama ?? "",
      alamat: gabungAlamat(pel),
      golongan: pel.tarifNama ?? pel.tarifKode ?? null,
      nomorMeter: pel.noMeter ?? null,
      ukuranMeter: pel.ukuranMeter ?? "1/2 inch",
      noHp: pel.noTelp ?? null,
      status: pel.status ?? null,
    },
    catat: adaCatat && rawBaca
      ? {
          periode: periodeCatat,
          standLalu: rawBaca.stml != null ? Number(rawBaca.stml) : null,
          standAkhir: rawBaca.stma != null ? Number(rawBaca.stma) : null,
          pemakaianM3: rawBaca.pakaiM3 != null ? Number(rawBaca.pakaiM3) : null,
          biaya: drdBaca?.totalTagihan != null ? Number(drdBaca.totalTagihan) : null,
          kondisi: rawBaca.ketCatat ?? null,
          petugas: rawBaca.petugasNama ?? rawBaca.petugasId ?? null,
          kodeRute: rawBaca.ruteKode ?? pel.ruteKode ?? null,
          waktuCatat: rawBaca.tglCatat ?? null,
          waktuUpload: null,
        }
      : null,
    riwayat,
    lokasi: lat != null && lng != null ? { lat, lng } : null,
    foto: {
      segel: null,
      stand: rawBaca?.fotoMeterUrl ?? null,
      rumah: rawBaca?.fotoRumahUrl ?? null,
    },
  };
}
