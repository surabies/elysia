"use client";

// features/dashboard/verifikasi/components/modalKoreksi.tsx — "Koreksi Data
// Pembacaan" (menu Edit dan CHN; keduanya membuka form yang SAMA).
//
// Simpan memakai callback halaman; header menampilkan identitas pelanggan dan
// hasil laporan, lalu isi drawer disusun sebagai Stand Angkat dan Form Edit.
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { LABEL_KONDISI_CATAT } from "@/features/dashboard/verifikasi/lib/LabelPencatatan";
import { ambilSatu, ApiError } from "@/features/dashboard/shared/api/ApiDashboard";
import { PilihSatu } from "../DialogVerifikasi";
import { hitungPemakaianGantiMeter } from "@/lib/domain/PerhitunganMeter";
import { toast } from "sonner";
import {
  BarisForm,
  JudulBagian,
} from "../KerangkaModal";
import { KerangkaDrawer } from "../KerangkaDrawer";

export interface DataKoreksi {
  /** Label gabungan untuk modal lain yang masih menampilkan identitas ringkas. */
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
  pelangganId?: string | null;
  meterVerifId?: string | null;
  /** null = tidak ada stand angkat. */
  standAngkat?: { lama: number | null; baru: number | null } | null;
}

/** Bentuk minimum baris tabel (petugas maupun mandiri) yang dibutuhkan konversi. */
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
  const periodeStr = b.periode ? String(b.periode) : b.thbl ? String(b.thbl) : "—";
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
  pemakaianTagihVerif?: number | null;
  kondisiRevisi: string | null;
  standAngkatLama: number | null;
  standMeterBaru: number | null;
}

interface DetailKoreksiApi {
  standPasang?: number | null;
  pelanggan?: {
    nomorLangganan?: string;
    nama?: string;
    alamat?: string | null;
    tarifGolongan?: { kodeAsli: string } | null;
  } | null;
}

const angka = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("id-ID");

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
  const [standAkhir, setStandAkhir] = React.useState(
    String(data.standAkhirRevisi ?? data.standAkhir ?? ""),
  );
  const [standAwal, setStandAwal] = React.useState(
    String(data.standAwalRevisi ?? data.standAwal ?? ""),
  );
  const [taksasi, setTaksasi] = React.useState(
    data.pemakaianTagihVerif != null,
  );
  const [nilaiTaksasi, setNilaiTaksasi] = React.useState(
    data.pemakaianTagihVerif == null ? "" : String(data.pemakaianTagihVerif),
  );
  const [kelainan, setKelainan] = React.useState(data.kelainan ?? "");
  const [standAngkatLama, setStandAngkatLama] = React.useState(
    data.standAngkatLama == null ? "" : String(data.standAngkatLama),
  );
  const [standMeterBaru, setStandMeterBaru] = React.useState(
    data.standMeterBaru == null ? "" : String(data.standMeterBaru),
  );
  const [menyimpan, setMenyimpan] = React.useState(false);
  const [detail, setDetail] = React.useState<DetailKoreksiApi | null>(null);

  React.useEffect(() => {
    let batal = false;
    ambilSatu<DetailKoreksiApi>(`/laporan-harian/${id}`)
      .then((row) => {
        if (!batal) setDetail(row);
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
  }, [id]);

  const akhirNum = standAkhir === "" ? null : Number(standAkhir);
  const awalNum = standAwal === "" ? null : Number(standAwal);
  const standAngkatNum =
    standAngkatLama === "" ? null : Number(standAngkatLama);
  const standMeterBaruNum =
    standMeterBaru === "" ? null : Number(standMeterBaru);
  const pakai =
    kelainan === "MB"
      ? awalNum != null &&
        Number.isInteger(awalNum) &&
        standAngkatNum != null &&
        Number.isInteger(standAngkatNum) &&
        standMeterBaruNum != null &&
        Number.isInteger(standMeterBaruNum)
        ? hitungPemakaianGantiMeter({
            standAwalLama: awalNum,
            standAngkatLama: standAngkatNum,
            standMeterBaru: standMeterBaruNum,
        standPasang: detail?.standPasang ?? data.standPasang ?? 0,
          })
        : null
      : awalNum != null &&
          akhirNum != null &&
          Number.isInteger(awalNum) &&
          Number.isInteger(akhirNum)
        ? akhirNum - awalNum
        : null;
  const hasilStandAwal = awalNum;
  const hasilStandAkhir =
    kelainan === "MB" ? standMeterBaruNum : akhirNum;
  const hasilKelainan = kelainan
    ? (LABEL_KONDISI_CATAT[kelainan] ?? kelainan)
    : "—";

  async function simpan() {
    if (!onSimpan) return;
    const akhirValid =
      kelainan === "MB" ||
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
    const meterBaruValid =
      kelainan !== "MB" ||
      (awalNum != null &&
        Number.isInteger(awalNum) &&
        awalNum >= 0 &&
        standAngkatNum != null &&
        Number.isInteger(standAngkatNum) &&
        standAngkatNum >= 0 &&
        standMeterBaruNum != null &&
        Number.isInteger(standMeterBaruNum) &&
        standMeterBaruNum >= 0);
    const pemakaianNegatif = pakai != null && pakai < 0;

    const kesalahan: string[] = [];
    if (!akhirValid)
      kesalahan.push("Stand akhir harus bilangan bulat minimal 0.");
    if (!awalValid)
      kesalahan.push("ST awal revisi harus bilangan bulat minimal 0.");
    if (!taksasiValid)
      kesalahan.push("Nilai taksasi harus bilangan bulat minimal 0.");
    if (!meterBaruValid)
      kesalahan.push(
        "Lengkapi stand awal meter lama, stand angkat, dan stand meter baru.",
      );
    if (pemakaianNegatif) kesalahan.push("Pemakaian tidak boleh negatif.");

    if (kesalahan.length > 0) {
      toast.error(kesalahan.join(" "));
      return;
    }
    setMenyimpan(true);
    try {
      const hasil: HasilKoreksi = {
        standAwalRevisi: kelainan === "REV_PENCATAT" ? awalNum : null,
        standAkhirRevisi:
          kelainan === "MB"
            ? standMeterBaruNum
            : akhirNum === data.standAkhir
              ? null
              : akhirNum,
        kondisiRevisi: kelainan === data.kondisiAsli ? null : kelainan || null,
        standAngkatLama: kelainan === "MB" ? standAngkatNum : null,
        standMeterBaru: kelainan === "MB" ? standMeterBaruNum : null,
      };
      if (bolehAturTagihan) {
        hasil.pemakaianTagihVerif = taksasi
          ? Number(nilaiTaksasi)
          : kelainan === "MB"
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
      subjudul={`Periode ${data.periode}`}
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
                <span aria-hidden="true" className="text-muted-foreground">:</span>
                <dd className="min-w-0 truncate font-medium text-foreground">
                  {detail?.pelanggan?.nama ?? data.namaPelanggan ?? "—"}
                </dd>
              </div>
              <div className="grid min-w-0 grid-cols-[7rem_auto_minmax(0,1fr)] gap-2 border-b border-sidebar-border py-2 last:border-b-0">
                <dt className="text-muted-foreground">No. Langganan</dt>
                <span aria-hidden="true" className="text-muted-foreground">:</span>
                <dd className="min-w-0 truncate font-medium text-foreground">
                  {detail?.pelanggan?.nomorLangganan ??
                    data.nomorLangganan ??
                    "—"}
                </dd>
              </div>
              <div className="grid min-w-0 grid-cols-[7rem_auto_minmax(0,1fr)] gap-2 border-b border-sidebar-border py-2 last:border-b-0">
                <dt className="text-muted-foreground">Tarif</dt>
                <span aria-hidden="true" className="text-muted-foreground">:</span>
                <dd className="min-w-0 truncate font-medium text-foreground">
                  {detail?.pelanggan?.tarifGolongan?.kodeAsli ??
                    data.tarif ??
                    "—"}
                </dd>
              </div>
              <div className="grid min-w-0 grid-cols-[7rem_auto_minmax(0,1fr)] gap-2 py-2">
                <dt className="text-muted-foreground">Alamat</dt>
                <span aria-hidden="true" className="text-muted-foreground">:</span>
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
                Hasil laporan
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
                  {kelainan === "MB" ? "Stand akhir (meter baru)" : "Stand akhir"}
                </p>
                <p className="mt-1 text-heading-20 font-semibold tabular-nums text-foreground">
                  {angka(hasilStandAkhir)}
                </p>
              </div>
              <div className="rounded-lg bg-background px-3 py-2.5">
                <p className="text-label-12 text-muted-foreground">
                  Pemakaian
                </p>
                <p className="mt-1 text-heading-20 font-semibold tabular-nums text-foreground">
                  {angka(pakai)}
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
            Simpan
          </Button>
        </>
      }
    >
      <div className="flex min-w-0 flex-col gap-6">
        <section className="flex min-w-0 flex-col gap-2.5 border-b border-border pb-6">
          <JudulBagian>Stand Angkat</JudulBagian>
          {data.standAngkat ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <BarisForm label="Meter lama">
                <p className="rounded-md bg-muted/50 px-3 py-2 text-copy-13 font-medium tabular-nums">
                  {angka(data.standAngkat.lama)}
                </p>
              </BarisForm>
              <BarisForm label="Meter baru">
                <p className="rounded-md bg-muted/50 px-3 py-2 text-copy-13 font-medium tabular-nums">
                  {angka(data.standAngkat.baru)}
                </p>
              </BarisForm>
            </div>
          ) : (
            <p className="text-copy-13 text-muted-foreground">
              Tidak ada stand angkat.
            </p>
          )}
        </section>

        <section className="flex min-w-0 flex-col gap-3">
          <JudulBagian>Form Edit</JudulBagian>
          <div className="flex min-w-0 flex-col gap-3">
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
            {kelainan !== "MB" && (
              <BarisForm label="Stand Akhir" htmlFor="koreksi-akhir">
                <Input
                  id="koreksi-akhir"
                  type="number"
                  density="compact"
                  min={0}
                  value={standAkhir}
                  onChange={(e) => setStandAkhir(e.target.value)}
                />
              </BarisForm>
            )}

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

            <BarisForm label="Kelainan">
              <PilihSatu
                ariaLabel="Kelainan"
                value={kelainan}
                onChange={setKelainan}
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
            {kelainan === "MB" && (
              <>
                <BarisForm
                  label="Stand angkat meter lama"
                  htmlFor="koreksi-angkat-lama"
                >
                  <Input
                    id="koreksi-angkat-lama"
                    type="number"
                    density="compact"
                    min={0}
                    value={standAngkatLama}
                    onChange={(e) => setStandAngkatLama(e.target.value)}
                  />
                </BarisForm>
                <BarisForm
                  label="Stand meter baru"
                  htmlFor="koreksi-meter-baru"
                >
                  <Input
                    id="koreksi-meter-baru"
                    type="number"
                    density="compact"
                    min={0}
                    value={standMeterBaru}
                    onChange={(e) => setStandMeterBaru(e.target.value)}
                  />
                </BarisForm>
              </>
            )}
          </div>
          <p className="text-copy-13 text-muted-foreground">
            Pemakaian hasil koreksi:{" "}
            <span className="font-medium text-foreground">
              {angka(pakai)}
            </span>
          </p>
          {!bolehAturTagihan && (
            <p className="text-copy-13 text-muted-foreground">
              Nilai Tagihan hanya dapat ditetapkan oleh V3.
            </p>
          )}
        </section>
      </div>
    </KerangkaDrawer>
  );
}
