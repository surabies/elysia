"use client";

// features/dashboard/verifikasi/components/panelMandiri.tsx — panel detail
// halaman verifikasi laporan mandiri pelanggan. Bentuk, urutan seksi, dan
// ingatan buka/tutup seksinya SAMA dengan panel-lapangan.
//
// MURNI PENAMPIL DETAIL. Aksi (verifikasi/koreksi, tolak, batalkan) dipicu
// dari MENU KLIK KANAN; halaman meneruskan pilihan lewat prop `aksi`.
//
// Data meter/riwayat hanya dipakai untuk informasi panel; verifikasi mandiri
// tidak menerbitkan pembacaan resmi.
import * as React from "react";
import { CursorPointer01Icon } from "@/features/dashboard/shared/icons/IkonLucide";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPeriode, formatTanggal } from "@/features/public/lib/Format";
import {
  ambilSatu,
  ambilList,
  ApiError,
} from "@/features/dashboard/shared/api/ApiDashboard";
import { LABEL_KONDISI_CATAT } from "@/features/dashboard/verifikasi/lib/LabelPencatatan";
import type {
  LaporanMandiriDetail,
  MeterRingkas,
  PembacaanRingkas,
} from "../../types/TipeVerifikasi";
import {
  PanelKosong,
  RingkasanPelanggan,
  Seksi,
} from "./KomponenPanel";
import { FotoBukti } from "../foto/FotoBukti";
import { FotoSebelumnya } from "../foto/FotoSebelumnya";
import { PetaLokasi } from "../PetaLokasi";
import { ModalMandiri } from "../modal/ModalMandiri";

export type AksiMandiri = "verify" | "tolak";

export function PanelMandiri({
  id,
  refreshKey,
  onLoadingChange,
  aksi,
  onTutupAksi,
  onSelesai,
}: {
  id: string | null;
  refreshKey: number;
  onLoadingChange: (loading: boolean) => void;
  /** Aksi dari menu klik kanan yang butuh modal; null = tidak ada modal. */
  aksi: AksiMandiri | null;
  onTutupAksi: () => void;
  onSelesai: () => void;
}) {
  const [detail, setDetail] = React.useState<LaporanMandiriDetail | null>(null);
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [galat, setGalat] = React.useState<string | null>(null);
  const [memuatDetail, setMemuatDetail] = React.useState(false);
  const [muatKe, setMuatKe] = React.useState(0);

  const [dataMeter, setDataMeter] = React.useState<{
    laporanId: string;
    meterId: string;
    galat?: string;
  } | null>(null);
  const [riwayatMeter, setRiwayatMeter] = React.useState<{
    meterId: string;
    standLalu: number;
    blokTarif: number;
  } | null>(null);
  const [galatRiwayat, setGalatRiwayat] = React.useState<{
    meterId: string;
    pesan: string;
  } | null>(null);

  React.useEffect(() => {
    if (!id) {
      onLoadingChange(false);
      return;
    }
    let batal = false;
    setMemuatDetail(true);
    onLoadingChange(true);
    setGalat(null);
    (async () => {
      let detailDimuat = false;
      try {
        const row = await ambilSatu<LaporanMandiriDetail>(
          `/laporan-mandiri/${id}`,
        );
        if (batal) return;
        setDetail(row);
        setDetailId(id);
        setGalat(null);
        detailDimuat = true;
        const { rows } = await ambilList<MeterRingkas>("/meter", {
          pelangganId: row.pelangganId,
          pageSize: 100,
        });
        if (batal) return;
        setDataMeter({
          laporanId: id,
          meterId: (rows.find((m) => m.isAktif) ?? rows[0])?.id ?? "",
        });
      } catch (err) {
        if (batal) return;
        const pesan =
          err instanceof ApiError
            ? err.message
            : detailDimuat
              ? "Gagal memuat meter pelanggan."
              : "Gagal memuat detail laporan.";
        if (detailDimuat)
          setDataMeter({ laporanId: id, meterId: "", galat: pesan });
        else setGalat(pesan);
      } finally {
        if (!batal) {
          setMemuatDetail(false);
          onLoadingChange(false);
        }
      }
    })();
    return () => {
      batal = true;
    };
  }, [id, muatKe, refreshKey, onLoadingChange]);

  const dataMeterAktif = id && dataMeter?.laporanId === id ? dataMeter : null;
  const meterId = dataMeterAktif?.meterId ?? "";
  const galatMeter = dataMeterAktif?.galat ?? null;

  // Prefill stand lalu & blok tarif dari pembacaan resmi terakhir meter terpilih.
  React.useEffect(() => {
    if (!meterId) return;
    let batal = false;
    ambilList<PembacaanRingkas>("/pembacaan", {
      meterId,
      periodeSebelum: detail?.periode,
      pageSize: 1,
    })
      .then(({ rows }) => {
        if (batal) return;
        setRiwayatMeter({
          meterId,
          standLalu: rows[0]?.standAkhir ?? 0,
          blokTarif: rows[0]?.blokTarif ?? 1,
        });
        setGalatRiwayat(null);
      })
      .catch((err) => {
        if (batal) return;
        setGalatRiwayat({
          meterId,
          pesan:
            err instanceof ApiError
              ? err.message
              : "Gagal memuat riwayat pembacaan meter.",
        });
      });
    return () => {
      batal = true;
    };
  }, [meterId, detail?.periode]);

  if (!id) {
    return (
      <PanelKosong
        icon={CursorPointer01Icon}
        pesan="Klik baris untuk melihat detail; klik kanan baris untuk aksi verifikasi, tolak, atau batalkan."
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

  const riwayatAktif =
    meterId && riwayatMeter?.meterId === meterId ? riwayatMeter : null;
  const galatRiwayatAktif =
    meterId && galatRiwayat?.meterId === meterId ? galatRiwayat.pesan : null;
  const standAwal =
    detail.pembacaan?.standLalu ?? riwayatAktif?.standLalu ?? null;
  const pemakaianCatat =
    standAwal === null ? null : detail.standDilaporkan - standAwal;
  // Pagar kedua — menu klik kanan sudah menyaring status MENUNGGU.
  const bisaModal = detail.status === "MENUNGGU";

  // Tiga angka di panel Mandiri selalu mengutamakan angka laporan konsumen.
  const stAkhir =
    detail.standDilaporkan ?? detail.pembacaan?.standAkhir ?? null;
  const pakai = pemakaianCatat ?? detail.pembacaan?.pemakaianRiil ?? null;

  return (
    <div className="flex min-w-0 flex-col gap-2 px-2 py-2" aria-busy={memuatDetail}>
      {galat && (
        <p role="alert" className="text-label-12 text-destructive">
          {galat}
        </p>
      )}
      <RingkasanPelanggan
        nama={detail.pelanggan?.nama ?? "—"}
        nomor={detail.nomorLangganan}
        kondisi={
          LABEL_KONDISI_CATAT[
            detail.kondisi ?? detail.pembacaan?.kondisi ?? "STAND_KONSUMEN"
          ] ??
          detail.kondisi ??
          detail.pembacaan?.kondisi ??
          "Stand konsumen"
        }
        alamat={detail.pelanggan?.alamat}
        pelangganId={detail.pelangganId}
        pembacaan={{
          periode: detail.periode,
          standAwal,
          standAkhir: stAkhir,
          pakai,
        }}
      />

      <Seksi judul="Foto laporan periode ini">
        <FotoBukti
          url={detail.fotoUrl}
          label={`Foto meter — ${formatPeriode(detail.periode)}`}
        />
      </Seksi>

      <Seksi judul="Foto pembanding periode sebelumnya">
        <FotoSebelumnya
          pelangganId={detail.pelangganId}
          periode={detail.periode}
        />
      </Seksi>

      <Seksi judul="Lokasi pelanggan">
        <PetaLokasi
          langsung
          lat={detail.pelanggan?.geoLat}
          lng={detail.pelanggan?.geoLong}
        />
      </Seksi>

      {detail.status === "DIVERIFIKASI" && (
        <p className="text-copy-13 text-(--verif-v2)">
          Laporan sudah diverifikasi; proses ini hanya menyimpan koreksi stand
          dan tidak menerbitkan pembacaan resmi.
          {detail.verifiedBy?.name
            ? ` — diverifikasi ${detail.verifiedBy.name}`
            : ""}
          {detail.verifiedAt ? ` (${formatTanggal(detail.verifiedAt)})` : ""}.
        </p>
      )}
      {detail.status === "DIGUNAKAN" && (
        <p className="text-copy-13 text-(--verif-v3)">
          Sudah menjadi pembacaan resmi
          {detail.verifiedBy?.name
            ? ` — diverifikasi ${detail.verifiedBy.name}`
            : ""}
          {detail.verifiedAt ? ` (${formatTanggal(detail.verifiedAt)})` : ""}.
        </p>
      )}
      {detail.status === "DITOLAK" && (
        <p className="text-copy-13 text-muted-foreground">
          Ditolak
          {detail.verifiedBy?.name ? ` oleh ${detail.verifiedBy.name}` : ""}
          {detail.alasanDitolak ? ` — “${detail.alasanDitolak}”` : ""}.
        </p>
      )}

      {aksi && bisaModal && detailId === id && (
        <ModalMandiri
          detail={detail}
          tolakAwal={aksi === "tolak"}
          onTutup={onTutupAksi}
          onSelesai={() => {
            onTutupAksi();
            onSelesai();
            setMuatKe((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}
