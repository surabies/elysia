"use client";

// features/dashboard/verifikasi/components/panelLapangan.tsx — panel detail
// halaman verifikasi laporan petugas lapangan.
//
// MURNI PENAMPIL DETAIL. Verifikasi V1/V2/V3 langsung dijalankan dari menu
// klik kanan; dialog tindakan dikelola halaman agar terbuka tanpa menunggu
// panel detail selesai memuat.
//
import * as React from "react";
import {
  CheckmarkCircle02Icon,
  CursorPointer01Icon,
} from "@/features/dashboard/shared/icons/IkonLucide";
import { HugeiconsIcon } from "@/features/dashboard/shared/icons/IconRenderer";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTanggal } from "@/features/public/lib/Format";
import { ambilSatu, ApiError } from "@/features/dashboard/shared/api/ApiDashboard";
import { LABEL_KONDISI_CATAT } from "@/features/dashboard/verifikasi/lib/LabelPencatatan";
import { label } from "@/features/dashboard/verifikasi/lib/Label";
import type { LaporanHarianDetail } from "../../types/TipeVerifikasi";
import { tahapLaporanHarian, ringVerif } from "../../types/TipeVerifikasi";
import {
  PanelKosong,
  RingkasanPelanggan,
  Seksi,
} from "./KomponenPanel";
import { FotoSebelumnya } from "../foto/FotoSebelumnya";
import { TabFoto } from "../foto/TabFoto";
import { PetaLokasi } from "../PetaLokasi";
import { TEKS_RING } from "../../types/WarnaTahap";
import { tentukanHasilPembacaan } from "../../lib/HasilPembacaan";

/// Baris progres ring V1/V2/V3 — penampil murni. Warna per ring SAMA dengan
/// kolom Ring di tabel, dan ketiganya diperlakukan setara.
function ProgresRing({ detail }: { detail: LaporanHarianDetail }) {
  const ring = ringVerif(detail);
  const baris: {
    label: string;
    nama: string | null;
    tanggal?: string | null;
    warna: string;
  }[] = [
    {
      label: "V1 · Supervisor",
      nama: ring.v1,
      tanggal: detail.verif1At,
      warna: TEKS_RING[1],
    },
    {
      label: "V2 · Manager",
      nama: ring.v2,
      tanggal: detail.verif2At,
      warna: TEKS_RING[2],
    },
    {
      label: "V3 · Senior Manager",
      nama: ring.v3,
      tanggal: detail.verif3At,
      warna: TEKS_RING[3],
    },
  ];
  return (
    <div className="flex flex-col divide-y divide-border/60">
      {baris.map((b) => (
        <div
          key={b.label}
          className="flex flex-col gap-0.5 py-1.5 first:pt-0 last:pb-0"
        >
          <span className="text-label-12 font-semibold tracking-wide text-muted-foreground uppercase">
            {b.label}
          </span>
          {b.nama ? (
            <span
              className={`inline-flex items-center gap-1 text-label-12 font-medium ${b.warna}`}
            >
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                strokeWidth={2}
                className="size-3 shrink-0"
                aria-hidden
              />
              {b.nama}
              {b.tanggal ? ` · ${formatTanggal(b.tanggal)}` : ""}
            </span>
          ) : (
            <span className="text-copy-13 text-muted-foreground">—</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function PanelLapangan({
  id,
  refreshKey,
  onLoadingChange,
}: {
  id: string | null;
  refreshKey: number;
  onLoadingChange: (loading: boolean) => void;
}) {
  const [detail, setDetail] = React.useState<LaporanHarianDetail | null>(null);
  const [galat, setGalat] = React.useState<string | null>(null);
  const [memuat, setMemuat] = React.useState(false);
  React.useEffect(() => {
    if (!id) {
      onLoadingChange(false);
      return;
    }
    let batal = false;
    setMemuat(true);
    onLoadingChange(true);
    setGalat(null);
    (async () => {
      try {
        const row = await ambilSatu<LaporanHarianDetail>(
          `/laporan-harian/${id}`,
        );
        if (batal) return;
        setDetail(row);
        setGalat(null);
      } catch (err) {
        if (!batal)
          setGalat(
            err instanceof ApiError
              ? err.message
              : "Gagal memuat detail laporan.",
          );
      }
      finally {
        if (!batal) {
          setMemuat(false);
          onLoadingChange(false);
        }
      }
    })();
    return () => {
      batal = true;
    };
  }, [id, refreshKey, onLoadingChange]);

  if (!id) {
    return (
      <PanelKosong
        icon={CursorPointer01Icon}
        pesan="Klik baris untuk melihat detail; klik kanan baris untuk aksi verifikasi (V1/V2/V3, cek ulang, batalkan)."
      />
    );
  }
  if (!detail && !galat) {
    return (
      <div className="flex flex-col gap-2 px-2 py-2">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }
  if (!detail) {
    return (
      <p className="p-4 text-center text-copy-13 text-destructive">
        {galat ?? "Detail tidak ditemukan."}
      </p>
    );
  }

  const tahap = tahapLaporanHarian(detail);
  const nama = detail.pelanggan?.nama ?? detail.namaPelanggan ?? "Tanpa nama";
  const alamat = detail.pelanggan?.alamat ?? detail.alamatPelanggan;
  const kondisiAktif = detail.kondisiRevisi ?? detail.kondisi;
  const isMB = kondisiAktif === "MB";
  // Tiga angka yang sama di panel Petugas dan Pelanggan.
  const pembacaan = tentukanHasilPembacaan(detail);

  return (
    <div className="flex min-w-0 flex-col gap-2 px-2 py-2" aria-busy={memuat}>
      {galat && (
        <p role="alert" className="text-label-12 text-destructive">
          {galat}
        </p>
      )}
      <RingkasanPelanggan
        nama={nama}
        nomor={detail.nomorLangganan}
        kondisi={label(LABEL_KONDISI_CATAT, kondisiAktif)}
        alamat={alamat}
        pelangganId={detail.pelanggan?.id}
        catatanPembacaan={
          isMB && detail.standAngkatLama != null
            ? `Stand angkat lama: ${detail.standAngkatLama.toLocaleString("id-ID")}`
            : undefined
        }
        peringatan={
          !detail.pelanggan && (
            <p className="text-copy-13 text-(--verif-v1)">
              Nomor langganan ini belum terhubung ke data pelanggan —
              verifikasi belum bisa dijalankan sebelum pelanggannya
              ter-import.
            </p>
          )
        }
        pembacaan={{
          periode: detail.periode,
          standAwal: pembacaan.standAwal,
          standAkhir: pembacaan.standAkhir,
          pakai: pembacaan.pemakaian,
        }}
      />

      <Seksi judul="Foto laporan periode ini">
        <TabFoto
          varian="panel"
          item={[
            {
              kunci: "stand",
              label: "Stand meter",
              url: detail.fotoStandUrl ?? detail.pembacaan?.fotoBukti,
              keteranganKosong:
                "Laporan petugas dari sistem lama tidak menyertakan foto.",
            },
            {
              kunci: "segel",
              label: "Segel",
              url: detail.fotoSegelUrl,
              keteranganKosong: "Petugas tidak mengirim foto segel.",
            },
            {
              kunci: "rumah",
              label: "Rumah",
              url: detail.fotoRumahUrl,
              keteranganKosong: "Petugas tidak mengirim foto rumah/persil.",
            },
          ]}
        />
      </Seksi>

      <Seksi judul="Foto pembanding periode sebelumnya">
        <FotoSebelumnya
          pelangganId={detail.pelanggan?.id}
          periode={detail.periode}
        />
      </Seksi>

      <Seksi judul="Verifikasi berjenjang">
        <ProgresRing detail={detail} />
      </Seksi>

      <Seksi judul="Lokasi pelanggan">
        <PetaLokasi
          langsung
          lat={detail.pelanggan?.geoLat}
          lng={detail.pelanggan?.geoLong}
        />
      </Seksi>

      {tahap === "RESMI" && (
        <p className="text-copy-13 text-(--verif-v3)">
          Sudah menjadi pembacaan resmi
          {detail.verifiedBy?.name
            ? ` — approve final ${detail.verifiedBy.name}`
            : ""}
          {detail.verifiedAt ? ` (${formatTanggal(detail.verifiedAt)})` : ""}.
        </p>
      )}
      {tahap === "DITOLAK" && (
        <p className="text-copy-13 text-muted-foreground">
          Dikembalikan untuk cek ulang
          {detail.verifiedBy?.name ? ` oleh ${detail.verifiedBy.name}` : ""}
          {detail.catatanVerif ? ` — “${detail.catatanVerif}”` : ""}. Klik kanan
          barisnya untuk memverifikasi ulang bila ternyata benar.
        </p>
      )}
      {detail.catatanVerif && tahap !== "DITOLAK" && (
        <p className="text-copy-13 text-muted-foreground">
          Catatan verifikasi: “{detail.catatanVerif}”
        </p>
      )}
    </div>
  );
}
