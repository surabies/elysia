"use client";

import * as React from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { LABEL_KONDISI_CATAT } from "../../lib/label-pencatatan";
import { ambilSatu, ApiError } from "@/lib/api-dashboard";
import { PilihSatu } from "../DialogVerifikasi";
import {
  hitungPemakaianGantiMeter,
  hitungPemakaianMudaKembali,
} from "@/lib/domain/perhitungan-meter";
import { toast } from "sonner";
import { BarisForm, JudulBagian } from "../KerangkaModal";
import { KerangkaDrawer } from "../KerangkaDrawer";

export interface DataKoreksi {
  pelanggan: string;
  nomorLangganan?: string | null;
  namaPelanggan?: string | null;
  tarif?: string | null;
  alamat?: string | null;
  periode: string;
  standAwal: number | null;
  standAkhir: number | null;
  pemakaian: number | null;
  kelainan?: string | null;
  kondisiAsli?: string | null;
  standAwalRevisi?: number | null;
  standAkhirRevisi?: number | null;
  pemakaianTagihVerif?: number | null;
  standAngkatLama?: number | null;
  standMeterBaru?: number | null;
  standPasang?: number | null;
  noMeterBaru?: string | null;
  mbTanpaStandAngkat?: boolean | null;
  digitRollover?: number | null;
  ukuranMeter?: string | null;
  jumlahDigitAset?: number | null;
  butuhKonfirmasiGuard?: boolean | null;
  pesanBlokirGuard?: string | null;
  pelangganId?: string | null;
  meterVerifId?: string | null;
  standAngkat?: { lama: number | null; baru: number | null } | null;
}

export interface BarisSumberModal {
  id?: string;
  nolg?: string | null;
  thbl?: string | number | null;
  pelangganId?: string | null;
  nomorLangganan?: string | null;
  periode?: number | null;
  standAwal?: number | null;
  standAkhir?: number | null;
  pemakaian?: number | null;
  kondisi?: string | null;
  kondisiRevisi?: string | null;
  standAwalRevisi?: number | null;
  standAkhirRevisi?: number | null;
  pemakaianTagihVerif?: number | null;
  standAngkatLama?: number | null;
  standMeterBaru?: number | null;
  standPasang?: number | null;
  noMeterBaru?: string | null;
  mbTanpaStandAngkat?: boolean | null;
  digitRollover?: number | null;
  ukuranMeter?: string | null;
  jumlahDigitAset?: number | null;
  butuhKonfirmasiGuard?: boolean | null;
  pesanBlokirGuard?: string | null;
  meterVerifId?: string | null;
  golonganTarif?: string | null;
  alamatPelanggan?: string | null;
  namaPelanggan?: string | null;
  pelanggan?: {
    id?: string;
    nomorLangganan?: string;
    nama?: string | null;
    alamat?: string | null;
    tarifGolongan?: { kodeAsli: string } | null;
  } | null;
}

export function dataKoreksiDariBaris(b: BarisSumberModal): DataKoreksi {
  const nomorLangganan =
    b.pelanggan?.nomorLangganan ?? b.nomorLangganan ?? b.nolg ?? null;
  const nama = b.pelanggan?.nama ?? b.namaPelanggan ?? "";
  const periodeStr = b.periode
    ? String(b.periode)
    : b.thbl
      ? String(b.thbl)
      : "—";
  return {
    pelanggan: `${nomorLangganan ?? ""} ${nama}`.trim() || "—",
    nomorLangganan,
    namaPelanggan: nama || null,
    tarif: b.pelanggan?.tarifGolongan?.kodeAsli ?? b.golonganTarif ?? null,
    alamat: b.pelanggan?.alamat ?? b.alamatPelanggan ?? null,
    periode: periodeStr,
    standAwal: b.standAwal ?? null,
    standAkhir: b.standAkhir ?? null,
    pemakaian: b.pemakaian ?? null,
    kelainan: b.kondisiRevisi ?? b.kondisi ?? null,
    kondisiAsli: b.kondisi ?? null,
    standAwalRevisi: b.standAwalRevisi ?? null,
    standAkhirRevisi: b.standAkhirRevisi ?? null,
    pemakaianTagihVerif: b.pemakaianTagihVerif ?? null,
    standAngkatLama: b.standAngkatLama ?? null,
    standMeterBaru: b.standMeterBaru ?? null,
    standPasang: b.standPasang ?? null,
    noMeterBaru: b.noMeterBaru ?? null,
    mbTanpaStandAngkat: b.mbTanpaStandAngkat ?? null,
    digitRollover: b.digitRollover ?? null,
    ukuranMeter: b.ukuranMeter ?? null,
    jumlahDigitAset: b.jumlahDigitAset ?? null,
    butuhKonfirmasiGuard: b.butuhKonfirmasiGuard ?? null,
    pesanBlokirGuard: b.pesanBlokirGuard ?? null,
    pelangganId: b.pelanggan?.id ?? b.pelangganId ?? b.nolg ?? null,
    meterVerifId: b.meterVerifId ?? null,
    standAngkat:
      b.standAngkatLama != null || b.standMeterBaru != null
        ? {
            lama: b.standAngkatLama ?? null,
            baru: b.standMeterBaru ?? null,
          }
        : null,
  };
}

export interface HasilKoreksi {
  standAwalRevisi: number | null;
  standAkhirRevisi: number | null;
  pemakaianRevisi?: number | null;
  pemakaianTagihVerif?: number | null;
  kondisiRevisi: string | null;
  standAngkatLama: number | null;
  standMeterBaru: number | null;
  standPasang?: number | null;
  noMeterBaru?: string | null;
  mbTanpaStandAngkat?: boolean | null;
  digitRollover?: number | null;
}

interface DetailKoreksiApi {
  standPasang?: number | null;
  noMeterBaru?: string | null;
  mbTanpaStandAngkat?: boolean | null;
  digitRollover?: number | null;
  ukuranMeter?: string | null;
  jumlahDigitAset?: number | null;
  pelanggan?: {
    nomorLangganan?: string;
    nama?: string;
    alamat?: string | null;
    tarifGolongan?: { kodeAsli: string } | null;
  } | null;
}

const angka = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("id-ID");

const OPSI_DIGIT_ROLLOVER = [
  { value: "AUTO", label: "Deteksi Otomatis (Ukuran & Kedekatan Stand)" },
  { value: "4", label: "4 Digit Hitam · Maks 9.999 (Putar 10.000)" },
  { value: "5", label: "5 Digit Hitam · Maks 99.999 (Putar 100.000)" },
  { value: "6", label: "6 Digit Hitam · Maks 999.999 (Putar 1.000.000)" },
  { value: "7", label: "7 Digit Hitam · Maks 9.999.999 (Putar 10.000.000)" },
];

export function ModalKoreksi({
  data,
  id,
  onTutup,
  onSimpan,
  onRata3,
  bolehAturTagihan,
}: {
  data: DataKoreksi;
  id: string;
  onTutup: () => void;
  onSimpan?: (h: HasilKoreksi) => Promise<void>;
  onRata3?: () => void;
  bolehAturTagihan: boolean;
}) {
  const normalisasiKelainanAwal = (raw: string | null | undefined) => {
    const t = (raw ?? "").trim();
    if (t.toUpperCase() === "MUDA KEMBALI") return "MUDA_KEMBALI";
    if (t.toUpperCase() === "REVISI PENCATAT" || t.toUpperCase() === "REV.PENCATAT")
      return "REV_PENCATAT";
    return t;
  };

  const [standAkhir, setStandAkhir] = React.useState(
    String(data.standAkhirRevisi ?? data.standAkhir ?? ""),
  );
  const [standAwal, setStandAwal] = React.useState(
    String(data.standAwalRevisi ?? data.standAwal ?? ""),
  );
  const [pemakaianInput, setPemakaianInput] = React.useState<string | null>(
    () => {
      const awalAktif = data.standAwalRevisi ?? data.standAwal;
      const akhirAktif = data.standAkhirRevisi ?? data.standAkhir;
      if (
        data.pemakaian != null &&
        data.pemakaian >= 0 &&
        awalAktif != null &&
        akhirAktif != null &&
        akhirAktif - awalAktif !== data.pemakaian &&
        data.kelainan !== "MB" &&
        data.kelainan !== "MUDA_KEMBALI" &&
        data.kelainan !== "MUDA KEMBALI"
      ) {
        return String(data.pemakaian);
      }
      return null;
    },
  );
  const [taksasi, setTaksasi] = React.useState(
    data.pemakaianTagihVerif != null,
  );
  const [nilaiTaksasi, setNilaiTaksasi] = React.useState(
    data.pemakaianTagihVerif == null ? "" : String(data.pemakaianTagihVerif),
  );
  const [kelainan, setKelainan] = React.useState(
    normalisasiKelainanAwal(data.kelainan),
  );
  const [standAngkatLama, setStandAngkatLama] = React.useState(
    data.standAngkatLama == null ? "" : String(data.standAngkatLama),
  );
  const [mbTanpaStandAngkat, setMbTanpaStandAngkat] = React.useState(
    Boolean(data.mbTanpaStandAngkat),
  );
  const [standMeterBaru, setStandMeterBaru] = React.useState(
    data.standMeterBaru != null
      ? String(data.standMeterBaru)
      : data.standAkhirRevisi != null
        ? String(data.standAkhirRevisi)
        : data.standAkhir != null
          ? String(data.standAkhir)
          : "",
  );
  const [standPasang, setStandPasang] = React.useState(
    String(data.standPasang ?? 0),
  );
  const [noMeterBaru, setNoMeterBaru] = React.useState(data.noMeterBaru ?? "");
  const [digitRollover, setDigitRollover] = React.useState<string>(
    data.digitRollover != null ? String(data.digitRollover) : "AUTO",
  );
  const [menyimpan, setMenyimpan] = React.useState(false);
  const [detail, setDetail] = React.useState<DetailKoreksiApi | null>(null);

  React.useEffect(() => {
    let batal = false;
    ambilSatu<DetailKoreksiApi>(`/laporan-harian/${id}`)
      .then((row) => {
        if (batal) return;
        setDetail(row);
        if (row.standPasang != null && data.standPasang == null) {
          setStandPasang(String(row.standPasang));
        }
        if (row.noMeterBaru && !data.noMeterBaru) {
          setNoMeterBaru(row.noMeterBaru);
        }
        if (row.mbTanpaStandAngkat != null && data.mbTanpaStandAngkat == null) {
          setMbTanpaStandAngkat(Boolean(row.mbTanpaStandAngkat));
        }
        if (row.digitRollover != null && data.digitRollover == null) {
          setDigitRollover(String(row.digitRollover));
        }
      })
      .catch((err) => {
        if (!batal)
          toast.error(
            err instanceof ApiError
              ? err.message
              : "Gagal memuat detail laporan.",
          );
      });
    return () => {
      batal = true;
    };
  }, [
    id,
    data.standPasang,
    data.noMeterBaru,
    data.mbTanpaStandAngkat,
    data.digitRollover,
  ]);

  const akhirNum = standAkhir === "" ? null : Number(standAkhir);
  const awalNum = standAwal === "" ? null : Number(standAwal);
  const standAngkatNum =
    mbTanpaStandAngkat || standAngkatLama.trim() === ""
      ? null
      : Number(standAngkatLama);
  const standMeterBaruNum =
    standMeterBaru.trim() === "" ? null : Number(standMeterBaru);
  const standPasangNum = standPasang.trim() === "" ? 0 : Number(standPasang);
  const digitOverrideNum =
    digitRollover === "AUTO" ? null : Number(digitRollover);

  const ukuranMeterEfektif = detail?.ukuranMeter ?? data.ukuranMeter ?? "1/2";
  const jumlahDigitAsetEfektif =
    detail?.jumlahDigitAset ?? data.jumlahDigitAset ?? null;

  const isModeMB = kelainan === "MB";
  const isModeRollover = kelainan === "MUDA_KEMBALI";

  const evaluasiRollover =
    isModeRollover &&
    awalNum != null &&
    akhirNum != null &&
    Number.isInteger(awalNum) &&
    Number.isInteger(akhirNum)
      ? hitungPemakaianMudaKembali({
          standAwal: awalNum,
          standAkhir: akhirNum,
          ukuranMeter: ukuranMeterEfektif,
          jumlahDigitAset: jumlahDigitAsetEfektif,
          digitOverride: digitOverrideNum,
        })
      : null;

  const pakaiMeterLamaPreview =
    isModeMB && awalNum != null
      ? mbTanpaStandAngkat
        ? 0
        : standAngkatNum != null && Number.isInteger(standAngkatNum)
          ? standAngkatNum - awalNum
          : null
      : null;

  const pakaiMeterBaruPreview =
    isModeMB &&
    standMeterBaruNum != null &&
    Number.isInteger(standMeterBaruNum) &&
    Number.isInteger(standPasangNum)
      ? standMeterBaruNum - standPasangNum
      : null;

  const pakaiDariStand = isModeMB
    ? awalNum != null &&
      Number.isInteger(awalNum) &&
      standMeterBaruNum != null &&
      Number.isInteger(standMeterBaruNum) &&
      Number.isInteger(standPasangNum) &&
      (mbTanpaStandAngkat ||
        (standAngkatNum != null && Number.isInteger(standAngkatNum)))
      ? hitungPemakaianGantiMeter({
          standAwalLama: awalNum,
          standAngkatLama: standAngkatNum,
          standMeterBaru: standMeterBaruNum,
          standPasang: standPasangNum,
          tanpaStandAngkat: mbTanpaStandAngkat,
        })
      : null
    : isModeRollover
      ? evaluasiRollover?.isValid
        ? evaluasiRollover.totalPemakaianM3
        : null
      : awalNum != null &&
          akhirNum != null &&
          Number.isInteger(awalNum) &&
          Number.isInteger(akhirNum)
        ? akhirNum - awalNum
        : null;

  const pakai =
    pemakaianInput !== null && pemakaianInput !== ""
      ? Number(pemakaianInput)
      : pakaiDariStand;

  const hasilStandAwal = awalNum;
  const hasilStandAkhir = isModeMB ? standMeterBaruNum : akhirNum;
  const hasilKelainan = kelainan
    ? (LABEL_KONDISI_CATAT[kelainan] ?? kelainan)
    : "—";

  const adaIndikasiStandMundur =
    awalNum != null &&
    (isModeMB ? standMeterBaruNum : akhirNum) != null &&
    (isModeMB ? standMeterBaruNum! : akhirNum!) < awalNum;

  async function simpan() {
    if (!onSimpan) return;
    const akhirValid =
      isModeMB ||
      (akhirNum != null && Number.isInteger(akhirNum) && akhirNum >= 0);
    const awalValid =
      kelainan !== "REV_PENCATAT" ||
      (awalNum != null && Number.isInteger(awalNum) && awalNum >= 0);
    const taksasiValid =
      !bolehAturTagihan ||
      !taksasi ||
      (nilaiTaksasi !== "" &&
        Number.isInteger(Number(nilaiTaksasi)) &&
        Number(nilaiTaksasi) >= 0);

    const kesalahan: string[] = [];
    if (!akhirValid)
      kesalahan.push("Stand akhir harus bilangan bulat minimal 0.");
    if (!awalValid)
      kesalahan.push("ST awal revisi harus bilangan bulat minimal 0.");
    if (!taksasiValid)
      kesalahan.push("Nilai taksasi harus bilangan bulat minimal 0.");

    if (isModeMB) {
      if (
        standMeterBaruNum == null ||
        !Number.isInteger(standMeterBaruNum) ||
        standMeterBaruNum < 0
      ) {
        kesalahan.push("Stand meter baru wajib bilangan bulat minimal 0.");
      }
      if (!Number.isInteger(standPasangNum) || standPasangNum < 0) {
        kesalahan.push("Stand pasang meter baru minimal 0.");
      }
      if (
        standMeterBaruNum != null &&
        standMeterBaruNum < standPasangNum
      ) {
        kesalahan.push(
          `Stand meter baru (${standMeterBaruNum}) tidak boleh lebih kecil dari stand pasang (${standPasangNum}).`,
        );
      }
      if (!mbTanpaStandAngkat) {
        if (
          standAngkatNum == null ||
          !Number.isInteger(standAngkatNum) ||
          standAngkatNum < 0
        ) {
          kesalahan.push(
            "Isi Stand Angkat meter lama, atau centang Override Tanpa Stand Angkat jika data tidak tercatat.",
          );
        } else if (awalNum != null && standAngkatNum < awalNum) {
          kesalahan.push(
            `Stand Angkat (${standAngkatNum}) lebih kecil dari Stand Awal (${awalNum}). Periksa angka atau centang Override jika meter lama rusak.`,
          );
        }
      }
    } else if (isModeRollover) {
      if (!evaluasiRollover || !evaluasiRollover.isValid) {
        kesalahan.push(
          evaluasiRollover?.pesanError ??
            "Data Muda Kembali belum lengkap atau kapasitas digit tidak sesuai.",
        );
      }
    } else if (pakai != null && pakai < 0) {
      kesalahan.push(
        "Pemakaian tidak boleh negatif. Pilih kondisi Meter Baru (MB), Muda Kembali, atau perbaiki angka stand.",
      );
    }

    if (kesalahan.length > 0) {
      toast.error(kesalahan.join(" "));
      return;
    }

    setMenyimpan(true);
    try {
      const hasil: HasilKoreksi = {
        standAwalRevisi: kelainan === "REV_PENCATAT" ? awalNum : null,
        standAkhirRevisi: isModeMB
          ? standMeterBaruNum
          : akhirNum === data.standAkhir
            ? null
            : akhirNum,
        pemakaianRevisi:
          pakai != null &&
          pakaiDariStand != null &&
          pakai !== pakaiDariStand
            ? pakai
            : isModeRollover
              ? pakai
              : null,
        kondisiRevisi: kelainan === data.kondisiAsli ? null : kelainan || null,
        standAngkatLama: isModeMB && !mbTanpaStandAngkat ? standAngkatNum : null,
        standMeterBaru: isModeMB ? standMeterBaruNum : null,
        standPasang: isModeMB ? standPasangNum : null,
        noMeterBaru:
          isModeMB && noMeterBaru.trim() !== "" ? noMeterBaru.trim() : null,
        mbTanpaStandAngkat: isModeMB ? mbTanpaStandAngkat : false,
        digitRollover: isModeRollover
          ? (evaluasiRollover?.digit ?? digitOverrideNum)
          : null,
      };
      if (bolehAturTagihan) {
        hasil.pemakaianTagihVerif = taksasi
          ? Number(nilaiTaksasi)
          : isModeMB || isModeRollover
            ? pakai
            : null;
      }
      await onSimpan(hasil);
      onTutup();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Koreksi gagal disimpan.",
      );
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <KerangkaDrawer
      judul="Koreksi Data Pembacaan"
      subjudul={`Periode ${data.periode} · Ukuran Meter ${ukuranMeterEfektif}"`}
      onTutup={onTutup}
      informasi={
        <div className="min-w-0 space-y-4 text-copy-13">
          <section aria-label="Informasi pelanggan">
            <h2 className="mb-2 text-label-12 font-semibold tracking-wide text-muted-foreground uppercase">
              Informasi Pelanggan
            </h2>
            <dl className="rounded-lg border border-sidebar-border bg-muted/60 px-3">
              <div className="grid min-w-0 grid-cols-[7rem_auto_minmax(0,1fr)] gap-2 border-b border-sidebar-border py-2 last:border-b-0">
                <dt className="text-muted-foreground">Nama</dt>
                <span aria-hidden="true" className="text-muted-foreground">
                  :
                </span>
                <dd className="min-w-0 truncate font-medium text-foreground">
                  {detail?.pelanggan?.nama ?? data.namaPelanggan ?? "—"}
                </dd>
              </div>
              <div className="grid min-w-0 grid-cols-[7rem_auto_minmax(0,1fr)] gap-2 border-b border-sidebar-border py-2 last:border-b-0">
                <dt className="text-muted-foreground">No. Langganan</dt>
                <span aria-hidden="true" className="text-muted-foreground">
                  :
                </span>
                <dd className="min-w-0 truncate font-medium text-foreground">
                  {detail?.pelanggan?.nomorLangganan ??
                    data.nomorLangganan ??
                    "—"}
                </dd>
              </div>
              <div className="grid min-w-0 grid-cols-[7rem_auto_minmax(0,1fr)] gap-2 border-b border-sidebar-border py-2 last:border-b-0">
                <dt className="text-muted-foreground">Tarif / Ukuran</dt>
                <span aria-hidden="true" className="text-muted-foreground">
                  :
                </span>
                <dd className="min-w-0 truncate font-medium text-foreground">
                  {detail?.pelanggan?.tarifGolongan?.kodeAsli ??
                    data.tarif ??
                    "—"}{" "}
                  · {ukuranMeterEfektif}&quot;
                </dd>
              </div>
              <div className="grid min-w-0 grid-cols-[7rem_auto_minmax(0,1fr)] gap-2 py-2">
                <dt className="text-muted-foreground">Alamat</dt>
                <span aria-hidden="true" className="text-muted-foreground">
                  :
                </span>
                <dd className="min-w-0 font-medium text-foreground">
                  {detail?.pelanggan?.alamat ?? data.alamat ?? "—"}
                </dd>
              </div>
            </dl>
          </section>

          <section
            aria-label="Hasil laporan pembacaan"
            className="rounded-xl border border-dashed border-(--verif-v2-border) bg-(--verif-v2-soft) p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-label-14 font-semibold text-foreground">
                Pratinjau Hasil Koreksi
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-background px-3 py-2.5">
                <p className="text-label-12 text-muted-foreground">Stand awal</p>
                <p className="mt-1 text-heading-20 font-semibold tabular-nums text-foreground">
                  {angka(hasilStandAwal)}
                </p>
              </div>
              <div className="rounded-lg bg-background px-3 py-2.5">
                <p className="text-label-12 text-muted-foreground">
                  {isModeMB ? "Stand akhir (meter baru)" : "Stand akhir"}
                </p>
                <p className="mt-1 text-heading-20 font-semibold tabular-nums text-foreground">
                  {angka(hasilStandAkhir)}
                </p>
              </div>
              <div className="rounded-lg bg-background px-3 py-2.5">
                <p className="text-label-12 text-muted-foreground">Pemakaian</p>
                <p
                  className={`mt-1 text-heading-20 font-semibold tabular-nums ${
                    pakai != null && pakai < 0
                      ? "text-destructive"
                      : "text-foreground"
                  }`}
                >
                  {angka(pakai)} m³
                </p>
              </div>
              <div className="rounded-lg bg-background px-3 py-2.5">
                <p className="text-label-12 text-muted-foreground">Kelainan</p>
                <p className="mt-1 truncate font-semibold text-foreground">
                  {hasilKelainan}
                </p>
              </div>
            </div>
          </section>
        </div>
      }
      footer={
        <>
          {!onSimpan && (
            <span className="mr-auto text-copy-13 text-muted-foreground">
              Tampilan saja — Simpan belum tersambung ke server.
            </span>
          )}
          <Button variant="outline" size="default" onClick={onTutup}>
            Batal
          </Button>
          <Button
            size="default"
            disabled={!onSimpan || menyimpan}
            onClick={() => void simpan()}
          >
            {menyimpan && <Spinner className="size-3.5" />}
            Simpan Koreksi
          </Button>
        </>
      }
    >
      <div className="flex min-w-0 flex-col gap-5">
        {(data.butuhKonfirmasiGuard ||
          (adaIndikasiStandMundur && !isModeMB && !isModeRollover)) && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-copy-12 text-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1.5">
              <p className="font-semibold">
                Pengaman Aktif: Indikasi Pergantian Meter / Stand Mundur
              </p>
              <p className="text-muted-foreground">
                {data.pesanBlokirGuard ??
                  "Stand akhir lebih kecil dari stand awal. Pilih resolusi yang sesuai di bawah agar laporan dapat disahkan ke V1–V3:"}
              </p>
              {!isModeMB && !isModeRollover && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => {
                      setKelainan("MB");
                      if (akhirNum != null) setStandMeterBaru(String(akhirNum));
                    }}
                  >
                    Jadikan Meter Baru (MB)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setKelainan("MUDA_KEMBALI")}
                  >
                    Jadikan Muda Kembali (Rollover)
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <section className="flex min-w-0 flex-col gap-3">
          <JudulBagian>Form Koreksi Bacaan</JudulBagian>
          <div className="flex min-w-0 flex-col gap-3">
            <BarisForm label="Kelainan">
              <PilihSatu
                ariaLabel="Kelainan"
                value={kelainan}
                onChange={(val) => {
                  setKelainan(val);
                  if (val === "MB" && standMeterBaru === "" && standAkhir !== "") {
                    setStandMeterBaru(standAkhir);
                  }
                }}
                placeholder="- Kelainan -"
                size="sm"
                opsi={Object.entries(LABEL_KONDISI_CATAT).map(
                  ([kode, nama]) => ({
                    value: kode,
                    label: nama,
                  }),
                )}
              />
            </BarisForm>

            {kelainan === "REV_PENCATAT" && (
              <BarisForm label="ST Awal revisi" htmlFor="koreksi-awal">
                <Input
                  id="koreksi-awal"
                  type="number"
                  density="compact"
                  min={0}
                  value={standAwal}
                  onChange={(e) => setStandAwal(e.target.value)}
                />
              </BarisForm>
            )}

            {!isModeMB && (
              <BarisForm
                label={isModeRollover ? "Stand Akhir (Putar)" : "Stand Akhir"}
                htmlFor="koreksi-akhir"
              >
                <Input
                  id="koreksi-akhir"
                  type="number"
                  density="compact"
                  min={0}
                  value={standAkhir}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStandAkhir(val);
                    if (
                      awalNum != null &&
                      val !== "" &&
                      Number(val) !== awalNum
                    ) {
                      setPemakaianInput(null);
                    }
                  }}
                />
              </BarisForm>
            )}

            {isModeRollover && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                <BarisForm label="Kapasitas Digit">
                  <PilihSatu
                    ariaLabel="Kapasitas Digit Register"
                    value={digitRollover}
                    onChange={setDigitRollover}
                    size="sm"
                    opsi={OPSI_DIGIT_ROLLOVER}
                  />
                </BarisForm>

                {evaluasiRollover && evaluasiRollover.isValid && (
                  <div className="rounded-md border border-border bg-background p-2.5 text-copy-12 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>
                        Batas Putar ({evaluasiRollover.digit} Digit Hitam)
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {angka(evaluasiRollover.batasPutar)}
                      </span>
                    </div>
                    {evaluasiRollover.isRolloverTerjadi ? (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Rumus Putar Penuh</span>
                        <span className="font-mono font-medium text-foreground">
                          ({angka(evaluasiRollover.batasPutar)} − {angka(awalNum)} ={" "}
                          {angka(evaluasiRollover.sisaPutaranLama)}) +{" "}
                          {angka(evaluasiRollover.jalanPutaranBaru)} ={" "}
                          <strong>{angka(evaluasiRollover.totalPemakaianM3)} m³</strong>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Selisih Maju (Belum Lewat 0)</span>
                        <span className="font-mono font-medium text-foreground">
                          {angka(evaluasiRollover.totalPemakaianM3)} m³
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {evaluasiRollover?.peringatanPlausibilitas && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 text-copy-12 text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                    <span>{evaluasiRollover.peringatanPlausibilitas}</span>
                  </div>
                )}
              </div>
            )}

            {isModeMB && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                <label
                  htmlFor="mb-override-tanpa-angkat"
                  className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border bg-background p-2.5 select-none"
                >
                  <Checkbox
                    id="mb-override-tanpa-angkat"
                    checked={mbTanpaStandAngkat}
                    onCheckedChange={(checked) => {
                      const aktif = checked === true;
                      setMbTanpaStandAngkat(aktif);
                      if (aktif) setStandAngkatLama("");
                    }}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5 text-copy-12">
                    <span className="font-medium text-foreground">
                      Override: Tanpa Stand Angkat Meter Lama
                    </span>
                    <p className="text-muted-foreground">
                      Aktifkan jika petugas tidak mencatat stand angkat / meter
                      lama rusak. Pemakaian dihitung dari meter baru saja tanpa
                      memalsukan stand angkat.
                    </p>
                  </div>
                </label>

                <BarisForm
                  label="Stand Angkat Lama"
                  htmlFor="koreksi-angkat-lama"
                >
                  <Input
                    id="koreksi-angkat-lama"
                    type="number"
                    density="compact"
                    min={0}
                    disabled={mbTanpaStandAngkat}
                    placeholder={
                      mbTanpaStandAngkat
                        ? "Di-override (Tanpa Stand Angkat)"
                        : `Minimal ${angka(awalNum)}`
                    }
                    value={standAngkatLama}
                    onChange={(e) => setStandAngkatLama(e.target.value)}
                  />
                </BarisForm>

                <div className="grid gap-3 sm:grid-cols-2">
                  <BarisForm
                    label="Stand Meter Baru"
                    htmlFor="koreksi-meter-baru"
                  >
                    <Input
                      id="koreksi-meter-baru"
                      type="number"
                      density="compact"
                      min={0}
                      value={standMeterBaru}
                      onChange={(e) => {
                        setStandMeterBaru(e.target.value);
                        setPemakaianInput(null);
                      }}
                    />
                  </BarisForm>

                  <BarisForm
                    label="ST Awal Baru (0)"
                    htmlFor="koreksi-stand-pasang"
                  >
                    <Input
                      id="koreksi-stand-pasang"
                      type="number"
                      density="compact"
                      min={0}
                      title="Angka awal meter baru saat pertama dipasang (default 0 untuk meter baru)"
                      value={standPasang}
                      onChange={(e) => {
                        setStandPasang(e.target.value);
                        setPemakaianInput(null);
                      }}
                    />
                  </BarisForm>
                </div>
                <p className="-mt-1 text-copy-11 text-muted-foreground">
                  <strong>ST Awal Baru</strong> adalah angka awal meter baru saat dipasang (biarkan <strong>0</strong> jika meter baru mulai dari 0; isi hanya bila meter rekondisi/tera ulang tidak mulai dari 0).
                </p>

                <BarisForm
                  label="No. Meter Baru"
                  htmlFor="koreksi-nometer-baru"
                >
                  <Input
                    id="koreksi-nometer-baru"
                    type="text"
                    density="compact"
                    placeholder="Opsional (isi jika terlihat di foto / BA)"
                    value={noMeterBaru}
                    onChange={(e) => setNoMeterBaru(e.target.value)}
                  />
                </BarisForm>

                <div className="rounded-md border border-border bg-background p-2.5 text-copy-12 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Pakai Meter Lama</span>
                    <span className="font-mono font-medium text-foreground">
                      {mbTanpaStandAngkat
                        ? "0 m³ (Override)"
                        : pakaiMeterLamaPreview == null
                          ? "Menunggu Stand Angkat"
                          : `${angka(standAngkatNum)} − ${angka(awalNum)} = ${angka(pakaiMeterLamaPreview)} m³`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Pakai Meter Baru</span>
                    <span className="font-mono font-medium text-foreground">
                      {pakaiMeterBaruPreview == null
                        ? "—"
                        : `${angka(standMeterBaruNum)} − ${angka(standPasangNum)} = ${angka(pakaiMeterBaruPreview)} m³`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-1 font-semibold text-foreground">
                    <span>Total Kubikasi Gabungan</span>
                    <span className="font-mono">{angka(pakai)} m³</span>
                  </div>
                </div>
              </div>
            )}

            <BarisForm label="Pakai (m³)" htmlFor="koreksi-pakai">
              <Input
                id="koreksi-pakai"
                type="number"
                density="compact"
                min={0}
                placeholder={
                  pakaiDariStand == null
                    ? "Otomatis dari stand"
                    : `${pakaiDariStand} m³ (otomatis)`
                }
                value={
                  pemakaianInput ??
                  (pakaiDariStand == null ? "" : String(pakaiDariStand))
                }
                onChange={(e) => setPemakaianInput(e.target.value)}
              />
            </BarisForm>

            {bolehAturTagihan && (
              <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-3">
                <Label
                  htmlFor="koreksi-taksasi"
                  className="flex items-center gap-2 font-normal text-muted-foreground"
                >
                  <Checkbox
                    id="koreksi-taksasi"
                    checked={taksasi}
                    onCheckedChange={(v) => setTaksasi(v === true)}
                  />
                  Tagihan
                </Label>
                <div className="flex min-w-0 items-center gap-2">
                  <Input
                    type="number"
                    density="compact"
                    min={0}
                    disabled={!taksasi}
                    value={nilaiTaksasi}
                    onChange={(e) => setNilaiTaksasi(e.target.value)}
                    aria-label="Pemakaian Tagihan dalam m3"
                    className="disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
                  />
                  <Button
                    type="button"
                    variant="link"
                    size="default"
                    className="shrink-0 text-(--verif-info)"
                    onClick={onRata3}
                    disabled={!onRata3}
                  >
                    Rata3
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-copy-12 text-muted-foreground">
            <Info className="size-3.5 shrink-0" />
            <span>
              {isModeMB
                ? "Menyimpan koreksi MB otomatis mengesahkan mutasi meter dan membuka jalan ke V1–V3."
                : !bolehAturTagihan
                  ? "Nilai Tagihan khusus hanya dapat ditetapkan oleh V3."
                  : "Koreksi dicatat lengkap ke dalam riwayat audit verifikasi."}
            </span>
          </div>
        </section>
      </div>
    </KerangkaDrawer>
  );
}
