"use client";

import * as React from "react";
import { RefreshCw, Wrench, CheckCircle2, Clock, XCircle, Search, Gauge } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer } from "@/components/layout/page/PageContainer";
import { useRbac } from "@/components/layout/shell/RbacContext";
import { cn } from "@/lib/utils";

type AlasanMutasi =
  | "RUSAK"
  | "MATI"
  | "BURAM"
  | "HILANG"
  | "TERA_ULANG"
  | "UKURAN_BERUBAH"
  | "LAINNYA";

type StatusMutasi = "PENDING" | "APPROVED" | "REJECTED";

interface MutasiMeter {
  id: string;
  nolg: string;
  namaPelanggan: string;
  alamatPelanggan: string;
  noMeterAktif: string | null;
  periode: number;
  alasan: AlasanMutasi;
  keterangan: string | null;
  noMeterLama: string;
  standAngkat: number;
  noMeterBaru: string;
  merkBaru: string | null;
  ukuranBaru: string | null;
  standPasang: number;
  statusVerifikasi: StatusMutasi;
  catatanVerifikasi: string | null;
  standLaluLaporan: string | null;
  standAkhirLaporan: string | null;
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: { message?: string };
}

const LABEL_ALASAN: Record<AlasanMutasi, string> = {
  RUSAK: "Meter Rusak",
  MATI: "Meter Mati",
  BURAM: "Kaca Meter Buram",
  HILANG: "Meter Hilang",
  TERA_ULANG: "Tera Ulang",
  UKURAN_BERUBAH: "Perubahan Ukuran",
  LAINNYA: "Lainnya",
};

async function request<T>(
  path: string,
  method: "GET" | "POST",
  body?: unknown,
): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  let envelope: Envelope<T>;
  try {
    envelope = await response.json();
  } catch {
    throw new Error("Respons server tidak dapat dibaca.");
  }

  if (!response.ok || !envelope.success || envelope.data === undefined) {
    throw new Error(envelope.error?.message ?? "Permintaan gagal diproses.");
  }

  return envelope.data;
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label className="text-label-13 text-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function GantiMeterPage() {
  const { hasAnyRole } = useRbac();
  const bolehVerifikasi = hasAnyRole(["SUPERADMIN", "VERIFIKATOR_1", "VERIFIKATOR_2", "VERIFIKATOR_3"]);
  const [statusFilter, setStatusFilter] = React.useState<StatusMutasi | "ALL">(
    "ALL",
  );
  const [mutasi, setMutasi] = React.useState<MutasiMeter[]>([]);
  const [pembacaanBaru, setPembacaanBaru] = React.useState<
    Record<string, string>
  >({});
  const [memuat, setMemuat] = React.useState(true);
  const [menyimpan, setMenyimpan] = React.useState(false);
  const [aksiId, setAksiId] = React.useState<string | null>(null);

  const [nolg, setNolg] = React.useState("");
  const [periode, setPeriode] = React.useState("202601");
  const [alasan, setAlasan] = React.useState<AlasanMutasi>("RUSAK");
  const [noMeterLama, setNoMeterLama] = React.useState("");
  const [standAngkat, setStandAngkat] = React.useState("");
  const [noMeterBaru, setNoMeterBaru] = React.useState("");
  const [standPasang, setStandPasang] = React.useState("0");
  const [merkBaru, setMerkBaru] = React.useState("ITRON");
  const [ukuranBaru, setUkuranBaru] = React.useState('1/2"');
  const [petugasPasang, setPetugasPasang] = React.useState("");
  const [keterangan, setKeterangan] = React.useState("");

  const muatMutasi = React.useCallback(async (filter = statusFilter) => {
    setMemuat(true);
    try {
      const query = filter === "ALL" ? "" : `?status=${filter}`;
      const rows = await request<MutasiMeter[]>(
        `/api/cater/gwm/mutasi${query}`,
        "GET",
      );
      setMutasi(rows);
      setPembacaanBaru((current) => {
        const next = { ...current };
        for (const row of rows) {
          if (next[row.id] === undefined && row.standAkhirLaporan != null) {
            next[row.id] = String(row.standAkhirLaporan);
          }
        }
        return next;
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal memuat data mutasi meter.",
      );
    } finally {
      setMemuat(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    void muatMutasi();
  }, [muatMutasi]);

  async function catatMutasi(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMenyimpan(true);
    try {
      await request("/api/cater/gwm/mutasi", "POST", {
        nolg: nolg.trim(),
        periode: Number(periode),
        alasan,
        noMeterLama: noMeterLama.trim(),
        standAngkat: Number(standAngkat),
        noMeterBaru: noMeterBaru.trim(),
        standPasang: Number(standPasang),
        ...(merkBaru.trim() && { merkBaru: merkBaru.trim() }),
        ...(ukuranBaru.trim() && { ukuranBaru: ukuranBaru.trim() }),
        ...(petugasPasang.trim() && { petugasPasang: petugasPasang.trim() }),
        ...(keterangan.trim() && { keterangan: keterangan.trim() }),
      });
      toast.success("Berita acara ganti meter berhasil dicatat.");
      setNolg("");
      setPeriode("202601");
      setAlasan("RUSAK");
      setNoMeterLama("");
      setStandAngkat("");
      setNoMeterBaru("");
      setStandPasang("0");
      setMerkBaru("ITRON");
      setUkuranBaru('1/2"');
      setPetugasPasang("");
      setKeterangan("");
      await muatMutasi();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mencatat ganti meter.",
      );
    } finally {
      setMenyimpan(false);
    }
  }

  async function verifikasi(
    row: MutasiMeter,
    action: "APPROVE" | "REJECT",
  ) {
    const reading = pembacaanBaru[row.id];
    if (action === "APPROVE" && (!reading || !Number.isInteger(Number(reading)))) {
      toast.error("Stand baca meter baru harus diisi dengan angka bulat.");
      return;
    }
    if (
      action === "REJECT" &&
      !window.confirm(`Tolak pengajuan ganti meter pelanggan ${row.nolg}?`)
    ) {
      return;
    }

    setAksiId(row.id);
    try {
      await request("/api/cater/gwm/mutasi/verify", "POST", {
        mutasiId: row.id,
        action,
        ...(action === "APPROVE" && { standBacaBaru: Number(reading) }),
        ...(action === "REJECT" && { catatan: "Ditolak melalui konsol verifikasi Ganti Meter." }),
      });
      toast.success(
        action === "APPROVE"
          ? "Penggantian meter disetujui dan ditautkan ke laporan penagihan."
          : "Pengajuan ganti meter ditolak.",
      );
      await muatMutasi();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal memproses verifikasi ganti meter.",
      );
    } finally {
      setAksiId(null);
    }
  }

  return (
    <PageContainer className="space-y-6">
      {/* Header Halaman */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-heading-20 text-foreground">
            Penggantian Water Meter (GWM)
          </h1>
          <p className="mt-1 text-copy-13 text-muted-foreground">
            Pencatatan Berita Acara pergantian meter fisik, stand angkat meter lama, dan penautan ke penagihan resmi.
          </p>
        </div>

        {/* Ringkasan Cepat */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-label-12 text-muted-foreground">
            <Gauge className="size-3.5 text-muted-foreground" />
            Total Mutasi: <strong className="font-mono tabular-nums text-foreground">{mutasi.length}</strong>
          </span>
        </div>
      </header>

      {/* Formulir Input Berita Acara Ganti Meter */}
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="pb-3 border-b border-border">
          <h2 className="text-heading-16 text-foreground">
            Input Berita Acara Ganti Meter
          </h2>
          <p className="mt-0.5 text-copy-12 text-muted-foreground">
            Masukkan data sambungan pelanggan dan rincian fisik meter air baru yang terpasang.
          </p>
        </div>

        <form
          className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(event) => void catatMutasi(event)}
        >
          <Field label="No. Langganan (NOLG)">
            <Input
              required
              value={nolg}
              onChange={(event) => setNolg(event.target.value)}
              placeholder="Contoh: 00801100260"
            />
          </Field>

          <Field label="Periode Tagihan (YYYYMM)">
            <Input
              required
              type="number"
              min={200001}
              max={209912}
              step={1}
              value={periode}
              onChange={(event) => setPeriode(event.target.value)}
              placeholder="202601"
              className="font-mono"
            />
          </Field>

          <Field label="Alasan Penggantian">
            <Select
              value={alasan}
              onValueChange={(value) => setAlasan(value as AlasanMutasi)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LABEL_ALASAN).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Nomor Seri Meter Lama">
            <Input
              required
              value={noMeterLama}
              onChange={(event) => setNoMeterLama(event.target.value)}
              placeholder="Nomor seri meter dicabut"
            />
          </Field>

          <Field label="Stand Angkat (Meter Lama)">
            <Input
              required
              type="number"
              min={0}
              step={1}
              value={standAngkat}
              onChange={(event) => setStandAngkat(event.target.value)}
              placeholder="Angka akhir meter dicabut"
              className="font-mono"
            />
          </Field>

          <Field label="Nomor Seri Meter Baru">
            <Input
              required
              value={noMeterBaru}
              onChange={(event) => setNoMeterBaru(event.target.value)}
              placeholder="Nomor seri meter baru"
            />
          </Field>

          <Field label="Stand Pasang (Meter Baru)">
            <Input
              required
              type="number"
              min={0}
              step={1}
              value={standPasang}
              onChange={(event) => setStandPasang(event.target.value)}
              placeholder="Stand awal (biasanya 0)"
              className="font-mono"
            />
          </Field>

          <Field label="Merk Meter Baru">
            <Select
              value={merkBaru}
              onValueChange={(value) => setMerkBaru(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ITRON">ITRON</SelectItem>
                <SelectItem value="LINDA">LINDA</SelectItem>
                <SelectItem value="ACTARIS">ACTARIS</SelectItem>
                <SelectItem value="B-METER">B-METER</SelectItem>
                <SelectItem value="NINGBO">NINGBO</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Ukuran Pipa Meter">
            <Select
              value={ukuranBaru}
              onValueChange={(value) => setUkuranBaru(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='1/2"'>1/2 Inci (Standar Rumah Tangga)</SelectItem>
                <SelectItem value='3/4"'>3/4 Inci (Niaga / Rumah Besar)</SelectItem>
                <SelectItem value='1"'>1 Inci (Industri / Hotel)</SelectItem>
                <SelectItem value='1.5"'>1.5 Inci</SelectItem>
                <SelectItem value='2"'>2 Inci</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Petugas Teknisi Pemasang" className="sm:col-span-2 lg:col-span-1">
            <Input
              value={petugasPasang}
              onChange={(event) => setPetugasPasang(event.target.value)}
              placeholder="Nama teknisi lapangan"
            />
          </Field>

          <Field label="Keterangan & Nomor Berita Acara" className="sm:col-span-2 lg:col-span-2">
            <Input
              value={keterangan}
              onChange={(event) => setKeterangan(event.target.value)}
              placeholder="Contoh: BA-GWM/01/2026/0142 - Kaca meter buram & berlumut"
            />
          </Field>

          <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-2">
            <Button
              type="submit"
              size="md"
              disabled={menyimpan}
            >
              {menyimpan ? "Menyimpan Berita Acara..." : "Simpan Berita Acara GWM"}
            </Button>
          </div>
        </form>
      </section>

      {/* Daftar Berita Acara & Verifikasi Mutasi Meter */}
      <section className="rounded-lg border border-border bg-card p-5">
        {/* Toolbar Filter Berita Acara */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div>
            <h2 className="text-heading-16 text-foreground">
              Daftar Riwayat Ganti Water Meter
            </h2>
            <p className="mt-0.5 text-copy-12 text-muted-foreground">
              Verifikasi stand angkat meter lama untuk perhitungan rekening akurat tanpa lonjakan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as StatusMutasi | "ALL")
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="PENDING">Menunggu Verifikasi</SelectItem>
                <SelectItem value="APPROVED">Telah Disetujui</SelectItem>
                <SelectItem value="REJECTED">Ditolak</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              aria-label="Muat ulang daftar mutasi"
              onClick={() => void muatMutasi()}
              disabled={memuat}
            >
              <RefreshCw className={cn("size-3.5", memuat ? "animate-spin" : "")} />
            </Button>
          </div>
        </div>

        {/* List Berita Acara */}
        <div className="mt-4 flex flex-col gap-3">
          {memuat ? (
            <div className="py-12 text-center text-copy-13 text-muted-foreground">
              <RefreshCw className="size-5 mx-auto animate-spin mb-2 opacity-50" />
              Memuat data mutasi meter...
            </div>
          ) : mutasi.length === 0 ? (
            <div className="py-12 text-center text-copy-13 text-muted-foreground">
              Tidak ada data berita acara ganti meter untuk filter ini.
            </div>
          ) : (
            mutasi.map((row) => {
              const laporanAda = row.standLaluLaporan != null;

              return (
                <article
                  key={row.id}
                  className="rounded-lg border border-border p-4 bg-card hover:border-(--ds-gray-500) transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-label-14 font-semibold text-foreground">
                          {row.namaPelanggan}
                        </h3>
                        <span className="font-mono text-label-12 px-2 py-0.5 rounded-md bg-(--ds-gray-100) border border-border">
                          NOLG: {row.nolg}
                        </span>
                      </div>
                      <p className="mt-1 text-copy-12 text-muted-foreground">
                        Periode {row.periode} • Alasan: <strong className="text-foreground">{LABEL_ALASAN[row.alasan] ?? row.alasan}</strong>
                      </p>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-11",
                        row.statusVerifikasi === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                          : row.statusVerifikasi === "REJECTED"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                      )}
                    >
                      {row.statusVerifikasi === "APPROVED" && <CheckCircle2 className="size-3" />}
                      {row.statusVerifikasi === "REJECTED" && <XCircle className="size-3" />}
                      {row.statusVerifikasi === "PENDING" && <Clock className="size-3" />}
                      {row.statusVerifikasi === "PENDING"
                        ? "Menunggu Verifikasi"
                        : row.statusVerifikasi === "APPROVED"
                        ? "Disetujui"
                        : "Ditolak"}
                    </span>
                  </div>

                  {/* Grid Rincian Meter */}
                  <dl className="mt-3.5 grid gap-x-5 gap-y-2 text-copy-12 sm:grid-cols-2 lg:grid-cols-4 pt-3 border-t border-border">
                    <div>
                      <dt className="text-muted-foreground">Meter Lama Dicabut</dt>
                      <dd className="font-medium text-foreground mt-0.5">
                        No: <span className="font-mono font-semibold">{row.noMeterLama}</span>
                        <div className="text-label-11 text-muted-foreground">
                          Stand Angkat: <strong className="text-foreground font-mono tabular-nums">{row.standAngkat.toLocaleString("id-ID")} m³</strong>
                        </div>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-muted-foreground">Meter Baru Terpasang</dt>
                      <dd className="font-medium text-foreground mt-0.5">
                        No: <span className="font-mono font-semibold">{row.noMeterBaru}</span> ({row.merkBaru ?? "ITRON"})
                        <div className="text-label-11 text-muted-foreground">
                          Stand Pasang: <strong className="text-foreground font-mono tabular-nums">{row.standPasang.toLocaleString("id-ID")} m³</strong>
                        </div>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-muted-foreground">Alamat Sambungan</dt>
                      <dd className="line-clamp-2 font-medium text-foreground mt-0.5">
                        {row.alamatPelanggan}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-muted-foreground">Laporan Baca Meter Periode Ini</dt>
                      <dd className="font-medium text-foreground mt-0.5">
                        {laporanAda ? (
                          <span>
                            Stand Lalu: <strong className="font-mono tabular-nums">{Number(row.standLaluLaporan).toLocaleString("id-ID")}</strong> • Baca: <strong className="font-mono tabular-nums">{Number(row.standAkhirLaporan).toLocaleString("id-ID")}</strong>
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Belum tersedia di laporan</span>
                        )}
                      </dd>
                    </div>
                  </dl>

                  {row.keterangan && (
                    <div className="mt-2.5 text-copy-12 text-muted-foreground bg-(--ds-gray-100) p-2.5 rounded-md border border-border">
                      <span className="font-medium text-foreground">Catatan BA:</span> {row.keterangan}
                    </div>
                  )}

                  {row.catatanVerifikasi && (
                    <div className="mt-2 text-copy-12 text-muted-foreground bg-(--ds-gray-100) p-2.5 rounded-md border border-border">
                      <span className="font-medium text-foreground">Catatan Verifikator:</span> {row.catatanVerifikasi}
                    </div>
                  )}

                  {/* Form Aksi Verifikasi: Ukuran Input dan Tombol Tepat Seragam (h-9 / 36px) */}
                  {row.statusVerifikasi === "PENDING" && bolehVerifikasi && (
                    <div className="mt-3.5 flex flex-wrap items-end gap-3 border-t border-border pt-3">
                      <Field label="Stand Bacaan Meter Baru">
                        <Input
                          required
                          type="number"
                          min={0}
                          step={1}
                          className="w-44 font-mono"
                          value={pembacaanBaru[row.id] ?? ""}
                          onChange={(event) =>
                            setPembacaanBaru((current) => ({
                              ...current,
                              [row.id]: event.target.value,
                            }))
                          }
                          placeholder="Contoh: 15"
                        />
                      </Field>

                      <Button
                        type="button"
                        size="md"
                        disabled={
                          !pembacaanBaru[row.id] ||
                          aksiId === row.id
                        }
                        onClick={() => void verifikasi(row, "APPROVE")}
                      >
                        Setujui & Tautkan
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        disabled={aksiId === row.id}
                        onClick={() => void verifikasi(row, "REJECT")}
                      >
                        Tolak
                      </Button>

                      {!laporanAda && (
                        <p className="basis-full text-copy-12 text-amber-600 dark:text-amber-400">
                          * Petunjuk: Pembacaan meter periode ini belum tercatat oleh petugas, tetapi Anda tetap dapat menyetujui jika angka meter baru sudah diketahui.
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
    </PageContainer>
  );
}
